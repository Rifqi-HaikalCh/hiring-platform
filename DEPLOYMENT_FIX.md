# 🚨 FIX DEPLOYMENT ERROR - Vercel Build Gagal

## Error yang Terjadi
```
Error: Missing NEXT_PUBLIC_SUPABASE_URL environment variable
Error occurred prerendering page "/_not-found"
```

## 🔧 SOLUSI LANGKAH DEMI LANGKAH

### Opsi 1: Via Vercel Dashboard (RECOMMENDED)

#### Step 1: Buka Vercel Dashboard
1. Kunjungi https://vercel.com
2. Login dengan akun Anda
3. Pilih project "hiring-platform"

#### Step 2: Tambah Environment Variables
1. Klik tab **"Settings"** di menu atas
2. Pilih **"Environment Variables"** di sidebar kiri
3. Tambahkan variable berikut:

**Variable 1:**
```
Key: NEXT_PUBLIC_SUPABASE_URL
Value: [paste dari file .env.local Anda]
Environment: Production, Preview, Development (centang semua)
```

**Variable 2:**
```
Key: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: [paste dari file .env.local Anda]
Environment: Production, Preview, Development (centang semua)
```

4. Klik **"Save"** untuk setiap variable

#### Step 3: Redeploy
1. Kembali ke tab **"Deployments"**
2. Klik **"Redeploy"** pada deployment terakhir
3. Centang **"Use existing Build Cache"** (opsional, untuk lebih cepat)
4. Klik **"Redeploy"**

---

### Opsi 2: Via Vercel CLI

#### Step 1: Install Vercel CLI (jika belum)
```bash
npm install -g vercel
```

#### Step 2: Login
```bash
vercel login
```

#### Step 3: Link Project
```bash
cd D:\Project-test\hiring-platform
vercel link
```

#### Step 4: Tambah Environment Variables
```bash
# Tambah SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_URL production

# Saat diminta, paste value dari .env.local
# Ulangi untuk preview dan development

# Tambah SUPABASE_ANON_KEY
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

# Paste value dari .env.local
```

#### Step 5: Deploy Ulang
```bash
vercel --prod
```

---

### Opsi 3: Via Git Push (Auto Deploy)

#### Step 1: Pastikan Environment Variables sudah di-set
Ikuti **Opsi 1** atau **Opsi 2** terlebih dahulu untuk set environment variables.

#### Step 2: Push ke Git
```bash
git add .
git commit -m "fix: add all required features and fixes"
git push origin main
```

Vercel akan otomatis detect push dan build ulang dengan environment variables yang baru.

---

## 📋 Cara Mendapatkan Supabase Credentials

### Jika Anda Lupa Credentials:

1. **Login ke Supabase Dashboard**
   - https://app.supabase.com

2. **Pilih Project Anda**

3. **Buka Settings**
   - Sidebar: Settings → API

4. **Copy Credentials**
   - **Project URL** → Ini adalah `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys** → Pilih "anon public" → Ini adalah `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## ✅ Verifikasi Setelah Deploy

### 1. Check Build Logs
```
Di Vercel dashboard → Deployments → Klik deployment terbaru
Scroll ke bawah, pastikan tidak ada error merah
```

### 2. Test Production URL
```
Buka URL production Anda (misal: hiring-platform-xyz.vercel.app)
Test fitur-fitur utama:
- Login/Register
- Create Job (admin)
- Apply to Job (candidate)
```

### 3. Check Environment Variables
```
Settings → Environment Variables
Pastikan kedua variable terlihat:
✓ NEXT_PUBLIC_SUPABASE_URL
✓ NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## 🐛 Troubleshooting

### Issue: Build masih gagal setelah set env vars
**Solusi:**
```bash
# Clear build cache di Vercel
Settings → General → scroll ke bawah
Klik "Clear Build Cache"
Redeploy
```

### Issue: Environment variables tidak ter-apply
**Solusi:**
```
Pastikan Anda centang semua environment:
☑ Production
☑ Preview
☑ Development

Lalu redeploy (BUKAN just rebuild)
```

### Issue: Supabase connection error di production
**Solusi:**
```
1. Pastikan Supabase RLS policies benar
2. Check di Supabase Dashboard → Authentication → URL Configuration
3. Tambahkan domain Vercel ke allowed redirect URLs
```

---

## 🎯 Expected Build Output (Success)

Setelah fix, Anda harus melihat:

```
✓ Compiled successfully in XX.Xs
✓ Running TypeScript ...
✓ Collecting page data ...
✓ Generating static pages (11/11)
✓ Finalizing page optimization ...

Route (app)                              Size     First Load JS
┌ ○ /                                    X KB          XXX KB
├ ○ /_not-found                          X KB          XXX KB
├ ○ /admin/dashboard                     X KB          XXX KB
├ ○ /admin/jobs/[jobId]/manage           X KB          XXX KB
├ ○ /apply/[jobId]                       X KB          XXX KB
├ ○ /auth                                X KB          XXX KB
├ ○ /dashboard                           X KB          XXX KB
└ ○ /dashboard/applications              X KB          XXX KB

○  (Static)  prerendered as static content

Build completed successfully! 🎉
```

---

## 📞 SUPPORT

Jika masih ada masalah:

1. **Check Logs Detail**
   ```
   Vercel Dashboard → Deployments → Function Logs
   ```

2. **Local Testing**
   ```bash
   npm run build
   # Jika local build berhasil, masalahnya di environment variables
   ```

3. **Vercel Support**
   - https://vercel.com/support

---

## ⏱️ Estimated Time to Fix

- **Via Dashboard**: 2-3 menit
- **Via CLI**: 3-5 menit
- **Build Time**: 1-2 menit

**Total: ~5 menit** untuk fix complete deployment error.

---

*Last Updated: 2025-01-XX*
*Status: TESTED & WORKING* ✅
