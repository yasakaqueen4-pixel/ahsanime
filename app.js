
/* =====================================================
   ANIMENOONA ♡ — COMPLETE APP.JS
   Supabase Auth + Anime Library + Video Player
   Episodes + Subtitles + Admin + Upload System
===================================================== */

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

/* =====================================================
   1. SUPABASE CONFIGURATION
===================================================== */

const SUPABASE_URL = "https://yvfstkkcetyavpzqytde.supabase.co";
const SUPABASE_KEY = "sb_publishable_NgpGgHlXHz_DdJfsRLA6Ug_InIZWY8D";

const DB_TABLE = "anime_uploads";
const ADMIN_TABLE = "admin_users";
const STORAGE_BUCKET = "anime-media";

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

/* =====================================================
   2. DOM ELEMENTS
===================================================== */

const $ = (id) => document.getElementById(id);

const el = {
  menuBtn: $("menuBtn"),
  mainNav: $("mainNav"),
  headerLoginBtn: $("headerLoginBtn"),
  logoutBtn: $("logoutBtn"),
  logoutAccountBtn: $("logoutAccountBtn"),
  user: $("user"),

  exploreBtn: $("exploreBtn"),
  heroWatchBtn: $("heroWatchBtn"),

  animeGrid: $("animeGrid"),
  animeCount: $("animeCount"),
  searchInput: $("searchInput"),
  genreFilter: $("genreFilter"),
  languageFilter: $("languageFilter"),
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
  emailInput: $("emailInput"),
  passwordInput: $("passwordInput"),
  loginBtn: $("loginBtn"),
  signupBtn: $("signupBtn"),
  forgotBtn: $("forgotBtn"),
  newPassword: $("newPassword"),
  confirmPassword: $("confirmPassword"),
  updatePasswordBtn: $("updatePasswordBtn"),
  resetMessage: $("resetMessage"),
  accountUser: $("accountUser"),
  accountMessage: $("accountMessage"),

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
  subtitleEpisodeSelect: $("subtitleEpisodeSelect"),
  subtitleLanguageUpload: $("subtitleLanguageUpload"),
  subtitleFileUpload: $("subtitleFileUpload"),
  subtitleUploadButton: $("subtitleUploadButton"),
  subtitleUploadMessage: $("subtitleUploadMessage")
};

/* =====================================================
   3. APP STATE
===================================================== */

function readJSON(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Storage error:", error);
  }
}

const state = {
  rows: [],
  anime: [],
  user: null,
  isAdmin: false,
  currentAnime: null,
  currentEpisode: null,
  subtitles: readJSON("animenoona_episode_subtitles", []),
  watchlist: readJSON("animenoona_watchlist", []),
  history: readJSON("animenoona_history", []),
  lastAuthUserId: null,
  recoveryMode: false
};

/* =====================================================
   4. GENERAL HELPERS
===================================================== */

function say(element, message, error = false) {
  if (!element) return;

  element.textContent = message;
  element.style.color = error ? "#fb7185" : "#a78bfa";
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function scrollToSection(id) {
  $(id)?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function slug(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeTitle(value = "") {
  return String(value).toLowerCase().trim().replace(/\s+/g, " ");
}

function getAnimeKey(title) {
  return slug(title);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setButtonLoading(button, loading, loadingText = "Please wait...") {
  if (!button) return;

  if (loading) {
    if (!button.dataset.originalText) {
      button.dataset.originalText = button.textContent;
    }

    button.textContent = loadingText;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
    delete button.dataset.originalText;
  }
}

/* =====================================================
   5. LANGUAGE SYSTEM
===================================================== */

function languageCode(language = "") {
  const value = String(language).toLowerCase().trim();

  if (value.includes("hinglish") || value.includes("roman")) {
    return "hi-Latn";
  }

  if (value.includes("devanagari") || value === "hindi") {
    return "hi";
  }

  if (value.includes("japanese")) return "ja";
  if (value.includes("english")) return "en";

  return "en";
}

function languageLabel(language = "") {
  const code = languageCode(language);

  const labels = {
    "hi-Latn": "🇮🇳 Hindi (Hinglish / Roman)",
    "hi": "🇮🇳 Hindi (देवनागरी)",
    "en": "🇬🇧 English",
    "ja": "🇯🇵 Japanese"
  };

  return labels[code] || language;
}

function sameLanguage(a, b) {
  return languageCode(a) === languageCode(b);
}

/* =====================================================
   6. ANIME DATA
===================================================== */

function normalizeRow(row) {
  return {
    id: row.id,
    title: row.title || "Untitled Anime",
    description: row.description || "",
    episode: Number(row.episode || 1),
    genre: row.genre || "Anime",
    language: row.language || "Japanese",
    video_url: row.video_url || "",
    poster_url: row.poster_url || "",
    created_at: row.created_at || ""
  };
}

function groupAnime(rows) {
  const groups = new Map();

  rows.forEach((row) => {
    const key = normalizeTitle(row.title);

    if (!groups.has(key)) {
      groups.set(key, {
        key: getAnimeKey(row.title),
        title: row.title,
        description: row.description,
        genre: row.genre,
        language: row.language,
        poster_url: row.poster_url,
        episodes: []
      });
    }

    const group = groups.get(key);

    group.episodes.push(row);

    if (!group.poster_url && row.poster_url) {
      group.poster_url = row.poster_url;
    }

    if (!group.description && row.description) {
      group.description = row.description;
    }
  });

  return [...groups.values()]
    .map((anime) => {
      anime.episodes.sort((a, b) => a.episode - b.episode);
      return anime;
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

/* =====================================================
   7. AUTH UI + ADMIN
===================================================== */

function updateAuthUI() {
  const loggedIn = Boolean(state.user);

  if (el.user) {
    el.user.textContent = loggedIn ? state.user.email : "Guest";
  }

  el.headerLoginBtn?.classList.toggle("hidden", loggedIn);
  el.logoutBtn?.classList.toggle("hidden", !loggedIn);

  el.loginPanel?.classList.toggle(
    "hidden",
    loggedIn || state.recoveryMode
  );

  el.accountInfo?.classList.toggle(
    "hidden",
    !loggedIn || state.recoveryMode
  );

  el.resetPanel?.classList.toggle(
    "hidden",
    !state.recoveryMode
  );

  if (el.accountUser && loggedIn) {
    el.accountUser.textContent = state.user.email;
  }

  el.adminDashboard?.classList.toggle(
    "hidden",
    !state.isAdmin
  );
}

async function checkAdmin(user) {
  state.isAdmin = false;

  if (!user) {
    updateAuthUI();
    return;
  }

  try {
    const { data, error } = await db
      .from(ADMIN_TABLE)
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;

    state.isAdmin = String(data?.role || "").toLowerCase() === "admin";

    say(
      el.adminStatus,
      state.isAdmin
        ? "Admin access verified."
        : "Admin access is not enabled for this account.",
      !state.isAdmin
    );

  } catch (error) {
    console.error("Admin check error:", error);
    state.isAdmin = false;

    say(
      el.adminStatus,
      "Admin verification failed. Check admin_users permissions.",
      true
    );
  }

  updateAuthUI();
}

async function setCurrentUser(user) {
  const newId = user?.id || null;

  state.user = user || null;

  if (newId !== state.lastAuthUserId) {
    state.lastAuthUserId = newId;
    await checkAdmin(user);
  } else {
    updateAuthUI();
  }
}

/* =====================================================
   8. LOGIN / SIGNUP / LOGOUT
===================================================== */

async function account(mode) {
  const email = el.emailInput?.value.trim() || "";
  const password = el.passwordInput?.value || "";

  if (!email || !password) {
    say(el.accountMessage, "Please enter email and password.", true);
    return;
  }

  if (!isValidEmail(email)) {
    say(el.accountMessage, "Please enter a valid email address.", true);
    return;
  }

  if (password.length < 6) {
    say(el.accountMessage, "Password must be at least 6 characters.", true);
    return;
  }

  const button = mode === "login" ? el.loginBtn : el.signupBtn;

  setButtonLoading(button, true);

  try {
    let result;

    if (mode === "signup") {
      result = await db.auth.signUp({ email, password });
    } else {
      result = await db.auth.signInWithPassword({ email, password });
    }

    if (result.error) throw result.error;

    if (mode === "signup" && !result.data.session) {
      say(
        el.accountMessage,
        "Account created! Please check your email to confirm."
      );
    } else {
      say(
        el.accountMessage,
        mode === "login" ? "Login successful!" : "Account created successfully!"
      );

      await setCurrentUser(result.data.user);
    }

    if (mode === "login" && el.passwordInput) {
      el.passwordInput.value = "";
    }

  } catch (error) {
    console.error("Account error:", error);
    say(el.accountMessage, error.message || "Account operation failed.", true);
  } finally {
    setButtonLoading(button, false);
  }
}

async function logout() {
  try {
    const { error } = await db.auth.signOut();

    if (error) throw error;

    state.user = null;
    state.isAdmin = false;
    state.lastAuthUserId = null;

    updateAuthUI();
    say(el.accountMessage, "You have been logged out.");

  } catch (error) {
    console.error("Logout error:", error);
    say(el.accountMessage, error.message || "Logout failed.", true);
  }
}

/* =====================================================
   9. PASSWORD RESET
===================================================== */

async function sendPasswordReset() {
  const email = el.emailInput?.value.trim() || "";

  if (!isValidEmail(email)) {
    say(el.accountMessage, "Enter your valid email address first.", true);
    return;
  }

  setButtonLoading(el.forgotBtn, true, "Sending...");

  try {
    const redirectTo = window.location.origin + window.location.pathname;

    const { error } = await db.auth.resetPasswordForEmail(email, {
      redirectTo
    });

    if (error) throw error;

    say(el.accountMessage, "Password reset link sent! Check your email.");

  } catch (error) {
    console.error("Password reset error:", error);
    say(el.accountMessage, error.message || "Could not send reset email.", true);
  } finally {
    setButtonLoading(el.forgotBtn, false);
  }
}

async function updatePassword() {
  const password = el.newPassword?.value || "";
  const confirm = el.confirmPassword?.value || "";

  if (password.length < 6) {
    say(el.resetMessage, "Password must be at least 6 characters.", true);
    return;
  }

  if (password !== confirm) {
    say(el.resetMessage, "Passwords do not match.", true);
    return;
  }

  setButtonLoading(el.updatePasswordBtn, true, "Updating...");

  try {
    const { error } = await db.auth.updateUser({ password });

    if (error) throw error;

    say(el.resetMessage, "Password updated successfully!");

    if (el.newPassword) el.newPassword.value = "";
    if (el.confirmPassword) el.confirmPassword.value = "";

    state.recoveryMode = false;
    updateAuthUI();

  } catch (error) {
    console.error("Password update error:", error);
    say(el.resetMessage, error.message || "Password update failed.", true);
  } finally {
    setButtonLoading(el.updatePasswordBtn, false);
  }
}

/* =====================================================
   10. LOAD ANIME
===================================================== */

async function loadAnime() {
  if (el.animeGrid) {
    el.animeGrid.innerHTML =
      '<div class="loading-state">Loading anime...</div>';
  }

  try {
    const { data, error } = await db
      .from(DB_TABLE)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    state.rows = (data || []).map(normalizeRow);
    state.anime = groupAnime(state.rows);

    renderAnime();
    renderContinue();
    renderWatchlist();
    populateSubtitleAnimeSelect();

    say(
      el.libraryMessage,
      state.anime.length
        ? `${state.anime.length} anime loaded successfully.`
        : "No anime uploaded yet."
    );

  } catch (error) {
    console.error("Anime loading error:", error);

    if (el.animeGrid) {
      el.animeGrid.innerHTML =
        '<div class="empty-state">Could not load anime. Check Supabase connection and table permissions.</div>';
    }

    say(el.libraryMessage, error.message || "Could not load anime.", true);
  }
}

/* =====================================================
   11. SEARCH / FILTERS / CARDS
===================================================== */

function getFilteredAnime() {
  const search = el.searchInput?.value.toLowerCase().trim() || "";
  const genre = el.genreFilter?.value || "All";
  const language = el.languageFilter?.value || "All";

  return state.anime.filter((anime) => {
    const searchMatch =
      !search ||
      anime.title.toLowerCase().includes(search) ||
      anime.description.toLowerCase().includes(search) ||
      anime.genre.toLowerCase().includes(search);

    const genreMatch =
      genre === "All" ||
      anime.genre.toLowerCase() === genre.toLowerCase();

    const languageMatch =
      language === "All" ||
      anime.language.toLowerCase() === language.toLowerCase();

    return searchMatch && genreMatch && languageMatch;
  });
}

function animeCard(anime) {
  const key = anime.key;
  const saved = state.watchlist.includes(key);

  const poster = anime.poster_url
    ? `<img src="${escapeHTML(anime.poster_url)}" alt="${escapeHTML(anime.title)} poster" loading="lazy">`
    : "";

  return `
    <article class="anime-card">
      <div class="anime-poster">
        ${poster}
      </div>

      <div class="anime-info">
        <h3>${escapeHTML(anime.title)}</h3>

        <p>
          ${escapeHTML(anime.genre)} ·
          ${anime.episodes.length} Episode(s) ·
          ${escapeHTML(anime.language)}
        </p>

        <button type="button" data-action="watch" data-key="${escapeHTML(key)}">
          ▶ Watch
        </button>

        <button type="button" data-action="save" data-key="${escapeHTML(key)}">
          ${saved ? "♥ Saved" : "♡ Save"}
        </button>
      </div>
    </article>
  `;
}

function renderAnime() {
  if (!el.animeGrid) return;

  const list = getFilteredAnime();

  if (el.animeCount) {
    el.animeCount.textContent = `${list.length} Anime`;
  }

  el.animeGrid.innerHTML = list.length
    ? list.map(animeCard).join("")
    : '<div class="empty-state">No anime found. Try another search or filter.</div>';
}

function findAnime(key) {
  return state.anime.find((anime) => anime.key === key);
}

/* =====================================================
   12. WATCHLIST
===================================================== */

function toggleWatchlist(key) {
  if (state.watchlist.includes(key)) {
    state.watchlist = state.watchlist.filter((item) => item !== key);
  } else {
    state.watchlist.push(key);
  }

  saveJSON("animenoona_watchlist", state.watchlist);

  renderAnime();
  renderWatchlist();
}

function renderWatchlist() {
  if (!el.watchlistGrid) return;

  const list = state.watchlist
    .map(findAnime)
    .filter(Boolean);

  el.watchlistGrid.innerHTML = list.length
    ? list.map(animeCard).join("")
    : '<div class="empty-state">Your watchlist is empty. Save an anime to see it here.</div>';
}

/* =====================================================
   13. CONTINUE WATCHING
===================================================== */

function saveHistory(anime, episode) {
  const item = {
    key: anime.key,
    title: anime.title,
    episode: episode.episode,
    updated: Date.now()
  };

  state.history = state.history.filter(
    (entry) => entry.key !== anime.key
  );

  state.history.unshift(item);
  state.history = state.history.slice(0, 20);

  saveJSON("animenoona_history", state.history);
}

function renderContinue() {
  if (!el.continueGrid) return;

  const list = state.history
    .map((entry) => {
      const anime = findAnime(entry.key);
      if (!anime) return null;

      return {
        ...anime,
        lastEpisode: entry.episode
      };
    })
    .filter(Boolean);

  if (!list.length) {
    el.continueGrid.innerHTML =
      '<div class="empty-state">Your watching history will appear here.</div>';
    return;
  }

  el.continueGrid.innerHTML = list.map((anime) => `
    <article class="anime-card">
      <div class="anime-poster">
        ${anime.poster_url
          ? `<img src="${escapeHTML(anime.poster_url)}" alt="${escapeHTML(anime.title)}" loading="lazy">`
          : ""}
      </div>

      <div class="anime-info">
        <h3>${escapeHTML(anime.title)}</h3>
        <p>Continue Episode ${anime.lastEpisode}</p>
        <button type="button"
          data-action="continue"
          data-key="${escapeHTML(anime.key)}"
          data-episode="${anime.lastEpisode}">
          ▶ Continue
        </button>
      </div>
    </article>
  `).join("");
}

/* =====================================================
   14. ANIME PLAYER
===================================================== */

function watchAnime(key, episodeNumber = null) {
  const anime = findAnime(key);

  if (!anime) return;

  state.currentAnime = anime;

  if (el.playerTitle) {
    el.playerTitle.textContent = anime.title;
  }

  if (el.playerDescription) {
    el.playerDescription.textContent = anime.description || "Enjoy your anime.";
  }

  const episodes = anime.episodes;

  if (el.episodeSelect) {
    el.episodeSelect.innerHTML = episodes.map((episode, index) => `
      <option value="${index}">
        Episode ${episode.episode}
      </option>
    `).join("");
  }

  let index = 0;

  if (episodeNumber !== null) {
    const found = episodes.findIndex(
      (episode) => Number(episode.episode) === Number(episodeNumber)
    );

    if (found >= 0) index = found;
  }

  if (el.episodeSelect) {
    el.episodeSelect.value = String(index);
  }

  playEpisode(index);
  scrollToSection("player");
}

function clearVideoTracks() {
  if (!el.animeVideo) return;

  el.animeVideo.querySelectorAll("track").forEach((track) => {
    track.remove();
  });

  try {
    for (const track of el.animeVideo.textTracks) {
      track.mode = "disabled";
    }
  } catch (error) {
    console.warn("Could not clear subtitle tracks:", error);
  }
}

function playEpisode(index) {
  const anime = state.currentAnime;

  if (!anime) return;

  const episode = anime.episodes[Number(index)];

  if (!episode) return;

  if (!episode.video_url) {
    say(el.playerMessage, "Video URL is missing for this episode.", true);
    return;
  }

  state.currentEpisode = episode;

  clearVideoTracks();

  if (el.animeVideo) {
    el.animeVideo.pause();
    el.animeVideo.src = episode.video_url;
    el.animeVideo.load();
  }

  if (el.nowPlayingTitle) {
    el.nowPlayingTitle.textContent = `Episode ${episode.episode}`;
  }

  if (el.playerTitle) {
    el.playerTitle.textContent =
      `${anime.title} - Episode ${episode.episode}`;
  }

  saveHistory(anime, episode);
  loadSubtitleOptions();

  say(el.playerMessage, "Episode loaded. Press play to start watching.");

  renderContinue();
}

/* =====================================================
   15. SUBTITLE SYSTEM
===================================================== */

function getEpisodeSubtitles(anime, episode) {
  if (!anime || !episode) return [];

  return state.subtitles.filter((item) =>
    item.animeKey === anime.key &&
    Number(item.episode) === Number(episode.episode)
  );
}

function loadSubtitleOptions() {
  if (!el.subtitleSelect) return;

  const subtitles = getEpisodeSubtitles(
    state.currentAnime,
    state.currentEpisode
  );

  el.subtitleSelect.innerHTML = `
    <option value="off">Off</option>
    ${subtitles.map((item, index) => `
      <option value="${index}">
        ${escapeHTML(languageLabel(item.language))}
      </option>
    `).join("")}
  `;

  if (el.subtitleStatus) {
    el.subtitleStatus.textContent = subtitles.length
      ? "Available subtitles: " +
        subtitles.map((s) => languageLabel(s.language)).join(", ")
      : "No subtitles uploaded for this episode.";
  }
}

function applySubtitle() {
  if (!el.animeVideo || !el.subtitleSelect) return;

  const selected = el.subtitleSelect.value;

  clearVideoTracks();

  if (selected === "off") {
    if (el.subtitleStatus) {
      el.subtitleStatus.textContent = "Subtitles turned off.";
    }
    return;
  }

  const subtitles = getEpisodeSubtitles(
    state.currentAnime,
    state.currentEpisode
  );

  const subtitle = subtitles[Number(selected)];

  if (!subtitle?.url) {
    say(el.subtitleStatus, "Subtitle file is not available.", true);
    return;
  }

  const trackElement = document.createElement("track");

  trackElement.kind = "subtitles";
  trackElement.label = languageLabel(subtitle.language);
  trackElement.srclang = languageCode(subtitle.language);
  trackElement.src = subtitle.url;

  trackElement.addEventListener("load", () => {
    if (trackElement.track) {
      trackElement.track.mode = "showing";
    }
  });

  el.animeVideo.appendChild(trackElement);

  if (trackElement.track) {
    trackElement.track.mode = "showing";
  }

  if (el.subtitleStatus) {
    el.subtitleStatus.textContent =
      `${languageLabel(subtitle.language)} subtitle selected.`;
  }
}

/* =====================================================
   16. STORAGE UPLOAD
===================================================== */

async function uploadToStorage(file, folder) {
  if (!file) return null;

  const extension = file.name.split(".").pop().toLowerCase();

  const safeName =
    `${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const path = `${folder}/${safeName}`;

  const { error } = await db.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false
    });

  if (error) throw error;

  const { data } = db.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}

/* =====================================================
   17. ADMIN ANIME UPLOAD
===================================================== */

async function uploadAnime(event) {
  event.preventDefault();

  if (!state.user || !state.isAdmin) {
    say(el.uploadMessage, "Admin access required.", true);
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
    say(el.uploadMessage, "Anime title and video file are required.", true);
    return;
  }

  if (!videoFile.type.startsWith("video/")) {
    say(el.uploadMessage, "Please select a valid video file.", true);
    return;
  }

  if (posterFile && !posterFile.type.startsWith("image/")) {
    say(el.uploadMessage, "Please select a valid poster image.", true);
    return;
  }

  if (!Number.isInteger(episode) || episode < 1) {
    say(el.uploadMessage, "Enter a valid episode number.", true);
    return;
  }

  setButtonLoading(el.uploadButton, true, "Uploading...");

  try {
    say(el.uploadMessage, "Uploading video and poster...");

    const videoUrl = await uploadToStorage(videoFile, "videos");

    const posterUrl = posterFile
      ? await uploadToStorage(posterFile, "posters")
      : null;

    const { error } = await db
      .from(DB_TABLE)
      .insert({
        title,
        description,
        episode,
        genre,
        language,
        video_url: videoUrl,
        poster_url: posterUrl
      });

    if (error) throw error;

    say(el.uploadMessage, "Anime episode uploaded successfully!");

    el.uploadForm?.reset();

    await loadAnime();

  } catch (error) {
    console.error("Anime upload error:", error);
    say(el.uploadMessage, error.message || "Anime upload failed.", true);
  } finally {
    setButtonLoading(el.uploadButton, false);
  }
}

/* =====================================================
   18. ADMIN SUBTITLE UPLOAD
===================================================== */

function populateSubtitleAnimeSelect() {
  if (!el.subtitleAnimeSelect) return;

  const previous = el.subtitleAnimeSelect.value;

  el.subtitleAnimeSelect.innerHTML = `
    <option value="">Select Anime</option>
    ${state.anime.map((anime) => `
      <option value="${escapeHTML(anime.key)}">
        ${escapeHTML(anime.title)}
      </option>
    `).join("")}
  `;

  if (state.anime.some((anime) => anime.key === previous)) {
    el.subtitleAnimeSelect.value = previous;
  }

  populateSubtitleEpisodeSelect();
}

function populateSubtitleEpisodeSelect() {
  if (!el.subtitleEpisodeSelect) return;

  const anime = findAnime(el.subtitleAnimeSelect?.value || "");

  if (!anime) {
    el.subtitleEpisodeSelect.innerHTML =
      '<option value="">Select Episode</option>';
    return;
  }

  el.subtitleEpisodeSelect.innerHTML = anime.episodes.map((episode) => `
    <option value="${episode.episode}">
      Episode ${episode.episode}
    </option>
  `).join("");
}

async function uploadSubtitle() {
  if (!state.user || !state.isAdmin) {
    say(el.subtitleUploadMessage, "Admin access required.", true);
    return;
  }

  const anime = findAnime(el.subtitleAnimeSelect?.value || "");
  const episode = Number(el.subtitleEpisodeSelect?.value);
  const language = el.subtitleLanguageUpload?.value;
  const file = el.subtitleFileUpload?.files?.[0];

  if (!anime || !episode || !language || !file) {
    say(
      el.subtitleUploadMessage,
      "Select anime, episode, language and subtitle file.",
      true
    );
    return;
  }

  if (!file.name.toLowerCase().endsWith(".vtt")) {
    say(el.subtitleUploadMessage, "Only .vtt subtitle files are supported.", true);
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    say(el.subtitleUploadMessage, "Subtitle file must be smaller than 5 MB.", true);
    return;
  }

  setButtonLoading(el.subtitleUploadButton, true, "Uploading...");

  try {
    const text = await file.text();
    const cleanText = text.replace(/^\uFEFF/, "").trimStart();

    if (!cleanText.startsWith("WEBVTT")) {
      throw new Error("Invalid subtitle file. It must start with WEBVTT.");
    }

    say(el.subtitleUploadMessage, "Uploading subtitle...");

    const url = await uploadToStorage(file, "subtitles");

    const record = {
      animeKey: anime.key,
      animeTitle: anime.title,
      episode,
      language,
      url,
      createdAt: Date.now()
    };

    state.subtitles = state.subtitles.filter((item) =>
      !(
        item.animeKey === anime.key &&
        Number(item.episode) === episode &&
        sameLanguage(item.language, language)
      )
    );

    state.subtitles.push(record);

    saveJSON("animenoona_episode_subtitles", state.subtitles);

    say(
      el.subtitleUploadMessage,
      `${languageLabel(language)} subtitle uploaded successfully!`
    );

    if (el.subtitleFileUpload) {
      el.subtitleFileUpload.value = "";
    }

    if (
      state.currentAnime?.key === anime.key &&
      Number(state.currentEpisode?.episode) === episode
    ) {
      loadSubtitleOptions();
    }

  } catch (error) {
    console.error("Subtitle upload error:", error);

    say(
      el.subtitleUploadMessage,
      error.message || "Subtitle upload failed.",
      true
    );
  } finally {
    setButtonLoading(el.subtitleUploadButton, false);
  }
}

/* =====================================================
   19. EVENT LISTENERS
===================================================== */

// Account

el.loginBtn?.addEventListener("click", () => account("login"));
el.signupBtn?.addEventListener("click", () => account("signup"));

el.logoutBtn?.addEventListener("click", logout);
el.logoutAccountBtn?.addEventListener("click", logout);

el.forgotBtn?.addEventListener("click", sendPasswordReset);
el.updatePasswordBtn?.addEventListener("click", updatePassword);

el.passwordInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") account("login");
});

el.headerLoginBtn?.addEventListener("click", () => {
  scrollToSection("account");
});

// Search

el.searchInput?.addEventListener("input", renderAnime);
el.genreFilter?.addEventListener("change", renderAnime);
el.languageFilter?.addEventListener("change", renderAnime);

// Player

el.episodeSelect?.addEventListener("change", () => {
  playEpisode(el.episodeSelect.value);
});

el.subtitleSelect?.addEventListener("change", applySubtitle);

// Uploads

el.uploadForm?.addEventListener("submit", uploadAnime);
el.subtitleUploadButton?.addEventListener("click", uploadSubtitle);

el.subtitleAnimeSelect?.addEventListener(
  "change",
  populateSubtitleEpisodeSelect
);

// Hero

el.exploreBtn?.addEventListener("click", () => {
  scrollToSection("library");
});

el.heroWatchBtn?.addEventListener("click", () => {
  if (state.anime.length) {
    watchAnime(state.anime[0].key);
  } else {
    scrollToSection("library");
  }
});

// Mobile navigation

el.menuBtn?.addEventListener("click", () => {
  el.mainNav?.classList.toggle("open");
});

el.mainNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    el.mainNav?.classList.remove("open");
  });
});

// Genre cards

document.querySelectorAll(".genre-card").forEach((button) => {
  button.addEventListener("click", () => {
    const genre = button.dataset.genre;

    if (el.genreFilter) {
      el.genreFilter.value = genre;
    }

    renderAnime();
    scrollToSection("library");
  });
});

// Anime card actions

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");

  if (!button) return;

  const action = button.dataset.action;
  const key = button.dataset.key;

  if (action === "watch") {
    watchAnime(key);
  }

  if (action === "save") {
    toggleWatchlist(key);
  }

  if (action === "continue") {
    watchAnime(key, button.dataset.episode);
  }
});

/* =====================================================
   20. AUTH INITIALIZATION
===================================================== */

function detectRecoveryMode() {
  const hashParams = new URLSearchParams(
    window.location.hash.replace(/^#/, "")
  );

  return hashParams.get("type") === "recovery";
}

async function initAuth() {
  state.recoveryMode = detectRecoveryMode();
  updateAuthUI();

  const { data, error } = await db.auth.getSession();

  if (error) {
    console.error("Session error:", error);
  }

  await setCurrentUser(data?.session?.user || null);

  db.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY") {
      state.recoveryMode = true;
      updateAuthUI();
      return;
    }

    setTimeout(() => {
      if (event === "SIGNED_OUT") {
        state.recoveryMode = false;
        void setCurrentUser(null);
        return;
      }

      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        void setCurrentUser(session?.user || null);
      }
    }, 0);
  });
}

/* =====================================================
   21. APP INITIALIZATION
===================================================== */

async function init() {
  console.log("AnimeNoona ♡ initializing...");

  renderWatchlist();
  renderContinue();

  try {
    await initAuth();
    await loadAnime();

    console.log("AnimeNoona ♡ ready!");

  } catch (error) {
    console.error("App initialization error:", error);
  }
}

init();
