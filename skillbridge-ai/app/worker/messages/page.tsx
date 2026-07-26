"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Paperclip, Send, Smile, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageBubble } from "@/features/worker/components/messaging/message-bubble";
import { TypingIndicator } from "@/features/worker/components/messaging/typing-indicator";
import mockMessages from "@/mock/messages.json";
import { cn, getInitials } from "@/lib/utils";

interface Conversation {
  id: string;
  name: string;
  role: string;
  preview: string;
  time: string;
  unread: number;
  online: boolean;
  accent: "bridge" | "signal" | "success";
}

interface MessageItem {
  id: string;
  sender: "me" | "them";
  text: string;
  time: string;
  status?: "sent" | "read";
  attachment?: string;
}

export default function MessagesPage() {
  const [activeId, setActiveId] = useState("conv-1");
  const [draft, setDraft] = useState("");
  const [showTyping, setShowTyping] = useState(true);
  const [messages, setMessages] = useState<Record<string, MessageItem[]>>(mockMessages.messagesByConversation as Record<string, MessageItem[]>);

  const conversations = mockMessages.conversations as Conversation[];
  const active = useMemo(() => conversations.find((conversation) => conversation.id === activeId) ?? conversations[0], [activeId, conversations]);
  const activeMessages = messages[activeId] ?? [];

  useEffect(() => {
    const timer = window.setTimeout(() => setShowTyping(false), 1200);
    return () => window.clearTimeout(timer);
  }, [activeId]);

  const handleSend = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    const newMessage: MessageItem = { id: `msg-${Date.now()}`, sender: "me", text: draft.trim(), time: "Just now", status: "read", attachment: draft.includes("pdf") ? "Offer-letter.pdf" : undefined };
    setMessages((current) => ({ ...current, [activeId]: [...(current[activeId] ?? []), newMessage] }));
    setDraft("");
    setShowTyping(true);
  };

  return (
    <div>
      <PageHeader title="Messaging" description="Modern conversations with typing states, attachments, emojis, and read receipts." />
      <Card className="grid h-[620px] grid-cols-1 overflow-hidden rounded-3xl border-border/70 md:grid-cols-[300px_1fr]">
        <div className="border-b border-border bg-background/70 md:border-b-0 md:border-r">
          <div className="border-b border-border p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-bridge-600">
              <Sparkles className="h-4 w-4" /> Live conversations
            </div>
          </div>
          <div className="h-[calc(620px-72px)] overflow-y-auto">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setActiveId(conversation.id)}
                className={cn(
                  "flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-secondary/70",
                  activeId === conversation.id && "bg-secondary/70"
                )}
              >
                <Avatar>
                  <AvatarFallback>{getInitials(conversation.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{conversation.name}</p>
                    <span className="text-[10px] text-muted-foreground">{conversation.time}</span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{conversation.preview}</p>
                </div>
                {conversation.unread > 0 ? <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-signal-400 text-[10px] font-semibold text-bridge-900">{conversation.unread}</span> : null}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>{getInitials(active.name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-display text-sm font-semibold">{active.name}</p>
                <p className="text-xs text-muted-foreground">{active.role}</p>
              </div>
            </div>
            <Badge variant={active.online ? "signal" : "outline"}>{active.online ? "Online" : "Away"}</Badge>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-[radial-gradient(circle_at_top_left,rgba(36,81,184,0.06),transparent_30%)] p-4">
            {activeMessages.map((message) => <MessageBubble key={message.id} message={message} />)}
            {showTyping ? <TypingIndicator /> : null}
          </div>

          <form className="border-t border-border p-3" onSubmit={handleSend}>
            <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-background/70 p-2">
              <Button type="button" variant="ghost" size="icon" aria-label="Attach file">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" aria-label="Add emoji">
                <Smile className="h-4 w-4" />
              </Button>
              <Input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message…" aria-label="Message" className="border-0 bg-transparent shadow-none focus-visible:ring-0" />
              <Button type="submit" size="sm" aria-label="Send message">
                <Send className="mr-2 h-4 w-4" /> Send
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
