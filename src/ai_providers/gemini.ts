import { createGoogleGenerativeAI } from '@ai-sdk/google';

export function getGeminiModel(modelName: string) {
  const google = createGoogleGenerativeAI({
    // The API key is automatically read from the GOOGLE_API_KEY
    // environment variable.
    baseURL: process.env.GOOGLE_BASE_URL, // Support for custom base URL
  });

  return google(modelName);
}