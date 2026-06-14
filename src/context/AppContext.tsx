import React, { createContext, useContext, useState, useEffect } from 'react';

interface AppContextProps {
  favorites: string[];
  completed: string[];
  activeProphetId: string | null;
  isBedtimeMode: boolean;
  toggleFavorite: (id: string) => void;
  toggleCompleted: (id: string) => void;
  setActiveProphetId: (id: string | null) => void;
  toggleBedtimeMode: () => void;
  resetProgress: () => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('prophet_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const [completed, setCompleted] = useState<string[]>(() => {
    const saved = localStorage.getItem('prophet_completed');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeProphetId, setActiveProphetId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem('prophet_active_id');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isBedtimeMode, setIsBedtimeMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('prophet_bedtime_mode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('prophet_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('prophet_completed', JSON.stringify(completed));
  }, [completed]);

  useEffect(() => {
    localStorage.setItem('prophet_active_id', activeProphetId ? JSON.stringify(activeProphetId) : '');
  }, [activeProphetId]);

  useEffect(() => {
    localStorage.setItem('prophet_bedtime_mode', JSON.stringify(isBedtimeMode));
    if (isBedtimeMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isBedtimeMode]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleCompleted = (id: string) => {
    setCompleted(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleBedtimeMode = () => {
    setIsBedtimeMode(prev => !prev);
  };

  const resetProgress = () => {
    setFavorites([]);
    setCompleted([]);
    setActiveProphetId(null);
    setIsBedtimeMode(false);
    localStorage.removeItem('prophet_favorites');
    localStorage.removeItem('prophet_completed');
    localStorage.removeItem('prophet_active_id');
    localStorage.removeItem('prophet_bedtime_mode');
  };

  return (
    <AppContext.Provider value={{
      favorites,
      completed,
      activeProphetId,
      isBedtimeMode,
      toggleFavorite,
      toggleCompleted,
      setActiveProphetId,
      toggleBedtimeMode,
      resetProgress
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
