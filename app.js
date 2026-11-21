
/* =========================================
   ROBLOXLIST - GAME DATABASE
   Add, remove, or edit games in this section.
========================================= */

const games = [

  {
    title: "Example",
    image: "PASTE IMAGE URL HERE",
    url: "https://www.roblox.com/games/4924922222",
    categories: ["Roleplay"],
    players: 5000,
    rating: 90
  },

  {
    title: "Adopt Me",
    image: "https://static.wikia.nocookie.net/roblox/images/a/a5/Uplift_Games_-_Adopt_Me_-_Thumbnail.webp/revision/latest?cb=20240529074202",
    url: "https://www.roblox.com/games/920587237",
    categories: ["Adventure"],
    players: 10000,
    rating: 95
  },

  {
    title: "Brookhaven",
    image: "https://static.wikia.nocookie.net/official-brookhaven/images/e/e5/Brookhaven_Social_Logo.jpg/revision/latest?cb=20260118121458",
    url: "https://www.roblox.com/games/4924922222",
    categories: ["Roleplay"],
    players: 5001,
    rating: -90
  },

  {
    title: "Tower Of Hell",
    image: "https://static.wikia.nocookie.net/tower-of-hell/images/e/e1/TToHEventThumbnail.png/revision/latest/scale-to-width-down/732?cb=20241216100734",
    url: "https://www.roblox.com/games/1962086868",
    categories: ["Obby"],
    players: 2500,
    rating: 85
  }

  {
    title: "Example Game 4",
    image: "PASTE IMAGE URL HERE",
    url: "https://www.roblox.com",
    categories: ["Roleplay, Obby"],
    players: 5000,
    rating: 90
  },


];


/* =========================================
   DISPLAY GAMES
========================================= */

const gameList = document.getElementById("gameList");

// Keep the existing card layout, with 8 cards per row.
gameList.style.display = "grid";
gameList.style.gridTemplateColumns = "repeat(8, minmax(0, 1fr))";


function renderGames() {

  gameList.innerHTML = "";

  games.forEach(game => {

    const card = document.createElement("div");

    card.className = "game";

    card.dataset.name = game.title.toLowerCase();

    card.dataset.categories = JSON.stringify(
      game.categories.map(category => category.toLowerCase())
    );

    const categories = game.categories
      .map(category => `
        <span class="tag">
          ${escapeHTML(category)}
        </span>
      `)
      .join("");

    card.innerHTML = `
      <img
        class="game-thumbnail"
        src="${escapeHTML(game.image)}"
        alt="${escapeHTML(game.title)}"
      >

      <div class="game-content">

        <h3>${escapeHTML(game.title)}</h3>

        <div class="tags">
          ${categories}
        </div>

        <div class="stats">

          <span class="players">
            ● ${Number(game.players).toLocaleString()}
            playing
          </span>

          <span class="rating">
            ★ ${Number(game.rating)}%
          </span>

        </div>

        <button class="play-button">
          ▶ Play Game
        </button>

      </div>
    `;

    card.querySelector(".play-button")
      .addEventListener("click", event => {
        event.stopPropagation();
        openGame(game.url);
      });

    card.addEventListener("click", () => {
      openGame(game.url);
    });

    gameList.appendChild(card);

  });

  applyFilters();

}


/* =========================================
   SEARCH
========================================= */

function searchGames() {
  applyFilters();
}

function filterGames() {
  applyFilters();
}

function applyFilters() {

  const searchBox =
    document.getElementById("searchBox");

  const categorySelect =
    document.getElementById("category");

  const search =
    (searchBox.value || "").trim().toLowerCase();

  const selectedCategory =
    categorySelect.value.toLowerCase();

  const cards =
    document.querySelectorAll("#gameList .game");

  cards.forEach(card => {

    const name =
      card.dataset.name || "";

    const categories =
      JSON.parse(card.dataset.categories || "[]");

    const matchesSearch =
      name.includes(search);

    const matchesCategory =
      selectedCategory === "all" ||
      categories.includes(selectedCategory);

    card.hidden =
      !(matchesSearch && matchesCategory);

  });

}


/* =========================================
   OPEN ROBLOX GAME
========================================= */

function openGame(url) {

  if (!url) return;

  if (!url.startsWith("https://www.roblox.com/")) {
    return;
  }

  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );

}


/* =========================================
   SECURITY
========================================= */

function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* =========================================
   START
========================================= */

document.addEventListener("DOMContentLoaded", () => {

  const searchBox =
    document.getElementById("searchBox");

  if (searchBox) {
    searchBox.addEventListener("input", applyFilters);
  }

  renderGames();

});
