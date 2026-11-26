
/* =====================================================
   ANIMENOONA — PROFESSIONAL 3D ANIME WEBSITE
   Anime Library • Player • Subtitles • Auth • Admin
===================================================== */

/* 1. SUPABASE CONFIGURATION
   Add your existing Supabase project details here.
*/
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_KEY = "YOUR_SUPABASE_PUBLISHABLE_KEY";

/* Update these names to match your EXISTING Supabase setup. */
const DB_TABLE = "anime";
const STORAGE_BUCKET = "anime-media";

/* =====================================================
   2. INITIALIZATION
===================================================== */

let db = null;
let currentUser = null;
let animeList = [];
let watchlist = JSON.parse(localStorage.getItem("an_watchlist") || "[]");
let continueList = JSON.parse(localStorage.getItem("an_continue") || "[]");
let activeAnime = null;
let activeSubtitle = null;

const $ = (id) => document.getElementById(id);

const el = {
  menuBtn: $("menuBtn"),
  mainNav: $("mainNav"),
  user: $("user"),
  logoutBtn: $("logoutBtn"),

  exploreBtn: $("exploreBtn"),
  heroWatchBtn: $("heroWatchBtn"),

  searchInput: $("searchInput"),
  genreFilter: $("genreFilter"),
  languageFilter: $("languageFilter"),
  animeGrid: $("animeGrid"),
  animeCount: $("animeCount"),
  libraryMessage: $("libraryMessage"),

  continueGrid: $("continueGrid"),
  watchlistGrid: $("watchlistGrid"),

  animeVideo: $("animeVideo"),
  playerTitle: $("playerTitle"),
  nowPlayingTitle: $("nowPlayingTitle"),
  playerDescription: $("playerDescription"),
  episodeSelect: $("episodeSelect"),
  subtitleSelect: $("subtitleSelect"),
  subtitleStatus: $("subtitleStatus"),
  playerMessage: $("playerMessage"),

  loginPanel: $("loginPanel"),
  resetPanel: $("resetPanel"),
  accountUser: $("accountUser"),
  emailInput: $("emailInput"),
  passwordInput: $("passwordInput"),
  signupBtn: $("signupBtn"),
  loginBtn: $("loginBtn"),
  forgotBtn: $("forgotBtn"),
  updatePasswordBtn: $("updatePasswordBtn"),
  newPassword: $("newPassword"),
  confirmPassword: $("confirmPassword"),
  accountMessage: $("accountMessage"),
  resetMessage: $("resetMessage"),

  adminDashboard: $("adminDashboard"),
  adminStatus: $("adminStatus"),
  uploadForm: $("uploadForm"),
  uploadTitle: $("uploadTitle"),
  uploadDescription: $("uploadDescription"),
  uploadGenre: $("uploadGenre"),
  uploadLanguage: $("uploadLanguage"),
  uploadEpisode: $("uploadEpisode"),
  uploadVideo: $("uploadVideo"),
  uploadPoster: $("uploadPoster"),
  uploadButton: $("uploadButton"),
  uploadMessage: $("uploadMessage"),

  subtitleAnimeSelect: $("subtitleAnimeSelect"),
  subtitleLanguageUpload: $("subtitleLanguageUpload"),
  subtitleFileUpload: $("subtitleFileUpload"),
  subtitleUploadButton: $("subtitleUploadButton"),
  subtitleUploadMessage: $("subtitleUploadMessage")
};

function say(node, message, error = false) {
  if (!node) return;
  node.textContent = message;
  node.style.color = error ? "#ff6b91" : "#c9a7ff";
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function makeId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function initializeSupabase() {
  if (
    !SUPABASE_URL.startsWith("https://") ||
    SUPABASE_KEY.includes("YOUR_SUPABASE")
  ) {
    console.warn("Supabase details not configured. Demo mode enabled.");
    return;
  }

  try {
    const { createClient } = await import(
      "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm"
    );

    db = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data } = await db.auth.getSession();
    currentUser = data.session?.user || null;

    db.auth.onAuthStateChange((_event, session) => {
      currentUser = session?.user || null;
      updateAccountUI();
      checkAdmin();
    });
  } catch (error) {
    console.error("Supabase initialization failed:", error);
  }
}

/* =====================================================
   3. DEMO ANIME DATA
   Used only when Supabase is not configured.
===================================================== */

const demoAnime = [
  {
    id: "demo-1",
    title: "Demon Slayer",
    description: "Tanjiro begins an incredible journey to save his sister.",
    genre: "Action",
    language: "Hindi Dub",
    poster_url: "",
    video_url: "",
    episode: 1
  },
  {
    id: "demo-2",
    title: "Jujutsu Kaisen",
    description: "A world of curses, sorcerers and powerful battles.",
    genre: "Action",
    language: "Japanese",
    poster_url: "",
    video_url: "",
    episode: 1
  },
  {
    id: "demo-3",
    title: "Your Name",
    description: "Two strangers discover a mysterious connection.",
    genre: "Romance",
    language: "Hindi Sub",
    poster_url: "",
    video_url: "",
    episode: 1
  },
  {
    id: "demo-4",
    title: "One Piece",
    description: "Join Luffy and his crew on their grand adventure.",
    genre: "Adventure",
    language: "Japanese",
    poster_url: "",
    video_url: "",
    episode: 1
  }
];

/* =====================================================
   4. LOAD ANIME
===================================================== */

async function loadAnime() {
  if (!db) {
    animeList = [...demoAnime];
    renderAnime();
    renderContinueWatching();
    renderWatchlist();
    return;
  }

  say(el.libraryMessage, "Loading anime...");

  const { data, error } = await db
    .from(DB_TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    say(el.libraryMessage, "Could not load anime. Check your table configuration.", true);
    return;
  }

  animeList = data || [];
  renderAnime();
  renderContinueWatching();
  renderWatchlist();
}

/* =====================================================
   5. ANIME CARDS
===================================================== */

function animeCard(anime) {
  const title = escapeHTML(anime.title || "Untitled Anime");
  const description = escapeHTML(anime.description || "");
  const genre = escapeHTML(anime.genre || "Anime");
  const language = escapeHTML(anime.language || "Japanese");

  const poster = anime.poster_url
    ? `style="background-image:url('${escapeHTML(anime.poster_url)}')"`
    : "";

  return `
    <article class="anime-card" data-id="${escapeHTML(anime.id)}">
      <div class="anime-poster" ${poster}>
        ${!anime.poster_url ? `<span class="poster-placeholder">ANIME</span>` : ""}
        <span class="anime-tag">${language}</span>
        <button class="watch-now" data-play="${escapeHTML(anime.id)}">
          ▶ Watch Now
        </button>
      </div>

      <div class="anime-info">
        <h3>${title}</h3>
        <p>${description}</p>
        <div class="anime-meta">
          <span>${genre}</span>
          <button class="save-anime" data-save="${escapeHTML(anime.id)}">
            ${watchlist.includes(anime.id) ? "♥ Saved" : "♡ Watchlist"}
          </button>
        </div>
      </div>
    </article>
  `;
}

function renderAnime() {
  if (!el.animeGrid) return;

  const search = (el.searchInput?.value || "").toLowerCase();
  const genre = el.genreFilter?.value || "all";
  const language = el.languageFilter?.value || "all";

  const filtered = animeList.filter(anime => {
    const matchesSearch =
      (anime.title || "").toLowerCase().includes(search);

    const matchesGenre =
      genre === "all" ||
      (anime.genre || "").toLowerCase() === genre.toLowerCase();

    const matchesLanguage =
      language === "all" ||
      (anime.language || "").toLowerCase() === language.toLowerCase();

    return matchesSearch && matchesGenre && matchesLanguage;
  });

  el.animeGrid.innerHTML = filtered.length
    ? filtered.map(animeCard).join("")
    : `<p class="empty-message">No anime found. Try another search.</p>`;

  if (el.animeCount) {
    el.animeCount.textContent = `${filtered.length} Anime`;
  }

  say(el.libraryMessage, "");
}

/* =====================================================
   6. WATCHLIST
===================================================== */

function saveWatchlist() {
  localStorage.setItem("an_watchlist", JSON.stringify(watchlist));
}

function toggleWatchlist(id) {
  if (watchlist.includes(id)) {
    watchlist = watchlist.filter(item => item !== id);
  } else {
    watchlist.push(id);
  }

  saveWatchlist();
  renderAnime();
  renderWatchlist();
}

function renderWatchlist() {
  if (!el.watchlistGrid) return;

  const items = animeList.filter(anime => watchlist.includes(anime.id));

  el.watchlistGrid.innerHTML = items.length
    ? items.map(animeCard).join("")
    : `<p class="empty-message">Your watchlist is empty.</p>`;
}

/* =====================================================
   7. CONTINUE WATCHING
===================================================== */

function saveProgress(anime) {
  const item = {
    id: anime.id,
    title: anime.title,
    poster_url: anime.poster_url || "",
    updated: Date.now()
  };

  continueList = [
    item,
    ...continueList.filter(x => x.id !== anime.id)
  ].slice(0, 10);

  localStorage.setItem("an_continue", JSON.stringify(continueList));
  renderContinueWatching();
}

function renderContinueWatching() {
  if (!el.continueGrid) return;

  const items = continueList
    .map(item => animeList.find(anime => anime.id === item.id) || item);

  el.continueGrid.innerHTML = items.length
    ? items.map(animeCard).join("")
    : `<p class="empty-message">Your watch history will appear here.</p>`;
}

/* =====================================================
   8. ANIME PLAYER
===================================================== */

function playAnime(id) {
  const anime = animeList.find(item => String(item.id) === String(id));
  if (!anime) return;

  activeAnime = anime;

  if (el.playerTitle) el.playerTitle.textContent = anime.title;
  if (el.nowPlayingTitle) el.nowPlayingTitle.textContent = anime.title;
  if (el.playerDescription) {
    el.playerDescription.textContent = anime.description || "";
  }

  if (el.animeVideo) {
    el.animeVideo.pause();
    el.animeVideo.removeAttribute("src");
    el.animeVideo.load();

    if (anime.video_url) {
      el.animeVideo.src = anime.video_url;
      el.animeVideo.load();
    } else {
      say(el.playerMessage, "No video URL available for this anime.", true);
    }
  }

  saveProgress(anime);
  loadSubtitleOptions(anime);
  document.getElementById("player")?.scrollIntoView({ behavior: "smooth" });
}

if (el.animeVideo) {
  el.animeVideo.addEventListener("timeupdate", () => {
    if (activeAnime) saveProgress(activeAnime);
  });
}

/* =====================================================
   9. SUBTITLE SYSTEM
   Supported: Japanese, English, Hindi, Hinglish
===================================================== */

const subtitleLanguages = {
  "Japanese": "ja",
  "English": "en",
  "Hindi": "hi",
  "Hinglish (Roman)": "hi-Latn"
};

function loadSubtitleOptions(anime) {
  if (!el.subtitleSelect) return;

  el.subtitleSelect.innerHTML = `
    <option value="">Subtitles Off</option>
    <option value="Japanese">Japanese</option>
    <option value="English">English</option>
    <option value="Hindi">Hindi (देवनागरी)</option>
    <option value="Hinglish (Roman)">Hinglish (Roman)</option>
  `;

  el.subtitleSelect.value = "";
  removeSubtitleTracks();
  say(el.subtitleStatus, "Choose your subtitle language.");
}

function removeSubtitleTracks() {
  if (!el.animeVideo) return;

  el.animeVideo.querySelectorAll("track").forEach(track => track.remove());

  for (let i = 0; i < el.animeVideo.textTracks.length; i++) {
    el.animeVideo.textTracks[i].mode = "disabled";
  }
}

function selectSubtitle(language) {
  removeSubtitleTracks();

  if (!language) {
    say(el.subtitleStatus, "Subtitles off.");
    return;
  }

  if (!activeAnime) {
    say(el.subtitleStatus, "Play an anime first.", true);
    return;
  }

  const subtitleMap = activeAnime.subtitles || {};
  const subtitleUrl = subtitleMap[language];

  if (!subtitleUrl) {
    say(el.subtitleStatus, `${language} subtitles are not uploaded yet.`, true);
    return;
  }

  const track = document.createElement("track");
  track.kind = "subtitles";
  track.label = language;
  track.srclang = subtitleLanguages[language] || "en";
  track.src = subtitleUrl;
  track.default = true;

  el.animeVideo.appendChild(track);

  track.addEventListener("load", () => {
    for (let i = 0; i < el.animeVideo.textTracks.length; i++) {
      el.animeVideo.textTracks[i].mode = "disabled";
    }

    const tracks = el.animeVideo.textTracks;
    if (tracks.length) tracks[tracks.length - 1].mode = "showing";
  });

  say(el.subtitleStatus, `${language} subtitles selected.`);
}

/* =====================================================
   10. EPISODE SELECTOR
===================================================== */

if (el.episodeSelect) {
  el.episodeSelect.addEventListener("change", () => {
    if (!activeAnime) return;

    const episode = el.episodeSelect.value;
    const episodes = activeAnime.episodes || [];
    const selected = episodes.find(item => String(item.episode) === episode);

    if (selected?.video_url && el.animeVideo) {
      el.animeVideo.src = selected.video_url;
      el.animeVideo.load();
      el.animeVideo.play().catch(() => {});
    } else {
      say(el.playerMessage, "Episode video is not available.", true);
    }
  });
}

/* =====================================================
   11. LOGIN / SIGNUP
===================================================== */

async function account(mode) {
  if (!db) {
    say(el.accountMessage, "Connect Supabase to enable accounts.", true);
    return;
  }

  const email = el.emailInput?.value.trim();
  const password = el.passwordInput?.value || "";

  if (!email || !password) {
    say(el.accountMessage, "Enter email and password.", true);
    return;
  }

  say(el.accountMessage, "Please wait...");

  let result;

  if (mode === "signup") {
    result = await db.auth.signUp({ email, password });
  } else {
    result = await db.auth.signInWithPassword({ email, password });
  }

  if (result.error) {
    say(el.accountMessage, result.error.message, true);
    return;
  }

  currentUser = result.data.user;
  say(
    el.accountMessage,
    mode === "signup"
      ? "Signup successful. Check your email if confirmation is required."
      : "Login successful."
  );

  updateAccountUI();
  checkAdmin();
}

async function logout() {
  if (!db) return;

  const { error } = await db.auth.signOut();

  if (error) {
    say(el.accountMessage, error.message, true);
    return;
  }

  currentUser = null;
  updateAccountUI();
  checkAdmin();
}

function updateAccountUI() {
  if (el.accountUser) {
    el.accountUser.textContent = currentUser
      ? currentUser.email
      : "Guest User";
  }

  if (el.loginPanel) {
    el.loginPanel.style.display = currentUser ? "none" : "";
  }

  if (el.logoutBtn) {
    el.logoutBtn.style.display = currentUser ? "" : "none";
  }
}

/* =====================================================
   12. FORGOT PASSWORD
===================================================== */

async function forgotPassword() {
  const email = el.emailInput?.value.trim();

  if (!db || !email) {
    say(el.accountMessage, "Enter your email first.", true);
    return;
  }

  const { error } = await db.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin
  });

  say(
    el.accountMessage,
    error ? error.message : "Password reset link sent to your email.",
    !!error
  );
}

async function updatePassword() {
  const password = el.newPassword?.value || "";
  const confirm = el.confirmPassword?.value || "";

  if (!db || !password || password !== confirm) {
    say(el.resetMessage, "Passwords do not match.", true);
    return;
  }

  const { error } = await db.auth.updateUser({ password });

  say(
    el.resetMessage,
    error ? error.message : "Password updated successfully.",
    !!error
  );
}

/* =====================================================
   13. ADMIN ACCESS
   Configure your own admin email or secure database policy.
===================================================== */

const ADMIN_EMAILS = [
  "YOUR_ADMIN_EMAIL@example.com"
];

function checkAdmin() {
  const isAdmin =
    !!currentUser &&
    ADMIN_EMAILS.includes(currentUser.email);

  if (el.adminDashboard) {
    el.adminDashboard.style.display = isAdmin ? "block" : "none";
  }

  if (el.adminStatus) {
    el.adminStatus.textContent = isAdmin
      ? "Admin access enabled"
      : "Admin access required";
  }

  return isAdmin;
}

/* =====================================================
   14. STORAGE UPLOAD
===================================================== */

async function uploadFile(file, folder) {
  if (!db) throw new Error("Supabase is not connected.");

  const extension = file.name.split(".").pop();
  const path = `${folder}/${Date.now()}-${makeId()}.${extension}`;

  const { error } = await db.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { upsert: false });

  if (error) throw error;

  const { data } = db.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}

/* =====================================================
   15. ADMIN ANIME UPLOAD
   Expected table fields must match your real schema.
===================================================== */

async function uploadAnime(event) {
  event?.preventDefault();

  if (!checkAdmin()) {
    say(el.uploadMessage, "Admin access required.", true);
    return;
  }

  if (!db) {
    say(el.uploadMessage, "Supabase is not connected.", true);
    return;
  }

  const title = el.uploadTitle?.value.trim();
  const description = el.uploadDescription?.value.trim();
  const genre = el.uploadGenre?.value;
  const language = el.uploadLanguage?.value;
  const episode = Number(el.uploadEpisode?.value || 1);
  const videoFile = el.uploadVideo?.files?.[0];
  const posterFile = el.uploadPoster?.files?.[0];

  if (!title || !videoFile) {
    say(el.uploadMessage, "Anime title and video are required.", true);
    return;
  }

  try {
    say(el.uploadMessage, "Uploading files...");

    const videoUrl = await uploadFile(videoFile, "videos");
    const posterUrl = posterFile
      ? await uploadFile(posterFile, "posters")
      : "";

    const record = {
      title,
      description,
      genre,
      language,
      episode,
      video_url: videoUrl,
      poster_url: posterUrl
    };

    const { error } = await db.from(DB_TABLE).insert(record);

    if (error) throw error;

    say(el.uploadMessage, "Anime uploaded successfully!");
    el.uploadForm?.reset();
    await loadAnime();

  } catch (error) {
    console.error(error);
    say(el.uploadMessage, error.message, true);
  }
}

/* =====================================================
   16. SUBTITLE FILE UPLOAD
   Uploads VTT files to Supabase Storage.
   Saving the URL into a subtitle database column
   requires your actual table schema.
===================================================== */

async function uploadSubtitle() {
  if (!checkAdmin()) {
    say(el.subtitleUploadMessage, "Admin access required.", true);
    return;
  }

  if (!db) {
    say(el.subtitleUploadMessage, "Supabase is not connected.", true);
    return;
  }

  const file = el.subtitleFileUpload?.files?.[0];
  const animeId = el.subtitleAnimeSelect?.value;
  const language = el.subtitleLanguageUpload?.value;

  if (!file || !animeId || !language) {
    say(el.subtitleUploadMessage, "Choose anime, language and VTT file.", true);
    return;
  }

  if (!file.name.toLowerCase().endsWith(".vtt")) {
    say(el.subtitleUploadMessage, "Please upload a .vtt subtitle file.", true);
    return;
  }

  try {
    const url = await uploadFile(file, `subtitles/${animeId}`);

    say(
      el.subtitleUploadMessage,
      `Subtitle uploaded. URL: ${url}`
    );

    console.info("Subtitle URL to save in your anime record:", {
      animeId,
      language,
      url
    });

  } catch (error) {
    say(el.subtitleUploadMessage, error.message, true);
  }
}

/* =====================================================
   17. SUBTITLE ANIME DROPDOWN
===================================================== */

function renderSubtitleAnimeSelect() {
  if (!el.subtitleAnimeSelect) return;

  el.subtitleAnimeSelect.innerHTML = animeList.map(anime => `
    <option value="${escapeHTML(anime.id)}">
      ${escapeHTML(anime.title)}
    </option>
  `).join("");
}

/* =====================================================
   18. CLICK EVENTS
===================================================== */

document.addEventListener("click", event => {
  const playButton = event.target.closest("[data-play]");
  const saveButton = event.target.closest("[data-save]");
  const genreButton = event.target.closest("[data-genre]");

  if (playButton) {
    playAnime(playButton.dataset.play);
  }

  if (saveButton) {
    toggleWatchlist(saveButton.dataset.save);
  }

  if (genreButton && el.genreFilter) {
    el.genreFilter.value = genreButton.dataset.genre;
    renderAnime();
    document.getElementById("library")?.scrollIntoView({
      behavior: "smooth"
    });
  }
});

/* =====================================================
   19. NAVIGATION & FILTER EVENTS
===================================================== */

el.menuBtn?.addEventListener("click", () => {
  el.mainNav?.classList.toggle("active");
});

el.mainNav?.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    el.mainNav.classList.remove("active");
  });
});

el.searchInput?.addEventListener("input", renderAnime);
el.genreFilter?.addEventListener("change", renderAnime);
el.languageFilter?.addEventListener("change", renderAnime);

el.exploreBtn?.addEventListener("click", () => {
  document.getElementById("library")?.scrollIntoView({ behavior: "smooth" });
});

el.heroWatchBtn?.addEventListener("click", () => {
  if (animeList.length) playAnime(animeList[0].id);
});

el.subtitleSelect?.addEventListener("change", event => {
  selectSubtitle(event.target.value);
});

el.signupBtn?.addEventListener("click", () => account("signup"));
el.loginBtn?.addEventListener("click", () => account("login"));
el.logoutBtn?.addEventListener("click", logout);
el.forgotBtn?.addEventListener("click", forgotPassword);
el.updatePasswordBtn?.addEventListener("click", updatePassword);

el.uploadForm?.addEventListener("submit", uploadAnime);
el.subtitleUploadButton?.addEventListener("click", uploadSubtitle);

/* =====================================================
   20. START WEBSITE
===================================================== */

async function startAnimeNoona() {
  await initializeSupabase();
  updateAccountUI();
  await loadAnime();
  renderSubtitleAnimeSelect();
  checkAdmin();

  console.log("AnimeNoona initialized.");
}

startAnimeNoona();
