"use client";

import { motion } from "framer-motion";
import { CheckCheck, Paperclip, Smile } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: {
    id: string;
    sender: "me" | "them";
    text: string;
    time: string;
    status?: "sent" | "read";
    attachment?: string;
  };
}

export function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn("flex", message.sender === "me" ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[80%] rounded-3xl px-4 py-3 text-sm shadow-sm", message.sender === "me" ? "bg-primary text-primary-foreground" : "bg-secondary")}> 
        {message.attachment ? (
          <div className="mb-2 rounded-2xl border border-border/70 bg-background/70 p-2 text-xs">
            <div className="flex items-center gap-2">
              <Paperclip className="h-3.5 w-3.5" />
              <span>{message.attachment}</span>
            </div>
          </div>
        ) : null}
        <p>{message.text}</p>
        <div className="mt-2 flex items-center justify-end gap-1 text-[10px] opacity-70">
          <span>{message.time}</span>
          {message.sender === "me" ? <CheckCheck className="h-3 w-3" /> : null}
        </div>
      </div>
    </motion.div>
  );
}
