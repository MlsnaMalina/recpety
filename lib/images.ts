import { createClient } from "@/lib/supabase/client";

export async function getSignedUrl(path: string): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.storage
    .from("photos")
    .createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

export async function getSignedUrls(
  paths: string[]
): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const supabase = createClient();
  const { data } = await supabase.storage
    .from("photos")
    .createSignedUrls(paths, 60 * 60);
  const map: Record<string, string> = {};
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) map[item.path] = item.signedUrl;
  }
  return map;
}

export async function uploadPhoto(
  userId: string,
  file: File
): Promise<string | null> {
  const supabase = createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("photos").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) return null;
  return path;
}

export async function deletePhoto(path: string): Promise<void> {
  const supabase = createClient();
  await supabase.storage.from("photos").remove([path]);
}
