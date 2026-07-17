export interface EmailTemplateOption {
  id: 'PROMO' | 'NUEVO_PLATO' | 'EN_BLANCO';
  label: string;
  description: string;
  html: string;
}

export const EMAIL_TEMPLATES: EmailTemplateOption[] = [
  {
    id: 'PROMO',
    label: '🎉 Promoción',
    description: 'Oferta o descuento con llamada a la acción',
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #eee;">
        <div style="background: linear-gradient(135deg, #F26122, #ff9966); padding: 40px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 900;">🎉 ¡Oferta especial para ti, {nombre}!</h1>
        </div>
        <div style="padding: 32px;">
          <p style="color: #4b5563; line-height: 1.6; font-size: 14px;">Hola {nombre}, tenemos una promoción especial esta semana. [Describe aquí tu oferta]</p>
          <p style="text-align: center; margin-top: 24px;">
            <span style="display: inline-block; background: #111827; color: white; padding: 14px 28px; border-radius: 12px; font-weight: 900; font-size: 12px; text-transform: uppercase;">Ver Oferta</span>
          </p>
        </div>
      </div>
    `.trim(),
  },
  {
    id: 'NUEVO_PLATO',
    label: '🍽️ Nuevo Plato',
    description: 'Anuncia un producto nuevo en tu carta',
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #eee;">
        <div style="background: #111827; padding: 32px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 900;">🍽️ ¡Prueba nuestro nuevo plato!</h1>
        </div>
        <div style="padding: 32px;">
          <div style="background: #f9fafb; border-radius: 15px; padding: 40px; text-align: center; color: #9ca3af; font-size: 12px; font-weight: bold; margin-bottom: 20px;">
            [Reemplaza este bloque con una imagen del plato]
          </div>
          <p style="color: #4b5563; line-height: 1.6; font-size: 14px;">Hola {nombre}, queremos que seas de los primeros en probar nuestra nueva creación. [Describe aquí el plato]</p>
        </div>
      </div>
    `.trim(),
  },
  {
    id: 'EN_BLANCO',
    label: '📄 En Blanco',
    description: 'Empieza desde cero',
    html: `<div style="font-family: 'Inter', sans-serif; padding: 24px;"><p>Hola {nombre},</p><p>[Escribe tu mensaje aquí]</p></div>`,
  },
];
