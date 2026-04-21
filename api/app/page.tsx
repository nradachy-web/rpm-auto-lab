export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui", padding: "2rem" }}>
      <h1>RPM Auto Lab API</h1>
      <p>
        This service powers the customer portal and admin back-office for
        rpm-auto-lab. API routes live under <code>/api/*</code>.
      </p>
      <p><a href="/api/health">/api/health</a></p>
    </main>
  );
}
