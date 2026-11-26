
/* =====================================================
   ANIMENOONA ♡ — PROFESSIONAL COMPLETE APP.JS
   Supabase + Anime Library + Player + Episode Subtitles
===================================================== */

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

/* =============== 1. SUPABASE CONFIG =============== */

const SUPABASE_URL = "https://yvfstkkcetyavpzqytde.supabase.co";
const SUPABASE_KEY = "sb_publishable_NgpGgHlXHz_DdJfsRLA6Ug_InIZwy8D";

const DB_TABLE = "anime_uploads";
const ADMIN_TABLE = "admin_users";
const STORAGE_BUCKET = "anime-media";

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

/* =============== 2. HTML ELEMENTS =============== */

const $ = id => document.getElementById(id);

const el = {
  user: $("user"),
  logoutBtn: $("logoutBtn"),
  headerLoginBtn: $("headerLoginBtn"),

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

  newPassword: $("newPassword"),
  confirmPassword: $("confirmPassword"),
  updatePasswordBtn: $("updatePasswordBtn"),

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
  subtitleEpisodeSelect: $("subtitleEpisodeSelect"),
  subtitleLanguageUpload: $("subtitleLanguageUpload"),
  subtitleFileUpload: $("subtitleFileUpload"),
  subtitleUploadButton: $("subtitleUploadButton"),
  subtitleUploadMessage: $("subtitleUploadMessage"),

  menuBtn: $("menuBtn"),
  mainNav: $("mainNav"),
  exploreBtn: $("exploreBtn"),
  heroWatchBtn: $("heroWatchBtn")
};

/* =============== 3. APP STATE =============== */

const state = {
  rows: [],
  anime: [],
  currentAnime: null,
  currentEpisode: null,
  episodes: [],
  user: null,
  isAdmin: false,
  lastAdminCheck: null,

  watchlist: readJSON("animenoona_watchlist", []),
  history: readJSON("animenoona_history", [])
};

/* =============== 4. HELPERS =============== */

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
    console.warn("Local storage error:", error);
  }
}

function say(node, message = "", error = false) {
  if (!node) return;
  node.textContent = message;
  node.classList.toggle("error", Boolean(error));
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function scrollToSection(id) {
  $(id)?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function slug(value) {
  return String(value || "file")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeTitle(value) {
  return String(value || "").trim().toLowerCase();
}

function subtitleKey(episodeId) {
  return String(episodeId);
}

function getSubtitles() {
  return readJSON("animenoona_episode_subtitles", {});
}

function saveSubtitles(value) {
  saveJSON("animenoona_episode_subtitles", value);
}

function languageLabel(language) {
  const labels = {
    Japanese: "🇯🇵 Japanese",
    English: "🇬🇧 English",
    "Hindi (Hinglish)": "🇮🇳 Hindi (Hinglish / Roman)",
    "Hindi (Devanagari)": "🇮🇳 Hindi (देवनागरी)"
  };

  return labels[language] || language;
}

function languageCode(language) {
  const codes = {
    Japanese: "ja",
    English: "en",
    "Hindi (Hinglish)": "hi-Latn",
    "Hindi (Devanagari)": "hi"
  };

  return codes[language] || "en";
}

function requireAdmin(messageNode) {
  if (!state.user) {
    say(messageNode, "Please login first.", true);
    return false;
  }

  if (!state.isAdmin) {
    say(messageNode, "Admin access required.", true);
    return false;
  }

  return true;
}

/* =============== 5. DATABASE NORMALIZATION =============== */

function normalizeRow(row) {
  return {
    id: row.id,
    title: row.title || "Untitled Anime",
    description: row.description || "",
    episode: Number(row.episode || 1),
    genre: row.genre || "Anime",
    language: row.language || "",
    video: row.video_url || "",
    poster: row.poster_url || "",
    createdAt: row.created_at || ""
  };
}

function groupAnime(rows) {
  const groups = new Map();

  rows.forEach(row => {
    const key = normalizeTitle(row.title);

    if (!groups.has(key)) {
      groups.set(key, {
        id: key,
        title: row.title,
        description: row.description,
        genre: row.genre,
        language: row.language,
        poster: row.poster,
        episodes: []
      });
    }

    const anime = groups.get(key);

    if (!anime.poster && row.poster) {
      anime.poster = row.poster;
    }

    anime.episodes.push(row);
  });

  return [...groups.values()].map(anime => ({
    ...anime,
    episodes: anime.episodes.sort((a, b) => a.episode - b.episode)
  }));
}

/* =============== 6. AUTHENTICATION =============== */

async function account(mode) {
  const email = el.emailInput?.value.trim();
  const password = el.passwordInput?.value || "";

  if (!email || !password) {
    say(el.accountMessage, "Enter email and password.", true);
    return;
  }

  if (password.length < 6) {
    say(el.accountMessage, "Password must be at least 6 characters.", true);
    return;
  }

  el.loginBtn.disabled = true;
  el.signupBtn.disabled = true;

  say(el.accountMessage, "Please wait...");

  try {
    const result = mode === "signup"
      ? await db.auth.signUp({ email, password })
      : await db.auth.signInWithPassword({ email, password });

    if (result.error) throw result.error;

    if (mode === "signup" && !result.data.session) {
      say(
        el.accountMessage,
        "Account created! Please verify your email before logging in."
      );
      return;
    }

    say(
      el.accountMessage,
      mode === "signup"
        ? "Account created successfully!"
        : "Login successful! Welcome to AnimeNoona ♡"
    );

    await refreshSession(result.data.user);

  } catch (error) {
    console.error("Authentication error:", error);
    say(el.accountMessage, error.message, true);

  } finally {
    el.loginBtn.disabled = false;
    el.signupBtn.disabled = false;
  }
}

async function refreshSession(user = null) {
  state.user = user;
  state.isAdmin = false;

  if (user) {
    try {
      const { data, error } = await db
        .from(ADMIN_TABLE)
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      state.isAdmin = Boolean(
        data && String(data.role).toLowerCase() === "admin"
      );

    } catch (error) {
      console.warn("Admin check:", error);
      state.isAdmin = false;
    }
  }

  if (el.user) {
    el.user.textContent = user?.email || "Guest";
  }

  if (el.accountUser) {
    el.accountUser.textContent = user
      ? `Signed in as ${user.email}`
      : "Guest";
  }

  if (el.accountInfo) {
    el.accountInfo.hidden = !user;
  }

  if (el.loginPanel) {
    el.loginPanel.hidden = Boolean(user);
  }

  if (el.logoutBtn) {
    el.logoutBtn.hidden = !user;
  }

  if (el.headerLoginBtn) {
    el.headerLoginBtn.hidden = Boolean(user);
  }

  if (el.adminDashboard) {
    el.adminDashboard.hidden = !state.isAdmin;
  }

  say(
    el.adminStatus,
    state.isAdmin
      ? "Admin access granted ♡"
      : "Admin access not available."
  );

  renderSubtitleAnimeSelect();
}

async function logout() {
  const { error } = await db.auth.signOut();

  if (error) {
    say(el.accountMessage, error.message, true);
    return;
  }

  state.user = null;
  state.isAdmin = false;

  await refreshSession(null);

  say(el.accountMessage, "Logged out successfully.");
}

/* =============== 7. PASSWORD RECOVERY =============== */

function showResetPanel() {
  if (el.loginPanel) el.loginPanel.hidden = true;
  if (el.resetPanel) el.resetPanel.hidden = false;
  if (el.accountInfo) el.accountInfo.hidden = true;

  scrollToSection("account");

  say(el.resetMessage, "Enter your new password.");
}

async function sendPasswordReset() {
  const email = el.emailInput?.value.trim();

  if (!email) {
    say(el.accountMessage, "Enter your email first.", true);
    return;
  }

  say(el.accountMessage, "Sending reset link...");

  try {
    const { error } = await db.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname
    });

    if (error) throw error;

    say(el.accountMessage, "Password reset link sent to your email.");

  } catch (error) {
    say(el.accountMessage, error.message, true);
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

  el.updatePasswordBtn.disabled = true;

  try {
    const { error } = await db.auth.updateUser({ password });

    if (error) throw error;

    say(el.resetMessage, "Password updated successfully! ♡");

    el.newPassword.value = "";
    el.confirmPassword.value = "";

    if (el.loginPanel) el.loginPanel.hidden = false;
    if (el.resetPanel) el.resetPanel.hidden = true;

  } catch (error) {
    say(el.resetMessage, error.message, true);

  } finally {
    el.updatePasswordBtn.disabled = false;
  }
}

/* =============== 8. LOAD ANIME LIBRARY =============== */

async function loadAnime() {
  say(el.libraryMessage, "Loading anime...");

  try {
    const { data, error } = await db
      .from(DB_TABLE)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    state.rows = (data || []).map(normalizeRow);
    state.anime = groupAnime(state.rows);

    renderAnime();
    renderSubtitleAnimeSelect();

    say(
      el.libraryMessage,
      state.anime.length ? "" : "No anime uploaded yet."
    );

  } catch (error) {
    console.error("Anime loading error:", error);

    state.rows = [];
    state.anime = [];

    renderAnime();

    say(
      el.libraryMessage,
      `Anime load failed: ${error.message}`,
      true
    );
  }
}

/* =============== 9. SEARCH AND FILTERS =============== */

function filteredAnime() {
  const query = (el.searchInput?.value || "").trim().toLowerCase();
  const genre = (el.genreFilter?.value || "All").toLowerCase();
  const language = (el.languageFilter?.value || "All").toLowerCase();

  return state.anime.filter(anime => {
    const searchable = [
      anime.title,
      anime.description,
      anime.genre
    ].join(" ").toLowerCase();

    const genres = anime.genre
      .split(",")
      .map(item => item.trim().toLowerCase());

    return (
      (!query || searchable.includes(query)) &&
      (genre === "all" || genres.includes(genre)) &&
      (
        language === "all" ||
        anime.language.toLowerCase() === language
      )
    );
  });
}

/* =============== 10. ANIME CARDS =============== */

function animeCard(anime) {
  const saved = state.watchlist.some(
    item => String(item.id) === String(anime.id)
  );

  const poster = anime.poster
    ? `<img
        src="${escapeHTML(anime.poster)}"
        alt="${escapeHTML(anime.title)}"
        loading="lazy"
        onerror="this.style.display='none';this.nextElementSibling.hidden=false"
      >
      <div class="poster-placeholder" hidden>
        ${escapeHTML(anime.title)}
      </div>`
    : `<div class="poster-placeholder">
        <span>♡</span>
        <b>${escapeHTML(anime.title)}</b>
        <small>ANIMENOONA</small>
      </div>`;

  return `
    <article class="anime-card">
      <div class="anime-poster">
        ${poster}
        <span class="poster-tag">ANIME</span>
      </div>

      <div class="anime-info">
        <h3>${escapeHTML(anime.title)}</h3>
        <p>${escapeHTML(anime.genre)}</p>
        <p>${escapeHTML(anime.language)}</p>

        <div class="anime-meta">
          <button
            type="button"
            class="small-btn"
            data-action="watch"
            data-id="${escapeHTML(anime.id)}"
          >▶ Watch</button>

          <button
            type="button"
            class="save-anime"
            data-action="save"
            data-id="${escapeHTML(anime.id)}"
          >${saved ? "♥ Saved" : "♡ Save"}</button>
        </div>
      </div>
    </article>
  `;
}

function renderAnime() {
  const items = filteredAnime();

  if (el.animeGrid) {
    el.animeGrid.innerHTML = items.length
      ? items.map(animeCard).join("")
      : `<p class="empty-message">No anime found.</p>`;
  }

  if (el.animeCount) {
    el.animeCount.textContent = `${items.length} Anime`;
  }

  renderWatchlist();
  renderContinue();
}

function renderWatchlist() {
  if (!el.watchlistGrid) return;

  const items = state.watchlist
    .map(saved => state.anime.find(a => a.id === saved.id))
    .filter(Boolean);

  el.watchlistGrid.innerHTML = items.length
    ? items.map(animeCard).join("")
    : `<p class="empty-message">Your watchlist is empty.</p>`;
}

function renderContinue() {
  if (!el.continueGrid) return;

  const items = state.history
    .map(saved => state.anime.find(a => a.id === saved.id))
    .filter(Boolean);

  el.continueGrid.innerHTML = items.length
    ? items.map(animeCard).join("")
    : `<p class="empty-message">Your watch history will appear here.</p>`;
}

function toggleWatchlist(id) {
  const anime = state.anime.find(item => item.id === id);

  if (!anime) return;

  const exists = state.watchlist.some(item => item.id === id);

  state.watchlist = exists
    ? state.watchlist.filter(item => item.id !== id)
    : [anime, ...state.watchlist];

  saveJSON("animenoona_watchlist", state.watchlist);

  renderAnime();
}

/* =============== 11. ANIME PLAYER =============== */

async function watchAnime(id) {
  const anime = state.anime.find(item => item.id === id);

  if (!anime) return;

  state.currentAnime = anime;
  state.episodes = anime.episodes || [];

  if (el.playerTitle) {
    el.playerTitle.textContent = anime.title;
  }

  if (el.nowPlayingTitle) {
    el.nowPlayingTitle.textContent = anime.title;
  }

  if (el.playerDescription) {
    el.playerDescription.textContent =
      anime.description || anime.genre;
  }

  state.history = [
    {
      id: anime.id,
      title: anime.title,
      genre: anime.genre,
      language: anime.language,
      poster: anime.poster
    },
    ...state.history.filter(item => item.id !== anime.id)
  ].slice(0, 12);

  saveJSON("animenoona_history", state.history);

  renderContinue();
  scrollToSection("player");

  if (el.episodeSelect) {
    el.episodeSelect.innerHTML =
      `<option value="">Select Episode</option>` +
      state.episodes.map(ep => `
        <option value="${escapeHTML(ep.id)}">
          Episode ${ep.episode}
        </option>
      `).join("");
  }

  clearPlayer();

  if (!state.episodes.length) {
    say(el.playerMessage, "No episodes available yet.");
    return;
  }

  if (state.episodes.length === 1) {
    el.episodeSelect.value = String(state.episodes[0].id);
    await playEpisode(state.episodes[0].id);
  } else {
    say(el.playerMessage, "Select an episode to start watching.");
  }
}

function clearPlayer() {
  state.currentEpisode = null;

  if (el.animeVideo) {
    el.animeVideo.pause();
    el.animeVideo.removeAttribute("src");

    el.animeVideo.querySelectorAll("track").forEach(track => {
      track.remove();
    });

    el.animeVideo.load();
  }

  if (el.subtitleSelect) {
    el.subtitleSelect.innerHTML =
      `<option value="off">Subtitles Off</option>`;
  }

  say(el.subtitleStatus, "Choose a subtitle language.");
}

async function playEpisode(episodeId) {
  const episode = state.episodes.find(
    item => String(item.id) === String(episodeId)
  );

  if (!episode || !el.animeVideo) return;

  if (!episode.video) {
    say(el.playerMessage, "Video URL missing.", true);
    return;
  }

  state.currentEpisode = episode;

  el.animeVideo.pause();
  el.animeVideo.querySelectorAll("track").forEach(track => track.remove());

  el.animeVideo.src = episode.video;
  el.animeVideo.load();

  el.animeVideo.play().catch(() => {
    say(el.playerMessage, "Press Play to start the video.");
  });

  if (el.nowPlayingTitle) {
    el.nowPlayingTitle.textContent =
      `${state.currentAnime.title} — Episode ${episode.episode}`;
  }

  say(el.playerMessage, "Episode selected.");

  await loadSubtitleOptions(episode);
}

/* =============== 12. SUBTITLE SYSTEM =============== */

async function loadSubtitleOptions(episode) {
  const library = getSubtitles();
  const saved = library[subtitleKey(episode.id)] || {};
  const languages = Object.keys(saved);

  if (el.subtitleSelect) {
    el.subtitleSelect.innerHTML =
      `<option value="off">Subtitles Off</option>` +
      languages.map(language => `
        <option value="${escapeHTML(language)}">
          ${escapeHTML(languageLabel(language))}
        </option>
      `).join("");
  }

  say(
    el.subtitleStatus,
    languages.length
      ? "Subtitles available for this episode."
      : "No subtitles uploaded for this episode."
  );
}

function applySubtitle(language) {
  const video = el.animeVideo;
  const episode = state.currentEpisode;

  if (!video || !episode) return;

  video.querySelectorAll("track").forEach(track => track.remove());

  [...video.textTracks].forEach(track => {
    track.mode = "disabled";
  });

  if (!language || language === "off") {
    say(el.subtitleStatus, "Subtitles off.");
    return;
  }

  const library = getSubtitles();
  const saved = library[subtitleKey(episode.id)] || {};
  const subtitleUrl = saved[language];

  if (!subtitleUrl) {
    say(el.subtitleStatus, "Selected subtitle is not available.", true);
    return;
  }

  const track = document.createElement("track");

  track.kind = "subtitles";
  track.label = languageLabel(language);
  track.srclang = languageCode(language);
  track.src = subtitleUrl;
  track.default = true;

  video.appendChild(track);

  const activateTrack = () => {
    const activeTrack = [...video.textTracks].find(
      item => item.language === languageCode(language)
    );

    if (activeTrack) {
      activeTrack.mode = "showing";
    }
  };

  track.addEventListener("load", activateTrack, { once: true });

  say(el.subtitleStatus, `${languageLabel(language)} selected.`);
}

/* =============== 13. ADMIN SUBTITLE SELECTS =============== */

function renderSubtitleAnimeSelect() {
  if (!el.subtitleAnimeSelect) return;

  const current = el.subtitleAnimeSelect.value;

  el.subtitleAnimeSelect.innerHTML =
    `<option value="">Select Anime</option>` +
    state.anime.map(anime => `
      <option value="${escapeHTML(anime.id)}">
        ${escapeHTML(anime.title)}
      </option>
    `).join("");

  if (state.anime.some(item => item.id === current)) {
    el.subtitleAnimeSelect.value = current;
  }

  renderSubtitleEpisodeSelect();
}

function renderSubtitleEpisodeSelect() {
  if (!el.subtitleEpisodeSelect) return;

  const animeId = el.subtitleAnimeSelect?.value;
  const anime = state.anime.find(item => item.id === animeId);
  const episodes = anime?.episodes || [];

  el.subtitleEpisodeSelect.innerHTML =
    `<option value="">Select Episode</option>` +
    episodes.map(ep => `
      <option value="${escapeHTML(ep.id)}">
        Episode ${ep.episode}
      </option>
    `).join("");
}

/* =============== 14. STORAGE UPLOAD =============== */

async function uploadToStorage(file, folder) {
  const fileName = `${Date.now()}-${slug(file.name)}`;
  const path = `${folder}/${fileName}`;

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

/* =============== 15. ANIME UPLOAD =============== */

async function uploadAnime(event) {
  event.preventDefault();

  if (!requireAdmin(el.uploadMessage)) return;

  const title = el.uploadTitle.value.trim();
  const description = el.uploadDescription.value.trim();
  const genre = el.uploadGenre.value;
  const language = el.uploadLanguage.value;
  const episode = Number(el.uploadEpisode.value || 1);

  const videoFile = el.uploadVideo.files?.[0];
  const posterFile = el.uploadPoster.files?.[0];

  if (!title || !videoFile) {
    say(el.uploadMessage, "Title and video are required.", true);
    return;
  }

  if (!Number.isInteger(episode) || episode < 1) {
    say(el.uploadMessage, "Enter a valid episode number.", true);
    return;
  }

  el.uploadButton.disabled = true;
  say(el.uploadMessage, "Uploading anime files...");

  try {
    const videoUrl = await uploadToStorage(videoFile, "videos");

    const posterUrl = posterFile
      ? await uploadToStorage(posterFile, "posters")
      : "";

    const { error } = await db.from(DB_TABLE).insert({
      title,
      description,
      episode,
      genre,
      language,
      video_url: videoUrl,
      poster_url: posterUrl
    });

    if (error) throw error;

    say(el.uploadMessage, "Anime episode uploaded successfully! ♡");

    el.uploadForm.reset();

    await loadAnime();

  } catch (error) {
    console.error("Anime upload:", error);
    say(el.uploadMessage, `Upload failed: ${error.message}`, true);

  } finally {
    el.uploadButton.disabled = false;
  }
}

/* =============== 16. SUBTITLE UPLOAD =============== */

async function uploadSubtitle() {
  if (!requireAdmin(el.subtitleUploadMessage)) return;

  const animeId = el.subtitleAnimeSelect?.value;
  const episodeId = el.subtitleEpisodeSelect?.value;
  const language = el.subtitleLanguageUpload?.value;
  const file = el.subtitleFileUpload?.files?.[0];

  if (!animeId || !episodeId || !language || !file) {
    say(
      el.subtitleUploadMessage,
      "Select anime, episode, language and subtitle file.",
      true
    );
    return;
  }

  if (!file.name.toLowerCase().endsWith(".vtt")) {
    say(el.subtitleUploadMessage, "Only .vtt files are supported.", true);
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    say(el.subtitleUploadMessage, "Subtitle file must be smaller than 5 MB.", true);
    return;
  }

  el.subtitleUploadButton.disabled = true;
  say(el.subtitleUploadMessage, "Checking subtitle file...");

  try {
    const content = await file.text();

    if (!content.trim().startsWith("WEBVTT")) {
      throw new Error("Invalid VTT file. File must start with WEBVTT.");
    }

    say(el.subtitleUploadMessage, "Uploading subtitle...");

    const url = await uploadToStorage(file, "subtitles");

    const library = getSubtitles();
    const key = subtitleKey(episodeId);

    if (!library[key]) {
      library[key] = {};
    }

    library[key][language] = url;

    saveSubtitles(library);

    say(
      el.subtitleUploadMessage,
      `${languageLabel(language)} uploaded successfully! ♡`
    );

    el.subtitleFileUpload.value = "";

    if (
      state.currentEpisode &&
      String(state.currentEpisode.id) === String(episodeId)
    ) {
      await loadSubtitleOptions(state.currentEpisode);

      el.subtitleSelect.value = language;
      applySubtitle(language);
    }

  } catch (error) {
    console.error("Subtitle upload:", error);

    say(
      el.subtitleUploadMessage,
      `Subtitle upload failed: ${error.message}`,
      true
    );

  } finally {
    el.subtitleUploadButton.disabled = false;
  }
}

/* =============== 17. EVENT LISTENERS =============== */

el.signupBtn?.addEventListener("click", () => account("signup"));
el.loginBtn?.addEventListener("click", () => account("login"));
el.logoutBtn?.addEventListener("click", logout);
el.forgotBtn?.addEventListener("click", sendPasswordReset);
el.updatePasswordBtn?.addEventListener("click", updatePassword);

el.passwordInput?.addEventListener("keydown", event => {
  if (event.key === "Enter") account("login");
});

el.uploadForm?.addEventListener("submit", uploadAnime);
el.subtitleUploadButton?.addEventListener("click", uploadSubtitle);

el.subtitleAnimeSelect?.addEventListener(
  "change",
  renderSubtitleEpisodeSelect
);

el.subtitleSelect?.addEventListener("change", event => {
  applySubtitle(event.target.value);
});

el.episodeSelect?.addEventListener("change", event => {
  if (event.target.value) {
    playEpisode(event.target.value);
  }
});

el.searchInput?.addEventListener("input", renderAnime);
el.genreFilter?.addEventListener("change", renderAnime);
el.languageFilter?.addEventListener("change", renderAnime);

function handleCardClick(event) {
  const button = event.target.closest("button[data-action]");

  if (!button) return;

  const id = button.dataset.id;

  if (button.dataset.action === "watch") {
    watchAnime(id);
  }

  if (button.dataset.action === "save") {
    toggleWatchlist(id);
  }
}

el.animeGrid?.addEventListener("click", handleCardClick);
el.watchlistGrid?.addEventListener("click", handleCardClick);
el.continueGrid?.addEventListener("click", handleCardClick);

document.querySelectorAll(".genre-card[data-genre]").forEach(button => {
  button.addEventListener("click", () => {
    if (el.genreFilter) {
      el.genreFilter.value = button.dataset.genre;
    }

    renderAnime();
    scrollToSection("library");
  });
});

el.exploreBtn?.addEventListener("click", () => {
  scrollToSection("library");
});

el.heroWatchBtn?.addEventListener("click", () => {
  const firstAnime = state.anime[0];

  if (firstAnime) {
    watchAnime(firstAnime.id);
  } else {
    scrollToSection("library");
  }
});

el.headerLoginBtn?.addEventListener("click", () => {
  scrollToSection("account");
});

el.menuBtn?.addEventListener("click", () => {
  el.mainNav?.classList.toggle("active");
});

el.mainNav?.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    el.mainNav?.classList.remove("active");
  });
});

/* =============== 18. INITIALIZATION =============== */

async function init() {
  say(el.libraryMessage, "Connecting to AnimeNoona...");

  // Show reset form when Supabase redirects after password recovery.
  if (window.location.hash.includes("type=recovery")) {
    showResetPanel();
  }

  // Load library once, separately from authentication updates.
  await loadAnime();

  // Get existing session.
  const { data, error } = await db.auth.getSession();

  if (error) {
    console.warn("Session check:", error);
  }

  await refreshSession(data?.session?.user || null);

  // Listen for login, logout and recovery events.
  db.auth.onAuthStateChange((event, session) => {
    Promise.resolve().then(async () => {
      if (event === "PASSWORD_RECOVERY") {
        showResetPanel();
      }

      await refreshSession(session?.user || null);
    });
  });
}

init();
