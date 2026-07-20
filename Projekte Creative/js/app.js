(function () {
"use strict";

const body = document.body;
const themeToggle = document.getElementById("themeToggle");

const savedTheme = localStorage.getItem("theme");
if (savedTheme === "light") {
  body.classList.add("light");
}

themeToggle.addEventListener("click", () => {
  body.classList.toggle("light");
  const mode = body.classList.contains("light") ? "light" : "dark";
  localStorage.setItem("theme", mode);
});

const clockTime = document.getElementById("clockTime");
const clockDate = document.getElementById("clockDate");
const clockDay = document.getElementById("clockDay");
const clockInfo = document.getElementById("clockInfo");

function updateClock() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const dateStr = now.toLocaleDateString("de-DE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  clockTime.textContent = timeStr;
  clockDate.textContent = dateStr;
  clockDay.textContent = now.toLocaleDateString("de-DE", { weekday: "long" });
  clockInfo.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone;
}

updateClock();
setInterval(updateClock, 1000);

const todoInput = document.getElementById("todoInput");
const todoAddBtn = document.getElementById("todoAddBtn");
const todoList = document.getElementById("todoList");
const todoClearBtn = document.getElementById("todoClearBtn");
const todoStats = document.getElementById("todoStats");

let todos = [];

function loadTodos() {
  try {
    const raw = localStorage.getItem("todos_v1");
    if (raw) {
      todos = JSON.parse(raw);
    }
  } catch (e) {
    todos = [];
  }
  renderTodos();
}

function saveTodos() {
  localStorage.setItem("todos_v1", JSON.stringify(todos));
}

function renderTodos() {
  const frag = document.createDocumentFragment();
  todos.forEach((todo, index) => {
    const li = document.createElement("li");
    li.className = "todo-item" + (todo.done ? " completed" : "");
    li.dataset.index = String(index);

    const checkbox = document.createElement("button");
    checkbox.type = "button";
    checkbox.className = "todo-checkbox";
    checkbox.setAttribute("aria-label", "Aufgabe umschalten");
    const inner = document.createElement("div");
    inner.className = "todo-checkbox-inner";
    checkbox.appendChild(inner);
    checkbox.addEventListener("click", () => toggleTodo(index));

    const text = document.createElement("div");
    text.className = "todo-text";
    text.textContent = todo.text;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "todo-remove";
    removeBtn.setAttribute("aria-label", "Aufgabe löschen");
    removeBtn.textContent = "✕";
    removeBtn.addEventListener("click", () => removeTodo(index));

    li.appendChild(checkbox);
    li.appendChild(text);
    li.appendChild(removeBtn);
    frag.appendChild(li);
  });

  todoList.replaceChildren(frag);

  const total = todos.length;
  const done = todos.reduce((n, t) => n + (t.done ? 1 : 0), 0);
  todoStats.textContent = `${total} Tasks • ${done} erledigt`;
}

function addTodo() {
  const text = todoInput.value.trim();
  if (!text) return;
  todos.unshift({ text, done: false });
  todoInput.value = "";
  saveTodos();
  renderTodos();
}

function toggleTodo(index) {
  todos[index].done = !todos[index].done;
  saveTodos();
  renderTodos();
}

function removeTodo(index) {
  todos.splice(index, 1);
  saveTodos();
  renderTodos();
}

function clearTodos() {
  if (!todos.length) return;
  if (confirm("Wirklich alle To-Dos löschen?")) {
    todos = [];
    saveTodos();
    renderTodos();
  }
}

todoAddBtn.addEventListener("click", addTodo);
todoInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTodo();
});
todoClearBtn.addEventListener("click", clearTodos);

loadTodos();

const quotes = [
  {
    text: "Code ist wie Humor. Wenn du ihn erklären musst, ist er schlecht.",
    author: "Cory House",
    tags: ["Code", "Humor"],
  },
  {
    text: "Das Beste, was du lernen kannst, ist, wie man lernt.",
    author: "Unbekannt",
    tags: ["Lernen", "Mindset"],
  },
  {
    text: "Perfekt ist der Feind von fertig.",
    author: "Voltaire",
    tags: ["Produktivität", "Perfektionismus"],
  },
  {
    text: "Wenn es dich nicht ein bisschen nervös macht, ist es wahrscheinlich zu einfach.",
    author: "Unbekannt",
    tags: ["Comfort Zone", "Growth"],
  },
  {
    text: "Erst baust du deine Gewohnheiten, dann bauen deine Gewohnheiten dich.",
    author: "James Clear",
    tags: ["Gewohnheiten"],
  },
  {
    text: "Jeder Profi war einmal ein Anfänger.",
    author: "Unbekannt",
    tags: ["Anfangen"],
  },
  {
    text: "Der beste Moment anzufangen war gestern. Der zweitbeste ist jetzt.",
    author: "Unbekannt",
    tags: ["Start", "Motivation"],
  },
];

const quoteText = document.getElementById("quoteText");
const quoteAuthor = document.getElementById("quoteAuthor");
const quoteTags = document.getElementById("quoteTags");
const quoteBtn = document.getElementById("quoteBtn");

let sessionQuoteCount = 0;

function randomQuote() {
  const q = quotes[Math.floor(Math.random() * quotes.length)];
  quoteText.textContent = q.text;
  quoteAuthor.textContent = "— " + q.author;
  quoteTags.innerHTML = "";
  q.tags.forEach((tag) => {
    const span = document.createElement("span");
    span.className = "quote-tag";
    span.textContent = "#" + tag;
    quoteTags.appendChild(span);
  });
  sessionQuoteCount++;
  updateSessionStats();
}

quoteBtn.addEventListener("click", randomQuote);

const gameTarget = document.getElementById("gameTarget");
const gameStatus = document.getElementById("gameStatus");
const gameStartBtn = document.getElementById("gameStartBtn");
const gameResetBtn = document.getElementById("gameResetBtn");
const gameLast = document.getElementById("gameLast");
const gameBest = document.getElementById("gameBest");

let gameState = "idle";
let gameTimeout = null;
let gameStartTime = 0;
let bestTime = null;
let sessionGameCount = 0;

function resetGameVisual() {
  gameTarget.classList.remove("visible");
}

function startGame() {
  if (gameState === "waiting" || gameState === "ready") return;
  resetGameVisual();
  gameStatus.textContent = "Warte auf den Kreis… nicht schummeln!";
  gameState = "waiting";
  sessionGameCount++;
  updateSessionStats();

  const delay = 800 + Math.random() * 2200;
  gameTimeout = setTimeout(() => {
    gameState = "ready";
    gameStartTime = performance.now();
    gameTarget.classList.add("visible");
    gameStatus.textContent = "Jetzt! Klick so schnell du kannst!";
  }, delay);
}

function resetGame() {
  if (gameTimeout) clearTimeout(gameTimeout);
  gameTimeout = null;
  gameState = "idle";
  resetGameVisual();
  gameStatus.textContent =
    "Klicke auf „Start“, warte bis der Kreis erscheint und klicke so schnell wie möglich.";
  gameLast.textContent = "–";
  gameBest.textContent = bestTime != null ? bestTime : "–";
}

function handleGameClick() {
  if (gameState === "waiting") {
    if (gameTimeout) clearTimeout(gameTimeout);
    gameTimeout = null;
    gameState = "idle";
    gameStatus.textContent =
      "Zu früh geklickt! Versuch es nochmal und warte, bis der Kreis erscheint.";
    resetGameVisual();
    return;
  }

  if (gameState === "ready") {
    const now = performance.now();
    const diff = Math.round(now - gameStartTime);
    gameLast.textContent = diff;
    if (bestTime == null || diff < bestTime) {
      bestTime = diff;
      gameBest.textContent = bestTime;
      gameStatus.textContent = `Nice! Neue Bestzeit: ${diff} ms`;
    } else {
      gameStatus.textContent = `Deine Zeit: ${diff} ms. Versuch, deine Bestzeit zu schlagen!`;
    }
    gameState = "idle";
    resetGameVisual();
  }
}

gameStartBtn.addEventListener("click", startGame);
gameResetBtn.addEventListener("click", resetGame);
gameTarget.addEventListener("click", handleGameClick);

const sessionTimeEl = document.getElementById("sessionTime");
const sessionQuotesEl = document.getElementById("sessionQuotes");
const sessionGamesEl = document.getElementById("sessionGames");
const activityBarFill = document.getElementById("activityBarFill");

const sessionStart = Date.now();

function updateSessionStats() {
  const seconds = Math.floor((Date.now() - sessionStart) / 1000);
  sessionTimeEl.textContent = seconds + "s";
  sessionQuotesEl.textContent = sessionQuoteCount;
  sessionGamesEl.textContent = sessionGameCount;

  const activityScore = Math.min(
    1,
    (sessionQuoteCount * 0.2 + sessionGameCount * 0.3 + seconds / 120) / 2
  );
  activityBarFill.style.transform = `scaleX(${0.2 + activityScore * 0.8})`;
}

setInterval(updateSessionStats, 1000);
updateSessionStats();

})();
