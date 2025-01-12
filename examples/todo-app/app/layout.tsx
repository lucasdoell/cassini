import { Analytics } from "@cassini/analytics/next";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Analytics>{children}</Analytics>
      </body>
    </html>
  );
}
