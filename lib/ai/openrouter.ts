import { ROBOSCOUT_SYSTEM_PROMPT } from "./prompts";

export async function askOpenRouter(message: string, dataContext: unknown) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return {
      content:
        "OpenRouter is not configured. Add OPENROUTER_API_KEY to .env.local. Based on the supplied app data, I can still summarize locally once the API key is present.",
    };
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "RoboScoutAI",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: ROBOSCOUT_SYSTEM_PROMPT },
        { role: "user", content: `User request: ${message}\n\nProvided app data:\n${JSON.stringify(dataContext, null, 2)}` },
      ],
    }),
  });

  if (!response.ok) {
    return { content: `OpenRouter request failed with ${response.status}. Check your API key and model access.` };
  }

  const json = await response.json();
  return { content: json.choices?.[0]?.message?.content ?? "No response content returned." };
}
