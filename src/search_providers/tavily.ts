import fetch from 'node-fetch';

interface TavilySearchResult {
  url: string;
  content: string;
  title?: string;
}

export async function tavilySearch(query: string, maxResults: number = 5): Promise<{ sources: TavilySearchResult[], images: any[] }> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error("Tavily API key is not set in environment variables (TAVILY_API_KEY).");
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: "advanced",
        include_answer: false,
        include_images: false,
        max_results: maxResults,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Tavily API request failed with status ${response.status}: ${errorBody}`);
    }

    const data = await response.json() as { results: TavilySearchResult[] };
    
    return {
      sources: data.results.map(item => ({
        url: item.url,
        title: item.title || 'No title',
        content: item.content,
      })),
      images: [], // Tavily image search not implemented here
    };

  } catch (error) {
    console.error("Error during Tavily search:", error);
    // Return empty results on failure to avoid crashing the whole process
    return { sources: [], images: [] };
  }
}