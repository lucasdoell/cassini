"use client";

import { useAnalytics } from "@/next/analytics";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function AutoAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const analytics = useAnalytics();

  useEffect(() => {
    // Only track client-side navigations (initial page load is handled by middleware)
    if (!document.referrer.includes(window.location.host)) {
      return; // Skip if this is the initial page load
    }

    const eventData = {
      url: pathname,
      referrer: document.referrer,
      hostname: window.location.hostname,
      screen: `${window.innerWidth}x${window.innerHeight}`,
      timestamp: Date.now(),
      type: "pageview",
    };

    // Use sendBeacon for reliable delivery
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(eventData)], {
        type: "application/json",
      });
      navigator.sendBeacon(analytics.endpoint, blob);
    } else {
      fetch(analytics.endpoint, {
        method: "POST",
        body: JSON.stringify(eventData),
        keepalive: true,
      }).catch(() => {});
    }
  }, [pathname, searchParams, analytics]);

  return null;
}
