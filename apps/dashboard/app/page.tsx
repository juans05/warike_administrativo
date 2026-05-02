'use client';

import React from 'react';
import Link from 'next/link';

// --- Sub-components (Defined before main component to avoid hoisting issues) ---

function LinkButton({ icon, label }: { icon: string, label: string }) {
  return (
    <button className="w-full bg-white/50 backdrop-blur-md p-6 rounded-[2rem] border border-[var(--border)] flex items-center gap-6 group hover:bg-white hover:shadow-xl transition-all">
      <div className="text-3xl group-hover:scale-125 transition-transform">{icon}</div>
      <span className="font-black text-[var(--text)] uppercase tracking-widest text-xs">{label}</span>
    </button>
  );
}

function FeatureCard({ img, title, desc }: { img: string, title: string, desc: string }) {
  return (
    <div className="bg-white p-6 rounded-[3.5rem] border border-[var(--border)] shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-4 group">
      <div className="h-56 mb-8 rounded-[2.5rem] overflow-hidden relative border-4 border-white shadow-inner">
        <img src={img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={title} />
      </div>
      <div className="space-y-4 px-4 pb-4">
        <h3 className="text-2xl font-black text-[var(--text)] font-warike italic">{title}</h3>
        <p className="text-[var(--text-muted)] font-bold leading-relaxed text-sm">{desc}</p>
      </div>
    </div>
  );
}

function ProductFeature({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="flex gap-6 items-start">
      <div className="w-10 h-10 rounded-full bg-[var(--secondary)] flex items-center justify-center shrink-0 text-white font-black">✓</div>
      <div className="space-y-1">
        <h4 className="text-xl font-black text-[var(--text)] font-warike">{title}</h4>
        <p className="text-[var(--text-muted)] font-bold text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function ProductStoreCard({ title, img, reviews, price, oldPrice }: any) {
  return (
    <div className="space-y-6 text-center">
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-8 rounded-[3rem] aspect-square flex items-center justify-center border border-orange-200/50 shadow-sm hover:shadow-xl transition-shadow group">
         <img src={img} alt={title} className="w-4/5 h-4/5 object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500 drop-shadow-2xl" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-black text-[var(--text)]">{title}</h3>
        <div className="flex justify-center items-center gap-2">
           <div className="flex text-yellow-400 text-lg">⭐⭐⭐⭐⭐</div>
           <span className="font-bold text-[var(--text-muted)]">({reviews})</span>
        </div>
        <div className="flex justify-center items-center gap-3 pt-2">
           <span className="text-2xl font-black text-orange-500">€{price}</span>
           <span className="text-lg font-bold text-[var(--text-muted)] line-through">€{oldPrice}</span>
        </div>
      </div>
    </div>
  );
}

function ProductsSection() {
  return (
    <section id="products" className="py-32 px-8 bg-white border-y border-[var(--border)]">
      <div className="max-w-6xl mx-auto space-y-20">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-black text-[var(--text)] font-warike italic">Nuestros Dispositivos</h2>
          <p className="text-[var(--text-muted)] font-bold text-lg uppercase tracking-widest text-balance">Hardware premium con tecnología NFC</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
          <ProductStoreCard 
            title="Expositor Reseñas Google NFC"
            img="/images/warike_expositor_clean.png"
            reviews={370}
            price="38,90"
            oldPrice="49,90"
          />
          <ProductStoreCard 
            title="Stand Premium de Madera"
            img="/images/warike_madera_clean.png"
            reviews={512}
            price="44,90"
            oldPrice="59,90"
          />
          <ProductStoreCard 
            title="Placa Reseñas de Google"
            img="/images/warike_placa_clean.png"
            reviews={79}
            price="28,90"
            oldPrice="39,90"
          />
        </div>
      </div>
    </section>
  );
}

function ImpactCard({ name, rating, reviews, status, isPositive, isNegative }: any) {
  return (
    <div className={`p-10 rounded-[3.5rem] bg-white border-2 ${isPositive ? 'border-green-500 shadow-green-100 shadow-2xl' : 'border-red-100'} shadow-xl space-y-6 max-w-md mx-auto`}>
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h4 className="text-2xl font-black text-[var(--text)] font-warike">{name}</h4>
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Restaurante de comida marina</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-xl">G</div>
      </div>
      
      <div className="flex items-center gap-4 py-4 border-y border-gray-50">
        <span className="text-3xl font-black text-[var(--text)]">{rating}</span>
        <div className="flex gap-1 text-yellow-400 text-xl">
          {Array.from({ length: 5 }).map((_, i) => <span key={i}>{i < Math.floor(rating) ? '⭐' : '☆'}</span>)}
        </div>
        <span className="text-[var(--text-muted)] font-bold">({reviews})</span>
      </div>

      <p className={`text-sm font-bold leading-relaxed ${isNegative ? 'text-red-500' : 'text-green-600'}`}>
        {isPositive && '✓ '} {status}
      </p>
    </div>
  );
}

function ComparisonSection() {
  return (
    <section className="py-32 px-8 bg-[var(--background)]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <div className="relative space-y-12">
          <div className="relative z-10 translate-x-10 -rotate-3 hover:rotate-0 transition-transform duration-500">
            <div className="absolute -top-6 -left-6 bg-red-600 text-white px-8 py-2 rounded-xl font-black uppercase tracking-widest text-xs z-20 shadow-xl">Antes</div>
            <ImpactCard 
              name="Cevichería El Puerto"
              rating={4.2}
              reviews={52}
              status="Sus clientes no dejaban reseñas. Las reseñas malas afectaban demasiado."
              isNegative
            />
          </div>
          <div className="flex justify-center -my-6 relative z-20">
             <div className="w-20 h-20 rounded-full bg-white shadow-2xl flex items-center justify-center text-4xl animate-bounce">⬇️</div>
          </div>
          <div className="relative z-10 -translate-x-10 rotate-3 hover:rotate-0 transition-transform duration-500">
            <div className="absolute -top-6 -right-6 bg-green-600 text-white px-8 py-2 rounded-xl font-black uppercase tracking-widest text-xs z-20 shadow-xl">Después</div>
            <ImpactCard 
              name="Cevichería El Puerto"
              rating={4.8}
              reviews={683}
              status="Nº1 en Google Maps. Mejor puntuación garantizada. Usando Warique."
              isPositive
            />
          </div>
        </div>
        <div className="space-y-10">
          <h2 className="text-5xl md:text-6xl font-black text-[var(--text)] font-warike leading-tight italic text-balance">¿Por qué necesito más reseñas?</h2>
          <div className="space-y-8">
            <div className="p-8 bg-white rounded-[3rem] border border-[var(--border)] shadow-sm space-y-4">
              <div className="text-4xl font-black text-[var(--primary)]">83%</div>
              <p className="text-[var(--text-muted)] font-bold leading-relaxed">de las personas <span className="text-[var(--text)]">miran reseñas</span> antes de elegir a qué negocio ir.</p>
            </div>
            <p className="text-xl font-bold text-[var(--text-muted)] leading-relaxed">Cuantas más y mejores reseñas tengas, <span className="text-[var(--text)]">más arriba apareces</span> en las búsquedas de Google.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function EducationSection() {
  return (
    <section className="py-32 px-8 bg-[var(--background)]">
      <div className="max-w-7xl mx-auto space-y-20">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-black text-[var(--text)] font-warike italic">Cultura Digital en tu Mesa</h2>
          <p className="text-[var(--text-muted)] font-bold text-lg uppercase tracking-widest text-balance">Tecnología invisible para resultados visibles</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <EducationCard 
            title="¿Cómo funciona?"
            desc="Gracias a su Chip NFC de alto rendimiento, tus clientes acercan el móvil y se les abre la página de reseñas en 5 segundos. ¡Así de fácil!"
            img="/images/edu_how_it_works.png"
          />
          <EducationCard 
            title="¿Qué es el NFC?"
            desc="Significa tecnología sin contacto. Los dispositivos Warique llevan incorporado un chip que detecta el teléfono y lo lleva directo a Google."
            img="/images/edu_what_is_nfc.png"
          />
          <EducationCard 
            title="¿Cómo empiezo?"
            desc="Paso 1: Coloca los dispositivos en tu local. Paso 2: Tus clientes empezarán a acercar el móvil y dejarte reseñas todos los días."
            img="/images/edu_how_to_start.png"
          />
        </div>
      </div>
    </section>
  );
}

function EducationCard({ title, desc, img }: { title: string, desc: string, img: string }) {
  return (
    <div className="bg-white rounded-[3.5rem] overflow-hidden border border-[var(--border)] shadow-sm group hover:shadow-2xl transition-all duration-500">
      <div className="h-64 overflow-hidden relative">
        <img src={img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
      </div>
      <div className="p-10 space-y-4 text-center">
        <h3 className="text-2xl font-black text-[var(--text)] font-warike italic">{title}</h3>
        <p className="text-[var(--text-muted)] font-bold text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <div className="py-8">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left group">
        <h3 className="text-xl font-black text-[var(--text)] font-warike group-hover:text-[var(--primary)] transition-colors">{question}</h3>
        <span className={`text-2xl transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}>+</span>
      </button>
      {isOpen && (
        <p className="mt-6 text-[var(--text-muted)] font-bold leading-relaxed animate-in slide-in-from-top-2 duration-300">{answer}</p>
      )}
    </div>
  );
}

function FAQSection() {
  return (
    <section className="py-32 px-8 bg-white">
      <div className="max-w-4xl mx-auto space-y-16">
        <h2 className="text-4xl md:text-5xl font-black text-[var(--text)] font-warike text-center italic">Preguntas Frecuentes</h2>
        <div className="divide-y divide-[var(--border)]">
          <FAQItem 
            question="¿Qué me incluye al adquirir los dispositivos Warique?"
            answer="Aparte de multiplicar tus reseñas en Google, podrás ver las estadísticas de rendimiento de todos tus dispositivos en nuestra Plataforma Web (Gratis), tendrás atención al cliente personalizada y acceso prioritario a todas las nuevas funciones dentro de Warique."
          />
          <FAQItem 
            question="No entiendo cómo funciona el NFC. ¿Es fácil de usar?"
            answer="Sí, es extremadamente sencillo. El cliente solo tiene que acercar el móvil al dispositivo Warique (igual que cuando paga con tarjeta) y esto le llevará automáticamente a dejar su reseña."
          />
          <FAQItem 
            question="¿Realmente los clientes usarán el sistema?"
            answer="Al eliminar toda la fricción, el proceso se vuelve tan fácil como un 'tap'. Esto hace que la tasa de conversión suba exponencialmente."
          />
          <FAQItem 
            question="¿El cliente necesita tener cuenta de Google para dejar la reseña?"
            answer="Para las reseñas de 4 y 5 estrellas, sí. Google requiere una cuenta (Gmail) para publicar en Maps. La buena noticia es que el 95% de los usuarios de smartphones ya tienen su sesión iniciada en su teléfono, por lo que el proceso es automático. Para quejas privadas (1 a 3 estrellas), no necesitan ninguna cuenta."
          />
        </div>
      </div>
    </section>
  );
}

// --- Main Page Component ---

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] texture-paper selection:bg-[var(--primary)] selection:text-white overflow-x-hidden">
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/70 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 md:h-24 flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-xl md:text-3xl font-black text-[var(--primary)] tracking-tighter font-warike">WARIKE</span>
            <span className="text-[6px] md:text-[9px] uppercase tracking-[0.2em] md:tracking-[0.4em] font-black text-[var(--text-muted)] -mt-1 whitespace-nowrap">Reputación & Sazón</span>
          </div>
          <div className="hidden md:flex items-center gap-12 text-sm font-black text-[var(--text-muted)] uppercase tracking-widest">
            <a href="#how-it-works" className="hover:text-[var(--primary)] transition-colors">Cómo Funciona</a>
            <a href="#products" className="hover:text-[var(--primary)] transition-colors">Stands Premium</a>
            <a href="#impact" className="hover:text-[var(--primary)] transition-colors">Impacto</a>
          </div>
          <Link href="/login" className="btn-primary text-[9px] md:text-xs uppercase tracking-[0.1em] md:tracking-[0.2em] px-4 py-2.5 md:px-10 md:py-4 rounded-xl md:rounded-2xl whitespace-nowrap">Acceso Partner</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-48 pb-32 px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8 md:space-y-10">
            <h1 className="sr-only">Software para aumentar reseñas en Google Maps con NFC para restaurantes - Warique</h1>
            <div className="inline-block px-6 py-2 bg-[var(--primary)]/10 rounded-full text-[var(--primary)] text-[10px] font-black uppercase tracking-[0.3em]">Lima • Ávila</div>
            <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-[var(--text)] tracking-tighter font-warike leading-[0.9]">La sazón <br/>es <span className="italic text-[var(--primary)]">tuya</span>, la reputación es <span className="underline decoration-[var(--secondary)] decoration-8 underline-offset-[12px]">nuestra</span>.</h2>
            <p className="text-lg md:text-xl text-[var(--text-muted)] font-bold max-w-xl leading-relaxed text-balance">Una mala reseña te cuesta 30 clientes al mes. Protege tu prestigio con nuestro <span className="text-[var(--text)]">filtrado inteligente</span> y multiplica tus 5 estrellas automáticamente.</p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mt-8">
              <a 
                href="https://wa.me/51902191948?text=Hola%20equipo%20Warique!%20Quiero%20registrar%20afiliar%20mi%20warike"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto btn-primary text-base md:text-lg px-8 py-5 md:px-12 md:py-6 rounded-3xl shadow-xl shadow-[var(--primary)]/20 uppercase tracking-widest text-center flex items-center justify-center"
              >
                Proteger mi Huarique Hoy
              </a>
              <a 
                href="#products"
                className="w-full sm:w-auto px-8 py-5 md:px-12 md:py-6 rounded-3xl border-4 border-[var(--text)] text-[var(--text)] font-black text-base md:text-lg hover:bg-[var(--text)] hover:text-white transition-all uppercase tracking-widest text-center flex items-center justify-center gap-3"
              >
                👀 Ver Stands Premium
              </a>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square bg-[var(--secondary)]/20 rounded-[5rem] absolute -inset-10 -rotate-6"></div>
            <div className="relative aspect-square rounded-[4rem] overflow-hidden border-8 border-white shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-700">
               <img src="/images/hero.png" alt="Premium Restaurant" className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-gradient-to-t from-[var(--text)]/80 to-transparent"></div>
               <div className="absolute bottom-10 left-10 text-white space-y-2">
                  <div className="flex gap-1 text-yellow-400 text-2xl">⭐⭐⭐⭐⭐</div>
                  <p className="font-warike text-3xl font-black italic">"Inigualable"</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      <div id="impact"><ComparisonSection /></div>

      <section id="how-it-works" className="py-32 px-8 bg-white/50 backdrop-blur-sm border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-[var(--text)] font-warike italic">El Escudo que tu Huarique Necesita</h2>
            <p className="text-[var(--text-muted)] font-bold text-lg uppercase tracking-widest text-balance">Atrapa las quejas en privado antes de que lleguen a Google</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <FeatureCard img="/images/touch_review.png" title="Touch & Review" desc="Tecnología NFC y QR integrada en stands de madera premium." />
            <FeatureCard img="/images/reputation_shield.png" title="Escudo de Reputación" desc="Las positivas a Google Maps. Las negativas se quedan en casa." />
            <FeatureCard img="/images/growth_chart.png" title="Crecimiento Real" desc="Aumenta tus estrellas en Google hasta un 40%." />
          </div>
        </div>
      </section>

      <ProductsSection />

      <EducationSection />
      <FAQSection />

      <section className="py-40 px-8 text-center bg-[var(--text)] text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10 space-y-10 md:space-y-12">
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-black font-warike italic text-balance">¿Listo para ser el #1?</h2>
          <a  
            href="https://wa.me/51902191948?text=Hola%20equipo%20Warique!%20Quiero%20llevar%20los%20stands%20inteligentes%20a%20mi%20local." 
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[var(--primary)] text-white px-16 py-8 rounded-[2.5rem] font-black text-xl hover:scale-110 transition-all shadow-2xl shadow-[var(--primary)]/20"
          >
            Llevar Warique a mi local
          </a>
          <p className="text-[var(--text-muted)] font-bold text-sm uppercase tracking-widest mt-6">Atención inmediata • Envíos a todo el país</p>
        </div>
      </section>
    </div>
  );
}
