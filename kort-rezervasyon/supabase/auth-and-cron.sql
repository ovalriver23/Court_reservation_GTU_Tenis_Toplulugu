-- public şeması dışında kalan ve pg_dump'a girmeyen parçalar.
-- schema.sql'den SONRA çalıştırılır.

-- 1) Sadece @gtu.edu.tr adresleriyle kayıt (kayıt ve e-posta değişikliği)
drop trigger if exists enforce_gtu_email on auth.users;
create trigger enforce_gtu_email
  before insert or update of email on auth.users
  for each row execute function public.enforce_gtu_email();

-- 2) Yeni kullanıcı için otomatik profil
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3) Her gece 00:05 (Türkiye) = 21:05 UTC: önümüzdeki 14 günün slotları
--    (önce Database → Extensions'tan pg_cron etkinleştirilmeli)
select cron.schedule('generate-slots', '5 21 * * *', $$select public.generate_slots();$$);
