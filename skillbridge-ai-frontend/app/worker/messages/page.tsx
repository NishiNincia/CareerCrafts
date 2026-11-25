"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Send, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageBubble } from "@/features/worker/components/messaging/message-bubble";
import { chatService, type ChatContact, type ChatConversation, type ChatMessage } from "@/services/chat.service";
import { cn, getInitials } from "@/lib/utils";

function formatTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function MessagesPage() {
  const [searchParams] = useSearchParams();
  const requestedConversationId = searchParams.get("conversationId");
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [activeId, setActiveId] = useState(requestedConversationId || "");
  const [newContactId, setNewContactId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active = useMemo(
    () => conversations.find((conversation) => conversation.id === activeId) ?? null,
    [activeId, conversations],
  );
  const newContact = contacts.find((contact) => contact.id === newContactId) ?? null;
  const recipient = active ? { id: active.participantId, name: active.name, role: active.role } : newContact;

  const refreshConversations = useCallback(async () => {
    const data = await chatService.conversations();
    setConversations(data);
    setActiveId((current) => {
      if (current && data.some((conversation) => conversation.id === current)) return current;
      return data[0]?.id ?? "";
    });
  }, []);

  useEffect(() => {
    let activeEffect = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [threads, people] = await Promise.all([chatService.conversations(), chatService.contacts()]);
        if (!activeEffect) return;
        setConversations(threads);
        setContacts(people);
        const requestedExists = requestedConversationId
          && threads.some((conversation) => conversation.id === requestedConversationId);
        setActiveId((current) => requestedExists
          ? requestedConversationId
          : current && threads.some((conversation) => conversation.id === current)
            ? current
            : threads[0]?.id ?? "");
      } catch (loadError) {
        if (activeEffect) setError(loadError instanceof Error ? loadError.message : "Could not load conversations.");
      } finally {
        if (activeEffect) setLoading(false);
      }
    };
    void load();
    const timer = window.setInterval(() => {
      void chatService.conversations()
        .then((threads) => {
          if (activeEffect) setConversations(threads);
        })
        .catch((pollError: unknown) => {
          if (activeEffect) setError(pollError instanceof Error ? pollError.message : "Could not refresh conversations.");
        });
    }, 5_000);
    return () => {
      activeEffect = false;
      window.clearInterval(timer);
    };
  }, [requestedConversationId]);

  useEffect(() => {
    let activeEffect = true;
    if (!activeId) {
      setMessages([]);
      return () => {
        activeEffect = false;
      };
    }

    const loadMessages = async () => {
      try {
        const data = await chatService.messages(activeId);
        if (activeEffect) setMessages(data);
        await chatService.markRead(activeId);
        if (activeEffect) {
          setConversations((current) => current.map((thread) =>
            thread.id === activeId ? { ...thread, unread: 0 } : thread
          ));
        }
      } catch (loadError) {
        if (activeEffect) setError(loadError instanceof Error ? loadError.message : "Could not load messages.");
      }
    };
    void loadMessages();
    const timer = window.setInterval(() => void loadMessages(), 4_000);
    return () => {
      activeEffect = false;
      window.clearInterval(timer);
    };
  }, [activeId]);

  const selectConversation = useCallback(async (conversation: ChatConversation) => {
    setActiveId(conversation.id);
    setNewContactId("");
    setError(null);
    try {
      await chatService.markRead(conversation.id);
      setConversations((current) => current.map((thread) =>
        thread.id === conversation.id ? { ...thread, unread: 0 } : thread
      ));
    } catch (readError) {
      setError(readError instanceof Error ? readError.message : "Could not mark messages as read.");
    }
  }, []);

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!recipient || !draft.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const sent = await chatService.send(
        recipient.id,
        draft.trim(),
        active?.contextId ? {
          contextId: active.contextId,
          contextType: active.contextType === "job" || active.contextType === "gig" ? active.contextType : "general",
        } : undefined,
      );
      setMessages((current) => [...current, sent]);
      setDraft("");
      setNewContactId("");
      setActiveId(sent.conversationId);
      await refreshConversations();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Could not send this message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHeader title="Messaging" description="Send and receive messages with employers and keep track of unread replies." />
      {error && <p role="alert" className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      <Card className="grid min-h-[620px] grid-cols-1 overflow-hidden rounded-3xl border-border/70 md:grid-cols-[300px_1fr]">
        <div className="border-b border-border bg-background/70 md:border-b-0 md:border-r">
          <div className="space-y-3 border-b border-border p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-bridge-600">
              <Sparkles className="h-4 w-4" /> Conversations
            </div>
            <label htmlFor="new-contact" className="sr-only">Start a conversation</label>
            <select
              id="new-contact"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={newContactId}
              onChange={(event) => {
                setNewContactId(event.target.value);
                setActiveId("");
                setMessages([]);
              }}
            >
              <option value="">Start a new conversation...</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>{contact.name} ({contact.role})</option>
              ))}
            </select>
          </div>
          <div className="max-h-[calc(620px-120px)] overflow-y-auto">
            {loading ? <p className="p-4 text-sm text-muted-foreground">Loading conversations...</p> : conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => void selectConversation(conversation)}
                className={cn(
                  "flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-secondary/70",
                  activeId === conversation.id && "bg-secondary/70",
                )}
              >
                <Avatar><AvatarFallback>{getInitials(conversation.name)}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{conversation.name}</p>
                    <span className="text-[10px] text-muted-foreground">{formatTime(conversation.time)}</span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{conversation.preview}</p>
                </div>
                {conversation.unread > 0 && <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-signal-400 px-1 text-[10px] font-semibold text-bridge-900">{conversation.unread}</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="flex min-h-[620px] flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-3">
              <Avatar><AvatarFallback>{recipient ? getInitials(recipient.name) : "?"}</AvatarFallback></Avatar>
              <div>
                <p className="font-display text-sm font-semibold">{recipient?.name ?? "Select a conversation"}</p>
                <p className="text-xs text-muted-foreground">{recipient?.role ?? "Choose a contact to start messaging"}</p>
              </div>
            </div>
            {active && <Badge variant="outline">{active.contextType === "general" ? "General" : active.contextType}</Badge>}
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-[radial-gradient(circle_at_top_left,rgba(36,81,184,0.06),transparent_30%)] p-4">
            {!recipient && !loading && <p className="py-10 text-center text-sm text-muted-foreground">Select an existing thread or choose a contact to begin.</p>}
            {recipient && !messages.length && <p className="py-10 text-center text-sm text-muted-foreground">No messages yet. Send a message to start the conversation.</p>}
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={{
                  id: message.id,
                  sender: message.senderIsCurrentUser ? "me" : "them",
                  text: message.text,
                  time: formatTime(message.createdAt),
                  status: message.read ? "read" : "sent",
                  attachment: message.attachmentUrl ?? undefined,
                }}
              />
            ))}
          </div>

          <form className="border-t border-border p-3" onSubmit={(event) => void handleSend(event)}>
            <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-background/70 p-2">
              <Input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={recipient ? "Write a message..." : "Select a contact first"}
                aria-label="Message"
                maxLength={4000}
                disabled={!recipient || sending}
                className="border-0 bg-transparent shadow-none focus-visible:ring-0"
              />
              <Button type="submit" size="sm" aria-label="Send message" disabled={!recipient || !draft.trim() || sending}>
                <Send className="mr-2 h-4 w-4" /> {sending ? "Sending..." : "Send"}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
