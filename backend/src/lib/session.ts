import "dotenv/config";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";

const SESSION_COOKIE_NAME = "coda_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const sessionSecret = process.env.SESSION_SECRET;
const isProduction = process.env.NODE_ENV === "production";

if (!sessionSecret) {
  throw new Error("Missing SESSION_SECRET in backend environment.");
}

type SessionPayload = {
  exp: number;
  sub: number;
};

const signSession = (payload: string) =>
  createHmac("sha256", sessionSecret).update(payload).digest("base64url");

const parseCookies = (cookieHeader?: string) => {
  if (!cookieHeader) {
    return {};
  }

  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separatorIndex = part.indexOf("=");
        const key = separatorIndex >= 0 ? part.slice(0, separatorIndex) : part;
        const value = separatorIndex >= 0 ? part.slice(separatorIndex + 1) : "";
        return [key, decodeURIComponent(value)];
      })
  );
};

const createSessionToken = (userId: number) => {
  const payload: SessionPayload = {
    sub: userId,
    exp: Date.now() + SESSION_TTL_MS,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signSession(encodedPayload);

  return `${encodedPayload}.${signature}`;
};

export const setSessionCookie = (res: Response, userId: number) => {
  res.cookie(SESSION_COOKIE_NAME, createSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    maxAge: SESSION_TTL_MS,
  });
};

export const clearSessionCookie = (res: Response) => {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
  });
};

export const getSessionUserId = (req: Request) => {
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE_NAME];

  if (!token) {
    return null;
  }

  const [encodedPayload, providedSignature] = token.split(".");

  if (!encodedPayload || !providedSignature) {
    return null;
  }

  const expectedSignature = signSession(encodedPayload);
  const expectedBuffer = Buffer.from(expectedSignature);
  const providedBuffer = Buffer.from(providedSignature);

  if (
    expectedBuffer.length !== providedBuffer.length ||
    !timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as SessionPayload;

    if (payload.exp <= Date.now() || !Number.isInteger(payload.sub)) {
      return null;
    }

    return payload.sub;
  } catch {
    return null;
  }
};
