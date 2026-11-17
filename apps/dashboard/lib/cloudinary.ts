// Cloudinary reduce y recomprime las fotos al vuelo: `f_auto` entrega WebP/AVIF según el
// navegador, `q_auto` ajusta la calidad y `w_N` limita el ancho. Una portada subida de 1,5 MB
// baja a ~50 KB. Solo toca las URLs de subida versionadas (`/image/upload/v123/...`); cualquier
// otra URL (rutas locales, otros dominios, URLs que ya traen transformaciones) vuelve igual.
const UPLOAD_URL = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(v\d+\/.+)$/;

export function cldImage(url: string, width: number): string {
  const match = url ? UPLOAD_URL.exec(url) : null;
  return match ? `${match[1]}f_auto,q_auto,w_${width}/${match[2]}` : url;
}
