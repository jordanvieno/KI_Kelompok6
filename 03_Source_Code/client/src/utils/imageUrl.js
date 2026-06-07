const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

/**
 * Menghasilkan URL gambar yang benar.
 * 
 * Backward compatible:
 * - Jika path sudah berupa full URL (https://...), langsung return.
 *   Ini untuk gambar yang sudah di-upload ke Supabase Storage.
 * - Jika path masih relative (/uploads/...), tambahkan API_BASE.
 *   Ini untuk gambar lama yang masih di server lokal.
 * 
 * @param {string} path - Image path from database (bisa full URL atau relative path)
 * @returns {string|null} Full image URL atau null jika path kosong
 */
export function getImageUrl(path) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${API_BASE}${path}`;
}
