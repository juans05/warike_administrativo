// WhatsApp por Meta ya está aprobado y es el canal por defecto. Meta Ads sigue oculto hasta que Meta
// apruebe los permisos de anuncios. Para activarlo: NEXT_PUBLIC_META_ENABLED=true en Railway y redeploy.
export const META_ADS_ENABLED = process.env.NEXT_PUBLIC_META_ENABLED === 'true';
