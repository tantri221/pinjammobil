# PinjamMobil - Sistem Peminjaman Kendaraan Operasional

Aplikasi manajemen dan peminjaman unit kendaraan operasional kantor dengan arsitektur **modular**, tampilan antarmuka modern & minimalis bertema **shadcn/ui**, dan siap dihubungkan ke database cloud **Supabase**.

---

## 🚀 Fitur Utama

- **Desain Bersih & Elegan (Shadcn UI Style):** Menggunakan palet netral (zinc/slate), kartu informasi unit yang rapi, dan indikator status yang jelas.
- **Arsitektur Modular:** Kode terorganisir rapi ke dalam komponen atomik (`components/ui`), modul fitur (`VehicleCard`, `VehicleGrid`, `LoanHistoryTable`, dll.), dan service layer (`services/api.js`).
- **Integrasi Supabase Otomatis:**
  - Siap dihubungkan ke PostgreSQL & Supabase API.
  - Skema database instan tersedia di file `supabase-schema.sql`.
  - Dilengkapi fitur **Fallback Demo Lokal** (`localStorage`): aplikasi langsung bisa berjalan dan dicoba bahkan sebelum Supabase dikonfigurasi.
- **Siap Deploy ke Vercel:** Konfigurasi Vite standar yang langsung di-build otomatis oleh Vercel tanpa perlu pengaturan rumit.

---

## 📁 Struktur Folder Modular

```text
pinjammobil/
├── src/
│   ├── components/
│   │   ├── ui/                       # Komponen antarmuka atomik
│   │   │   ├── Button.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Input.jsx
│   │   │   └── Modal.jsx
│   │   ├── Navbar.jsx                # Navigasi & indikator status Supabase
│   │   ├── StatsCards.jsx            # Ringkasan statistik armada
│   │   ├── VehicleCard.jsx           # Kartu detail unit mobil & level BBM
│   │   ├── VehicleGrid.jsx           # Katalog & filter pencarian unit
│   │   ├── LoanFormModal.jsx         # Formulir peminjaman kendaraan
│   │   ├── LoanHistoryTable.jsx      # Riwayat & aksi pengembalian unit
│   │   └── SupabaseSettingsModal.jsx # Pengaturan koneksi Supabase di browser
│   ├── data/
│   │   └── defaultData.js            # Data awal armada & peminjaman (demo)
│   ├── lib/
│   │   ├── supabase.js               # Inisialisasi Supabase Client
│   │   └── utils.js                  # Helper utilitas classnames (cn)
│   ├── services/
│   │   └── api.js                    # Layer CRUD (Supabase / LocalStorage)
│   ├── App.jsx                       # Halaman utama aplikasi
│   ├── main.jsx                      # Entry point React
│   └── index.css                     # Token warna & styling Tailwind CSS
├── supabase-schema.sql               # Script SQL tabel Supabase
├── vite.config.js
├── tailwind.config.js
├── package.json
└── README.md
```

---

## 🛠️ Cara Menjalankan di Komputer Lokal

1. **Pastikan Node.js terinstall:**
   Download installer Node.js (LTS) dari [nodejs.org](https://nodejs.org/).

2. **Install Dependensi:**
   ```bash
   npm install
   ```

3. **Jalankan Server Development:**
   ```bash
   npm run dev
   ```
   Buka alamat yang tampil di terminal (biasanya `http://localhost:5173`).

---

## 🗄️ Menghubungkan ke Database Supabase

1. Buat proyek baru di [Supabase](https://supabase.com/).
2. Buka menu **SQL Editor**, salin seluruh isi file [`supabase-schema.sql`](./supabase-schema.sql), lalu klik tombol **Run**.
3. Buka menu **Project Settings → API** di dashboard Supabase.
4. Ada 2 cara menghubungkan:
   - **Cara 1 (Langsung dari Web):** Klik tombol status database di pojok kanan atas aplikasi, lalu masukkan Project URL & Anon Key Anda.
   - **Cara 2 (File .env):** Buat file `.env` di root folder proyek:
     ```env
     VITE_SUPABASE_URL=https://proyek-anda.supabase.co
     VITE_SUPABASE_ANON_KEY=kunci-anon-anda
     ```

---

## 🌐 Deploy Gratis ke Vercel

1. Push proyek ini ke repositori GitHub Anda:
   ```bash
   git add .
   git commit -m "feat: migrate to modular react vite with shadcn ui"
   git push origin main
   ```
2. Buka [Vercel](https://vercel.com/) dan login menggunakan akun GitHub Anda.
3. Klik **Add New... → Project**, pilih repositori `pinjammobil`.
4. Pada bagian **Environment Variables**, tambahkan:
   - `VITE_SUPABASE_URL` : URL proyek Supabase Anda
   - `VITE_SUPABASE_ANON_KEY` : Kunci anon publik Supabase Anda
5. Klik **Deploy**! Website Anda akan aktif online 24 jam dengan domain gratis `.vercel.app`.
