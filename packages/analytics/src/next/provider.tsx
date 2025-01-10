"use client";

import {
  createContext,
  use,
  useEffect,
  useRef,
  type PropsWithChildren,
} from "react";
import { DEFAULT_CONFIG } from "../config";
import { getEnvironmentConfig } from "../env";
import { AnalyticsConfig } from "../types";
import { ClientAnalytics } from "./client";
import { WebVitals } from "./components/web-vitals";

interface AnalyticsContextValue {
  client: ClientAnalytics;
  config: Required<AnalyticsConfig>;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

export interface CassiniAnalyticsProps extends Partial<AnalyticsConfig> {
  webVitals?: boolean;
}

export function Analytics({
  children,
  webVitals = true,
  ...userConfig
}: PropsWithChildren<CassiniAnalyticsProps>) {
  const analyticsRef = useRef<AnalyticsContextValue | null>(null);

  if (!analyticsRef.current) {
    const envConfig = getEnvironmentConfig();
    const config = {
      ...DEFAULT_CONFIG,
      ...envConfig,
      ...userConfig,
    };

    if (!config.apiKey) {
      if (config.debug) {
        console.warn(
          "Cassini Analytics: No API key provided. Please set NEXT_PUBLIC_CASSINI_KEY " +
            "or pass apiKey in config."
        );
      }
      config.disabled = true;
    }

    analyticsRef.current = {
      client: new ClientAnalytics(config),
      config,
    };
  }

  useEffect(() => {
    const analytics = analyticsRef.current;
    if (!analytics) return;

    return () => {
      analytics.client.destroy();
    };
  }, []);

  if (analyticsRef.current.config.disabled) {
    return <>{children}</>;
  }

  return (
    <AnalyticsContext.Provider value={analyticsRef.current}>
      {webVitals && <WebVitals />}
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = use(AnalyticsContext);
  if (!context) {
    throw new Error(
      "useAnalytics must be used within an Analytics provider. " +
        "Have you added the <Analytics /> component to your app?"
    );
  }
  return context.client;
}
