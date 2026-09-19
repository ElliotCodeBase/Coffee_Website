import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/* Allowed dev origins for local network testing (e.g. opening the dev
   server from a phone or another machine on the LAN). Next.js blocks
   cross-origin requests to its own /_next/* dev assets from any origin
   not listed here — the browser gets a 403 on a JS chunk, React never
   hydrates that page, and every button/form on it silently stops
   responding to clicks, with no visible error beyond that 403.

   The IP a dev machine is reached at depends on whatever network it's
   on and changes across sessions, so it isn't hardcoded here. Set
   DEV_ORIGINS in .env.local (comma-separated, no protocol/port — e.g.
   DEV_ORIGINS=10.0.17.228,192.168.137.1) to match whatever address
   shows in the browser's address bar when testing from another device. */
const allowedDevOrigins = isDev
  ? (process.env.DEV_ORIGINS?.split(",").map((origin) => origin.trim()).filter(Boolean) ?? [])
  : [];

const nextConfig: NextConfig = {
  allowedDevOrigins,

  // Don't advertise the framework/version in every response.
  poweredByHeader: false,

  // ── Security Headers ────────────────────────────────────────────────────
  // Applied to every route. A strict CSP is intentionally omitted here
  // because the site injects user-controlled custom code (the Custom Code
  // developer feature) — a fixed CSP would break those scripts. If you
  // remove that feature you should add a tight CSP here.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent MIME-type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Block clickjacking
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Disable legacy XSS filter (modern CSP is the right guard)
          { key: "X-XSS-Protection", value: "0" },
          // Don't send referrer to cross-origin destinations
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Restrict powerful features
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          // HSTS — 1 year, include subdomains (only applies over HTTPS)
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          // Control cross-origin resource sharing at the document level
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          { key: "Cross-Origin-Resource-Policy", value: "same-site" },
          // A *partial* CSP. A full script-src can't be set while the
          // Custom Code developer feature injects arbitrary third-party
          // tags, but these four directives cost nothing and close real
          // gaps: no plugin content, no <base> hijacking of every relative
          // URL on the page, no form posting to an attacker's endpoint,
          // and no framing by another site.
          {
            key: "Content-Security-Policy",
            value: [
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
            ].join("; "),
          },
        ],
      },
      // ── Admin routes: stronger protection ─────────────────────────────
      {
        source: "/admin/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
          // Never index admin pages
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          {
            key: "Content-Security-Policy",
            value: [
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
      // ── API routes: no caching, no framing ────────────────────────────
      {
        source: "/api/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
