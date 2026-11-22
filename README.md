# GIBTU Mühendislik Portalı (GIBTU Engineering Portal)

Gaziantep İslam Bilim ve Teknoloji Üniversitesi (GİBTÜ) mühendislik öğrencileri ve mezunları için kurumsal öğrenci ve mezun ağı.

Kurucu Topluluklar: **YAZEK** (Yapay Zeka Topluluğu) ve **REP** (Robotik ve Elektronik Programlama Topluluğu).

## Workspace Yapısı

- `apps/web` — Next.js (App Router), React, TypeScript, Tailwind CSS (Vercel)
- `apps/api` — Cloudflare Workers, Hono, TypeScript, Cloudflare D1 & R2
- `packages/shared` — Ortak Zod şemaları, TypeScript tipleri, domain sabitleri ve merkezi i18n sözlükleri
- `docs` — Mimari kararlar ve KVKK veri işleme temeli

## Kurulum (Geliştirme)

```bash
corepack enable
pnpm install
```

Ortam değişkenleri için `apps/web/.env.example` ve `apps/api/.env.example` dosyalarını inceleyin. Gerçek gizli anahtarları asla repoya eklemeyin.

## Doğrulama Komutları

```bash
pnpm typecheck
pnpm lint
pnpm build
```
