import { useEffect, useState } from 'react';
import { loadFromStorage, saveToStorage } from '../utils/storage';
import { DEFAULT_THEME, THEME_STORAGE_KEY, themePresets } from './themeConfig';
import { ThemeContext } from './themeContextObject';

const availableThemeKeys = new Set(themePresets.map((theme) => theme.key));

const normalizeTheme = (preset) => (availableThemeKeys.has(preset) ? preset : DEFAULT_THEME);

const readStoredTheme = () => {
  const storedTheme = loadFromStorage(THEME_STORAGE_KEY, { preset: DEFAULT_THEME });
  return normalizeTheme(storedTheme?.preset);
};

const applyTheme = (preset) => {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.dataset.theme = normalizeTheme(preset);
};

export const ThemeProvider = ({ children }) => {
  const [preset, setPresetState] = useState(readStoredTheme);

  useEffect(() => {
    const nextPreset = normalizeTheme(preset);
    applyTheme(nextPreset);
    saveToStorage(THEME_STORAGE_KEY, { preset: nextPreset });
  }, [preset]);

  const setPreset = (nextPreset) => {
    setPresetState(normalizeTheme(nextPreset));
  };

  return (
    <ThemeContext.Provider value={{ preset, presets: themePresets, setPreset }}>
      {children}
    </ThemeContext.Provider>
  );
};

