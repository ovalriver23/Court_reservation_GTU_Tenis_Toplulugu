# GTU Tenis Kort Rezervasyon Sistemi

GTU Tenis Topluluğu'nun kort rezervasyonlarını WhatsApp yerine tek bir takvim üzerinden yöneten, mobil öncelikli web uygulaması. Canlı adres: https://www.gtutennis.com.tr

## Ne yapıyor?

- Haftalık takvimde boş ve dolu saatleri gösterir; değişiklikler anlık (realtime) yansır.
- Üyeler tek başına ya da bir arkadaşını partner seçerek rezervasyon yapar ve iptal eder.
- Günlük, haftalık ve haftada bir "prime time" limiti uygular; limitler partner için de sayılır.
- Admin paneli: özet, üye yönetimi (admin yapma, uyarı e-postası, silme), tüm rezervasyonlar, manuel rezervasyon ve ayarlar (kort saatleri, limitler, prime time aralığı, en geç iptal süresi).
- Kayıt yalnızca `@gtu.edu.tr` adresleriyle yapılır (veritabanı seviyesinde de zorunlu). E-posta OTP doğrulaması, şifre sıfırlama ve isteğe bağlı iki adımlı doğrulama (TOTP) vardır.
- Geri bildirim formu ve admin uyarıları Resend üzerinden e-posta ile gönderilir.

## Teknolojiler

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Supabase (Auth, PostgreSQL, Realtime, pg_cron) · Resend · Vercel

## Yerelde çalıştırma

```bash
cd kort-rezervasyon
npm ci
npm run dev        # http://localhost:3000
```

Diğer komutlar: `npm run build`, `npm run lint`, `npx tsc --noEmit`.

> Not: Şu an ayrı bir geliştirme veritabanı yok; `.env.local` production Supabase projesine bağlanır. Yerelde yapılan rezervasyonlar gerçek veriye yazılır.

## Ortam değişkenleri

`kort-rezervasyon/.env.local` (git'e eklenmez) ve Vercel'de:

```env
NEXT_PUBLIC_SUPABASE_URL=        # https://<proje>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase publishable key (sb_publishable_...)
SUPABASE_SERVICE_ROLE_KEY=       # Supabase secret key (sb_secret_...), sadece sunucuda
RESEND_API_KEY=                  # Resend API anahtarı
FEEDBACK_RECIPIENTS=             # Geri bildirimlerin gideceği adresler, virgülle ayrılmış
NEXT_PUBLIC_APP_URL=             # Canlı adres; şifre sıfırlama bağlantıları için
```

Anahtarlar asla koda ya da repoya yazılmaz. Secret key Vercel'de "Sensitive" olarak tutulur.

## Veritabanı

Şemanın kaynağı `kort-rezervasyon/supabase/` klasörüdür:

- `schema.sql` — `public` şemasının `pg_dump` çıktısı (tablolar, fonksiyonlar, RLS politikaları, yetkiler).
- `auth-and-cron.sql` — `public` dışında kalan parçalar: `@gtu.edu.tr` trigger'ı ve gece slot üretimi (pg_cron).

Sıfırdan kurulum için önce `schema.sql`, sonra `auth-and-cron.sql` çalıştırılır. Veritabanında yapılan her değişiklikten sonra şema yeniden dökülüp commitlenmelidir (komut `CLAUDE.md`'de).

## Proje yapısı

```text
kort-rezervasyon/
  src/
    app/          # Sayfalar: (auth) giriş/kayıt akışı, (app) takvim, profil, rezervasyonlar, admin
    components/   # UI bileşenleri
    lib/          # Supabase istemcileri, server action'lar, saat ve kaçışlama yardımcıları
    types/        # TypeScript tipleri
  public/photos/  # Arka planlar, favicon, yükleme animasyonu
  supabase/       # Veritabanı şeması
```

Geliştirici notları, güvenlik kuralları ve mimari ayrıntılar için `CLAUDE.md` dosyasına bakın.
