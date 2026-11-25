# Product Requirements Document (PRD) — Prototipe

**Nama Produk (Dummy):** EcoRoute SBY

**Subjudul:** Sistem Perencanaan Infrastruktur Sampah, Eco-Routing Truk Cerdas, & Marketplace Sirkular Berbasis AI

**Versi Dokumen:** 2.0 (Final — Edisi Prototipe 3 Hari)

**Area Pilot Peta:** Koridor Keputih – Sukolilo – Rungkut (SIER) → TPA Benowo, Surabaya

**Target Waktu Pengerjaan:** 3 Hari (Tim 3 Orang)

**Tech Stack:** Next.js 15 (App Router, TypeScript, PWA) + Tailwind CSS + Shadcn UI + Zustand + React-Leaflet (OSM + OSRM API) + Google Gemini API (`gemini-2.5-flash`) + Recharts.
**Pembagian: Bagian 1 = Lutfan, 2 = Fakhri, 3 = Nino

---

## 1. Ringkasan Eksekutif & Konsep Inti Produk

**EcoRoute SBY** adalah aplikasi berbasis web dan *Progressive Web App* (PWA) yang menyatukan dua solusi persampahan perkotaan ke dalam satu alur terintegrasi, dilengkapi mesin perhitungan dan analisis *carbon footprint* otomatis:

1. **Jaringan Infrastruktur Sampah & Eco-Routing Truk (Pilar Utama):**
* Memetakan permukiman gang sempit yang tidak dapat dilalui truk serta menentukan titik lokasi **central tong sampah** berdasarkan radius jangkauan warga (150 meter).
* Memantau tingkat muatan (%) dan jenis fraksi sampah pada tiap titik tong menggunakan **camera detection AI** (*Google Gemini Vision*).
* Menghitung rute truk pengangkut sampah paling cepat sekaligus paling rendah emisi karbon (*multi-objective eco-routing*), serta memperbarui rute secara dinamis (*rerouting*) ketika terjadi gangguan jalan di peta (genangan air/banjir atau proyek perbaikan jalan).


2. **Bank Sampah & Marketplace Limbah Sirkular (Pilar Terhubung):**
* Menyalurkan sampah terpilah yang masih bernilai guna—baik hasil deteksi otomatis dari kamera tong maupun postingan limbah dari industri/masyarakat—kepada UMKM, pengrajin, atau industri lain yang membutuhkan.
* Menggunakan **AI Recommendation System**, **Geospatial Analysis** (kedekatan jarak antar-titik), dan **Optimization Algorithm** (penggabungan titik pengambilan) agar limbah cepat terserap dan tidak berakhir di TPA.


3. **Akuntansi & Analisis Carbon Footprint:**
* Menghitung secara otomatis dan *real-time* jejak karbon dari dua aktivitas utama: **proses pengelolaan sampah** (emisi TPA yang dihindari melalui daur ulang/marketplace) dan **armada angkutan** (penghematan BBM solar truk melalui *eco-routing*), lengkap dengan grafik analisis dan proyeksi skala Kota Surabaya.



---

## 2. Persona Pengguna & Alur Pengalaman (*User Flow*)

Untuk efisiensi prototipe 3 hari, seluruh fitur diakses dalam satu layar kerja terpadu (*Single-Page Workspace*) tanpa hambatan *login* berlapis, menggunakan pemilih peran (*Role Switcher*) di bagian atas layar:

1. **Perencana Tata Kota & Operator Dinas (Command Center):**
* Melihat peta sebaran gang sempit, menambah titik *central tong sampah* baru di area yang belum terjangkau, memasang simulasi gangguan jalan di peta, dan menjalankan perhitungan rute truk optimal.


2. **Petugas Lapangan / Pengelola Tong & Bank Sampah (Mobile PWA):**
* Memilih titik *central tong sampah*, mengambil/mengunggah foto isi tong untuk dideteksi AI, serta memantau status penuh tong.


3. **Pelaku Industri / UMKM Pembeli Limbah (Marketplace):**
* Memposting stok limbah yang tersedia atau memilih limbah rekomendasi terdekat dari peta untuk *di-take* (diambil) sebagai bahan baku daur ulang.


4. **Auditor Lingkungan / Pengambil Kebijakan:**
* Memantau dasbor *Carbon Footprint*, membandingkan emisi sebelum vs sesudah optimasi, dan menyalakan *toggle* proyeksi dampak skala Kota Surabaya (189 TPS).



---

## 3. Kontrak Teknis Bersama (*Single Source of Truth*)

Seluruh anggota tim wajib menggunakan struktur folder, penamaan variabel, tipe data TypeScript, dan *state* global yang sama persis di bawah ini agar kode dari 3 orang langsung menyatu tanpa konflik.

### 3.1. Struktur Folder & Kepemilikan File

```text
ecoroute-sby/
├── public/
│   ├── manifest.json                 # [Orang 3] Konfigurasi PWA (ikon, nama, tema)
│   └── samples/                      # [Orang 3] 4 foto sampel sampah untuk demo kamera AI
│       ├── sample-mixed-full.jpg     # Sampah tercampur penuh -> memicu ANGKUT_TPA
│       ├── sample-pet-clean.jpg      # Botol plastik PET bersih -> memicu LAYAK_MARKETPLACE
│       ├── sample-cardboard.jpg      # Tumpukan kardus kering -> memicu LAYAK_MARKETPLACE
│       └── sample-organic.jpg        # Sisa organik terpilah -> memicu LAYAK_MARKETPLACE
├── src/
│   ├── types/
│   │   └── ecoroute.ts               # [Shared] Kontrak tipe data utama
│   ├── store/
│   │   └── useEcoStore.ts            # [Shared] Zustand global state penghubung 3 modul
│   ├── data/
│   │   └── surabayaNodes.ts          # [Orang 3] Dataset koordinat asli Keputih–Rungkut–SIER
│   ├── lib/
│   │   ├── routing.ts                # [Orang 1] Logika OSRM API, eco-routing, & rerouting gangguan
│   │   ├── geospatial.ts             # [Orang 2] Rumus jarak Haversine & skor rekomendasi marketplace
│   │   └── carbonEngine.ts           # [Orang 3] Rumus perhitungan emisi truk & pengalihan sampah
│   ├── app/
│   │   ├── page.tsx                  # [Shared] Layout utama split-screen (Header + Map + Panel)
│   │   └── api/
│   │       └── detect-waste/
│   │           └── route.ts          # [Orang 2] Endpoint Google Gemini Vision API
│   └── components/
│       ├── map/                      # [Orang 1] Komponen Peta Leaflet, Marker, & Garis Rute
│       │   ├── EcoMap.tsx
│       │   └── RouteControlPanel.tsx
│       ├── camera/                   # [Orang 2] Modal Simulasi Camera Detection AI
│       │   └── CameraScanModal.tsx
│       ├── marketplace/              # [Orang 2] Daftar Marketplace & Rekomendasi Limbah
│       │   └── MarketplacePanel.tsx
│       └── carbon/                   # [Orang 3] Kartu KPI Karbon, Grafik, & Proyeksi Kota
│           └── CarbonDashboard.tsx

```

### 3.2. Kontrak Tipe Data (`src/types/ecoroute.ts`)

```typescript
export type NodeType = 'CENTRAL_BIN' | 'NARROW_ALLEY' | 'TPS' | 'INDUSTRY_BUYER' | 'TPA_BENOWO';

export type WasteCategory = 'ORGANIC' | 'PLASTIC_PET' | 'CARDBOARD' | 'MIXED_RESIDUAL';

export type BinStatus = 'GREEN' | 'YELLOW' | 'RED'; // GREEN <50%, YELLOW 50-74%, RED >=75%

export interface WasteNode {
  id: string;
  name: string;
  type: NodeType;
  district: string; // "Keputih", "Gebang", "Sukolilo", "Rungkut SIER", "Benowo"
  lat: number;
  lng: number;
  capacityKg: number;
  currentLoadKg: number;
  fillPercentage: number; // 0 - 100
  status: BinStatus;
  dominantWaste: WasteCategory;
  alleyRadiusMeter?: number; // Khusus NARROW_ALLEY (default: 150)
}

export interface RoadDisruption {
  id: string;
  title: string; // misal: "Genangan Air MERR" atau "Perbaikan Saluran Rungkut"
  lat: number;
  lng: number;
  radiusMeter: number;
  delayMinutes: number;
  isActive: boolean;
}

export interface RouteMetrics {
  mode: 'REGULAR' | 'ECO_OPTIMIZED';
  coordinates: [number, number][]; // Array [lat, lng] untuk Leaflet Polyline
  visitedNodeIds: string[];
  totalDistanceKm: number;
  estimatedDurationMin: number;
  totalPayloadKg: number;
  fuelConsumedLiter: number;
  carbonEmissionKg: number;
}

export interface MarketplaceItem {
  id: string;
  sourceNodeId: string;
  sourceName: string;
  lat: number;
  lng: number;
  wasteCategory: WasteCategory;
  title: string;
  weightKg: number;
  pricePerKg: number;
  status: 'AVAILABLE' | 'TAKEN';
  buyerId?: string;
  distanceKm?: number; // Dihitung dinamis terhadap pembeli aktif
  matchScore?: number; // Skor AI Recommendation (0 - 100)
}

export interface DetectionResult {
  wasteCategory: WasteCategory;
  fillPercentage: number;
  estimatedWeightKg: number;
  decision: 'ANGKUT_TPA' | 'LAYAK_MARKETPLACE';
  confidenceScore: number;
  aiNote: string;
}

export interface CarbonSummary {
  regularTruckEmissionKg: number;
  optimizedTruckEmissionKg: number;
  truckEmissionSavedKg: number;
  wasteDivertedKg: number;
  wasteEmissionAvoidedKg: number;
  totalCarbonSavedKg: number;
}

```

### 3.3. Kontrak Global State (`src/store/useEcoStore.ts`)

Seluruh komponen wajib membaca dan memodifikasi data melalui variabel dan fungsi *action* berikut:

* **State Variables:**
* `nodes: WasteNode[]` — Daftar titik infrastruktur di peta (diinisialisasi dari `surabayaNodes.ts`).
* `disruptions: RoadDisruption[]` — Daftar titik gangguan jalan aktif.
* `regularRoute: RouteMetrics | null` — Data rute konvensional (pembanding).
* `ecoRoute: RouteMetrics | null` — Data rute hasil optimasi karbon & waktu tempuh.
* `marketplaceItems: MarketplaceItem[]` — Daftar limbah di marketplace.
* `carbonSummary: CarbonSummary` — Rekap emisi karbon terkini.
* `isCityScaleMode: boolean` — Sakelar simulasi skala kecamatan vs skala penuh Kota Surabaya (faktor pengali 12,6× untuk merepresentasikan 189 TPS).


* **Standard Actions:**
* `addCentralBin(lat: number, lng: number, name: string)` → Menambahkan titik `CENTRAL_BIN` baru di peta dan mengecek jumlah `NARROW_ALLEY` dalam radius 150 meter.
* `toggleDisruption(lat: number, lng: number, title: string)` → Memasang atau menghapus gangguan jalan aktif pada peta.
* `applyCameraDetection(nodeId: string, result: DetectionResult)` → Memperbarui muatan tong; jika `result.decision === 'LAYAK_MARKETPLACE'`, otomatis membuat entri baru di `marketplaceItems` dan mengosongkan beban truk TPA pada tong tersebut.
* `setRoutes(regular: RouteMetrics, eco: RouteMetrics)` → Menyimpan kedua rute dan otomatis memanggil `calculateTruckEmission` untuk memperbarui `carbonSummary`.
* `addMarketplaceListing(item: Omit<MarketplaceItem, 'id' | 'status'>)` → Menambahkan postingan limbah baru dari industri/masyarakat.
* `takeMarketplaceItem(itemId: string, buyerId: string)` → Mengubah status item menjadi `TAKEN` dan menambahkan beratnya ke `wasteDivertedKg` serta `wasteEmissionAvoidedKg`.



---

## 4. Spesifikasi Detail Fitur & Modul

### Modul 1: Peta Infrastruktur, Gang Sempit, & Eco-Routing (`map/*`, `routing.ts`)

* **1.1. Visualisasi Tata Kota & Gang Sempit:**
* Peta berpusat di koordinat `-7.2892, 112.7945` (Koridor Keputih – Sukolilo – Rungkut SIER) dengan *zoom level* 14.
* Setiap titik `NARROW_ALLEY` digambar dengan lingkaran transparan beradius `150 meter` (*walkability buffer*). Jika di dalam radius tersebut terdapat `CENTRAL_BIN`, lingkaran berwarna hijau kebiruan (*Terlayani*); jika belum ada, lingkaran berwarna oranye (*Butuh Central Tong*).
* Pengguna dapat mengaktifkan mode **"Klik Peta: Tambah Central Tong"** untuk meletakkan titik tong baru dan melihat langsung perubahan status gang sempit di sekitarnya.


* **1.2. Algoritma Eco-Routing Truk (Multi-Objective):**
* **Filter Muatan Cerdas:** Sistem menyeleksi hanya node bertipe `CENTRAL_BIN` atau `TPS` dengan status `RED` (`fillPercentage >= 75`) sebagai titik penjemputan, lalu mengakhirinya di `TPA_BENOWO` (`-7.2134, 112.6345`).
* **Perbandingan Dua Rute:**
* `REGULAR`: Rute sekuensial melewati seluruh tong tanpa filter kepenuhan dan tanpa penghindaran kemacetan.
* `ECO_OPTIMIZED`: Urutan titik dioptimalkan berdasarkan jarak terdekat (*Nearest Neighbor + 2-opt heuristic*) menggunakan koordinat jalan asli dari **OSRM Public API** (`[https://router.project-osrm.org/route/v1/driving/](https://router.project-osrm.org/route/v1/driving/)...`), meminimalkan jarak tempuh dan konsumsi BBM saat truk bermuatan penuh.




* **1.3. Peta Gangguan Jalan Dinamis:**
* Pengguna dapat memilih preset gangguan jalan (misal: *Genangan Air Jl. Dr. Ir. H. Soekarno / MERR* atau *Galian Box Culvert Rungkut*) atau mengklik langsung pada garis rute truk.
* Saat gangguan aktif, fungsi di `routing.ts` menyisipkan titik pengalih (*detour waypoint*) di luar radius gangguan dan menghitung ulang jalur alternatif, lengkap dengan perbandingan selisih waktu tempuh dan emisi karbonnya.



### Modul 2: Camera Detection AI & Marketplace Limbah (`api/detect-waste`, `camera/*`, `marketplace/*`)

* **2.1. Simulasi Camera Detection (`POST /api/detect-waste`):**
* Menggunakan model **`gemini-2.5-flash`** dengan konfigurasi `responseMimeType: "application/json"`.
* Pengguna memilih node tong target, lalu mengunggah foto sendiri atau menekan 1-klik pada **4 foto sampel bawaan** (`sample-mixed-full.jpg`, `sample-pet-clean.jpg`, `sample-cardboard.jpg`, `sample-organic.jpg`).
* **Logika Smart Triage:**
* `PLASTIC_PET`, `CARDBOARD`, atau `ORGANIC` terpilah dengan muatan $\ge 50\%$ $\rightarrow$ `LAYAK_MARKETPLACE` (langsung terpublikasi ke tab Marketplace).
* `MIXED_RESIDUAL` $\rightarrow$ `ANGKUT_TPA` (jika muatan $\ge 75\%$, status tong berubah menjadi `RED` dan masuk daftar jemput truk).




* **2.2. Marketplace Limbah & AI Geospatial Recommendation:**
* Menampilkan daftar limbah yang siap diambil beserta jenis material, berat (kg), lokasi asal, dan estimasi nilai ekonomi (Rp).
* Pengguna memilih profil pembeli (misal: *PT Daur Ulang Plastik SIER*, *UMKM Kerajinan Kardus Rungkut*, atau *Budidaya Maggot BSF Wonorejo*).
* Sistem menghitung jarak menggunakan **Haversine Distance** (`geospatial.ts`) dan mengurutkan item berdasarkan **Skor Rekomendasi AI (`matchScore`)** tertinggi.
* Fitur **Konsolidasi Jemputan**: Jika pembeli memilih lebih dari 1 item limbah searah, sistem menampilkan total berat angkut dan estimasi penghematan jarak jemput.



### Modul 3: Perhitungan & Analisis Carbon Footprint (`carbonEngine.ts`, `CarbonDashboard.tsx`)

* **3.1. Formula Perhitungan Standar:**
* **Emisi Truk Sampah (`calculateTruckEmission`):**

$$\text{Emisi Truk (kg CO}_2) = \text{Jarak (km)} \times 0{,}35\text{ (L/km)} \times \left(1 + 0{,}15 \times \frac{\text{Muatan (kg)}}{5000}\right) \times 2{,}68\text{ (kg CO}_2/\text{L)}$$


* **Penghindaran Emisi Pengelolaan Sampah (`calculateWasteAvoidance`):**

$$\text{Emisi Dihindari (kg CO}_2\text{e)} = \text{Berat Sampah Teralihkan (kg)} \times 1{,}20\text{ (kg CO}_2\text{e/kg)}$$


* **Total Pengurangan Karbon Bersih:**

$$\text{Total Saved (kg CO}_2\text{e)} = (\text{Emisi Rute Reguler} - \text{Emisi Rute Eco}) + \text{Emisi Sampah Dihindari}$$




* **3.2. Visualisasi Analitik:**
* **Header Strip:** 3 kartu metrik langsung (*Emisi Truk Dihemat*, *Emisi Sampah Dihindari*, *Total Pengurangan $\text{CO}_2$*).
* **Tab Analisis Karbon:** Grafik batang (*Bar Chart*) membandingkan emisi *Baseline Konvensional* vs *EcoRoute SBY*, rincian kontribusi pengurangan emisi (sektor transportasi vs sektor limbah), dan sakelar **Proyeksi Skala Kota Surabaya (189 TPS)**.



---

## 5. Rincian Pembagian Tugas Tim (3 Orang × 3 Hari)

### Anggota 1: Lead Peta GIS, Gang Sempit, & Eco-Routing Truk

* **File Tanggung Jawab:** `src/components/map/EcoMap.tsx`, `src/components/map/RouteControlPanel.tsx`, `src/lib/routing.ts`.
* **Hari 1 (Setup & Visualisasi Peta):**
1. Inisialisasi proyek Next.js 15 + TypeScript + Tailwind + Shadcn UI + Zustand + `react-leaflet`.
2. Buat file kontrak bersama `src/types/ecoroute.ts` dan `src/store/useEcoStore.ts`.
3. Tampilkan peta OpenStreetMap koridor Keputih–Rungkut dengan marker kustom (`CENTRAL_BIN` Hijau/Kuning/Merah, lingkaran radius `NARROW_ALLEY` 150 m, `TPS`, dan `INDUSTRY_BUYER`).


* **Hari 2 (Algoritma Eco-Routing & OSRM):**
1. Buat fungsi `fetchOsrmRoute` dan `optimizeTruckRoute` di `src/lib/routing.ts` menggunakan OSRM Public API.
2. Bangun `RouteControlPanel.tsx` dengan tombol **"Hitung Rute Truk Optimal"** yang menggambar garis *Rute Reguler* (abu-abu putus-putus) dan *Rute Eco-Routing* (hijau solid) di peta.
3. Panggil `setRoutes()` di Zustand agar jarak, durasi, BBM, dan emisi langsung muncul di panel dan kartu header.


* **Hari 3 (Urban Planning Klik Peta & Gangguan Jalan):**
1. Implementasikan fitur klik di peta untuk **Tambah Central Tong Baru** lengkap dengan indikator berapa titik gang sempit di sekitarnya yang otomatis berubah status menjadi terlayani.
2. Implementasikan tombol/klik **Pasang Gangguan Jalan** yang memicu perhitungan ulang jalur truk (*rerouting*) secara otomatis saat ada titik banjir/proyek di lintasan truk.



### Anggota 2: Lead Google Gemini Vision & Marketplace Limbah

* **File Tanggung Jawab:** `src/app/api/detect-waste/route.ts`, `src/components/camera/CameraScanModal.tsx`, `src/components/marketplace/MarketplacePanel.tsx`, `src/lib/geospatial.ts`.
* **Hari 1 (Backend Gemini Vision API):**
1. Dapatkan API Key Google AI Studio (`GEMINI_API_KEY`) dan simpan di `.env.local`.
2. Buat endpoint `POST /api/detect-waste` menggunakan SDK `@google/genai` dengan model `gemini-2.5-flash` dan skema *structured JSON output*.
3. Uji endpoint dengan 4 foto sampel dari Anggota 3 untuk memastikan klasifikasi jenis sampah, persentase penuh, dan keputusan (`ANGKUT_TPA` vs `LAYAK_MARKETPLACE`) konsisten.


* **Hari 2 (UI Camera Detection & Marketplace):**
1. Bangun `CameraScanModal.tsx` dengan pilihan tong target, tombol *upload* foto, dan tombol cepat pilih 4 foto sampel demo.
2. Sambungkan hasil AI ke `applyCameraDetection()` di Zustand sehingga tong yang terdeteksi `LAYAK_MARKETPLACE` otomatis muncul di daftar marketplace.
3. Bangun `MarketplacePanel.tsx` yang menampilkan daftar limbah tersedia beserta form tambah postingan limbah manual dari industri/warga.


* **Hari 3 (AI Geospatial Matching & Transaksi Take Limbah):**
1. Buat fungsi `haversineDistanceKm` dan `calculateMatchScore` di `src/lib/geospatial.ts`.
2. Tambahkan dropdown pilihan pembeli industri di `MarketplacePanel.tsx` yang otomatis mengurutkan daftar limbah berdasarkan jarak terdekat dan skor kecocokan AI.
3. Aktifkan tombol **"Take Limbah"** yang memanggil `takeMarketplaceItem()` dan memperbarui metrik pengurangan karbon secara langsung.



### Anggota 3: Lead Carbon Engine, Dataset Surabaya, & PWA Polishing

* **File Tanggung Jawab:** `src/data/surabayaNodes.ts`, `src/lib/carbonEngine.ts`, `src/components/carbon/CarbonDashboard.tsx`, `src/app/page.tsx`, `public/manifest.json`.
* **Hari 1 (Dataset Koordinat Surabaya & Mesin Karbon):**
1. Kumpulkan 15–20 titik koordinat GPS nyata di sekitar Keputih, Gebang, MERR, dan Rungkut SIER beserta koordinat TPA Benowo ke dalam `src/data/surabayaNodes.ts`.
2. Siapkan 4 foto sampel sampah yang jelas di folder `public/samples/`.
3. Tulis fungsi perhitungan emisi truk (`calculateTruckEmission`) dan pengalihan sampah (`calculateWasteAvoidance`) di `src/lib/carbonEngine.ts`.


* **Hari 2 (Dasbor Analisis Karbon & Layout Utama):**
1. Rakit layout utama `src/app/page.tsx` (Header + 3 Kartu KPI Karbon + Split View Peta & Tab Panel).
2. Bangun `CarbonDashboard.tsx` berisi grafik batang perbandingan emisi (Konvensional vs EcoRoute SBY) menggunakan Recharts dan rincian kontribusi emisi sektor angkutan vs pengolahan sampah.
3. Tambahkan sakelar **"Proyeksi Skala Kota Surabaya (189 TPS)"** di header/dasbor.


* **Hari 3 (Konfigurasi PWA, Responsivitas Mobile, & Simulasi Demo):**
1. Tambahkan `public/manifest.json`, ikon aplikasi, dan meta tag PWA agar prototipe dapat dipasang di layar ponsel (*mobile view*) sebagai simulasi aplikasi petugas lapangan.
2. Lakukan pengujian integrasi penuh (*end-to-end*) bersama Anggota 1 dan 2, perbaiki bug tampilan responsif, dan siapkan urutan skenario demo 5 menit.



---

## 6. Skenario Uji Coba & Demo Presentasi (5 Menit)

Seluruh tim melakukan simulasi 4 tahap berikut sebelum presentasi di hadapan juri:

1. **Tahap 1 — Perencanaan Infrastruktur Gang Sempit (1 Menit):**
* Tampilkan peta Keputih–Rungkut yang memperlihatkan area gang sempit dengan lingkaran oranye (belum terjangkau tong). Klik lokasi strategis di peta untuk menambahkan **Central Tong Sampah Baru** dan tunjukkan bahwa lingkaran gang sempit di radius 150 m langsung berubah hijau (terlayani).


2. **Tahap 2 — Camera Detection AI & Marketplace Sirkular (1,5 Menit):**
* Buka **Scan Kamera Tong** pada salah satu tong di Keputih, pilih sampel foto botol plastik PET (`sample-pet-clean.jpg`). Tunjukkan Gemini AI mendeteksi `PLASTIC_PET (82%)` dan otomatis memasukkannya ke **Marketplace Limbah**. Pindah ke tab Marketplace, pilih pembeli industri di Rungkut SIER, lihat urutan rekomendasi jarak terdekat, lalu klik **Take Limbah**.


3. **Tahap 3 — Eco-Routing Truk & Penghindaran Gangguan Jalan (1,5 Menit):**
* Buka tab **Eco-Routing & Jalan**, klik **Hitung Rute Truk Optimal**. Tunjukkan perbandingan rute reguler vs rute cerdas yang hanya menjemput tong berstatus Merah beserta penghematan solar dan $\text{kg CO}_2$-nya. Kemudian aktifkan **Gangguan Jalan (Genangan Air MERR)** dan perlihatkan garis rute truk otomatis berbelok mencari jalur alternatif tercepat.


4. **Tahap 4 — Analisis Carbon Footprint & Dampak Kota (1 Menit):**
* Buka tab **Analisis Karbon** untuk memaparkan grafik penurunan emisi gabungan dari sektor angkutan dan pengelolaan sampah, lalu aktifkan *toggle* **Proyeksi Skala Kota Surabaya (189 TPS)** untuk menunjukkan potensi dampak nyata apabila diterapkan di seluruh kota.
