# KVKK ve Gizlilik Temeli (KVKK Baseline)

Bu belge, GIBTU Mühendislik Portalı için 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında temel tasarım ilkelerini özetler.

## 1. Veri Minimizasyonu ve Amaçla Sınırlılık
- Yalnızca üniversite mühendislik topluluğu ve mezun ağı işlevleri için gerekli veriler toplanır.
- Kayıt sırasında serbest kişisel e-posta adresi kullanılır; üniversite e-postası zorunluluğu yoktur.
- Üyelik doğrulaması tamamlanmamış kullanıcıların verileri dizinde veya diğer üyelere açık alanlarda gösterilmez.

## 2. Aydınlatma Metni ve Açık Rıza Ayrımı
- **Aydınlatma Metni** (bilgilendirme yükümlülüğü) ile **Açık Rıza** (isteğe bağlı/rıza gerektiren işleme) veri modelinde ve arayüzde ayrı ele alınır.
- `kvkk_consents` tablosunda onaylanan metin sürümü (`policy_version`), onay türü ve zaman damgası saklanır.

## 3. Dizin Gizliliği ve Ayrı Görünürlük Kontrolleri
- Doğrulanmış kullanıcı profilleri **varsayılan olarak dizinde gizlidir** (`directory_visible = false`).
- Kullanıcı, profil ayarlarından dizin görünürlüğünü kendi isteğiyle açabilir.
- İletişim bilgileri (ör. e-posta/telefon) ve profesyonel bağlantılar (ör. LinkedIn, GitHub) için ayrı görünürlük kontrolleri bulunur.

## 4. Silme ve Anonimleştirme Yaşam Döngüsü
- Kullanıcı hesabını silmek istediğinde:
  1. D1 üzerindeki kişisel profil verileri silinir veya anonimleştirilir.
  2. Cloudflare R2 üzerindeki kullanıcı dosyaları silinir.
  3. Supabase Auth üzerindeki kimlik kaydı kaldırılır.
