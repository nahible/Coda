import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ExternalLink, RefreshCw } from "lucide-react";
import {
  getCanvasEvents,
  getCanvasFeed,
  saveCanvasFeed,
  type CalendarEvent,
} from "../api/canvas";

type CanvasWidgetProps = {
  onOpenCanvas: () => void;
};

const formatEventDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

const stripHtml = (value?: string) =>
  value?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "";

export default function CanvasWidget({ onOpenCanvas }: CanvasWidgetProps) {
  const [hasFeed, setHasFeed] = useState(false);
  const [feedUrl, setFeedUrl] = useState("");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSavingFeed, setIsSavingFeed] = useState(false);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter((event) => new Date(event.end || event.start) >= now)
      .sort((left, right) => left.start.localeCompare(right.start))
      .slice(0, 8);
  }, [events]);

  const loadWidget = async ({ initial = false } = {}) => {
    if (initial) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const feed = await getCanvasFeed();
      setHasFeed(feed.connected);
      setFeedUrl(feed.feedUrl || "");

      if (!feed.connected) {
        setEvents([]);
        setErrorMessage(null);
        return;
      }

      const nextEvents = await getCanvasEvents();
      setEvents(nextEvents);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load Canvas items right now.",
      );
    } finally {
      if (initial) {
        setIsLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  };

  const handleSaveFeed = async () => {
    setIsSavingFeed(true);

    try {
      const savedFeed = await saveCanvasFeed(feedUrl);
      setHasFeed(savedFeed.connected);
      setFeedUrl(savedFeed.feedUrl || "");
      setErrorMessage(null);
      window.dispatchEvent(new Event("coda_canvas_updated"));
      await loadWidget();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to save the Canvas feed right now.",
      );
    } finally {
      setIsSavingFeed(false);
    }
  };

  useEffect(() => {
    void loadWidget({ initial: true });

    const handleCanvasUpdate = () => {
      void loadWidget();
    };

    window.addEventListener("coda_canvas_updated", handleCanvasUpdate);
    return () => {
      window.removeEventListener("coda_canvas_updated", handleCanvasUpdate);
    };
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-ink-muted">
            Canvas
          </h3>
          <p className="mt-1 text-xs text-ink-faint">
            Upcoming assignments and events
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasFeed ? (
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border-soft text-ink-muted transition hover:bg-panel-alt hover:text-ink"
              onClick={() => void loadWidget()}
              disabled={isRefreshing || isLoading}
              title="Refresh Canvas"
            >
              <RefreshCw
                size={15}
                strokeWidth={1.7}
                className={isRefreshing ? "animate-spin" : ""}
              />
            </button>
          ) : null}
          <button
            type="button"
            className="rounded-full bg-panel-inner px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted transition hover:bg-panel-alt hover:text-ink"
            onClick={onOpenCanvas}
          >
            Open
          </button>
        </div>
      </div>

      {errorMessage ? (
        <div className="mb-3 rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-xs text-danger">
          {errorMessage}
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-ink-faint">
          Loading Canvas...
        </div>
      ) : !hasFeed ? (
        <div className="flex flex-1 flex-col justify-center gap-4 rounded-[22px] border border-dashed border-border-soft bg-panel-inner px-4 py-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-accent-muted/40 text-accent">
            <CalendarDays size={22} strokeWidth={1.6} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-ink">Connect Canvas Calendar</h4>
            <p className="mt-1 text-xs leading-relaxed text-ink-faint">
              Save your private Canvas `.ics` feed to show upcoming coursework here.
            </p>
          </div>
          <input
            type="url"
            value={feedUrl}
            onChange={(event) => setFeedUrl(event.target.value)}
            placeholder="Paste Canvas .ics feed URL"
            className="w-full rounded-xl border border-border-med bg-panel px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
            disabled={isSavingFeed}
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex-1 rounded-xl bg-accent-strong px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-ink-on-accent shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => void handleSaveFeed()}
              disabled={isSavingFeed || feedUrl.trim().length === 0}
            >
              {isSavingFeed ? "Saving..." : "Save Feed"}
            </button>
            <button
              type="button"
              className="rounded-xl border border-border-soft px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted transition hover:bg-panel hover:text-ink"
              onClick={onOpenCanvas}
            >
              Full View
            </button>
          </div>
        </div>
      ) : upcomingEvents.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-[22px] bg-panel-inner px-5 py-6 text-center text-sm text-ink-faint">
          No upcoming Canvas events right now.
        </div>
      ) : (
        <ul className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
          {upcomingEvents.map((event) => (
            <li
              key={event.id}
              className="rounded-[18px] border border-border-soft bg-panel-inner px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold leading-relaxed text-ink">
                    {event.title}
                  </div>
                  <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-ink-faint">
                    {formatEventDate(event.start)}
                  </div>
                  {event.description ? (
                    <p className="mt-2 text-xs leading-relaxed text-ink-secondary">
                      {stripHtml(event.description).slice(0, 120)}
                    </p>
                  ) : null}
                </div>
                {event.url ? (
                  <a
                    href={event.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-muted transition hover:bg-panel hover:text-ink"
                    title="Open in Canvas"
                  >
                    <ExternalLink size={15} strokeWidth={1.8} />
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
