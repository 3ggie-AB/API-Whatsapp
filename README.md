# Synt-API WhatsWebJS

Proyek ini menyediakan API untuk mengirim pesan melalui WhatsApp, dibangun menggunakan Node.js dan library `whatsapp-web.js`.

## Fitur :

- Kirim pesan WhatsApp ke satu atau beberapa nomor.
- Jadwalkan pesan untuk dikirim pada waktu tertentu.
- Otentikasi berbasis token untuk akses yang aman.
- Menangani beberapa nomor telepon WhatsApp.
- Operasi CRUD untuk mengelola pengguna dan token.

## Prasyarat

Pastikan Anda telah menginstal yang berikut ini:

- [Node.js](https://nodejs.org/) (versi 20 atau lebih tinggi)
- [npm](https://www.npmjs.com/)
- POSTMAN / ThunderClient (Ekstensi Vscode) sebagai alat untuk mengirim request.

## Instalasi

1. Clone repositori:
   ```bash
   git clone https://github.com/3ggie-AB/API-Whatsapp.git
   ```

2. Masuk ke direktori proyek:
   ```bash
   cd API-Whatsapp
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Atur variabel lingkungan:
   Buat file `.env` di direktori root dan tambahkan:

   ```bash
   PORT=3000
   WHATSAPP_TOKEN=your_token_here
   ```

   Ganti `your_token_here` dengan token untuk autentikasi. Token ini Bebas Sesuai Keinginan Anda, Ketika Anda Hit API nya anda harus Mengirim Request Token yang Isinya di dalam .env.
   Fungsinya Untuk Membandingkan token dari Request dan .env, Jika Sama maka Validasi Berhasil.

## Penggunaan

1. Jalankan aplikasi:
   ```bash
   npm start
   ```

2. Buka browser Anda dan navigasikan ke:
   ```bash
   http://localhost:3000
   ```

3. Pindai kode QR di file whatsapp-qr.png menggunakan akun WhatsApp Anda untuk terhubung.

## Beberapa Contoh Penggunaan API

### 1. Kirim Pesan

**Endpoint:**
```http
POST /send
```

**Request Body:**
```json
{
  "pesan": "Pesan Anda",
  "nomor": ["628xxxxxxxxxx", "628xxxxxxxxxx"],
  "token": "your_token_here"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Pesan berhasil dikirim"
}
```
### 2. Cek Status Koneksi

**Endpoint:**
```http
GET /status
```

**Response:**
```json
{
  "status": "connected",
  "message": "WhatsApp terhubung"
}
```

### 3. Login dan Registrasi

**Endpoint:**
```http
POST /login
```

**Request Body:**
```json
{
  "username": "nama_pengguna_anda",
  "password": "kata_sandi_anda"
}
```

**Response:**
```json
{
  "status": "success",
  "token": "token_yang_digenerate"
}
```

## Autentikasi Berbasis Token

Setiap permintaan ke API memerlukan token yang valid. Token dikirimkan dalam body request sebagai `token`. Pastikan Anda menyertakan token ini dalam setiap permintaan untuk mengautentikasi panggilan API.

## Pencatatan (Logging)

Log dihasilkan untuk melacak status pesan yang dikirim dan dijadwalkan, serta acara lain seperti koneksi dan kesalahan. Log dapat ditemukan di terminal atau di direktori log.

## Pemecahan Masalah

- **Masalah Koneksi**: Pastikan WhatsApp Web tidak sedang dibuka di browser atau perangkat lain. Anda hanya dapat memiliki satu sesi aktif pada satu waktu.
- **Kegagalan Pengiriman Pesan**: Periksa apakah nomor telepon dalam format yang benar (`628xxxxxxxxxx` untuk Indonesia).
- **Kesalahan Autentikasi**: Pastikan Anda mengirim token yang benar dalam body permintaan API.

## Lisensi

Proyek ini dilisensikan di bawah Lisensi MIT. Lihat file [LICENSE](LICENSE) untuk detail lebih lanjut.
