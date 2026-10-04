"use client";

import * as React from "react";
import {
  Sparkles,
  Bot,
  Send,
  Loader2,
  X,
  MoreVertical,
  RotateCcw,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  askAiRouteAssistant,
  RouteAssistantContext,
  AiRouteAction,
} from "@/lib/ai-route-assistant";

interface AiFloatingAssistantProps {
  contextData: RouteAssistantContext;
  onExecuteAction: (action: AiRouteAction) => void;
  actionFeedback?: string | null;
}

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  actions?: AiRouteAction[];
  modelUsed?: string;
  timestamp: number;
}

export function AiFloatingAssistant({
  contextData,
  onExecuteAction,
}: AiFloatingAssistantProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputQuestion, setInputQuestion] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const chatScrollRef = React.useRef<HTMLDivElement>(null);
  const msgCounterRef = React.useRef(1);

  // Auto-scroll chat body ke paling bawah saat ada pesan baru
  React.useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Fungsi "Mulai dari Awal" (Reset chat tanpa simpan ke database)
  const handleResetChat = () => {
    setMessages([]);
    setInputQuestion("");
    setErrorMsg(null);
  };

  // Kirim prompt ke AI
  const handleSendMessage = async (customPrompt?: string) => {
    const promptToSend = (customPrompt || inputQuestion).trim();
    if (!promptToSend || isLoading) return;

    setInputQuestion("");
    setErrorMsg(null);

    const userMsgId = `usr-${msgCounterRef.current++}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: "user",
      text: promptToSend,
      timestamp: msgCounterRef.current,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await askAiRouteAssistant(promptToSend, contextData);
      if (res.success && res.reply) {
        // Otomatis terapkan aksi jika ada perintah perubahan rute dari pengguna
        if (res.actions && res.actions.length > 0) {
          res.actions.forEach((act) => onExecuteAction(act));
        }

        const aiMsgId = `ai-${msgCounterRef.current++}`;
        const aiMsg: ChatMessage = {
          id: aiMsgId,
          sender: "ai",
          text: res.reply,
          actions: res.actions || [],
          modelUsed: res.modelUsed,
          timestamp: msgCounterRef.current,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        setErrorMsg(res.error || "Gagal mendapatkan respon dari asisten AI.");
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Terjadi gangguan koneksi ke layanan AI."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Jendela Floating Chat Assistant */}
      {isOpen && (
        <div className="mb-3 w-90 sm:w-100 max-h-[80vh] flex flex-col rounded-2xl border border-border/80 bg-background/95 backdrop-blur-md shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200">
          {/* Header Asisten */}
          <div className="px-3.5 py-3 border-b border-border/60 bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground">
                  Asisten AI Perutean
                </h3>
                <p className="text-[10px] text-muted-foreground">
                  Navigasi, rute jalan, & optimasi GIS
                </p>
              </div>
            </div>

            {/* Tombol Opsi: Titik Tiga (Sebelah X) & Tombol Tutup */}
            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer transition-colors outline-hidden"
                  title="Opsi Chat"
                >
                  <MoreVertical className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 text-xs">
                  <DropdownMenuItem
                    onClick={handleResetChat}
                    className="cursor-pointer text-destructive focus:text-destructive flex items-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Mulai dari Awal</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer transition-colors"
                title="Tutup Asisten"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Body */}
          <div
            ref={chatScrollRef}
            className="p-3 space-y-3 overflow-y-auto max-h-90 flex-1 text-xs"
          >
            {/* Tampilan Sederhana saat Chat Masih Kosong */}
            {messages.length === 0 && !isLoading && (
              <div className="p-3 rounded-xl bg-secondary/30 border border-border/50 text-center space-y-1">
                <p className="text-xs font-semibold text-foreground flex items-center justify-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                  <span>Asisten AI Rute</span>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Ketik pertanyaan atau perintah rute di bawah.
                </p>
              </div>
            )}

            {/* Riwayat Percakapan */}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-xl px-3 py-2 leading-relaxed ${
                    m.sender === "user"
                      ? "bg-primary text-primary-foreground font-medium text-xs rounded-br-xs"
                      : "bg-secondary/60 text-foreground border border-border/50 text-xs rounded-bl-xs"
                  }`}
                >
                  <div className="whitespace-pre-line">{m.text}</div>
                </div>
              </div>
            ))}

            {/* Status Loading */}
            {isLoading && (
              <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/40 flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />
                <span>Menganalisis rute peta...</span>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-[11px]">
                {errorMsg}
              </div>
            )}
          </div>

          {/* Form Input Prompt (Tanpa tombol aksi cepat, murni prompt) */}
          <div className="p-2.5 border-t border-border/60 bg-background">
            <div className="relative flex items-center">
              <textarea
                rows={2}
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                placeholder="Ketik pertanyaan atau perintah rute..."
                className="w-full p-2 text-xs bg-secondary/30 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-hidden focus:ring-1 focus:ring-primary resize-none pr-10"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={isLoading || !inputQuestion.trim()}
                className="absolute right-2 bottom-2 p-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-40 cursor-pointer transition-colors shadow-2xs"
                title="Kirim prompt"
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tombol Utama Melayang (FAB) - Simpel, modern, tanpa dot kedip */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer ring-2 ring-primary/20"
        title="Buka Asisten AI Perutean"
      >
        <Sparkles className="w-4 h-4" />
        <span>Asisten AI</span>
        {isOpen && <ChevronDown className="w-3.5 h-3.5 rotate-180" />}
      </button>
    </div>
  );
}
