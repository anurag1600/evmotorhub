import { supabase } from './supabase';

export type StorageBucket = 'vehicles' | 'news' | 'manufacturers' | 'charging-stations' | 'general';

export async function uploadImage(
  file: File,
  bucket: StorageBucket,
  maxSizeMB: number = 5
): Promise<string> {
  // Validate
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Use JPG, PNG, WEBP, or SVG');
  }
  if (file.size > maxSizeMB * 1024 * 1024) {
    throw new Error(`File must be smaller than ${maxSizeMB}MB`);
  }

  // Generate unique filename
  const ext = file.name.split('.').pop()?.toLowerCase();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
  const filePath = `${bucket}/${fileName}`;

  // Upload
  const { error, data } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, { upsert: false });

  if (error) throw error;

  // Get public URL
  const { data: publicData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return publicData.publicUrl;
}

export async function deleteImage(bucket: StorageBucket, imageUrl: string): Promise<void> {
  try {
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/storage/v1/object/public/')[1];
    if (!pathParts) return;

    const [, ...fileParts] = pathParts.split('/');
    const filePath = fileParts.join('/');

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) throw error;
  } catch (err) {
    console.error('Delete image error:', err);
  }
}
