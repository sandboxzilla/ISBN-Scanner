# 📚 ISBN Scanner

A hands-free, browser-based app that scans ISBN barcodes from books, fetches book data from Google Books, and optionally captures a retail price via voice input — all saved in a YAML export for downstream processing or inventory tracking.

---

## 🔧 Features

- ✅ Keyboard/Barcode Scanner input  
- ✅ Instant lookup from Google Books API  
- ✅ Spoken book title/author output  
- ✅ Voice input for optional pricing  
- ✅ Hands-free "next scan skips price" logic  
- ✅ YAML export with multi-entry demarcation  
- ✅ Upload `.txt` file of ISBNs to batch scan  
- ✅ Clean, retro-aesthetic responsive UI  
- ✅ No backend — works fully in-browser  
- ✅ Version-synced with `Jv`, `Hv`, `Cv` stamp

---

## 🚀 How to Use

1. Open [`index.html`](index.html) in **Chrome desktop** (voice input requires microphone permissions).
2. Use a barcode scanner or keyboard to enter ISBNs.
3. The app will:
   - Fetch and display book info
   - Read the title/author aloud
   - Ask if you'd like to add a price
   - Listen for “4.99”, “none”, or wait for the next scan (8s timeout)
4. Click **Download YAML** to export your scanned book list.
5. Optionally upload a `.txt` file of ISBNs to scan in batch.

---

## 📦 Files Overview

| File         | Description                             |
|--------------|-----------------------------------------|
| `index.html` | UI structure and version tracking        |
| `app.js`     | Core logic (lookup, voice, YAML export) |
| `style.css`  | Responsive styling, max-width layout     |
| `README.md`  | You're reading it                        |

---

## 🧪 Requirements

- Google Chrome (for microphone & speech API)
- Internet connection (Google Books API access)
- Barcode scanner (or keyboard input)
- GitHub Pages (or any static web host)

---

## 🔗 Version Tags

This app auto-displays version info from file headers in the format:

