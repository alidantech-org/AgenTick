"use client";

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
        {
          signal: controller.signal,
        },
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

  return (
    <div
      ref={root}
      className={`registry-search ${compact ? "registry-search-compact" : ""}`}
    >
      <form onSubmit={submit} role="search">
        <svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19">
          <path
            d="m20 20-4.4-4.4m2.4-5.1a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={
            compact
              ? "Search skills"
              : "Search skills, namespaces, and use cases"
          }
          aria-label="Search skill registry"
        />
        {!compact && <button type="submit">Search</button>}
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
