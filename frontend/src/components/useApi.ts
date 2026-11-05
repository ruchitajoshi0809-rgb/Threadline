"use client";

import { useEffect, useState } from "react";
import { useDashboard } from "./DashboardProvider";

export function useApi<T>(url: string) {
  const { refreshSignal } = useDashboard();
  const [result, setResult] = useState<{
    key: string;
    data: T | null;
    error: string | null;
  } | null>(null);
  const requestKey = `${url}:${refreshSignal}`;

  useEffect(() => {
    let cancelled = false;
    fetch(url, { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body.error ?? "Failed to load data.");
        }
        return body as T;
      })
      .then((d) => {
        if (!cancelled) {
          setResult({ key: requestKey, data: d, error: null });
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setResult({
            key: requestKey,
            data: null,
            error: e instanceof Error ? e.message : "Failed to load data.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [url, refreshSignal, requestKey]);

  const current = result?.key === requestKey ? result : null;
  return {
    data: current?.data ?? null,
    loading: current === null,
    error: current?.error ?? null,
  };
}
