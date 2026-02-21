"use client";

import { useEffect, useState } from "react";

interface TypingHeadingProps {
  name: string;
}

export function TypingHeading({ name }: TypingHeadingProps) {
  const fullText = `Let's build something, ${name}`;
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(fullText.slice(0, i));
      if (i >= fullText.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, 40);
    return () => clearInterval(interval);
  }, [fullText]);

  return (
    <h1 className="text-4xl font-bold text-white md:text-5xl lg:text-6xl">
      {displayed}
      <span
        className={`ml-0.5 inline-block h-[1em] w-[3px] translate-y-[0.1em] rounded-full bg-white ${
          done ? "animate-pulse" : ""
        }`}
      />
    </h1>
  );
}
