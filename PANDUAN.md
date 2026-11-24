Berikut struktur menu yang konsisten untuk ketiga subdomain. Gunakan navigasi yang sama secara visual, tetapi sesuaikan tautan aktif agar pengguna selalu tahu sedang berada di bagian mana.

## Header utama

```text
URITY  |  Produk  |  Panduan  |  Blog  |  Tentang  |  Kontak
```

| Menu | Tujuan |
|---|---|
| **Produk** | `https://urity.org/` |
| **Panduan** | `https://guide.urity.org/` |
| **Blog** | `https://blog.urity.org/` |
| **Tentang** | `https://blog.urity.org/tentang-kami/` |
| **Kontak** | `https://blog.urity.org/hubungi-kami/` |

Tandai menu aktif dengan underline atau warna berbeda. Misalnya, saat pengguna berada di `blog.urity.org`, menu **Blog** ditandai aktif meskipun tautannya tetap mengarah ke domain blog.

## Navigasi `urity.org`

```text
URITY
├─ Produk
│  ├─ Mobile Legends
│  ├─ Free Fire
│  ├─ PUBG Mobile
│  ├─ Genshin Impact
│  ├─ Steam Wallet
│  ├─ Valorant
│  ├─ Roblox
│  └─ Semua Produk
├─ Panduan
│  ├─ Panduan Top Up
│  ├─ Cek ID & Server
│  ├─ Keamanan Akun
│  └─ Semua Panduan
├─ Blog
│  ├─ Panduan Game
│  ├─ Voucher Digital
│  └─ Keamanan Online
├─ Tentang
└─ Kontak
```

Tautan “Panduan” mengarah ke `guide.urity.org`, sedangkan “Blog” mengarah ke `blog.urity.org`. Ini membuat `urity.org` menjadi pusat navigasi merek dan katalog produk. [developers.google](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)

## Navigasi `guide.urity.org`

```text
URITY DIGITAL HUB
├─ Beranda
├─ Panduan
│  ├─ Panduan Top Up Game
│  ├─ Mobile Legends
│  ├─ Free Fire
│  ├─ PUBG Mobile
│  ├─ Genshin Impact
│  ├─ Voucher Digital
│  ├─ Gift Card
│  └─ Keamanan Akun
├─ Produk
│  ├─ Katalog Game
│  └─ Katalog Voucher
├─ Blog
│  ├─ Panduan Game
│  ├─ Voucher Digital
│  └─ Keamanan Online
├─ Tentang
└─ Kontak
```

Halaman induk seperti **Panduan Top Up Game** sebaiknya menautkan ke seluruh panduan anak. Struktur ini membentuk silo topikal dan memudahkan pengguna menemukan panduan spesifik. [developers.google](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)

## Navigasi `blog.urity.org`

```text
URITY BLOG
├─ Beranda
├─ Kategori
│  ├─ Mobile Legends
│  ├─ Free Fire
│  ├─ PUBG Mobile
│  ├─ Genshin Impact
│  ├─ Steam Wallet
│  ├─ Voucher Digital
│  └─ Keamanan Akun
├─ Panduan
│  ├─ Panduan Top Up
│  ├─ Cek ID & Server
│  └─ Keamanan Akun
├─ Produk
│  ├─ Katalog Game
│  └─ Katalog Voucher
├─ Tentang
└─ Kontak
```

Untuk WordPress, buat kategori yang selaras dengan silo game dan intent pencarian. Jangan membuat terlalu banyak kategori; 6–8 kategori utama biasanya lebih rapi dan lebih mudah dikelola.

## Footer lintas domain

Gunakan footer yang hampir identik di ketiga situs:

```text
URITY
Produk | Panduan | Blog | Tentang | Kontak

Informasi
Tentang Urity
Kebijakan Privasi
Syarat & Ketentuan
Disclaimer
Peta Situs
```

Tambahkan disclaimer singkat di footer, terutama di `urity.org`:

> Urity/NAGA5000 menyediakan informasi produk dan panduan digital. Pastikan jenis produk, wilayah akun, nominal, dan metode penukaran sebelum melakukan pembelian.

Ini sesuai dengan pesan checklist yang sudah ditampilkan di `guide.urity.org`. 

## Contoh breadcrumb

Gunakan breadcrumb agar struktur lintas subdomain tetap terbaca:

```text
Beranda › Panduan › Mobile Legends › Cek ID & Server
```

```text
Beranda › Blog › Mobile Legends › Cara Top Up Diamond MLBB
```

```text
Beranda › Produk › Mobile Legends
```

Tambahkan schema `BreadcrumbList` di Astro, WordPress, dan GitHub Pages agar Google memahami hierarki halaman. [developers.google](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)

## Aturan implementasi

- Gunakan satu logo dan nama merek yang konsisten di ketiga domain.
- Jangan menaruh puluhan tautan di menu; batasi menu utama ke 5–7 item.
- Tautkan lintas-subdomain dengan anchor deskriptif, misalnya “Panduan Cek ID MLBB,” bukan “klik di sini.”
- Pastikan setiap halaman penting memiliki minimal satu tautan internal dari halaman lain yang relevan. [developers.google](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)
- Tambahkan `rel="noopener"` untuk tautan yang membuka tab baru, dan hindari `nofollow` untuk tautan antar-subdomain milik sendiri. [developers.google](https://developers.google.com/search/blog/2008/10/importance-of-link-architecture)