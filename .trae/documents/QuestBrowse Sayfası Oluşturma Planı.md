# QuestBrowse Sayfası Uygulama Planı

Bu plan, kullanıcıların herhangi bir web sitesini QuestLayer widget'ı ile birlikte görüntüleyebileceği "QuestBrowse" sayfasını oluşturmayı hedefler.

## 1. Yeni Bileşen: `components/QuestBrowse.tsx`

Bu dosya, hem arama/listeleme arayüzünü hem de aktif tarayıcı (iframe) modunu içerecektir.

### A. Arayüz Tasarımı (Browse Mode)
*   **Sticky Navbar**: Mevcut `LandingPage` veya `ExplorePage` navbar'ına benzer, geri dönme ve marka öğeleri içeren üst bar.
*   **URL Bar**: Sayfanın üst kısmında, kullanıcının gitmek istediği siteyi yazabileceği büyük, şık bir input alanı.
*   **Widget Grid**: Alt kısımda, veritabanından çekilen popüler widget'ların listesi (`ExplorePage` mantığıyla).
    *   Kartlara tıklandığında, o widget'ın tanımlı olduğu domain ve widget verileriyle "Active Mode"a geçilir.

### B. Aktif Tarayıcı Modu (Active Mode)
*   **Tam Ekran Iframe**: Girilen veya seçilen URL'i yükleyen iframe.
    *   *Not:* `X-Frame-Options` koruması olan siteler (örn. Google, Twitter) iframe içinde açılamayabilir. Bu tarayıcı tabanlı bir kısıtlamadır.
*   **Widget Overlay**: Iframe'in üzerinde `z-index` ile konumlandırılmış `Widget` bileşeni.
*   **Default Widget**: Eğer kullanıcı URL bar'dan manuel giriş yaparsa, genel bir "QuestLayer Browser" widget konfigürasyonu (varsayılan görevlerle) yüklenecektir.
*   **Navigation Bar**: Iframe'in üzerinde, URL'i değiştirme veya moda çıkış yapma (Back) imkanı sağlayan ince bir kontrol çubuğu.

## 2. Navigasyon Entegrasyonu (`App.tsx`)

*   `currentPage` state'ine `'questbrowse'` seçeneği eklenecek.
*   `QuestBrowse` bileşeni ana `App` akışına dahil edilecek.
*   Landing Page'e veya Dashboard'a "Browse" veya "QuestBrowse" butonu eklenerek bu sayfaya geçiş sağlanacak.

## 3. Teknik Detaylar

*   **Veri Çekme**: `ExplorePage`'deki `fetchAllProjects` ve `fetchProjectStats` mantığı tekrar kullanılacak.
*   **State Yönetimi**:
    *   `currentUrl`: Iframe'de gösterilecek URL.
    *   `activeProject`: Widget'a aktarılacak proje verisi (Renkler, görevler vb.).
    *   `isBrowsing`: Hangi görünümün (Liste vs Iframe) aktif olduğunu kontrol eden flag.

## Adımlar

1.  `components/QuestBrowse.tsx` dosyasını oluştur.
2.  Browse arayüzünü (Navbar, Input, Grid) kodla.
3.  Iframe ve Widget overlay yapısını kur.
4.  `App.tsx` içinde yönlendirmeleri ayarla.
5.  Landing Page'e giriş butonu ekle.
