
function openPlayer(anime) {
  const dialog = $("#playerDialog");
  const video = $("#videoPlayer");
  const info = $("#subtitleInfo");
  const select = $("#subtitleSelect");

  if (!dialog || !video) {
    alert("Player section nahi mila. index.html check karo.");
    return;
  }

  video.pause();
  video.removeAttribute("src");
  video.querySelectorAll("track").forEach(track => track.remove());

  if (anime.videoUrl) {
    video.src = anime.videoUrl;
    video.load();
  }

  // Load subtitle files
  const subtitles = anime.subtitles || {};

  const languages = [
    { key: "ja", label: "Japanese Sub", srclang: "ja" },
    { key: "en", label: "English Sub", srclang: "en" },
    { key: "hi", label: "Hindi Sub", srclang: "hi" },
    { key: "hinglish", label: "Hinglish (Roman)", srclang: "hi-Latn" }
  ];

  languages.forEach(language => {
    const url = subtitles[language.key];

    if (!url) return;

    const track = document.createElement("track");
    track.kind = "subtitles";
    track.label = language.label;
    track.srclang = language.srclang;
    track.src = url;
    track.default = false;

    video.appendChild(track);
  });

  if (select) {
    select.value = "off";
  }

  if (info) {
    info.textContent = anime.videoUrl
      ? "Video loaded. Select your subtitle language."
      : "Demo anime: video URL abhi add nahi hua hai.";
  }

  history = [
    anime.id,
    ...history.filter(id => id !== anime.id)
  ].slice(0, 20);

  saveData();
  renderAll();

  dialog.showModal();
}
