"use client";

import { useEffect } from "react";

export function useWakeLock() {
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    let released = false;

    async function acquire() {
      try {
        if ("wakeLock" in navigator && !released) {
          lock = await navigator.wakeLock.request("screen");
        }
      } catch {
        // wake lock není k dispozici — obrazovka může zhasnout, nic dalšího se neděje
      }
    }

    function onVisibility() {
      if (document.visibilityState === "visible") acquire();
    }

    acquire();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      released = true;
      document.removeEventListener("visibilitychange", onVisibility);
      lock?.release().catch(() => {});
    };
  }, []);
}
