import nodemailer from "nodemailer";
import { BRANCHES, BranchId, SERVICES, ServiceId } from "@/lib/booking-labels";
import { doctorByName, isBlocked } from "@/lib/doctors";
import { getDoctors } from "@/lib/doctors-server";
import { isLive, offerIn } from "@/lib/offers";
import { getOffers } from "@/lib/offers-server";
import { bookableDays, formatDay, formatTime, isBookable } from "@/lib/slots";
import { normalizePhone, toAsciiDigits } from "@/lib/wheel";
import { clientIp, tooMany, withinLimit } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase";
import { kizenTaken } from "@/lib/kizen";

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
  doctor_id: string | null;
  // Booked from an offer (only sent once supabase/011_offers.sql has run, since live offers need its table).
  offer_id?: number;
  offer?: string;
}

// Returns false when email isn't configured or sending fails.
async function sendEmail({ name, phone, email, service, branch, appointment_date, appointment_time, doctor, offer }: NewBooking) {
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
      : appointment_date
        ? `${formatDay(appointment_date, "ar", { year: "numeric" })} — الوقت: يُتواصل مع المراجع لتحديده`
        : offer
          ? "يُتواصل مع المراجع لتحديده (حجز عرض)"
          : "لم يُحدد";
  const dashboard = process.env.SITE_URL ? `${process.env.SITE_URL}/admin` : null;

  try {
    await transporter.sendMail({
      from: SMTP_FROM || SMTP_USER,
      to,
      replyTo: email || undefined,
      subject: `حجز جديد${offer ? " (عرض)" : ""}: ${serviceLabel} - ${branchLabel} - ${name}`,
      text: `الاسم: ${name}\nالجوال: ${phone}${email ? `\nالبريد: ${email}` : ""}\nالتخصص: ${serviceLabel}\nالفرع: ${branchLabel}\nالموعد المطلوب: ${when}${doctor ? `\nالطبيب: ${doctor}` : ""}${offer ? `\nالعرض: ${offer}` : ""}${dashboard ?`\n\nلوحة الحجوزات: ${dashboard}` : ""}`,
      html: `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8">
<h2>طلب حجز جديد</h2>
<p><b>الاسم:</b> ${escapeHtml(name)}</p>
<p><b>الجوال:</b> <span dir="ltr">${escapeHtml(phone)}</span></p>
${email ? `<p><b>البريد:</b> ${escapeHtml(email)}</p>` : ""}
<p><b>التخصص:</b> ${serviceLabel}</p>
<p><b>الفرع:</b> ${branchLabel}</p>
<p><b>الموعد المطلوب:</b> ${when}</p>
${doctor ? `<p><b>الطبيب:</b> ${escapeHtml(doctor)}</p>` : ""}
${offer ? `<p><b>العرض:</b> ${escapeHtml(offer)}</p>` : ""}
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
  // Generous for a family or a clinic sharing one connection; stops a script filling every slot.
  if (!(await withinLimit(`booking:ip:${clientIp(request.headers)}`, 15, 3600))) return tooMany();

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? toAsciiDigits(body.phone).trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  // Own keys only: `"toString" in SERVICES` is true too.
  const service = typeof body.service === "string" && Object.hasOwn(SERVICES, body.service) ? (body.service as ServiceId) : null;
  const branch = typeof body.branch === "string" && Object.hasOwn(BRANCHES, body.branch) ? (body.branch as BranchId) : null;
  // An offer that has ended, been hidden, or is not at the chosen branch is dropped; the booking still goes through.
  const offer =
    typeof body.offerId === "number" && branch
      ? ((await getOffers()).find((o) => o.id === body.offerId && isLive(o) && offerIn(o, branch)) ?? null)
      : null;
  // Offer bookings are kept apart from the doctors' (user's choice 2026-10-29): no doctor, day or time, so they never
  // take a slot — the clinic calls the patient. Also for an older form or app that still sends them.
  const date = !offer && typeof body.date === "string" ? body.date : null;
  const time = !offer && typeof body.time === "string" ? body.time : null;
  let doctor = !offer && typeof body.doctor === "string" && body.doctor.trim() ? body.doctor.trim().slice(0, 100) : null;
  // Newer clients send the id; older app versions only the display name. Hidden doctors are not bookable. If the
  // doctors can't be read, the booking still goes through, without a doctor.
  const doctors = await getDoctors().catch((err) => {
    console.error(err);
    return [];
  });
  let picked = offer ? null : (doctors.find((d) => d.id === body.doctorId) ?? doctorByName(doctors, doctor));
  // A doctor who does not work in the chosen branch/department is dropped rather than booked there.
  if (picked && (picked.branch !== body.branch || picked.service !== body.service)) picked = null;
  // A name that matches no bookable doctor (hidden since the form loaded…) is not kept: it would be booked without
  // that doctor's shifts or slot.
  if (!picked) doctor = null;
  const doctorId = picked?.id ?? null;

  const valid =
    name.length >= 2 &&
    name.length <= 100 &&
    /^[+\d][\d -]{6,19}$/.test(phone) &&
    // Optional: stored as "" without one (the column is not null).
    (email === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) &&
    email.length <= 200 &&
    service !== null &&
    branch !== null &&
    // A slot is optional (older app versions). A time needs a date; a date alone is the preferred day of a booking
    // without a doctor (the clinic calls to set the time — user's choice 2026-10-29).
    (time === null || date !== null) &&
    (date === null || /^\d{4}-\d{2}-\d{2}$/.test(date)) &&
    (time === null || /^\d{2}:\d{2}$/.test(time));
  if (!valid) return Response.json({ ok: false, error: "invalid" }, { status: 400 });
  if (!(await withinLimit(`booking:phone:${normalizePhone(phone)}`, 5, 86_400))) return tooMany();
  // A real open slot (within the doctor's shifts, when there is one). One that passed while the form was open is
  // "taken", so the form asks for another time. A preferred day alone must still be an open day (not a Friday).
  if (date && time && !isBookable(date, time, new Date(), picked)) {
    return Response.json({ ok: false, error: "unavailable" }, { status: 409 });
  }
  if (date && !time && !bookableDays(new Date(), picked).includes(date)) {
    return Response.json({ ok: false, error: "unavailable" }, { status: 409 });
  }

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
  if (offer) {
    booking.offer_id = offer.id;
    booking.offer = offer.titleAr;
  }

  // The mobile app's HTTP stack identifies itself differently from browsers.
  const userAgent = request.headers.get("user-agent") ?? "";
  const source = /okhttp|CFNetwork|Darwin/i.test(userAgent) ? "app" : "web";

  // Save first so the booking reaches the dashboard even if email is down; email is the notification.
  let saved: { id: number; public_token: string } | null = null;
  const db = createServiceClient();
  if (db) {
    // The admin may have closed this day or slot for the doctor, the branch or everyone (also when no doctor was
    // picked) since the form loaded.
    if (date && time) {
      const { data: blocks, error } = await db
        .from("doctor_blocks")
        .select("doctor, date, start_time")
        .in("doctor", [...(picked ? [picked.id] : []), "all", `all-${branch}`])
        .eq("date", date);
      if (error) {
        console.error("Block lookup failed:", error);
        return Response.json({ ok: false, error: "server" }, { status: 500 });
      }
      const closed = blocks.map((b) => ({ doctor: b.doctor, date: b.date, start: b.start_time?.slice(0, 5) ?? null }));
      const blocked = picked
        ? isBlocked(closed, picked, date, time)
        : closed.some((b) => b.start === null || b.start === time);
      if (blocked) return Response.json({ ok: false, error: "unavailable" }, { status: 409 });
      // Already taken in Kizen (booked by phone or at the desk) since the form loaded.
      if (picked && (await kizenTaken(db, picked).catch(() => new Set<string>())).has(`${date} ${time}`)) {
        return Response.json({ ok: false, error: "unavailable" }, { status: 409 });
      }
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
