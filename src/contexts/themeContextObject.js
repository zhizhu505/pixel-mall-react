import { createContext } from 'react';
import { DEFAULT_THEME, themePresets } from './themeConfig';

export const ThemeContext = createContext({
  preset: DEFAULT_THEME,
  presets: themePresets,
  setPreset: () => {},
});
