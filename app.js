
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

/* =====================================
   ANIMENOONA — SUPABASE CONNECTION
===================================== */

const SUPABASE_URL = "https://yvfstkkcetyavpzqytde.supabase.co";
const SUPABASE_KEY = "sb_publishable_NgpGgHlXHz_DdJfsRLA6Ug_InIZwy8D";

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

const $ = id => document.getElementById(id);

let animeRows = [];
let currentAnime = null;
let currentEpisodes = [];
let isAdmin = false;

function showMessage(id, message, error = false) {
  const element = $(id);
  if (!element) return;

  element.textContent = message;
  element.style.color = error ? "#ff879b" : "#d8a1ff";
}

function safeText(value) {
  return String(value ?? "");
}

function readStorage(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

let watchlist = readStorage("noonaWatchlist");
let recent = readStorage("noonaRecent");

function saveStorage() {
  localStorage.setItem("noonaWatchlist", JSON.stringify(watchlist));
  localStorage.setItem("noonaRecent", JSON.stringify(recent));
}

/* =====================================
   ANIME LIBRARY
===================================== */

function createAnimeCard(anime, saved = false, isRecent = false) {
  const card = document.createElement("article");
  card.className = "card";

  const poster = document.createElement("div");
  poster.className = "poster";

  if (anime.poster_url) {
    const img = document.createElement("img");
    img.src = anime.poster_url;
    img.alt = anime.title || "Anime poster";
    img.loading = "lazy";
    poster.appendChild(img);
  } else {
    poster.textContent = anime.title || "Anime";
  }

  const info = document.createElement("div");
  info.className = "info";

  const title = document.createElement("h3");
  title.textContent = anime.title || "Untitled Anime";

  const details = document.createElement("p");
  details.textContent = [
    anime.genre,
    anime.language,
    anime.episode ? `Episode ${anime.episode}` : ""
  ].filter(Boolean).join(" • ");

  const actions = document.createElement("div");
  actions.className = "actions";

  const watchButton = document.createElement("button");
  watchButton.type = "button";
  watchButton.textContent = isRecent ? "▶ Continue" : "▶ Watch";
  watchButton.addEventListener("click", () => playAnime(anime));

  const saveButton = document.createElement("button");
  saveButton.type = "button";
  saveButton.className = "saveBtn";
  saveButton.textContent = saved ? "♥ Saved" : "♡ Save";

  if (saved) saveButton.classList.add("saved");

  saveButton.addEventListener("click", () => toggleWatchlist(anime.id));

  actions.append(watchButton, saveButton);
  info.append(title, details, actions);
  card.append(poster, info);

  return card;
}

function renderLibrary() {
  const container = $("cards");
  if (!container) return;

  const query = ($("search")?.value || "").trim().toLowerCase();
  const genre = ($("genre")?.value || "all").toLowerCase();

  const filtered = animeRows.filter(anime => {
    const searchable = [
      anime.title,
      anime.description,
      anime.genre,
      anime.language
    ].join(" ").toLowerCase();

    const matchesSearch = searchable.includes(query);

    const genres = safeText(anime.genre)
      .toLowerCase()
      .split(",")
      .map(item => item.trim());

    const matchesGenre = genre === "all" || genres.includes(genre);

    return matchesSearch && matchesGenre;
  });

  container.replaceChildren();

  if (!filtered.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "No anime found.";
    container.appendChild(empty);
  } else {
    filtered.forEach(anime => {
      const saved = watchlist.some(
        item => String(item.id) === String(anime.id)
      );

      container.appendChild(createAnimeCard(anime, saved));
    });
  }

  renderLists();
}

function renderLists() {
  const watchContainer = $("watchlist");
  const recentContainer = $("continueList");

  if (watchContainer) {
    watchContainer.replaceChildren();

    if (!watchlist.length) {
      watchContainer.textContent = "No saved anime yet.";
    } else {
      watchlist.forEach(anime => {
        watchContainer.appendChild(createAnimeCard(anime, true));
      });
    }
  }

  if (recentContainer) {
    recentContainer.replaceChildren();

    if (!recent.length) {
      recentContainer.textContent = "Nothing watched yet.";
    } else {
      recent.forEach(anime => {
        recentContainer.appendChild(createAnimeCard(anime, false, true));
      });
    }
  }
}

function toggleWatchlist(id) {
  const anime = animeRows.find(
    item => String(item.id) === String(id)
  );

  if (!anime) return;

  const alreadySaved = watchlist.some(
    item => String(item.id) === String(id)
  );

  if (alreadySaved) {
    watchlist = watchlist.filter(
      item => String(item.id) !== String(id)
    );
  } else {
    watchlist.unshift(anime);
  }

  saveStorage();
  renderLibrary();
}

/* =====================================
   LOAD ANIME FROM SUPABASE
===================================== */

async function loadAnime() {
  const container = $("cards");

  if (container) {
    container.textContent = "Loading anime...";
  }

  const { data, error } = await db
    .from("anime_uploads")
    .select("id,title,description,episode,genre,language,video_url,poster_url,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    if (container) {
      container.textContent = "Anime loading error: " + error.message;
    }

    showMessage("status", "Supabase error: " + error.message, true);
    return;
  }

  animeRows = data || [];

  if ($("status")) {
    $("status").textContent =
      `Supabase connected • ${animeRows.length} anime loaded`;
  }

  renderLibrary();
}

/* =====================================
   VIDEO PLAYER & EPISODES
===================================== */

function clearSubtitles() {
  const video = $("video");
  if (!video) return;

  video.querySelectorAll("track").forEach(track => track.remove());

  for (const track of video.textTracks) {
    track.mode = "disabled";
  }
}

function setVideo(url, subtitleUrl = null) {
  const video = $("video");
  if (!video) return;

  video.pause();
  clearSubtitles();

  video.removeAttribute("src");
  video.src = url || "";
  video.load();

  if (subtitleUrl) {
    const track = document.createElement("track");

    track.kind = "subtitles";
    track.label = "Subtitles";
    track.srclang = "en";
    track.src = subtitleUrl;
    track.default = true;

    video.appendChild(track);

    const subtitleInfo = $("subtitleInfo");
    if (subtitleInfo) {
      subtitleInfo.textContent = "Subtitles available";
    }
  } else {
    const subtitleInfo = $("subtitleInfo");
    if (subtitleInfo) {
      subtitleInfo.textContent = "No subtitle file available for this video.";
    }
  }
}

function addToContinueWatching(anime) {
  recent = [
    anime,
    ...recent.filter(item => String(item.id) !== String(anime.id))
  ].slice(0, 10);

  saveStorage();
  renderLists();
}

async function playAnime(anime) {
  currentAnime = anime;

  const player = $("player");
  const video = $("video");

  if (!video) return;

  if ($("playerTitle")) {
    $("playerTitle").textContent = anime.title || "Anime Player";
  }

  if ($("playerDescription")) {
    $("playerDescription").textContent = anime.description || "";
  }

  if ($("nowPlaying")) {
    $("nowPlaying").textContent = "Loading episodes...";
  }

  if (player) {
    player.scrollIntoView({ behavior: "smooth" });
  }

  addToContinueWatching(anime);

  const episodeSelect = $("episodeSelect");

  if (episodeSelect) {
    episodeSelect.replaceChildren();
    episodeSelect.hidden = true;
  }

  currentEpisodes = [];

  // Existing episodes table: anime_id, title,
  // video_url, subtitle_url, created_at

  const result = await db
    .from("episodes")
    .select("id,anime_id,title,video_url,subtitle_url,created_at")
    .eq("anime_id", anime.id)
    .order("created_at", { ascending: true });

  if (!result.error && result.data?.length) {
    currentEpisodes = result.data;

    if (episodeSelect) {
      currentEpisodes.forEach((episode, index) => {
        const option = document.createElement("option");
        option.value = String(index);
        option.textContent = episode.title || `Episode ${index + 1}`;
        episodeSelect.appendChild(option);
      });

      episodeSelect.hidden = false;

      episodeSelect.onchange = () => {
        const selected = currentEpisodes[Number(episodeSelect.value)];
        if (selected) playEpisode(selected);
      };
    }

    playEpisode(currentEpisodes[0]);
    return;
  }

  // Fallback: play the video stored directly in anime_uploads.

  if (anime.video_url) {
    setVideo(anime.video_url);

    if ($("nowPlaying")) {
      $("nowPlaying").textContent = anime.episode
        ? `Episode ${anime.episode}`
        : "Now Playing";
    }
  } else {
    if ($("nowPlaying")) {
      $("nowPlaying").textContent = "No video URL available.";
    }
  }
}

function playEpisode(episode) {
  if (!episode.video_url) {
    showMessage("status", "This episode has no video URL.", true);
    return;
  }

  setVideo(episode.video_url, episode.subtitle_url || null);

  if ($("nowPlaying")) {
    $("nowPlaying").textContent = episode.title || "Now Playing";
  }

  const video = $("video");

  video.play().catch(() => {
    // Browser may require the user to press Play.
  });
}

/* =====================================
   VIDEO PROGRESS
===================================== */

function setupVideoProgress() {
  const video = $("video");
  if (!video) return;

  video.addEventListener("timeupdate", () => {
    if (!currentAnime || !video.duration) return;

    const progress = {
      id: currentAnime.id,
      title: currentAnime.title,
      poster_url: currentAnime.poster_url,
      genre: currentAnime.genre,
      language: currentAnime.language,
      video_url: currentAnime.video_url,
      position: video.currentTime,
      duration: video.duration
    };

    localStorage.setItem("noonaProgress", JSON.stringify(progress));
  });
}

/* =====================================
   SUBTITLE CONTROL
===================================== */

function setupSubtitleControls() {
  const video = $("video");
  const select = $("subtitleSelect");

  if (!video || !select) return;

  select.addEventListener("change", () => {
    const selected = select.value;

    for (const track of video.textTracks) {
      track.mode = "disabled";
    }

    if (selected === "off") return;

    for (const track of video.textTracks) {
      if (track.kind === "subtitles") {
        track.mode = "showing";
      }
    }
  });
}

/* =====================================
   AUTHENTICATION
===================================== */

async function adminCheck() {
  const { data, error } = await db.auth.getSession();
  const session = data?.session;

  if ($("user")) {
    $("user").textContent = session
      ? session.user.email
      : "Guest";
  }

  if ($("logout")) {
    $("logout").hidden = !session;
  }

  if ($("admin")) {
    $("admin").hidden = true;
  }

  isAdmin = false;

  if (!session) return;

  const result = await db.rpc("is_admin");

  if (!result.error && result.data === true) {
    isAdmin = true;

    if ($("admin")) {
      $("admin").hidden = false;
    }

    showMessage("adminMsg", "Admin access verified.");
  } else {
    showMessage(
      "adminMsg",
      result.error?.message || "This account is not an admin.",
      true
    );
  }
}

window.account = async function(mode) {
  const email = $("email")?.value.trim();
  const password = $("password")?.value;

  if (!email || !password) {
    return showMessage(
      "accountMsg",
      "Enter your email and password.",
      true
    );
  }

  showMessage("accountMsg", "Please wait...");

  const result = mode === "signup"
    ? await db.auth.signUp({ email, password })
    : await db.auth.signInWithPassword({ email, password });

  if (result.error) {
    return showMessage("accountMsg", result.error.message, true);
  }

  showMessage(
    "accountMsg",
    mode === "signup"
      ? "Account created. Check your email if confirmation is enabled."
      : "Login successful."
  );

  await adminCheck();
  await loadAnime();
};

window.logout = async function() {
  const { error } = await db.auth.signOut();

  if (error) {
    return showMessage("accountMsg", error.message, true);
  }

  isAdmin = false;
  showMessage("accountMsg", "Logged out successfully.");

  await adminCheck();
};

window.forgot = async function() {
  const email = $("email")?.value.trim();

  if (!email) {
    return showMessage("accountMsg", "Enter your email first.", true);
  }

  const { error } = await db.auth.resetPasswordForEmail(email, {
    redirectTo: location.origin + location.pathname
  });

  showMessage(
    "accountMsg",
    error ? error.message : "Password reset link sent. Check your inbox and spam folder.",
    !!error
  );
};

window.savePassword = async function() {
  const password = $("newPass")?.value || "";
  const confirm = $("confirmPass")?.value || "";

  if (password.length < 6) {
    return showMessage("resetMsg", "Password must be at least 6 characters.", true);
  }

  if (password !== confirm) {
    return showMessage("resetMsg", "Passwords do not match.", true);
  }

  const { error } = await db.auth.updateUser({ password });

  if (error) {
    return showMessage("resetMsg", error.message, true);
  }

  showMessage("resetMsg", "Password updated successfully.");
  await db.auth.signOut();
  await adminCheck();
};

/* =====================================
   ADMIN UPLOAD
===================================== */

function cleanFileName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

window.uploadAnime = async function() {
  if (!isAdmin) {
    return showMessage("uploadMsg", "Admin access required.", true);
  }

  const title = $("title")?.value.trim();
  const videoFile = $("videoFile")?.files?.[0];
  const posterFile = $("posterFile")?.files?.[0];

  if (!title || !videoFile) {
    return showMessage("uploadMsg", "Anime title and video file are required.", true);
  }

  if (!videoFile.type.startsWith("video/")) {
    return showMessage("uploadMsg", "Please choose a valid video file.", true);
  }

  if (videoFile.size > 50 * 1024 * 1024) {
    return showMessage(
      "uploadMsg",
      "Video is larger than 50 MB. Check your Supabase Storage file-size limit.",
      true
    );
  }

  if (posterFile && !posterFile.type.startsWith("image/")) {
    return showMessage("uploadMsg", "Please choose a valid poster image.", true);
  }

  if (posterFile && posterFile.size > 5 * 1024 * 1024) {
    return showMessage("uploadMsg", "Poster must be smaller than 5 MB.", true);
  }

  const { data: { session } } = await db.auth.getSession();

  if (!session) {
    return showMessage("uploadMsg", "Please log in first.", true);
  }

  showMessage("uploadMsg", "Uploading video... Please keep this page open.");

  const folder = crypto.randomUUID();
  const videoPath = `anime/${folder}/${cleanFileName(videoFile.name)}`;

  const videoUpload = await db.storage
    .from("anime-media")
    .upload(videoPath, videoFile, {
      upsert: false,
      contentType: videoFile.type
    });

  if (videoUpload.error) {
    return showMessage("uploadMsg", videoUpload.error.message, true);
  }

  const videoUrl = db.storage
    .from("anime-media")
    .getPublicUrl(videoPath).data.publicUrl;

  let posterUrl = null;

  if (posterFile) {
    showMessage("uploadMsg", "Uploading poster...");

    const posterPath = `posters/${folder}/${cleanFileName(posterFile.name)}`;

    const posterUpload = await db.storage
      .from("anime-media")
      .upload(posterPath, posterFile, {
        upsert: false,
        contentType: posterFile.type
      });

    if (posterUpload.error) {
      return showMessage("uploadMsg", posterUpload.error.message, true);
    }

    posterUrl = db.storage
      .from("anime-media")
      .getPublicUrl(posterPath).data.publicUrl;
  }

  const episodeValue = $("episode")?.value;
  const episodeNumber = episodeValue ? Number(episodeValue) : null;

  const { error } = await db.from("anime_uploads").insert({
    title,
    description: $("description")?.value.trim() || null,
    episode: episodeNumber,
    genre: $("animeGenre")?.value || null,
    language: $("language")?.value || null,
    video_url: videoUrl,
    poster_url: posterUrl
  });

  if (error) {
    return showMessage(
      "uploadMsg",
      "Database error: " + error.message,
      true
    );
  }

  showMessage("uploadMsg", "Anime uploaded successfully!");

  ["title", "description", "episode", "videoFile", "posterFile"]
    .forEach(id => {
      if ($(id)) $(id).value = "";
    });

  await loadAnime();
};

/* =====================================
   PASSWORD RECOVERY
===================================== */

function setupPasswordRecovery() {
  db.auth.onAuthStateChange(event => {
    if (event === "PASSWORD_RECOVERY") {
      if ($("resetBox")) $("resetBox").hidden = false;
      if ($("loginBox")) $("loginBox").hidden = true;
    }

    if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
      setTimeout(async () => {
        await adminCheck();
        await loadAnime();
      }, 0);
    }
  });
}

/* =====================================
   INITIALIZE WEBSITE
===================================== */

window.addEventListener("DOMContentLoaded", async () => {
  if ($("search")) {
    $("search").addEventListener("input", renderLibrary);
  }

  if ($("genre")) {
    $("genre").addEventListener("change", renderLibrary);
  }

  setupVideoProgress();
  setupSubtitleControls();
  setupPasswordRecovery();

  renderLists();

  const { error } = await db.auth.getSession();

  if ($("status")) {
    $("status").textContent = error
      ? error.message
      : "Supabase connected.";
  }

  await adminCheck();
  await loadAnime();
});
