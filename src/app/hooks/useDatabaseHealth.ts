import { useCallback, useEffect, useRef, useState } from "react";

export function useDatabaseHealth(enabled: boolean) {
  const [online, setOnline] = useState<boolean | null>(null);
  const probe = useRef<() => void>(() => {});
  const refresh = useCallback(() => probe.current(), []);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    let controller: AbortController | null = null;
    let poll: ReturnType<typeof setTimeout> | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let failures = 0;
    setOnline(null);

    const check = async () => {
      if (!active || controller) return;
      clearTimeout(poll);
      controller = new AbortController();
      timeout = setTimeout(() => controller?.abort(), 8000);
      try {
        const response = await fetch("/api/health/", {
          cache: "no-store",
          signal: controller.signal,
        });
        const body = await response.json();
        if (!response.ok || body?.status !== "ok" || body?.database !== "connected") throw new Error("Health probe failed.");
        if (active) {
          failures = 0;
          setOnline(true);
        }
      } catch {
        if (active) {
          failures += 1;
          if (failures >= 3) setOnline(false);
        }
      } finally {
        clearTimeout(timeout);
        controller = null;
        if (active) poll = setTimeout(check, failures ? 1500 : 15000);
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void check();
    };
    probe.current = () => { void check(); };
    void check();
    window.addEventListener("online", refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      probe.current = () => {};
      clearTimeout(poll);
      clearTimeout(timeout);
      controller?.abort();
      window.removeEventListener("online", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, refresh]);

  return { online, refresh };
}
