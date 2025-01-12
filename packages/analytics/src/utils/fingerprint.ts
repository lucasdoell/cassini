// Function to convert ArrayBuffer to hex string
function arrayBufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function generateVisitorHash(
  ipAddress: string,
  userAgent: string,
  salt: string = process.env.CASSINI_SALT || "default-salt"
): Promise<string> {
  // Get the date in YYYY-MM-DD format for 24-hour uniqueness
  const date = new Date().toISOString().split("T")[0];

  // Create the input string
  const input = `${ipAddress}${userAgent}${date}${salt}`;

  // Convert string to Uint8Array
  const encoder = new TextEncoder();
  const data = encoder.encode(input);

  // Generate SHA-256 hash using Web Crypto API
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  // Convert to hex string and take first 12 characters
  return arrayBufferToHex(hashBuffer).slice(0, 12);
}
