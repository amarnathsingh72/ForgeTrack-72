// STUB: This is currently set up to fetch directly from Gemini for Phase 0 scaffolding.
// WARNING: Do not use this in production from the browser due to API Key exposure.
// This will be migrated to the FastApi backend in Phase 4.

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export async function invokeGemini(systemPrompt = '', userContent = '') {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userContent }]
        }
      ]
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  return response.json();
}
