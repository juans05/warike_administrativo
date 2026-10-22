const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/** Sube un archivo a /api/upload/{image|video} con el token del panel y devuelve su URL. */
export async function uploadFile(kind: 'image' | 'video', file: File): Promise<string> {
  const token = localStorage.getItem('token');
  const body = new FormData();
  body.append('file', file);
  const res = await fetch(`${API}/api/upload/${kind}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body,
  });
  if (!res.ok) throw new Error(`Error al subir ${kind === 'image' ? 'la foto' : 'el video'}`);
  return (await res.json()).url as string;
}
