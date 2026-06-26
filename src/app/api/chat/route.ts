import { NextRequest } from "next/server";
import { encodingForModel } from "js-tiktoken";
import {
  createAIProvider,
  getApiKeyForProvider,
  getDefaultProvider,
  getSavedModel,
} from "@/lib/ai-provider";
import { buildFinancialContext } from "@/lib/financial-context";
import { FINANCIAL_TOOLS, executeTool } from "@/lib/tools";
import { getDb } from "@/lib/db";
import type { ProviderName } from "@/types/financial";

const SYSTEM_PROMPT = `You are an AI financial planner with persistent memory. You learn about the user over time and remember their preferences, patterns, and life context.

## Your Capabilities
- Analyze budgets and suggest optimizations
- Create debt payoff strategies (avalanche/snowball)
- Project investment growth and retirement readiness
- Track savings goals and suggest adjustments
- Save important insights as memories for future reference
- Create detailed plan documents and scenario analyses
- LEARN and REMEMBER the user's preferences, patterns, and context
- **MANAGE financial data directly** — create, update, and delete income, investments, credit cards, loans, bills, and savings goals
- **Process uploaded files** — parse CSVs, spreadsheets, and text files to bulk-update financial data

## Managing Financial Data
You have tools to directly manage the user's financial data:
- **manage_income** — Add/edit/delete income sources
- **manage_investment** — Add/edit/delete investments (stocks, ETFs, bonds, crypto, retirement)
- **manage_credit_card** — Add/edit/delete credit cards
- **manage_loan** — Add/edit/delete loans (auto, mortgage, student, personal)
- **manage_bill** — Add/edit/delete recurring bills and subscriptions
- **manage_savings** — Add/edit/delete savings goals

When the user provides data (e.g., "I have $5000 in SCHD"), use the appropriate tool to save it. When they upload a CSV or file, parse it and use the tools to create/update records. Always confirm what you did after making changes.

## Processing Uploaded Files
When the user uploads a file (CSV, JSON, text, etc.), its content is included in their message between "--- File: name ---" markers. Parse the data and use the financial data tools to create or update records. For CSVs:
- Identify columns (name, ticker, shares, balance, etc.)
- Map them to the appropriate financial model
- Use the tools to create each row
- Report what was created/updated

## Learning About the User
You maintain a client profile (memory/client-profile.md) that evolves as you learn. After each meaningful conversation, you SHOULD update the profile using the save_memory tool. Pay attention to:
- Risk tolerance and investment style (conservative, aggressive, etc.)
- Life situation (single, married, kids, career stage, location)
- Financial values (security vs growth, experiences vs savings)
- Communication preferences (wants numbers, prefers simplicity, etc.)
- Behavioral patterns (impulse spender, disciplined saver, debt-averse, etc.)
- Life goals beyond money (travel, home, education, family, career)
- Important dates, deadlines, or milestones mentioned
- Recurring concerns or topics they ask about

When you learn something new about the user, save it to the appropriate section of client-profile.md using the save_memory tool with file "client-profile.md".

## Instructions
- Always reference stored goals, decisions, AND client profile when relevant
- Proactively save learnings about the user to client-profile.md
- When the user shares important financial info, suggest saving it as a memory
- When creating plans or simulations, use the create_plan or run_simulation tools
- When the user provides data or uploads files, use the financial tools to save it
- Be specific with numbers, percentages, and timelines
- Compare strategies when appropriate (e.g., avalanche vs snowball)
- Align all recommendations with the user's stated goals, preferences, and profile
- Be concise but thorough in your responses
- Personalize your tone and detail level based on their communication preferences`;

const CONTEXT_LIMITS: Record<string, number> = {
  "mimo-v2.5-pro": 1000000,
  "mimo-v2.5": 1000000,
  "mimo-v2-flash": 256000,
  "deepseek-v4-pro": 128000,
  "deepseek-v4-flash": 128000,
  "MiniMax-M3": 1000000,
  "MiniMax-M2.7": 204800,
  "MiniMax-M2.5": 204800,
};

function countTokens(text: string): number {
  try {
    const enc = encodingForModel("gpt-4o");
    return enc.encode(text).length;
  } catch {
    return Math.ceil(text.length / 3.5);
  }
}

interface MessageEntry {
  role: string;
  content: string;
  tool_calls?: unknown[];
  tool_call_id?: string;
}

function trimMessagesToLimit(
  systemPrompt: string,
  messages: MessageEntry[],
  maxContextTokens: number,
  reserveForOutput: number = 8192
): { messages: MessageEntry[]; systemTokens: number; conversationTokens: number } {
  const systemTokens = countTokens(systemPrompt);
  const availableTokens = maxContextTokens - systemTokens - reserveForOutput;

  let totalTokens = 0;
  const result: MessageEntry[] = [];

  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const msgTokens = countTokens(msg.content || "") + 20;
    if (totalTokens + msgTokens > availableTokens) break;
    totalTokens += msgTokens;
    result.unshift(msg);
  }

  return { messages: result, systemTokens, conversationTokens: totalTokens };
}

export async function POST(req: NextRequest) {
  const { message, provider, model, sessionId, reasoning_effort, attachments } = await req.json();
  const prisma = await getDb();

  const providerName: ProviderName =
    provider || getDefaultProvider();
  const apiKey = await getApiKeyForProvider(providerName);
  const client = await createAIProvider(providerName, apiKey);
  const selectedModel = model || await getSavedModel(providerName);
  const effort = reasoning_effort || "high";

  let fullMessage = message;
  if (attachments && attachments.length > 0) {
    const fileContents = attachments.map((a: { name: string; content: string }) =>
      `\n\n--- File: ${a.name} ---\n${a.content}\n--- End of ${a.name} ---`
    ).join("");
    fullMessage = message + fileContents;
  }

  await prisma.chatMessage.create({
    data: { role: "user", content: fullMessage, provider: providerName, sessionId: sessionId || null },
  });

  const financialContext = await buildFinancialContext();
  const fullSystemPrompt = `${SYSTEM_PROMPT}\n\n${financialContext}`;

  const recentMessages = await prisma.chatMessage.findMany({
    where: sessionId ? { sessionId } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const allMessages: MessageEntry[] = recentMessages.reverse().map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const maxContext = CONTEXT_LIMITS[selectedModel] || 128000;
  const { messages: trimmedMessages, systemTokens, conversationTokens } = trimMessagesToLimit(
    fullSystemPrompt,
    allMessages,
    maxContext
  );

  const messages = [
    { role: "system" as const, content: fullSystemPrompt },
    ...trimmedMessages.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    })),
  ];

  const inputTokens = systemTokens + conversationTokens + countTokens(fullMessage) + 20;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "usage",
              inputTokens,
              maxContext,
              usedPercent: Math.round((inputTokens / maxContext) * 100),
            })}\n\n`
          )
        );

        let keepLooping = true;
        while (keepLooping) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const response = await (client.chat.completions.create as any)({
            model: selectedModel,
            messages,
            tools: FINANCIAL_TOOLS,
            stream: true,
            stream_options: { include_usage: true },
            reasoning_effort: effort,
            extra_body: { thinking: { type: effort === "low" ? "disabled" : "enabled" } },
          });

          let fullContent = "";
          let fullThinking = "";
          let toolCalls: {
            id: string;
            function: { name: string; arguments: string };
          }[] = [];
          let completionTokens = 0;

          for await (const chunk of response) {
            if (chunk.usage) {
              completionTokens = chunk.usage.completion_tokens;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "usage",
                    inputTokens: chunk.usage.prompt_tokens,
                    outputTokens: chunk.usage.completion_tokens,
                    totalTokens: chunk.usage.total_tokens,
                    maxContext,
                    usedPercent: Math.round((chunk.usage.prompt_tokens / maxContext) * 100),
                  })}\n\n`
                )
              );
            }

            const delta = chunk.choices[0]?.delta;

            if (delta?.reasoning_content) {
              fullThinking += delta.reasoning_content;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "thinking", text: delta.reasoning_content })}\n\n`
                )
              );
            }

            if (delta?.content) {
              fullContent += delta.content;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "content", text: delta.content })}\n\n`
                )
              );
            }

            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                if (tc.index !== undefined) {
                  if (!toolCalls[tc.index]) {
                    toolCalls[tc.index] = {
                      id: tc.id || "",
                      function: { name: "", arguments: "" },
                    };
                  }
                  if (tc.id) toolCalls[tc.index].id = tc.id;
                  if (tc.function?.name)
                    toolCalls[tc.index].function.name = tc.function.name;
                  if (tc.function?.arguments)
                    toolCalls[tc.index].function.arguments +=
                      tc.function.arguments;
                }
              }
            }
          }

          if (toolCalls.length > 0) {
            const toolResults = [];
            for (const tc of toolCalls) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "tool_call", name: tc.function.name, args: tc.function.arguments })}\n\n`
                )
              );

              let args: Record<string, string> = {};
              try {
                args = JSON.parse(tc.function.arguments);
              } catch {}

              const result = await executeTool(tc.function.name, args);
              toolResults.push({
                tool_call_id: tc.id,
                output: result,
              });

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "tool_result", name: tc.function.name, result })}\n\n`
                )
              );
            }

            if (fullContent) {
              messages.push({ role: "assistant", content: fullContent });
            }
            messages.push({
              role: "assistant" as const,
              content: null as unknown as string,
              tool_calls: toolCalls.map((tc) => ({
                id: tc.id,
                type: "function" as const,
                function: {
                  name: tc.function.name,
                  arguments: tc.function.arguments,
                },
              })),
            } as never);
            for (const tr of toolResults) {
              messages.push({
                role: "tool" as const,
                content: tr.output,
                tool_call_id: tr.tool_call_id,
              } as never);
            }
          } else {
            keepLooping = false;
            if (fullContent) {
              await prisma.chatMessage.create({
                data: {
                  role: "assistant",
                  content: fullContent,
                  provider: providerName,
                  sessionId: sessionId || null,
                },
              });

              // Post-chat: extract and save learnings about the user
              try {
                const learnResponse = await client.chat.completions.create({
                  model: selectedModel,
                  messages: [
                    {
                      role: "system",
                      content: `You extract user profile information from conversations. Given the conversation below, identify any NEW information about the user that should be saved to their client profile. Return a JSON object with the section name as key and the new entry as value. Return empty object {} if nothing new was learned.

Sections: Personal Context, Financial Personality, Values & Priorities, Communication Preferences, Known Preferences, Behavioral Patterns, Life Goals, Important Dates & Milestones, History of Decisions

Example: {"Financial Personality": "Conservative investor, prefers index funds over individual stocks", "Life Goals": "Wants to retire by 55"}

Return ONLY valid JSON, nothing else.`,
                    },
                    {
                      role: "user",
                      content: `User message: ${fullMessage}\n\nAI response: ${fullContent}`,
                    },
                  ],
                  temperature: 0,
                  max_tokens: 200,
                });

                const learnContent = learnResponse.choices[0]?.message?.content;
                if (learnContent) {
                  try {
                    const learnings = JSON.parse(learnContent);
                    for (const [section, entry] of Object.entries(learnings)) {
                      if (entry && typeof entry === "string" && entry.length > 5) {
                        await executeTool("save_memory", {
                          file: "client-profile.md",
                          section,
                          entry,
                        });
                      }
                    }
                  } catch { /* JSON parse failed, skip */ }
                }
              } catch { /* Learning extraction failed, skip */ }
            }
          }
        }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
        );
        controller.close();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", error: errorMessage })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
