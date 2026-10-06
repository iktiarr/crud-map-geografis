"use client";

import React, { useState } from "react";

interface TelegramReportFormProps {
  username?: string;
  apiUrl?: string;
  onSuccess?: () => void;
  className?: string;
}

export default function TelegramReportForm({
  username = "Tamu",
  apiUrl = "/api/telegram-report",
  onSuccess,
  className = "",
}: TelegramReportFormProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    text: string;
  }>({ type: null, text: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: null, text: "" });

    if (!message.trim()) {
      setStatus({ type: "error", text: "Pesan laporan wajib diisi." });
      return;
    }

    setIsSending(true);

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          message: message.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus({
          type: "success",
          text: data.message || "Laporan berhasil dikirim ke Bot Telegram.",
        });
        setMessage("");
        if (onSuccess) onSuccess();
      } else {
        setStatus({
          type: "error",
          text: data.error || "Gagal mengirim laporan ke Bot Telegram.",
        });
      }
    } catch (err: unknown) {
      const errText =
        err instanceof Error ? err.message : "Terjadi kendala jaringan.";
      setStatus({ type: "error", text: errText });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col gap-3.5 ${className}`}>
      {/* Alert Status Sukses / Gagal */}
      {status.type === "error" && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs leading-relaxed">
          {status.text}
        </div>
      )}

      {status.type === "success" && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs leading-relaxed">
          {status.text}
        </div>
      )}

      {/* Input Pesan Laporan */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono">
          Pesan Laporan
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          placeholder="Tuliskan kendala, saran, atau pesan laporan Anda di sini..."
          required
          className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition"
        />
      </div>

      {/* Tombol Kirim */}
      <button
        type="submit"
        disabled={isSending}
        className="w-full h-10 px-4 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-neutral-100 dark:text-neutral-900 font-medium text-sm hover:opacity-90 active:scale-[0.99] disabled:opacity-50 transition cursor-pointer flex items-center justify-center gap-2"
      >
        {isSending ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Mengirim ke Telegram...</span>
          </>
        ) : (
          <span>Kirim Laporan</span>
        )}
      </button>
    </form>
  );
}
