"use client";

import { Children, useEffect, useRef, useState } from "react";

function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const el = ref.current;
    if (reduced || !el) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, visible };
}

/** Fades + rises a single block in once it enters the viewport. */
export function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { ref, visible } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      data-state={visible ? "visible" : "hidden"}
      className={`transition-all duration-700 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

/** Same as Reveal, but staggers each direct child in on its own delay. */
export function RevealStagger({
  children,
  className = "",
  gapMs = 80,
}: {
  children: React.ReactNode;
  className?: string;
  gapMs?: number;
}) {
  const { ref, visible } = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className={className}>
      {Children.map(children, (child, i) => (
        <div
          data-state={visible ? "visible" : "hidden"}
          className={`group/reveal transition-all duration-700 ease-out ${
            visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
          style={{ transitionDelay: visible ? `${i * gapMs}ms` : "0ms" }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
