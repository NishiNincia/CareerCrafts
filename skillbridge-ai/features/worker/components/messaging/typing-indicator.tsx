"use client";

import { motion } from "framer-motion";

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-secondary px-4 py-3 text-sm text-muted-foreground">
      <span className="font-medium">Typing</span>
      <div className="flex gap-1">
        {[0, 1, 2].map((dot) => (
          <motion.span
            key={dot}
            className="h-2 w-2 rounded-full bg-muted-foreground/70"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: dot * 0.1 }}
          />
        ))}
      </div>
    </div>
  );
}
