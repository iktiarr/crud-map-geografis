import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, message } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { success: false, error: "Pesan laporan wajib diisi." },
        { status: 400 }
      );
    }

    const botToken =
      process.env.API_KEY_TELEGRAM_LAPORAN_WEBSITE_BOT ||
      process.env.TELEGRAM_BOT_TOKEN ||
      "";

    if (!botToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Token Bot Telegram belum dikonfigurasi di file .env.",
        },
        { status: 500 }
      );
    }

    // Format tanggal Indonesia lengkap dengan Hari, Tanggal, dan Jam WIB
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

    // Format pesan sesuai template sederhana
    const reportText = `LAPORAN WEBSITE
----------------------------------------
USERNAME : ${username || "Tamu"}
PESAN : ${message.trim()}
TANGGAL : ${formattedDate}`;

    // Cari target chat_id penerima
    let targetChatId =
      process.env.TELEGRAM_CHAT_ID ||
      process.env.TELEGRAM_ADMIN_CHAT_ID ||
      "";

    // Jika belum diset di .env, ambil otomatis dari getUpdates Telegram
    if (!targetChatId) {
      try {
        const getUpdatesRes = await fetch(
          `https://api.telegram.org/bot${botToken}/getUpdates`,
          { cache: "no-store" }
        );
        if (getUpdatesRes.ok) {
          const updatesData = await getUpdatesRes.json();
          if (
            updatesData.ok &&
            Array.isArray(updatesData.result) &&
            updatesData.result.length > 0
          ) {
            const lastUpdate = updatesData.result[updatesData.result.length - 1];
            const foundChatId =
              lastUpdate.message?.chat?.id ||
              lastUpdate.my_chat_member?.chat?.id ||
              lastUpdate.channel_post?.chat?.id;

            if (foundChatId) {
              targetChatId = String(foundChatId);
            }
          }
        }
      } catch (fetchUpdateErr) {
        console.warn("Gagal fetch getUpdates telegram:", fetchUpdateErr);
      }
    }

    if (!targetChatId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Chat ID Telegram belum ditemukan. Silakan buka Bot Telegram Anda lalu tekan 'Start' agar bot dapat mendeteksi chat ID tujuan.",
        },
        { status: 400 }
      );
    }

    // Kirim pesan ke API Telegram
    const sendRes = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: targetChatId,
          text: reportText,
        }),
      }
    );

    const sendData = await sendRes.json();

    if (!sendRes.ok || !sendData.ok) {
      return NextResponse.json(
        {
          success: false,
          error: sendData.description || "Gagal mengirim pesan ke Bot Telegram.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Laporan berhasil dikirim ke Bot Telegram.",
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Terjadi kesalahan server internal.";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
