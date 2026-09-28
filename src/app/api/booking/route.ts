import nodemailer from "nodemailer";
import { BRANCHES, BranchId, SERVICES, ServiceId } from "@/lib/booking-labels";
import { type DoctorId, doctorIdFromName, isBlocked, isDoctorId } from "@/lib/doctors";
import { formatDay, formatTime, isBookable } from "@/lib/slots";
import { toAsciiDigits } from "@/lib/wheel";
import { createServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function recipientFor(service: ServiceId, branch: BranchId) {
  const key = `BOOKING_TO_${service.toUpperCase()}_${branch.toUpperCase()}`;
  return process.env[key] || process.env.BOOKING_TO_DEFAULT;
}

interface NewBooking {
  name: string;
  phone: string;
  email: string;
  service: ServiceId;
  branch: BranchId;
  // Requested slot; absent from app versions before 1.0.3.
  appointment_date: string | null;
  appointment_time: string | null;
  // Chosen when booking from a doctor's profile.
  doctor: string | null;
  doctor_id: DoctorId | null;
}

// Returns false when email isn't configured or sending fails.
async function sendEmail({ name, phone, email, service, branch, appointment_date, appointment_time, doctor }: NewBooking) {
  const to = recipientFor(service, branch);
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!to || !SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.error("Booking email is not configured (SMTP_* / BOOKING_TO_* env vars).");
    return false;
  }

  const port = Number(SMTP_PORT) || 465;
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const serviceLabel = SERVICES[service];
  const branchLabel = BRANCHES[branch];
  const when =
    appointment_date && appointment_time
      ? `${formatDay(appointment_date, "ar", { year: "numeric" })} - ${formatTime(appointment_time, "ar")}`
      : "لم يُحدد";
  const dashboard = process.env.SITE_URL ? `${process.env.SITE_URL}/admin` : null;

  try {
    await transporter.sendMail({
      from: SMTP_FROM || SMTP_USER,
      to,
      replyTo: email,
      subject: `حجز جديد: ${serviceLabel} - ${branchLabel} - ${name}`,
      text: `الاسم: ${name}\nالجوال: ${phone}\nالبريد: ${email}\nالتخصص: ${serviceLabel}\nالفرع: ${branchLabel}\nالموعد المطلوب: ${when}${doctor ? `\nالطبيب: ${doctor}` : ""}${dashboard ?`\n\nلوحة الحجوزات: ${dashboard}` : ""}`,
      html: `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8">
<h2>طلب حجز جديد</h2>
<p><b>الاسم:</b> ${escapeHtml(name)}</p>
<p><b>الجوال:</b> <span dir="ltr">${escapeHtml(phone)}</span></p>
<p><b>البريد:</b> ${escapeHtml(email)}</p>
<p><b>التخصص:</b> ${serviceLabel}</p>
<p><b>الفرع:</b> ${branchLabel}</p>
<p><b>الموعد المطلوب:</b> ${when}</p>
${doctor ? `<p><b>الطبيب:</b> ${escapeHtml(doctor)}</p>` : ""}
${dashboard ? `<p><a href="${dashboard}">فتح لوحة الحجوزات</a></p>` : ""}
</div>`,
    });
    return true;
  } catch (err) {
    console.error("Booking email failed:", err);
    return false;
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  if (typeof body.website === "string" && body.website !== "") {
    return Response.json({ ok: true });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? toAsciiDigits(body.phone).trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const service = body.service as ServiceId;
  const branch = body.branch as BranchId;
  const date = typeof body.date === "string" ? body.date : null;
  const time = typeof body.time === "string" ? body.time : null;
  const doctor = typeof body.doctor === "string" && body.doctor.trim() ? body.doctor.trim().slice(0, 100) : null;
  // Newer clients send the id; older app versions only the display name.
  const doctorId = isDoctorId(body.doctorId) ? body.doctorId : doctorIdFromName(doctor);

  const valid =
    name.length >= 2 &&
    name.length <= 100 &&
    /^[+\d][\d\s-]{6,19}$/.test(phone) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    email.length <= 200 &&
    service in SERVICES &&
    branch in BRANCHES &&
    // A slot is optional (older app versions), but when sent it must be a real open slot.
    // With a doctor, it must also fall within their shifts.
    (date === null && time === null ? true : date !== null && time !== null && isBookable(date, time, new Date(), doctorId));
  if (!valid) return Response.json({ ok: false, error: "invalid" }, { status: 400 });

  const booking: NewBooking = {
    name,
    phone,
    email,
    service,
    branch,
    appointment_date: date,
    appointment_time: time,
    doctor,
    doctor_id: doctorId,
  };

  // The mobile app's HTTP stack identifies itself differently from browsers.
  const userAgent = request.headers.get("user-agent") ?? "";
  const source = /okhttp|CFNetwork|Darwin/i.test(userAgent) ? "app" : "web";

  // Save first so the booking reaches the dashboard even if email is down; email is the notification.
  let saved: { id: number; public_token: string } | null = null;
  const db = createServiceClient();
  if (db) {
    // The admin may have closed this day or slot for the doctor since the form loaded.
    if (doctorId && date && time) {
      const { data: blocks } = await db
        .from("doctor_blocks")
        .select("doctor, date, start_time")
        .in("doctor", [doctorId, "all"])
        .eq("date", date);
      const closed = (blocks ?? []).map((b) => ({ doctor: b.doctor, date: b.date, start: b.start_time?.slice(0, 5) ?? null }));
      if (isBlocked(closed, doctorId, date, time)) return Response.json({ ok: false, error: "unavailable" }, { status: 409 });
    }
    const { data, error } = await db.from("bookings").insert({ ...booking, source }).select("id, public_token").single();
    // Unique index bookings_doctor_slot_idx: someone else just took this doctor's slot.
    if (error?.code === "23505") return Response.json({ ok: false, error: "unavailable" }, { status: 409 });
    if (error) console.error("Booking insert failed:", error);
    else saved = data;
  }

  const emailed = await sendEmail(booking);
  if (!saved && !emailed) return Response.json({ ok: false, error: "server" }, { status: 500 });
  // The token lets the patient's app read back this booking's status and notes (see ./status/route.ts).
  return Response.json({ ok: true, id: saved?.id ?? null, token: saved?.public_token ?? null });
}
