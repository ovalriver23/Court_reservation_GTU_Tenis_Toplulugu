# GTU Tenis Kort Rezervasyon Sistemi

GTU Tenis Topluluğu için geliştirilmiş, WhatsApp üzerinden yürüyen dağınık rezervasyon sürecini tek bir takvim tabanlı web uygulamasında toplayan kort rezervasyon sistemi.

Uygulama mobil öncelikli tasarlandı. Amaç; üye onayı, rezervasyon alma, iptal etme ve admin yönetimini tek bir akışta, sade ve hızlı bir arayüzle sunmak.

## Neden Yapıldı

- Rezervasyonların WhatsApp mesajları arasında kaybolmasını önlemek
- Tek kort için uygun, anlaşılır ve hızlı bir rezervasyon akışı kurmak
- Üyelik onayı ve admin yönetimini merkezileştirmek
- Kullanıcıların kendi rezervasyonlarını kolayca görüp iptal edebilmesini sağlamak

## Ne Yapıyor?

- 14 günlük takvim üzerinden müsait saatleri gösterir
- Üyelerin rezervasyon oluşturmasına ve kendi rezervasyonlarını iptal etmesine izin verir
- Admin onayı olmadan erişimi kısıtlar
- Admin panelinden kullanıcıları, rezervasyonları ve site ayarlarını yönetir
- Saat aralıkları, günlük/haftalık limitler ve ileri tarih kısıtlarını destekler

## Kullanılan Teknolojiler

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Auth, PostgreSQL, Realtime)
- Vercel

## Kurulum

Projeyi yerelde çalıştırmak için önce ilgili klasöre gir:

```bash
cd kort-rezervasyon
```

Bağımlılıkları yükle:

```bash
npm install
```

Geliştirme sunucusunu başlat:

```bash
npm run dev
```

Sonra tarayıcıdan `http://localhost:3000` adresini aç.

## Build Almak

Production build almak için:

```bash
npm run build
```

## Ortam Değişkenleri

`.env.local` dosyasında şu değişkenler olmalı:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=
```

`NEXT_PUBLIC_APP_URL` production ortamda canlı domain olmalı. E-posta yönlendirmeleri ve geri dönüş URL'leri için önemlidir.

## Proje Yapısı

```text
kort-rezervasyon/
	src/
		app/           # Sayfalar, layout'lar ve route'lar
		components/    # Tekrar kullanılan UI bileşenleri
		lib/           # Supabase istemcileri, server actions, yardımcılar
		types/         # TypeScript tipleri
	public/          # Statik dosyalar
	supabase/        # Veritabanı şeması
```

## Öne Çıkan Akışlar

- Kayıt, e-posta doğrulama ve kullanıcı onayı
- Takvim üzerinden rezervasyon oluşturma
- Rezervasyon iptali
- Admin panelinde kullanıcı ve rezervasyon yönetimi
- Saat aralığı ve limit ayarları

