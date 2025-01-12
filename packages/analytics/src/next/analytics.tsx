"use client";

import { ClientAnalytics } from "@/next/client";
import { AutoAnalytics } from "@/next/components/auto-analytics";
import { WebVitals } from "@/next/components/web-vitals";
import { AnalyticsConfig } from "@/types";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type PropsWithChildren,
} from "react";

interface AnalyticsContextValue {
  client: ClientAnalytics;
  config: Required<AnalyticsConfig>;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error(
      "useAnalytics must be used within an Analytics provider. " +
        "Have you added the <Analytics /> component to your app?"
    );
  }
  return context.client;
}

export interface AnalyticsProps extends Partial<AnalyticsConfig> {
  webVitals?: boolean;
}

export function Analytics({
  children,
  webVitals = true,
  ...config
}: PropsWithChildren<AnalyticsProps>) {
  const analyticsRef = useRef<AnalyticsContextValue | null>(null);

  if (!analyticsRef.current) {
    const finalConfig = {
      endpoint: "http://localhost:3001/analytics",
      ...config,
    } as Required<AnalyticsConfig>;

    analyticsRef.current = {
      client: new ClientAnalytics(finalConfig),
      config: finalConfig,
    };
  }

  useEffect(() => {
    const analytics = analyticsRef.current;
    if (!analytics) return;

    return () => {
      analytics.client.destroy();
    };
  }, []);

  return (
    <AnalyticsContext.Provider value={analyticsRef.current}>
      {children}
      {webVitals && <WebVitals />}
      <AutoAnalytics />
    </AnalyticsContext.Provider>
  );
}
