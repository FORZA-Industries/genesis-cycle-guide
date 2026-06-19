import { supabase } from "@/integrations/supabase/client";

export const AVATAR_BUCKET = "avatars";

export async function getAvatarSignedUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 7); // 7 days
  if (error) return null;
  return data.signedUrl;
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file");
  if (file.size > 5 * 1024 * 1024) throw new Error("Image must be under 5MB");
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (upErr) throw upErr;
  const { error: profErr } = await supabase
    .from("profiles")
    .update({ avatar_url: path })
    .eq("id", userId);
  if (profErr) throw profErr;
  return path;
}
