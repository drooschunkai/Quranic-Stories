import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Play, Pause, Square, Volume2, VolumeX, Sliders } from 'lucide-react';

interface AudioPlayerProps {
  title: string;
  introduction: string;
  paragraphs: string[];
  lessons?: string[];
  dua?: {
    arabic: string;
    transliteration: string;
    translation: Record<string, string>;
  };
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ title, introduction, paragraphs, lessons, dua }) => {
  const { language, t, isRtl } = useLanguage();
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [rate, setRate] = useState<number>(1); // Speed of narration
  const [supported, setSupported] = useState<boolean>(true);
  
  // Custom states for choosing what sections to narration-read
  const [includeStory, setIncludeStory] = useState<boolean>(true);
  const [includeLessons, setIncludeLessons] = useState<boolean>(true);
  const [includeDua, setIncludeDua] = useState<boolean>(true);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      
      // Some standard browser engines (like Google Chrome) load voices asynchronously in the background.
      // Keeping a simple voice changed hook ensures internal cache stays active.
      const handleVoicesChanged = () => {
        if (synthRef.current) {
          synthRef.current.getVoices();
        }
      };
      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      };
    } else {
      setSupported(false);
    }

    return () => {
      stopVoice();
    };
  }, []);

  // Whenever content or option checkboxes change, stop the active voice to prevent audio overlaps
  useEffect(() => {
    stopVoice();
  }, [title, paragraphs, language, lessons, dua, includeStory, includeLessons, includeDua]);

  const speakText = () => {
    if (!synthRef.current || !supported) return;

    // Stop anything currently speaking first
    synthRef.current.cancel();

    // Compile dynamic spoken narration queue
    const textParts: string[] = [];

    if (includeStory) {
      textParts.push(`${title}. ${introduction}. ${paragraphs.join(' ')}`);
    }

    if (includeLessons && lessons && lessons.length > 0) {
      const lessonsHeading = t('moral_lessons') || 'Moral Lessons for Us';
      const lessonLabel = t('moral_badge') || 'Lesson';
      const lessonsText = lessons.map((lesson, idx) => `${lessonLabel} ${idx + 1}: ${lesson}`).join('. ');
      textParts.push(`${lessonsHeading}. ${lessonsText}`);
    }

    if (includeDua && dua) {
      const duaHeading = t('original_dua') || 'Beautiful Supplication';
      if (language === 'ar') {
        textParts.push(`${duaHeading}. ${dua.arabic}`);
      } else {
        const translitStr = `${t('dua_transliteration') || 'Transliteration'}: ${dua.transliteration}`;
        const translationValue = dua.translation[language] || dua.translation['en'];
        const transStr = `${t('dua_translation') || 'Meaning'}: ${translationValue}`;
        textParts.push(`${duaHeading}. ${translitStr}. ${transStr}`);
      }
    }

    if (textParts.length === 0) return;

    const fullText = textParts.join(' ');
    const utterance = new SpeechSynthesisUtterance(fullText);
    utteranceRef.current = utterance;
    (window as any)._activeUtterance = utterance; // Prevent garbage collection of active utterance in standard browsers

    // Pair languages with correct global standard codes
    const langMapRef: Record<string, string> = {
      en: 'en-US',
      ar: 'ar-SA',
      sv: 'sv-SE',
      de: 'de-DE'
    };

    utterance.lang = langMapRef[language] || 'en-US';
    utterance.rate = rate;
    utterance.pitch = 1.0; // Pleasant standard pitch for smooth human likeness

    // Dynamic High-Fidelity Human-Like voice selection:
    // Scores and prefers advanced ML neural/premium voices on macOS/iOS, Windows & Google WebSpeech APIs
    const voices = synthRef.current.getVoices();
    const targetLangCode = langMapRef[language] || 'en-US';
    
    // Strict language code check (e.g. splitting by hyphen) to prevent wrong-language matches (like Bengali 'ben' matching English 'en')
    let matchedVoices = voices.filter(v => {
      const normalizedLang = v.lang.replace('_', '-').toLowerCase();
      const firstPart = normalizedLang.split('-')[0];
      return normalizedLang === targetLangCode.toLowerCase() || firstPart === language.toLowerCase();
    });

    // Highly protective fallback: prefer local system voices over online ones to avoid network-lookup failures inside iframe containers
    const localMatched = matchedVoices.filter(v => v.localService);
    if (localMatched.length > 0) {
      matchedVoices = localMatched;
    }

    if (matchedVoices.length > 0) {
      const scoredVoices = matchedVoices.map(v => {
        let score = 0;
        const nameLower = v.name.toLowerCase();

        // Give high prioritization to modern native/natural voice synthesisers
        if (nameLower.includes('natural')) score += 100;
        if (nameLower.includes('neural')) score += 90;
        if (nameLower.includes('premium')) score += 85; 
        if (nameLower.includes('google') && v.localService) score += 50; // Google default local voice
        if (nameLower.includes('samantha') || nameLower.includes('daniel') || nameLower.includes('serena')) score += 70; // MacOS/iOS standard natural voices
        if (nameLower.includes('microsoft')) score += 40; // Microsoft default TTS
        if (nameLower.includes('high')) score += 30; // High frequency profiles
        if (v.localService) score += 300; // Enormous premium bonus for local / offline-ready system voices to secure reliability in safe sandbox environments

        return { voice: v, score };
      });

      scoredVoices.sort((a, b) => b.score - a.score);
      utterance.voice = scoredVoices[0].voice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      (window as any)._activeUtterance = null;
    };

    utterance.onerror = (e) => {
      if (e.error !== 'interrupted') {
        console.error('SpeechSynthesis error:', e);
        setIsPlaying(false);
        setIsPaused(false);
        (window as any)._activeUtterance = null;
      }
    };

    // A tiny buffer delay helps the synthesis engine transition on state cleanups while preserving user gesture active duration
    setTimeout(() => {
      if (synthRef.current && utteranceRef.current === utterance) {
        synthRef.current.speak(utterance);
      }
    }, 15);
  };

  const pauseVoice = () => {
    if (synthRef.current && isPlaying) {
      if (isPaused) {
        synthRef.current.resume();
        setIsPaused(false);
      } else {
        synthRef.current.pause();
        setIsPaused(true);
      }
    }
  };

  const stopVoice = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsPlaying(false);
      setIsPaused(false);
      (window as any)._activeUtterance = null;
    }
  };

  const changeSpeed = (newRate: number) => {
    setRate(newRate);
    if (isPlaying) {
      stopVoice();
      setTimeout(() => {
        speakText();
      }, 60);
    }
  };

  if (!supported) {
    return (
      <div className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-100 flex items-center gap-2" id="audio-player-unsupported">
        <VolumeX size={14} />
        <span>{t('audio_unsupported')}</span>
      </div>
    );
  }

  return (
    <div 
      className="p-4 bg-emerald-50/65 rounded-2xl border border-emerald-100/80 flex flex-col gap-3 shadow-xs select-none text-start animate-fade-in" 
      id="audio-player-panel"
    >
      {/* Upper Area: Info, Audio Navigation and Speed dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3" id="audio-primary-row">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-emerald-600/10 flex items-center justify-center text-emerald-700 animate-pulse">
            <Volume2 size={20} id="volume-mic-icon" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-emerald-950 font-sans" id="audio-heading">
              {isPlaying ? t('playing_audio') || 'Narrating Story...' : t('play_audio')}
            </h4>
            <span className="text-xs text-emerald-800/80 block leading-tight font-sans">
              {t('app_title')} • {language.toUpperCase()} Voice
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:self-center" id="audio-gui-controls">
          {/* Main trigger btn */}
          {!isPlaying ? (
            <button
              onClick={speakText}
              id="speak-btn-play"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-semibold cursor-pointer transition-all shadow-xs hover:scale-105"
            >
              <Play size={14} />
              <span>{t('play_audio')}</span>
            </button>
          ) : (
            <>
              {/* Pause Trigger */}
              <button
                onClick={pauseVoice}
                id="speak-btn-pause"
                className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full text-xs font-semibold cursor-pointer transition-all shadow-xs"
              >
                <Pause size={14} />
                <span>{isPaused ? 'Resume' : t('pause_audio')}</span>
              </button>

              {/* Stop Trigger */}
              <button
                onClick={stopVoice}
                id="speak-btn-stop"
                className="flex items-center gap-1 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full text-xs font-semibold cursor-pointer transition-all shadow-xs"
              >
                <Square size={14} />
                <span>{t('stop_audio')}</span>
              </button>
            </>
          )}

          {/* Speed Dial Dialect */}
          <div className="flex items-center gap-1.5 bg-white/90 border border-emerald-100/60 rounded-full py-1 px-2.5 shadow-2xs ml-1" id="audio-speed-control">
            <Sliders size={12} className="text-emerald-700" />
            <span className="text-2xs font-sans text-gray-500">{t('voice_speed')}:</span>
            <select
              value={rate}
              onChange={(e) => changeSpeed(parseFloat(e.target.value))}
              id="speed-selector"
              className="text-xs font-semibold text-emerald-800 bg-transparent outline-none cursor-pointer border-none p-0 pr-1 text-4xs sm:text-xs"
            >
              <option value="0.8">0.8x</option>
              <option value="1.0">1.0x</option>
              <option value="1.15">1.15x</option>
              <option value="1.3">1.3x</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dynamic settings choices: include Story / lessons / supplications */}
      {(lessons || dua) && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-100/40 text-xs text-emerald-800" id="audio-toggles-container">
          <span className="text-[11px] font-sans text-emerald-800/80 font-semibold mr-1 uppercase tracking-wider">
            {t('narrate_options')}:
          </span>
          
          {/* Story switch */}
          <button
            onClick={() => setIncludeStory(!includeStory)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold transition-all cursor-pointer ${
              includeStory 
                ? 'bg-emerald-600/15 text-emerald-900 border-emerald-300' 
                : 'bg-white/45 text-gray-400 border-gray-150 hover:bg-white/80'
            }`}
          >
            <span>📖</span> <span>{t('narrate_story_toggle')}</span>
          </button>

          {/* Lessons list check */}
          {lessons && lessons.length > 0 && (
            <button
              onClick={() => setIncludeLessons(!includeLessons)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                includeLessons 
                  ? 'bg-emerald-600/15 text-emerald-900 border-emerald-300' 
                  : 'bg-white/45 text-gray-400 border-gray-150 hover:bg-white/80'
              }`}
            >
              <span>💡</span> <span>{t('narrate_lessons_toggle')}</span>
            </button>
          )}

          {/* Prophetic Dua check */}
          {dua && (
            <button
              onClick={() => setIncludeDua(!includeDua)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                includeDua 
                  ? 'bg-emerald-600/15 text-emerald-900 border-emerald-300' 
                  : 'bg-white/45 text-gray-400 border-gray-150 hover:bg-white/80'
              }`}
            >
              <span>🤲</span> <span>{t('narrate_dua_toggle')}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AudioPlayer;
