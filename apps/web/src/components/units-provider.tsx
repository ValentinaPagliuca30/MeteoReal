"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type TempUnit = "C" | "F";

type UnitsContextValue = {
  unit: TempUnit;
  setUnit: (unit: TempUnit) => void;
  toggle: () => void;
};

const UnitsContext = createContext<UnitsContextValue>({
  unit: "C",
  setUnit: () => {},
  toggle: () => {},
});

const STORAGE_KEY = "meteo-real-temp-unit";

export function UnitsProvider({ children }: { children: ReactNode }) {
  const [unit, setUnitState] = useState<TempUnit>("C");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "F" || saved === "C") {
      setUnitState(saved);
    }
  }, []);

  function setUnit(next: TempUnit) {
    setUnitState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  function toggle() {
    setUnit(unit === "C" ? "F" : "C");
  }

  return (
    <UnitsContext.Provider value={{ unit, setUnit, toggle }}>
      {children}
    </UnitsContext.Provider>
  );
}

export function useUnits() {
  return useContext(UnitsContext);
}
