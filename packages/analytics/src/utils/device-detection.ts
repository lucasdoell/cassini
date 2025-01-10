interface DeviceInfo {
  type: "desktop" | "tablet" | "mobile";
  browser: string;
  os: string;
  screenSize?: string;
}

export function parseUserAgent(userAgent: string): DeviceInfo {
  // Basic browser detection
  const getBrowser = (ua: string): string => {
    if (ua.includes("Firefox/")) return "Firefox";
    if (ua.includes("Chrome/")) return "Chrome";
    if (ua.includes("Safari/")) return "Safari";
    if (ua.includes("Edge/")) return "Edge";
    if (ua.includes("MSIE") || ua.includes("Trident/"))
      return "Internet Explorer";
    return "Other";
  };

  // Basic OS detection
  const getOS = (ua: string): string => {
    if (ua.includes("Windows")) return "Windows";
    if (ua.includes("Mac OS")) return "macOS";
    if (ua.includes("Linux")) return "Linux";
    if (ua.includes("Android")) return "Android";
    if (ua.includes("iOS")) return "iOS";
    return "Other";
  };

  // Device type detection
  const getDeviceType = (ua: string): "desktop" | "tablet" | "mobile" => {
    if (
      /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
        ua
      )
    ) {
      if (/tablet|ipad|playbook|silk|(android(?!.*mobile))/i.test(ua)) {
        return "tablet";
      }
      return "mobile";
    }
    return "desktop";
  };

  return {
    type: getDeviceType(userAgent),
    browser: getBrowser(userAgent),
    os: getOS(userAgent),
  };
}
