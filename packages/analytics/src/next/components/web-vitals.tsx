"use client";

import { useAnalytics } from "@/next/analytics";
import type { NextWebVitalsMetric } from "next/app";
import { useReportWebVitals } from "next/web-vitals";
import { useCallback } from "react";
import { MetricType } from "../../types";

// Type for mapping metric names to their respective values
type MetricMapping = {
  [K in MetricType]: {
    name: string;
    valueType: "time" | "score" | "number";
  };
};

const METRIC_MAPPINGS: MetricMapping = {
  CLS: { name: "Cumulative Layout Shift", valueType: "score" },
  FCP: { name: "First Contentful Paint", valueType: "time" },
  FID: { name: "First Input Delay", valueType: "time" },
  INP: { name: "Interaction to Next Paint", valueType: "time" },
  LCP: { name: "Largest Contentful Paint", valueType: "time" },
  TTFB: { name: "Time to First Byte", valueType: "time" },
  "Next.js-hydration": { name: "Hydration", valueType: "time" },
  "Next.js-route-change-to-render": {
    name: "Route Change to Render",
    valueType: "time",
  },
  "Next.js-render": { name: "Render", valueType: "time" },
};

export function WebVitals() {
  const analytics = useAnalytics();
  const url = analytics.endpoint;

  const reportWebVital = useCallback(
    (metric: NextWebVitalsMetric) => {
      const body = JSON.stringify({
        name: "web_vital",
        properties: {
          name: metric.name,
          displayName: METRIC_MAPPINGS[metric.name].name,
          valueType: METRIC_MAPPINGS[metric.name].valueType,
          value: metric.value,
          id: metric.id,
          startTime: metric.startTime,
          label: metric.label,
          rating: getRating(metric.name, metric.value),
        },
      });

      // Use sendBeacon for web vitals to ensure reliable delivery
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon(url, blob);
      } else {
        fetch(url, {
          body,
          method: "POST",
          keepalive: true,
          headers: {
            "Content-Type": "application/json",
          },
        }).catch(() => {
          // Silent fail - we don't want to impact the user experience
        });
      }
    },
    [url]
  );

  useReportWebVitals(reportWebVital);

  return null;
}

// Utility function to determine performance rating
function getRating(
  name: MetricType,
  value: number
): "good" | "needs-improvement" | "poor" {
  // Thresholds based on web.dev/vitals
  switch (name) {
    case "CLS":
      return value <= 0.1
        ? "good"
        : value <= 0.25
        ? "needs-improvement"
        : "poor";
    case "FCP":
      return value <= 1800
        ? "good"
        : value <= 3000
        ? "needs-improvement"
        : "poor";
    case "FID":
      return value <= 100
        ? "good"
        : value <= 300
        ? "needs-improvement"
        : "poor";
    case "INP":
      return value <= 200
        ? "good"
        : value <= 500
        ? "needs-improvement"
        : "poor";
    case "LCP":
      return value <= 2500
        ? "good"
        : value <= 4000
        ? "needs-improvement"
        : "poor";
    case "TTFB":
      return value <= 800
        ? "good"
        : value <= 1800
        ? "needs-improvement"
        : "poor";
    default:
      return "good"; // Default for custom Next.js metrics
  }
}
