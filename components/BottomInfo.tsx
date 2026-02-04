
import React from 'react';
import { Battery, Clock, Navigation } from 'lucide-react';
import { Destination } from '../types';

interface BottomInfoProps {
  destination?: Destination;
  onCancel: () => void;
}

const BottomInfo: React.FC<BottomInfoProps> = ({ destination, onCancel }) => {
  if (!destination) return null;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-sm md:max-w-xl px-4 z-40">
      <div className="bg-black/80 backdrop-blur-2xl border border-white/10 rounded-[1.5rem] md:rounded-[2.5rem] p-3 md:p-6 shadow-2xl flex items-center justify-between">
        <div className="flex items-center space-x-3 md:space-x-6">
          <div className="flex flex-col">
            <div className="text-[8px] md:text-sm font-bold text-white/40 uppercase tracking-widest hidden md:block">Chegada</div>
            <div className="flex items-baseline space-x-1">
              <span className="text-xl md:text-4xl font-bold text-white tracking-tight">14:42</span>
              <span className="text-xs md:text-lg font-semibold text-white/60">pm</span>
            </div>
          </div>
          
          <div className="h-6 md:h-10 w-[1px] bg-white/10" />

          <div className="flex items-center space-x-3 md:space-x-6">
            <div className="flex flex-col items-center">
              <Clock className="w-3 h-3 md:w-5 md:h-5 text-blue-400 mb-0.5 md:mb-1" />
              <span className="text-white font-bold text-xs md:text-lg">{destination.duration}</span>
            </div>
            <div className="flex flex-col items-center">
              <Navigation className="w-3 h-3 md:w-5 md:h-5 text-green-400 mb-0.5 md:mb-1" />
              <span className="text-white font-bold text-xs md:text-lg truncate max-w-[40px] md:max-w-none">{destination.distance}</span>
            </div>
            <div className="flex flex-col items-center mobile-hide">
              <Battery className="w-5 h-5 text-yellow-400 mb-1" />
              <span className="text-white font-bold text-lg">63%</span>
            </div>
          </div>
        </div>

        <button 
          onClick={onCancel}
          className="bg-red-500 hover:bg-red-600 transition-all text-white font-bold px-4 md:px-8 py-2 md:py-4 rounded-xl md:rounded-3xl shadow-lg active:scale-95 text-xs md:text-base ml-2"
        >
          Parar
        </button>
      </div>
    </div>
  );
};

export default BottomInfo;
