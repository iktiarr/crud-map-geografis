# 📦 Modul Laporan Website ke Bot Telegram (Reusable Template)

Paket modul ini siap disalin (*copy-paste*) ke berbagai website dan aplikasi web Anda agar fitur pelaporan pengguna konsisten dan langsung masuk ke Bot Telegram.

---

## 📁 Struktur Folder Template

```text
templates/telegram-report/
├── .env.example                               # Contoh konfigurasi Token & Chat ID
├── nextjs-app-router/                         # Untuk Next.js 13/14/15/16 (App Router)
│   └── api/telegram-report/route.ts
├── react-component/                           # Komponen React / Next.js / Vite
│   └── TelegramReportForm.tsx
├── nodejs-express/                            # Backend alternatif untuk Node.js / Express
│   └── server.js
├── vanilla-html/                              # Frontend alternatif untuk HTML/JS statis
│   └── telegram-report.html
└── README.md                                  # Panduan penggunaan ini
```

---

## 🚀 Cara Pemasangan di Website Lain

### 1. Konfigurasi File `.env`
Tambahkan baris berikut di file `.env` proyek Anda:

```env
# Token Bot Telegram Anda (dari BotFather)
API_KEY_TELEGRAM_LAPORAN_WEBSITE_BOT="8726128165:AAGFT9BbuF5kQEK5uTwyGD8lGnvFgvV0P8k"

# (Opsional) Chat ID penerima / ID Grup Telegram tempat laporan masuk
# Jika dikosongkan, bot akan otomatis mendeteksi chat ID dari yang mengirim /start ke bot
TELEGRAM_CHAT_ID=""
```

---

### 2. Pemasangan di Proyek Next.js (App Router)

1. Salin file `nextjs-app-router/api/telegram-report/route.ts` ke folder:
   `app/api/telegram-report/route.ts` di proyek baru Anda.
2. Salin komponen `react-component/TelegramReportForm.tsx` ke folder `components/` proyek Anda.
3. Pasang komponen di halaman atau modal manapun:

```tsx
import TelegramReportForm from "@/components/TelegramReportForm";

export default function LaporanPage() {
  return (
    <div className="max-w-md mx-auto p-4">
      <TelegramReportForm username="danidani" />
    </div>
  );
}
```

---

### 3. Pemasangan di Proyek Node.js Express & HTML Statis

- Backend: Jalankan kode dari `nodejs-express/server.js`.
- Frontend: Gunakan `vanilla-html/telegram-report.html` atau sesuaikan endpoint fetch ke `http://localhost:3001/api/telegram-report`.

---

## 📝 Format Pesan yang Diterima di Telegram

```text
LAPORAN WEBSITE
----------------------------------------
USERNAME : danidani
PESAN : Tombol navigasi rute tidak merespon di perangkat mobile.
TANGGAL : Selasa, 6 Oktober 2026 11:21:00 WIB
```

---

## 💡 Tips & Catatan Penting:
1. Pastikan Anda sudah membuka bot **[@Laporan_Website_Bot](https://t.me/Laporan_Website_Bot)** dan menekan tombol **START** minimal 1 kali agar bot memiliki izin untuk mengirimkan pesan ke akun Anda.
2. Jika ingin laporan masuk ke **Grup Telegram Admin**, tambahkan bot tersebut ke grup dan masukkan ID grup (misal `-100xxxxxxxxxx`) pada variabel `TELEGRAM_CHAT_ID` di file `.env`.
