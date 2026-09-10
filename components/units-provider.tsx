"use client"

import { createContext, useContext, type ReactNode } from "react"
import { DEFAULT_UNIT_PREFS, type UnitPrefs } from "@/lib/units"

const UnitsContext = createContext<UnitPrefs>(DEFAULT_UNIT_PREFS)

export function UnitsProvider({
  prefs,
  children,
}: {
  prefs: UnitPrefs
  children: ReactNode
}) {
  return <UnitsContext.Provider value={prefs}>{children}</UnitsContext.Provider>
}

export function useUnits() {
  return useContext(UnitsContext)
}
