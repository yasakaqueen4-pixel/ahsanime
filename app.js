
/* ==========================================
   AnimeNoona — app.js
   Supabase + Anime Library + Player + Admin
========================================== */

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

/* SUPABASE — EXISTING PROJECT */
const SUPABASE_URL = "https://yvfstkkcetyavpzqytde.supabase.co";
const SUPABASE_KEY = "sb_publishable_NgpGgHlXHz_DdJfsRLA6Ug_InIZwy8D";

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

const $ = id => document.getElementById(id);
const first = (...ids) => ids.map($).find(Boolean);

let animeList = [];
let currentAnime = null;
let currentEpisodes = [];
let isAdmin = false;

const video = first("animeVideo", "video");

const el = {
  grid: first("animeGrid", "cards"),
  search: first("searchInput", "search"),
  genre: first("genreFilter", "genre"),
  language: first("languageFilter"),
  watchlist: first("watchlistGrid", "watchlist"),
  continue: first("continueGrid", "continueList"),

  title: first("playerTitle"),
  nowPlaying: first("nowPlayingTitle", "nowPlaying"),
  description: first("playerDescription"),
  episode: first("episodeSelect"),
  subtitle: first("subtitleSelect"),

  accountUser: first("accountUser", "user"),
  email: first("emailInput", "email"),
  password: first("passwordInput", "password"),
  accountMessage: first("accountMessage", "message"),
  loginPanel: first("loginPanel", "loginBox"),
  resetPanel: first("resetPanel", "resetBox"),
  newPassword: first("newPassword", "newPass"),
  confirmPassword: first("confirmPassword", "confirmPass"),
  resetMessage: first("resetMessage", "resetMsg"),

  admin: first("adminDashboard", "admin"),
  adminStatus: first("adminStatus", "adminMsg"),
  uploadForm: first("uploadForm"),
  uploadTitle: first("uploadTitle", "titleInput", "title"),
  uploadDescription: first("uploadDescription", "descInput", "description"),
  uploadGenre: first("uploadGenre", "genreInput", "animeGenre"),
  uploadLanguage: first("uploadLanguage", "langInput", "language"),
  uploadEpisode: first("uploadEpisode", "epNum", "episode"),
  uploadVideo: first("uploadVideo", "videoFile"),
  uploadPoster: first("uploadPoster", "posterFile", "posterInput"),
  uploadMessage: first("uploadMessage", "uploadMsg"),

  subtitleAnime: first("subtitleAnimeSelect"),
  subtitleLanguage: first("subtitleLanguageUpload"),
  subtitleFile: first("subtitleFileUpload"),
  subtitleMessage: first("subtitleUploadMessage"),

  status: first("libraryMessage", "status", "subtitleStatus"),
  logout: first("logoutBtn", "logout")
};

function say(element, message, error = false) {
  if (!element) return;
  element.textContent = message;
  element.style.color = error ? "#ff8299" : "#d8a1ff";
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

function getStore(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

let watchlist = getStore("noonaWatchlist");
let recentlyWatched = getStore("noonaRecent");

function saveStore() {
  localStorage.setItem("noonaWatchlist", JSON.stringify(watchlist));
  localStorage.setItem("noonaRecent", JSON.stringify(recentlyWatched));
}

function getAnime(id) {
  return animeList.find(item => String(item.id) === String(id)) ||
    watchlist.find(item => String(item.id) === String(id)) ||
    recentlyWatched.find(item => String(item.id) === String(id));
}

/* ANIME CARDS */

function makeCard(item, saved = false, recent = false) {
  return `
    <article class="anime-card">
      <div class="poster">
        ${item.poster_url
          ? `<img src="${escapeHTML(item.poster_url)}" alt="${escapeHTML(item.title)}" loading="lazy">`
          : `<span>${escapeHTML(item.title)}</span>`}
      </div>

      <div class="info">
        <h3>${escapeHTML(item.title)}</h3>
        <p>${escapeHTML(item.genre || "Anime")} · ${escapeHTML(item.language || "")}</p>

        <div class="card-actions">
          <button type="button" data-watch="${escapeHTML(item.id)}">
            ${recent ? "▶ Continue" : "▶ Watch"}
          </button>

          <button type="button" data-save="${escapeHTML(item.id)}">
            ${saved ? "♥ Saved" : "♡ Watchlist"}
          </button>
        </div>
      </div>
    </article>
  `;
}

function renderLibrary() {
  if (!el.grid) return;

  const query = (el.search?.value || "").trim().toLowerCase();
  const genre = (el.genre?.value || "all").toLowerCase();
  const language = (el.language?.value || "all").toLowerCase();

  const filtered = animeList.filter(item => {
    const text = `${item.title || ""} ${item.description || ""} ${item.genre || ""}`.toLowerCase();

    const matchesSearch = text.includes(query);
    const matchesGenre = genre === "all" ||
      String(item.genre || "").toLowerCase().includes(genre);

    const matchesLanguage = language === "all" ||
      String(item.language || "").toLowerCase() === language;

    return matchesSearch && matchesGenre && matchesLanguage;
  });

  el.grid.innerHTML = filtered.length
    ? filtered.map(item => makeCard(
        item,
        watchlist.some(x => String(x.id) === String(item.id))
      )).join("")
    : `<p class="empty-message">No anime found.</p>`;

  const count = first("animeCount");
  if (count) count.textContent = `${filtered.length} Anime`;

  renderPersonalLists();
}

function renderPersonalLists() {
  if (el.watchlist) {
    el.watchlist.innerHTML = watchlist.length
      ? watchlist.map(item => makeCard(item, true)).join("")
      : `<p>No anime saved yet.</p>`;
  }

  if (el.continue) {
    el.continue.innerHTML = recentlyWatched.length
      ? recentlyWatched.map(item => makeCard(item, false, true)).join("")
      : `<p>No recently watched anime.</p>`;
  }
}

function toggleWatchlist(id) {
  const item = getAnime(id);
  if (!item) return;

  const exists = watchlist.some(x => String(x.id) === String(id));

  if (exists) {
    watchlist = watchlist.filter(x => String(x.id) !== String(id));
  } else {
    watchlist.unshift({ ...item });
  }

  saveStore();
  renderLibrary();
}

/* LOAD ANIME FROM SUPABASE */

async function loadAnime() {
  if (el.grid) el.grid.innerHTML = "<p>Loading anime...</p>";

  const { data, error } = await db
    .from("anime_uploads")
    .select("id,title,description,genre,language,video_url,poster_url,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    if (el.grid) {
      el.grid.innerHTML = `<p>Could not load anime: ${escapeHTML(error.message)}</p>`;
    }
    say(el.status, error.message, true);
    return;
  }

  animeList = data || [];
  renderLibrary();
  updateSubtitleAnimeList();
  say(el.status, "Anime library loaded.");
}

/* WATCH ANIME */

async function watchAnime(id) {
  const item = getAnime(id);
  if (!item || !video) return;

  currentAnime = item;

  if (el.title) el.title.textContent = item.title || "Anime Player";
  if (el.nowPlaying) el.nowPlaying.textContent = item.title || "";
  if (el.description) el.description.textContent = item.description || "";

  video.pause();
  video.removeAttribute("src");
  video.querySelectorAll("track").forEach(track => track.remove());

  await loadEpisodes(item);

  const episode = currentEpisodes[0];
  const videoURL = episode?.video_url || item.video_url;

  if (videoURL) {
    video.src = videoURL;
    video.load();
  }

  recentlyWatched = [
    { ...item },
    ...recentlyWatched.filter(x => String(x.id) !== String(item.id))
  ].slice(0, 12);

  saveStore();
  renderPersonalLists();

  if (first("player")) {
    first("player").scrollIntoView({ behavior: "smooth" });
  }

  await loadSubtitles(item.id);
}

/* EPISODE SYSTEM */

async function loadEpisodes(item) {
  currentEpisodes = [];

  const { data, error } = await db
    .from("anime_episodes")
    .select("id,anime_id,episode,title,video_url,language,created_at")
    .eq("anime_id", item.id)
    .order("episode", { ascending: true });

  if (!error && data?.length) {
    currentEpisodes = data;
  } else if (item.video_url) {
    currentEpisodes = [{
      id: item.id,
      anime_id: item.id,
      episode: 1,
      title: "Episode 1",
      video_url: item.video_url,
      language: item.language
    }];
  }

  if (el.episode) {
    el.episode.innerHTML = currentEpisodes.map((ep, index) => `
      <option value="${index}">
        Episode ${escapeHTML(ep.episode)} — ${escapeHTML(ep.title || "")}
      </option>
    `).join("");

    el.episode.hidden = currentEpisodes.length <= 1;
  }
}

el.episode?.addEventListener("change", async () => {
  const episode = currentEpisodes[Number(el.episode.value)];
  if (!episode || !video) return;

  video.pause();
  video.src = episode.video_url;
  video.load();

  if (el.nowPlaying) {
    el.nowPlaying.textContent =
      `${currentAnime?.title || "Anime"} — Episode ${episode.episode}`;
  }

  await loadSubtitles(currentAnime.id);
});

/* SUBTITLE / CC SYSTEM
   Storage path:
   subtitles/ANIME_ID/hi.vtt
   subtitles/ANIME_ID/en.vtt
   subtitles/ANIME_ID/ja.vtt
   subtitles/ANIME_ID/hi-Latn.vtt
*/

const subtitleNames = {
  off: "Off",
  ja: "Japanese",
  en: "English",
  hi: "Hindi",
  "hi-Latn": "Hinglish (Roman)"
};

async function loadSubtitles(animeId) {
  if (!video || !el.subtitle) return;

  video.querySelectorAll("track").forEach(track => track.remove());

  const selected = el.subtitle.value || "off";

  el.subtitle.innerHTML = `
    <option value="off">Subtitles Off</option>
    <option value="ja">Japanese</option>
    <option value="en">English</option>
    <option value="hi">Hindi</option>
    <option value="hi-Latn">Hinglish (Roman)</option>
  `;

  el.subtitle.value = selected;

  if (selected === "off") return;

  const path = `subtitles/${animeId}/${selected}.vtt`;
  const { data } = db.storage.from("anime-media").getPublicUrl(path);

  const track = document.createElement("track");
  track.kind = "subtitles";
  track.label = subtitleNames[selected];
  track.srclang = selected;
  track.src = data.publicUrl;
  track.default = true;
  video.appendChild(track);

  track.addEventListener("load", () => {
    const tracks = video.textTracks;
    if (tracks.length) tracks[tracks.length - 1].mode = "showing";
  });
}

el.subtitle?.addEventListener("change", async () => {
  if (!currentAnime) return;
  await loadSubtitles(currentAnime.id);
});

/* AUTH — SIGNUP AND LOGIN */

async function account(mode) {
  const email = el.email?.value.trim();
  const password = el.password?.value;

  if (!email || !password) {
    say(el.accountMessage, "Enter your email and password.", true);
    return;
  }

  say(el.accountMessage, "Please wait...");

  const result = mode === "signup"
    ? await db.auth.signUp({ email, password })
    : await db.auth.signInWithPassword({ email, password });

  if (result.error) {
    say(el.accountMessage, result.error.message, true);
    return;
  }

  say(
    el.accountMessage,
    mode === "signup"
      ? "Account created. Check your email if confirmation is enabled."
      : "Login successful."
  );

  await checkAdmin();
  await loadAnime();
}

first("signupBtn")?.addEventListener("click", () => account("signup"));
first("loginBtn")?.addEventListener("click", () => account("login"));

/* FORGOT PASSWORD */

async function forgotPassword() {
  const email = el.email?.value.trim();

  if (!email) {
    say(el.accountMessage, "Enter your email address first.", true);
    return;
  }

  say(el.accountMessage, "Sending reset link...");

  const { error } = await db.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + window.location.pathname
  });

  say(
    el.accountMessage,
    error ? error.message : "Reset link sent. Check your email and spam folder.",
    !!error
  );
}

first("forgotBtn")?.addEventListener("click", forgotPassword);

/* UPDATE PASSWORD */

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

  const { error } = await db.auth.updateUser({ password });

  if (error) {
    say(el.resetMessage, error.message, true);
    return;
  }

  say(el.resetMessage, "Password updated successfully.");
  await db.auth.signOut();
  await checkAdmin();
}

first("updatePasswordBtn")?.addEventListener("click", updatePassword);

/* LOGOUT */

async function logout() {
  const { error } = await db.auth.signOut();
  say(el.accountMessage, error?.message || "Logged out.", !!error);
  await checkAdmin();
}

el.logout?.addEventListener("click", logout);

/* ADMIN ACCESS */

async function checkAdmin() {
  const { data: { session } } = await db.auth.getSession();

  if (el.accountUser) {
    el.accountUser.textContent = session ? session.user.email : "Guest";
  }

  if (el.logout) el.logout.hidden = !session;
  if (el.admin) el.admin.hidden = true;

  isAdmin = false;

  if (!session) return;

  const { data, error } = await db.rpc("is_admin");

  if (error) {
    say(el.adminStatus, error.message, true);
    return;
  }

  isAdmin = data === true;

  if (el.admin) el.admin.hidden = !isAdmin;

  say(
    el.adminStatus,
    isAdmin ? "Admin access verified." : "This account is not an admin.",
    !isAdmin
  );
}

/* ADMIN VIDEO + POSTER UPLOAD */

function cleanFileName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function uploadFile(file, path) {
  const { error } = await db.storage
    .from("anime-media")
    .upload(path, file, {
      upsert: true,
      contentType: file.type
    });

  if (error) throw error;

  return db.storage.from("anime-media").getPublicUrl(path).data.publicUrl;
}

async function uploadAnime(event) {
  event?.preventDefault();

  if (!isAdmin) {
    say(el.uploadMessage, "Admin access required.", true);
    return;
  }

  const title = el.uploadTitle?.value.trim();
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

  say(el.uploadMessage, "Uploading files... Please wait.");

  try {
    const folder = crypto.randomUUID();

    const videoURL = await uploadFile(
      videoFile,
      `anime/${folder}/${cleanFileName(videoFile.name)}`
    );

    let posterURL = null;

    if (posterFile) {
      posterURL = await uploadFile(
        posterFile,
        `posters/${folder}/${cleanFileName(posterFile.name)}`
      );
    }

    const animeData = {
      title,
      description: el.uploadDescription?.value.trim() || null,
      genre: el.uploadGenre?.value || null,
      language: el.uploadLanguage?.value || "Japanese",
      video_url: videoURL,
      poster_url: posterURL
    };

    const { data: anime, error } = await db
      .from("anime_uploads")
      .insert(animeData)
      .select()
      .single();

    if (error) throw error;

    const episodeNumber = Number(el.uploadEpisode?.value || 1);

    const { error: episodeError } = await db
      .from("anime_episodes")
      .insert({
        anime_id: anime.id,
        episode: episodeNumber,
        title: `Episode ${episodeNumber}`,
        video_url: videoURL,
        language: animeData.language
      });

    if (episodeError) {
      say(
        el.uploadMessage,
        "Anime saved, but episode record failed: " + episodeError.message,
        true
      );
    } else {
      say(el.uploadMessage, "Anime and episode uploaded successfully!");
    }

    el.uploadForm?.reset();
    await loadAnime();

  } catch (error) {
    say(el.uploadMessage, error.message || "Upload failed.", true);
  }
}

el.uploadForm?.addEventListener("submit", uploadAnime);
first("uploadButton")?.addEventListener("click", event => {
  if (!el.uploadForm) uploadAnime(event);
});

/* ADMIN SUBTITLE UPLOAD */

function updateSubtitleAnimeList() {
  if (!el.subtitleAnime) return;

  el.subtitleAnime.innerHTML = `
    <option value="">Select Anime</option>
    ${animeList.map(item => `
      <option value="${escapeHTML(item.id)}">${escapeHTML(item.title)}</option>
    `).join("")}
  `;
}

async function uploadSubtitle() {
  if (!isAdmin) {
    say(el.subtitleMessage, "Admin access required.", true);
    return;
  }

  const animeId = el.subtitleAnime?.value;
  const language = el.subtitleLanguage?.value;
  const file = el.subtitleFile?.files?.[0];

  if (!animeId || !language || !file) {
    say(el.subtitleMessage, "Select anime, language and VTT file.", true);
    return;
  }

  if (!file.name.toLowerCase().endsWith(".vtt")) {
    say(el.subtitleMessage, "Subtitle file must be .vtt format.", true);
    return;
  }

  try {
    say(el.subtitleMessage, "Uploading subtitle...");

    await uploadFile(file, `subtitles/${animeId}/${language}.vtt`);

    say(el.subtitleMessage, "Subtitle uploaded successfully!");
    if (currentAnime && String(currentAnime.id) === String(animeId)) {
      await loadSubtitles(animeId);
    }

    if (el.subtitleFile) el.subtitleFile.value = "";

  } catch (error) {
    say(el.subtitleMessage, error.message, true);
  }
}

first("subtitleUploadButton")?.addEventListener("click", uploadSubtitle);

/* CARD BUTTONS */

document.addEventListener("click", event => {
  const watchButton = event.target.closest("[data-watch]");
  const saveButton = event.target.closest("[data-save]");

  if (watchButton) watchAnime(watchButton.dataset.watch);
  if (saveButton) toggleWatchlist(saveButton.dataset.save);
});

/* SEARCH + FILTERS */

el.search?.addEventListener("input", renderLibrary);
el.genre?.addEventListener("change", renderLibrary);
el.language?.addEventListener("change", renderLibrary);

/* MOBILE MENU */

first("menuBtn")?.addEventListener("click", () => {
  const nav = document.querySelector(".navbar");
  if (nav) nav.classList.toggle("show");
});

/* AUTH STATE */

db.auth.onAuthStateChange((event) => {
  if (event === "PASSWORD_RECOVERY") {
    if (el.loginPanel) el.loginPanel.hidden = true;
    if (el.resetPanel) el.resetPanel.hidden = false;
  }

  setTimeout(async () => {
    await checkAdmin();
  }, 0);
});

/* START WEBSITE */

async function startApp() {
  say(el.status, "Connecting to AnimeNoona...");

  const { error } = await db.auth.getSession();

  if (error) {
    say(el.status, error.message, true);
    return;
  }

  await checkAdmin();
  await loadAnime();
  renderPersonalLists();

  say(el.status, "AnimeNoona is ready.");
}

startApp();
