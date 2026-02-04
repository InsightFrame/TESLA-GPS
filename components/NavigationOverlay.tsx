
import React from 'react';
import { NavigationStep } from '../types';
import { ArrowUp, ArrowUpLeft, ArrowUpRight, RotateCcw } from 'lucide-react';

interface NavigationOverlayProps {
  step: NavigationStep;
  nextStep?: string;
}

const NavigationOverlay: React.FC<NavigationOverlayProps> = ({ step, nextStep }) => {
  const renderIcon = () => {
    switch (step.icon) {
      case 'left': return <ArrowUpLeft className="w-6 h-6 md:w-10 md:h-10 text-white" />;
      case 'right': return <ArrowUpRight className="w-6 h-6 md:w-10 md:h-10 text-white" />;
      case 'u-turn': return <RotateCcw className="w-6 h-6 md:w-10 md:h-10 text-white" />;
      default: return <ArrowUp className="w-6 h-6 md:w-10 md:h-10 text-white" />;
    }
  };

  return (
    <div className="absolute top-4 left-4 md:top-6 md:left-6 z-50 w-64 md:w-80 pointer-events-none">
      <div className="bg-black/70 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-3xl p-3 md:p-5 shadow-2xl flex items-center space-x-3 md:space-x-4">
        <div className="bg-blue-600 rounded-lg md:rounded-2xl p-2 md:p-3 shadow-lg shadow-blue-900/40">
          {renderIcon()}
        </div>
        <div className="flex-1">
          <div className="text-xl md:text-3xl font-bold text-white tracking-tight">{step.distance}</div>
          <div className="text-sm md:text-lg text-white/80 leading-tight font-medium truncate">{step.instruction}</div>
        </div>
      </div>
      
      {nextStep && (
        <div className="mt-2 bg-white/10 backdrop-blur-md border border-white/5 rounded-xl md:rounded-2xl p-2 md:p-3 shadow-lg flex items-center justify-between mobile-hide">
          <span className="text-white/60 text-[10px] md:text-sm font-medium uppercase tracking-wider ml-2">Próximo</span>
          <span className="text-white text-[10px] md:text-sm font-semibold truncate mr-2">{nextStep}</span>
        </div>
      )}
    </div>
  );
};

export default NavigationOverlay;
