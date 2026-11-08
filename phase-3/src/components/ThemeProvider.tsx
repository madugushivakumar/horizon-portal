/**
 * ThemeProvider — manages light/dark mode without hydration flash
 * src/components/ThemeProvider.tsx
 */

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggleTheme: () => {},
  setTheme: () => {},
});

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};

/** Inline script applied before React hydrates to prevent flash. */
const ThemeScript = () => (
  <script
    id="hz-theme-script"
    dangerouslySetInnerHTML={{
      __html: `(function(){try{var s=localStorage.getItem('hz-theme');var m=window.matchMedia('(prefers-color-scheme:dark)').matches;document.documentElement.classList.toggle('dark',(s||( m?'dark':'light'))==='dark');}catch(e){}})();`,
    }}
  />
);

interface ThemeProviderProps {
  children: React.ReactNode;
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  /**
   * State is initialized lazily to avoid reading localStorage on the server.
   * The inline ThemeScript (injected in <head>) handles the actual no-flash
   * behavior. React state is purely for re-rendering the toggle UI.
   */
  const [theme, setThemeState] = useState<Theme>("light");

  // Sync state with localStorage + DOM on client mount only.
  // This is a DOM-synchronization effect — we read from an external system
  // (localStorage + OS preference) and update both state and the DOM class.
  // The setState call is intentional here because the value comes from an
  // external system (localStorage) not from React state.
  useEffect(() => {
    const stored = localStorage.getItem("hz-theme") as Theme | null;
    const system = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    const initial = stored ?? system;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  // Run once on client mount
  }, []);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    localStorage.setItem("hz-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      <span style={{ display: "contents" }} suppressHydrationWarning>
        {children}
      </span>
    </ThemeContext.Provider>
  );
};

export { ThemeScript };
export default ThemeProvider;
