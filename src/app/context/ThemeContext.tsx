"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: "dark",
    toggleTheme: () => {},
    setTheme: () => {},
});

export const THEME_STORAGE_KEY = "infinitysix_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("dark");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Read theme from localStorage, default strictly to dark
        try {
            const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
            if (savedTheme === "light") {
                setThemeState("light");
                applyTheme("light");
            } else {
                setThemeState("dark");
                applyTheme("dark");
            }
        } catch (e) {
            console.error("Theme reading error", e);
        }
        setMounted(true);
    }, []);

    const applyTheme = (newTheme: Theme) => {
        const root = document.documentElement;
        root.setAttribute("data-theme", newTheme);
        if (newTheme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
    };

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        applyTheme(newTheme);
        try {
            localStorage.setItem(THEME_STORAGE_KEY, newTheme);
        } catch (e) {}
    };

    const toggleTheme = () => {
        const next = theme === "light" ? "dark" : "light";
        setTheme(next);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
