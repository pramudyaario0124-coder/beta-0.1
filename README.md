# Klip Studio PWA

Editor video web mobile-first dengan tampilan gelap dan workflow timeline sederhana.

## Isi paket
- `index.html`: struktur aplikasi
- `style.css`: UI mobile-first
- `app.js`: impor klip, preview, trim in/out, speed, filter, brightness/contrast, teks overlay, dan ekspor WebM berbasis MediaRecorder
- `manifest.json`, `sw.js`, `icon.svg`: dukungan PWA

## Upload ke GitHub Pages
1. Ekstrak ZIP.
2. Buka repository `editor-klip1`.
3. Upload seluruh isi folder ini ke root repository.
4. Pilih **Commit changes** dan pastikan file lama `index.html`, `manifest.json`, `sw.js` diganti.
5. Buka Settings → Pages dan pastikan deploy dari branch `main`, folder `/ (root)`.

## Catatan kemampuan
Ini adalah fondasi editor PWA, bukan replika penuh CapCut. Ekspor saat ini menghasilkan WebM melalui MediaRecorder browser. Dukungan codec, performa, dan batas durasi bergantung pada browser/perangkat. Fitur multi-track, transisi, keyframe, waveform, subtitle otomatis, dan ekspor MP4 native belum tersedia.
