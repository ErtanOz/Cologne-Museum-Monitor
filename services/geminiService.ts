import OpenAI from "openai";
import { MuseumData } from "../types";

// Initialize the OpenRouter client (via Vite proxy to avoid CORS)
const envKey = (import.meta as any).env.VITE_OPENROUTER_API_KEY;
// Fallback to hardcoded key to ensure app works if env vars fail to load
const apiKey = envKey || "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";

console.log("OpenRouter API Key loaded:", apiKey ? "YES (starts with " + apiKey.substring(0, 10) + "...)" : "NO");

const openai = apiKey ? new OpenAI({
  baseURL: "/api/openrouter", // Proxied through Vite dev server
  apiKey: apiKey,
  dangerouslyAllowBrowser: true, // Still needed for client-side SDK
  defaultHeaders: {
    "HTTP-Referer": window.location.origin,
    "X-Title": "Cologne Museum Monitor",
  }
}) : null;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retry<T>(fn: () => Promise<T>, retries = 3, delayMs = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries <= 0) throw error;
    const msg = error?.message || JSON.stringify(error);
    const isRetryable = msg.includes('429') || msg.includes('500') || msg.includes('503');

    if (isRetryable) {
      console.warn(`OpenRouter API Error (Retrying... ${retries}): ${msg}`);
      await delay(delayMs);
      return retry(fn, retries - 1, delayMs * 2);
    }
    throw error;
  }
}

export const fetchMuseumData = async (museumNames: string[]): Promise<MuseumData[]> => {
  const baselines = `
    Reference ballparks (Review Counts):
    - Schokoladenmuseum: ~27,000
    - Museum Ludwig: ~10,000
    - Wallraf-Richartz-Museum: ~4,000
    - NS-Dokumentationszentrum: ~2,400
    - Odysseum: ~4,700
    - Römisch-Germanisches Museum: ~3,000
    - Museum für Angewandte Kunst: ~1,400
    - Duftmuseum im Farina-Haus: ~2,000
    - Rautenstrauch-Joest-Museum: ~1,500
    - Museum Schnütgen: ~1,000
    - Kolumba: ~1,000
  `;

  const prompt = `
    Provide current information for the following museums in Cologne, Germany:
    ${museumNames.join(", ")}

    ${baselines}

    For each museum, I need:
    1. The exact name.
    2. The actual current Google Maps rating (e.g., 4.7).
    3. The actual total number of reviews (use figures close to the reference ballparks provided above).
    4. The address.
    5. A list of 6-8 common keywords/themes mentioned in reviews. Assign a relevance score (1-10) to each.
    6. An estimated sentiment distribution (positive, neutral, negative percentages).
    
    Return a JSON object with a key "museums" containing an array of objects.
    Each object must have: "name", "rating", "reviewCount", "address", "keywords", "sentiment".
    "keywords" format: [{"text": "Topic", "value": 8}, ...]
    "sentiment" format: {"positive": 80, "neutral": 15, "negative": 5}
    
    Ensure the JSON is valid. Return ONLY the JSON object.
  `;

  try {
    if (!openai) throw new Error("API Key missing. Cannot fetch data.");
    
    console.log("Fetching museum data via OpenRouter (Llama 3.3 70B) for:", museumNames);
    
    const completion = await retry(async () => {
      // @ts-ignore - Check for existence before usage
      return await openai.chat.completions.create({
        model: "meta-llama/llama-3.3-70b-instruct:free",
        messages: [{ role: "user", content: prompt }],
      });
    });

    const result = completion.choices[0]?.message?.content || "{}";
    console.log("Raw DeepSeek Response:", result);

    let parsed: any;
    try {
      // 1. Remove <think>...</think> blocks from reasoning models
      let cleanText = result.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

      // 2. Extract JSON from markdown blocks if present
      const markdownMatch = cleanText.match(/```(?:json)?([\s\S]*?)```/);
      if (markdownMatch) {
        cleanText = markdownMatch[1].trim();
      }

      // 3. Find the first '{' or '[' and the last '}' or ']'
      const firstBrace = cleanText.search(/[{[]/);
      const lastBrace = cleanText.search(/[}\]]$/); // Look from end
      
      if (firstBrace !== -1 && lastBrace !== -1) {
         // Attempt to find the *actual* matching end brace if the simple search failed
         // For now, simpler slice is usually enough if markdown stripped
         // But better to just try parsing the cleaned text first
      }

      try {
        parsed = JSON.parse(cleanText);
      } catch (e) {
        // Fallback: Try to substring the JSON part
        const jsonStart = cleanText.indexOf('{');
        const jsonEnd = cleanText.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
             parsed = JSON.parse(cleanText.substring(jsonStart, jsonEnd + 1));
        } else {
             throw e;
        }
      }
      
      console.log("Parsed Data:", parsed);
      parsed = parsed.museums || parsed.data || parsed;
    } catch (e: any) {
      console.error("JSON Parse failed for DeepSeek response:", result);
      throw new Error(`Failed to parse AI response: ${e.message}`);
    }

    const validatedData: MuseumData[] = (Array.isArray(parsed) ? parsed : []).map((item: any) => ({
      name: item.name || "Unknown Museum",
      rating: Number(item.rating) || 0,
      reviewCount: Number(item.reviewCount) || 0,
      address: item.address || "",
      url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((item.name || "") + " Cologne")}`,
      keywords: Array.isArray(item.keywords)
        ? item.keywords.map((k: any) => ({
          text: String(k.text || "Keyword"),
          value: Math.max(1, Math.min(10, Math.round(Number(k.value) || 5)))
        }))
        : [],
      sentiment: item.sentiment || { positive: 0, neutral: 0, negative: 0 }
    }));

    if (validatedData.length === 0) throw new Error("No data returned from AI");
    return validatedData;

  } catch (error: any) {
    console.error("OpenRouter fetch failed:", error);
    throw new Error(error.message || "Failed to fetch museum data");
  }
};