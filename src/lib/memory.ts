import { getDb } from "./db";

export async function readAllMemories(): Promise<string> {
  const prisma = await getDb();
  const files = await prisma.memoryFile.findMany();
  return files.map((f) => f.content).join("\n\n");
}

export async function writeMemory(
  filepath: string,
  content: string
): Promise<void> {
  const prisma = await getDb();
  await prisma.memoryFile.upsert({
    where: { path: filepath },
    update: { content },
    create: { path: filepath, content },
  });
}

export async function appendToMemory(
  filepath: string,
  section: string,
  entry: string
): Promise<void> {
  const prisma = await getDb();
  const existing = await prisma.memoryFile.findUnique({
    where: { path: filepath },
  });

  let content = existing?.content || "";
  const marker = `## ${section}`;
  if (content.includes(marker)) {
    content = content.replace(marker, `${marker}\n- ${entry}`);
  } else {
    content += `\n\n${marker}\n- ${entry}\n`;
  }

  await prisma.memoryFile.upsert({
    where: { path: filepath },
    update: { content },
    create: { path: filepath, content },
  });
}

export async function listMemoryFiles(): Promise<
  { path: string; preview: string }[]
> {
  const prisma = await getDb();
  const files = await prisma.memoryFile.findMany({
    orderBy: { path: "asc" },
  });
  return files.map((f) => ({
    path: f.path,
    preview: f.content.slice(0, 200),
  }));
}

export async function readMemoryFile(filepath: string): Promise<string> {
  const prisma = await getDb();
  const file = await prisma.memoryFile.findUnique({
    where: { path: filepath },
  });
  return file?.content || "";
}

export async function deleteMemoryFile(filepath: string): Promise<void> {
  const prisma = await getDb();
  await prisma.memoryFile.delete({ where: { path: filepath } }).catch(() => {});
}

export async function seedMemoryFromFs(): Promise<void> {
  const prisma = await getDb();
  const count = await prisma.memoryFile.count();
  if (count > 0) return; // already seeded

  const fs = await import("fs/promises");
  const path = await import("path");
  const MEMORY_DIR = path.join(process.cwd(), "memory");

  async function scan(dir: string) {
    try {
      const entries = await fs.readdir(path.join(MEMORY_DIR, dir), {
        withFileTypes: true,
      });
      for (const entry of entries) {
        const relPath = dir ? `${dir}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          await scan(relPath);
        } else if (entry.name.endsWith(".md")) {
          try {
            const content = await fs.readFile(
              path.join(MEMORY_DIR, relPath),
              "utf-8"
            );
            await prisma.memoryFile.create({
              data: { path: relPath, content },
            });
          } catch {
            /* skip unreadable files */
          }
        }
      }
    } catch {
      /* dir doesn't exist */
    }
  }

  await scan("");
}
