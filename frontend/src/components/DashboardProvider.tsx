"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface DashboardContextValue {
  refreshSignal: number;
  triggerRefresh: () => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [refreshSignal, setRefreshSignal] = useState(0);
  const triggerRefresh = useCallback(
    () => setRefreshSignal((s) => s + 1),
    [],
  );
  return (
    <DashboardContext.Provider value={{ refreshSignal, triggerRefresh }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx)
    throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}
