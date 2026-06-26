import type OpenAI from "openai";
import { writeMemory, appendToMemory, listMemoryFiles, readAllMemories } from "./memory";
import { getDb } from "./db";

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
  {
    type: "function",
    function: {
      name: "manage_income",
      description: "Create, update, or delete an income source. Use this when the user wants to add or modify income entries.",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["create", "update", "delete"], description: "Action to perform" },
          id: { type: "string", description: "ID of existing record (required for update/delete)" },
          source: { type: "string", description: "Income source name" },
          amount: { type: "number", description: "Amount" },
          frequency: { type: "string", enum: ["monthly", "biweekly", "annual"], description: "Payment frequency" },
          notes: { type: "string", description: "Optional notes" },
        },
        required: ["action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "manage_investment",
      description: "Create, update, or delete an investment. Use when the user wants to add stocks, ETFs, bonds, crypto, retirement accounts, etc.",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["create", "update", "delete"], description: "Action to perform" },
          id: { type: "string", description: "ID of existing record (required for update/delete)" },
          name: { type: "string", description: "Investment name" },
          type: { type: "string", enum: ["stock", "bond", "etf", "crypto", "retirement", "other"], description: "Investment type" },
          ticker: { type: "string", description: "Ticker symbol (optional)" },
          shares: { type: "number", description: "Number of shares (optional)" },
          costBasis: { type: "number", description: "Total cost basis (optional)" },
          currentValue: { type: "number", description: "Current market value" },
          notes: { type: "string", description: "Optional notes" },
        },
        required: ["action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "manage_credit_card",
      description: "Create, update, or delete a credit card. Use when the user wants to add or modify credit card entries.",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["create", "update", "delete"], description: "Action to perform" },
          id: { type: "string", description: "ID of existing record (required for update/delete)" },
          name: { type: "string", description: "Card name" },
          balance: { type: "number", description: "Current balance" },
          limit: { type: "number", description: "Credit limit" },
          apr: { type: "number", description: "Annual percentage rate" },
          minPayment: { type: "number", description: "Minimum monthly payment" },
          notes: { type: "string", description: "Optional notes" },
        },
        required: ["action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "manage_loan",
      description: "Create, update, or delete a loan. Use when the user wants to add or modify loans (auto, mortgage, student, personal, etc.).",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["create", "update", "delete"], description: "Action to perform" },
          id: { type: "string", description: "ID of existing record (required for update/delete)" },
          name: { type: "string", description: "Loan name" },
          type: { type: "string", enum: ["auto", "mortgage", "student", "personal", "other"], description: "Loan type" },
          balance: { type: "number", description: "Current balance" },
          interestRate: { type: "number", description: "Interest rate %" },
          monthlyPayment: { type: "number", description: "Monthly payment amount" },
          termMonths: { type: "number", description: "Remaining term in months (optional)" },
          notes: { type: "string", description: "Optional notes" },
        },
        required: ["action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "manage_bill",
      description: "Create, update, or delete a recurring bill. Use when the user wants to add or modify bills and subscriptions.",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["create", "update", "delete"], description: "Action to perform" },
          id: { type: "string", description: "ID of existing record (required for update/delete)" },
          name: { type: "string", description: "Bill name" },
          amount: { type: "number", description: "Amount" },
          category: { type: "string", enum: ["housing", "utilities", "insurance", "subscription", "food", "other"], description: "Category" },
          frequency: { type: "string", enum: ["monthly", "quarterly", "annual"], description: "Frequency" },
          notes: { type: "string", description: "Optional notes" },
        },
        required: ["action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "manage_savings",
      description: "Create, update, or delete a savings goal. Use when the user wants to add or modify savings goals.",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["create", "update", "delete"], description: "Action to perform" },
          id: { type: "string", description: "ID of existing record (required for update/delete)" },
          name: { type: "string", description: "Goal name" },
          targetAmount: { type: "number", description: "Target amount" },
          currentAmount: { type: "number", description: "Current amount saved" },
          targetDate: { type: "string", description: "Target date (YYYY-MM-DD, optional)" },
          notes: { type: "string", description: "Optional notes" },
        },
        required: ["action"],
      },
    },
  },
];

export async function executeTool(
  name: string,
  args: Record<string, string | number | undefined>
): Promise<string> {
  const prisma = await getDb();

  switch (name) {
    case "save_memory": {
      const { file, section, entry } = args;
      if (section) {
        await appendToMemory(file as string, section as string, entry as string);
      } else {
        await writeMemory(file as string, entry as string);
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

    case "manage_income": {
      const { action, id, source, amount, frequency, notes } = args;
      if (action === "create") {
        const item = await prisma.income.create({
          data: { source: source as string, amount: amount as number, frequency: (frequency as string) || "monthly", notes: (notes as string) || null },
        });
        return `Created income: ${source} ($${amount}/${frequency || "monthly"}) — ID: ${item.id}`;
      } else if (action === "update" && id) {
        const data: Record<string, unknown> = {};
        if (source) data.source = source;
        if (amount !== undefined) data.amount = amount;
        if (frequency) data.frequency = frequency;
        if (notes !== undefined) data.notes = notes || null;
        await prisma.income.update({ where: { id: id as string }, data });
        return `Updated income ${id}`;
      } else if (action === "delete" && id) {
        await prisma.income.delete({ where: { id: id as string } });
        return `Deleted income ${id}`;
      }
      return "Invalid action or missing ID";
    }

    case "manage_investment": {
      const { action, id, name, type, ticker, shares, costBasis, currentValue, notes } = args;
      if (action === "create") {
        const item = await prisma.investment.create({
          data: {
            name: name as string, type: (type as string) || "other",
            ticker: (ticker as string) || null, shares: shares ? (shares as number) : null,
            costBasis: costBasis ? (costBasis as number) : null, currentValue: currentValue as number,
            notes: (notes as string) || null,
          },
        });
        return `Created investment: ${name} ($${currentValue}) — ID: ${item.id}`;
      } else if (action === "update" && id) {
        const data: Record<string, unknown> = {};
        if (name) data.name = name;
        if (type) data.type = type;
        if (ticker !== undefined) data.ticker = ticker || null;
        if (shares !== undefined) data.shares = shares || null;
        if (costBasis !== undefined) data.costBasis = costBasis || null;
        if (currentValue !== undefined) data.currentValue = currentValue;
        if (notes !== undefined) data.notes = notes || null;
        await prisma.investment.update({ where: { id: id as string }, data });
        return `Updated investment ${id}`;
      } else if (action === "delete" && id) {
        await prisma.investment.delete({ where: { id: id as string } });
        return `Deleted investment ${id}`;
      }
      return "Invalid action or missing ID";
    }

    case "manage_credit_card": {
      const { action, id, name, balance, limit, apr, minPayment, notes } = args;
      if (action === "create") {
        const item = await prisma.creditCard.create({
          data: {
            name: name as string, balance: balance as number, limit: limit as number,
            apr: apr as number, minPayment: minPayment as number, notes: (notes as string) || null,
          },
        });
        return `Created credit card: ${name} — ID: ${item.id}`;
      } else if (action === "update" && id) {
        const data: Record<string, unknown> = {};
        if (name) data.name = name;
        if (balance !== undefined) data.balance = balance;
        if (limit !== undefined) data.limit = limit;
        if (apr !== undefined) data.apr = apr;
        if (minPayment !== undefined) data.minPayment = minPayment;
        if (notes !== undefined) data.notes = notes || null;
        await prisma.creditCard.update({ where: { id: id as string }, data });
        return `Updated credit card ${id}`;
      } else if (action === "delete" && id) {
        await prisma.creditCard.delete({ where: { id: id as string } });
        return `Deleted credit card ${id}`;
      }
      return "Invalid action or missing ID";
    }

    case "manage_loan": {
      const { action, id, name, type, balance, interestRate, monthlyPayment, termMonths, notes } = args;
      if (action === "create") {
        const item = await prisma.loan.create({
          data: {
            name: name as string, type: (type as string) || "other",
            balance: balance as number, interestRate: interestRate as number,
            monthlyPayment: monthlyPayment as number, termMonths: termMonths ? (termMonths as number) : null,
            notes: (notes as string) || null,
          },
        });
        return `Created loan: ${name} — ID: ${item.id}`;
      } else if (action === "update" && id) {
        const data: Record<string, unknown> = {};
        if (name) data.name = name;
        if (type) data.type = type;
        if (balance !== undefined) data.balance = balance;
        if (interestRate !== undefined) data.interestRate = interestRate;
        if (monthlyPayment !== undefined) data.monthlyPayment = monthlyPayment;
        if (termMonths !== undefined) data.termMonths = termMonths || null;
        if (notes !== undefined) data.notes = notes || null;
        await prisma.loan.update({ where: { id: id as string }, data });
        return `Updated loan ${id}`;
      } else if (action === "delete" && id) {
        await prisma.loan.delete({ where: { id: id as string } });
        return `Deleted loan ${id}`;
      }
      return "Invalid action or missing ID";
    }

    case "manage_bill": {
      const { action, id, name, amount, category, frequency, notes } = args;
      if (action === "create") {
        const item = await prisma.bill.create({
          data: {
            name: name as string, amount: amount as number,
            category: (category as string) || "other", frequency: (frequency as string) || "monthly",
            notes: (notes as string) || null,
          },
        });
        return `Created bill: ${name} ($${amount}) — ID: ${item.id}`;
      } else if (action === "update" && id) {
        const data: Record<string, unknown> = {};
        if (name) data.name = name;
        if (amount !== undefined) data.amount = amount;
        if (category) data.category = category;
        if (frequency) data.frequency = frequency;
        if (notes !== undefined) data.notes = notes || null;
        await prisma.bill.update({ where: { id: id as string }, data });
        return `Updated bill ${id}`;
      } else if (action === "delete" && id) {
        await prisma.bill.delete({ where: { id: id as string } });
        return `Deleted bill ${id}`;
      }
      return "Invalid action or missing ID";
    }

    case "manage_savings": {
      const { action, id, name, targetAmount, currentAmount, targetDate, notes } = args;
      if (action === "create") {
        const item = await prisma.savingsGoal.create({
          data: {
            name: name as string, targetAmount: targetAmount as number,
            currentAmount: (currentAmount as number) || 0,
            targetDate: (targetDate as string) || null, notes: (notes as string) || null,
          },
        });
        return `Created savings goal: ${name} — ID: ${item.id}`;
      } else if (action === "update" && id) {
        const data: Record<string, unknown> = {};
        if (name) data.name = name;
        if (targetAmount !== undefined) data.targetAmount = targetAmount;
        if (currentAmount !== undefined) data.currentAmount = currentAmount;
        if (targetDate !== undefined) data.targetDate = targetDate || null;
        if (notes !== undefined) data.notes = notes || null;
        await prisma.savingsGoal.update({ where: { id: id as string }, data });
        return `Updated savings goal ${id}`;
      } else if (action === "delete" && id) {
        await prisma.savingsGoal.delete({ where: { id: id as string } });
        return `Deleted savings goal ${id}`;
      }
      return "Invalid action or missing ID";
    }

    default:
      return `Unknown tool: ${name}`;
  }
}
