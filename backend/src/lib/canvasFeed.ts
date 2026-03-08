import * as ical from "node-ical";
import type { ParameterValue, VEvent } from "node-ical";

export type CanvasCalendarEvent = {
  description?: string;
  end?: string;
  id: string;
  location?: string;
  source: "canvas";
  start: string;
  title: string;
  url?: string;
};

export class CanvasFeedError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const FEED_TIMEOUT_MS = 10_000;

const looksLikeIcsFeed = (url: URL) => {
  const haystack = `${url.pathname}${url.search}`.toLowerCase();
  return haystack.includes(".ics") || haystack.includes("calendar");
};

const isBlockedHost = (hostname: string) => {
  const normalized = hostname.toLowerCase();

  if (normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1") {
    return true;
  }

  if (normalized.startsWith("10.") || normalized.startsWith("192.168.")) {
    return true;
  }

  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(normalized)) {
    return true;
  }

  return false;
};

const readParameterValue = (value: ParameterValue | undefined) => {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
  }

  if (value && typeof value === "object" && "val" in value) {
    const normalized = String(value.val).trim();
    return normalized.length > 0 ? normalized : undefined;
  }

  return undefined;
};

const normalizeCanvasEvent = (event: VEvent): CanvasCalendarEvent | null => {
  const id = event.uid?.trim();
  const title = readParameterValue(event.summary);

  if (!id || !title || !event.start) {
    return null;
  }

  const end =
    event.end instanceof Date && !Number.isNaN(event.end.getTime())
      ? event.end.toISOString()
      : undefined;

  const location = readParameterValue(event.location);
  const description = readParameterValue(event.description);
  const url = typeof event.url === "string" ? event.url.trim() || undefined : undefined;

  return {
    id,
    title,
    description,
    start: event.start.toISOString(),
    end,
    location,
    url,
    source: "canvas",
  };
};

export const validateCanvasFeedUrl = (feedUrl: string) => {
  let parsed: URL;

  try {
    parsed = new URL(feedUrl.trim());
  } catch {
    return "Enter a valid Canvas calendar feed URL.";
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return "Canvas calendar feed URLs must use http or https.";
  }

  if (isBlockedHost(parsed.hostname)) {
    return "That feed host is not allowed.";
  }

  if (!looksLikeIcsFeed(parsed)) {
    return "Feed URL must look like a Canvas .ics calendar feed.";
  }

  return null;
};

export const fetchCanvasCalendarEvents = async (feedUrl: string) => {
  const validationError = validateCanvasFeedUrl(feedUrl);

  if (validationError) {
    throw new CanvasFeedError(400, validationError);
  }

  try {
    const response = await fetch(feedUrl, {
      signal: AbortSignal.timeout(FEED_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new CanvasFeedError(
        502,
        `Canvas feed request failed with status ${response.status}.`,
      );
    }

    const body = await response.text();
    const calendar = await ical.async.parseICS(body);

    const events = Object.values(calendar)
      .filter((entry): entry is VEvent => entry?.type === "VEVENT")
      .map(normalizeCanvasEvent)
      .filter((event): event is CanvasCalendarEvent => event !== null)
      .sort((left, right) => left.start.localeCompare(right.start));

    return events;
  } catch (error) {
    console.error("Canvas feed parsing failed:", error);
    throw new CanvasFeedError(
      502,
      "Unable to fetch or parse the Canvas calendar feed.",
    );
  }
};
