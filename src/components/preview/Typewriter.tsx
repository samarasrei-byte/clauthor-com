/**
 * Typewriter · renderiza texto caractere-por-caractere.
 * Uso: <Typewriter text="olá" speed={22} startDelay={200} />
 */
import { useEffect, useState } from "react";

interface TypewriterProps {
  text: string;
  speed?: number; // ms por char
  startDelay?: number; // ms antes de começar
  className?: string;
  onDone?: () => void;
}

export default function Typewriter({
  text,
  speed = 22,
  startDelay = 0,
  className,
  onDone,
}: TypewriterProps) {
  const [shown, setShown] = useState(0);
  const [started, setStarted] = useState(startDelay === 0);

  useEffect(() => {
    if (started) return;
    const t = setTimeout(() => setStarted(true), startDelay);
    return () => clearTimeout(t);
  }, [started, startDelay]);

  useEffect(() => {
    if (!started) return;
    if (shown >= text.length) {
      onDone?.();
      return;
    }
    const t = setTimeout(() => setShown((s) => s + 1), speed);
    return () => clearTimeout(t);
  }, [shown, started, text, speed, onDone]);

  const isTyping = started && shown < text.length;

  return (
    <span className={className}>
      {text.slice(0, shown)}
      {isTyping && (
        <span
          className="inline-block w-[2px] h-[0.9em] align-middle bg-primary/70 ml-[1px] animate-pulse"
          aria-hidden
        />
      )}
    </span>
  );
}
