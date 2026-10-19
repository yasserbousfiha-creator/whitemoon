"use server";

import { revalidatePath, updateTag } from "next/cache";
import { createServiceClient } from "@/lib/supabase";
import { MAX_PRIZES, MIN_PRIZES, type WheelSettings, cleanPrizes } from "@/lib/wheel";
import { WHEEL_TAG } from "@/lib/wheel-server";
import type { UpdateResult } from "./actions";
import { requireTab } from "./manager";

// Shows or hides the wheel on the site and saves its prizes. The pages are prerendered with the wheel, so they are
// expired here and the next visit shows the change.
export async function saveWheelSettings(input: WheelSettings): Promise<UpdateResult> {
  const who = await requireTab("wheel");
  if ("error" in who) return { ok: false, error: who.error };

  if (!Array.isArray(input.prizes) || input.prizes.length < MIN_PRIZES || input.prizes.length > MAX_PRIZES) {
    return { ok: false, error: `العجلة تحتاج من ${MIN_PRIZES} إلى ${MAX_PRIZES} جوائز.` };
  }
  const prizes = cleanPrizes(input.prizes);
  if (!prizes) {
    return {
      ok: false,
      error: "تأكد أن لكل جائزة اسماً بالعربي، وسطراً أول على العجلة، ونسبة فوز رقماً صحيحاً من 1 إلى 100.",
    };
  }

  const db = createServiceClient();
  if (!db) return { ok: false, error: "الخادم غير مهيأ." };
  const { error } = await db.from("wheel_settings").upsert({
    id: 1,
    enabled: Boolean(input.enabled),
    prizes,
    updated_at: new Date().toISOString(),
    updated_by: who.userId,
  });
  if (error) {
    console.error("Wheel settings save failed:", error);
    if (error.code === "42P01" || error.code === "PGRST205") {
      return { ok: false, error: "إعدادات العجلة تحتاج تشغيل ملف 012_wheel_settings.sql في Supabase." };
    }
    return { ok: false, error: `تعذّر الحفظ (${error.code ?? error.message}).` };
  }

  updateTag(WHEEL_TAG);
  revalidatePath("/", "layout");
  return { ok: true };
}
