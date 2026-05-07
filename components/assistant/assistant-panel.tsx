"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function AssistantPanel({ context }: { context: unknown }) {
  const [message, setMessage] = useState("Compare 8644 and 9889 for alliance selection.");
  const [answer, setAnswer] = useState("Ask RoboScoutAI to summarize teams, explain OPR, compare picklist candidates, or turn timeline tags into strategy notes.");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, context }),
    });
    const json = await response.json();
    setAnswer(json.content);
    setLoading(false);
  }

  return (
    <Card>
      <textarea className="min-h-28 w-full rounded-md border border-[#F1E9E9]/10 bg-[#111331] p-3 text-sm text-[#F1E9E9]" value={message} onChange={(event) => setMessage(event.target.value)} />
      <Button className="mt-3" onClick={submit} disabled={loading}><Send className="size-4" /> {loading ? "Thinking..." : "Ask assistant"}</Button>
      <div className="mt-5 rounded-lg border border-[#F1E9E9]/10 bg-[#111331]/70 p-4 text-sm leading-6 text-[#F1E9E9]/84 whitespace-pre-wrap">{answer}</div>
    </Card>
  );
}
