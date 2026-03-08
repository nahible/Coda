import { Router, type Request, type Response } from "express";
import { getSessionUserId } from "../lib/session.js";
import {
  CanvasFeedError,
  fetchCanvasCalendarEvents,
  validateCanvasFeedUrl,
} from "../lib/canvasFeed.js";
import {
  getCanvasFeedByUserId,
  upsertCanvasFeedByUserId,
} from "../lib/canvasFeeds.js";

const router = Router();

const requireAuth = (req: Request, res: Response) => {
  const userId = getSessionUserId(req);

  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }

  return userId;
};

const handleCanvasFeedError = (
  res: Response,
  error: unknown,
  fallbackMessage: string,
) => {
  if (error instanceof CanvasFeedError) {
    res.status(error.status).json({ error: error.message });
    return;
  }

  console.error(error);
  res.status(500).json({ error: fallbackMessage });
};

router.get("/feed", async (req, res) => {
  const userId = requireAuth(req, res);

  if (!userId) {
    return;
  }

  const { data: feed, error } = await getCanvasFeedByUserId(userId);

  if (error) {
    res.status(500).json({ error: "Failed to load Canvas feed." });
    return;
  }

  res.json({
    connected: Boolean(feed?.feed_url),
    feedUrl: feed?.feed_url ?? null,
  });
});

router.post("/feed", async (req, res) => {
  const userId = requireAuth(req, res);
  const feedUrl = String(req.body.feedUrl ?? "").trim();

  if (!userId) {
    return;
  }

  const validationError = validateCanvasFeedUrl(feedUrl);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  const { data: feed, error } = await upsertCanvasFeedByUserId(userId, feedUrl);

  if (error || !feed) {
    res.status(500).json({ error: "Failed to save Canvas feed." });
    return;
  }

  res.json({
    connected: true,
    feedUrl: feed.feed_url,
  });
});

router.get("/events", async (req, res) => {
  const userId = requireAuth(req, res);

  if (!userId) {
    return;
  }

  const { data: feed, error } = await getCanvasFeedByUserId(userId);

  if (error) {
    res.status(500).json({ error: "Failed to load Canvas feed." });
    return;
  }

  if (!feed?.feed_url) {
    res.status(404).json({ error: "Canvas calendar feed is not connected." });
    return;
  }

  try {
    const events = await fetchCanvasCalendarEvents(feed.feed_url);
    res.json({ events });
  } catch (error) {
    handleCanvasFeedError(res, error, "Failed to load Canvas calendar events.");
  }
});

export default router;
