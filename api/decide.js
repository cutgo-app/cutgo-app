export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { systemPrompt, userMsg } = req.body;
  if (!systemPrompt || !userMsg) return res.status(400).json({ error: "Missing params" });
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-opus-4-5-20251101", max_tokens: 1000, system: systemPrompt, messages: [{ role: "user", content: userMsg }] })
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(500).json({ error: "Anthropic error", details: data });
    }
    if (!data.content || !data.content[0]) {
      return res.status(500).json({ error: "No content", details: data });
    }
    const text = data.content.map(i => i.text || "").join("");
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return res.status(200).json(parsed);
  } catch(e) {
    return res.status(500).json({ error: "Analysis failed", message: e.message });
  }
}
