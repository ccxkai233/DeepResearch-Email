export async function crawlPage(url: string) {
  try {
    if (!url) throw new Error("Missing parameters!");
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' } });
    const result = await response.text();

    const titleRegex = /<title>(.*?)<\/title>/i;
    const titleMatch = result.match(titleRegex);
    const title = titleMatch ? titleMatch[1].trim() : "";

    return { url, title, content: result };
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
      throw new Error(`Failed to crawl ${url}: ${error.message}`);
    }
    throw new Error(`An unknown error occurred while crawling ${url}`);
  }
}