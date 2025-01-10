"use client";

import { type PropsWithChildren } from "react";
import type { AnalyticsConfig } from "../types";
import { AutoAnalytics } from "./components/auto-analytics";
import { WebVitals } from "./components/web-vitals";
import { Analytics as BaseAnalytics } from "./provider";

export interface CassiniAnalyticsProps extends Partial<AnalyticsConfig> {
  webVitals?: boolean;
  autoPageViews?: boolean;
}

export function Analytics({
  children,
  webVitals = true,
  autoPageViews = true,
  ...config
}: PropsWithChildren<CassiniAnalyticsProps>) {
  return (
    <BaseAnalytics {...config}>
      {autoPageViews && <AutoAnalytics />}
      {webVitals && <WebVitals />}
      {children}
    </BaseAnalytics>
  );
}
