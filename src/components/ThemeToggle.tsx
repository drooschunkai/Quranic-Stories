import React from 'react';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { isBedtimeMode, toggleBedtimeMode } = useAppContext();
  const { t, isRtl } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleBedtimeMode}
      title={t('bedtime_mode_desc')}
      id="bedtime-theme-toggle"
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border select-none cursor-pointer transition-all duration-300 font-bold text-xs ${
        isBedtimeMode
          ? 'bg-slate-900 border-slate-800 text-amber-300 hover:bg-slate-800/80 shadow-[0_0_12px_rgba(251,191,36,0.15)] hover:scale-105'
          : 'bg-amber-50/50 hover:bg-amber-100/60 border-amber-100 text-amber-700 hover:text-amber-800 shadow-2xs hover:scale-105'
      }`}
    >
      <div className="relative w-4.5 h-4.5 flex items-center justify-center shrink-0">
        {isBedtimeMode ? (
          <Moon size={14} fill="currentColor" className="animate-pulse text-amber-300" id="moon-animated-icon" />
        ) : (
          <Sun size={14} fill="currentColor" className="text-amber-500" id="sun-animated-icon" />
        )}
      </div>
      <span className="font-sans leading-none tracking-wide text-[11px] sm:text-xs">
        {t('bedtime_mode')}
      </span>
    </button>
  );
};

export default ThemeToggle;
