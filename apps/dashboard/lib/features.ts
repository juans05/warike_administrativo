// Todo lo que depende de Meta (WhatsApp Cloud API, plantillas de Meta, Meta Ads) queda oculto
// hasta que Meta valide la app. Para activarlo: NEXT_PUBLIC_META_ENABLED=true en Railway y redeploy.
export const META_ENABLED = process.env.NEXT_PUBLIC_META_ENABLED === 'true';
