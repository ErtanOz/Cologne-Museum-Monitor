import { GoogleGenerativeAI } from "@google/generative-ai";
import { MuseumData } from "../types";

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI((import.meta as any).env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.0-flash-exp",
  generationConfig: {
    responseMimeType: "application/json",
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
      console.warn(`Gemini API Error (Retrying... ${retries}): ${msg}`);
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
  `;

  try {
    const result = await retry(async () => {
      const response = await model.generateContent(prompt);
      return response.response.text();
    });

    let parsed: any;
    try {
      parsed = JSON.parse(result);
      parsed = parsed.museums || parsed;
    } catch (e) {
      console.error("Parse failed", result);
      throw new Error("Failed to parse Gemini API response");
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

    if (validatedData.length === 0) throw new Error("No data returned");
    return validatedData;

  } catch (error) {
    console.error("Gemini fetch failed:", error);
    throw error;
  }
};