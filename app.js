const SUPABASE_URL =
  "https://akncyxuwfjhreaerglcx.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_YFwhPvoc75gtQ6ISyYhY5A_qQ9wyjZq";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

let owner = false;
const OWNER_EMAIL = "semlissagency@gmail.com";
let editingGameId = null;
let draggedGameId = null;
let thumbnailImageData = "";

let thumbnailPositionX = 50;
let thumbnailPositionY = 50;


/* ================================
   START
================================ */

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("searchBox").value = "";

  await checkLogin();
});

/* ================================
   AUTH
================================ */

async function checkLogin() {
  const {
    data
  } = await supabaseClient.auth.getUser();

  if (data && data.user) {
    owner =
      data.user.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();

    if (owner) {
      showOwnerMode();
    } else {
      hideOwnerMode();
    }
  } else {
    owner = false;
    hideOwnerMode();
  }
}

async function login() {
  openOwnerLogin();
}


async function logout() {
  await supabaseClient.auth.signOut();

  owner = false;

  hideOwnerMode();
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
  loginButton.style.display = "none";

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
.select(`
  id,
  name,
  thumbnail,
  video_url,
  description,
  categories,
  category,
  players,
  rating,
  game_link,
  sort_order,
  thumbnail_position_x,
  thumbnail_position_y,
  created_at
`)
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

  setupVideoOptimization();
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

card.dataset.categories =
  (game.categories || [game.category || "adventure"]).join(",");

  const safeName =
    escapeHTML(game.name || "");

  const safeDescription =
    escapeHTML(game.description || "");

const gameCategories =
  game.categories ||
  (game.category ? [game.category] : []);


  const thumbnail =
    escapeHTML(game.thumbnail || "");

const video = escapeHTML(game.video_url || "");

const thumbnailPositionX =
  Number(game.thumbnail_position_x ?? 50);

const thumbnailPositionY =
  Number(game.thumbnail_position_y ?? 50);

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

${video ? `
<video
  class="game-thumbnail game-video"  src="${video}"
  poster="${thumbnail}"
  muted
  autoplay
  loop
  playsinline
  preload="metadata"
></video>
` : `
<img
  class="game-thumbnail"
  src="${thumbnail}"
  alt="${escapeHTML(game.name || "")}"
  style="object-position:${thumbnailPositionX}% ${thumbnailPositionY}%"
>
`}

    <div class="game-content">

      <h3>${safeName}</h3>

      <p class="description">
        ${safeDescription}
      </p>

<div class="tags">
  ${gameCategories
    .map(category => `
      <span class="tag">
        ${escapeHTML(category)}
      </span>
    `)
    .join("")}
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

document.getElementById("gameVideo")
  .value = "";

thumbnailImageData = "";

thumbnailPositionX = 50;
thumbnailPositionY = 50;

document.getElementById("thumbnailPositionX").value = 50;
document.getElementById("thumbnailPositionY").value = 50;

const preview =
  document.getElementById("thumbnailPreview");

if (preview) {
  preview.src = "";
  preview.style.display = "none";
}

const fileInput =
  document.getElementById("gameThumbnailFile");

if (fileInput) {
  fileInput.value = "";
}

  document.getElementById("gameDescription")
    .value = "";

  document.getElementById("gameLink")
    .value = "";

document
  .querySelectorAll("#gameCategories input")
  .forEach(input => {
    input.checked = input.value === "adventure";
  });

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

  document.getElementById("gameThumbnail").value =
  data.thumbnail && !data.thumbnail.startsWith("data:")
    ? data.thumbnail
    : "";

document.getElementById("gameVideo").value =
  data.video_url || "";

thumbnailImageData = data.thumbnail || "";

thumbnailPositionX =
  Number(data.thumbnail_position_x ?? 50);

thumbnailPositionY =
  Number(data.thumbnail_position_y ?? 50);

document.getElementById("thumbnailPositionX").value =
  thumbnailPositionX;

document.getElementById("thumbnailPositionY").value =
  thumbnailPositionY;

const preview =
  document.getElementById("thumbnailPreview");

if (preview && data.thumbnail) {
  preview.src = data.thumbnail;

  preview.style.objectPosition =
    `${thumbnailPositionX}% ${thumbnailPositionY}%`;

  preview.style.display = "block";
}

  document.getElementById("gameDescription")
    .value = data.description || "";

  document.getElementById("gameLink")
    .value = data.game_link || "";

const selectedCategories =
  data.categories ||
  (data.category ? [data.category] : ["adventure"]);

document
  .querySelectorAll("#gameCategories input")
  .forEach(input => {
    input.checked =
      selectedCategories.includes(input.value);
  });

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
  thumbnailImageData ||
  document.getElementById("gameThumbnail").value.trim();

  const description =
    document.getElementById("gameDescription")
      .value.trim();

  const gameLink =
    document.getElementById("gameLink")
      .value.trim();

const categories =
  [...document.querySelectorAll(
    "#gameCategories input:checked"
  )].map(input => input.value);

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

if (categories.length === 0) {
  errorBox.textContent =
    "Select at least one category.";
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
video_url: document.getElementById("gameVideo").value.trim(),
  description,
  game_link: gameLink,
  category: categories[0],
  categories,
  players: players || 0,
  rating: rating || 0,
  thumbnail_position_x: thumbnailPositionX,
  thumbnail_position_y: thumbnailPositionY
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
    document.getElementById("category").value;

  document
    .querySelectorAll(".game")
    .forEach(game => {

      const matchesSearch =
        game.dataset.name
          .includes(search);

      const gameCategories =
        game.dataset.categories
          ? game.dataset.categories.split(",")
          : [game.dataset.category];

      const matchesCategory =
        category === "all" ||
        gameCategories.includes(category);

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

  owner =
    session.user.email?.toLowerCase() ===
    OWNER_EMAIL.toLowerCase();

  if (owner) {
    showOwnerMode();
  } else {
    hideOwnerMode();
  }

} else {

  owner = false;

  hideOwnerMode();

}

    await loadGames();
  }
);


function setupThumbnailInput() {
  const urlInput =
    document.getElementById("gameThumbnail");

  const fileInput =
    document.getElementById("gameThumbnailFile");

  const pasteArea =
    document.getElementById("thumbnailPasteArea");

  const preview =
    document.getElementById("thumbnailPreview");

const positionXInput =
    document.getElementById("thumbnailPositionX");

const positionYInput =
    document.getElementById("thumbnailPositionY");

  if (!urlInput || !fileInput || !pasteArea || !preview) {
    return;
  }

function showPreview(src) {
  if (!src) {
    preview.style.display = "none";
    preview.src = "";
    return;
  }

  preview.src = src;

  preview.style.objectPosition =
    `${thumbnailPositionX}% ${thumbnailPositionY}%`;

  preview.style.display = "block";
}

  urlInput.addEventListener("input", () => {
    thumbnailImageData = urlInput.value.trim();
    showPreview(thumbnailImageData);
  });

fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Please select an image.");
    return;
  }

  if (!owner) {
    alert("Owner login required.");
    return;
  }

  const fileName =
    `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;

  const filePath =
    `thumbnails/${fileName}`;

  const { error } =
    await supabaseClient.storage
      .from("game-thumbnails")
      .upload(filePath, file, {
        cacheControl: "31536000",
        upsert: false
      });

  if (error) {
    alert("Could not upload thumbnail: " + error.message);
    return;
  }

  const { data } =
    supabaseClient.storage
      .from("game-thumbnails")
      .getPublicUrl(filePath);

  thumbnailImageData = data.publicUrl;

  urlInput.value = thumbnailImageData;

  showPreview(thumbnailImageData);
});

 
  async function handleThumbnailPaste(event) {
    const items = event.clipboardData?.items;
    if (!items) return;

    const imageItem = [...items].find(item =>
      item.type.startsWith("image/")
    );

    if (!imageItem) return;

    event.preventDefault();

    if (!owner) {
      alert("Owner login required.");
      return;
    }

    const file = imageItem.getAsFile();
    if (!file) return;

    const errorBox = document.getElementById("gameError");
    if (errorBox) errorBox.textContent = "Uploading thumbnail...";

    const extension = file.type.split("/")[1]?.replace("jpeg", "jpg") || "png";
    const filePath = `thumbnails/${Date.now()}-${crypto.randomUUID()}.${extension}`;

    try {
      const { error } = await supabaseClient.storage
        .from("game-thumbnails")
        .upload(filePath, file, {
          cacheControl: "31536000",
          upsert: false,
          contentType: file.type
        });

      if (error) throw error;

      const { data } = supabaseClient.storage
        .from("game-thumbnails")
        .getPublicUrl(filePath);

      thumbnailImageData = data.publicUrl;
      urlInput.value = thumbnailImageData;
      showPreview(thumbnailImageData);

      if (errorBox) errorBox.textContent = "";
    } catch (error) {
      console.error("Thumbnail paste failed:", error);
      if (errorBox) {
        errorBox.textContent = "Thumbnail upload failed: " + error.message;
      } else {
        alert("Thumbnail upload failed: " + error.message);
      }
    }
  }


  document.getElementById("gameModal").addEventListener(
    "paste",
    handleThumbnailPaste
  );

  if (positionXInput) {
    positionXInput.addEventListener("input", () => {

      thumbnailPositionX =
        Number(positionXInput.value);

      preview.style.objectPosition =
        `${thumbnailPositionX}% ${thumbnailPositionY}%`;
    });
  }


  if (positionYInput) {
    positionYInput.addEventListener("input", () => {

      thumbnailPositionY =
        Number(positionYInput.value);

      preview.style.objectPosition =
        `${thumbnailPositionX}% ${thumbnailPositionY}%`;
    });
  }

}



setupThumbnailInput();

window.addEventListener("pageshow", () => {
  const searchBox = document.getElementById("searchBox");

  if (searchBox) {
    searchBox.value = "";
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const searchBox = document.getElementById("searchBox");

  if (!searchBox) return;

  function checkOwnerSearch() {
    const value = searchBox.value.trim().toLowerCase();

    if (value === OWNER_EMAIL.toLowerCase()) {
      searchBox.value = "";
      openOwnerLogin();
      return true;
    }

    return false;
  }

  searchBox.addEventListener("input", () => {
    if (checkOwnerSearch()) return;
    filterGames();
  });

  searchBox.addEventListener("keyup", () => {
    checkOwnerSearch();
  });
});


function openOwnerLogin() {
  const modal =
    document.getElementById("ownerLoginModal");

  const password =
    document.getElementById("ownerPassword");

  const error =
    document.getElementById("ownerLoginError");

  if (!modal || !password) return;

  password.value = "";

  if (error) {
    error.textContent = "";
  }

  modal.style.display = "flex";

  setTimeout(() => {
    password.focus();
  }, 50);
}


function closeOwnerLogin() {
  const modal =
    document.getElementById("ownerLoginModal");

  if (modal) {
    modal.style.display = "none";
  }
}


async function loginAsOwner() {
  const password =
    document.getElementById("ownerPassword").value;

  const error =
    document.getElementById("ownerLoginError");

  if (!password) {
    if (error) {
      error.textContent = "Enter your password.";
    }

    return;
  }

  const { error: loginError } =
    await supabaseClient.auth.signInWithPassword({
      email: OWNER_EMAIL,
      password: password
    });

  if (loginError) {
    if (error) {
      error.textContent = "Incorrect password.";
    }

    return;
  }

  owner = true;

closeOwnerLogin();
showOwnerMode();
}

const ownerLoginButton =
  document.getElementById("ownerLoginButton");

if (ownerLoginButton) {
  ownerLoginButton.addEventListener(
    "click",
    loginAsOwner
  );
}


const ownerPassword =
  document.getElementById("ownerPassword");

if (ownerPassword) {
  ownerPassword.addEventListener(
    "keydown",
    event => {

      if (event.key === "Enter") {
        loginAsOwner();
      }

    }
  );
}


const closeOwnerLoginButton =
  document.getElementById("closeOwnerLogin");

if (closeOwnerLoginButton) {
  closeOwnerLoginButton.addEventListener(
    "click",
    closeOwnerLogin
  );
}


const ownerLoginModal =
  document.getElementById("ownerLoginModal");

if (ownerLoginModal) {
  ownerLoginModal.addEventListener(
    "click",
    event => {

      if (event.target === ownerLoginModal) {
        closeOwnerLogin();
      }

    }
  );
}

function setupVideoOptimization() {
  const videos = document.querySelectorAll(".game-video");

  if (!videos.length) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        const video = entry.target;

        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    },
    {
      root: null,
      rootMargin: "200px 0px",
      threshold: 0.1
    }
  );

  videos.forEach(video => {
    observer.observe(video);
  });
}

