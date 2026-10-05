const SUPABASE_URL =
  "https://akncyxuwfjhreaerglcx.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_YFwhPvoc75gtQ6ISyYhY5A_qQ9wyjZq";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

let owner = false;
let editingGameId = null;
let draggedGameId = null;


/* ================================
   START
================================ */

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("searchBox").value = "";

  await checkLogin();
  await loadGames();
});


/* ================================
   AUTH
================================ */

async function checkLogin() {
  const {
    data
  } = await supabaseClient.auth.getUser();

  if (data && data.user) {
    owner = true;
    showOwnerMode();
  }
}


async function login() {
  const email =
    document.getElementById("loginEmail").value.trim();

  const password =
    document.getElementById("loginPassword").value;

  const errorBox =
    document.getElementById("loginError");

  errorBox.textContent = "";

  const {
    data,
    error
  } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    errorBox.textContent =
      "Login failed: " + error.message;
    return;
  }

  if (data.user) {
    owner = true;

    closeLogin();
    showOwnerMode();
    await loadGames();
  }
}


async function logout() {
  await supabaseClient.auth.signOut();

  owner = false;

  hideOwnerMode();

  await loadGames();
}


/* ================================
   OWNER UI
================================ */

function showOwnerMode() {
  const loginButton =
    document.getElementById("loginButton");

  const logoutButton =
    document.getElementById("logoutButton");

  const ownerBar =
    document.getElementById("ownerBar");

  if (loginButton)
    loginButton.style.display = "none";

  if (logoutButton)
    logoutButton.style.display = "inline-block";

  if (ownerBar)
    ownerBar.style.display = "flex";
}


function hideOwnerMode() {
  const loginButton =
    document.getElementById("loginButton");

  const logoutButton =
    document.getElementById("logoutButton");

  const ownerBar =
    document.getElementById("ownerBar");

  if (loginButton)
    loginButton.style.display = "inline-block";

  if (logoutButton)
    logoutButton.style.display = "none";

  if (ownerBar)
    ownerBar.style.display = "none";
}


/* ================================
   LOAD GAMES
================================ */

async function loadGames() {
  const list =
    document.getElementById("gameList");

  if (!list) return;

  list.innerHTML =
    `<div class="loading">Loading games...</div>`;

  const {
    data,
    error
  } = await supabaseClient
    .from("games")
    .select("*")
    .order("sort_order", {
      ascending: true
    })
    .order("created_at", {
      ascending: false
    });

  if (error) {
    list.innerHTML =
      `<div class="loading">
        Could not load games.
        <br><br>
        ${escapeHTML(error.message)}
      </div>`;

    return;
  }

  list.innerHTML = "";

  if (!data || data.length === 0) {
    list.innerHTML =
      `<div class="loading">No games yet.</div>`;

    return;
  }

  data.forEach(game => {
    list.appendChild(createGameCard(game));
  });

  setupDragAndDrop();

  applyFilters();
}


/* ================================
   CREATE GAME CARD
================================ */

function createGameCard(game) {
  const card = document.createElement("div");

  card.className = "game";

  card.dataset.id = game.id;

  card.dataset.name =
    (game.name || "").toLowerCase();

  card.dataset.category =
    game.category || "adventure";

  const safeName =
    escapeHTML(game.name || "");

  const safeDescription =
    escapeHTML(game.description || "");

  const safeCategory =
    escapeHTML(game.category || "");

  const thumbnail =
    escapeHTML(game.thumbnail || "");

  const link =
    escapeJS(game.game_link || "");


  card.innerHTML = `
    ${
      owner
        ? `<div class="drag-handle"
             title="Drag to reorder">
             ⋮⋮
           </div>`
        : ""
    }

    <img
      class="game-thumbnail"
      src="${thumbnail}"
      alt="${safeName}"
      onerror="this.style.display='none'"
    >

    <div class="game-content">

      <h3>${safeName}</h3>

      <p class="description">
        ${safeDescription}
      </p>

      <div class="tags">
        <span class="tag">
          ${safeCategory}
        </span>
      </div>

      <div class="stats">

        <span class="players">
          ● ${Number(game.players || 0).toLocaleString()}
          playing
        </span>

        <span class="rating">
          ★ ${Number(game.rating || 0)}%
        </span>

      </div>

      <button
        class="play-button"
        onclick="openGame('${link}')">

        ▶ Play Game

      </button>

    </div>
  `;


  if (owner) {
    const controls =
      document.createElement("div");

    controls.className =
      "owner-controls";

    controls.innerHTML = `
      <button
        class="edit-button"
        onclick="editGame('${game.id}')">

        ✏️ Edit

      </button>

      <button
        class="delete-button"
        onclick="deleteGame('${game.id}')">

        🗑️ Delete

      </button>
    `;

    card.appendChild(controls);
  }


  return card;
}


/* ================================
   DRAG AND DROP
================================ */

function setupDragAndDrop() {
  if (!owner) return;

  const list =
    document.getElementById("gameList");

  if (!list) return;

  const cards =
    list.querySelectorAll(".game");

  cards.forEach(card => {

    card.draggable = true;

    card.addEventListener(
      "dragstart",
      handleDragStart
    );

    card.addEventListener(
      "dragover",
      handleDragOver
    );

    card.addEventListener(
      "dragenter",
      handleDragEnter
    );

    card.addEventListener(
      "dragleave",
      handleDragLeave
    );

    card.addEventListener(
      "drop",
      handleDrop
    );

    card.addEventListener(
      "dragend",
      handleDragEnd
    );
  });
}


function handleDragStart(event) {
  if (!owner) {
    event.preventDefault();
    return;
  }

  draggedGameId =
    event.currentTarget.dataset.id;

  event.currentTarget.classList.add(
    "dragging"
  );

  event.dataTransfer.effectAllowed =
    "move";

  event.dataTransfer.setData(
    "text/plain",
    draggedGameId
  );
}


function handleDragOver(event) {
  if (!owner) return;

  event.preventDefault();

  event.dataTransfer.dropEffect =
    "move";
}


function handleDragEnter(event) {
  if (!owner) return;

  event.preventDefault();

  const card =
    event.currentTarget;

  if (
    card.dataset.id === draggedGameId
  ) {
    return;
  }

  card.classList.add(
    "drag-over"
  );
}


function handleDragLeave(event) {
  event.currentTarget.classList.remove(
    "drag-over"
  );
}


async function handleDrop(event) {
  if (!owner) return;

  event.preventDefault();

  const targetCard =
    event.currentTarget;

  const targetId =
    targetCard.dataset.id;

  targetCard.classList.remove(
    "drag-over"
  );

  if (
    !draggedGameId ||
    draggedGameId === targetId
  ) {
    return;
  }

  const list =
    document.getElementById("gameList");

  const draggedCard =
    list.querySelector(
      `.game[data-id="${CSS.escape(draggedGameId)}"]`
    );

  if (!draggedCard) return;

  const allCards =
    [...list.querySelectorAll(".game")];

  const draggedIndex =
    allCards.indexOf(draggedCard);

  const targetIndex =
    allCards.indexOf(targetCard);

  if (
    draggedIndex < targetIndex
  ) {
    targetCard.after(draggedCard);
  } else {
    targetCard.before(draggedCard);
  }

  await saveGameOrder();
}


function handleDragEnd(event) {
  event.currentTarget.classList.remove(
    "dragging"
  );

  document
    .querySelectorAll(".game")
    .forEach(card => {
      card.classList.remove(
        "drag-over"
      );
    });

  draggedGameId = null;
}


/* ================================
   SAVE NEW ORDER
================================ */

async function saveGameOrder() {
  if (!owner) return;

  const list =
    document.getElementById("gameList");

  if (!list) return;

  const cards =
    [...list.querySelectorAll(".game")];

  for (
    let index = 0;
    index < cards.length;
    index++
  ) {

    const id =
      cards[index].dataset.id;

    const {
      error
    } = await supabaseClient
      .from("games")
      .update({
        sort_order: index
      })
      .eq("id", id);

    if (error) {

      console.error(
        "Could not save game order:",
        error
      );

      alert(
        "The new order could not be saved."
      );

      return;
    }
  }
}


/* ================================
   ADD GAME
================================ */

function openAddGame() {
  if (!owner) {
    alert("Owner login required.");
    return;
  }

  editingGameId = null;

  document.getElementById("modalTitle")
    .textContent = "Add Game";

  document.getElementById("gameName")
    .value = "";

  document.getElementById("gameThumbnail")
    .value = "";

  document.getElementById("gameDescription")
    .value = "";

  document.getElementById("gameLink")
    .value = "";

  document.getElementById("gameCategory")
    .value = "adventure";

  document.getElementById("gamePlayers")
    .value = "0";

  document.getElementById("gameRating")
    .value = "100";

  document.getElementById("gameError")
    .textContent = "";

  document.getElementById("gameModal")
    .style.display = "flex";
}


/* ================================
   EDIT GAME
================================ */

async function editGame(id) {
  if (!owner) return;

  const {
    data,
    error
  } = await supabaseClient
    .from("games")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    alert(error.message);
    return;
  }

  editingGameId = id;

  document.getElementById("modalTitle")
    .textContent = "Edit Game";

  document.getElementById("gameName")
    .value = data.name || "";

  document.getElementById("gameThumbnail")
    .value = data.thumbnail || "";

  document.getElementById("gameDescription")
    .value = data.description || "";

  document.getElementById("gameLink")
    .value = data.game_link || "";

  document.getElementById("gameCategory")
    .value = data.category || "adventure";

  document.getElementById("gamePlayers")
    .value = data.players || 0;

  document.getElementById("gameRating")
    .value = data.rating || 100;

  document.getElementById("gameError")
    .textContent = "";

  document.getElementById("gameModal")
    .style.display = "flex";
}


/* ================================
   SAVE GAME
================================ */

async function saveGame() {
  if (!owner) {
    alert("Owner login required.");
    return;
  }

  const name =
    document.getElementById("gameName")
      .value.trim();

  const thumbnail =
    document.getElementById("gameThumbnail")
      .value.trim();

  const description =
    document.getElementById("gameDescription")
      .value.trim();

  const gameLink =
    document.getElementById("gameLink")
      .value.trim();

  const category =
    document.getElementById("gameCategory")
      .value;

  const players =
    Number(
      document.getElementById("gamePlayers")
        .value
    );

  const rating =
    Number(
      document.getElementById("gameRating")
        .value
    );

  const errorBox =
    document.getElementById("gameError");

  errorBox.textContent = "";

  if (!name) {
    errorBox.textContent =
      "Game name is required.";
    return;
  }

  if (!gameLink) {
    errorBox.textContent =
      "Roblox game link is required.";
    return;
  }

  if (
    rating < 0 ||
    rating > 100
  ) {
    errorBox.textContent =
      "Rating must be between 0 and 100.";
    return;
  }


  const gameData = {
    name,
    thumbnail,
    description,
    game_link: gameLink,
    category,
    players: players || 0,
    rating: rating || 0
  };


  let result;


  if (editingGameId) {

    result =
      await supabaseClient
        .from("games")
        .update(gameData)
        .eq("id", editingGameId);

  } else {

    const {
      data: existingGames
    } =
      await supabaseClient
        .from("games")
        .select("sort_order")
        .order("sort_order", {
          ascending: false
        })
        .limit(1);

    let nextOrder = 0;

    if (
      existingGames &&
      existingGames.length > 0
    ) {
      nextOrder =
        Number(
          existingGames[0].sort_order
        ) + 1;
    }

    gameData.sort_order =
      nextOrder;

    result =
      await supabaseClient
        .from("games")
        .insert(gameData);
  }


  if (result.error) {
    errorBox.textContent =
      result.error.message;
    return;
  }

  closeGameModal();

  await loadGames();
}


/* ================================
   DELETE GAME
================================ */

async function deleteGame(id) {
  if (!owner) return;

  const confirmed =
    confirm(
      "Delete this game permanently?"
    );

  if (!confirmed) return;

  const {
    error
  } = await supabaseClient
    .from("games")
    .delete()
    .eq("id", id);

  if (error) {
    alert(
      "Could not delete game: " +
      error.message
    );
    return;
  }

  await loadGames();
}


/* ================================
   SEARCH / FILTER
================================ */

function searchGames() {
  applyFilters();
}


function filterGames() {
  applyFilters();
}


function applyFilters() {
  const search =
    document.getElementById("searchBox")
      .value.toLowerCase();

  const category =
    document.getElementById("category")
      .value;

  document
    .querySelectorAll(".game")
    .forEach(game => {

      const matchesSearch =
        game.dataset.name
          .includes(search);

      const matchesCategory =
        category === "all" ||
        game.dataset.category === category;

      game.style.display =
        matchesSearch &&
        matchesCategory
          ? ""
          : "none";
    });
}


/* ================================
   OPEN ROBLOX GAME
================================ */

function openGame(url) {
  if (!url) return;

  if (
    !url.startsWith(
      "https://www.roblox.com/"
    )
  ) {
    alert(
      "This is not a valid Roblox URL."
    );
    return;
  }

  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );
}


/* ================================
   MODALS
================================ */

function openLogin() {
  document.getElementById("loginModal")
    .style.display = "flex";
}


function closeLogin() {
  document.getElementById("loginModal")
    .style.display = "none";
}


function closeGameModal() {
  document.getElementById("gameModal")
    .style.display = "none";

  editingGameId = null;
}


/* ================================
   SECURITY HELPERS
================================ */

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function escapeJS(value) {
  return String(value)
    .replaceAll("\\", "\\\\")
    .replaceAll("'", "\\'")
    .replaceAll("\n", "\\n")
    .replaceAll("\r", "\\r");
}


/* ================================
   AUTH STATE
================================ */

supabaseClient.auth.onAuthStateChange(
  async (event, session) => {

    if (
      session &&
      session.user
    ) {

      owner = true;

      showOwnerMode();

    } else {

      owner = false;

      hideOwnerMode();

    }

    await loadGames();
  }
);

window.addEventListener("pageshow", () => {
  const searchBox = document.getElementById("searchBox");

  if (searchBox && searchBox.value.includes("@")) {
    searchBox.value = "";
  }
});