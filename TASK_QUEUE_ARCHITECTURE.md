# 最终架构蓝图：融合智能路由的混合任务系统 (v3.0)

## 1. 核心设计原则

此架构旨在构建一个健壮、灵活、**成本优化**且可扩展的自动化研究引擎。

-   **混合任务来源 (Hybrid Sources)**:
    -   **配置文件 (`config.yaml`)**: 用于定义预设的、计划内的、高优先级的“主动”任务。
    -   **开放API (`/research`)**: 用于接收临时的、按需的、普通优先级的“被动”任务。

-   **优先级队列 (Priority Queue)**:
    -   `config.yaml` 中的任务被赋予**高优先级**，可以“插队”。
    -   API提交的任务被赋予**普通优先级**。

-   **智能模型路由 (Intelligent Model Routing)**:
    -   引入**“思考模型”**和**“任务模型”**的双模型策略，以平衡成本与质量。
    -   **思考模型 (Thinking Model)**: 用于规划、综合、最终报告等需要深度推理的创造性任务 (e.g., GPT-4, Claude Opus)。
    -   **任务模型 (Task Model)**: 用于总结搜索结果等重复性的信息处理任务 (e.g., GPT-3.5, Claude Sonnet)。

-   **任务级精细化配置 (Granular Configuration)**:
    -   每个任务都是独立的配置单元，可单独指定：`researchQuestion`, `recipients`, `researchLanguage`, `writingLanguage`, 甚至覆盖全局的模型设置。

## 2. 系统工作流程

```mermaid
graph TD
    subgraph "任务来源"
        A[config.yaml]
        B[外部应用/用户]
    end

    subgraph "调度核心"
        C(优先级队列)
        D{后台工作循环}
    end

    subgraph "执行与通知"
        E[runDeepResearch(task)]
        F[发送邮件]
    end
    
    subgraph "AI模型"
        ThinkingModel["思考模型 (GPT-4)"]
        TaskModel["任务模型 (GPT-3.5)"]
    end

    A -- 启动时加载 --> C
    B -- HTTP POST /research --> G[API Endpoint]
    G -- 验证并推入队列 --> C
    G -- 立即响应: {taskId, queuePosition} --> B
    
    D -- 拉取最高优先级任务 --> C
    D -- 执行任务 --> E
    
    E -- 规划/最终报告 --> ThinkingModel
    E -- 总结子任务 --> TaskModel
    
    E -- 返回报告 --> D
    D -- 根据任务配置发送报告 --> F
```

## 3. 统一任务模型 (Unified Task Schema)

```typescript
interface ResearchTask {
  id: string;
  priority: number;
  researchQuestion: string;
  recipients: string[];
  researchLanguage?: string;
  writingLanguage?: string;
  // 可选的模型覆盖
  thinkingModel?: string;
  taskModel?: string;
}
```

## 4. `config.yaml` 最终形态 (v3.0)

```yaml
# ===============================================================
# Deep Research Bot - 混合任务系统配置文件 (v3.0)
# ===============================================================

# --- 全局默认配置 ---
globalSettings:
  researchLanguage: "en-US"
  writingLanguage: "zh-CN"
  aiProvider: "openai"
  # 双模型策略
  thinkingModel: "gpt-4-turbo" # 用于规划和最终报告的强大模型
  taskModel: "gpt-3.5-turbo"   # 用于总结搜索结果的快速、经济的模型
  # ... 其他全局流程/模型配置 ...

# --- 高优先级任务队列 ---
highPriorityTasks:
  - researchQuestion: "过去一周，AI在生物医药领域的突破性进展有哪些？"
    recipients:
      - "biotech-team-lead@work.com"
      - "cto@work.com"
    # 此任务将使用全局默认的模型设置

  - researchQuestion: "对比评测一下最新的开源代码生成模型"
    recipients:
      - "dev-team-all@work.com"
    # 为此特定任务覆盖全局模型设置
    thinkingModel: "claude-3-opus-20240229"
    taskModel: "claude-3-sonnet-20240229"
```

## 5. API 设计

-   **Endpoint**: `POST /research`
-   **Request Body (JSON)**:
    ```json
    {
      "researchQuestion": "从零开始学习Rust语言的最佳路径是什么？",
      "recipients": ["new-developer@example.com"],
      "researchLanguage": "en-US", // 可选
      "writingLanguage": "zh-CN",  // 可选
      "thinkingModel": "gpt-4o",   // 可选
      "taskModel": "gpt-4o-mini" // 可选
    }
    ```
-   **Success/Error Responses**: (与v2.0相同)

## 6. 实施步骤

1.  **更新架构文档**: (当前步骤) 确认 v3.0 最终蓝图。
2.  **安装依赖**: 引入 `express` (或 `fastify`) 和 `p-queue`。
3.  **重构 `config.yaml`**: 应用 v3.0 结构。
4.  **创建 `src/api.ts`**: 实现API服务器。
5.  **创建 `src/queue.ts`**: 实现优先级队列逻辑。
6.  **重构 `src/index.ts`**: 实现主入口，启动API和后台工作循环。
7.  **核心改造 `core_logic/main.ts`**:
    -   修改 `runDeepResearch` 函数，使其接收完整的 `ResearchTask` 对象。
    -   实现**双模型调用逻辑**：根据任务阶段（规划/总结/报告）选择调用 `thinkingModel` 或 `taskModel`。
    -   实现多语言支持。
8.  **全面测试**:
    -   测试 `config.yaml` 任务。
    -   测试 API 任务。
    -   测试优先级插队。
    -   测试**模型覆盖**是否生效。