# FandomVerse: Features Guide

This guide covers every page of FandomVerse: what the page is for, what you can do on it, and how each feature works behind the scenes.

- **Live site:** https://fandomverse-nu.vercel.app
- **GitHub copy:** https://farmandevstudio.github.io/FandomVerse/
- **Run it offline:** open `START-WEBSITE.bat` (see `README.md`)

---

## 1. Features on every page

| Feature | What it does | How it works |
|---|---|---|
| **Loading screen** | The FandomVerse logo fills with red from the bottom up, like water in a bottle, then the page appears. | The fill follows the real loading progress. A small script counts the page's pictures as they finish downloading and raises the fill to match. On fast internet it takes about 1–2 seconds; on slow internet it fills slowly. After about 9 seconds the page opens anyway, so it can never get stuck. |
| **Header and menu** | Logo, the main pages, search, cart, login, and the light/dark switch. On phones the menu opens from a button. | The current page is underlined in the menu. The logo switches to a dark version in light mode. |
| **Search** | Searches characters, articles, events, videos and merchandise from one box. | The site's own data is searched as you type, and the results link straight to the right page. |
| **Light / dark mode** | Changes the whole site between a dark and a light theme. | The choice is saved in the browser, so it stays the same on every page and on the next visit. |
| **Cart and checkout** | Add merchandise, change quantities, then check out. | The cart is saved per account in the browser. Checkout has two steps: delivery details, then a demo payment form. Every field is checked (name, phone, card format), and no real payment is taken. The finished order appears in the profile's order history. |
| **AI guide (chat button)** | A chat assistant that answers questions about the site and its fandoms, and can do things for you ("open Goku's page", "play the Batman trailer", "dark mode"). You can type or use the microphone. | Messages go to the site's small Python server, which asks an AI service (Groq first, then OpenRouter and Hugging Face as backups). The API keys stay on the server and never reach the browser. When a reply mentions a character or fandom, a card with a picture and link appears under it. If no AI is available, a built-in answer engine replies using the site's own data. Each account has its own chat, which is cleared on log out. |
| **Footer** | The same on every page: logo, links to every section, all seven categories, and the site pages. | |
| **Page not found (404)** | Any wrong link shows a friendly "Page not found" page with buttons back to Home and Explore. | |
| **Lite mode (weak PCs and phones)** | Keeps the site smooth on computers without a graphics card and on phones. | The site detects a weak device and switches off only the heavy effects: glass blur and big shadows. Every animation and feature stays visible. It can also be set by hand on the Accessibility page. |

---

## 2. Pages

### Home (`index.html`)
The front page of the universe.

| Section | What it shows / how it works |
|---|---|
| **Hero** | "One universe. Every fandom." with a planet horizon and live counters (categories, characters). The counters count up once the page has loaded. |
| **Banner** | A rotating banner of highlights from different fandoms. |
| **My Fandom** (logged-in only) | "Welcome back" with your level, a row to pick your favourite fandoms, and a personal feed of seven picture cards: a character for you (large card), two new articles (their posters), the next upcoming event (its picture), a trailer (YouTube thumbnail with a play button), a merch item (product photo) and the daily challenge (a blurred mystery picture with a "?"). The feed only uses the fandoms you picked. |
| **Scroll gallery** | Fandom cards that move into place as you scroll down; hover a card to flip it. |
| **Categories** | The seven fandoms: Anime, Gaming, Movies, TV Shows, K-Pop, Comics and Manga. Each opens its own hub. |
| **Poster wall** | A tilted wall of posters that slides across the screen. Clicking a poster opens its category. |
| **Featured articles, Popular characters, Upcoming timeline, Featured merchandise** | Short previews that link to the full pages. |

### Articles (`articles.html`)
Fan articles from every fandom. You can filter by category and bookmark articles. Opening an article shows the full story, a large poster and related articles. Reading an article gives **+10 XP** the first time.

### Characters (`characters.html`)
Every character, grouped by fandom, with filters.
- **3D models:** 9 characters have a real 3D model (Yuji, Gojo, Megumi, Goku, Vegeta, Batman, Spider-Man, Iron Man, Thanos). Hovering over a card turns the character round. While the pictures load, a small spinner shows, and each character fades in once its picture is ready.

### Character page (`character.html?id=...`)
The profile of one character.
- **3D model:** drag to turn it all the way round. It spins slowly by itself; on weak devices the auto-spin and shadow are off so it stays smooth.
- **Voice:** press play and the character introduces themselves. The words appear on screen as they are spoken. The platform under the character glows with the voice on computers. On phones the voice plays directly, so it is heard even when an iPhone is on silent.
- **Buttons:** More from this fandom, Match my personality, Save image, and Upload sheet (to show your own picture of the character).
- Opening a character gives **+5 XP** the first time.

### Category hub (`category.html?cat=...`)
One page for each of the seven fandoms (Anime, Gaming, Movies, TV Shows, K-Pop, Comics, Manga).
- **Banner:** a wide strip of four official scenes from that fandom (for example four PUBG battle scenes on Gaming, RM, Jimin and V of BTS on K-Pop, Luffy and Sanji on Manga), with the fandom's icon, name, tagline and counts of articles, characters and events.
- **Tabs:** Articles (with a sort menu), Gallery (eight official pictures of that fandom: trailer stills, posters and character art; click one to open it large), Characters, Events, Media, Merchandise and Posters.
- Visiting a category gives **+5 XP** the first time.

### Events (`events.html`)
- **Events list:** real fandom events, filtered by fandom: New York Comic Con 2026 (8–11 Oct, Javits Center), Grand Theft Auto VI launch day (19 Nov 2026), Avengers: Doomsday premiere week (18 Dec 2026), Jump Festa 2027 (19–20 Dec 2026, Makuhari Messe, Japan), Gamescom 2026 (26–30 Aug, Cologne), Spider-Man: Brand New Day opening weekend (31 Jul 2026), San Diego Comic-Con 2026 (23–26 Jul), Anime Expo 2026 (2–5 Jul, Los Angeles), the BTS ARIRANG world tour opening (9 Apr 2026, Goyang) and the Stranger Things finale in cinemas (31 Dec 2025). Each card has its own picture and a badge: green "Upcoming · in N days", red "Today" or grey "Past event". Upcoming events are listed first, then past ones (newest first).
- **Release calendar:** officially announced release dates (films, seasons, games and albums), for example GTA VI on 19 Nov 2026, Avengers: Doomsday on 18 Dec 2026 and The Batman Part II on 1 Oct 2027. The header shows the month and how many releases it has, with a **Today** button and previous/next arrows. Fandom chips filter the calendar; choosing a fandom jumps to the month of its next release. Each release day shows an icon for its type (film strip, book, TV, controller, music note, box) in the fandom's colour; today has a red circle and past days are faded. Clicking a day lists its releases on the right.
- **Next up list:** each release shows the weekday and date, its type with an icon, where it comes out, and a countdown ("In 5 days"; red when it is within a week).
- **Remind me:** a bell button on every upcoming release. The reminder is saved in the browser, and a note pops up on any page the day before and on the day of the release.
- Dates use the visitor's local calendar, so "today" changes at local midnight. Studios sometimes move dates.

### Media (`trailers.html`)
Official trailers and interviews, filtered by fandom and type. A video plays from a local clip when one is available, and otherwise from YouTube. Each video has a **Watchlist** button (the saved list appears on the profile).

### Merchandise (`merchandise.html`)
The shop.
- **Search** by name, **sort** (featured, top rated, biggest discount, price low to high or high to low), and filter by fandom.
- Each product shows a rating, sale price and "Fan favourite" label where it applies.
- **Wishlist:** the heart on a product saves it; the "My wishlist" button shows only saved items.
- **Add to cart** goes to the cart and demo checkout.

### Play (`play.html`)
The games hub. Every game gives XP.

| Game | How it works |
|---|---|
| **Personality Match** | Opens the Match page (below). |
| **Character Battle** | Opens the Battle page (below). |
| **Daily Challenge** | Guess the day's character from three clues. The picture on the right starts very blurred and gets sharper after each wrong guess; a wrong guess also unlocks the next clue. The character is the same for everyone on the same day and changes every day. Solving it gives **+20 XP** and builds a streak. |
| **Surprise Me** | One click picks a random fandom and character, then suggests an article to read, a video to watch and the fandom hub. It has buttons to open the character or match with them. |
| **Universe Map** | Opens the Map page (below). |

### Personality Match (`match.html`)
Pick any character, tell the site about yourself, and scan how alike you are.
1. **Pick a character** (search or filter by fandom).
2. **Describe yourself:** answer eight lines (Not me → Totally me) and/or type a description. The text box looks for personality words such as *brave, funny, calm, loyal, confident*.
3. **Scan:** the result shows your picture and name next to the character, the match percentage, and a meter from *Very low* to *Very high*. Each of the eight traits (Bravery, Kindness, Humour, Strategy, Calmness, Confidence, Loyalty, Energy) has a track with your dot and the character's dot. The result also lists where you click, where you differ, and your closest character overall.

**How the score works:** each character has a score from 0 to 10 for all eight traits. Your answers are compared with them, and an answer on the button nearest to the character's value counts as a full match, so the right answers can reach 100%. Traits you did not answer are left out ("Based on 5 of 8 traits"). Empty input or text with no personality words is not scanned; the page asks for more instead. A scan gives **+10 XP**.

### Character Battle (`battle.html`)
- **1 vs 1:** pick two fighters (or use Random matchup), tap the one you think will win, then press Fight. Five rounds (Power, Speed, Smarts, Defense, Skill) decide the winner, and the button then changes to **Next battle**. Your record of right calls is kept. A right call gives **+15 XP**, and a wrong one gives +5.
- **Tournament:** eight fighters. You predict the champion, then the stats decide every match: quarter-finals, semi-finals and the final, with each score shown. A right prediction gives **+25 XP**.

### Universe Map (`map.html`)
The seven fandoms orbit FandomVerse as planets. Hovering pauses the orbit. Clicking a planet flies in: its characters circle it as moons, and clicking a moon opens that character. The map also shows the fandom's counts (characters, articles, videos, events) and a button to its hub.

### Profile (`profile.html`, logged-in only)
- **Account:** display name, profile picture (upload or link), cover banner, accent colour and light/dark mode.
- **Fan level:** your level, XP bar, the next rank, and stats (characters seen, articles read, battles won, best match). The last character you viewed shows faded in the background.
- **My fandoms:** pick favourites for the home feed.
- **My watchlist:** trailers you saved.
- **Badges:** ten badges, each with a progress bar (for example "Character Collector 3 / 10").
- **Orders:** the order history from checkout.

**Levels and badges:** XP comes from exploring and playing. Levels go Newcomer → Fan → Explorer → Enthusiast → Lore Keeper → Superfan → Legend → Multiverse Master. Badges: First Steps, Fandom Explorer, Character Collector, Lore Master, Soul Match, Battle Champion, Tournament Winner, Daily Hero, Feeling Lucky and Superfan.

### Bookmarks (`bookmarks.html`)
Every article and character you bookmarked, in one place.

### Log in / Sign up (`login.html`, `signup.html`)
- Every field is checked with clear messages (valid email, password strength, matching passwords).
- **Remember me** keeps you logged in and fills your email next time. The browser can also offer to save the password.
- **Forgot password** lets you set a new password.
- Passwords are never stored as they are typed: only a secure hash (SHA-256) is saved.

### Contact (`contact.html`)
A feedback form with a star rating. Name, email and message are checked before sending. For logged-in visitors, name and email are filled in automatically.

### About, Privacy, Accessibility
- **About:** what FandomVerse is, what makes it different, how it was built and the technology used.
- **Privacy:** what the site stores and where. A live panel shows your own saved data, and one button deletes all of it.
- **Accessibility:** settings for the whole site: text size, high contrast, reduce motion, underline links, easier reading spacing, and performance mode (Auto / Lite / Full).

---

## 3. Where things are saved

FandomVerse has **no database**. Everything a visitor creates stays in their own browser (localStorage), separately for each account:

| Saved item | Examples |
|---|---|
| Account | Name, email, password hash, profile picture, cover, colour |
| Activity | Cart, orders, bookmarks, wishlist, watchlist, reminders |
| Games | XP, level, badges, battle record, daily-challenge streak, last match |
| Settings | Theme, accessibility options, performance mode |

The AI keys are the only secret. They live on the server (`.server/ai-key.txt` locally, and an environment variable on Vercel) and are never sent to the browser or uploaded to GitHub.

---

## 4. How the site runs

| Where | How |
|---|---|
| **This PC / any PC** | `START-WEBSITE.bat` starts the built-in Python server (a portable Python is included, so nothing needs to be installed) and opens the site. The AI works through that server. |
| **Vercel** | The whole site plus the AI server run online at https://fandomverse-nu.vercel.app. |
| **GitHub Pages** | The website is at https://farmandevstudio.github.io/FandomVerse/. Its AI chat asks the Vercel server, so the keys stay safe there. |

**Built with:** HTML5, CSS3, JavaScript (ES6), JSON data files, model-viewer for 3D, the Web Speech API (voice input and speech), the Web Audio API, and a small Python server for the AI.

---

## 5. Small details

- **Logo:** a white "F" with a red orbit ring and a small four-point star, on the header, footer, loading screen and browser tab. In light mode the white parts turn dark.
- **Site colour:** red (#e8382f). Users can pick another accent colour on their profile; "Reset" brings back red.
- **Daily Challenge:** a new character every day at local midnight, chosen from the date, so everyone sees the same one. Wrong guesses reveal the next clue and sharpen the picture; after three wrong guesses the answer is shown. The streak grows when you solve it on consecutive days and resets if you miss a day.
- **XP levels:** level 2 needs 100 XP; each next level needs about 35% more than the last. Levels: Newcomer, Fan, Explorer, Enthusiast, Lore Keeper, Superfan, Legend, Multiverse Master.
- **XP amounts:** open a character +5, visit a category +5, read an article +10, Personality Match +10, battle +5 (a right call +15), right tournament prediction +25, daily challenge +20, Surprise Me +2 (first five times).
- **Badges:** First Steps (first XP), Fandom Explorer (all 7 categories), Character Collector (10 character profiles), Lore Master (10 articles), Soul Match (80% or more in Personality Match), Battle Champion (10 right battle calls), Tournament Winner (predict a champion), Daily Hero (3 daily challenges), Feeling Lucky (Surprise Me 5 times), Superfan (1,000 XP).
- **Battle stats:** every fighter has Power, Speed, Smarts, Defense and Skill out of 100. The winner takes most of the five rounds; on a tie the higher total wins. BTS members are not in battles because they are real people.
- **Personality Match traits:** Bravery, Kindness, Humour, Strategy, Calmness, Confidence, Loyalty, Energy, each 0–10 per character.
- **Characters:** 33 characters across the seven fandoms; 9 have 3D models and recorded voices (Yuji Itadori, Satoru Gojo, Megumi Fushiguro, Goku, Vegeta, Batman, Spider-Man, Iron Man, Thanos).
- **Pictures:** character pictures are 640–800 px wide; category banners and galleries use official trailer stills, posters and character art.
- **Accounts:** made in the browser (no server database). A password needs at least 6 characters; the strength meter shows Weak, Fair, Good or Strong.
- **Checkout:** demo only; card numbers are checked for format but no payment is taken. Prices are in Pakistani rupees (PKR).
- **Links:** live site https://fandomverse-nu.vercel.app and https://farmandevstudio.github.io/FandomVerse/. The GitHub copy's AI chat uses the Vercel server so the keys stay private.
- **Made for:** the TechWiz7 competition, theme "Fandom Universe · Web Innovation Unleashed".
