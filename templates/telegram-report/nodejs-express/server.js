/* eslint-disable @typescript-eslint/no-require-imports */
// Contoh backend Express.js untuk mengirim laporan ke Bot Telegram
// Install dependencies: npm install express cors dotenv

require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const BOT_TOKEN = process.env.API_KEY_TELEGRAM_LAPORAN_WEBSITE_BOT || process.env.TELEGRAM_BOT_TOKEN;
let TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";

app.post("/api/telegram-report", async (req, res) => {
  try {
    const { username, message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: "Pesan laporan wajib diisi." });
    }

    if (!BOT_TOKEN) {
      return res.status(500).json({ success: false, error: "Token Bot Telegram belum dikonfigurasi." });
    }

    // Tanggal WIB
    const now = new Date();
    const formattedDate = new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Asia/Jakarta",
    }).format(now) + " WIB";

    const reportText = `LAPORAN WEBSITE\n----------------------------------------\nUSERNAME : ${username || "Tamu"}\nPESAN : ${message.trim()}\nTANGGAL : ${formattedDate}`;

    // Cari chat_id otomatis jika belum diatur
    let targetChatId = TELEGRAM_CHAT_ID;
    if (!targetChatId) {
      try {
        const updateRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`);
        const updateData = await updateRes.json();
        if (updateData.ok && updateData.result.length > 0) {
          const lastUpdate = updateData.result[updateData.result.length - 1];
          targetChatId = lastUpdate.message?.chat?.id || lastUpdate.my_chat_member?.chat?.id || lastUpdate.channel_post?.chat?.id;
        }
      } catch (err) {
        console.warn("Gagal membaca getUpdates:", err);
      }
    }

    if (!targetChatId) {
      return res.status(400).json({
        success: false,
        error: "Chat ID Telegram belum ditemukan. Silakan tekan 'Start' di Bot Telegram terlebih dahulu.",
      });
    }

    // Kirim pesan
    const sendRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: targetChatId, text: reportText }),
    });

    const sendData = await sendRes.json();

    if (!sendData.ok) {
      return res.status(502).json({ success: false, error: sendData.description || "Gagal mengirim ke Telegram." });
    }

    return res.json({ success: true, message: "Laporan berhasil dikirim ke Bot Telegram." });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server Telegram Report berjalan di port ${PORT}`));
