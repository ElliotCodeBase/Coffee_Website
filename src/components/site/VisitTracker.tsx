"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// Logs one row to `site_visits` per browser tab session (not per page
// view), so the admin-only analytics graph counts *visitors*, not raw
// page loads. sessionStorage resets per tab, so a person browsing
// several pages in one visit is only counted once, while a return visit
// tomorrow (or in a fresh tab) counts again. No cookies, no third-party
// scripts, nothing personally identifying is stored.
export default function VisitTracker() {
  useEffect(() => {
    const key = "cf_visit_logged";
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // sessionStorage unavailable (privacy mode, etc.) — skip tracking
      // rather than throwing, this should never break the page.
      return;
    }

    const supabase = createClient();
    supabase
      .from("site_visits")
      .insert({ path: window.location.pathname })
      .then(({ error }) => {
        if (error) console.error("visit tracking failed:", error.message);
      });
  }, []);

  return null;
}
