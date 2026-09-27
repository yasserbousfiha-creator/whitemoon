import nodemailer from "nodemailer";
import { BRANCHES, BranchId, SERVICES, ServiceId } from "@/lib/booking-labels";
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
}

// Returns false when email isn't configured or sending fails.
async function sendEmail({ name, phone, email, service, branch }: NewBooking) {
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
  const dashboard = process.env.SITE_URL ? `${process.env.SITE_URL}/admin` : null;

  try {
    await transporter.sendMail({
      from: SMTP_FROM || SMTP_USER,
      to,
      replyTo: email,
      subject: `حجز جديد: ${serviceLabel} - ${branchLabel} - ${name}`,
      text: `الاسم: ${name}\nالجوال: ${phone}\nالبريد: ${email}\nالتخصص: ${serviceLabel}\nالفرع: ${branchLabel}${dashboard ? `\n\nلوحة الحجوزات: ${dashboard}` : ""}`,
      html: `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8">
<h2>طلب حجز جديد</h2>
<p><b>الاسم:</b> ${escapeHtml(name)}</p>
<p><b>الجوال:</b> <span dir="ltr">${escapeHtml(phone)}</span></p>
<p><b>البريد:</b> ${escapeHtml(email)}</p>
<p><b>التخصص:</b> ${serviceLabel}</p>
<p><b>الفرع:</b> ${branchLabel}</p>
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
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const service = body.service as ServiceId;
  const branch = body.branch as BranchId;

  const valid =
    name.length >= 2 &&
    name.length <= 100 &&
    /^[+\d][\d\s-]{6,19}$/.test(phone) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    email.length <= 200 &&
    service in SERVICES &&
    branch in BRANCHES;
  if (!valid) return Response.json({ ok: false, error: "invalid" }, { status: 400 });

  const booking: NewBooking = { name, phone, email, service, branch };

  // The mobile app's HTTP stack identifies itself differently from browsers.
  const userAgent = request.headers.get("user-agent") ?? "";
  const source = /okhttp|CFNetwork|Darwin/i.test(userAgent) ? "app" : "web";

  // Save first so the booking reaches the dashboard even if email is down; email is the notification.
  let saved = false;
  const db = createServiceClient();
  if (db) {
    const { error } = await db.from("bookings").insert({ ...booking, source });
    if (error) console.error("Booking insert failed:", error);
    else saved = true;
  }

  const emailed = await sendEmail(booking);
  if (!saved && !emailed) return Response.json({ ok: false, error: "server" }, { status: 500 });
  return Response.json({ ok: true });
}
