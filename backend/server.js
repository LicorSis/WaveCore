const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// 🔑 YouTube API
const YT_API_KEY = "ТВОЙ_API_KEY";

// middleware
app.use(express.json());
app.use(cors());


// ─────────────────────────────────────────────
// FALLBACK ТРЕКИ (если YouTube не дал результат)
// ─────────────────────────────────────────────
const tracks = [
  { title: "Rainy Day", artist: "Lo-Fi Boy", tags: ["sad", "slow", "chill"] },
  { title: "Neon Lights", artist: "Synthwave Kid", tags: ["energetic", "fast"] },
  { title: "Morning Coffee", artist: "Acoustic Vibes", tags: ["happy", "calm"] },
];


// ─────────────────────────────────────────────
// МАППИНГ НАСТРОЕНИЙ → ТЕГИ
// ─────────────────────────────────────────────
const moodToTags = {
  "грустно": ["sad", "slow"],
  "радостно": ["happy", "upbeat"],
  "энергично": ["energetic", "fast"],
  "спокойно": ["chill", "calm"],
  "ночь": ["dark"],
  "дождь": ["sad", "calm"]
};


// ─────────────────────────────────────────────
// ПРЕОБРАЗОВАНИЕ ВВОДА В ТЕГИ
// ─────────────────────────────────────────────
function getTagsByMood(mood) {
  const words = mood.toLowerCase().split(/\s+/);
  const result = new Set();

  for (const word of words) {
    for (const [key, tags] of Object.entries(moodToTags)) {
      if (word.includes(key)) {
        tags.forEach(t => result.add(t));
      }
    }

    // добавляем неизвестные слова (для YouTube поиска)
    if (!moodToTags[word]) {
      result.add(word);
    }
  }

  return result.size ? [...result] : ["chill"];
}


// ─────────────────────────────────────────────
// УМНЫЙ ПОИСК
// ─────────────────────────────────────────────
function buildSearchQuery(tags) {
  const map = {
    sad: "sad emotional",
    happy: "happy upbeat",
    energetic: "workout",
    calm: "relax",
    chill: "lofi",
    dark: "dark mood"
  };

  return tags.map(t => map[t] || t).join(" ") + " song";
}


// ─────────────────────────────────────────────
// YOUTUBE API
// ─────────────────────────────────────────────
async function getYouTubeTracks(tags) {
  const query = buildSearchQuery(tags);

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video,playlist&maxResults=10&q=${encodeURIComponent(query)}&key=${YT_API_KEY}`
    );

    const data = await res.json();

    const filtered = data.items.filter(item => {
      const t = item.snippet.title.toLowerCase();
      return !(
        t.includes("mix") ||
        t.includes("playlist") ||
        t.includes("radio") ||
        t.includes("live")
      );
    });

    const tracks = [];
    const playlists = [];

    for (const item of filtered) {
      if (item.id.kind === "youtube#video") {
        tracks.push({
          title: item.snippet.title,
          artist: item.snippet.channelTitle,
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`
        });
      }

      if (item.id.kind === "youtube#playlist") {
        playlists.push({
          title: item.snippet.title,
          url: `https://www.youtube.com/playlist?list=${item.id.playlistId}`
        });
      }
    }

    return { tracks, playlists };

  } catch (err) {
    console.error("YT error:", err);
    return { tracks: [], playlists: [] };
  }
}


// ─────────────────────────────────────────────
// ENDPOINT
// ─────────────────────────────────────────────
app.post("/generate", async (req, res) => {
  const { mood } = req.body;

  if (!mood) {
    return res.status(400).json({ error: "Введите настроение" });
  }

  const tags = getTagsByMood(mood);
  let yt = await getYouTubeTracks(tags);

  // fallback
  if (!yt.tracks.length) {
    yt.tracks = tracks.slice(0, 3);
  }

  return res.json({
    tracks: yt.tracks,
    playlists: yt.playlists
  });
});


// ─────────────────────────────────────────────
// SERVER
// ─────────────────────────────────────────────
app.get("/", (req, res) => {
  res.send("WaveCore API работает 🚀");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on ${PORT}`);
});
