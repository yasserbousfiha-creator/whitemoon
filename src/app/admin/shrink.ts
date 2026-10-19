// Shrinks a photo in the browser before upload (phone photos are several MB): longest side `maxSide` px, JPEG.
export async function shrink(file: File, maxSide = 1000): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob"))), "image/jpeg", 0.85),
  );
}

// Uploads one photo (shrunk first) through uploadDoctorPhoto into a bucket folder; returns its URL or an error.
export async function uploadPhoto(
  upload: (form: FormData) => Promise<{ ok: true; url: string } | { ok: false; error: string }>,
  file: File,
  folder: "photo" | "cases" | "offers",
  maxSide?: number,
) {
  const form = new FormData();
  form.append("photo", await shrink(file, maxSide).catch(() => file), "photo.jpg");
  form.append("folder", folder);
  return upload(form);
}
