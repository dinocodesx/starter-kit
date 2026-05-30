import posthog, { PostHogConfig } from "posthog-js";
import { ANALYTICS_EVENTS, type PerformancePayload } from "./events";

export const initPostHog = (apiKey: string, host?: string, config?: Partial<PostHogConfig>) => {
  if (typeof window !== "undefined") {
    posthog.init(apiKey, {
      api_host: host || "https://us.i.posthog.com",
      person_profiles: "always",
      capture_pageview: false, // We'll handle this manually or via framework-specific routers
      capture_performance: true, // PostHog 4.x has built-in performance capturing
      ...config,
    });
  }
  return posthog;
};

export const trackClientEvent = (event: string, properties?: Record<string, any>) => {
  if (typeof window !== "undefined") {
    posthog.capture(event, properties);
  }
};

export const trackPerformance = (metric: PerformancePayload) => {
  trackClientEvent(ANALYTICS_EVENTS.PERFORMANCE_METRIC, metric);
};

export { posthog };
