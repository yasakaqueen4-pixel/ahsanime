
/* =====================================================
   ANIMENOONA ♡ — COMPLETE WEBSITE APP
   Supabase • Login • Signup • Admin • Anime Upload
   Anime Library • Episodes • Subtitles • Watchlist
===================================================== */

/* 1. SUPABASE CONFIGURATION */

const SUPABASE_URL = "https://yvfstkkcetyavpzqytde.supabase.co";

const SUPABASE_KEY = "sb_publishable_NgpGgHlXHz_DdJfsRLA6Ug_InIZwy8D";

const DB_TABLE = "anime_uploads";
const ADMIN_TABLE = "admin_users";
const STORAGE_BUCKET = "anime-media";

/* =====================================================
   2. GLOBAL VARIABLES
===================================================== */

let db = null;
let currentUser = null;
let isAdmin = false;

let animeList = [];
let activeAnime = null;
let activeEpisode = null;

let lastProgressSave = 0;

let watchlist = JSON.parse(
  localStorage.getItem("an_watchlist") || "[]"
);

let continueList = JSON.parse(
  localStorage.getItem("an_continue") || "[]"
);

let subtitleLibrary = JSON.parse(
  localStorage.getItem("an_subtitles") || "{}"
);

/* =====================================================
   3. HTML ELEMENTS
===================================================== */

const $ = id => document.getElementById(id);

const el = {
  menuBtn: $("menuBtn"),
  mainNav: $("mainNav"),
  user: $("user"),
  logoutBtn: $("logoutBtn"),
  headerLoginBtn: $("headerLoginBtn"),

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
  accountInfo: $("accountInfo"),
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

/* =====================================================
   4. HELPER FUNCTIONS
===================================================== */

function say(element, message, error = false) {
  if (!element) return;

  element.textContent = message;

  element.style.color = error
    ? "#ff6b91"
    : "#d9aaff";
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

function safeURL(value = "") {
  try {
    const url = new URL(value, window.location.href);

    if (
      url.protocol === "https:" ||
      url.protocol === "http:"
    ) {
      return url.href;
    }

    return "";
  } catch {
    return "";
  }
}

function makeId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function saveLocalData() {
  localStorage.setItem(
    "an_watchlist",
    JSON.stringify(watchlist)
  );

  localStorage.setItem(
    "an_continue",
    JSON.stringify(continueList)
  );

  localStorage.setItem(
    "an_subtitles",
    JSON.stringify(subtitleLibrary)
  );
}

/* =====================================================
   5. SUPABASE INITIALIZATION
===================================================== */

async function initializeSupabase() {
  try {
    const { createClient } = await import(
      "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm"
    );

    db = createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );

    const { data, error } = await db.auth.getSession();

    if (error) throw error;

    currentUser = data.session?.user || null;

    db.auth.onAuthStateChange((event, session) => {
      currentUser = session?.user || null;

      updateAccountUI();

      checkAdmin();

      if (event === "PASSWORD_RECOVERY") {
        if (el.resetPanel) {
          el.resetPanel.hidden = false;
        }

        if (el.loginPanel) {
          el.loginPanel.hidden = true;
        }

        document.getElementById("account")?.scrollIntoView({
          behavior: "smooth"
        });
      }
    });

    updateAccountUI();

    await checkAdmin();

    console.log("AnimeNoona Supabase connected.");

  } catch (error) {
    console.error("Supabase connection error:", error);

    say(
      el.libraryMessage,
      "Supabase connection failed: " + error.message,
      true
    );
  }
}

/* =====================================================
   6. LOAD ANIME FROM SUPABASE
===================================================== */

async function loadAnime() {
  if (!db) return;

  say(el.libraryMessage, "Loading anime...");

  try {
    const { data, error } = await db
      .from(DB_TABLE)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    animeList = groupAnime(data || []);

    renderAll();

    say(
      el.libraryMessage,
      animeList.length
        ? ""
        : "No anime uploaded yet."
    );

  } catch (error) {
    console.error("Anime loading error:", error);

    say(
      el.libraryMessage,
      error.message,
      true
    );
  }
}

/* =====================================================
   7. GROUP EPISODES BY ANIME TITLE
===================================================== */

function groupAnime(rows) {
  const groups = new Map();

  rows.forEach(row => {
    const title = String(row.title || "").trim();

    if (!title) return;

    const key = title.toLowerCase();

    if (!groups.has(key)) {
      groups.set(key, {
        id: row.id,
        title,
        description: row.description || "",
        genre: row.genre || "Anime",
        language: row.language || "Japanese",
        poster_url: row.poster_url || "",
        episodes: []
      });
    }

    const anime = groups.get(key);

    anime.episodes.push({
      id: row.id,
      episode: Number(row.episode || 1),
      title: row.title,
      description: row.description || "",
      video_url: row.video_url || "",
      language: row.language || "Japanese"
    });

    if (!anime.poster_url && row.poster_url) {
      anime.poster_url = row.poster_url;
    }
  });

  return [...groups.values()].map(anime => ({
    ...anime,
    episodes: anime.episodes.sort(
      (a, b) => a.episode - b.episode
    )
  }));
}

function renderAll() {
  renderAnime();
  renderContinueWatching();
  renderWatchlist();
  renderSubtitleAnimeSelect();
}

/* =====================================================
   8. ANIME CARD
===================================================== */

function animeCard(anime) {
  const id = escapeHTML(anime.id);
  const title = escapeHTML(anime.title);
  const description = escapeHTML(anime.description || "");
  const genre = escapeHTML(anime.genre || "Anime");
  const language = escapeHTML(anime.language || "Japanese");

  const posterURL = safeURL(anime.poster_url);

  const posterStyle = posterURL
    ? `style="background-image:url('${escapeHTML(posterURL)}')"`
    : "";

  const saved = watchlist.some(
    item => String(item) === String(anime.id)
  );

  return `
    <article class="anime-card">

      <div class="anime-poster" ${posterStyle}>

        ${!posterURL
          ? `<span class="poster-placeholder">ANIMENOONA</span>`
          : ""
        }

        <span class="anime-tag">
          ${language}
        </span>

        <button
          class="watch-now"
          type="button"
          data-play="${id}"
        >
          ▶ Watch Now
        </button>

      </div>

      <div class="anime-info">

        <h3>${title}</h3>

        <p>${description}</p>

        <div class="anime-meta">

          <span>${genre}</span>

          <button
            class="save-anime"
            type="button"
            data-save="${id}"
          >
            ${saved ? "♥ Saved" : "♡ Watchlist"}
          </button>

        </div>

      </div>

    </article>
  `;
}

/* =====================================================
   9. SEARCH AND FILTER
===================================================== */

function renderAnime() {
  if (!el.animeGrid) return;

  const search = (
    el.searchInput?.value || ""
  ).toLowerCase().trim();

  const genre = el.genreFilter?.value || "all";
  const language = el.languageFilter?.value || "all";

  const filtered = animeList.filter(anime => {

    const matchesSearch =
      anime.title.toLowerCase().includes(search);

    const matchesGenre =
      genre === "all" ||
      anime.genre.toLowerCase().includes(
        genre.toLowerCase()
      );

    const matchesLanguage =
      language === "all" ||
      anime.language.toLowerCase() ===
      language.toLowerCase();

    return (
      matchesSearch &&
      matchesGenre &&
      matchesLanguage
    );
  });

  el.animeGrid.innerHTML = filtered.length
    ? filtered.map(animeCard).join("")
    : `<p class="empty-message">No anime found.</p>`;

  if (el.animeCount) {
    el.animeCount.textContent =
      `${filtered.length} Anime`;
  }
}

/* =====================================================
   10. WATCHLIST
===================================================== */

function toggleWatchlist(id) {
  const exists = watchlist.some(
    item => String(item) === String(id)
  );

  if (exists) {
    watchlist = watchlist.filter(
      item => String(item) !== String(id)
    );
  } else {
    watchlist.push(id);
  }

  saveLocalData();

  renderAnime();
  renderWatchlist();
}

function renderWatchlist() {
  if (!el.watchlistGrid) return;

  const items = animeList.filter(anime =>
    watchlist.some(
      id => String(id) === String(anime.id)
    )
  );

  el.watchlistGrid.innerHTML = items.length
    ? items.map(animeCard).join("")
    : `<p class="empty-message">Your watchlist is empty.</p>`;
}

/* =====================================================
   11. CONTINUE WATCHING
===================================================== */

function saveProgress(anime) {
  if (!anime) return;

  const item = {
    id: anime.id,
    title: anime.title,
    poster_url: anime.poster_url || "",
    updated: Date.now()
  };

  continueList = [
    item,
    ...continueList.filter(
      x => String(x.id) !== String(anime.id)
    )
  ].slice(0, 10);

  saveLocalData();

  renderContinueWatching();
}

function renderContinueWatching() {
  if (!el.continueGrid) return;

  const items = continueList.map(item =>
    animeList.find(
      anime => String(anime.id) === String(item.id)
    )
  ).filter(Boolean);

  el.continueGrid.innerHTML = items.length
    ? items.map(animeCard).join("")
    : `<p class="empty-message">Your watch history will appear here.</p>`;
}

/* =====================================================
   12. VIDEO PLAYER
===================================================== */

function playAnime(id) {
  const anime = animeList.find(
    item => String(item.id) === String(id)
  );

  if (!anime) return;

  activeAnime = anime;

  if (el.playerTitle) {
    el.playerTitle.textContent = anime.title;
  }

  if (el.nowPlayingTitle) {
    el.nowPlayingTitle.textContent = anime.title;
  }

  if (el.playerDescription) {
    el.playerDescription.textContent =
      anime.description || "";
  }

  renderEpisodeOptions(anime);

  const firstEpisode = anime.episodes[0];

  if (firstEpisode) {
    playEpisode(firstEpisode.episode);
  } else {
    say(
      el.playerMessage,
      "No episode available.",
      true
    );
  }

  saveProgress(anime);

  document.getElementById("player")?.scrollIntoView({
    behavior: "smooth"
  });
}

/* =====================================================
   13. EPISODE OPTIONS
===================================================== */

function renderEpisodeOptions(anime) {
  if (!el.episodeSelect) return;

  el.episodeSelect.innerHTML = anime.episodes.map(ep => `
    <option value="${escapeHTML(ep.episode)}">
      Episode ${escapeHTML(ep.episode)}
    </option>
  `).join("");

  if (!anime.episodes.length) {
    el.episodeSelect.innerHTML = `
      <option value="">No episodes</option>
    `;
  }
}

function playEpisode(number) {
  if (!activeAnime || !el.animeVideo) return;

  const episode = activeAnime.episodes.find(
    ep => Number(ep.episode) === Number(number)
  );

  if (!episode) {
    say(
      el.playerMessage,
      "Episode not found.",
      true
    );
    return;
  }

  if (!episode.video_url) {
    say(
      el.playerMessage,
      "Video URL is not available.",
      true
    );
    return;
  }

  const videoURL = safeURL(episode.video_url);

  if (!videoURL) {
    say(
      el.playerMessage,
      "Invalid video URL.",
      true
    );
    return;
  }

  activeEpisode = episode;

  el.animeVideo.pause();

  removeSubtitleTracks();

  el.animeVideo.src = videoURL;
  el.animeVideo.load();

  el.animeVideo.play().catch(error => {
    console.log("Playback requires user interaction:", error);
  });

  if (el.nowPlayingTitle) {
    el.nowPlayingTitle.textContent =
      `${activeAnime.title} - Episode ${episode.episode}`;
  }

  if (el.episodeSelect) {
    el.episodeSelect.value = String(episode.episode);
  }

  say(el.playerMessage, "");

  loadSubtitleOptions();
}

el.animeVideo?.addEventListener("timeupdate", () => {
  if (!activeAnime) return;

  const now = Date.now();

  if (now - lastProgressSave > 15000) {
    lastProgressSave = now;
    saveProgress(activeAnime);
  }
});

/* =====================================================
   14. SUBTITLE LANGUAGES
===================================================== */

const subtitleLanguages = {
  "Japanese": "ja",
  "English": "en",
  "Hindi": "hi",
  "Hinglish (Roman)": "hi-Latn"
};

function getAnimeSubtitles() {
  if (!activeAnime) return {};

  const key = String(activeAnime.id);

  return subtitleLibrary[key] || {};
}

/* =====================================================
   15. LOAD SUBTITLE OPTIONS
===================================================== */

function loadSubtitleOptions() {
  if (!el.subtitleSelect) return;

  const subtitles = getAnimeSubtitles();

  el.subtitleSelect.value = "";

  removeSubtitleTracks();

  say(
    el.subtitleStatus,
    "Choose an available subtitle language."
  );
}

/* =====================================================
   16. REMOVE SUBTITLE TRACKS
===================================================== */

function removeSubtitleTracks() {
  if (!el.animeVideo) return;

  el.animeVideo.querySelectorAll("track").forEach(track => {
    track.remove();
  });

  for (
    let i = 0;
    i < el.animeVideo.textTracks.length;
    i++
  ) {
    el.animeVideo.textTracks[i].mode = "disabled";
  }
}

/* =====================================================
   17. SELECT SUBTITLE
===================================================== */

function selectSubtitle(language) {
  removeSubtitleTracks();

  if (!language || language === "off") {
    say(el.subtitleStatus, "Subtitles off.");
    return;
  }

  if (!activeAnime || !el.animeVideo) {
    say(
      el.subtitleStatus,
      "Play an anime first.",
      true
    );
    return;
  }

  const subtitles = getAnimeSubtitles();
  const subtitleURL = subtitles[language];

  if (!subtitleURL) {
    say(
      el.subtitleStatus,
      `${language} subtitle is not available yet.`,
      true
    );
    return;
  }

  const safeSubtitleURL = safeURL(subtitleURL);

  if (!safeSubtitleURL) {
    say(
      el.subtitleStatus,
      "Invalid subtitle URL.",
      true
    );
    return;
  }

  const track = document.createElement("track");

  track.kind = "subtitles";
  track.label = language;
  track.srclang = subtitleLanguages[language] || "en";
  track.src = safeSubtitleURL;
  track.default = true;

  el.animeVideo.appendChild(track);

  track.addEventListener("load", () => {
    const tracks = el.animeVideo.textTracks;

    for (let i = 0; i < tracks.length; i++) {
      tracks[i].mode = "disabled";
    }

    if (tracks.length) {
      tracks[tracks.length - 1].mode = "showing";
    }
  });

  say(
    el.subtitleStatus,
    `${language} subtitle selected.`
  );
}

/* =====================================================
   18. LOGIN AND SIGNUP
===================================================== */

async function account(mode) {
  if (!db) {
    say(
      el.accountMessage,
      "Supabase is not connected.",
      true
    );
    return;
  }

  const email = el.emailInput?.value.trim();
  const password = el.passwordInput?.value || "";

  if (!email || !password) {
    say(
      el.accountMessage,
      "Please enter email and password.",
      true
    );
    return;
  }

  if (password.length < 6) {
    say(
      el.accountMessage,
      "Password must be at least 6 characters.",
      true
    );
    return;
  }

  say(el.accountMessage, "Please wait...");

  try {
    let result;

    if (mode === "signup") {
      result = await db.auth.signUp({
        email,
        password
      });
    } else {
      result = await db.auth.signInWithPassword({
        email,
        password
      });
    }

    if (result.error) throw result.error;

    currentUser = result.data.user || null;

    updateAccountUI();

    await checkAdmin();

    if (mode === "signup" && !result.data.session) {
      say(
        el.accountMessage,
        "Signup successful! Please check your email to confirm your account."
      );
    } else {
      say(
        el.accountMessage,
        mode === "signup"
          ? "Account created successfully!"
          : "Login successful!"
      );
    }

  } catch (error) {
    say(
      el.accountMessage,
      error.message,
      true
    );
  }
}

/* =====================================================
   19. ACCOUNT UI
===================================================== */

function updateAccountUI() {
  const loggedIn = !!currentUser;

  if (el.user) {
    el.user.textContent = loggedIn
      ? currentUser.email
      : "Guest";
  }

  if (el.accountUser) {
    el.accountUser.textContent = loggedIn
      ? currentUser.email
      : "Guest User";
  }

  if (el.loginPanel) {
    el.loginPanel.hidden = loggedIn;
  }

  if (el.logoutBtn) {
    el.logoutBtn.hidden = !loggedIn;
  }

  if (el.headerLoginBtn) {
    el.headerLoginBtn.hidden = loggedIn;
  }

  if (el.accountInfo) {
    el.accountInfo.hidden = !loggedIn;
  }
}

/* =====================================================
   20. LOGOUT
===================================================== */

async function logout() {
  if (!db) return;

  const { error } = await db.auth.signOut();

  if (error) {
    say(el.accountMessage, error.message, true);
    return;
  }

  currentUser = null;
  isAdmin = false;

  updateAccountUI();

  await checkAdmin();

  say(el.accountMessage, "Logged out successfully.");
}

/* =====================================================
   21. FORGOT PASSWORD
===================================================== */

async function forgotPassword() {
  if (!db) return;

  const email = el.emailInput?.value.trim();

  if (!email) {
    say(
      el.accountMessage,
      "Enter your email address first.",
      true
    );
    return;
  }

  try {
    const { error } = await db.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: window.location.origin +
          window.location.pathname
      }
    );

    if (error) throw error;

    say(
      el.accountMessage,
      "Password reset link sent. Check your email."
    );

  } catch (error) {
    say(
      el.accountMessage,
      error.message,
      true
    );
  }
}

/* =====================================================
   22. UPDATE PASSWORD
===================================================== */

async function updatePassword() {
  if (!db) return;

  const password = el.newPassword?.value || "";
  const confirm = el.confirmPassword?.value || "";

  if (password.length < 6) {
    say(
      el.resetMessage,
      "Password must be at least 6 characters.",
      true
    );
    return;
  }

  if (password !== confirm) {
    say(
      el.resetMessage,
      "Passwords do not match.",
      true
    );
    return;
  }

  try {
    const { error } = await db.auth.updateUser({
      password
    });

    if (error) throw error;

    say(
      el.resetMessage,
      "Password updated successfully!"
    );

    el.resetPanel.hidden = true;
    el.loginPanel.hidden = false;

  } catch (error) {
    say(
      el.resetMessage,
      error.message,
      true
    );
  }
}

/* =====================================================
   23. SECURE ADMIN CHECK
===================================================== */

async function checkAdmin() {
  isAdmin = false;

  if (!db || !currentUser) {
    updateAdminUI();
    return false;
  }

  try {
    const { data, error } = await db
      .from(ADMIN_TABLE)
      .select("role")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (error) throw error;

    isAdmin = data?.role === "admin";

  } catch (error) {
    console.error("Admin check failed:", error);
    isAdmin = false;
  }

  updateAdminUI();

  return isAdmin;
}

function updateAdminUI() {
  if (el.adminDashboard) {
    el.adminDashboard.hidden = !isAdmin;
  }

  if (el.adminStatus) {
    el.adminStatus.textContent = isAdmin
      ? "Admin access enabled ✓"
      : "Admin access required.";
  }
}

/* =====================================================
   24. SUPABASE STORAGE UPLOAD
===================================================== */

async function uploadFile(file, folder) {
  if (!db) {
    throw new Error("Supabase is not connected.");
  }

  if (!file) {
    throw new Error("Please select a file.");
  }

  const extension = file.name.includes(".")
    ? file.name.split(".").pop().toLowerCase()
    : "file";

  const path =
    `${folder}/${Date.now()}-${makeId()}.${extension}`;

  const { error } = await db.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, {
      upsert: false,
      cacheControl: "3600"
    });

  if (error) throw error;

  const { data } = db.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);

  if (!data?.publicUrl) {
    throw new Error("Could not create public file URL.");
  }

  return data.publicUrl;
}

/* =====================================================
   25. ADMIN ANIME UPLOAD
===================================================== */

async function uploadAnime(event) {
  event?.preventDefault();

  if (!await checkAdmin()) {
    say(
      el.uploadMessage,
      "Admin access required.",
      true
    );
    return;
  }

  const title = el.uploadTitle?.value.trim();
  const description = el.uploadDescription?.value.trim() || "";
  const genre = el.uploadGenre?.value;
  const language = el.uploadLanguage?.value;
  const episode = Number(el.uploadEpisode?.value || 1);

  const videoFile = el.uploadVideo?.files?.[0];
  const posterFile = el.uploadPoster?.files?.[0];

  if (!title || !videoFile) {
    say(
      el.uploadMessage,
      "Anime title and video are required.",
      true
    );
    return;
  }

  if (!Number.isInteger(episode) || episode < 1) {
    say(
      el.uploadMessage,
      "Enter a valid episode number.",
      true
    );
    return;
  }

  try {
    el.uploadButton.disabled = true;

    say(el.uploadMessage, "Uploading video...");

    const videoURL = await uploadFile(
      videoFile,
      "videos"
    );

    let posterURL = null;

    if (posterFile) {
      say(el.uploadMessage, "Uploading poster...");

      posterURL = await uploadFile(
        posterFile,
        "posters"
      );
    }

    const record = {
      title,
      description,
      episode,
      genre,
      language,
      video_url: videoURL,
      poster_url: posterURL
    };

    say(el.uploadMessage, "Saving anime to database...");

    const { error } = await db
      .from(DB_TABLE)
      .insert(record);

    if (error) throw error;

    say(
      el.uploadMessage,
      "Anime uploaded successfully! ♡"
    );

    el.uploadForm.reset();

    await loadAnime();

  } catch (error) {
    console.error("Upload error:", error);

    say(
      el.uploadMessage,
      error.message,
      true
    );

  } finally {
    el.uploadButton.disabled = false;
  }
}

/* =====================================================
   26. SUBTITLE UPLOAD
===================================================== */

async function uploadSubtitle() {
  if (!await checkAdmin()) {
    say(
      el.subtitleUploadMessage,
      "Admin access required.",
      true
    );
    return;
  }

  const file = el.subtitleFileUpload?.files?.[0];
  const animeId = el.subtitleAnimeSelect?.value;
  const language = el.subtitleLanguageUpload?.value;

  if (!file || !animeId || !language) {
    say(
      el.subtitleUploadMessage,
      "Choose anime, language and VTT file.",
      true
    );
    return;
  }

  if (!file.name.toLowerCase().endsWith(".vtt")) {
    say(
      el.subtitleUploadMessage,
      "Only .vtt subtitle files are supported.",
      true
    );
    return;
  }

  try {
    el.subtitleUploadButton.disabled = true;

    say(
      el.subtitleUploadMessage,
      "Uploading subtitle..."
    );

    const url = await uploadFile(
      file,
      `subtitles/${animeId}`
    );

    if (!subtitleLibrary[String(animeId)]) {
      subtitleLibrary[String(animeId)] = {};
    }

    subtitleLibrary[String(animeId)][language] = url;

    saveLocalData();

    say(
      el.subtitleUploadMessage,
      `${language} subtitle uploaded successfully!`
    );

    if (
      activeAnime &&
      String(activeAnime.id) === String(animeId)
    ) {
      loadSubtitleOptions();
    }

    el.subtitleFileUpload.value = "";

  } catch (error) {
    console.error(error);

    say(
      el.subtitleUploadMessage,
      error.message,
      true
    );

  } finally {
    el.subtitleUploadButton.disabled = false;
  }
}

/* =====================================================
   27. SUBTITLE ANIME DROPDOWN
===================================================== */

function renderSubtitleAnimeSelect() {
  if (!el.subtitleAnimeSelect) return;

  el.subtitleAnimeSelect.innerHTML = `
    <option value="">Select Anime</option>
    ${animeList.map(anime => `
      <option value="${escapeHTML(anime.id)}">
        ${escapeHTML(anime.title)}
      </option>
    `).join("")}
  `;
}

/* =====================================================
   28. EPISODE CHANGE
===================================================== */

el.episodeSelect?.addEventListener("change", event => {
  if (!activeAnime) return;

  playEpisode(event.target.value);
});

/* =====================================================
   29. ALL CARD AND GENRE CLICKS
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
   30. NAVIGATION
===================================================== */

el.menuBtn?.addEventListener("click", () => {
  el.mainNav?.classList.toggle("active");
});

el.mainNav?.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    el.mainNav.classList.remove("active");
  });
});

el.headerLoginBtn?.addEventListener("click", () => {
  document.getElementById("account")?.scrollIntoView({
    behavior: "smooth"
  });
});

/* =====================================================
   31. SEARCH AND FILTER EVENTS
===================================================== */

el.searchInput?.addEventListener("input", renderAnime);
el.genreFilter?.addEventListener("change", renderAnime);
el.languageFilter?.addEventListener("change", renderAnime);

/* =====================================================
   32. HERO BUTTONS
===================================================== */

el.exploreBtn?.addEventListener("click", () => {
  document.getElementById("library")?.scrollIntoView({
    behavior: "smooth"
  });
});

el.heroWatchBtn?.addEventListener("click", () => {
  if (animeList.length) {
    playAnime(animeList[0].id);
  } else {
    say(
      el.libraryMessage,
      "No anime available yet.",
      true
    );

    document.getElementById("library")?.scrollIntoView({
      behavior: "smooth"
    });
  }
});

/* =====================================================
   33. SUBTITLE EVENT
===================================================== */

el.subtitleSelect?.addEventListener("change", event => {
  selectSubtitle(event.target.value);
});

/* =====================================================
   34. ACCOUNT EVENTS
===================================================== */

el.signupBtn?.addEventListener("click", () => {
  account("signup");
});

el.loginBtn?.addEventListener("click", () => {
  account("login");
});

el.logoutBtn?.addEventListener("click", logout);

el.forgotBtn?.addEventListener("click", forgotPassword);

el.updatePasswordBtn?.addEventListener(
  "click",
  updatePassword
);

/* =====================================================
   35. ADMIN EVENTS
===================================================== */

el.uploadForm?.addEventListener(
  "submit",
  uploadAnime
);

el.subtitleUploadButton?.addEventListener(
  "click",
  uploadSubtitle
);

/* =====================================================
   36. START WEBSITE
===================================================== */

async function startAnimeNoona() {
  updateAccountUI();

  await initializeSupabase();

  await loadAnime();

  renderSubtitleAnimeSelect();

  await checkAdmin();

  console.log("AnimeNoona is ready! ♡");
}

startAnimeNoona();

/* =====================================================
   END — ANIMENOONA
===================================================== */
