"use server";

import { revalidatePath, updateTag } from "next/cache";
import { BRANCHES, SERVICES, type BranchId } from "@/lib/booking-labels";
import { OFFERS_TAG } from "@/lib/offers-server";
import { createServiceClient } from "@/lib/supabase";
import type { UpdateResult } from "./actions";
import { PHOTO_BUCKET, bucketPath, isOwnPhoto, requireTab } from "./manager";

// The site's pages are prerendered with the offers: expire them so the next visit shows the change.
function publish() {
  updateTag(OFFERS_TAG);
  revalidatePath("/", "layout");
}

const failed = (what: string, error: { code?: string; message: string }): UpdateResult => {
  console.error(`${what} failed:`, error);
  if (error.code === "42P01" || error.code === "PGRST205") {
    return { ok: false, error: "جدول العروض غير موجود بعد: شغّل ملف 011_offers.sql في Supabase." };
  }
  return { ok: false, error: `تعذّر الحفظ (${error.code ?? error.message}).` };
};

async function removeImage(db: NonNullable<ReturnType<typeof createServiceClient>>, url: string | null) {
  const path = bucketPath(url);
  if (!path) return;
  const { error } = await db.storage.from(PHOTO_BUCKET).remove([path]);
  if (error) console.error("Offer image removal failed:", error);
}

export interface OfferInput {
  id: number | null; // null = a new offer
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  image: string | null;
  priceBefore: string; // as typed; empty = none
  priceAfter: string;
  branches: string[]; // empty = every branch
  service: string;
  endsOn: string; // "YYYY-MM-DD" or empty
  active: boolean;
}

// "1,200" / "١٢٠٠" → 1200; empty → null; anything else → NaN (rejected).
function price(value: string) {
  const v = (value ?? "").replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/[,\s]/g, "");
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n < 10_000_000 ? Math.round(n * 100) / 100 : NaN;
}

export async function saveOffer(input: OfferInput): Promise<UpdateResult> {
  const who = await requireTab("offers");
  if ("error" in who) return { ok: false, error: who.error };

  const titleAr = input.titleAr?.trim() ?? "";
  const titleEn = input.titleEn?.trim() ?? "";
  if (titleAr.length < 2 || titleAr.length > 120) return { ok: false, error: "اكتب عنوان العرض بالعربي." };
  if (titleEn.length > 120) return { ok: false, error: "العنوان الإنجليزي طويل جداً." };
  const descriptionAr = input.descriptionAr?.trim().slice(0, 1000) ?? "";
  const descriptionEn = input.descriptionEn?.trim().slice(0, 1000) ?? "";
  const priceBefore = price(input.priceBefore);
  const priceAfter = price(input.priceAfter);
  if (Number.isNaN(priceBefore) || Number.isNaN(priceAfter)) return { ok: false, error: "السعر غير صحيح: اكتب أرقاماً فقط." };
  if (priceBefore !== null && priceAfter !== null && priceAfter >= priceBefore) {
    return { ok: false, error: "السعر بعد العرض يجب أن يكون أقل من السعر قبله." };
  }
  if (!Array.isArray(input.branches) || !input.branches.every((b) => b in BRANCHES)) {
    return { ok: false, error: "اختر الفروع." };
  }
  const branches = [...new Set(input.branches)] as BranchId[];
  if (!(input.service in SERVICES)) return { ok: false, error: "اختر القسم." };
  const endsOn = input.endsOn?.trim() || null;
  if (endsOn && !/^\d{4}-\d{2}-\d{2}$/.test(endsOn)) return { ok: false, error: "تاريخ الانتهاء غير صحيح." };
  if (input.image !== null && !isOwnPhoto(input.image)) return { ok: false, error: "صورة العرض غير صالحة." };

  const db = createServiceClient();
  if (!db) return { ok: false, error: "الخادم غير مهيأ." };

  const row = {
    title_ar: titleAr,
    title_en: titleEn,
    description_ar: descriptionAr,
    description_en: descriptionEn,
    image: input.image,
    price_before: priceBefore,
    price_after: priceAfter,
    branches,
    service: input.service,
    ends_on: endsOn,
    active: Boolean(input.active),
    updated_at: new Date().toISOString(),
    updated_by: who.userId,
  };

  if (input.id !== null) {
    if (!Number.isSafeInteger(input.id)) return { ok: false, error: "طلب غير صالح." };
    const { data: current, error: readError } = await db.from("offers").select("image").eq("id", input.id).maybeSingle();
    if (readError) return failed("Offer read", readError);
    if (!current) return { ok: false, error: "العرض غير موجود (ربما حُذف)." };
    const { error } = await db.from("offers").update(row).eq("id", input.id);
    if (error) return failed("Offer update", error);
    if (current.image !== input.image) await removeImage(db, current.image);
  } else {
    // New offers go first.
    const { data: first } = await db
      .from("offers")
      .select("sort_order")
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    const { error } = await db.from("offers").insert({ ...row, sort_order: (first?.sort_order ?? 10) - 10 });
    if (error) return failed("Offer insert", error);
  }

  publish();
  return { ok: true };
}

// Shows or hides an offer without opening the editor.
export async function setOfferActive(id: number, active: boolean): Promise<UpdateResult> {
  const who = await requireTab("offers");
  if ("error" in who) return { ok: false, error: who.error };
  if (!Number.isSafeInteger(id)) return { ok: false, error: "طلب غير صالح." };
  const db = createServiceClient();
  if (!db) return { ok: false, error: "الخادم غير مهيأ." };
  const { error } = await db
    .from("offers")
    .update({ active: Boolean(active), updated_at: new Date().toISOString(), updated_by: who.userId })
    .eq("id", id);
  if (error) return failed("Offer update", error);
  publish();
  return { ok: true };
}

// Removes the offer and its image. Bookings made from it keep the offer's title.
export async function deleteOffer(id: number): Promise<UpdateResult> {
  const who = await requireTab("offers");
  if ("error" in who) return { ok: false, error: who.error };
  if (!Number.isSafeInteger(id)) return { ok: false, error: "طلب غير صالح." };
  const db = createServiceClient();
  if (!db) return { ok: false, error: "الخادم غير مهيأ." };
  const { data: removed, error } = await db.from("offers").delete().eq("id", id).select("image").maybeSingle();
  if (error) return failed("Offer delete", error);
  await removeImage(db, removed?.image ?? null);
  publish();
  return { ok: true };
}

// Moves an offer one place up or down, by swapping display order with its neighbour.
export async function moveOffer(id: number, direction: -1 | 1): Promise<UpdateResult> {
  const who = await requireTab("offers");
  if ("error" in who) return { ok: false, error: who.error };
  if (!Number.isSafeInteger(id)) return { ok: false, error: "طلب غير صالح." };
  const db = createServiceClient();
  if (!db) return { ok: false, error: "الخادم غير مهيأ." };

  const { data: all, error } = await db.from("offers").select("id, sort_order").order("sort_order").order("id", { ascending: false });
  if (error) return failed("Offer move", error);
  const i = all.findIndex((o) => o.id === id);
  const j = i + (direction < 0 ? -1 : 1);
  if (i < 0 || j < 0 || j >= all.length) return { ok: true };
  // Renumber the whole list so equal sort orders (from older rows) still swap.
  const order = all.map((o) => o.id);
  [order[i], order[j]] = [order[j], order[i]];
  const results = await Promise.all(order.map((oid, n) => db.from("offers").update({ sort_order: n * 10 }).eq("id", oid)));
  const failure = results.find((r) => r.error);
  if (failure?.error) return failed("Offer move", failure.error);
  publish();
  return { ok: true };
}
