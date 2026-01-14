import { GoogleGenAI } from "@google/genai";
import { MuseumData } from "../types";

// Initialize the API client. 
// We rely on the generic API key env var as per instructions.
const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY });

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retry<T>(fn: () => Promise<T>, retries = 3, delayMs = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries <= 0) throw error;

    const msg = error?.message || JSON.stringify(error);
    // Retry on server errors or rate limits
    const isServerSideError = msg.includes('500') || msg.includes('503') || msg.includes('Internal error') || msg.includes('429');

    if (isServerSideError) {
      console.warn(`Gemini API Error (Retrying... ${retries} attempts left): ${msg}`);
      await delay(delayMs);
      return retry(fn, retries - 1, delayMs * 2);
    }
    throw error;
  }
}

export const fetchMuseumData = async (museumNames: string[]): Promise<MuseumData[]> => {
  // Batch requests to avoid hitting token limits or complexity errors with the Maps tool.
  const BATCH_SIZE = 3;
  const batches = [];

  for (let i = 0; i < museumNames.length; i += BATCH_SIZE) {
    batches.push(museumNames.slice(i, i + BATCH_SIZE));
  }

  const flatResults: any[] = [];

  // SEQUENTIAL EXECUTION:
  // We process batches one by one instead of Promise.all to drastically reduce the load on the backend
  // and prevent 500 Internal Errors.
  for (const batch of batches) {
    try {
      const batchResult = await retry(async () => {
        const prompt = `
          Find the following museums in Cologne, Germany using Google Maps:
          ${batch.join(", ")}

          For each museum, I need:
          1. The exact name as listed on Google Maps.
          2. The current rating (e.g., 4.5).
          3. The total number of reviews (integer).
          4. The address.
          5. A list of 6-8 common keywords or short themes (1-2 words max) mentioned in reviews (e.g., "Architecture", "Friendly staff", "Long lines"). Assign a relevance score as an integer from 1 to 10 (where 10 is most relevant) to each keyword in the 'value' field.
          6. An estimated sentiment distribution of the reviews as percentages (positive, neutral, negative) based on the overall rating and review content available.
          
          Return the data as a valid JSON array of objects. 
          Each object must have these keys: "name", "rating", "reviewCount", "address", "keywords", "sentiment".
          "keywords" should be an array of objects: [{"text": "Topic", "value": 8}, ...]
          "sentiment" should be an object: {"positive": 80, "neutral": 15, "negative": 5} (numbers must sum to 100).
          
          Ensure "rating" is a number and "reviewCount" is a number.
          Do not include markdown formatting like \`\`\`json. Just return the raw JSON string if possible.
        `;

        const response = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: prompt,
          config: {
            tools: [{ googleMaps: {} }],
            temperature: 0.1,
          },
        });

        const text = response.text || "";
        const cleanText = text.replace(/```json|```/g, '').trim();

        try {
          const parsed = JSON.parse(cleanText);
          if (Array.isArray(parsed)) {
            return parsed;
          }
          return [];
        } catch (e) {
          console.warn("Failed to parse batch response", cleanText);
          return [];
        }
      });

      flatResults.push(...batchResult);

      // Add a small delay between batches to respect rate limits and backend stability
      if (batches.indexOf(batch) < batches.length - 1) {
        await delay(1000);
      }

    } catch (error) {
      console.error("Batch processing failed:", error);
      // We continue to the next batch even if one fails, to show partial data
    }
  }

  if (flatResults.length === 0) {
    throw new Error("No data could be retrieved from Google Maps. The service might be overloaded.");
  }

  // Validate and map data
  const validatedData: MuseumData[] = flatResults.map((item: any) => ({
    name: item.name || "Unknown Museum",
    rating: typeof item.rating === 'number' ? item.rating : parseFloat(item.rating) || 0,
    reviewCount: typeof item.reviewCount === 'number' ? item.reviewCount : parseInt(item.reviewCount) || 0,
    address: item.address || "",
    url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((item.name || "") + " Cologne")}`,
    keywords: Array.isArray(item.keywords)
      ? item.keywords.map((k: any) => ({
        text: typeof k.text === 'string' ? k.text : "Keyword",
        // Ensure value is an integer between 1 and 10
        value: typeof k.value === 'number' ? Math.max(1, Math.min(10, Math.round(k.value))) : 5
      }))
      : [],
    sentiment: item.sentiment || { positive: 0, neutral: 0, negative: 0 }
  }));

  return validatedData;
};