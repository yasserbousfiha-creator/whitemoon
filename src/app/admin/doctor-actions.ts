"use server";

import { revalidatePath, updateTag } from "next/cache";
import { BRANCHES, SERVICES } from "@/lib/booking-labels";
import { DOCTOR_ID_PATTERN, cleanHours, type WeeklyHours } from "@/lib/doctors";
import { DOCTORS_TAG } from "@/lib/doctors-server";
import { createServiceClient } from "@/lib/supabase";
import type { UpdateResult } from "./actions";
import { PHOTO_BUCKET, bucketPath, isOwnPhoto, requireTab } from "./manager";

const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
const MAX_CASES = 40;
// Where uploads go in the bucket: the doctor's photo at the top, case photos and offer designs in their folders.
const UPLOAD_FOLDERS: Record<string, string> = { photo: "", cases: "cases/", offers: "offers/" };

// The site's pages are prerendered with the doctors: expire them so the next visit shows the change.
function publish() {
  updateTag(DOCTORS_TAG);
  revalidatePath("/", "layout");
}

const failed = (what: string, error: { code?: string; message: string }): UpdateResult => {
  console.error(`${what} failed:`, error);
  if (error.code === "42P01" || error.code === "PGRST205") {
    return { ok: false, error: "جدول الأطباء غير موجود بعد: شغّل ملف 009_doctors.sql في Supabase." };
  }
  if (error.code === "PGRST204" && /bio_/.test(error.message)) {
    return { ok: false, error: "حقل النبذة يحتاج تشغيل ملف 010_doctor_bios.sql في Supabase." };
  }
  return { ok: false, error: `تعذّر الحفظ (${error.code ?? error.message}).` };
};

export interface DoctorInput {
  id: string | null; // null = a new doctor
  nameAr: string;
  nameEn: string;
  roleAr: string;
  roleEn: string;
  bioAr: string;
  bioEn: string;
  branch: string;
  service: string;
  hours: WeeklyHours;
  photo: string | null;
  cases: string[]; // before/after photos, in display order
  active: boolean;
}

// "Dr. Ahmed Al-Thubaiti" → "ahmed-al-thubaiti"; the id never changes after creation, since bookings refer to it.
function slugFrom(nameEn: string) {
  return nameEn
    .toLowerCase()
    .replace(/^dr\.?\s+/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export async function saveDoctor(input: DoctorInput): Promise<UpdateResult> {
  const who = await requireTab("doctors");
  if ("error" in who) return { ok: false, error: who.error };

  const nameAr = input.nameAr?.trim() ?? "";
  const nameEn = input.nameEn?.trim() ?? "";
  const roleAr = input.roleAr?.trim().slice(0, 150) ?? "";
  const roleEn = input.roleEn?.trim().slice(0, 150) ?? "";
  const bioAr = input.bioAr?.trim().slice(0, 1500) ?? "";
  const bioEn = input.bioEn?.trim().slice(0, 1500) ?? "";
  if (nameAr.length < 2 || nameAr.length > 100) return { ok: false, error: "اكتب اسم الطبيب بالعربي." };
  if (nameEn.length < 2 || nameEn.length > 100 || !/[a-z]/i.test(nameEn)) {
    return { ok: false, error: "اكتب اسم الطبيب بالإنجليزي (بحروف إنجليزية)." };
  }
  if (!(input.branch in BRANCHES)) return { ok: false, error: "اختر الفرع." };
  if (!(input.service in SERVICES)) return { ok: false, error: "اختر القسم." };
  const hours = cleanHours(input.hours);
  if (!hours) return { ok: false, error: "أوقات الدوام غير صحيحة: تأكد أن بداية كل فترة قبل نهايتها." };
  if (Object.keys(hours).length === 0) return { ok: false, error: "حدّد يوم دوام واحداً على الأقل." };
  if (input.photo && !isOwnPhoto(input.photo)) return { ok: false, error: "صورة الطبيب غير صالحة: ارفعها من هنا." };
  const photo = input.photo || null;
  if (!Array.isArray(input.cases) || !input.cases.every(isOwnPhoto)) return { ok: false, error: "صور الحالات غير صالحة." };
  const cases = [...new Set(input.cases)];
  if (cases.length > MAX_CASES) return { ok: false, error: `الحد الأقصى ${MAX_CASES} صورة حالة لكل طبيب.` };

  const db = createServiceClient();
  if (!db) return { ok: false, error: "الخادم غير مهيأ." };

  const row = {
    name_ar: nameAr,
    name_en: nameEn,
    role_ar: roleAr,
    role_en: roleEn,
    bio_ar: bioAr,
    bio_en: bioEn,
    branch: input.branch,
    service: input.service,
    hours,
    cases,
    active: Boolean(input.active),
    updated_at: new Date().toISOString(),
    updated_by: who.userId,
  };

  if (input.id) {
    if (!DOCTOR_ID_PATTERN.test(input.id)) return { ok: false, error: "طلب غير صالح." };
    const { data: current, error: readError } = await db
      .from("doctors")
      .select("photo, cases")
      .eq("id", input.id)
      .maybeSingle();
    if (readError) return failed("Doctor read", readError);
    if (!current) return { ok: false, error: "الطبيب غير موجود (ربما حُذف)." };
    // A new photo replaces both crops; the old portrait would otherwise keep showing in the doctors section.
    const photoChange = photo !== current.photo ? { photo, portrait: null } : {};
    const { error } = await db
      .from("doctors")
      .update({ ...row, ...photoChange })
      .eq("id", input.id);
    if (error) return failed("Doctor update", error);
    // Case photos removed in the editor are deleted from the bucket once the save went through.
    await removePhotos(db, ((current.cases as string[] | null) ?? []).filter((url) => !cases.includes(url)));
  } else {
    const base = slugFrom(nameEn) || "doctor";
    // Ids "all" and "all-<branch>" mean "every doctor" in schedule blocks.
    const safeBase = base === "all" || base.startsWith("all-") ? `dr-${base}` : base;
    const { data: taken } = await db.from("doctors").select("id").like("id", `${safeBase}%`);
    const used = new Set((taken ?? []).map((r) => r.id as string));
    let id = safeBase;
    for (let n = 2; used.has(id); n++) id = `${safeBase}-${n}`;
    const { data: last } = await db
      .from("doctors")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { error } = await db
      .from("doctors")
      .insert({ ...row, id, photo, sort_order: (last?.sort_order ?? 0) + 10 });
    if (error) return failed("Doctor insert", error);
  }

  publish();
  return { ok: true };
}

// Removes the doctor for good. Past bookings keep the doctor's name; hiding (active = false) is the reversible option.
export async function deleteDoctor(id: string): Promise<UpdateResult> {
  const who = await requireTab("doctors");
  if ("error" in who) return { ok: false, error: who.error };
  if (!DOCTOR_ID_PATTERN.test(id)) return { ok: false, error: "طلب غير صالح." };
  const db = createServiceClient();
  if (!db) return { ok: false, error: "الخادم غير مهيأ." };

  const { data: removed, error } = await db
    .from("doctors")
    .delete()
    .eq("id", id)
    .select("photo, cases")
    .maybeSingle();
  if (error) return failed("Doctor delete", error);
  if (removed) await removePhotos(db, [removed.photo, ...((removed.cases as string[] | null) ?? [])]);
  await db.from("doctor_blocks").delete().eq("doctor", id);
  publish();
  return { ok: true };
}

// Moves a doctor one place up or down within their department, by swapping display order with the neighbour.
export async function moveDoctor(id: string, direction: -1 | 1): Promise<UpdateResult> {
  const who = await requireTab("doctors");
  if ("error" in who) return { ok: false, error: who.error };
  if (!DOCTOR_ID_PATTERN.test(id)) return { ok: false, error: "طلب غير صالح." };
  const db = createServiceClient();
  if (!db) return { ok: false, error: "الخادم غير مهيأ." };

  const { data: me } = await db.from("doctors").select("id, service, sort_order").eq("id", id).maybeSingle();
  if (!me) return { ok: false, error: "الطبيب غير موجود." };
  const sameDepartment = db.from("doctors").select("id, sort_order").eq("service", me.service);
  const { data: next } = await (direction < 0
    ? sameDepartment.lt("sort_order", me.sort_order)
    : sameDepartment.gt("sort_order", me.sort_order)
  )
    .order("sort_order", { ascending: direction > 0 })
    .limit(1)
    .maybeSingle();
  if (!next) return { ok: true };
  const [a, b] = await Promise.all([
    db.from("doctors").update({ sort_order: next.sort_order }).eq("id", me.id),
    db.from("doctors").update({ sort_order: me.sort_order }).eq("id", next.id),
  ]);
  if (a.error || b.error) return failed("Doctor move", (a.error ?? b.error)!);
  publish();
  return { ok: true };
}

// Photos uploaded from /admin live in the bucket; the original ones ship with the site (/images/team) and stay.
async function removePhotos(db: NonNullable<ReturnType<typeof createServiceClient>>, urls: (string | null)[]) {
  const paths = urls.map(bucketPath).filter((p): p is string => !!p);
  if (paths.length === 0) return;
  const { error } = await db.storage.from(PHOTO_BUCKET).remove(paths);
  if (error) console.error("Photo removal failed:", error);
}

// Stores a photo (already resized in the browser) and returns its public URL: a doctor's photo or case photo for
// saveDoctor, or an offer's design for saveOffer (form field "folder").
export async function uploadDoctorPhoto(form: FormData): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const who = await requireTab("doctors", "offers");
  if ("error" in who) return { ok: false, error: who.error };
  const file = form.get("photo");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "اختر صورة." };
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return { ok: false, error: "الصورة يجب أن تكون JPG أو PNG." };
  if (file.size > MAX_PHOTO_BYTES) return { ok: false, error: "الصورة كبيرة جداً." };

  const db = createServiceClient();
  if (!db) return { ok: false, error: "الخادم غير مهيأ." };
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const folder = UPLOAD_FOLDERS[String(form.get("folder") ?? "photo")] ?? "";
  const path = `${folder}${crypto.randomUUID()}.${ext}`;
  const { error } = await db.storage
    .from(PHOTO_BUCKET)
    .upload(path, file, { contentType: file.type, cacheControl: "31536000" });
  if (error) {
    console.error("Doctor photo upload failed:", error);
    return {
      ok: false,
      error: /bucket/i.test(error.message)
        ? "مخزن الصور غير موجود بعد: شغّل ملف 009_doctors.sql في Supabase."
        : `تعذّر رفع الصورة (${error.message}).`,
    };
  }
  return { ok: true, url: db.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl };
}
