// Minimal root layout so Next.js builds in "API-only" mode without a dedicated
// page. We never render a real HTML shell here — all routes are /api/*.
export const metadata = { title: "RPM Auto Lab API" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"><body>{children}</body></html>
  );
}
