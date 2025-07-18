import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import fs from 'fs';
import path from 'path';

// Function to read prompt files
function readPrompt(fileName: string): string {
    try {
        return fs.readFileSync(path.join(process.cwd(), 'prompts', fileName), 'utf-8');
    } catch (error) {
        console.error(`Error reading prompt file: ${fileName}`, error);
        return '';
    }
}

const systemInstruction = readPrompt('systemInstruction.md');
const systemQuestionPrompt = readPrompt('systemQuestionPrompt.md');
const reportPlanPrompt = readPrompt('reportPlanPrompt.md');
const serpQueriesPrompt = readPrompt('serpQueriesPrompt.md');
const queryResultPrompt = readPrompt('queryResultPrompt.md');
const citationRulesPrompt = readPrompt('citationRulesPrompt.md');
const searchResultPrompt = readPrompt('searchResultPrompt.md');
const searchKnowledgeResultPrompt = readPrompt('searchKnowledgeResultPrompt.md');
const reviewPrompt = readPrompt('reviewPrompt.md');
const finalReportCitationImagePrompt = readPrompt('finalReportCitationImagePrompt.md');
const finalReportReferencesPrompt = readPrompt('finalReportReferencesPrompt.md');
const finalReportPrompt = readPrompt('finalReportPrompt.md');
export const knowledgeGraphPrompt = readPrompt('knowledgeGraphPrompt.md');

export function getSERPQuerySchema() {
  return z
    .array(
      z
        .object({
          query: z.string().describe("The SERP query."),
          researchGoal: z
            .string()
            .describe(
              "First talk about the goal of the research that this query is meant to accomplish, then go deeper into how to advance the research once the results are found, mention additional research directions. Be as specific as possible, especially for additional research directions. JSON reserved words should be escaped."
            ),
        })
        .required({ query: true, researchGoal: true })
    )
    .describe(`List of SERP queries.`);
}

export function getSERPQueryOutputSchema() {
  const SERPQuerySchema = getSERPQuerySchema();
  return JSON.stringify(zodToJsonSchema(SERPQuerySchema), null, 4);
}

export function getSystemPrompt() {
  return systemInstruction.replace("{now}", new Date().toISOString());
}

export function generateQuestionsPrompt(query: string, researchLanguage: string) {
  const languageInstruction = `\n\n**Your internal monologue and the questions you generate should be in ${researchLanguage}.**`;
  return systemQuestionPrompt.replace("{query}", query) + languageInstruction;
}

export function writeReportPlanPrompt(query: string, questions: string[]) {
  const questionList = questions.map(q => `- ${q}`).join('\n');
  return reportPlanPrompt
    .replace("{query}", query)
    .replace("${guidelinesPrompt}", `Based on the following research questions:\n${questionList}`); // A bit of a hack to inject questions
}

export function generateSerpQueriesPrompt(plan: string) {
  return serpQueriesPrompt
    .replace("{plan}", plan)
    .replace("{outputSchema}", getSERPQueryOutputSchema());
}

export function processResultPrompt(query: string, researchGoal: string) {
  return queryResultPrompt
    .replace("{query}", query)
    .replace("{researchGoal}", researchGoal);
}

export function processSearchResultPrompt(
  query: string,
  researchGoal: string,
  results: any[], // Simplified for backend
  enableReferences: boolean
) {
  const context = results.map(
    (result, idx) =>
      `<content index="${idx + 1}" url="${result.url}">\n${
        result.content
      }\n</content>`
  );
  return (
    searchResultPrompt + (enableReferences ? `\n\n${citationRulesPrompt}` : "")
  )
    .replace("{query}", query)
    .replace("{researchGoal}", researchGoal)
    .replace("{context}", context.join("\n"));
}

export function processSearchKnowledgeResultPrompt(
  query: string,
  researchGoal: string,
  results: any[] // Simplified for backend
) {
  const context = results.map(
    (result, idx) =>
      `<content index="${idx + 1}" url="local.knowledge">\n${
        result.content
      }\n</content>`
  );
  return searchKnowledgeResultPrompt
    .replace("{query}", query)
    .replace("{researchGoal}", researchGoal)
    .replace("{context}", context.join("\n"));
}

export function reviewSerpQueriesPrompt(
  plan: string,
  learning: string[],
  suggestion: string
) {
  const learnings = learning.map(
    (detail) => `<learning>\n${detail}\n</learning>`
  );
  return reviewPrompt
    .replace("{plan}", plan)
    .replace("{learnings}", learnings.join("\n"))
    .replace("{suggestion}", suggestion)
    .replace("{outputSchema}", getSERPQueryOutputSchema());
}

export function writeFinalReportPrompt(
  plan: string,
  learning: string[],
  source: any[], // Simplified
  images: any[], // Simplified
  requirement: string,
  enableCitationImage: boolean,
  enableReferences: boolean,
  writingLanguage: string
) {
  const learnings = learning.map(
    (detail) => `<learning>\n${detail}\n</learning>`
  );
  const sources = source.map(
    (item, idx) =>
      `<source index="${idx + 1}" url="${item.url}">\n${item.title}\n</source>`
  );
  const imageList = images.map(
    (source, idx) => `${idx + 1}. ![${source.description}](${source.url})`
  );
  const languageInstruction = `\n\n**The final report must be written in ${writingLanguage}.**`;

  return (
    finalReportPrompt +
    (enableCitationImage
      ? `\n**Including meaningful images from the previous research in the report is very helpful.**\n\n${finalReportCitationImagePrompt}`
      : "") +
    (enableReferences ? `\n\n${finalReportReferencesPrompt}` : "") +
    languageInstruction
  )
    .replace("{plan}", plan)
    .replace("{learnings}", learnings.join("\n"))
    .replace("{sources}", sources.join("\n"))
    .replace("{images}", imageList.join("\n"))
    .replace("{requirement}", requirement);
}