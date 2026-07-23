import { codeToHtml } from "shiki";
import { cn } from "@/lib/utils";

type SyntaxHighlightProps = {
  code: string;
  language?: string;
  className?: string;
};

const languageAliases: Record<string, string> = {
  bash: "shellscript",
  console: "shellscript",
  sh: "shellscript",
  shell: "shellscript",
  text: "text",
  txt: "text",
  yml: "yaml",
};

export async function SyntaxHighlight({
  code,
  language = "text",
  className,
}: SyntaxHighlightProps) {
  const normalizedLanguage =
    languageAliases[language.toLowerCase()] ?? language.toLowerCase();

  let html: string;
  try {
    html = await codeToHtml(code.trimEnd(), {
      lang: normalizedLanguage,
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
    });
  } catch {
    html = await codeToHtml(code.trimEnd(), {
      lang: "text",
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
    });
  }

  return (
    <div
      className={cn("syntax-highlight", className)}
      data-language={language || undefined}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
