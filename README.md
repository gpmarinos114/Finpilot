# FinPilot

An AI-powered financial planner with persistent memory, historical snapshots, and multi-device sync. Track your finances, get personalized advice, and watch your progress over time.

## Features

- **Dashboard** — Collapsible cards for Income, Investments, Credit Cards, Loans, Bills, and Savings with inline table editing
- **AI Chat** — Streaming chat with multiple AI providers (DeepSeek, Xiaomi MiMo, MiniMax), tool calling, and reasoning display
- **Persistent Memory** — The AI remembers your goals, decisions, preferences, and financial personality across conversations
- **Financial Snapshots** — Automatic daily snapshots of your full financial picture with trend tracking
- **Multi-Device Sync** — Connect to a Turso cloud database to access your data from anywhere
- **Live Markdown Editor** — Edit memory files with split-pane markdown preview

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** SQLite via Prisma ORM (with optional Turso cloud sync)
- **AI Providers:** DeepSeek, Xiaomi MiMo, MiniMax (all OpenAI-compatible)

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
git clone https://github.com/your-username/finpilot.git
cd finpilot
npm install
```

### Database Setup

```bash
npx prisma db push
```

This creates a local SQLite database (`dev.db`). No additional configuration needed.

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Configuration

Click **Settings** in the header to configure:

1. **AI API Keys** — Enter keys for at least one provider (DeepSeek, MiMo, or MiniMax)
2. **Database Backend** — Choose between Local SQLite (default) or Turso cloud

#### Turso Cloud Sync (Optional)

To sync data across devices:

1. Create a free account at [turso.tech](https://turso.tech)
2. Create a database and get your URL + auth token
3. In Settings, select "Turso (Cloud)" and enter your credentials
4. Restart the app

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── chat/          # Streaming AI chat endpoint
│   │   ├── income/        # Income CRUD
│   │   ├── investments/   # Investments CRUD
│   │   ├── credit-cards/  # Credit cards CRUD
│   │   ├── loans/         # Loans CRUD
│   │   ├── bills/         # Bills CRUD
│   │   ├── savings/       # Savings goals CRUD
│   │   ├── memories/      # Memory file operations
│   │   ├── sessions/      # Chat session management
│   │   ├── settings/      # App configuration
│   │   └── snapshots/     # Financial snapshot history
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── Dashboard.tsx       # Main dashboard with collapsible cards
│   ├── ChatSidebar.tsx     # AI chat interface
│   ├── CollapsibleCard.tsx # Shared collapsible card wrapper
│   ├── SnapshotsPanel.tsx  # Snapshot history with expandable rows
│   ├── MemoryPanel.tsx     # Memory file editor with markdown preview
│   ├── FinancialSummary.tsx# Net worth, cash flow, etc.
│   ├── IncomeCard.tsx      # Income table with inline editing
│   ├── InvestmentCard.tsx  # Investments table
│   ├── CreditCardForm.tsx  # Credit cards table
│   ├── LoanCard.tsx        # Loans table
│   ├── BillCard.tsx        # Bills table
│   ├── SavingsCard.tsx     # Savings goals table
│   ├── SettingsPanel.tsx   # Settings modal
│   ├── ProviderSelector.tsx# AI provider/model selector
│   └── ResizablePanel.tsx  # Resizable panel wrapper
├── lib/
│   ├── db.ts              # Dynamic Prisma client (local/Turso)
│   ├── memory.ts          # DB-backed memory file operations
│   ├── snapshots.ts       # Snapshot capture and history
│   ├── ai-provider.ts     # Multi-provider OpenAI client
│   ├── financial-context.ts# Build AI context from all data
│   ├── tools.ts           # AI tool definitions and execution
│   └── providers.ts       # Provider configuration
├── contexts/
│   └── ChatContext.tsx     # Chat state management
└── types/
    └── financial.ts       # TypeScript interfaces
```

## How It Works

### Data Entry

Each financial category (Income, Investments, etc.) has a collapsible card with a table. Click **+ Add Row** to insert a new entry inline. Click the edit icon to modify existing rows. All changes save to the database immediately.

### AI Chat

The AI has access to your complete financial data, memory files, and snapshot history. It can:

- Analyze your budget and suggest optimizations
- Create debt payoff strategies (avalanche/snowball)
- Project investment growth
- Save learnings about you to persistent memory
- Generate detailed financial plans and simulations

### Snapshots

A snapshot of your entire financial picture is captured automatically whenever you make changes (once per day). View trends over time in the Snapshots card — click any row to see full details from that date.

### Memory System

The AI maintains memory files that persist across conversations:

- **client-profile.md** — What the AI learns about you over time
- **goals.md** — Your financial goals
- **decisions.md** — Key financial decisions and reasoning
- **focus.md** — Current priorities
- **preferences.md** — Investment style, communication preferences

You can edit these directly in the Memory card with live markdown preview.

## License

This project is licensed under the GNU General Public License v3.0 — see the [LICENSE](LICENSE) file for details.
