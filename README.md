# FandomVerse

**One universe. Every fandom.**
A fan portal for seven fandoms (Anime, Gaming, Movies, TV Shows, K-Pop, Comics and Manga), built for the **TechWiz7 — Web Innovation Unleashed** competition under the theme **Fandom Universe**.

---

## How to run it

1. Open the `FandomVerse` folder.
2. Double-click **`START-WEBSITE.bat`**.
3. The website opens in your browser (usually at `http://localhost:5600`).
4. Keep the black window open while you use the site. Closing it stops the site.

No installation is needed. A portable copy of Python is included in the hidden `.server` folder, so it works on any Windows 10/11 PC, even one without Python.

> Use Chrome or Edge for the best experience (voice input needs one of them).
> The AI chat and the YouTube-hosted videos need an internet connection. Everything else works offline.

---

## Features

A page-by-page guide to every feature and how it works is in **[FEATURES.md](FEATURES.md)**.

### Content
- **7 category hubs**, each with its own articles, characters, events, videos and merch.
- **Articles:** long-form fan writing, with bookmarks.
- **33 character profiles** with bios and traits.
- **Events and release calendar:** watch parties, meetups, screenings and tournaments, plus upcoming chapters, episodes, games and films.
- **Media:** 16 official trailers, interviews and behind-the-scenes videos (2–3 minutes each), played in a pop-up player. 15 of them are stored with the site and play offline.

### 3D characters that talk
- **9 characters have real 3D models:** Yuji Itadori, Satoru Gojo, Megumi Fushiguro, Goku, Vegeta, Batman, Spider-Man, Iron Man and Thanos.
- Drag to turn them 360°, use the Front/Left/Right/Back buttons, or scroll to zoom out. Iron Man has two armours to switch between.
- **Play voice:** each character introduces itself in a recorded voice. Every word appears on screen at the moment it is spoken, and the platform glows with the loudness of the voice. Stop, Resume and Start over are supported.

### AI assistant ("FandomVerse Guide")
- On every page. Knows every character, event, release, product, price, article, video and feature of the site.
- Answers in **English, Urdu or Roman Urdu/Hinglish**, and politely refuses off-topic questions.
- **Voice input:** tap the mic and speak in English/Hinglish, Urdu or Hindi; spoken questions are answered out loud.
- **Does things for you:** "Goku ka page kholo", "play the Batman trailer", "dark mode", "cart dikhao", "search PUBG".
- Works even without the AI: a built-in answer engine uses the site's own data.

### Play and games
- **Personality Match:** pick any character, describe yourself, and scan how closely your personality matches, trait by trait.
- **Character Battle:** 1 vs 1 fights decided over five stat rounds, plus an 8-fighter tournament where you predict the champion.
- **Daily Challenge:** guess the day's character from three clues, with a streak counter.
- **Surprise Me:** a random fandom, character, article and video.
- **Universe Map:** the seven fandoms as planets; fly into one to see its characters.
- **XP, levels and badges:** exploring and playing earns XP; the profile shows your level, ten badges and your watchlist.

### Accounts and shop
- Sign up, log in and **forgot password**.
- **Profile:** name, profile picture (upload or link), cover banner, accent colour, light/dark mode, order history and bookmarks.
- **Merch store:** a cart per account and a full demo checkout with validation (no real payment).
- **My Fandom:** after logging in, pick favourite fandoms and the home page shows a personal feed.
- Shop search, sorting, ratings, sale prices and a wishlist; trailer watchlist; release reminders.

### For everyone
- **Accessibility settings panel:** text size, high contrast, reduce motion, underline links and easier-reading spacing, applied to the whole site.
- Keyboard navigation, screen-reader labels, visible focus and reduced-motion support.
- **Privacy page** with a live view of the data saved in the browser and a one-click "delete all my data" button.
- Fully responsive: phones, tablets and desktops.

---

## Folder structure

```
FandomVerse/
├── START-WEBSITE.bat     Starts the website (double-click)
├── index.html … *.html   The pages (16)
├── css/                  Styles (global, components, glass theme, responsive)
├── js/                   Page scripts (chat, 3D character page, cart, auth, media, …)
├── data/                 Content as JSON: characters, articles, events, releases,
│                         merchandise, trailers, categories, site-help (chat knowledge)
├── assets/
│   ├── images/           Posters, banners, characters, merch, 3D view renders
│   ├── models/           3D models (.glb, Draco-compressed)
│   ├── voices/           Character voices (.mp3/.wav) + word timings (.json)
│   └── media/            Stored video clips (720p, ≤ 3 minutes)
└── .server/              (hidden) the local server
    ├── server.py         Serves the site and connects the chat to the AI
    ├── server.ps1        Backup server used only if Python can't run
    ├── ai-key.txt        AI API keys (private — never sent to the browser)
    └── python/           Portable Python 3.12 (no install needed)
```

---

## The AI chat: setup

The keys live in `.server/ai-key.txt`, one per line. The first one that answers is used; the others are automatic backups.

```
gsk_…        Groq         (fast, used first)
sk-or-…      OpenRouter   (backup)
hf_…         Hugging Face (backup)
```

A model name can be written on the line under a key. The server detects the service from the key's prefix (Groq, OpenRouter, Hugging Face, OpenAI, Google Gemini, DeepSeek; a line reading `ollama` uses a local Ollama install).

- The key file is **never** served to the browser: requests for `.server/…` return 404, and the folder is hidden from listings.
- Free plans have limits (per minute and per day). When one service is busy or used up, the server moves to the next one; if all are unavailable, the chat falls back to its built-in answers.
- **Do not share `ai-key.txt`.** Remove the keys before sending the project to anyone.

---

## Built with

HTML5 · CSS3 · JavaScript (ES6) · JSON data · [model-viewer](https://modelviewer.dev/) for 3D (self-hosted, with the Draco decoder) · Web Speech API (voice input and speech) · Web Audio API (voice-reactive glow) · Python standard library server · Groq / OpenRouter / Hugging Face AI · YouTube privacy-enhanced embeds · local & session storage · Google Maps embed.

No frameworks and no database: accounts, carts, orders and bookmarks are stored in the visitor's own browser. Passwords are saved only as a SHA-256 hash.

---

## Note

Characters, series and logos belong to their respective owners. FandomVerse is a non-commercial student project made for the TechWiz7 competition.
