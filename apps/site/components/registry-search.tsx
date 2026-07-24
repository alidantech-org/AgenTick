"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface SearchSkill {
  namespace: string;
  name: string;
  description: string;
  latestVersion: string | null;
}

export function RegistrySearch({
  compact = false,
  initialQuery = "",
}: {
  compact?: boolean;
  initialQuery?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchSkill[]>([]);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      const response = await fetch(
        `/api/v1/skills/search?q=${encodeURIComponent(query)}`,
        { signal: controller.signal },
      );
      if (!response.ok) return;
      const data = (await response.json()) as { skills: SearchSkill[] };
      setResults(data.skills.slice(0, 6));
      setOpen(true);
    }, 180);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    router.push(value ? `/skills?q=${encodeURIComponent(value)}` : "/skills");
    setOpen(false);
  }

  function clear() {
    setQuery("");
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  }

  return (
    <div
      ref={root}
      className={`registry-search ${compact ? "registry-search-compact" : ""}`}
    >
      <form onSubmit={submit} role="search">
        <Search aria-hidden="true" className="search-icon size-4 shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={(event) => event.key === "Escape" && clear()}
          placeholder={
            compact
              ? "Search skills"
              : "Search skills, namespaces, and use cases"
          }
          className="outline-none border-none bg-transparent text-sm placeholder:text-muted-foreground focus:ring-0"
          aria-label="Search skill registry"
        />
        {query && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear search"
            className="clear-button"
          >
            <X className="size-3.5" />
          </button>
        )}
      </form>

      {open && results.length > 0 && (
        <div className="search-popover" role="listbox">
          {results.map((skill) => (
            <button
              type="button"
              key={`${skill.namespace}/${skill.name}`}
              onClick={() =>
                router.push(`/skills/${skill.namespace}/${skill.name}`)
              }
            >
              <span className="search-result-name">
                {skill.namespace}/{skill.name}
              </span>
              <span>{skill.description}</span>
              {skill.latestVersion && <code>v{skill.latestVersion}</code>}
            </button>
          ))}
          <button
            type="button"
            className="search-all"
            onClick={() =>
              router.push(`/skills?q=${encodeURIComponent(query)}`)
            }
          >
            View every result →
          </button>
        </div>
      )}
    </div>
  );
}
