
import React, { useEffect, useState } from 'react';
import { X, Battery, Zap, Gauge, Lock, Move3d, MousePointer2, AlertCircle } from 'lucide-react';

interface CarVisualizerProps {
  onClose: () => void;
}

const CarVisualizer: React.FC<CarVisualizerProps> = ({ onClose }) => {
  const [modelLoaded, setModelLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Injeção dinâmica do script model-viewer
  useEffect(() => {
    const scriptUrl = "https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js";
    
    // Verifica se já existe para não duplicar
    if (!document.querySelector(`script[src="${scriptUrl}"]`)) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = scriptUrl;
      document.head.appendChild(script);
    }
  }, []);

  // Cast custom element to any to avoid global JSX namespace pollution
  const ModelViewer = 'model-viewer' as any;

  // URL corrigida para acesso direto raw (evita redirects que podem causar CORS issues em alguns browsers)
  const modelUrl = "https://raw.githubusercontent.com/InsightFrame/PEUGEOT-3D/main/peugeot_e-2008-v2.glb";

  return (
    <div className="fixed inset-0 z-[200] bg-[#05070a] flex items-center justify-center overflow-hidden animate-in fade-in duration-500">
      
      {/* --- Ambient Lighting & Background --- */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#111] to-black pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
      
      {/* --- Close Button --- */}
      <button 
        onClick={onClose}
        className="absolute top-8 right-8 z-50 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-all backdrop-blur-md border border-white/10 group"
      >
        <X className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* --- Header / Title --- */}
      <div className="absolute top-12 left-12 z-40 pointer-events-none select-none">
        <h1 className="text-6xl font-black text-white italic tracking-tighter uppercase drop-shadow-[0_0_25px_rgba(255,255,255,0.2)]">
          E2008 <span className="text-blue-500">GT</span>
        </h1>
        <div className="flex items-center space-x-2 mt-2 text-white/40 font-mono text-sm tracking-widest uppercase">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>3D View • Online</span>
        </div>
      </div>

      {/* --- 3D Scene Container --- */}
      <div className="relative w-full h-full flex items-center justify-center">
        
        {/* Floor Effect (Decorative) */}
        <div className="absolute bottom-[10%] w-[60%] h-[20%] bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 w-full h-[50vh] bg-[linear-gradient(to_top,#000_0%,transparent_100%)] pointer-events-none z-10" />

        {/* --- MODEL VIEWER IMPLEMENTATION --- */}
        {/* 
            Configurações Tesla Style:
            - shadow-intensity="1.5": Sombra forte para "ancorar" o carro no chão.
            - exposure="1.2": Ajuste de luz para destacar o preto do carro sem estourar.
            - auto-rotate: Rotação automática suave.
            - camera-controls: Permite zoom e rotação manual.
            - environment-image="neutral": Iluminação de estúdio equilibrada.
        */}
        <ModelViewer
          src={modelUrl}
          alt="Peugeot E-2008 GT 3D Model"
          auto-rotate
          camera-controls
          shadow-intensity="1.5"
          shadow-softness="0.8"
          exposure="1.2" 
          environment-image="neutral"
          camera-orbit="45deg 75deg 4.5m"
          min-camera-orbit="auto auto 3m"
          max-camera-orbit="auto auto 6m"
          interpolation-decay="200"
          style={{ width: '100%', height: '100%', outline: 'none' }}
          onLoad={() => setModelLoaded(true)}
          onError={() => setLoadError(true)}
        >
          {/* Slot para carregamento (opcional, aparece antes do modelo carregar) */}
          <div slot="poster" className="w-full h-full flex items-center justify-center text-white/20">
             {/* Poster transparente enquanto carrega */}
          </div>
        </ModelViewer>

        {/* Error State */}
        {loadError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
             <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
             <div className="text-white font-bold text-lg">Erro ao carregar modelo 3D</div>
             <div className="text-white/50 text-sm mt-2">Verifique a conexão de internet</div>
          </div>
        )}

      </div>

      {/* --- Floating Stats (Overlay UI) --- */}
      {/* Esquerda */}
      <div className={`absolute left-0 top-1/2 -translate-y-1/2 ml-4 md:ml-12 space-y-4 pointer-events-none transition-all duration-1000 ${modelLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
         <StatCard icon={Battery} label="Bateria" value="84%" sub="340 km" color="text-green-400" />
         <StatCard icon={Zap} label="Consumo" value="14.2" sub="kWh/100" color="text-yellow-400" />
      </div>

      {/* Direita */}
      <div className={`absolute right-0 top-1/2 -translate-y-1/2 mr-4 md:mr-12 space-y-4 pointer-events-none transition-all duration-1000 ${modelLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
         <StatCard icon={Gauge} label="Pressão" value="2.4" sub="Bar" color="text-white" />
         <StatCard icon={Lock} label="Status" value="OK" sub="Trancado" color="text-blue-400" />
      </div>

      {/* --- Interaction Hint --- */}
      <div className={`absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center space-x-3 opacity-60 pointer-events-none transition-opacity duration-1000 ${modelLoaded ? 'opacity-60' : 'opacity-0'}`}>
         <Move3d className="w-5 h-5 text-blue-400 animate-pulse" />
         <span className="text-[10px] text-white uppercase tracking-[0.2em] font-bold">Toque para Girar</span>
         <MousePointer2 className="w-5 h-5 text-white/50" />
      </div>

    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, sub, color }: any) => (
  <div className="bg-black/20 backdrop-blur-md border border-white/5 p-4 rounded-xl w-40 md:w-48 shadow-lg">
    <div className="flex justify-between items-start mb-1">
      <Icon className={`w-5 h-5 ${color}`} />
      <span className="text-[9px] text-white/40 uppercase tracking-widest font-bold">{label}</span>
    </div>
    <div className="text-2xl md:text-3xl font-bold text-white tracking-tight">{value}</div>
    <div className="text-[10px] md:text-xs text-white/50 font-medium">{sub}</div>
  </div>
);

export default CarVisualizer;
