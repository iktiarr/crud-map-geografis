"use client";

import * as React from "react";
import { Bot, User as UserIcon, Send, Sparkles, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChatMessage } from "../types";

interface GlobalMapAiDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  inputMessage: string;
  setInputMessage: (val: string) => void;
  isAiLoading: boolean;
  currentActiveAi: string;
  onSendMessage: (text?: string) => void;
  onExecuteAction: (action: NonNullable<ChatMessage["action"]>) => void;
  chatScrollRef: React.RefObject<HTMLDivElement | null>;
}

export function GlobalMapAiDrawer({
  isOpen,
  onClose,
  messages,
  inputMessage,
  setInputMessage,
  isAiLoading,
  currentActiveAi,
  onSendMessage,
  onExecuteAction,
  chatScrollRef,
}: GlobalMapAiDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm sm:max-w-md bg-card/95 backdrop-blur-xl border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-3.5 border-b border-border/80 flex items-start justify-between bg-secondary/40 shrink-0">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-xs shrink-0 mt-0.5">
            <Bot className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-xs sm:text-sm text-foreground">
              Asisten AI Global Maps
            </div>

            {/* Badge Model AI Simple di bawah deskripsi judul */}
            <div className="mt-1.5 flex items-center">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary/10 border border-primary/25 text-[10px] font-mono font-semibold text-primary shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="truncate max-w-52.5 sm:max-w-62.5">{currentActiveAi || "OpenRouter AI"}</span>
              </span>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer shrink-0 -mr-1 -mt-0.5"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Message Scroller */}
      <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-3 sm:p-3.5 space-y-3 text-xs min-h-60">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-2 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.sender === "ai" && (
              <div className="w-6 h-6 rounded-md bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-xl p-2.5 sm:p-3 text-xs leading-relaxed shadow-2xs ${
                m.sender === "user"
                  ? "bg-primary text-primary-foreground font-medium rounded-br-xs"
                  : "bg-secondary border border-border text-foreground rounded-tl-xs"
              }`}
            >
              <div className="whitespace-pre-wrap">{m.text}</div>

              {m.action && (
                <div className="mt-2.5 pt-2 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => onExecuteAction(m.action!)}
                    className="w-full h-7 px-2 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary font-semibold text-[11px] flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="truncate">Terapkan: {m.action.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                  </button>
                </div>
              )}
            </div>

            {m.sender === "user" && (
              <div className="w-6 h-6 rounded-md bg-secondary text-foreground border border-border flex items-center justify-center shrink-0 mt-0.5">
                <UserIcon className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {isAiLoading && (
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-secondary border border-border text-muted-foreground rounded-xl p-2.5 text-xs flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Memproses dengan AI...</span>
            </div>
          </div>
        )}
      </div>

      {/* Chat Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSendMessage();
        }}
        className="p-3 border-t border-border bg-card flex items-center gap-2"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Tanya lokasi atau minta kontrol peta..."
          className="flex-1 h-9 px-3 rounded-lg border border-border bg-secondary/50 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
        />
        <Button
          type="submit"
          disabled={isAiLoading || !inputMessage.trim()}
          size="sm"
          className="h-9 px-3 bg-primary text-primary-foreground text-xs font-semibold cursor-pointer shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </Button>
      </form>
    </div>
  );
}
