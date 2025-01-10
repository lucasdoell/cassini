"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { parseUserAgent } from "../../utils/device-detection";
import { generateSessionId, getOrCreateVisitorId } from "../../utils/session";
import { useAnalytics } from "../provider";

export function AutoAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const analytics = useAnalytics();
  const [screenSize, setScreenSize] = useState<string>("");

  useEffect(() => {
    // Update screen size on resize
    const updateScreenSize = () => {
      setScreenSize(`${window.innerWidth}x${window.innerHeight}`);
    };

    updateScreenSize();
    window.addEventListener("resize", updateScreenSize);

    return () => window.removeEventListener("resize", updateScreenSize);
  }, []);

  useEffect(() => {
    const visitorId = getOrCreateVisitorId();
    const userAgent = navigator.userAgent;
    const deviceInfo = parseUserAgent(userAgent);

    // Track client-side navigation
    analytics.track({
      name: "page_view",
      properties: {
        url: window.location.href,
        referrer: document.referrer,
        device: {
          ...deviceInfo,
          screenSize,
        },
        visitor: {
          id: visitorId,
          returning: document.cookie.includes("cassini_vid="),
        },
        session: {
          id:
            sessionStorage.getItem("cassini_sid") ||
            (() => {
              const sid = generateSessionId();
              sessionStorage.setItem("cassini_sid", sid);
              return sid;
            })(),
          firstVisit: !document.cookie.includes("cassini_vid="),
        },
        utm: Object.fromEntries(
          ["source", "medium", "campaign", "term", "content"]
            .map((param) => [param, searchParams.get(`utm_${param}`)])
            .filter(([_, value]) => value !== null)
        ),
      },
    });
  }, [pathname, searchParams, analytics, screenSize]);

  return null;
}
