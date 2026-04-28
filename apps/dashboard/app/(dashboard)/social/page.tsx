'use client';

import React, { useState } from 'react';

export default function SocialPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Mock comments
  const mockComments = [
    { id: 1, user: '@foodie_lima', text: '¿A qué hora abren los domingos?', time: 'Hace 5 min', postImg: '/images/hero.png', aiReplied: true, aiResponse: '¡Hola! Los domingos abrimos de 12:00 PM a 5:00 PM. ¡Te esperamos!' },
    { id: 2, user: '@carlos.m', text: '¡El ceviche estuvo increíble!', time: 'Hace 2 horas', postImg: '/images/interior.png', aiReplied: true, aiResponse: '¡Muchas gracias Carlos! Nos alegra que hayas disfrutado de nuestra sazón.' },
    { id: 3, user: '@mariana_99', text: 'Tienen opciones vegetarianas?', time: 'Hace 1 día', postImg: '/images/hero.png', aiReplied: false, aiResponse: '' },
  ];

  const handleConnect = () => {
    setIsConnecting(true);
    // Simulate OAuth flow
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
    }, 1500);
  };

  return (
    <div className="max-w-6xl space-y-16 pb-32">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-b-2 border-[var(--border)] pb-10">
        <div className="space-y-2">
          <h1 className="text-5xl font-black text-[var(--text)] tracking-tight font-warike">Reputación Social</h1>
          <p className="text-[var(--text-muted)] font-bold text-lg max-w-xl leading-snug">
            Gestiona los comentarios de Instagram y deja que la IA responda por ti en tiempo real.
          </p>
        </div>
        {isConnected && (
          <div className="flex items-center gap-3 bg-green-50 text-green-700 px-6 py-3 rounded-2xl border border-green-200">
            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            <span className="font-black text-xs uppercase tracking-widest">Conectado a @tu_huarique</span>
          </div>
        )}
      </header>

      {!isConnected ? (
        <section className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-[var(--border)] text-center space-y-8 max-w-3xl mx-auto">
          <div className="w-24 h-24 mx-auto rounded-[2rem] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center shadow-xl shadow-pink-500/30">
             <span className="text-white text-5xl">📷</span>
          </div>
          <div className="space-y-4">
             <h2 className="text-3xl font-black text-[var(--text)] font-warike">Conecta tu Instagram Profesional</h2>
             <p className="text-[var(--text-muted)] font-bold">Autoriza a Warique para leer y responder automáticamente los comentarios de tus clientes 24/7.</p>
          </div>
          <button 
            onClick={handleConnect}
            disabled={isConnecting}
            className="btn-primary px-12 py-5 rounded-2xl text-sm tracking-widest w-full max-w-sm mx-auto disabled:opacity-50"
          >
            {isConnecting ? 'CONECTANDO...' : 'VINCULAR CUENTA AHORA'}
          </button>
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-6">Requiere cuenta de empresa vinculada a Facebook</p>
        </section>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Comments Feed */}
          <div className="lg:col-span-7 space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-[var(--text)] font-warike">Comentarios Recientes</h3>
              <span className="bg-gray-100 text-gray-500 text-xs font-black px-4 py-2 rounded-xl">Últimas 24h</span>
            </div>

            <div className="space-y-6">
              {mockComments.map(comment => (
                <div key={comment.id} className="bg-white p-6 rounded-[2.5rem] border border-[var(--border)] shadow-sm space-y-4 group">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 border border-gray-100">
                      <img src={comment.postImg} alt="Post" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-black text-sm text-[var(--text)]">{comment.user}</span>
                        <span className="text-[10px] font-bold text-gray-400">{comment.time}</span>
                      </div>
                      <p className="text-sm font-bold text-gray-600">{comment.text}</p>
                    </div>
                  </div>

                  {comment.aiReplied ? (
                    <div className="ml-16 bg-[var(--background)] p-4 rounded-2xl border-l-4 border-[var(--primary)] space-y-2">
                       <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Respuesta IA</span>
                       </div>
                       <p className="text-xs font-bold text-gray-600">{comment.aiResponse}</p>
                    </div>
                  ) : (
                    <div className="ml-16 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <input type="text" placeholder="Responder manualmente..." className="input-premium py-2 text-xs flex-1" />
                      <button className="bg-[var(--text)] text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest">Enviar</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: AI Bot Settings */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-[var(--border)] space-y-8 sticky top-10">
               <div className="flex items-center gap-4">
                 <div className="w-14 h-14 rounded-2xl bg-[var(--primary)] flex items-center justify-center text-3xl shadow-lg shadow-[var(--primary)]/20">🤖</div>
                 <div>
                   <h3 className="text-2xl font-black text-[var(--text)] font-warike">Motor de IA</h3>
                   <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Reglas de auto-respuesta</p>
                 </div>
               </div>

               <div className="space-y-6 pt-4">
                 <ToggleSetting 
                   title="Preguntas Frecuentes" 
                   desc="Responde a dudas sobre horarios, ubicación y menú." 
                   defaultChecked={true} 
                 />
                 <ToggleSetting 
                   title="Agradecimientos" 
                   desc="Responde automáticamente a elogios y buenos comentarios." 
                   defaultChecked={true} 
                 />
                 <ToggleSetting 
                   title="Derivar Quejas" 
                   desc="Pide que envíen un Mensaje Directo (DM) si el comentario es negativo." 
                   defaultChecked={true} 
                 />
                 <ToggleSetting 
                   title="Responder con Precios" 
                   desc="Revelar precios de la carta en los comentarios si lo solicitan." 
                   defaultChecked={false} 
                 />
               </div>

               <div className="pt-8 border-t border-[var(--border)] space-y-4">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-2">Personalidad del Bot</label>
                 <select className="input-premium w-full cursor-pointer">
                   <option>Amigable y Cercano (Ej: ¡Hola! Claro que sí...)</option>
                   <option>Formal y Profesional (Ej: Estimado cliente...)</option>
                   <option>Jovial y Moderno (Ej: ¡Qué tal bro!...)</option>
                 </select>
               </div>
               
               <button className="w-full btn-primary px-8 py-5 rounded-2xl text-xs tracking-widest">
                 GUARDAR REGLAS DE IA
               </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

function ToggleSetting({ title, desc, defaultChecked }: { title: string, desc: string, defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div className="flex justify-between items-center p-5 bg-[var(--background)] rounded-3xl border border-[var(--border)] cursor-pointer hover:border-gray-300 transition-colors" onClick={() => setChecked(!checked)}>
      <div className="flex-1 pr-4">
        <p className="font-black text-[var(--text)] text-sm">{title}</p>
        <p className="text-[10px] font-bold text-[var(--text-muted)] mt-1">{desc}</p>
      </div>
      <div className={`w-12 h-6 rounded-full relative transition-all ${checked ? 'bg-[var(--primary)]' : 'bg-gray-200'}`}>
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all ${checked ? 'left-7' : 'left-1'}`}></div>
      </div>
    </div>
  );
}
