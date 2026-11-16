import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import apiClient from '../services/client';
import { applyPublishedPlatformTheme } from '../theme/platformTheme';

const ThemeContext = createContext();
const THEME_STORAGE_KEY = 'ka-card-theme';
const isLiveApi = (import.meta.env.VITE_DATA_PROVIDER || 'mock').toLowerCase() === 'real';

const normalizeTheme = (value) => (value === 'light' || value === 'dark' ? value : null);

const getInitialTheme = () => {
  try {
    return normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY)) || 'dark';
  } catch {
    return 'dark';
  }
};

export const useTheme = () => useContext(ThemeContext);

export const usePlatformBrand = () => {
  const { publishedPlatformTheme } = useTheme();
  const brand = publishedPlatformTheme?.brand || {};
  return {
    platformName: typeof brand.platformName === 'string' && brand.platformName.trim()
      ? brand.platformName.trim() : 'Lool Store',
    logoPath: typeof brand.logoPath === 'string' ? brand.logoPath : null,
    slides: Array.isArray(brand.slides) ? brand.slides : [],
  };
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(getInitialTheme);
  const [publishedPlatformTheme, setPublishedPlatformTheme] = useState(null);

  const isDark = theme === 'dark';

  useEffect(() => {
    if (!isLiveApi) return undefined;
    let active = true;
    const loadPublishedTheme = async () => {
      try {
        const response = await apiClient.platformTheme.getPublished();
        if (active) setPublishedPlatformTheme(response?.published || null);
      } catch {
        if (active) setPublishedPlatformTheme(null);
      }
    };
    const handleRefresh = () => { void loadPublishedTheme(); };
    void loadPublishedTheme();
    window.addEventListener('platform-theme-published', handleRefresh);
    window.addEventListener('platform-theme-subscription-updated', handleRefresh);
    window.addEventListener('storage', handleRefresh);
    return () => {
      active = false;
      window.removeEventListener('platform-theme-published', handleRefresh);
      window.removeEventListener('platform-theme-subscription-updated', handleRefresh);
      window.removeEventListener('storage', handleRefresh);
    };
  }, []);

  useEffect(() => {
    applyPublishedPlatformTheme(publishedPlatformTheme, theme);
  }, [publishedPlatformTheme, theme]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.dataset.theme = theme;

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Storage can be blocked in private browsing; the visual theme still applies.
    }
  }, [isDark, theme]);

  const setTheme = useCallback((nextTheme) => {
    setThemeState((currentTheme) => {
      const resolvedTheme = typeof nextTheme === 'function' ? nextTheme(currentTheme) : nextTheme;
      return normalizeTheme(resolvedTheme) || currentTheme;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  }, [setTheme]);

  const value = useMemo(
    () => ({
      theme,
      isDark,
      toggleTheme,
      setTheme,
      publishedPlatformTheme,
    }),
    [theme, isDark, toggleTheme, setTheme, publishedPlatformTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
