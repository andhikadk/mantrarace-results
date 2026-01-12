# MantraRace – Race Results System Plan

## 1. Tujuan Utama

Membangun platform race results berbasis domain:

results.mantrarace.com/{eventSlug}  
contoh: results.mantrarace.com/lelono

Platform ini:
- Tidak menyimpan data peserta
- Tidak melakukan sinkronisasi data ke database
- Langsung fetch data dari API timing system (RaceResult, dll)
- Database hanya menyimpan konfigurasi (event, kategori, checkpoint, sertifikat)

Prinsip utama:
> Laravel berperan sebagai proxy + mapping layer, bukan data warehouse.

---

## 2. Arsitektur Dasar

Flow utama:

User  
→ results.mantrarace.com/{eventSlug}  
→ Laravel + Inertia (React)  
→ fetch ke endpoint API timing system per kategori  
→ mapping checkpoint + field  
→ render leaderboard / sertifikat

Source of truth tetap di timing system.

---

## 3. Struktur Data yang Disimpan (Database)

### 3.1 events

Menyimpan data event utama.

Field:
- id
- title
- slug
- start_date
- end_date
- location
- timestamps

---

### 3.2 categories

Setiap event memiliki banyak kategori.  
Setiap kategori memiliki endpoint API sendiri.

Field:
- id
- event_id (FK)
- name (contoh: 55K)
- slug (contoh: 55k)
- endpoint_url (API timing system untuk kategori ini)
- timestamps

Relasi:
events 1 --- N categories

---

### 3.3 checkpoints

Mapping urutan checkpoint per kategori.  
Setiap kategori bisa punya urutan dan jumlah checkpoint berbeda.

Field:
- id
- category_id (FK)
- order_index (1,2,3,...)
- name (Seruk 1, Gravity Park 1, dst)
- time_field (exact key dari API, contoh: "Seruk 1")
- segment_field (contoh: "Segment 1")
- overall_rank_field (contoh: "Rank C1")
- gender_rank_field (contoh: "Rank C1 MF")
- timestamps

Relasi:
categories 1 --- N checkpoints

Catatan:
order_index dipakai untuk urutan tampil, bukan nama.

---

### 3.4 certificates

Konfigurasi sertifikat per kategori.

Field:
- id
- category_id (FK)
- template_path (path ke PDF polosan)
- enabled (boolean)
- timestamps

Relasi:
categories 1 --- 1 certificates

---

## 4. Data yang Dipakai dari API Timing System

Contoh field inti peserta yang dipakai:

- Overall Rank  
- Gender Rank  
- GENDER  
- Nation
- BIB  
- Name  
- Finish Time  
- NetTime  
- Gap  
- Status  

Checkpoint:
- kolom seperti: "Seruk 1", "Gravity Park 1", "POS 3 Buthak 1", dst
- Segment = waktu antar checkpoint
- Rank / Rank MF = rank di checkpoint tersebut

Field seperti:
if([SeedFinishRank]>0;[SeedSpeed];"")

→ diabaikan, tidak dipakai.

---

## 5. Flow Halaman

### 5.1 Event Results Page (Single Entry Point)

URL:
/{eventSlug}

Contoh:
results.mantrarace.com/lelono

Perilaku:
- Halaman ini adalah **satu-satunya entry point** untuk melihat hasil race.
- Saat halaman dibuka:
  - Sistem **langsung menampilkan leaderboard kategori pertama (default)**.
  - Daftar kategori ditampilkan sebagai tab / dropdown / selector.
- Ketika user pindah kategori:
  - **URL tetap sama** (/{eventSlug})
  - Tidak ada navigasi ke route lain
  - Data leaderboard diganti via state (Inertia / React)
  - Tidak terjadi full page reload

Flow:
- Laravel resolve event berdasarkan slug
- Ambil semua categories milik event
- Tentukan kategori pertama sebagai default
- Fetch endpoint kategori default ke timing system
- Mapping checkpoint sesuai konfigurasi
- Render leaderboard
- Saat user klik kategori lain:
  - Frontend request data kategori tersebut (AJAX / Inertia visit)
  - Backend fetch endpoint kategori baru
  - Mapping ulang checkpoint
  - Update leaderboard di halaman yang sama

Catatan:
Halaman /{eventSlug} berfungsi sebagai:
- landing page event
- container multi-kategori leaderboard
- pusat navigasi hasil race

---

### 5.2 Sertifikat Digital

URL:
/{eventSlug}/categories/{categorySlug}/certificate/{bib}

Contoh:
results.mantrarace.com/lelono/categories/55k/certificate/23

Perilaku:
- Halaman ini **tidak menggunakan Inertia page**
- Langsung return response `application/pdf`
- Browser langsung menampilkan / download sertifikat

Flow:
- Laravel resolve event + category
- Ambil template_path dari table certificates
- Fetch data ke API timing system (endpoint kategori)
- Cari peserta berdasarkan BIB
- Inject data ke PDF template
- Stream PDF ke browser

Tidak ada penyimpanan data peserta di database.

---

## 6. Teknologi & Stack

- Backend: Laravel (modern, 2026-ready)
- Frontend: Inertia + React
- PDF: template polosan + overlay text
- Data: live fetch dari API timing system
- Cache: optional (per kategori, TTL pendek)

---

## 7. Prinsip Desain (yang dipegang)

- Tidak menyimpan data peserta
- Tidak membuat table results / participants
- Tidak melakukan sinkronisasi data
- Config-driven (event, category, checkpoint)
- Multi event, multi kategori, fleksibel
- Real-time, source of truth = timing system
- Tidak overengineering

---

## 8. Struktur Relasi Akhir

events  
└── categories  
    ├── checkpoints  
    └── certificates  

---

## 9. Status Implementasi Saat Ini

Sudah:
- Database design
- Migration
- Models
- Controller skeleton (Inertia-ready)

Belum:
- RaceResultService (fetch + mapping)
- UI React leaderboard
- PDF certificate generator

---

## 10. Kesimpulan

Arsitektur ini:
- sederhana
- scalable
- sesuai real workflow event & timing system
- tidak menyimpan data yang tidak perlu
- tidak menciptakan kompleksitas buatan

Ini desain yang tepat untuk race results platform berbasis event seperti MantraRace.
