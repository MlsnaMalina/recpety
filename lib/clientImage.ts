"use client";

const MAX_DIMENSION = 2000;

export type EncodedImage = {
  media_type: "image/jpeg";
  data: string;
};

export async function fileToEncodedImage(file: File): Promise<EncodedImage> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(
    1,
    MAX_DIMENSION / Math.max(bitmap.width, bitmap.height)
  );
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  return {
    media_type: "image/jpeg",
    data: dataUrl.slice(dataUrl.indexOf(",") + 1),
  };
}
