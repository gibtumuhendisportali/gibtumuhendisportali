# Mimari Özeti (Architecture Overview)

## 1. Genel Yapı
Sistem, tek bir monorepo içinde iki dağıtım birimi ve bir paylaşılan sözleşme paketinden oluşur:
- **`apps/web` (Vercel)**: Next.js App Router tabanlı sunucu/istemci arayüzü.
- **`apps/api` (Cloudflare Workers)**: Modüler monolit mimaride Hono REST API.
- **`packages/shared`**: İstemci ve sunucu arasında paylaşılan Zod şemaları, domain tipleri ve merkezi i18n sözlükleri.

## 2. Kimlik Doğrulama ve Yetkilendirme (Supabase Auth + D1)
- **Supabase Auth** yalnızca kimlik doğrulama sağlayıcısıdır (kayıt, giriş, e-posta doğrulama, şifre sıfırlama, JWT üretimi).
- **Cloudflare Workers**, gelen her korumalı istekte `Authorization: Bearer <token>` başlığındaki JWT'yi Supabase JWKS üzerinden doğrular (imza, `iss`, `aud`, `exp`).
- **Cloudflare D1** uygulama verilerinin ve yetkilendirmenin tek doğruluk kaynağıdır (`users`, `community_permissions`, `profiles`, `events`, `registrations`, `tickets`).
- Öğrenciler ve mezunlar serbest kişisel e-posta adresleriyle kayıt olur (üniversite e-postası zorunluluğu yoktur); `verification_status` alanı yönetici onayı (`verified`) alana kadar üyelere özel uç noktalara erişemezler.
- Topluluk yetkileri yalnızca role göre değil, topluluk bazlı yetki kayıtları üzerinden kontrol edilir. YAZEK ve REP yalnızca kendi topluluklarına ait etkinlikleri yönetebilir; platform geneli yönetim yalnızca platform yöneticilerine aittir.

## 3. Veri Bütünlüğü ve Güvenlik İlkeleri
- **Etkinlik Kapasitesi**: Kayıt sırasında kapasite kontrolü SQL seviyesinde atomik koşullu güncelleme ile yapılır.
- **QR Biletler ve Check-in**: Yüksek entropili tahmin edilemez token üretilir; D1'de token'ın kendisi değil kriptografik hash'i saklanır. Check-in işlemi atomik ve idempotent olarak tasarlanır.
- **R2 Dosya Erişimi**: Profil fotoğrafları ve etkinlik görselleri doğrudan açık liste erişimine kapalıdır; yükleme ve erişim Worker üzerinden yetkilendirilir.
- **İstemci Güveni**: İstemciden gelen rol, topluluk veya doğrulama bilgilerine asla güvenilmez.

## 4. Çoklu Dil (i18n) Yaklaşımı
- İlk sürüm dili Türkçedir (`tr`).
- Kullanıcı arayüzü metinleri bileşenlere sabit yazılmaz; `packages/shared/src/i18n` altındaki merkezi sözlük yapısından beslenir. İleride İngilizce (`en`) desteği aynı sözlük arayüzü üzerinden eklenecektir.
