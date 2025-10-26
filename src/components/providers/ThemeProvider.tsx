"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export interface ThemeProviderProps {
  children: React.ReactNode
  attribute?: "class" | "data-theme"
  defaultTheme?: "light" | "dark" | "system"
  enableSystem?: boolean
}

export function ThemeProvider({
  children,
  attribute = "class",
  defaultTheme = "light",
  enableSystem = false,
}: ThemeProviderProps) {
  return (
    <NextThemesProvider attribute={attribute} defaultTheme={defaultTheme} enableSystem={enableSystem}>
      {children}
    </NextThemesProvider>
  )
}
