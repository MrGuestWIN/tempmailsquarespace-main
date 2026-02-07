# Tutorial Lengkap: Deploy Temp Mail di VPS

Panduan step-by-step dari nol sampai aplikasi Temp Mail jalan di VPS (Ubuntu/Debian), pakai **PuTTY** + **FileZilla**.

---

## Workflow: Push dari laptop, deploy lewat PuTTY di RDP

Kalau SSH di laptop diblokir tapi di RDP bisa:

1. **Di laptop:** pasang **Git** (lihat bawah), push project ke GitHub/GitLab dari sini.
2. **Di RDP:** buka **PuTTY** → SSH ke VPS → `git clone ...` → jalankan `deploy-on-vps.sh`.

---

## Install Git di laptop (Windows)

Supaya bisa `git push` dari laptop:

1. **Download Git for Windows:**  
   https://git-scm.com/download/win  
   (pilih **64-bit Git for Windows Setup**)
2. **Jalankan installer** → Next sampai selesai (default boleh semua).
3. **Cek:** buka **PowerShell** atau **CMD**, ketik:
   ```bash
   git --version
   ```
   Kalau muncul versi (mis. `git version 2.43.0`), Git sudah terpasang.
4. **Set nama & email (sekali saja):**
   ```bash
   git config --global user.name "Nama Anda"
   git config --global user.email "email@anda.com"
   ```
5. **Push ke GitHub/GitLab:**  
   Buat repo di GitHub/GitLab (kosong), lalu di folder project di laptop:
   ```bash
   git init
   git remote add origin https://github.com/USERNAME/REPO.git
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git push -u origin main
   ```
   (Ganti `USERNAME/REPO` dengan repo Anda. Kalau pakai GitLab, ganti URL-nya.)

**Di RDP (PuTTY ke VPS):** clone repo lalu deploy:

```bash
cd /root
git clone https://github.com/USERNAME/REPO.git tempmail
cd tempmail
chmod +x deploy-on-vps.sh
bash deploy-on-vps.sh
nano backend/.env   # edit lalu simpan
pm2 restart tempmail
ufw allow 22 && ufw allow 3001 && ufw allow 80 && ufw --force enable
```

Lalu akses **http://IP-VPS:3001**.

---

## Yang perlu disiapkan

| Item | Keterangan |
|------|------------|
| **VPS** | Sudah punya VPS Ubuntu/Debian (contoh: DigitalOcean, Vultr, dll.) |
| **IP VPS** | Contoh: `157.245.56.220` (ganti dengan IP Anda) |
| **User & password** | Biasanya `root` + password dari provider (simpan di `vps.txt`, jangan di-commit) |
| **PuTTY** | [Download PuTTY](https://www.putty.org/) – untuk SSH ke VPS |
| **FileZilla** | [Download FileZilla](https://filezilla-project.org/) – untuk upload file ke VPS |
| **Folder project** | Folder `tempmailsquarespace-main` (backend + frontend) di komputer Anda |

---

## Langkah 1: Upload project ke VPS dengan FileZilla

1. **Buka FileZilla.**
2. **Koneksi SFTP:**
   - **Host:** `sftp://157.245.56.220` (ganti dengan IP VPS Anda)
   - **Username:** `root`
   - **Password:** (isi dari `vps.txt`)
   - **Port:** `22`
   - Klik **Quickconnect**.
3. **Sisi kiri (Local):** masuk ke folder project Anda, misalnya:
   ```
   C:\Users\...\Downloads\KaryaILMIAH\tempmailsquarespace-main
   ```
   Pastikan isinya ada folder `backend`, `frontend`, dan file `deploy-on-vps.sh`.
4. **Sisi kanan (Remote):** pastikan Anda di folder `/root`.
5. **Upload:**  
   - Jika di `/root` sudah ada folder lama (misalnya `tempmailsquarespace`), bisa rename dulu jadi `lama` atau hapus.  
   - Drag seluruh isi folder project (backend, frontend, deploy-on-vps.sh, dll.) ke panel kanan ke dalam `/root`, atau buat satu folder misalnya `/root/tempmail` lalu upload ke dalamnya.
6. Tunggu sampai semua file selesai ter-upload (bisa banyak file, terutama di `frontend/node_modules` kalau ikut ter-upload – idealnya upload **tanpa** `node_modules` supaya cepat; script deploy akan `npm install` di VPS).

**Tip:** Kalau mau lebih rapi, di remote buat folder `/root/tempmail`, lalu upload semua isi project ke `/root/tempmail/` (jadi di VPS nanti ada `/root/tempmail/backend`, `/root/tempmail/frontend`, `/root/tempmail/deploy-on-vps.sh`).

---

## Langkah 2: SSH ke VPS dengan PuTTY

1. **Buka PuTTY.**
2. **Session:**
   - **Host Name:** `157.245.56.220` (ganti dengan IP VPS Anda)
   - **Port:** `22`
   - **Connection type:** SSH
   - (Opsional) Save session supaya next time tinggal double-click.
3. Klik **Open**.
4. **Login:**  
   - `login as:` ketik **root** lalu Enter.  
   - `password:` paste/ketik password dari `vps.txt` (di PuTTY tidak akan terlihat saat diketik), lalu Enter.
5. Kalau berhasil, Anda akan melihat prompt seperti `root@namaserver:~#`. Artinya Anda sudah masuk ke VPS.

---

## Langkah 3: Pasang Git (kalau belum)

Di jendela PuTTY (sudah login root), jalankan:

```bash
apt-get update && apt-get install -y git
```

Kalau Git sudah ada, perintah ini tidak masalah (hanya update). Lanjut ke langkah 4.

---

## Langkah 4: Masuk ke folder project dan jalankan script deploy

1. **Masuk ke folder project.**  
   Sesuaikan dengan cara upload Anda:
   - Kalau upload ke `/root/tempmail`:
     ```bash
     cd /root/tempmail
     ```
   - Kalau upload langsung ke `/root` dan nama folder sama dengan di PC (misalnya `tempmailsquarespace-main`):
     ```bash
     cd /root/tempmailsquarespace-main
     ```

2. **Cek isi folder:**
   ```bash
   ls -la
   ```
   Harus terlihat `backend`, `frontend`, dan `deploy-on-vps.sh`.

3. **Jalankan script deploy:**
   ```bash
   chmod +x deploy-on-vps.sh
   bash deploy-on-vps.sh
   ```
   Script akan: pasang Node.js 20 (jika belum), install dependency backend & frontend, build frontend, buat `backend/.env` dari example jika belum ada, pasang PM2, dan menjalankan app. Tunggu sampai selesai (bisa beberapa menit).

4. Kalau ada error, baca pesannya. Biasanya masalah path atau permission; pastikan Anda di **root folder project** (yang ada `deploy-on-vps.sh`).

---

## Langkah 5: Edit file `.env` di backend

Script deploy membuat `backend/.env` dari `env.example` kalau belum ada. Anda harus mengisi nilai asli.

1. **Buka file .env:**
   ```bash
   nano backend/.env
   ```

2. **Edit/sesuaikan (gunakan panah untuk pindah):**
   - **GMAIL_USER** / **GMAIL_PASS** – akun Gmail untuk baca inbox (atau kosongkan jika nanti pakai Master Email dari Admin).
   - **IMAP_HOST** / **IMAP_PORT** – biasanya tidak usah diubah kalau pakai Gmail.
   - **ADMIN_USERNAME** / **ADMIN_PASSWORD** – username dan password untuk login ke dashboard admin (ganti dengan nilai aman).
   - **FRONTEND_URL** – isi dengan URL yang dipakai user:
     - Pakai IP: `http://157.245.56.220:3001` (ganti dengan IP VPS Anda).
     - Nanti kalau pakai domain: `https://mrguest.sbs` (sesuaikan domain Anda).

3. **Simpan dan keluar:**  
   `Ctrl+O` → Enter → `Ctrl+X`.

---

## Langkah 6: Restart aplikasi dan buka firewall

1. **Restart app biar .env terbaca:**
   ```bash
   pm2 restart tempmail
   ```

2. **Buka firewall supaya port 3001 (dan SSH/HTTP) bisa diakses dari internet:**
   ```bash
   ufw allow 22
   ufw allow 3001
   ufw allow 80
   ufw --force enable
   ```
   Kalau diminta konfirmasi, pilih Yes.

3. **Cek status:**
   ```bash
   pm2 status
   ```
   Pastikan `tempmail` status **online**.

---

## Langkah 7: Buka di browser

Di komputer atau HP, buka browser dan akses:

**http://157.245.56.220:3001**

(Ganti `157.245.56.220` dengan IP VPS Anda.)

Kalau halaman Temp Mail muncul, deploy berhasil.

- **Dashboard admin** biasanya di: **http://157.245.56.220:3001/admin** (login pakai ADMIN_USERNAME dan ADMIN_PASSWORD yang Anda set di `.env`).

---

## Ringkasan perintah (setelah deploy)

| Perintah | Fungsi |
|----------|--------|
| `pm2 status` | Lihat status app |
| `pm2 logs tempmail` | Lihat log (Ctrl+C untuk keluar) |
| `pm2 restart tempmail` | Restart app |
| `pm2 stop tempmail` | Stop app |

---

## Opsi: Pakai Docker

Jika di VPS sudah terpasang Docker dan Anda lebih nyaman pakai Docker:

```bash
cd /root/tempmail   # atau path folder project Anda
cp backend/env.example backend/.env
nano backend/.env   # edit nilai
docker compose up -d --build
```

App akan jalan di port 3001.

---

## Opsi: Pakai domain + HTTPS (Nginx)

Agar pakai domain (mis. `mrguest.sbs`) dan HTTPS:

1. **Pasang Nginx & certbot:**
   ```bash
   apt-get install -y nginx certbot python3-certbot-nginx
   ```

2. **Buat config Nginx:**
   ```bash
   nano /etc/nginx/sites-available/tempmail
   ```
   Isi (ganti `mrguest.sbs` dengan domain Anda):
   ```nginx
   server {
       listen 80;
       server_name mrguest.sbs;
       location / {
           proxy_pass http://127.0.0.1:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

3. **Aktifkan & reload:**
   ```bash
   ln -sf /etc/nginx/sites-available/tempmail /etc/nginx/sites-enabled/
   nginx -t && systemctl reload nginx
   certbot --nginx -d mrguest.sbs
   ```

4. **Di `backend/.env` set:**
   ```
   FRONTEND_URL=https://mrguest.sbs
   ```
   Lalu:
   ```bash
   pm2 restart tempmail
   ```

---

## Troubleshooting

- **Port 3001 tidak bisa diakses**  
  Cek: `ufw status` (pastikan 3001 allowed), `pm2 status` (tempmail harus online).

- **IMAP / email tidak connect**  
  Cek `backend/.env` (GMAIL_USER, GMAIL_PASS atau Master Email di Admin). Lihat log: `pm2 logs tempmail`.

- **Admin login gagal**  
  Pastikan `ADMIN_USERNAME` dan `ADMIN_PASSWORD` di `backend/.env` benar, lalu `pm2 restart tempmail`.

- **SSH di PowerShell/CMD timeout, tapi FileZilla bisa**  
  Pakai PuTTY untuk SSH (seperti di tutorial ini). Atau cek Windows Firewall: izinkan outbound untuk `ssh.exe` (port 22). Bisa juga upload pakai FileZilla lalu jalankan perintah deploy lewat **web terminal** dari panel provider VPS.

- **Script deploy error**  
  Pastikan Anda di folder project (ada `deploy-on-vps.sh`, `backend`, `frontend`). Cek pesan error; kalau `npm install` gagal, coba jalankan manual: `cd backend && npm install`, lalu `cd ../frontend && npm install && npm run build`.

---

Dengan tutorial ini Anda bisa deploy dari awal hanya dengan **FileZilla** (upload) + **PuTTY** (perintah di VPS), tanpa perlu `ssh`/`scp` dari PowerShell.
