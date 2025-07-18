import { streamText, smoothStream, type JSONValue, type Tool } from "ai";
import { parsePartialJson } from "@ai-sdk/ui-utils";
import { createOpenAI } from "@ai-sdk/openai";
import Plimit from "p-limit";
import {
  getSystemPrompt,
  generateQuestionsPrompt,
  writeReportPlanPrompt,
  generateSerpQueriesPrompt,
  processResultPrompt,
  processSearchResultPrompt,
  processSearchKnowledgeResultPrompt,
  reviewSerpQueriesPrompt,
  writeFinalReportPrompt,
  getSERPQuerySchema,
} from "./prompts";
import { ThinkTagStreamProcessor, removeJsonMarkdown } from "./text_utils";
import { crawlPage } from "./crawler";

// This will replace the Zustand store in a Node.js environment
let taskState: any = {
  question: "",
  tasks: [],
  finalReport: "",
  sources: [],
  // ... other state properties
};

// This will replace the useModelProvider hook
// You need to implement the logic to get your actual AI provider
import { getGeminiModel } from "../src/ai_providers/gemini";

async function createModelProvider(provider: string, modelName: string) {
  switch (provider) {
    case "gemini":
      console.log("   - Using Gemini AI Provider.");
      return getGeminiModel(modelName);
    case "openai":
    default:
      console.log("   - Using OpenAI-compatible AI Provider.");
      const openai = createOpenAI({
        baseURL: process.env.OPENAI_BASE_URL, // Will be undefined if not set
      });
      return openai(modelName);
  }
}

// This will replace the useWebSearch hook
import { tavilySearch } from "../src/search_providers/tavily";

async function search(query: string, provider: string, maxResults: number) {
  console.log(`Searching for: "${query}" using ${provider}`);
  switch (provider) {
    case "tavily":
      return tavilySearch(query, maxResults);
    case "google": // Keep the old crawler as a fallback/default
    default:
      const crawledData = await crawlPage(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
      return {
          sources: [{ url: crawledData.url, title: crawledData.title, content: crawledData.content }],
          images: []
      };
  }
}


interface ResearchConfig {
  initialQuestion: string;
  researchLanguage: string;
  writingLanguage: string;
  modelName: string;
}

interface AppConfig {
  searchProvider: string;
  aiProvider: string;
  maxIterations: number;
  maxResults: number;
  maxFinalContextChars: number;
}

interface Source {
  url: string;
  title?: string;
  content?: string;
}

export async function runDeepResearch({
  initialQuestion,
  researchLanguage,
  writingLanguage,
  modelName,
  searchProvider,
  aiProvider,
  maxIterations,
  maxResults,
  maxFinalContextChars
}: ResearchConfig & AppConfig): Promise<{ finalReport: string, sources: Source[] }> {
  taskState.question = initialQuestion;
  const model = await createModelProvider(aiProvider, modelName);

  console.log(`1. Generating initial questions in ${researchLanguage} using ${modelName} via ${aiProvider}...`);
  const questions = await generateInitialQuestions(model, initialQuestion, researchLanguage);
  if (questions.length === 0) {
    throw new Error("Failed to generate research questions. Aborting.");
  }
  taskState.tasks = questions.map((q: any) => ({ type: 'search', query: q.question, state: 'pending', result: '' }));
  console.log("   - Generated questions:", taskState.tasks.map((t: { query: string }) => t.query));

  console.log("\n2. Generating Report Plan...");
  const reportPlan = await generateReportPlan(model, initialQuestion, questions.map((q: any) => q.question));
  console.log("   - Report Plan Generated:", reportPlan);

  console.log("\n3. Starting Dynamic Research Loop...");
  const searchLimit = Plimit(2);
  let allSummaries: string[] = [];
  let allSources: Source[] = [];
  let rollingSummary = ""; // New variable for rolling summary
  let completedTasks = 0;
  let currentIteration = 0;

  while (taskState.tasks.length > 0 && currentIteration < maxIterations) {
    currentIteration++;
    console.log(`\n--- Iteration ${currentIteration} ---`);
    
    const tasksToProcess = [...taskState.tasks];
    taskState.tasks = []; // Clear tasks for the next iteration

    const iterationSummaries = await Promise.all(
      tasksToProcess.map(async (task: any) => {
        completedTasks++;
        console.log(`   - Task ${completedTasks}: Researching "${task.query}"`);
        const searchResults = await searchLimit(() => search(task.query, searchProvider, maxResults));
        console.log(`     - Summarizing results for "${task.query}"`);
        const summary = await summarizeSearchResults(model, task.query, searchResults.sources);
        console.log(`     - Summary generated.`);
        allSources.push(...searchResults.sources);
        return summary;
      })
    );
    
    allSummaries.push(...iterationSummaries);

    console.log(`\n   - Iteration ${currentIteration} Review: Consolidating learnings...`);
    rollingSummary = await consolidateSummaries(model, rollingSummary, iterationSummaries);
    console.log("     - Learnings consolidated.");

    console.log(`\n   - Iteration ${currentIteration} Review: Reflecting and planning next steps...`);
    const newTasks = await reviewAndGenerateNextTasks(model, reportPlan, [rollingSummary]); // Pass only the consolidated summary
    taskState.tasks.push(...newTasks);

    if (newTasks.length > 0) {
      console.log(`   - Generated ${newTasks.length} new research tasks for the next iteration.`);
    } else {
      console.log("   - Review complete. No further research tasks needed.");
    }
  }

  if (currentIteration >= maxIterations) {
    console.log("\n- Maximum research iterations reached.");
  }

  console.log("\n4. Generating Final Report...");
  console.log(`   - Final context size for report generation: ${allSummaries.join('\n').length} characters.`);

  const contextForReport = allSummaries.join('\n').slice(-maxFinalContextChars);
  const reportResult = await streamText({
    model: model,
    system: getSystemPrompt(),
    prompt: writeFinalReportPrompt(
      reportPlan,
      [contextForReport],
      [], // Sources are now part of the context
      [], // images - not implemented yet
      `The user wants a comprehensive report based on the research summaries.`,
      false,
      true,
      writingLanguage
    ),
  });

  let finalReport = "";
  for await (const delta of reportResult.textStream) {
    finalReport += delta;
  }

  taskState.finalReport = finalReport;

  const uniqueSources = Array.from(new Map(allSources.map(source => [source.url, source])).values());
  taskState.sources = uniqueSources;

  return { finalReport, sources: uniqueSources };
}

async function summarizeSearchResults(model: any, query: string, sources: any[]): Promise<string> {
  const context = sources.map((source, idx) =>
    `<content index="${idx + 1}" url="${source.url}">\n${source.content}\n</content>`
  ).join("\n\n");

  // Ensure the context for summarization is also within a safe limit
  const MAX_SUMMARY_CONTEXT = 100000;
  const truncatedContext = context.substring(0, MAX_SUMMARY_CONTEXT);

  const summaryResult = await streamText({
    model: model,
    system: getSystemPrompt(),
    prompt: processSearchResultPrompt(
      query,
      "Summarize the key findings and insights from the provided text.",
      [{ content: truncatedContext }], // Simplified structure for this prompt
      true
    ),
  });

  let summary = "";
  for await (const delta of summaryResult.textStream) {
    summary += delta;
  }
  return summary;
}

async function generateInitialQuestions(model: any, initialQuestion: string, researchLanguage: string, attempt = 1): Promise<any[]> {
    console.log(`   - Attempt ${attempt} to generate questions...`);
    const thinkTagStreamProcessor = new ThinkTagStreamProcessor();
    
    // On the second attempt, use a simpler prompt.
    const prompt = attempt === 1
        ? generateQuestionsPrompt(initialQuestion, researchLanguage)
        : `List 5 specific research questions based on the topic "${initialQuestion}". Respond in ${researchLanguage}. Use a new line for each question.`;

    const result = streamText({
        model: model,
        system: getSystemPrompt(),
        prompt: prompt,
    });

    let content = "";
    for await (const part of result.fullStream) {
        if (part.type === "text-delta") {
            thinkTagStreamProcessor.processChunk(
                part.textDelta,
                (data) => { content += data; },
                (data) => { /* reasoning part, can be logged */ }
            );
        }
    }
    
    // Attempt to parse as JSON first
    try {
        const parsedJson = parsePartialJson(removeJsonMarkdown(content));
        if (Array.isArray(parsedJson) && parsedJson.length > 0) {
            return parsedJson;
        }
    } catch (e) {
        // JSON parsing failed, which is okay. We'll try splitting by newline next.
    }

    // If JSON parsing fails or returns an empty array, try splitting by newlines
    let questionsFromNewlines = content.replace(/```(json)?/g, '').split('\n').filter(q => q.trim() !== '').map(q => {
        // Clean the question text itself
        const cleanedQuestion = q.replace(/^- /, '').replace(/"question":\s*"/, '').replace(/"$/, '').trim();
        return { question: cleanedQuestion };
    });
    
    // Clean up the array from JSON artifacts
    questionsFromNewlines = questionsFromNewlines.filter(item => {
        const q = item.question;
        // Filter out items that are just JSON syntax or very short
        return !['[', ']', '{', '}', '},', '],'].includes(q) && q.length > 10;
    });

    if (questionsFromNewlines.length > 0) {
        return questionsFromNewlines;
    }

    // If still no questions and we haven't retried, retry once.
    if (attempt < 2) {
        console.log("   - Failed to generate questions on first attempt, retrying with a simpler prompt...");
        return await generateInitialQuestions(model, initialQuestion, researchLanguage, 2);
    }

    console.error("   - Failed to generate questions after multiple attempts.");
    return []; // Return empty array if all attempts fail.
}

async function generateReportPlan(model: any, initialQuestion: string, questions: string[]): Promise<string> {
  const result = await streamText({
    model: model,
    system: getSystemPrompt(),
    prompt: writeReportPlanPrompt(initialQuestion, questions),
  });

  let plan = "";
  for await (const delta of result.textStream) {
    plan += delta;
  }
  return plan;
}

async function reviewAndGenerateNextTasks(model: any, plan: string, summaries: string[]): Promise<any[]> {
  const result = await streamText({
    model: model,
    system: getSystemPrompt(),
    prompt: reviewSerpQueriesPrompt(
      plan,
      summaries,
      "Generate new queries if the current information is not sufficient to write a comprehensive report."
    ),
  });

  let content = "";
  for await (const delta of result.textStream) {
    content += delta;
  }

  // The review prompt is expected to return a JSON array of new queries.
  try {
    const parsedJson = parsePartialJson(removeJsonMarkdown(content));
    if (Array.isArray(parsedJson)) {
      return parsedJson.map(q => ({ type: 'search', query: q.query, state: 'pending', result: '' }));
    }
    return [];
  } catch (e) {
    console.error("   - Failed to parse new tasks JSON from review, ending research loop.", e);
    return [];
  }
}

async function consolidateSummaries(model: any, previousSummary: string, newSummaries: string[]): Promise<string> {
  if (newSummaries.length === 0) {
    return previousSummary;
  }

  const consolidationPrompt = `
    Previous summary of research:
    <PREVIOUS_SUMMARY>
    ${previousSummary || "No previous summary."}
    </PREVIOUS_SUMMARY>

    New information gathered in the latest research round:
    <NEW_INFORMATION>
    ${newSummaries.join("\n\n---\n\n")}
    </NEW_INFORMATION>

    Please consolidate the new information with the previous summary into a single, updated, and coherent summary.
    The goal is to create a comprehensive overview of all findings so far.
    Do not lose critical information, but be concise.
  `;

  const result = await streamText({
    model: model,
    prompt: consolidationPrompt,
  });

  let consolidatedSummary = "";
  for await (const delta of result.textStream) {
    consolidatedSummary += delta;
  }
  return consolidatedSummary;
}
