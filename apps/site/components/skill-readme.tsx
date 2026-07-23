import type { ReactNode } from "react";
import { SyntaxHighlight } from "@/components/syntax-highlight";

interface Block {
  type: "heading" | "paragraph" | "list" | "code" | "quote";
  level?: number;
  lines: string[];
  language?: string;
}

function blocksFromMarkdown(source: string): Block[] {
  const blocks: Block[] = [];
  const lines = source.replaceAll("\r\n", "\n").split("\n");
  let index = 0;
  while (index < lines.length) {
    const line = lines[index] ?? "";
    if (!line.trim()) {
      index += 1;
      continue;
    }
    if (line.startsWith("```")) {
      const language = line.slice(3).trim();
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !(lines[index] ?? "").startsWith("```")) {
        code.push(lines[index] ?? "");
        index += 1;
      }
      index += 1;
      blocks.push({ type: "code", lines: code, language });
      continue;
    }
    const heading = /^(#{1,4})\s+(.+)$/.exec(line);
    if (heading) {
      blocks.push({
        type: "heading",
        level: heading[1]?.length ?? 2,
        lines: [heading[2] ?? ""],
      });
      index += 1;
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index] ?? "")) {
        items.push((lines[index] ?? "").replace(/^[-*]\s+/, ""));
        index += 1;
      }
      blocks.push({ type: "list", lines: items });
      continue;
    }
    if (line.startsWith("> ")) {
      const quotes: string[] = [];
      while (index < lines.length && (lines[index] ?? "").startsWith("> ")) {
        quotes.push((lines[index] ?? "").slice(2));
        index += 1;
      }
      blocks.push({ type: "quote", lines: quotes });
      continue;
    }
    const paragraph: string[] = [line];
    index += 1;
    while (
      index < lines.length &&
      (lines[index] ?? "").trim() &&
      !/^(#{1,4})\s+/.test(lines[index] ?? "") &&
      !/^[-*]\s+/.test(lines[index] ?? "") &&
      !(lines[index] ?? "").startsWith("```") &&
      !(lines[index] ?? "").startsWith("> ")
    ) {
      paragraph.push(lines[index] ?? "");
      index += 1;
    }
    blocks.push({ type: "paragraph", lines: paragraph });
  }
  return blocks;
}

function inlineText(value: string): ReactNode[] {
  const parts = value.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
}

export async function SkillReadme({ source }: { source: string }) {
  const blocks = blocksFromMarkdown(source);
  return (
    <div className="skill-readme-content">
      {await Promise.all(blocks.map(async (block, index) => {
        if (block.type === "heading") {
          const content = inlineText(block.lines[0] ?? "");
          if (block.level === 1) return <h2 key={index}>{content}</h2>;
          if (block.level === 2) return <h3 key={index}>{content}</h3>;
          return <h4 key={index}>{content}</h4>;
        }
        if (block.type === "list") {
          return (
            <ul key={index}>
              {block.lines.map((line, item) => (
                <li key={item}>{inlineText(line)}</li>
              ))}
            </ul>
          );
        }
        if (block.type === "code") {
          return (
            <SyntaxHighlight
              key={index}
              code={block.lines.join("\n")}
              language={block.language || "text"}
            />
          );
        }
        if (block.type === "quote") {
          return (
            <blockquote key={index}>
              {block.lines.map((line, item) => (
                <p key={item}>{inlineText(line)}</p>
              ))}
            </blockquote>
          );
        }
        return <p key={index}>{inlineText(block.lines.join(" "))}</p>;
      }))}
    </div>
  );
}
