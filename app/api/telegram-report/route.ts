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
          error: "Token Bot Telegram belum dikonfigurasi di server (.env).",
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

    // Format pesan persis sesuai instruksi user (simple, tanpa emot, hanya pemisah)
    const reportText = `LAPORAN WEBSITE
----------------------------------------
USERNAME : ${username || "Tamu"}
PESAN : ${message.trim()}
TANGGAL : ${formattedDate}`;

    // Cari chat_id penerima
    let targetChatId =
      process.env.TELEGRAM_CHAT_ID ||
      process.env.TELEGRAM_ADMIN_CHAT_ID ||
      "";

    // Jika targetChatId belum ada di env, coba ambil dari getUpdates bot secara otomatis
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
            // Ambil chat_id dari update pesan terbaru
            const lastUpdate =
              updatesData.result[updatesData.result.length - 1];
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
          botUsername: "Laporan_Website_Bot",
          error:
            "Bot belum terhubung ke akun Telegram Anda. Silakan klik tombol 'Aktifkan Bot' di bawah ini lalu tekan 'Start' di Telegram agar bot tahu ke mana laporan harus dikirimkan.",
        },
        { status: 400 }
      );
    }

    // Kirim pesan ke Telegram
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
          error:
            sendData.description || "Gagal mengirim pesan ke Bot Telegram.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Laporan berhasil dikirim melalui Bot Telegram.",
    });
  } catch (error: unknown) {
    console.error("Error mengirim laporan Telegram:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan internal pada server.";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
