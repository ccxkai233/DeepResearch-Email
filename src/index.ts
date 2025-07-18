import { runDeepResearch } from '../core_logic/main';
import { sendEmail } from './email';
import dotenv from 'dotenv';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import showdown from 'showdown';

// Load environment variables from .env file
dotenv.config();

// Define the structure of our configuration
import pako from 'pako';

interface AppConfig {
  researchQuestion: string;
  researchLanguage: string;
  writingLanguage: string;
  modelName: string;
  aiProvider: string;
  searchProvider: string;
  maxIterations: number;
  maxResults: number;
  maxFinalContextChars: number;
}

async function main() {
  // Load and parse the YAML configuration file
  let config: AppConfig;
  try {
    const configFile = fs.readFileSync(path.join(process.cwd(), 'config.yaml'), 'utf8');
    config = yaml.load(configFile) as AppConfig;
  } catch (e) {
    console.error("错误：无法读取或解析 config.yaml 文件。", e);
    return;
  }

  // Check for API key and recipient email in .env
  if (!process.env.OPENAI_API_KEY) {
    console.error("错误：请在项目根目录创建一个 .env 文件，并添加您的 OPENAI_API_KEY。");
    return;
  }
  if (!process.env.EMAIL_TO) {
    console.error("错误：请在 .env 文件中指定收件人邮箱 EMAIL_TO。");
    return;
  }

  const { researchQuestion, researchLanguage, writingLanguage, modelName, aiProvider, searchProvider, maxIterations, maxResults, maxFinalContextChars } = config;
  const recipientEmail = process.env.EMAIL_TO;

  console.log(`🚀 开始深度研究，问题: "${researchQuestion}"`);
  console.log(`   - AI 提供商: ${aiProvider}, 模型: ${modelName}`);
  console.log(`   - 搜索提供商: ${searchProvider}, 每轮搜索 ${maxResults} 条结果`);
  console.log(`   - 研究语言: ${researchLanguage}, 报告语言: ${writingLanguage}`);
  console.log(`   - 最大研究迭代次数: ${maxIterations}`);
  console.log(`   - 最大最终上下文长度: ${maxFinalContextChars} 字符`);

  try {
    const { finalReport, sources } = await runDeepResearch({
      initialQuestion: researchQuestion,
      researchLanguage,
      writingLanguage,
      modelName,
      aiProvider,
      searchProvider,
      maxIterations,
      maxResults,
      maxFinalContextChars,
    });

    console.log("\n✅ 研究完成！正在发送邮件...");
    
    let reportContent = finalReport || "AI 未能生成有效的报告内容。";
    
    if (sources && sources.length > 0) {
      const references = sources.map((source, idx) => `[${idx + 1}]: ${source.url} "${source.title || ''}"`).join('\n');
      reportContent += `\n\n---\n\n**参考文献**\n${references}`;
    }

    const converter = new showdown.Converter();
    let emailHtml = converter.makeHtml(reportContent);

    await sendEmail({
      to: recipientEmail,
      subject: `深度研究报告: ${researchQuestion}`,
      text: reportContent,
      html: emailHtml,
    });

    console.log(`\n🎉 成功！报告已发送至 ${recipientEmail}`);

  } catch (error) {
    console.error("\n❌ 处理过程中发生严重错误:", error);
  }
}

main();