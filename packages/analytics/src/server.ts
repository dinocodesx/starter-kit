import { PostHog } from "posthog-node";

let posthogClient: PostHog | null = null;

export const initServerPostHog = (apiKey: string, host?: string) => {
  if (!posthogClient) {
    posthogClient = new PostHog(apiKey, {
      host: host || "https://us.i.posthog.com",
    });
  }
  return posthogClient;
};

export const trackServerEvent = (
  distinctId: string,
  event: string,
  properties?: Record<string, any>
) => {
  if (posthogClient) {
    posthogClient.capture({
      distinctId,
      event,
      properties,
    });
  }
};

export const flushEvents = async () => {
  if (posthogClient) {
    await posthogClient.shutdown();
  }
};
