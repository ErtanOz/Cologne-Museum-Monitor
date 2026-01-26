import OpenAI from 'openai';

const apiKey = "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";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: apiKey,
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "Cologne Museum Monitor Test",
  }
});

async function test() {
  console.log("Testing OpenRouter API with FULL PROMPT...");
  
  const museumNames = ["Museum Ludwig", "Schokoladenmuseum Köln"]; 
  const prompt = `
    Provide current information for the following museums in Cologne, Germany:
    ${museumNames.join(", ")}

    For each museum, I need:
    1. The exact name.
    2. The actual current Google Maps rating (e.g., 4.7).
    3. The actual total number of reviews.
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
    const completion = await openai.chat.completions.create({
      model: "meta-llama/llama-3.3-70b-instruct:free",
      messages: [{ role: "user", content: prompt }],
    });
    const raw = completion.choices[0].message.content;
    console.log("--------------------------------");
    console.log("Raw Output Length:", raw.length);
    console.log("--------------------------------");
    
    try {
      const clean = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      console.log("✅ JSON IS VALID!");
      console.log("Museums found:", parsed.museums?.length);
    } catch (e) {
      console.log("❌ JSON IS INVALID");
      console.log("Error:", e.message);
      console.log("First 100 chars:", raw.substring(0, 100));
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

test();
