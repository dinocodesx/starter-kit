export const ANALYTICS_EVENTS = {
  PAGE_VIEW: "page_view",
  LINK_CLICK: "link_click",
  FAQ_VIEW: "faq_view",
  CAMPAIGN_CLICK: "campaign_click",
  AUTH_SIGN_IN: "auth_sign_in",
  AUTH_SIGN_UP: "auth_sign_up",
  AUTH_SIGN_OUT: "auth_sign_out",
  PERFORMANCE_METRIC: "performance_metric",
  ERROR_OCCURRED: "error_occurred",
} as const;

export type AnalyticsEvent = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS];

export interface PerformancePayload {
  name: string;
  value: number;
  rating?: "good" | "needs-improvement" | "poor";
  delta?: number;
  id?: string;
}
