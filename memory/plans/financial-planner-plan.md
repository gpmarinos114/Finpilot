# AI Financial Planner - Implementation Plan

## Tech Stack
- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: SQLite via Prisma ORM (migration-ready for Supabase/Firebase)
- **AI Providers**: Xiaomi MiMo, DeepSeek, MiniMax (all OpenAI-compatible)
- **Memory**: Hybrid — SQLite for structured data, markdown files for agent memory

---

## Project Structure

```
financial-planner/
├── memory/                           # Markdown memory files (agent-writable)
│   ├── goals.md                      # Long-term financial goals
│   ├── decisions.md                  # Key decisions made
│   ├── focus.md                      # Current priorities
│   ├── preferences.md                # User preferences & constraints
│   ├── plans/                        # AI-generated plan documents
│   └── simulations/                  # AI-generated scenario analyses
├── prisma/
│   └── schema.prisma                 # SQLite schema
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Root layout with providers
│   │   ├── page.tsx                  # Main page (dashboard + chat)
│   │   ├── globals.css               # Tailwind imports
│   │   └── api/
│   │       ├── chat/route.ts         # Streaming AI chat with tool calling
│   │       ├── investments/route.ts  # CRUD
│   │       ├── income/route.ts       # CRUD
│   │       ├── credit-cards/route.ts # CRUD
│   │       ├── loans/route.ts        # CRUD
│   │       ├── bills/route.ts        # CRUD
│   │       ├── savings/route.ts      # CRUD
│   │       └── memories/route.ts     # Read/list markdown memory files
│   ├── components/
│   │   ├── Dashboard.tsx             # Main dashboard container
│   │   ├── ChatSidebar.tsx           # Chat interface with streaming
│   │   ├── LayoutSwap.tsx            # Toggle dashboard/chat as main view
│   │   ├── InvestmentCard.tsx        # Investment CRUD form + display
│   │   ├── IncomeCard.tsx            # Income CRUD form + display
│   │   ├── CreditCardForm.tsx        # Credit card CRUD
│   │   ├── LoanCard.tsx              # Loan CRUD
│   │   ├── BillCard.tsx              # Monthly bills CRUD
│   │   ├── SavingsCard.tsx           # Savings goals CRUD
│   │   ├── FinancialSummary.tsx      # Overview: net worth, cash flow, ratios
│   │   ├── MemoryPanel.tsx           # View/edit memory files in UI
│   │   └── ProviderSelector.tsx      # AI provider dropdown
│   ├── lib/
│   │   ├── ai-provider.ts            # Unified OpenAI SDK client
│   │   ├── db.ts                     # Prisma client singleton
│   │   ├── memory.ts                 # Read/write markdown memory files
│   │   ├── tools.ts                  # Agent tool definitions
│   │   └── financial-context.ts      # Build full context for AI prompts
│   └── types/
│       └── financial.ts              # TypeScript interfaces
├── .env.local                        # API keys + config
├── .gitignore
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## Database Schema (Prisma + SQLite)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model Income {
  id        String  @id @default(cuid())
  source    String
  amount    Float
  frequency String  // monthly, biweekly, annual
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Investment {
  id           String  @id @default(cuid())
  name         String
  type         String  // stock, bond, crypto, retirement, etf, other
  ticker       String?
  shares       Float?
  costBasis    Float?
  currentValue Float
  notes        String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model CreditCard {
  id         String  @id @default(cuid())
  name       String
  balance    Float
  limit      Float
  apr        Float
  minPayment Float
  notes      String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

model Loan {
  id             String  @id @default(cuid())
  name           String
  type           String  // mortgage, auto, student, personal, other
  balance        Float
  interestRate   Float
  monthlyPayment Float
  termMonths     Int?
  notes          String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model Bill {
  id        String  @id @default(cuid())
  name      String
  amount    Float
  category  String  // housing, utilities, insurance, subscription, food, other
  frequency String  // monthly, quarterly, annual
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model SavingsGoal {
  id            String  @id @default(cuid())
  name          String
  targetAmount  Float
  currentAmount Float
  targetDate    String?
  notes         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model ChatMessage {
  id        String   @id @default(cuid())
  role      String   // user, assistant, system, tool
  content   String
  toolName  String?
  provider  String?
  createdAt DateTime @default(now())
}
```

---

## AI Provider Configuration

All three use the OpenAI SDK with different base URLs:

| Provider | Base URL | Default Model | Header |
|----------|----------|---------------|--------|
| Xiaomi MiMo | `https://api.xiaomimimo.com/v1` | `mimo-v2.5-pro` | `api-key` |
| DeepSeek | `https://api.deepseek.com` | `deepseek-v4-pro` | `Authorization: Bearer` |
| MiniMax | `https://api.minimax.io/v1` | `MiniMax-M3` | `Authorization: Bearer` |

**`src/lib/ai-provider.ts`** — Unified client:
```typescript
import OpenAI from "openai";

export type ProviderName = "mimo" | "deepseek" | "minimax";

const PROVIDERS = {
  mimo:      { baseURL: "https://api.xiaomimimo.com/v1", model: "mimo-v2.5-pro" },
  deepseek:  { baseURL: "https://api.deepseek.com",      model: "deepseek-v4-pro" },
  minimax:   { baseURL: "https://api.minimax.io/v1",      model: "MiniMax-M3" },
};

export function createAIProvider(provider: ProviderName, apiKey: string) {
  const config = PROVIDERS[provider];
  return new OpenAI({ baseURL: config.baseURL, apiKey });
}
```

---

## Markdown Memory System

### File format examples:

`memory/goals.md`:
```markdown
# Financial Goals

## Long-term
- [ ] Retire by age 55 with $1.5M in investments
- [ ] Pay off mortgage by 2035

## Medium-term
- [ ] Build 6-month emergency fund ($30k) by Dec 2027
- [ ] Pay off credit card debt completely by Jun 2027

## Short-term
- [ ] Save $5k for vacation by Mar 2027
```

`memory/decisions.md`:
```markdown
# Financial Decisions

## 2026
- [2026-06-25] Switched from individual stocks to index funds (lower fees, less risk)
- [2026-06-20] Consolidated 3 credit cards into 1 balance transfer at 0% APR for 18mo
```

`memory/focus.md`:
```markdown
# Current Focus

## This Quarter (Q3 2026)
- Aggressively pay down credit card debt (highest priority)
- Build emergency fund to $10k
- Review and reduce monthly subscriptions

## This Month
- Track all spending categories
- Set up automatic transfers to savings
```

`memory/preferences.md`:
```markdown
# Preferences

## Investment Style
- Conservative to moderate risk tolerance
- Prefer index funds and ETFs over individual stocks
- No crypto exposure

## Communication
- Prefer detailed explanations with numbers
- Want to see debt payoff timelines
- Like scenario comparisons (what-if analyses)
```

### `src/lib/memory.ts` — Memory read/write utility:
```typescript
import fs from "fs/promises";
import path from "path";

const MEMORY_DIR = path.join(process.cwd(), "memory");

export async function readAllMemories(): Promise<string> {
  const files = ["goals.md", "decisions.md", "focus.md", "preferences.md"];
  let context = "";
  for (const file of files) {
    try {
      const content = await fs.readFile(path.join(MEMORY_DIR, file), "utf-8");
      context += `\n\n${content}`;
    } catch { /* file doesn't exist yet */ }
  }
  for (const dir of ["plans", "simulations"]) {
    try {
      const entries = await fs.readdir(path.join(MEMORY_DIR, dir));
      for (const entry of entries.filter(e => e.endsWith(".md"))) {
        const content = await fs.readFile(path.join(MEMORY_DIR, dir, entry), "utf-8");
        context += `\n\n${content}`;
      }
    } catch { /* directory doesn't exist yet */ }
  }
  return context;
}

export async function writeMemory(filename: string, content: string): Promise<void> {
  await fs.writeFile(path.join(MEMORY_DIR, filename), content, "utf-8");
}

export async function appendToMemory(filename: string, section: string, entry: string): Promise<void> {
  const filepath = path.join(MEMORY_DIR, filename);
  let content = "";
  try { content = await fs.readFile(filepath, "utf-8"); } catch { /* new file */ }
  const marker = `## ${section}`;
  if (content.includes(marker)) {
    content = content.replace(marker, `${marker}\n- ${entry}`);
  } else {
    content += `\n\n${marker}\n- ${entry}\n`;
  }
  await fs.writeFile(filepath, content, "utf-8");
}

export async function listMemoryFiles(): Promise<{path: string; preview: string}[]> {
  const results: {path: string; preview: string}[] = [];
  async function scan(dir: string) {
    try {
      const entries = await fs.readdir(path.join(MEMORY_DIR, dir), { withFileTypes: true });
      for (const entry of entries) {
        const relPath = path.join(dir, entry.name);
        if (entry.isDirectory()) await scan(relPath);
        else if (entry.name.endsWith(".md")) {
          const content = await fs.readFile(path.join(MEMORY_DIR, relPath), "utf-8");
          results.push({ path: relPath, preview: content.slice(0, 200) });
        }
      }
    } catch { /* dir doesn't exist */ }
  }
  await scan("");
  return results;
}
```

---

## Agent Tools Definition

**`src/lib/tools.ts`** — Tools the AI can call:

```typescript
export const FINANCIAL_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "save_memory",
      description: "Save or update a memory file (goals, decisions, focus, preferences)",
      parameters: {
        type: "object",
        properties: {
          file: { type: "string", enum: ["goals.md", "decisions.md", "focus.md", "preferences.md"] },
          section: { type: "string", description: "Section heading to update" },
          entry: { type: "string", description: "The memory entry to add" },
          action: { type: "string", enum: ["append", "replace"], description: "Whether to append or replace the section" },
        },
        required: ["file", "entry"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_plan",
      description: "Create a financial plan document (markdown file in memory/plans/)",
      parameters: {
        type: "object",
        properties: {
          filename: { type: "string", description: "Filename ending in .md, e.g. 'debt-payoff-plan.md'" },
          title: { type: "string", description: "Plan title" },
          content: { type: "string", description: "Full markdown content of the plan" },
        },
        required: ["filename", "title", "content"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "run_simulation",
      description: "Create a financial simulation/scenario analysis (markdown file in memory/simulations/)",
      parameters: {
        type: "object",
        properties: {
          filename: { type: "string", description: "Filename ending in .md, e.g. '5yr-projection.md'" },
          title: { type: "string", description: "Simulation title" },
          content: { type: "string", description: "Full markdown content of the simulation" },
        },
        required: ["filename", "title", "content"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "read_memory",
      description: "Read all current memory files to refresh context",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_memories",
      description: "List all memory files with previews",
      parameters: { type: "object", properties: {} },
    },
  },
];
```

---

## System Prompt Structure

```
You are an AI financial planner. You have access to the user's complete financial picture
and can create plans, run simulations, and save memories.

## User's Financial Data
{JSON of all income, investments, credit cards, loans, bills, savings from SQLite}

## User's Memory (Goals, Decisions, Focus, Preferences)
{contents of all memory/*.md files}

## Your Capabilities
- Analyze budgets and suggest optimizations
- Create debt payoff strategies (avalanche/snowball)
- Project investment growth and retirement readiness
- Track savings goals and suggest adjustments
- Save important insights as memories for future reference
- Create detailed plan documents and scenario analyses

## Instructions
- Always reference stored goals/decisions when relevant
- When the user shares important financial info, suggest saving it as a memory
- When creating plans or simulations, use the create_plan or run_simulation tools
- Be specific with numbers, percentages, and timelines
- Compare strategies when appropriate (e.g., avalanche vs snowball)
- Align all recommendations with the user's stated goals and preferences
```

---

## API Routes

- **`/api/chat`** — Streaming chat with tool execution
- **`/api/investments`**, **`/api/income`**, etc. — Standard CRUD
- **`/api/memories`** — Memory file operations

---

## UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Header: AI Financial Planner    [Provider: ▼ DeepSeek] [⇄] │
├───────────────────────────────────────┬─────────────────────┤
│                                       │                     │
│  Financial Summary Bar                │  Chat Sidebar       │
│  ┌─────────┬─────────┬─────────┐     │  ┌───────────────┐  │
│  │Net Worth│Cash Flow│Debt/Inc │     │  │ Messages...   │  │
│  │ $XX,XXX │ $X,XXX  │  XX%    │     │  │               │  │
│  └─────────┴─────────┴─────────┘     │  │               │  │
│                                       │  │               │  │
│  Dashboard Tabs                       │  │               │  │
│  [Income][Investments][Cards][Loans]  │  │               │  │
│  [Bills][Savings][Memory]            │  │               │  │
│                                       │  │               │  │
│  ┌─────────────────────────────┐     │  ├───────────────┤  │
│  │   Active Tab Content        │     │  │ [Type here...]│  │
│  │   (CRUD forms + cards)      │     │  └───────────────┘  │
│  └─────────────────────────────┘     │                     │
├───────────────────────────────────────┴─────────────────────┤
│  Footer                                                       │
└─────────────────────────────────────────────────────────────┘

[⇄] Swap button: toggles chat as main view, dashboard as sidebar
```

---

## Implementation Order

| Phase | Task | Description |
|-------|------|-------------|
| 1 | Project scaffold | `npx create-next-app`, install deps (prisma, openai, tailwind) |
| 2 | Database setup | Prisma schema, `prisma db push`, seed helper |
| 3 | Financial CRUD APIs | All `/api/*` routes for income, investments, cards, loans, bills, savings |
| 4 | Dashboard UI | Summary bar + tabbed card interface for all financial categories |
| 5 | Memory system | `memory.ts` utility, memory directory with template files |
| 6 | AI provider layer | `ai-provider.ts` unified OpenAI client |
| 7 | Agent tools | `tools.ts` definitions + execution logic |
| 8 | Chat API | `/api/chat` with streaming, tool calling, context injection |
| 9 | Chat sidebar UI | Streaming message display, input, tool result indicators |
| 10 | Memory panel UI | Tab to view/edit memory files, show AI-created plans |
| 11 | Layout swap | Toggle between dashboard-main and chat-main views |
| 12 | Polish | Loading states, error handling, responsive design, empty states |

---

## Dependencies

```json
{
  "dependencies": {
    "next": "^15",
    "react": "^19",
    "react-dom": "^19",
    "openai": "^4",
    "@prisma/client": "^6",
    "prisma": "^6"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/react": "^19",
    "@types/node": "^22",
    "tailwindcss": "^4",
    "@tailwindcss/postcss": "^4"
  }
}
```

## Environment Variables (`.env.local`)

```env
DATABASE_URL="file:./dev.db"
MIMO_API_KEY="sk-..."
DEEPSEEK_API_KEY="sk-..."
MINIMAX_API_KEY="sk-..."
DEFAULT_AI_PROVIDER="deepseek"
```
