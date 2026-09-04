# Build APK - Math RPG Offline

Project sudah siap di-wrap jadi APK via Capacitor (WebView offline).

## Struktur
- `dist/` = hasil `npm run build` (web offline)
- `capacitor.config.json` = appId `com.mathrpg.offline`, webDir `dist`
- `android/` = project Android native (sudah `npx cap add android`)

## Opsi A: Build Otomatis via GitHub Actions (Tanpa Install SDK) - REKOMENDASI

Karena laptop ini tidak ada Java/Android SDK, pakai GitHub:

1. Buat repo di GitHub, push folder `math-rpg` ini:
```bash
git init
git add .
git commit -m "Math RPG apk ready"
git branch -M main
git remote add origin https://github.com/USERNAME/math-rpg.git
git push -u origin main
```
2. Buka GitHub > tab **Actions** > workflow `Build APK` akan jalan otomatis (3-5 menit)
3. Jika selesai, download artifact `MathRPG-debug-apk` -> file `app-debug.apk`
4. Kirim APK ke HP dan install

Workflow ada di `.github/workflows/build-apk.yml:1`

## Opsi B: Build Lokal via Android Studio

1. Install Android Studio + SDK + Java 17
2. Buka terminal di folder `math-rpg`:
```bash
npm install
npm run build
npx cap sync android
```
3. Buka `android/` di Android Studio
4. Menu `Build > Build APK(s)` -> APK ada di `android/app/build/outputs/apk/debug/app-debug.apk`

## Opsi C: Test Cepat Tanpa APK (PWA Install)

1. `npm run build` lalu `npm run preview` atau pakai `index.html` sederhana di `C:\DATA D\CODING\GAME MATEMATIKA\index.html`
2. Buka di Chrome HP, klik `⋮ > Install App / Tambahkan ke Layar Utama` -> jalan offline, tidak perlu APK
3. Test offline: Airplane Mode > buka app > harus tetap jalan (localStorage / JSON lokal)

## Install di HP
- Aktifkan `Setelan > Keamanan > Izinkan instal dari sumber tidak dikenal`
- Copy `app-debug.apk` ke HP, tap untuk install
- Icon akan muncul "Math RPG"

## Perubahan Terbaru (KALAH)
- Waktu habis -> darah berkurang `enemy.atk` (tidak langsung kalah)
- Darah habis (HP 0) -> modal `💀 KALAH` + tombol `🔄 RESTART` (`src/main.js:198`, `index.html:23`)
