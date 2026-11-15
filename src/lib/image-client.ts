/**
 * Perkecil foto di browser sebelum dikirim ke AI (lebih cepat & hemat kuota).
 * Sisi terpanjang maksimal `maxSize` piksel, hasil JPEG.
 */
export async function downscaleImage(file: File, maxSize = 1024, quality = 0.82): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  return blob ? new File([blob], "foto.jpg", { type: "image/jpeg" }) : file;
}
