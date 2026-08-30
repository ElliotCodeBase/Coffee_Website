"use client";

import { useState, useTransition } from "react";

type Status = "idle" | "success" | "error";

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  function handleSubmit(formData: FormData) {
    setStatus("idle");

    // Honeypot: real users never fill this hidden field. Bots often do.
    if (formData.get("website")) {
      // Silently "succeed" so bots don't learn the honeypot was hit.
      setStatus("success");
      return;
    }

    startTransition(async () => {
      try {
        let recaptchaToken: string | undefined;

        if (siteKey && typeof window !== "undefined" && window.grecaptcha) {
          recaptchaToken = await window.grecaptcha.execute(siteKey, { action: "contact_form" });
        }

        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.get("name"),
            email: formData.get("email"),
            topic: formData.get("topic"),
            message: formData.get("message"),
            recaptchaToken,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setStatus("error");
          setErrorMsg(data.error || "Something went wrong. Please try again.");
          return;
        }

        setStatus("success");
      } catch {
        setStatus("error");
        setErrorMsg("Network error — please check your connection and try again.");
      }
    });
  }

  if (status === "success") {
    return (
      <div className="p-8 sm:p-10 lg:p-12 rounded-3xl bg-caffeine-tan border border-stone-300 shadow-xl text-center">
        <h3 className="font-cozy text-2xl font-bold text-caffeine-dark mb-2">Message sent!</h3>
        <p className="text-stone-600">Thanks for reaching out — we&apos;ll get back to you soon.</p>
      </div>
    );
  }

  return (
    <div className="p-8 sm:p-10 lg:p-12 rounded-3xl bg-caffeine-tan border border-stone-300 shadow-xl relative overflow-hidden">
      <form action={handleSubmit} className="space-y-6 relative z-10">
        {/* Honeypot field — hidden from real users via CSS, visible to bots that ignore styling */}
        <div className="absolute -left-[9999px]" aria-hidden="true">
          <label htmlFor="website">Leave this field empty</label>
          <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-xs lg:text-sm font-bold uppercase tracking-wider text-stone-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              maxLength={200}
              placeholder="John Doe"
              className="w-full px-4 py-3.5 text-xs sm:text-sm lg:text-base rounded-2xl border border-stone-300 bg-caffeine-cream text-caffeine-dark placeholder-stone-400 focus:ring-2 focus:ring-caffeine-accent focus:border-transparent outline-none transition-all"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-xs lg:text-sm font-bold uppercase tracking-wider text-stone-700 mb-2">
              Your Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              maxLength={320}
              placeholder="john@example.com"
              className="w-full px-4 py-3.5 text-xs sm:text-sm lg:text-base rounded-2xl border border-stone-300 bg-caffeine-cream text-caffeine-dark placeholder-stone-400 focus:ring-2 focus:ring-caffeine-accent focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label htmlFor="topic" className="block text-xs lg:text-sm font-bold uppercase tracking-wider text-stone-700 mb-2">
            What is this about?
          </label>
          <select
            id="topic"
            name="topic"
            className="w-full px-4 py-3.5 text-xs sm:text-sm lg:text-base rounded-2xl border border-stone-300 bg-caffeine-cream text-caffeine-dark focus:ring-2 focus:ring-caffeine-accent focus:border-transparent outline-none transition-all"
          >
            <option value="general">General Question</option>
            <option value="catering">Private Events & Catering</option>
            <option value="beans">Wholesale Coffee Beans</option>
            <option value="feedback">Feedback</option>
          </select>
        </div>

        <div>
          <label htmlFor="message" className="block text-xs lg:text-sm font-bold uppercase tracking-wider text-stone-700 mb-2">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            required
            maxLength={5000}
            placeholder="How can we help you out?"
            className="w-full px-4 py-3.5 text-xs sm:text-sm lg:text-base rounded-2xl border border-stone-300 bg-caffeine-cream text-caffeine-dark placeholder-stone-400 focus:ring-2 focus:ring-caffeine-accent focus:border-transparent outline-none transition-all"
          />
        </div>

        {status === "error" && (
          <p role="alert" className="text-sm text-red-600 font-bold">
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-caffeine-dark hover:bg-caffeine-card disabled:opacity-60 text-white font-bold py-4 rounded-2xl transition-all shadow-lg text-xs sm:text-sm lg:text-base flex items-center justify-center gap-2"
        >
          <span>{isPending ? "Sending…" : "Send message"}</span>
        </button>
      </form>
    </div>
  );
}
