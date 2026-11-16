// Storage adapter. "local" writes to ./storage/uploads and is served by the
// /media/[...path] route. "cloudinary" and "supabase" upload over HTTPS so the
// app works on serverless hosts with a read-only filesystem.
import { localStorage } from "./local";
import { cloudinaryStorage } from "./cloudinary";
import { supabaseStorage } from "./supabase";

export interface StorageAdapter {
  /** Stores a file and returns its public URL. */
  put(key: string, data: Buffer, contentType: string): Promise<string>;
  /** Deletes a file by the URL previously returned from put(). Best effort. */
  remove(url: string): Promise<void>;
}

export function getStorage(): StorageAdapter {
  switch (process.env.STORAGE_DRIVER) {
    case "cloudinary":
      return cloudinaryStorage;
    case "supabase":
      return supabaseStorage;
    default:
      return localStorage;
  }
}
