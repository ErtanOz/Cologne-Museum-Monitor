import OpenAI from "openai";
import { MuseumData } from "../types";

// Initialize the OpenRouter client
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: (import.meta as any).env.VITE_OPENROUTER_API_KEY,
  dangerouslyAllowBrowser: true, // Necessary for client-side demo
  defaultHeaders: {
    "HTTP-Referer": window.location.origin, // Optional, for OpenRouter rankings
    "X-Title": "Cologne Museum Monitor",
  }
});

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
  // Processing in a single batch for OpenRouter to save on requests
  const prompt = `
    Provide current information for the following museums in Cologne, Germany:
    ${museumNames.join(", ")}

    For each museum, I need:
    1. The exact name.
    2. The estimated current Google Maps rating (e.g., 4.5).
    3. The approximate total number of reviews.
    4. The address.
    5. A list of 6-8 common keywords/themes mentioned in reviews. Assign a relevance score (1-10) to each.
    6. An estimated sentiment distribution (positive, neutral, negative percentages).
    
    Return the data as a valid JSON array of objects. 
    Each object must have: "name", "rating", "reviewCount", "address", "keywords", "sentiment".
    "keywords" format: [{"text": "Topic", "value": 8}, ...]
    "sentiment" format: {"positive": 80, "neutral": 15, "negative": 5}
    
    Ensure JSON is valid and return ONLY the JSON. No markdown.
  `;

  try {
    const completion = await retry(async () => {
      return await openai.chat.completions.create({
        model: "xiaomi/mimo-v2-flash:free",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });
    });

    const text = completion.choices[0]?.message?.content || "[]";
    let parsed: any;

    try {
      // Clean potential markdown or extra text
      const cleanText = text.replace(/```json|```/g, '').trim();

      // Attempt to extract JSON if there's surrounding text
      const jsonStart = cleanText.indexOf('[');
      const jsonEnd = cleanText.lastIndexOf(']');
      const finalJson = (jsonStart !== -1 && jsonEnd !== -1)
        ? cleanText.substring(jsonStart, jsonEnd + 1)
        : cleanText;

      const rawParsed = JSON.parse(finalJson);
      parsed = Array.isArray(rawParsed) ? rawParsed : (rawParsed.museums || rawParsed.data || Object.values(rawParsed)[0]);

      if (!Array.isArray(parsed)) {
        parsed = Array.isArray(rawParsed.results) ? rawParsed.results : [];
      }
    } catch (e) {
      console.error("Parse failed", text);
      throw new Error("Failed to parse API response");
    }

    const validatedData: MuseumData[] = parsed.map((item: any) => ({
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

    if (validatedData.length === 0) throw new Error("No data returned");
    return validatedData;

  } catch (error) {
    console.error("OpenRouter fetch failed:", error);
    throw error;
  }
};