import { Analytics } from "@cassini/analytics/next";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Analytics
          endpoint="http://localhost:3001/analytics"
          apiKey="debug-key"
        >
          {children}
        </Analytics>
      </body>
    </html>
  );
}
