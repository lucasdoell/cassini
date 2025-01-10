import { getCookie, setCookie } from "cookies-next";

export function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function getOrCreateVisitorId(
  cookieName: string = "cassini_vid"
): string {
  let visitorId = getCookie(cookieName) as string;

  if (!visitorId) {
    visitorId = generateSessionId();
    setCookie(cookieName, visitorId, {
      maxAge: 60 * 60 * 24 * 365 * 2, // 2 years
      path: "/",
    });
  }

  return visitorId;
}
