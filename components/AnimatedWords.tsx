"use client";

import { useEffect, useState } from "react";

const WORDS = ["Excel", "Notion", "Trello"];
const CYCLE_MS = 2000;

export default function AnimatedWords() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % WORDS.length);
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <span
      className="animated-word"
      aria-hidden="true"
      style={{ display: "inline-block", position: "relative", minWidth: "5.5ch" }}
    >
      {WORDS.map((word, i) => (
        <span
          key={word}
          style={{
            position: i === index ? "relative" : "absolute",
            left: 0,
            opacity: i === index ? 1 : 0,
            transform: i === index ? "translateY(0)" : "translateY(6px)",
            display: "inline-block",
            transition: "opacity 0.35s ease, transform 0.35s ease",
            color: "inherit",
          }}
        >
          {word}
        </span>
      ))}
    </span>
  );
}
