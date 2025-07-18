# Deep Research Bot - 自动化 AI 研究员

这是一个基于 Node.js 和 TypeScript 构建的自动化 AI 研究工具。它能根据您设定的一个核心问题，自动进行问题分解、网络搜索、信息总结，并最终生成一份结构化的研究报告，通过邮件发送给您。

## ✨ 功能特性

-   **自动化研究流程**: 从一个问题出发，全自动完成研究和报告撰写。
-   **迭代式学习**: 模仿人类研究员的工作方式，对子问题进行独立研究和增量式总结，提高报告质量。
-   **动态研究流程**: 引入“研究规划”和“反思修正”步骤，使研究过程更智能、更深入。
-   **高度可配置**: 通过 `config.yaml` 文件，轻松配置研究主题、语言、AI 提供商和搜索提供商。
-   **模块化提供商**:
    -   **AI 提供商**: 支持 `OpenAI` (及其兼容服务) 和 `Google Gemini`，可轻松扩展。
    -   **搜索提供商**: 支持 `Tavily` 和 `Google` (爬虫)，可轻松扩展。
-   **健壮的错误处理**: 内置重试和后备机制，确保在各种网络和模型环境下稳定运行。
-   **邮件通知**: 研究完成后，自动将报告发送到指定邮箱。

## 🛠️ 技术栈

-   **核心框架**: [Node.js](https://nodejs.org/)
-   **语言**: [TypeScript](https://www.typescriptlang.org/)
-   **AI SDK**: [Vercel AI SDK](https://sdk.vercel.ai/)
-   **主要依赖**:
    -   `@ai-sdk/openai`, `@ai-sdk/google`: AI 提供商适配器
    -   `nodemailer`: 邮件发送
    -   `js-yaml`: YAML 配置文件解析
    -   `dotenv`: 环境变量管理
    -   `ts-node`: 直接运行 TypeScript 代码
    -   `node-fetch`: HTTP 请求库

## 🚀 快速开始

### 1. 克隆与安装

```bash
# 克隆项目 (如果您在本地)
# git clone ...

# 安装依赖
pnpm install
```

### 2. 创建配置文件

项目使用两个配置文件来分离应用行为和敏感信息。

**a. 创建 `.env` 文件 (存放密钥)**

复制模板文件：
```bash
cp .env.example .env
```
然后，编辑新创建的 `.env` 文件，填入您的真实凭证。文件中的注释会为您提供指导。

**b. 修改 `config.yaml` 文件 (配置任务)**

打开 `config.yaml` 文件，根据您的需求修改以下内容：
-   `researchQuestion`: 核心研究问题。
-   `researchLanguage`: 研究过程语言 (建议 `English`)。
-   `writingLanguage`: 最终报告的撰写语言。
-   `aiProvider`: AI 提供商 (`openai` 或 `gemini`)。
-   `modelName`: 使用的 AI 模型 ID (例如 `gpt-4o` 或 `gemini-1.5-pro-latest`)。
-   `searchProvider`: 搜索引擎 (`tavily` 或 `google`)。
-   `maxIterations`: 研究循环的最大迭代次数。
-   `maxResults`: 每个子问题获取的搜索结果数量。
-   `generateKnowledgeGraph`: 是否在报告后生成知识图谱。
-   `maxFinalContextChars`: 生成最终报告时，允许的最大上下文长度（字符数）。

### 3. 运行项目

完成配置后，执行以下命令启动研究任务：

```bash
pnpm start
```

程序将开始执行，并在完成后将报告发送到您在 `.env` 文件中配置的 `EMAIL_TO` 邮箱地址。

## ⚙️ 配置文件详解

### `config.yaml`

这个文件用于控制应用的**行为**。您可以安全地将此文件提交到版本控制中。

-   **researchQuestion**: 核心研究问题。
-   **modelName**: 使用的 AI 模型 ID。
-   **researchLanguage**: 研究过程语言，决定了搜索查询的语言。
-   **writingLanguage**: 最终报告的撰写语言。

### `.env`

这个文件用于存放**敏感信息**，如 API 密钥和密码。**请勿将此文件提交到任何公共代码仓库。**

-   **OPENAI_API_KEY**: OpenAI 或兼容服务的 API 密钥。
-   **OPENAI_BASE_URL**: (可选) 自定义 OpenAI 兼容服务的 Base URL。
-   **GOOGLE_API_KEY**: Google AI Studio (Gemini) 的 API 密钥。
-   **GOOGLE_BASE_URL**: (可选) 自定义 Gemini 兼容服务的 Base URL。
-   **TAVILY_API_KEY**: Tavily 搜索引擎的 API 密钥。
-   **EMAIL_...**: 用于发送报告的 SMTP 邮件服务配置。