'use client';

import React, { useEffect, useState } from 'react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { businessApi } from '../../../lib/api-client';
import { toast } from 'sonner';

export default function BotSettingsPage() {
  const { activePlaceId } = useRestaurant();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    isActive: true,
    botName: 'Wuarike Assistant',
    personality: 'Amigable y servicial',
    instructions: 'Eres un asistente experto en el restaurante. Ayuda a los clientes con el menú y reservas.',
    welcomeMessage: '¡Hola! Soy tu asistente de Wuarike. ¿En qué puedo ayudarte hoy?'
  });

  useEffect(() => {
    if (!activePlaceId) { setIsLoading(false); return; }
    setIsLoading(true);
    businessApi.getBotSettings(activePlaceId)
      .then(data => {
        if (data) setSettings(data);
      })
      .catch(err => console.error('Error fetching bot settings:', err))
      .finally(() => setIsLoading(false));
  }, [activePlaceId]);

  const handleSave = async () => {
    if (!activePlaceId) return;
    setIsSaving(true);
    try {
      await businessApi.updateBotSettings(activePlaceId, settings);
      toast.success('Configuración del bot actualizada correctamente');
    } catch (err) {
      toast.error('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-20 text-center font-bold text-gray-400">Cargando cerebro del bot...</div>;

  return (
    <div className="max-w-4xl space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-[#1A1A1A] tracking-tight">Configuración del Bot</h1>
          <p className="text-[#6B7280] font-medium">Personaliza la inteligencia artificial que atiende a tus clientes.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#1A1A1A] text-white px-8 py-4 rounded-2xl font-bold shadow-xl hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-50"
        >
          {isSaving ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150 fill-mode-both">
        <div className="md:col-span-8 space-y-8">
          {/* Main Config */}
          <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 space-y-6">
            <div className="flex justify-between items-center bg-[#F7F8FA] p-6 rounded-[2rem]">
              <div>
                <p className="font-black text-[#1A1A1A]">Estado del Asistente</p>
                <p className="text-xs text-gray-400 font-bold">Activa o desactiva la atención automática</p>
              </div>
              <button 
                onClick={() => setSettings({...settings, isActive: !settings.isActive})}
                className={`w-14 h-8 rounded-full transition-all relative ${settings.isActive ? 'bg-[#F26122]' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings.isActive ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nombre del Bot</label>
                <input 
                  type="text" 
                  value={settings.botName}
                  onChange={(e) => setSettings({...settings, botName: e.target.value})}
                  className="w-full bg-[#F7F8FA] border-none rounded-2xl py-4 px-6 font-bold text-sm outline-none focus:ring-4 focus:ring-[#F26122]/10 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Instrucciones / Prompt</label>
                <textarea 
                  value={settings.instructions}
                  onChange={(e) => setSettings({...settings, instructions: e.target.value})}
                  className="w-full bg-[#F7F8FA] border-none rounded-[2rem] py-4 px-6 font-bold text-sm outline-none focus:ring-4 focus:ring-[#F26122]/10 transition-all min-h-[150px] resize-none"
                  placeholder="Ej: Eres un experto en cocina peruana..."
                />
              </div>
            </div>
          </section>

          <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 space-y-4">
             <h3 className="font-black text-[#1A1A1A] flex items-center gap-2">
               <span className="text-xl">👋</span> Mensaje de Bienvenida
             </h3>
             <input 
                type="text" 
                value={settings.welcomeMessage}
                onChange={(e) => setSettings({...settings, welcomeMessage: e.target.value})}
                className="w-full bg-[#F7F8FA] border-none rounded-2xl py-4 px-6 font-bold text-sm outline-none focus:ring-4 focus:ring-[#F26122]/10 transition-all"
              />
          </section>
        </div>

        <div className="md:col-span-4">
          <div className="sticky top-10 space-y-6">
            <div className="bg-[#1A1A1A] p-8 rounded-[3rem] shadow-2xl text-white relative overflow-hidden">
               <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#F26122] rounded-full blur-3xl opacity-20" />
               <h3 className="font-black uppercase tracking-widest text-[10px] text-gray-500 mb-6">Vista Previa</h3>
               
               <div className="space-y-4">
                 <div className="flex gap-3 justify-end">
                   <div className="bg-[#333] p-4 rounded-2xl rounded-tr-none text-xs font-bold max-w-[80%]">
                     ¿Tienen opciones vegetarianas?
                   </div>
                 </div>
                 <div className="flex gap-3">
                   <div className="w-8 h-8 bg-[#F26122] rounded-full flex items-center justify-center text-xs">🤖</div>
                   <div className="bg-[#F26122] p-4 rounded-2xl rounded-tl-none text-xs font-bold max-w-[80%]">
                     ¡Claro! Contamos con un Tacu Tacu de Vegetales increíble y ensalada de quinua orgánica.
                   </div>
                 </div>
               </div>

               <div className="mt-8 pt-8 border-t border-white/10">
                 <div className="flex items-center gap-4">
                   <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                   <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">IA Procesando</span>
                 </div>
               </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100">
               <p className="text-xs font-bold text-blue-600 leading-relaxed">
                 TIP: Describe la "personalidad" del bot (ej: tradicional, moderno, gracioso) para que conecte mejor con tu marca.
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
