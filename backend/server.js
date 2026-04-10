// server.js — простой Express-сервер для генерации треков по настроению

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Парсим входящий JSON
app.use(express.json());
app.use(cors());
// ─────────────────────────────────────────────
// МОК-ДАННЫЕ: треки с тегами
// ─────────────────────────────────────────────
const tracks = [
  { title: "Rainy Day",         artist: "Lo-Fi Boy",        tags: ["sad", "slow", "chill"] },
  { title: "Empty Streets",     artist: "Night Owl",         tags: ["sad", "slow", "dark"] },
  { title: "Neon Lights",       artist: "Synthwave Kid",     tags: ["energetic", "fast", "upbeat"] },
  { title: "Morning Coffee",    artist: "Acoustic Vibes",    tags: ["happy", "chill", "calm"] },
  { title: "Dance All Night",   artist: "Club Fever",        tags: ["energetic", "fast", "party", "upbeat"] },
  { title: "Ocean Drive",       artist: "Summer Beats",      tags: ["happy", "upbeat", "calm"] },
  { title: "Midnight Thoughts", artist: "Deep Mind",         tags: ["sad", "slow", "dark", "calm"] },
  { title: "Power Up",          artist: "Gym Mode",          tags: ["energetic", "fast", "motivational"] },
  { title: "Chill at Home",     artist: "Bedroom Pop",       tags: ["chill", "calm", "happy"] },
  { title: "Broken Glass",      artist: "The Sad Hours",     tags: ["sad", "dark", "slow"] },
  { title: "Golden Hour",       artist: "Sunny Day",         tags: ["happy", "upbeat", "calm"] },
  { title: "Run the World",     artist: "Power Move",        tags: ["energetic", "motivational", "fast"] },
  { title: "Stargazing",        artist: "Cosmic Chill",      tags: ["chill", "calm", "slow"] },
  { title: "Fire Inside",       artist: "Rock Force",        tags: ["energetic", "fast", "dark"] },
  { title: "Lazy Sunday",       artist: "Soft Echo",         tags: ["chill", "calm", "slow", "happy"] },
];

// ─────────────────────────────────────────────
// МАППИНГ: mood (настроение) → теги
// ─────────────────────────────────────────────
const moodToTags = {

  // Контекст / атмосфера
  "ночь": ["dark", "slow"],
  "ночью": ["dark", "slow"],
  "дождь": ["sad", "calm"],
  "дождливо": ["sad", "calm"],
  "вечер": ["chill", "calm"],
  "одиночество": ["sad", "slow"],
  
  // Жанры
  "рэп": ["energetic"],
  "рок": ["energetic", "dark"],
  "lofi": ["chill"],
  "лофи": ["chill"],
  "электро": ["fast", "upbeat"],
  
  // Языки (заготовка)
  "русский": ["ru"],
  "английский": ["en"],
  "японский": ["jp"],
  
  // Грусть / печаль
  "грустно":    ["sad", "slow"],
  "печально":   ["sad", "slow", "dark"],
  "тоскливо":   ["sad", "dark"],

  // Радость / веселье
  "радостно":   ["happy", "upbeat"],
  "весело":     ["happy", "upbeat", "party"],
  "счастливо":  ["happy", "calm"],

  // Энергия / спорт
  "энергично":  ["energetic", "fast"],
  "бодро":      ["energetic", "motivational"],
  "спорт":      ["energetic", "fast", "motivational"],

  // Расслабление
  "спокойно":   ["chill", "calm"],
  "расслабленно": ["chill", "calm", "slow"],
  "медитация":  ["calm", "slow", "chill"],

  // Тёмное настроение
  "мрачно":     ["dark", "slow"],
  "тревожно":   ["dark", "sad"],
};

// ─────────────────────────────────────────────
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ─────────────────────────────────────────────

/**
 * Определяет теги по строке настроения.
 * Ищет совпадение по ключевым словам из moodToTags.
 * Если ничего не найдено — возвращает дефолтные теги.
 *
 * @param {string} mood — строка настроения от пользователя
 * @returns {string[]} — массив тегов
 */
 function scoreTracks(allTracks, tags) {
   return allTracks.map(track => {
     let score = 0;
 
     for (const tag of tags) {
       if (track.tags.includes(tag)) {
         score += 1;
       }
     }
 
     return { ...track, score };
   });
 }
function getTagsByMood(mood) {
  const normalized = mood.toLowerCase();
  const words = normalized.split(/\s+/);

  const resultTags = new Set();

  for (const word of words) {
    for (const [key, tags] of Object.entries(moodToTags)) {
      if (word.includes(key)) {
        tags.forEach(tag => resultTags.add(tag));
      }
    }
  }

  if (resultTags.size === 0) {
    return ["chill", "calm"];
  }

  return Array.from(resultTags);
}

/**
 * Фильтрует треки по тегам: трек подходит,
 * если у него есть хотя бы один совпадающий тег.
 *
 * @param {object[]} allTracks — полный список треков
 * @param {string[]} tags — теги для фильтрации
 * @returns {object[]} — отфильтрованные треки
 */
function filterByTags(allTracks, tags) {
  return allTracks.filter((track) =>
    track.tags.some((tag) => tags.includes(tag))
  );
}

/**
 * Возвращает до `count` случайных элементов из массива.
 *
 * @param {any[]} arr — исходный массив
 * @param {number} count — сколько элементов вернуть
 * @returns {any[]} — перемешанный срез
 */
function pickRandom(arr, count) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ─────────────────────────────────────────────
// ENDPOINT: POST /generate
// ─────────────────────────────────────────────
app.post("/generate", (req, res) => {
  const { mood } = req.body;

  // Валидация входных данных
  if (!mood || typeof mood !== "string" || mood.trim() === "") {
    return res.status(400).json({
      error: 'Поле "mood" обязательно и должно быть непустой строкой.',
    });
  }

  // 1. Получаем теги по настроению
  const tags = getTagsByMood(mood);

  // 2. Фильтруем треки по тегам
  const scored = scoreTracks(tracks, tags);
  
  scored.sort((a, b) => b.score - a.score);
  
  const matched = scored.map(({ score, ...rest }) => rest);

  // 3. Если треков нашлось мало — берём все доступные
  const pool = matched.length > 0 ? matched : tracks;

  // 4. Выбираем до 5 случайных треков
  const selected = pickRandom(pool, 5);

  // 5. Формируем ответ (только title и artist, без тегов)
  const result = selected.map(({ title, artist }) => ({ title, artist }));

  return res.json({ tracks: result });
});

// ─────────────────────────────────────────────
// ЗАПУСК СЕРВЕРА
// ─────────────────────────────────────────────
app.get("/", (req, res) => {
  res.send("WaveCore API работает 🚀");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`Пример запроса:`);
  console.log(`  curl -X POST http://localhost:${PORT}/generate \\`);
  console.log(`       -H "Content-Type: application/json" \\`);
  console.log(`       -d '{"mood": "грустно"}'`);
});
