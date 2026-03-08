const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";
const CANVAS_BASE_URL = `${API_BASE_URL}/canvas`;

type ErrorPayload = {
  error?: string;
};

export type CanvasFeed = {
  connected: boolean;
  feedUrl: string | null;
};

export type CalendarEvent = {
  description?: string;
  end?: string;
  id: string;
  location?: string;
  source: "canvas";
  start: string;
  title: string;
  url?: string;
};

const getErrorMessage = async (response: Response, fallbackMessage: string) => {
  const payload = (await response.json().catch(() => null)) as ErrorPayload | null;
  return payload?.error || fallbackMessage;
};

export const getCanvasFeed = async (): Promise<CanvasFeed> => {
  const response = await fetch(`${CANVAS_BASE_URL}/feed`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to load Canvas feed."));
  }

  return response.json();
};

export const saveCanvasFeed = async (feedUrl: string): Promise<CanvasFeed> => {
  const response = await fetch(`${CANVAS_BASE_URL}/feed`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ feedUrl }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to save Canvas feed."));
  }

  return response.json();
};

export const getCanvasEvents = async (): Promise<CalendarEvent[]> => {
  const response = await fetch(`${CANVAS_BASE_URL}/events`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to load Canvas events."));
  }

  const payload = (await response.json()) as { events: CalendarEvent[] };
  return payload.events;
};
