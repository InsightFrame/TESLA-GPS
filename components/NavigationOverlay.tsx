
import React from 'react';
import { NavigationStep } from '../types';
import { ArrowUp, ArrowUpLeft, ArrowUpRight, RotateCcw, Compass } from 'lucide-react';

interface NavigationOverlayProps {
  step: NavigationStep;
  nextStep?: string;
}

const NavigationOverlay: React.FC<NavigationOverlayProps> = ({ step, nextStep }) => {
  const renderIcon = () => {
    switch (step.icon) {
      case 'left': return <ArrowUpLeft className="w-10 h-10 text-white" />;
      case 'right': return <ArrowUpRight className="w-10 h-10 text-white" />;
      case 'u-turn': return <RotateCcw className="w-10 h-10 text-white" />;
      default: return <ArrowUp className="w-10 h-10 text-white" />;
    }
  };

  return (
    <div className="absolute top-6 left-6 z-50 w-80">
      <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl flex items-center space-x-4">
        <div className="bg-blue-600 rounded-2xl p-3 shadow-lg shadow-blue-900/40">
          {renderIcon()}
        </div>
        <div className="flex-1">
          <div className="text-3xl font-bold text-white tracking-tight">{step.distance}</div>
          <div className="text-lg text-white/80 leading-tight font-medium">{step.instruction}</div>
        </div>
      </div>
      
      {nextStep && (
        <div className="mt-3 bg-white/10 backdrop-blur-md border border-white/5 rounded-2xl p-3 shadow-lg flex items-center justify-between">
          <span className="text-white/60 text-sm font-medium uppercase tracking-wider ml-2">Next</span>
          <span className="text-white text-sm font-semibold truncate mr-2">{nextStep}</span>
        </div>
      )}
    </div>
  );
};

export default NavigationOverlay;
