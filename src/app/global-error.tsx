"use client";

// A full reload (rather than reset()) also recovers when the page came from an older deployment.
export default function GlobalError() {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#FAF7F2", color: "#0E0D0B" }}>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 28, fontWeight: 500 }}>Something went wrong</h1>
          <p style={{ color: "#6B655C" }}>Please try again in a moment.</p>
          <button onClick={() => window.location.reload()} style={{ background: "#0E0D0B", color: "#FAF7F2", padding: "12px 24px", border: 0, cursor: "pointer" }}>
            Reload page
          </button>
        </div>
      </body>
    </html>
  );
}
