"use client";

import { useState, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { feedback } from "@/content/feedback";

export function FeedbackForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, website }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // data.error is EN API/log text — map the machine code instead.
        toast.error((data.code && feedback.byCode[data.code]) || feedback.fallback);
        return;
      }

      setIsSuccess(true);
    } catch {
      toast.error(feedback.fallback);
    } finally {
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <div
        role="status"
        className="border-border bg-muted flex items-start gap-3 rounded-md border p-4"
      >
        <CheckCircle2 className="text-foreground h-5 w-5 flex-shrink-0" />
        <div>
          <p className="text-foreground font-semibold">{feedback.success.title}</p>
          <p className="text-muted-foreground mt-1 text-sm">{feedback.success.description}</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="feedback-name" className="text-sm font-medium">
            {feedback.form.nameLabel}
          </label>
          <Input
            id="feedback-name"
            value={name}
            maxLength={100}
            placeholder={feedback.form.namePlaceholder}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="feedback-email" className="text-sm font-medium">
            {feedback.form.emailLabel}
          </label>
          <Input
            id="feedback-email"
            type="email"
            value={email}
            maxLength={254}
            placeholder={feedback.form.emailPlaceholder}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
          <p className="text-muted-foreground text-xs">{feedback.form.emailHint}</p>
        </div>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="feedback-message" className="text-sm font-medium">
          {feedback.form.messageLabel}
        </label>
        <Textarea
          id="feedback-message"
          value={message}
          required
          minLength={5}
          maxLength={2000}
          rows={6}
          placeholder={feedback.form.messagePlaceholder}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isLoading}
        />
      </div>
      {/* Honeypot: hidden from real users (display: none, no tab stop); bots
          that fill every field reveal themselves. The label text is
          deliberately EN bait, not UA copy — it must look like a real field
          to a bot and is never shown to people. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="feedback-website">Website</label>
        <input
          id="feedback-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isLoading ? feedback.form.submitting : feedback.form.submit}
      </Button>
    </form>
  );
}
