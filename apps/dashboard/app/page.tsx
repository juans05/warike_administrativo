'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Star,
  ArrowRight,
  Plus,
  Bot,
  Mail,
  Gift,
  Camera,
  UtensilsCrossed,
  ShieldCheck,
  Check,
  Sparkles,
  Flame,
  LayoutGrid,
  Tag,
  Users,
  TrendingUp,
} from 'lucide-react';

const WHATSAPP_NUMBER = '51902191948';
const waLink = (message: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface PlanInfo {
  tier: string;
  name: string;
  price: number;
  currency: string;
  features: string[];
}

// Shown immediately and kept if the live API is slow/unavailable, so the
// pricing section is never empty — values mirror the backend defaults.
const FALLBACK_PLANS: PlanInfo[] = [
  { tier: 'reputacion', name: 'Wuarike Reputación', price: 79, currency: 'PEN', features: ['Filtro de reputación Google activado', 'Instagram IA ilimitado', 'Buzón privado de feedback', 'Carta digital interactiva'] },
  { tier: 'fidelizacion', name: 'Wuarike Fidelización+', price: 149, currency: 'PEN', features: ['Todo lo de Wuarike Reputación', 'Programa de fidelización con sellos o puntos', 'Tarjeta digital en Apple Wallet y Google Wallet', 'Clientes CRM'] },
  { tier: 'ia_total', name: 'Wuarike IA Total', price: 249, currency: 'PEN', features: ['Todo lo de Wuarike Fidelización+', 'PlazBot: bot de WhatsApp con IA', 'Chat en vivo', 'Campañas de WhatsApp', 'Email marketing', 'Base de conocimiento IA (RAG)'] },
];

// --- Scroll reveal (transform/opacity only, respects reduced-motion) ---

function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, inView };
}

// --- Count-up: animates a number from 0 to its target once it scrolls into view ---

function useCountUp(target: number, inView: boolean, duration = 1200, decimals = 0) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return;
    }
    let raf: number;
    const start = performance.now();
    const factor = Math.pow(10, decimals);
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(target * eased * factor) / factor);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration, decimals]);
  return value;
}

function CountUpStat({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const { ref, inView } = useInView<HTMLSpanElement>();
  const value = useCountUp(target, inView);
  return <span ref={ref}>{prefix}{value}{suffix}</span>;
}

function Reveal({ children, className = '', delay = 0, scale = false }: { children: React.ReactNode; className?: string; delay?: number; scale?: boolean }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`transition-all duration-500 ease-out ${inView ? 'opacity-100 translate-y-0 scale-100' : `opacity-0 translate-y-6 ${scale ? 'scale-95' : ''}`} ${className}`}
      style={{ transitionDelay: inView ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  );
}

// --- Category pills: signals "software de marketing, comunicación e IA" up front ---

function CategoryPills() {
  const items = [
    { label: 'Marketing', color: 'var(--primary)' },
    { label: 'Comunicación', color: 'var(--secondary)' },
    { label: 'Inteligencia Artificial', color: 'var(--accent)' },
  ];
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {items.map((it) => (
        <span
          key={it.label}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[var(--border)] text-xs font-medium text-[var(--text)] shadow-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ backgroundColor: it.color }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: it.color }} />
          </span>
          {it.label}
        </span>
      ))}
    </div>
  );
}

// --- Animated WhatsApp/AI demo: shows the product doing the thing, not just naming it ---

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    setReduced(typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);
  return reduced;
}

function WhatsAppDemo() {
  const reduced = useReducedMotion();
  const [step, setStep] = useState(reduced ? 2 : 0); // 0: cliente escribe, 1: IA escribiendo, 2: respuesta IA

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setStep((s) => (s + 1) % 3), 2200);
    return () => clearInterval(id);
  }, [reduced]);

  return (
    <div className="w-full max-w-xs rounded-[24px] bg-white border border-[var(--border)] shadow-[0_20px_50px_rgba(45,36,36,0.16)] p-5">
      <div className="flex items-center gap-3 pb-3 border-b border-[var(--border)]">
        <div className="w-9 h-9 rounded-full bg-[var(--text)] flex items-center justify-center text-white shrink-0">
          <Bot size={17} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--text)] truncate">PlazBot · IA</p>
          <p className="text-[11px] text-[var(--accent)] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" /> Respondiendo por WhatsApp
          </p>
        </div>
      </div>
      <div className="pt-4 space-y-2.5 min-h-[112px]">
        <div className="flex justify-end">
          <div className="bg-[var(--background)] rounded-2xl rounded-tr-sm px-3.5 py-2 text-[13px] text-[var(--text)] max-w-[85%] animate-in fade-in slide-in-from-bottom-1 duration-300">
            ¿Tienen mesa para 4 hoy a las 8pm?
          </div>
        </div>
        {step === 1 && (
          <div className="flex justify-start animate-in fade-in duration-200">
            <div className="bg-[var(--primary)]/10 rounded-2xl rounded-tl-sm px-3.5 py-2.5 inline-flex gap-1 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-bounce [animation-delay:-0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-bounce [animation-delay:-0.1s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-bounce" />
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="flex justify-start animate-in fade-in slide-in-from-bottom-1 duration-300">
            <div className="bg-[var(--primary)]/10 rounded-2xl rounded-tl-sm px-3.5 py-2 text-[13px] text-[var(--text)] max-w-[90%]">
              ¡Sí! Te reservo mesa para 4 a las 8:00pm. Te confirmo en un momento 🎉
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Shared bits ---

function StarRating({ rating, size = 15 }: { rating: number; size?: number }) {
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
  return (
    <div className="relative inline-flex" aria-label={`${rating} de 5 estrellas`}>
      <div className="flex gap-0.5 text-[var(--border)]">
        {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={size} fill="currentColor" stroke="none" />)}
      </div>
      <div className="absolute inset-0 overflow-hidden flex gap-0.5 text-[var(--secondary)]" style={{ width: `${pct}%` }}>
        {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={size} fill="currentColor" stroke="none" />)}
      </div>
    </div>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-[var(--primary)] tracking-wide uppercase">{children}</p>;
}

// --- Bento: platform showcase ---
// Each tile is tinted to a brand color that matches what it represents —
// degustación/comida (rojo·ocre), amistad/compartir (ocre·verde), ventas (rojo).

type Tone = 'dark' | 'primary' | 'secondary' | 'accent';

const TONE_ICON_BG: Record<Tone, string> = {
  dark: 'bg-white/10 text-white',
  primary: 'bg-[var(--primary)]/10 text-[var(--primary)]',
  secondary: 'bg-[var(--secondary)]/25 text-[#8A5A18]',
  accent: 'bg-[var(--accent)]/10 text-[var(--accent)]',
};

function BentoCard({
  icon: Icon, title, desc, span = '', tone = 'primary', ai = false,
}: { icon: React.ElementType; title: string; desc: string; span?: string; tone?: Tone; ai?: boolean }) {
  const dark = tone === 'dark';
  return (
    <div
      className={`relative rounded-[28px] p-8 flex flex-col justify-between min-h-[220px] transition-transform duration-300 hover:scale-[1.015] ${span} ${
        dark ? 'bg-[var(--text)] text-white' : 'bg-white text-[var(--text)] border border-[var(--border)] shadow-[0_2px_10px_rgba(45,36,36,0.05)]'
      }`}
    >
      {ai && (
        <span className={`absolute top-6 right-6 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${dark ? 'bg-white/10 text-white' : 'bg-[var(--accent)]/10 text-[var(--accent)]'}`}>
          <Sparkles size={11} className="animate-pulse" /> IA
        </span>
      )}
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${TONE_ICON_BG[tone]}`}>
        <Icon size={22} strokeWidth={1.75} />
      </div>
      <div className="space-y-2 mt-6">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <p className={`text-sm leading-relaxed ${dark ? 'text-white/60' : 'text-[var(--text-muted)]'}`}>{desc}</p>
      </div>
    </div>
  );
}

// --- Club benefits: reframes the offer as membership, not a purchase ---

function ClubBenefitCard({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="bg-white rounded-[28px] border border-[var(--border)] shadow-[0_2px_20px_rgba(45,36,36,0.05)] p-8 text-center space-y-4">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
        <Icon size={26} strokeWidth={1.75} />
      </div>
      <h3 className="text-lg font-semibold text-[var(--text)] font-warike">{title}</h3>
      <p className="text-sm text-[var(--text-muted)] leading-relaxed">{desc}</p>
    </div>
  );
}

function ClubBenefitsSection() {
  return (
    <section className="py-28 md:py-36 px-6 md:px-8">
      <div className="max-w-6xl mx-auto space-y-14">
        <Reveal className="text-center space-y-4 max-w-2xl mx-auto">
          <SectionEyebrow>El Club Wuarike</SectionEyebrow>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-[var(--text)] font-warike">No compras un software. Te unes a un club.</h2>
          <p className="text-lg text-[var(--text-muted)] leading-relaxed">Wuarike es una membresía para dueños de restaurante: sistemas para gestionar tu negocio, descuentos y el acompañamiento para llevarlo mejor cada mes.</p>
        </Reveal>
        <Reveal delay={80} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ClubBenefitCard icon={LayoutGrid} title="Sistemas" desc="Reputación, WhatsApp con IA, fidelización y marketing — toda la tecnología que necesitas, sin contratar un equipo técnico." />
          <ClubBenefitCard icon={Tag} title="Descuentos" desc="Precios preferenciales en hardware NFC y beneficios exclusivos, solo por ser miembro del Club." />
          <ClubBenefitCard icon={Users} title="Comunidad y Conocimiento" desc="Acompañamiento directo por WhatsApp y buenas prácticas reales para llevar un restaurante — no solo software." />
        </Reveal>
      </div>
    </section>
  );
}

function PlatformSection() {
  return (
    <section id="plataforma" className="py-28 md:py-36 px-6 md:px-8">
      <div className="max-w-6xl mx-auto space-y-14">
        <Reveal className="text-center space-y-4 max-w-2xl mx-auto">
          <SectionEyebrow>La plataforma</SectionEyebrow>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-[var(--text)] font-warike">Todo tu restaurante, en un panel.</h2>
          <p className="text-lg text-[var(--text-muted)] leading-relaxed">Wuarike no es solo un dispositivo. Es el software que usa tu equipo todos los días para crecer.</p>
        </Reveal>

        <Reveal delay={80}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <BentoCard
              span="md:col-span-2 md:row-span-1"
              tone="dark"
              ai
              icon={Bot}
              title="PlazBot — tu WhatsApp con IA"
              desc="Un bot con inteligencia artificial responde preguntas y agenda reservas por WhatsApp, solo, todo el día."
            />
            <BentoCard tone="primary" icon={Star} title="Reputación Google" desc="Filtra quejas en privado y multiplica tus reseñas de 5 estrellas." />
            <BentoCard tone="secondary" icon={Gift} title="Fidelización + Wallet" desc="Sellos o puntos con tarjeta digital en Apple y Google Wallet." />
            <BentoCard tone="accent" ai icon={Camera} title="Instagram con IA" desc="Responde comentarios de tus clientes automáticamente, 24/7." />
            <BentoCard tone="secondary" icon={UtensilsCrossed} title="Carta Digital" desc="Menú siempre actualizado, sin reimprimir cada vez que cambian precios." />
            <BentoCard tone="primary" icon={Mail} title="Email Marketing" desc="Campañas y promociones automáticas a tu base de clientes." />
          </div>
        </Reveal>

        <Reveal delay={120} className="text-center">
          <a href="#planes" className="inline-flex items-center gap-2 text-[15px] font-medium text-[var(--primary)] hover:gap-3 transition-all">
            Ver Membresías <ArrowRight size={16} />
          </a>
        </Reveal>
      </div>
    </section>
  );
}

// --- Before / after ---

function ImpactCard({ name, rating, reviews, status, positive }: { name: string; rating: number; reviews: number; status: string; positive?: boolean }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const animatedRating = useCountUp(rating, inView, 1000, 1);
  return (
    <div
      ref={ref}
      className={`rounded-[28px] bg-white border shadow-[0_2px_20px_rgba(45,36,36,0.06)] p-8 space-y-6 max-w-md mx-auto transition-all duration-300 hover:-translate-y-1.5 hover:rotate-0 hover:shadow-[0_16px_34px_rgba(45,36,36,0.14)] ${
        positive
          ? 'border-[var(--accent)]/40 hover:shadow-[0_16px_34px_rgba(58,125,68,0.18)]'
          : 'border-[var(--border)] -rotate-1 saturate-[0.85]'
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-lg font-semibold text-[var(--text)] font-warike">{name}</h4>
          <p className="text-xs text-[var(--text-muted)]">Restaurante de comida marina</p>
        </div>
        <span className="px-3 py-1 rounded-full bg-[var(--background)] text-[var(--text-muted)] text-[11px] font-medium">Google</span>
      </div>
      <div className="flex items-center gap-3 py-4 border-y border-[var(--border)]">
        <span className="text-2xl font-semibold text-[var(--text)] tabular-nums">{animatedRating.toFixed(1)}</span>
        <StarRating rating={animatedRating} size={17} />
        <span className="text-sm text-[var(--text-muted)]">({reviews})</span>
      </div>
      <p className={`text-sm leading-relaxed flex items-start gap-2 ${positive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>
        {positive && inView && <Check size={16} className="shrink-0 mt-0.5 animate-in zoom-in-50 fade-in duration-500 delay-500 fill-mode-backwards" />}
        <span>{status}</span>
      </p>
    </div>
  );
}

function ComparisonSection() {
  return (
    <section className="py-28 md:py-36 px-6 md:px-8 bg-[var(--background)]">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-6">
          <Reveal>
            <ImpactCard name="Cevichería El Puerto" rating={4.2} reviews={52} status="Antes: sus clientes casi no dejaban reseñas, y las malas pesaban demasiado." />
          </Reveal>
          <div className="relative isolate">
            <span className="absolute -inset-3 -z-10 rounded-[32px] bg-[var(--accent)]/15 blur-xl animate-pulse pointer-events-none" aria-hidden="true" />
            <Reveal delay={200} scale>
              <ImpactCard name="Cevichería El Puerto" rating={4.8} reviews={683} status="Con Wuarike: Nº1 en Google Maps de su categoría." positive />
            </Reveal>
            <Reveal delay={500} scale className="absolute -top-5 left-1/2 -translate-x-1/2 z-20">
              <span className="inline-flex items-center gap-1.5 bg-[var(--accent)] text-white text-xs font-bold px-4 py-2 rounded-full shadow-[0_8px_20px_rgba(58,125,68,0.35)] whitespace-nowrap">
                <TrendingUp size={14} className="shrink-0" />
                +0.6 en 60 días
              </span>
            </Reveal>
          </div>
        </div>
        <Reveal delay={100} className="space-y-8">
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-[var(--text)] font-warike leading-tight">¿Por qué necesitas más reseñas?</h2>
          <div className="p-8 bg-white rounded-[28px] border border-[var(--border)] shadow-[0_2px_20px_rgba(45,36,36,0.06)] space-y-3">
            <div className="text-4xl font-semibold text-[var(--primary)]"><CountUpStat target={83} suffix="%" /></div>
            <p className="text-[var(--text-muted)] leading-relaxed">de las personas miran reseñas antes de elegir a qué restaurante ir.</p>
          </div>
          <p className="text-lg text-[var(--text-muted)] leading-relaxed">Cuantas más y mejores reseñas tengas, más arriba apareces en las búsquedas de Google.</p>
        </Reveal>
      </div>
    </section>
  );
}

// --- FAQ ---

function FAQItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="py-6">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left group cursor-pointer">
        <h3 className="text-base md:text-lg font-medium text-[var(--text)] group-hover:text-[var(--primary)] transition-colors">{question}</h3>
        <Plus size={20} className={`shrink-0 ml-4 text-[var(--text-muted)] transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`} />
      </button>
      {isOpen && (
        <p className="mt-4 text-[var(--text-muted)] leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300">{answer}</p>
      )}
    </div>
  );
}

function FAQSection() {
  return (
    <section className="py-28 md:py-36 px-6 md:px-8">
      <Reveal className="max-w-3xl mx-auto space-y-12">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--text)] font-warike text-center">Preguntas frecuentes</h2>
        <div className="divide-y divide-[var(--border)]">
          <FAQItem question="¿Qué es exactamente el Club Wuarike?" answer="Es una membresía para dueños de restaurante: incluye los sistemas de gestión (reputación, WhatsApp con IA, fidelización), descuentos en hardware, y acompañamiento real para llevar tu restaurante — no es solo una licencia de software." />
          <FAQItem question="¿Realmente los clientes usarán el sistema?" answer="Al eliminar toda la fricción, el proceso se vuelve tan fácil como un 'tap' o un link. Eso hace que la tasa de conversión suba exponencialmente." />
          <FAQItem question="¿Necesito instalar algo o saber de tecnología?" answer="No. Todo funciona desde tu navegador. Te damos acceso a tu panel, capacitamos a tu equipo por WhatsApp, y en menos de un día ya lo tienes andando." />
          <FAQItem question="¿Qué pasa si quiero cancelar mi membresía?" answer="Puedes cancelar cuando quieras desde tu panel, sin llamadas ni letra chica. Mantienes acceso hasta el final del período que ya pagaste." />
          <FAQItem question="¿El cliente necesita cuenta de Google para dejar la reseña?" answer="Para reseñas de 4 y 5 estrellas, sí — Google lo requiere. El 95% de los usuarios ya tiene sesión iniciada en su teléfono, así que es automático. Para quejas privadas (1 a 3 estrellas), no necesitan ninguna cuenta." />
          <FAQItem question="¿Qué me incluye si además compro los dispositivos NFC?" answer="Los stands son un acelerador físico: hacen que dejar una reseña sea tan fácil como acercar el celular. No son obligatorios — la plataforma funciona igual con un link o QR que ya viene incluido en tu plan." />
        </div>
      </Reveal>
    </section>
  );
}

// --- Pricing ---

function PricingCard({ plan, highlighted }: { plan: PlanInfo; highlighted: boolean }) {
  return (
    <div
      className={`relative rounded-[28px] p-8 flex flex-col transition-transform duration-300 ${
        highlighted
          ? 'bg-gradient-to-b from-[var(--primary)]/[0.07] to-white border-2 border-[var(--primary)] shadow-[0_16px_44px_rgba(200,75,49,0.22)] lg:-translate-y-5 lg:scale-[1.05] z-10'
          : 'bg-white border border-[var(--border)] shadow-[0_2px_20px_rgba(45,36,36,0.05)]'
      }`}
    >
      {highlighted && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-[var(--primary)] text-white text-xs font-bold px-4 py-2 rounded-full shadow-[0_8px_20px_rgba(200,75,49,0.35)] whitespace-nowrap">
          <Flame size={14} className="shrink-0" />
          El más elegido
        </div>
      )}
      <p className={`text-sm font-medium mb-3 ${highlighted ? 'text-[var(--primary)] font-semibold mt-2' : 'text-[var(--text-muted)]'}`}>{plan.name}</p>
      <div className="flex items-end gap-1 mb-7">
        <span className="text-4xl font-semibold text-[var(--text)] tracking-tight">S/. {plan.price}</span>
        <span className="text-sm text-[var(--text-muted)] mb-1">/mes</span>
      </div>
      <ul className="space-y-3 mb-8 flex-1">
        {plan.features.map((f, i) => (
          <li key={i} className="flex items-start gap-3">
            <Check size={16} className="text-[var(--primary)] shrink-0 mt-0.5" strokeWidth={2.5} />
            <span className="text-sm text-[var(--text-muted)] leading-snug">{f}</span>
          </li>
        ))}
      </ul>
      <a
        href={waLink(`Hola equipo Wuarike! Quiero unirme al Club con la membresía "${plan.name}" (S/. ${plan.price}/mes) para mi restaurante.`)}
        target="_blank"
        rel="noopener noreferrer"
        className={`w-full text-center py-3.5 rounded-full text-sm font-semibold transition-all ${
          highlighted
            ? 'bg-[var(--primary)] text-white shadow-[0_10px_24px_rgba(200,75,49,0.35)] hover:bg-[var(--primary-light)] hover:scale-[1.03] active:scale-95'
            : 'bg-[var(--text)] text-white hover:opacity-90'
        }`}
      >
        {highlighted ? '¡Quiero esta membresía!' : 'Unirme con esta membresía'}
      </a>
    </div>
  );
}

function PricingSection() {
  const [plans, setPlans] = useState<PlanInfo[]>(FALLBACK_PLANS);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/subscriptions/plans`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (Array.isArray(data) && data.length === 3) setPlans(data); })
      .catch(() => { /* keep fallback pricing */ });
  }, []);

  return (
    <section id="planes" className="py-28 md:py-36 px-6 md:px-8 bg-[var(--background)]">
      <div className="max-w-6xl mx-auto space-y-16">
        <Reveal className="text-center space-y-4 max-w-xl mx-auto">
          <SectionEyebrow>Membresías</SectionEyebrow>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-[var(--text)] font-warike">Elige tu membresía.</h2>
          <p className="text-lg text-[var(--text-muted)]">Mensual, sin permanencia forzada. Cancela cuando quieras.</p>
        </Reveal>
        <Reveal delay={80} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {plans.map((plan, i) => <PricingCard key={plan.tier} plan={plan} highlighted={i === 1} />)}
        </Reveal>
      </div>
    </section>
  );
}

// --- Hardware add-on ---

function ProductCard({ title, img, reviews, price, oldPrice }: { title: string, img: string, reviews: number, price: string, oldPrice: string }) {
  return (
    <div className="rounded-[28px] bg-white border border-[var(--border)] shadow-[0_2px_20px_rgba(45,36,36,0.05)] p-8 text-center space-y-5 hover:shadow-[0_8px_30px_rgba(45,36,36,0.1)] transition-shadow duration-300">
      <div className="aspect-square rounded-2xl bg-[var(--background)] flex items-center justify-center overflow-hidden">
        <img src={img} alt={title} className="w-3/4 h-3/4 object-contain mix-blend-multiply" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-base font-medium text-[var(--text)]">{title}</h3>
        <div className="flex justify-center items-center gap-2">
          <StarRating rating={5} size={13} />
          <span className="text-xs text-[var(--text-muted)]">({reviews})</span>
        </div>
        <div className="flex justify-center items-center gap-2 pt-1">
          <span className="text-lg font-semibold text-[var(--text)]">S/. {price}</span>
          <span className="text-sm text-[var(--text-muted)] line-through">S/. {oldPrice}</span>
        </div>
      </div>
      <a
        href={waLink(`Hola equipo Wuarike! Quiero el "${title}" para mi restaurante.`)}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full inline-flex items-center justify-center gap-2 bg-[var(--primary)] text-white text-sm font-semibold py-3.5 rounded-full shadow-[0_8px_20px_rgba(200,75,49,0.3)] hover:bg-[var(--primary-light)] hover:shadow-[0_10px_26px_rgba(200,75,49,0.4)] hover:scale-[1.03] active:scale-95 transition-all duration-200"
      >
        Quiero este <ArrowRight size={16} />
      </a>
    </div>
  );
}

function ProductsSection() {
  return (
    <section id="hardware" className="py-28 md:py-36 px-6 md:px-8">
      <div className="max-w-6xl mx-auto space-y-14">
        <Reveal className="text-center space-y-4 max-w-2xl mx-auto">
          <SectionEyebrow>Beneficio de membresía</SectionEyebrow>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-[var(--text)] font-warike">Hardware con precio de miembro.</h2>
          <p className="text-lg text-[var(--text-muted)] leading-relaxed">Tu membresía ya incluye un link y un QR digital. Si prefieres algo físico, estos stands premium con NFC tienen descuento exclusivo para miembros del Club.</p>
        </Reveal>
        <Reveal delay={80} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ProductCard title="Expositor Reseñas Google NFC" img="/images/warike_expositor_clean.png" reviews={370} price="129" oldPrice="169" />
          <ProductCard title="Stand Premium de Madera" img="/images/warike_madera_clean.png" reviews={512} price="169" oldPrice="219" />
          <ProductCard title="Placa Reseñas de Google" img="/images/warike_placa_clean.png" reviews={79} price="99" oldPrice="139" />
        </Reveal>
      </div>
    </section>
  );
}

// --- Stats band: brand color as protagonist, not just accent ---

function StatsBand() {
  return (
    <section className="py-14 md:py-16 px-6 md:px-8 bg-[var(--primary)]">
      <Reveal className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-10 text-center">
        <div>
          <p className="text-3xl md:text-4xl font-semibold text-white font-warike"><CountUpStat target={40} prefix="+" suffix="%" /></p>
          <p className="text-sm text-white/80 mt-1.5">más reseñas positivas en 60 días</p>
        </div>
        <div>
          <p className="text-3xl md:text-4xl font-semibold text-white font-warike">24/7</p>
          <p className="text-sm text-white/80 mt-1.5">tu WhatsApp respondiendo con IA</p>
        </div>
        <div>
          <p className="text-3xl md:text-4xl font-semibold text-white font-warike">1 panel</p>
          <p className="text-sm text-white/80 mt-1.5">para marketing, comunicación y fidelización</p>
        </div>
      </Reveal>
    </section>
  );
}

// --- Hero aurora: soft blurred brand-color blobs, purely decorative ---

function HeroAurora() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-24 -left-20 w-72 h-72 md:w-96 md:h-96 rounded-full blur-3xl opacity-[0.18]" style={{ background: 'var(--primary)' }} />
      <div className="absolute top-0 -right-10 w-72 h-72 md:w-96 md:h-96 rounded-full blur-3xl opacity-[0.16]" style={{ background: 'var(--secondary)' }} />
      <div className="absolute bottom-0 left-1/3 w-64 h-64 md:w-80 md:h-80 rounded-full blur-3xl opacity-[0.14]" style={{ background: 'var(--accent)' }} />
    </div>
  );
}

// --- Sticky mobile purchase bar: keeps "buy" one tap away while scrolling ---

function MobileStickyCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const distanceFromBottom = document.documentElement.scrollHeight - window.scrollY - window.innerHeight;
      setVisible(window.scrollY > 480 && distanceFromBottom > 500);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className={`md:hidden fixed bottom-0 left-0 right-0 z-[90] px-4 pt-3 bg-white/90 backdrop-blur-xl border-t border-[var(--border)] shadow-[0_-8px_24px_rgba(45,36,36,0.08)] transition-transform duration-300 ${visible ? 'translate-y-0' : 'translate-y-full'}`}
      style={{ paddingBottom: 'max(0.9rem, env(safe-area-inset-bottom))' }}
    >
      <a href="#planes" className="w-full bg-[var(--primary)] text-white text-[15px] font-medium py-3.5 rounded-full flex items-center justify-center gap-2">
        Ver Membresías <ArrowRight size={16} />
      </a>
    </div>
  );
}

// --- Footer ---

function Footer() {
  return (
    <footer className="bg-[var(--background)] border-t border-[var(--border)] py-16 px-6 md:px-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
        <div>
          <span className="text-3xl font-extrabold tracking-tight font-warike bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">Wuarike</span>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)] mt-1">Reputación &amp; Sazón</p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-medium text-[var(--text-muted)]">
          <a href="#plataforma" className="hover:text-[var(--text)] transition-colors">Plataforma</a>
          <a href="#planes" className="hover:text-[var(--text)] transition-colors">Planes</a>
          <a href="#hardware" className="hover:text-[var(--text)] transition-colors">Hardware</a>
          <Link href="/login" className="hover:text-[var(--text)] transition-colors">Acceso Partner</Link>
        </div>
        <a
          href={waLink('Hola equipo Wuarike! Tengo una consulta sobre la plataforma.')}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors"
        >
          Escríbenos por WhatsApp
        </a>
      </div>
      <div className="max-w-6xl mx-auto mt-10 pt-8 border-t border-[var(--border)]">
        <p className="text-xs text-[var(--text-muted)]">© {new Date().getFullYear()} Wuarike. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}

// --- Main Page Component ---

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white selection:bg-[var(--primary)] selection:text-white overflow-x-hidden">
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6 md:px-8 h-20 flex justify-between items-center">
          <div className="flex items-center gap-2.5 group cursor-default">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--primary)]" />
            </span>
            <div className="flex flex-col leading-none transition-transform duration-300 group-hover:scale-[1.03]">
              <span className="text-3xl md:text-4xl font-extrabold tracking-tight font-warike bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">
                Wuarike
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--text-muted)] mt-0.5">Reputación &amp; Sazón</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[var(--text-muted)]">
            <a href="#plataforma" className="hover:text-[var(--text)] transition-colors">Plataforma</a>
            <a href="#planes" className="hover:text-[var(--text)] transition-colors">Membresías</a>
            <a href="#hardware" className="hover:text-[var(--text)] transition-colors">Hardware</a>
          </div>
          <Link href="/login" className="text-sm font-medium bg-[var(--text)] text-white px-5 py-2 rounded-full hover:opacity-85 transition-opacity whitespace-nowrap">
            Acceso Partner
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-40 md:pt-48 pb-24 md:pb-32 px-6 md:px-8 bg-[var(--background)]">
        <HeroAurora />
        <div className="relative z-10 max-w-6xl mx-auto text-center space-y-8">
          <Reveal className="space-y-5">
            <span className="inline-block text-xs font-semibold text-[var(--primary)] tracking-wide uppercase">El club de restaurantes que crecen juntos</span>
            <CategoryPills />
          </Reveal>
          <Reveal delay={60}>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-[var(--text)] font-warike leading-[1.05] max-w-4xl mx-auto">
              La sazón es <span className="italic text-[var(--primary)]">tuya</span>.<br />
              La reputación, <span className="underline decoration-[var(--secondary)] decoration-[6px] underline-offset-8">nuestra</span>.
            </h1>
          </Reveal>
          <Reveal delay={120}>
            <p className="text-lg md:text-xl text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed">
              Una mala reseña te cuesta 30 clientes al mes. Únete al Club <strong className="text-[var(--primary)] font-semibold">Wuarike</strong>: sistemas para proteger tu prestigio en Google, fidelizar a tus clientes y automatizar tu WhatsApp con IA — más descuentos y acompañamiento para llevar tu restaurante.
            </p>
          </Reveal>
          <Reveal delay={180} className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <a href="#planes" className="bg-[var(--primary)] text-white text-[15px] font-medium px-8 py-4 rounded-full hover:bg-[var(--primary-light)] transition-colors inline-flex items-center justify-center gap-2">
              Ver Membresías <ArrowRight size={16} />
            </a>
            <a
              href={waLink('Hola equipo Wuarike! Quiero hablar con ventas sobre la plataforma para mi restaurante.')}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[15px] font-medium text-[var(--text)] px-8 py-4 rounded-full border border-[var(--border)] hover:bg-white transition-colors inline-flex items-center justify-center"
            >
              Hablar con el Club
            </a>
          </Reveal>

          <Reveal delay={240} className="pt-10">
            <div className="relative max-w-4xl mx-auto">
              <div className="rounded-[32px] overflow-hidden shadow-[0_20px_60px_rgba(45,36,36,0.15)]">
                <img src="/images/hero.png" alt="Restaurante usando la plataforma Wuarike" className="w-full h-[380px] md:h-[460px] object-cover" />
              </div>
              <div className="hidden md:block absolute -bottom-10 -right-6 lg:-right-10">
                <WhatsAppDemo />
              </div>
            </div>
            <div className="md:hidden mt-6 flex justify-center">
              <WhatsAppDemo />
            </div>
          </Reveal>
        </div>
      </section>

      <ClubBenefitsSection />

      <StatsBand />

      <div id="impact"><ComparisonSection /></div>

      <PlatformSection />

      <FAQSection />

      <PricingSection />

      <ProductsSection />

      {/* Closing CTA */}
      <section className="py-28 md:py-36 px-6 md:px-8 bg-[var(--text)] text-white text-center">
        <Reveal className="max-w-2xl mx-auto space-y-8">
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tight font-warike italic">¿Listo para ser el nº1?</h2>
          <p className="text-white/60 text-lg">Únete al Club <strong className="text-white font-semibold">Wuarike</strong> hoy y empieza a proteger tu reputación desde el primer día.</p>
          <a href="#planes" className="inline-flex items-center gap-2 bg-[var(--primary)] text-white text-[15px] font-medium px-8 py-4 rounded-full hover:bg-[var(--primary-light)] transition-colors">
            Ver Membresías <ArrowRight size={16} />
          </a>
          <p className="flex items-center justify-center gap-2 text-white/40 text-sm pt-2">
            <ShieldCheck size={15} /> Sin permanencia · Cancela cuando quieras
          </p>
        </Reveal>
      </section>

      <Footer />
      <MobileStickyCTA />
    </div>
  );
}
