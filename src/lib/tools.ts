import type OpenAI from "openai";
import { writeMemory, appendToMemory, listMemoryFiles, readAllMemories } from "./memory";

export const FINANCIAL_TOOLS: OpenAI.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "save_memory",
      description:
        "Save or update a memory file. Use client-profile.md to learn about the user over time (preferences, patterns, life context). Use goals/decisions/focus/preferences for specific financial items.",
      parameters: {
        type: "object",
        properties: {
          file: {
            type: "string",
            enum: ["client-profile.md", "goals.md", "decisions.md", "focus.md", "preferences.md"],
            description: "Which memory file to update. Use client-profile.md for learning about the user.",
          },
          section: {
            type: "string",
            description: "Section heading to update (e.g., 'Financial Personality', 'Life Goals', 'Long-term')",
          },
          entry: {
            type: "string",
            description: "The memory entry to add",
          },
        },
        required: ["file", "entry"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_plan",
      description:
        "Create a financial plan document. Use this when the user asks for a detailed plan (debt payoff, investment strategy, budget plan, etc.).",
      parameters: {
        type: "object",
        properties: {
          filename: {
            type: "string",
            description: "Filename ending in .md, e.g. 'debt-payoff-plan.md'",
          },
          title: { type: "string", description: "Plan title" },
          content: {
            type: "string",
            description: "Full markdown content of the plan",
          },
        },
        required: ["filename", "title", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_simulation",
      description:
        "Create a financial simulation or scenario analysis. Use this for what-if analyses, projections, and comparisons.",
      parameters: {
        type: "object",
        properties: {
          filename: {
            type: "string",
            description: "Filename ending in .md, e.g. '5yr-projection.md'",
          },
          title: { type: "string", description: "Simulation title" },
          content: {
            type: "string",
            description: "Full markdown content of the simulation",
          },
        },
        required: ["filename", "title", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_memory",
      description: "Read all current memory files to refresh context.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "list_memories",
      description: "List all memory files with previews.",
      parameters: { type: "object", properties: {} },
    },
  },
];

export async function executeTool(
  name: string,
  args: Record<string, string>
): Promise<string> {
  switch (name) {
    case "save_memory": {
      const { file, section, entry } = args;
      if (section) {
        await appendToMemory(file, section, entry);
      } else {
        await writeMemory(file, entry);
      }
      return `Memory saved to ${file}`;
    }
    case "create_plan": {
      const { filename, title, content } = args;
      const fullContent = `# ${title}\n\n${content}`;
      await writeMemory(`plans/${filename}`, fullContent);
      return `Plan created: memory/plans/${filename}`;
    }
    case "run_simulation": {
      const { filename, title, content } = args;
      const fullContent = `# ${title}\n\n${content}`;
      await writeMemory(`simulations/${filename}`, fullContent);
      return `Simulation created: memory/simulations/${filename}`;
    }
    case "read_memory": {
      const memories = await readAllMemories();
      return memories || "No memories found.";
    }
    case "list_memories": {
      const files = await listMemoryFiles();
      if (files.length === 0) return "No memory files found.";
      return files.map((f) => `${f.path}: ${f.preview}`).join("\n");
    }
    default:
      return `Unknown tool: ${name}`;
  }
}
