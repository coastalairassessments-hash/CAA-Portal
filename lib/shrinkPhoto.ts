// CLIENT ONLY. Shrinks a phone photo to a small JPEG before it is sent, so uploads are quick on a weak signal.
const MAX_SIDE = 1600;

export async function shrinkPhoto(file: File): Promise<Blob | null> {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    return await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.72));
  } catch {
    return null;
  }
}
