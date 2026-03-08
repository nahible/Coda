import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Link2,
  RefreshCw,
} from "lucide-react";
import {
  getCanvasEvents,
  getCanvasFeed,
  saveCanvasFeed,
  type CalendarEvent,
} from "../api/canvas";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
const addMonths = (date: Date, months: number) =>
  new Date(date.getFullYear(), date.getMonth() + months, 1);

const dayKey = (value: string | Date) => {
  const date = typeof value === "string" ? new Date(value) : value;
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatEventDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

const formatMonthLabel = (date: Date) =>
  new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);

const stripHtml = (value?: string) =>
  value?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "";

export default function CanvasCalendar() {
  const [feedUrl, setFeedUrl] = useState("");
  const [savedFeedUrl, setSavedFeedUrl] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));

  const loadEvents = async () => {
    setIsLoadingEvents(true);

    try {
      const nextEvents = await getCanvasEvents();
      setEvents(nextEvents);
      setErrorMessage(null);
      setSuccessMessage(`Loaded ${nextEvents.length} Canvas event${nextEvents.length === 1 ? "" : "s"}.`);
      window.dispatchEvent(new Event("coda_canvas_updated"));
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load Canvas calendar events right now.",
      );
    } finally {
      setIsLoadingEvents(false);
    }
  };

  useEffect(() => {
    let isActive = true;

    const loadFeed = async () => {
      setIsLoadingFeed(true);

      try {
        const nextFeed = await getCanvasFeed();

        if (!isActive) {
          return;
        }

        setSavedFeedUrl(nextFeed.feedUrl);
        setFeedUrl(nextFeed.feedUrl || "");

        if (nextFeed.connected) {
          await loadEvents();
        } else {
          setEvents([]);
        }
      } catch (error) {
        if (!isActive) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load Canvas calendar settings right now.",
        );
      } finally {
        if (isActive) {
          setIsLoadingFeed(false);
        }
      }
    };

    void loadFeed();

    return () => {
      isActive = false;
    };
  }, []);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const nextFeed = await saveCanvasFeed(feedUrl);
      setSavedFeedUrl(nextFeed.feedUrl);
      setFeedUrl(nextFeed.feedUrl || "");
      setErrorMessage(null);
      setSuccessMessage("Canvas calendar feed saved.");
      await loadEvents();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to save the Canvas calendar feed.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const gridStart = addDays(monthStart, -monthStart.getDay());

    return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
  }, [currentMonth]);

  const eventsByDay = useMemo(() => {
    const grouped = new Map<string, CalendarEvent[]>();

    for (const event of events) {
      const key = dayKey(event.start);
      const currentDayEvents = grouped.get(key) || [];
      currentDayEvents.push(event);
      grouped.set(key, currentDayEvents);
    }

    for (const [key, dayEvents] of grouped.entries()) {
      grouped.set(
        key,
        [...dayEvents].sort((left, right) => left.start.localeCompare(right.start)),
      );
    }

    return grouped;
  }, [events]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter((event) => new Date(event.end || event.start) >= now)
      .sort((left, right) => left.start.localeCompare(right.start))
      .slice(0, 10);
  }, [events]);

  return (
    <div className="flex flex-col text-ink">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Canvas Calendar</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Import Canvas assignments and deadlines using your private Canvas calendar feed.
          </p>
        </div>
        {savedFeedUrl ? (
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl border border-border-soft px-4 py-2 text-sm font-medium text-ink-muted transition hover:bg-panel-inner hover:text-ink"
            onClick={() => void loadEvents()}
            disabled={isLoadingEvents}
          >
            <RefreshCw
              size={16}
              strokeWidth={1.8}
              className={isLoadingEvents ? "animate-spin" : ""}
            />
            Refresh
          </button>
        ) : null}
      </div>

      {errorMessage ? (
        <div className="mb-4 rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mb-4 rounded-2xl border border-accent/20 bg-accent/10 px-4 py-3 text-sm text-accent-strong">
          {successMessage}
        </div>
      ) : null}

      <div className="mb-5 rounded-[24px] border border-border-soft bg-panel-inner p-4">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-accent-muted/40 text-accent">
            <Link2 size={20} strokeWidth={1.7} />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-ink">Connect Canvas Calendar</h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">
              Paste your private Canvas `.ics` calendar feed URL. We will fetch the events directly from that feed and display them here.
            </p>
            <div className="mt-4 flex flex-col gap-3 md:flex-row">
              <input
                type="url"
                value={feedUrl}
                onChange={(event) => setFeedUrl(event.target.value)}
                placeholder="https://your-school.instructure.com/feeds/calendars/..."
                className="min-w-0 flex-1 rounded-xl border border-border-med bg-panel px-4 py-3 text-sm text-ink outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
                disabled={isLoadingFeed || isSaving}
              />
              <button
                type="button"
                onClick={() => void handleSave()}
                className="rounded-xl bg-accent-strong px-5 py-3 text-sm font-semibold text-ink-on-accent shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isLoadingFeed || isSaving || feedUrl.trim().length === 0}
              >
                {isSaving ? "Saving..." : "Save Feed"}
              </button>
            </div>
            {savedFeedUrl ? (
              <p className="mt-3 text-xs text-ink-faint">
                Saved feed: {savedFeedUrl}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {!savedFeedUrl ? (
        <div className="flex flex-1 items-center justify-center rounded-[24px] border border-dashed border-border-soft bg-panel-inner px-6 py-10 text-center text-sm text-ink-faint">
          Save your Canvas `.ics` feed URL to load the calendar view and upcoming assignments list.
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1.55fr_0.9fr]">
          <section className="flex flex-col rounded-[24px] border border-border-soft bg-panel p-4 shadow-panel">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-accent-muted/40 text-accent">
                  <CalendarDays size={18} strokeWidth={1.8} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-ink">Calendar View</h2>
                  <p className="text-xs text-ink-faint">
                    All events from your Canvas feed
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border-soft text-ink-muted transition hover:bg-panel-inner hover:text-ink"
                  onClick={() => setCurrentMonth((prev) => addMonths(prev, -1))}
                >
                  <ChevronLeft size={16} strokeWidth={1.8} />
                </button>
                <div className="min-w-[8rem] text-center text-sm font-semibold text-ink">
                  {formatMonthLabel(currentMonth)}
                </div>
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border-soft text-ink-muted transition hover:bg-panel-inner hover:text-ink"
                  onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
                >
                  <ChevronRight size={16} strokeWidth={1.8} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-faint">
              {WEEKDAY_LABELS.map((label) => (
                <div key={label} className="pb-1">
                  {label}
                </div>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-2">
              {calendarDays.map((day) => {
                const key = dayKey(day);
                const dayEvents = eventsByDay.get(key) || [];
                const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                const isToday = key === dayKey(new Date());

                return (
                  <div
                    key={key}
                    className={`min-h-[118px] rounded-[18px] border p-2 ${
                      isCurrentMonth
                        ? "border-border-soft bg-panel-inner"
                        : "border-border-soft/60 bg-panel-inner/40"
                    } ${isToday ? "ring-1 ring-accent/40" : ""}`}
                  >
                    <div
                      className={`mb-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                        isToday
                          ? "bg-accent text-ink-on-accent"
                          : isCurrentMonth
                            ? "text-ink"
                            : "text-ink-faint"
                      }`}
                    >
                      {day.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <a
                          key={event.id}
                          href={event.url || undefined}
                          target={event.url ? "_blank" : undefined}
                          rel={event.url ? "noreferrer" : undefined}
                          className={`block rounded-xl px-2 py-1 text-[11px] leading-snug ${
                            event.url
                              ? "bg-accent-muted/45 text-ink hover:bg-accent-muted/60"
                              : "bg-panel text-ink-muted"
                          }`}
                          title={event.title}
                        >
                          {event.title}
                        </a>
                      ))}
                      {dayEvents.length > 2 ? (
                        <div className="px-2 text-[11px] font-medium text-ink-faint">
                          +{dayEvents.length - 2} more
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="flex flex-col rounded-[24px] border border-border-soft bg-panel p-4 shadow-panel">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-accent-muted/40 text-accent">
                <CalendarDays size={18} strokeWidth={1.8} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-ink">Upcoming</h2>
                <p className="text-xs text-ink-faint">
                  Next assignments and calendar events from Canvas
                </p>
              </div>
            </div>

            <div className="flex-1">
              {isLoadingEvents ? (
                <div className="flex h-full items-center justify-center text-sm text-ink-faint">
                  Loading Canvas events...
                </div>
              ) : upcomingEvents.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-[20px] bg-panel-inner px-6 py-8 text-center text-sm text-ink-faint">
                  No upcoming events in this feed right now.
                </div>
              ) : (
                <ul className="space-y-2">
                  {upcomingEvents.map((event) => (
                    <li
                      key={event.id}
                      className="rounded-[20px] border border-border-soft bg-panel-inner px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold leading-relaxed text-ink">
                            {event.title}
                          </div>
                          <div className="mt-1 text-xs text-ink-faint">
                            {formatEventDate(event.start)}
                            {event.location ? ` • ${event.location}` : ""}
                          </div>
                          {event.description ? (
                            <p className="mt-2 text-xs leading-relaxed text-ink-secondary">
                              {stripHtml(event.description).slice(0, 180)}
                            </p>
                          ) : null}
                        </div>
                        {event.url ? (
                          <a
                            href={event.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex shrink-0 items-center gap-1 rounded-full border border-border-soft px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted transition hover:bg-panel hover:text-ink"
                          >
                            Open
                            <ExternalLink size={12} strokeWidth={1.8} />
                          </a>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
