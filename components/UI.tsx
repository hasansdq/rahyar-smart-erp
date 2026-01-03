import React from 'react';
import { BrainCircuit, Cpu } from 'lucide-react';

export const RahyarLogo = ({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg' | 'xl', className?: string }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 32,
    xl: 48
  };

  return (
    <div className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-500/30 overflow-hidden ${sizeClasses[size]} ${className}`}>
      {/* Background Effect */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
      <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-t from-black/20 to-transparent"></div>
      
      {/* Icons Layered */}
      <BrainCircuit size={iconSizes[size]} className="relative z-10" />
      
      {/* Glow */}
      <div className="absolute -bottom-2 -right-2 w-2/3 h-2/3 bg-white/20 blur-md rounded-full animate-pulse-slow"></div>
    </div>
  );
};

export const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [stage, setStage] = React.useState(0);

  React.useEffect(() => {
    setTimeout(() => setStage(1), 500); // Start logo animation
    setTimeout(() => setStage(2), 2500); // Fade out
    setTimeout(() => onFinish(), 3000); // Remove
  }, []);

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 transition-all duration-700 ${stage === 2 ? 'opacity-0 pointer-events-none scale-110' : 'opacity-100'}`}>
      <div className="relative">
        <div className={`absolute inset-0 bg-indigo-500/30 blur-3xl rounded-full transition-all duration-1000 ${stage >= 1 ? 'scale-150 opacity-100' : 'scale-0 opacity-0'}`}></div>
        <div className={`transform transition-all duration-1000 ${stage >= 1 ? 'scale-100 translate-y-0' : 'scale-50 translate-y-10 opacity-0'}`}>
            <RahyarLogo size="xl" className="shadow-2xl shadow-indigo-500/50" />
        </div>
      </div>
      
      <div className={`mt-8 text-center transition-all duration-1000 delay-300 ${stage >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
         <h1 className="text-3xl font-black text-white tracking-tight mb-2">سامانه هوشمند رهیار</h1>
         <div className="flex items-center justify-center gap-2 text-indigo-300 text-sm font-medium">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-fuchsia-500 rounded-full animate-bounce delay-200"></div>
            <span>در حال راه‌اندازی هسته مرکزی...</span>
         </div>
      </div>
    </div>
  );
};

export const ModernLoader = () => (
  <div className="loader-dots relative block w-20 h-5 mt-2">
    <div className="absolute top-0 w-3 h-3 rounded-full bg-indigo-600 dark:bg-indigo-400"></div>
    <div className="absolute top-0 w-3 h-3 rounded-full bg-indigo-600 dark:bg-indigo-400"></div>
    <div className="absolute top-0 w-3 h-3 rounded-full bg-indigo-600 dark:bg-indigo-400"></div>
    <div className="absolute top-0 w-3 h-3 rounded-full bg-indigo-600 dark:bg-indigo-400"></div>
  </div>
);

export const SidebarItem = ({ icon: Icon, label, active, onClick, badge }: any) => (
  <button
    onClick={onClick}
    className={`relative group flex items-center w-full px-5 py-3.5 mb-2 rounded-2xl transition-all duration-300 ease-out ${
      active 
        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 scale-[1.02]' 
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
    }`}
  >
    <div className={`p-1.5 rounded-xl transition-colors ${active ? 'bg-white/20' : 'group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20'}`}>
        <Icon 
        size={20} 
        className={`transition-transform duration-300 ${active ? '' : 'group-hover:scale-110 group-hover:-rotate-6 text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`} 
        strokeWidth={active ? 2.5 : 2}
        />
    </div>
    <span className={`ms-3 font-medium text-[0.9rem] tracking-wide ${active ? 'font-bold' : ''}`}>
      {label}
    </span>
    
    {badge && (
        <span className="ms-auto bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm animate-pulse font-bold">
            {badge}
        </span>
    )}
    
    {/* Active Indicator Dot - Only visible when active */}
    {active && <div className="absolute left-4 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>}
  </button>
);

export const Card = ({ children, className = '', onClick }: any) => (
  <div onClick={onClick} className={`bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors ${className}`}>
    {children}
  </div>
);

export const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
      <div className={`bg-white dark:bg-slate-900 rounded-3xl w-full ${maxWidth} overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700 m-auto animate-slideUp`}>
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
          <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
             <div className="w-1 h-5 bg-indigo-500 rounded-full"></div>
             {title}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-rose-500 w-8 h-8 flex items-center justify-center rounded-full hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">✕</button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};