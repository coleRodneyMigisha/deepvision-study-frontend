"use client";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export type Mood = "idle" | "thinking" | "happy" | "oops" | "wave";

/**
 * The study buddy: a soft, highlighter-yellow blob with a pencil tuft.
 * Moods: idle (blinks), thinking (looks up, dots), happy (squints, bounces), oops (worried), wave.
 */
export function BuddyAvatar({ mood = "idle", size = 40, className }: { mood?: Mood; size?: number; className?: string }) {
  const bounce = mood === "happy" ? { y: [0, -5, 0, -3, 0] } : mood === "wave" ? { rotate: [0, -8, 8, -6, 0] } : { y: [0, -1.5, 0] };
  const transition =
    mood === "happy" || mood === "wave" ? { duration: 0.9 } : { duration: 3.2, repeat: Infinity, ease: "easeInOut" as const };
  const eyeY = mood === "thinking" ? 21 : 24;
  return (
    <motion.div className={cn("relative shrink-0", className)} style={{ width: size, height: size }} animate={bounce} transition={transition} aria-hidden>
      <svg viewBox="0 0 48 48" width={size} height={size}>
        <path d="M24 4c3 0 4.5 2.4 4 4.6" fill="none" stroke="#1e1914" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M24 8c11.5 0 19 7.3 19 18.2C43 37.7 35.4 44 24 44S5 37.7 5 26.2C5 15.3 12.5 8 24 8z" fill="#FFD84D" stroke="#1e1914" strokeWidth="2.2" />
        <ellipse cx="13.5" cy="30.5" rx="3.2" ry="2" fill="#FF9F6B" opacity=".55" />
        <ellipse cx="34.5" cy="30.5" rx="3.2" ry="2" fill="#FF9F6B" opacity=".55" />
        {mood === "happy" ? (
          <g fill="none" stroke="#1e1914" strokeWidth="2.4" strokeLinecap="round">
            <path d="M15 25.5q3-3.6 6 0" />
            <path d="M27 25.5q3-3.6 6 0" />
          </g>
        ) : (
          <g fill="#1e1914">
            <motion.ellipse
              cx="18"
              cy={eyeY}
              rx="2.3"
              ry="2.9"
              animate={mood === "idle" ? { scaleY: [1, 1, 0.1, 1] } : {}}
              transition={{ duration: 4, repeat: Infinity, times: [0, 0.92, 0.95, 1] }}
              style={{ originY: "50%" }}
            />
            <motion.ellipse
              cx="30"
              cy={eyeY}
              rx="2.3"
              ry="2.9"
              animate={mood === "idle" ? { scaleY: [1, 1, 0.1, 1] } : {}}
              transition={{ duration: 4, repeat: Infinity, times: [0, 0.92, 0.95, 1] }}
              style={{ originY: "50%" }}
            />
          </g>
        )}
        {mood === "oops" ? (
          <path d="M19 34.5q5-3 10 0" fill="none" stroke="#1e1914" strokeWidth="2.2" strokeLinecap="round" />
        ) : mood === "thinking" ? (
          <circle cx="24" cy="34" r="1.8" fill="#1e1914" />
        ) : (
          <path d="M18.5 32q5.5 5 11 0" fill="none" stroke="#1e1914" strokeWidth="2.2" strokeLinecap="round" />
        )}
      </svg>
      {mood === "thinking" && (
        <span className="absolute -top-1 -right-2 flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="size-1.5 rounded-full bg-ink"
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
            />
          ))}
        </span>
      )}
    </motion.div>
  );
}
