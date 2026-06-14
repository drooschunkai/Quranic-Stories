import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../types';
import { Globe, ChevronDown, Check } from 'lucide-react';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage, isRtl } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options: { code: Language; label: string; flag: string; nativeLabel: string }[] = [
    { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
    { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', flag: '🕋' },
    { code: 'sv', label: 'Swedish', nativeLabel: 'Svenska', flag: '🇸🇪' },
    { code: 'de', label: 'German', nativeLabel: 'Deutsch', flag: '🇩🇪' }
  ];

  const currentOption = options.find((opt) => opt.code === language) || options[0];

  const groups = [
    {
      id: 'original',
      title: isRtl ? 'النص المبارك الأصيل' : 'Original Sacred text',
      items: options.filter((o) => o.code === 'ar')
    },
    {
      id: 'translation',
      title: isRtl ? 'لغات الترجمات' : 'Story Translations',
      items: options.filter((o) => o.code !== 'ar')
    }
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef} id="language-selector-dropdown-wrapper">
      {/* Target trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        id="language-dropdown-trigger"
        className={`flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-emerald-50/50 shadow-xs border border-emerald-100 rounded-full select-none cursor-pointer text-xs font-bold text-gray-700 transition-all ${
          isOpen ? 'ring-2 ring-emerald-500/20 bg-emerald-50/35 border-emerald-300' : ''
        }`}
      >
        <span className="text-emerald-650 animate-pulse" id="globe-indicator"><Globe size={14} /></span>
        <span className="text-sm shrink-0 font-sans" id="current-flag-emoji">{currentOption.flag}</span>
        <span className="text-xs font-sans text-gray-700 shrink-0" id="current-lang-label">
          {currentOption.nativeLabel}
        </span>
        <ChevronDown size={12} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Grouped dropdown items box */}
      {isOpen && (
        <div 
          className={`absolute mt-2 w-48 rounded-2xl bg-white border border-emerald-100 p-2 shadow-lg ring-1 ring-black/5 z-50 animate-fade-in ${
            isRtl ? 'left-0' : 'right-0'
          }`}
          id="language-dropdown-options-box"
        >
          <div className="flex flex-col gap-2" role="menu" aria-orientation="vertical">
            {groups.map((group, groupIdx) => (
              <div key={group.id} className="flex flex-col gap-1" id={`lang-group-${group.id}`}>
                {groupIdx > 0 && <div className="border-t border-emerald-100/50 my-1" />}
                <span className="px-2 text-[10px] font-bold text-emerald-800/70 uppercase tracking-widest font-sans text-start">
                  {group.title}
                </span>
                {group.items.map((opt) => {
                  const isSelected = language === opt.code;
                  return (
                    <button
                      key={opt.code}
                      id={`lang-opt-${opt.code}`}
                      onClick={() => {
                        setLanguage(opt.code);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between text-left px-2 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-155 ${
                        isSelected 
                          ? 'bg-emerald-600 text-white font-bold' 
                          : 'text-gray-700 hover:bg-emerald-50/70 hover:text-emerald-800'
                      }`}
                      role="menuitem"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-sans" id={`opt-flag-${opt.code}`}>{opt.flag}</span>
                        <span className="font-sans" id={`opt-label-${opt.code}`}>{opt.nativeLabel}</span>
                      </div>
                      {isSelected && <Check size={11} className="shrink-0 text-white" id={`opt-check-${opt.code}`} />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
