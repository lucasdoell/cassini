import { createHash } from "crypto";

interface VisitorInfo {
  visitorId: string;
  isNewVisitor: boolean;
}

export function generateVisitorHash(
  ipAddress: string,
  userAgent: string,
  salt: string = process.env.CASSINI_SALT || "default-salt"
): string {
  // Get the date in YYYY-MM-DD format for 24-hour uniqueness
  const date = new Date().toISOString().split("T")[0];

  // Create a hash of IP + User Agent + Date + Salt
  // This creates a unique daily visitor ID that can't be traced back to the user
  return createHash("sha256")
    .update(`${ipAddress}${userAgent}${date}${salt}`)
    .digest("hex")
    .slice(0, 12); // First 12 chars are sufficient
}
