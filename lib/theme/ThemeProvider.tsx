import React, { createContext, useContext } from 'react';
import type { AthleticOSResolvedTheme } from '../athleticos';

const ThemeContext = createContext<AthleticOSResolvedTheme | null>(null);

export function ThemeProvider({
  theme,
  children,
}: {
  theme: AthleticOSResolvedTheme;
  children: React.ReactNode;
}) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const theme = useContext(ThemeContext);

  if (!theme) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }

  return theme;
}
