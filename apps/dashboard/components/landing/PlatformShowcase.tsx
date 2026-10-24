'use client';

import React, { useState } from 'react';
import {
  ArrowRight, Bell, Boxes, Bot, CalendarDays, Check, Gift, MessageCircle, Sparkles, Star, Wallet, X, type LucideIcon,
} from 'lucide-react';

// Secciones de la landing al estilo "producto en acción": capturas reales del panel (public/images/plataforma)
// y tarjetas flotantes que muestran lo que pasa. Las tarjetas son ejemplos ilustrativos, no datos de clientes.

const SHOTS = '/images/plataforma';

/** Marco de navegador para mostrar una captura real del panel. */
export function BrowserFrame({ src, alt, className = '', priority = false }: { src: string; alt: string; className?: string; priority?: boolean }) {
  return (
    <div className={`rounded-[20px] bg-white border border-[var(--border)] shadow-[0_30px_80px_rgba(45,36,36,0.18)] overflow-hidden ${className}`}>
      <div className="flex items-center gap-1.5 px-4 h-9 border-b border-[var(--border)] bg-[var(--background)]" aria-hidden>
        <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 text-[11px] text-[var(--text-muted)] truncate">admin.wuarikes.com</span>
      </div>
      <img src={src} alt={alt} className="w-full h-auto block" loading={priority ? 'eager' : 'lazy'} />
    </div>
  );
}

/** Tarjeta flotante: llega una reseña y la IA ya tiene la respuesta. */
export function ReviewAlertCard({ className = '' }: { className?: string }) {
  return (
    <div className={`w-[280px] rounded-[20px] bg-white border border-[var(--border)] shadow-[0_20px_50px_rgba(45,36,36,0.16)] p-4 space-y-3 ${className}`}>
      <div className="flex items-center gap-2.5">
        <img src="/images/google-g.svg" alt="" className="w-7 h-7" />
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-[var(--text)]">Nueva reseña en Google</p>
          <div className="flex gap-0.5 text-[var(--secondary)]" aria-label="5 de 5 estrellas">
            {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} fill="currentColor" stroke="none" />)}
          </div>
        </div>
        <span className="ml-auto text-[11px] text-[var(--text-muted)]">hace 1 min</span>
      </div>
      <p className="text-[13px] text-[var(--text)] leading-snug">“Excelente atención y el corte quedó perfecto. ¡Volveré!”</p>
      <div className="rounded-xl bg-[var(--accent)]/10 px-3 py-2 text-[12px] text-[var(--text)] flex gap-2">
        <Sparkles size={14} className="text-[var(--accent)] shrink-0 mt-0.5" />
        <span><strong className="font-semibold">Respuesta lista con IA.</strong> Revísala y publícala con un toque.</span>
      </div>
    </div>
  );
}

/** Tarjeta flotante: el bot de WhatsApp agenda una cita. */
export function WhatsAppBookingCard({ className = '' }: { className?: string }) {
  return (
    <div className={`w-[270px] rounded-[20px] bg-white border border-[var(--border)] shadow-[0_20px_50px_rgba(45,36,36,0.16)] p-4 space-y-2.5 ${className}`}>
      <div className="flex items-center gap-2.5 pb-2 border-b border-[var(--border)]">
        <span className="w-8 h-8 rounded-full bg-[var(--text)] text-white flex items-center justify-center"><Bot size={16} /></span>
        <div>
          <p className="text-[13px] font-semibold text-[var(--text)]">PlazBot · WhatsApp</p>
          <p className="text-[11px] text-[var(--accent)]">Responde 24/7</p>
        </div>
      </div>
      <div className="flex justify-end">
        <p className="bg-[var(--background)] rounded-2xl rounded-tr-sm px-3 py-1.5 text-[12.5px] text-[var(--text)] max-w-[85%]">¿Tienen cita hoy a las 4 con Juan?</p>
      </div>
      <div className="flex justify-start">
        <p className="bg-[var(--primary)]/10 rounded-2xl rounded-tl-sm px-3 py-1.5 text-[12.5px] text-[var(--text)] max-w-[90%]">Sí, Juan está libre a las 4:00 pm. ¿Te la reservo?</p>
      </div>
    </div>
  );
}

/** Hero en dos columnas: mensaje a la izquierda, el panel real con tarjetas flotantes a la derecha. */
export function ShowcaseHero({ primaryCta, secondaryCta }: { primaryCta: React.ReactNode; secondaryCta: React.ReactNode }) {
  return (
    <div className="relative z-10 max-w-6xl mx-auto grid lg:grid-cols-[1fr_1.2fr] gap-14 items-center">
      <div className="space-y-7 text-center lg:text-left">
        <p className="text-xs font-semibold text-[var(--primary)] tracking-wide uppercase">Para restaurantes y negocios de servicio en Perú</p>
        <h1 className="text-5xl sm:text-6xl md:text-[68px] font-semibold tracking-tight text-[var(--text)] font-warike leading-[1.04]">
          Llena tu local.<br /><span className="italic text-[var(--primary)]">Ordena</span> tu negocio.
        </h1>
        <p className="text-lg md:text-xl text-[var(--text-muted)] leading-relaxed max-w-xl mx-auto lg:mx-0">
          Reseñas en Google, WhatsApp con IA, agenda, caja, inventario y fidelización en un solo panel. Wuarikes te trae clientes nuevos y tu equipo los atiende mejor.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">{primaryCta}{secondaryCta}</div>
        <ul className="flex flex-wrap gap-x-6 gap-y-2 justify-center lg:justify-start text-sm text-[var(--text-muted)]">
          {['Sin instalar nada', 'Celular, tablet y PC', 'Soporte en Perú'].map((t) => (
            <li key={t} className="inline-flex items-center gap-1.5"><Check size={15} className="text-[var(--accent)]" />{t}</li>
          ))}
        </ul>
      </div>
      <div className="relative pb-10 lg:pb-0">
        <BrowserFrame src={`${SHOTS}/agenda.png`} alt="Agenda de citas por profesional en el panel de Wuarikes" priority />
        <ReviewAlertCard className="hidden md:block absolute -top-16 -left-12" />
        <WhatsAppBookingCard className="hidden md:block absolute -bottom-10 -right-6" />
      </div>
    </div>
  );
}

const CHANNELS = ['Google Maps', 'WhatsApp', 'Instagram', 'Carta QR', 'NFC en mesa', 'Apple Wallet', 'Google Wallet', 'Link de reservas', 'Email', 'Caja', 'Cocina', 'Mesas'];

/** Franja en movimiento con todos los canales que reúne el panel. */
export function ChannelsMarquee() {
  const row = [...CHANNELS, ...CHANNELS];
  return (
    <section className="py-14 border-y border-[var(--border)] bg-white overflow-hidden" aria-label="Canales que reúne Wuarikes">
      <style>{`@keyframes wk-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        .wk-marquee{animation:wk-marquee 40s linear infinite}
        @media (prefers-reduced-motion: reduce){.wk-marquee{animation:none}}`}</style>
      <p className="text-center text-sm font-medium text-[var(--text-muted)] mb-6">Cada canal de tu negocio, en un solo lugar</p>
      <div className="flex w-max wk-marquee">
        {row.map((c, i) => (
          <span key={`${c}-${i}`} aria-hidden={i >= CHANNELS.length}
            className="mx-2 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] px-5 py-2.5 text-[15px] font-medium text-[var(--text)] whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />{c}
          </span>
        ))}
      </div>
    </section>
  );
}

type Tab = { key: string; label: string; icon: LucideIcon; title: string; points: string[]; visual: React.ReactNode };

const TABS: Tab[] = [
  {
    key: 'agenda', label: 'Agenda y reservas', icon: CalendarDays,
    title: 'Cada profesional con su agenda, y tus clientes reservan solos',
    points: ['Una columna por profesional, con su silla y su horario', 'Link de reservas para Instagram y WhatsApp: el cliente elige servicio, persona y hora', 'Recordatorios automáticos por WhatsApp para que nadie falte'],
    visual: (
      <div className="relative">
        <BrowserFrame src={`${SHOTS}/agenda.png`} alt="Agenda por profesional" />
        <img src={`${SHOTS}/reservar-movil.png`} alt="Link de reservas en el celular del cliente"
          className="hidden sm:block absolute -bottom-8 -right-4 w-[150px] rounded-[22px] border-4 border-[var(--text)] shadow-[0_20px_50px_rgba(45,36,36,0.25)]" loading="lazy" />
      </div>
    ),
  },
  {
    key: 'caja', label: 'Caja', icon: Wallet,
    title: 'Cobra mesas, ventas y citas en un solo turno',
    points: ['Ticket, boleta o factura con los datos del cliente', 'Efectivo, tarjeta y Yape/Plin, con cierre y cuadre de turno', 'Imprime el ticket en tu ticketera desde el navegador'],
    visual: <BrowserFrame src={`${SHOTS}/caja.png`} alt="Caja con cobros del turno" />,
  },
  {
    key: 'inventario', label: 'Inventario', icon: Boxes,
    title: 'Sabes lo que tienes y cuánto te cuesta',
    points: ['Stock con alertas de mínimo y agotados', 'Fichas técnicas: cada venta descuenta sus insumos', 'Kardex, mermas y proveedores'],
    visual: <BrowserFrame src={`${SHOTS}/inventario.png`} alt="Inventario con stock y valorización" />,
  },
  {
    key: 'fidelizacion', label: 'Fidelización', icon: Gift,
    title: 'Tus clientes vuelven solos',
    points: ['Tarjeta de sellos en Apple Wallet y Google Wallet, sin descargar apps', 'Con el color y el logo de tu marca', 'Si un cliente deja de venir, le escribimos por WhatsApp'],
    visual: (
      <div className="flex justify-center">
        <img src={`${SHOTS}/wallet.png`} alt="Diseño de la tarjeta de sellos en Wallet"
          className="w-full max-w-[460px] rounded-[24px] border border-[var(--border)] shadow-[0_30px_80px_rgba(45,36,36,0.18)]" loading="lazy" />
      </div>
    ),
  },
  {
    key: 'reputacion', label: 'Reseñas y WhatsApp IA', icon: Star,
    title: 'Más reseñas de 5 estrellas y respuestas en segundos',
    points: ['Tus clientes dejan su reseña en Google tocando el NFC o el QR', 'La IA te propone la respuesta y tú decides qué publicar', 'PlazBot responde preguntas y agenda por WhatsApp, día y noche'],
    visual: (
      <div className="relative flex flex-col items-center gap-5 sm:block">
        <img src="/images/touch_review.png" alt="Cliente tocando el soporte NFC para dejar su reseña en Google"
          className="w-full h-[300px] sm:h-[400px] object-cover rounded-[28px] shadow-[0_30px_80px_rgba(45,36,36,0.18)]" loading="lazy" />
        <ReviewAlertCard className="sm:absolute sm:-top-8 sm:-left-6" />
        <WhatsAppBookingCard className="sm:absolute sm:-bottom-10 sm:-right-4" />
      </div>
    ),
  },
];

/** Recorrido por el producto con pestañas: cada una muestra una pantalla real y qué resuelve. */
export function ProductTour() {
  const [active, setActive] = useState(TABS[0].key);
  const tab = TABS.find((t) => t.key === active)!;
  return (
    <section id="producto" className="py-28 md:py-36 px-6 md:px-8 bg-[var(--background)]">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <p className="text-xs font-semibold text-[var(--primary)] tracking-wide uppercase">Qué hace Wuarikes</p>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-[var(--text)] font-warike">Haz crecer tu negocio, no tu planilla.</h2>
          <p className="text-lg text-[var(--text-muted)] leading-relaxed">Pantallas reales del panel que usa tu equipo todos los días.</p>
        </div>

        <div role="tablist" aria-label="Módulos de Wuarikes" className="flex flex-wrap justify-center gap-2">
          {TABS.map((t) => {
            const selected = t.key === active;
            return (
              <button key={t.key} type="button" role="tab" id={`tab-${t.key}`} aria-selected={selected} aria-controls={`panel-${t.key}`}
                onClick={() => setActive(t.key)}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors min-h-11 ${
                  selected ? 'bg-[var(--text)] text-white' : 'bg-white text-[var(--text)] border border-[var(--border)] hover:bg-[var(--background)]'}`}>
                <t.icon size={16} aria-hidden />{t.label}
              </button>
            );
          })}
        </div>

        <div role="tabpanel" id={`panel-${tab.key}`} aria-labelledby={`tab-${tab.key}`} className="grid lg:grid-cols-[0.8fr_1.2fr] gap-12 items-center">
          <div className="space-y-6">
            <h3 className="text-3xl font-semibold tracking-tight text-[var(--text)] font-warike leading-tight">{tab.title}</h3>
            <ul className="space-y-4">
              {tab.points.map((p) => (
                <li key={p} className="flex gap-3 text-[16px] text-[var(--text)] leading-relaxed">
                  <span className="mt-1 w-5 h-5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center shrink-0"><Check size={13} /></span>{p}
                </li>
              ))}
            </ul>
            <a href="#planes" className="inline-flex items-center gap-2 text-[15px] font-medium text-[var(--primary)] hover:gap-3 transition-all">
              Ver membresías <ArrowRight size={16} />
            </a>
          </div>
          <div key={tab.key} className="animate-in fade-in slide-in-from-bottom-2 duration-300">{tab.visual}</div>
        </div>
      </div>
    </section>
  );
}

const VERTICALS = ['Restaurantes', 'Cafeterías y bares', 'Barberías y salones', 'Spas y estética', 'Clínicas y consultorios', 'Veterinarias y grooming', 'Talleres y lavaderos', 'Tiendas'];

/** Rubros: el mismo panel se adapta (carta o servicios, mesas o agenda, mascota o vehículo). */
export function VerticalsStrip() {
  return (
    <section className="py-20 px-6 md:px-8">
      <div className="max-w-5xl mx-auto text-center space-y-8">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--text)] font-warike">Un panel que se adapta a tu rubro</h2>
        <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto">Carta o servicios, mesas o agenda, fichas de mascota o de vehículo: cada negocio ve solo lo que usa.</p>
        <ul className="flex flex-wrap justify-center gap-3">
          {VERTICALS.map((v) => (
            <li key={v} className="rounded-full bg-white border border-[var(--border)] px-5 py-2.5 text-[15px] font-medium text-[var(--text)] shadow-sm">{v}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const OLD_WAY = [
  { when: 'Día 1', text: 'Un cliente deja una reseña de 2 estrellas en Google. Nadie se entera.' },
  { when: 'Día 3', text: 'La encuentras por casualidad y respondes con un “lamentamos lo ocurrido”.' },
  { when: 'Día 7+', text: 'El cliente no vuelve y cada persona que busca tu local lee esa reseña.' },
];
const NEW_WAY = [
  { when: 'Minuto 1', text: 'Te avisamos de la reseña nueva en tu panel.' },
  { when: 'Minuto 5', text: 'La IA te propone una respuesta cuidada y la publicas.' },
  { when: 'Día 30', text: 'Si no vuelve, recibe un mensaje con su tarjeta de sellos para invitarlo de nuevo.' },
];

/** Antes y con Wuarikes, como una línea de tiempo lado a lado. */
export function OldVsNew() {
  const Column = ({ title, items, good }: { title: string; items: typeof OLD_WAY; good: boolean }) => (
    <div className={`rounded-[28px] p-8 space-y-6 ${good ? 'bg-[var(--text)] text-white' : 'bg-white border border-[var(--border)]'}`}>
      <p className={`inline-flex items-center gap-2 text-sm font-semibold ${good ? 'text-[var(--secondary)]' : 'text-[var(--text-muted)]'}`}>
        {good ? <Bell size={16} aria-hidden /> : <X size={16} aria-hidden />}{title}
      </p>
      <ol className="space-y-5">
        {items.map((it) => (
          <li key={it.when} className="flex gap-4">
            <span className={`shrink-0 w-20 text-sm font-semibold ${good ? 'text-white' : 'text-[var(--text)]'}`}>{it.when}</span>
            <span className={`text-[15px] leading-relaxed ${good ? 'text-white/75' : 'text-[var(--text-muted)]'}`}>{it.text}</span>
          </li>
        ))}
      </ol>
    </div>
  );
  return (
    <section className="py-28 md:py-32 px-6 md:px-8 bg-[var(--background)]">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <p className="text-xs font-semibold text-[var(--primary)] tracking-wide uppercase">Por qué Wuarikes</p>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-[var(--text)] font-warike">Una mala reseña no espera.</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Column title="La forma de siempre" items={OLD_WAY} good={false} />
          <Column title="Con Wuarikes" items={NEW_WAY} good />
        </div>
        <p className="text-center text-sm text-[var(--text-muted)] inline-flex w-full justify-center items-center gap-2">
          <MessageCircle size={15} aria-hidden /> Tú apruebas cada respuesta: nada se publica sin tu visto bueno.
        </p>
      </div>
    </section>
  );
}
