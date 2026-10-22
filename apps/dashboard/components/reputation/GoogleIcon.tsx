// El logotipo de Google lleva los colores de su marca, no los del panel: vive como imagen
// (public/images/google-g.svg) para que ningún componente tenga hex sueltos.
export function GoogleIcon({ size = 20 }: { size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element -- ícono estático de 20px
  return <img src="/images/google-g.svg" alt="" width={size} height={size} aria-hidden />;
}
