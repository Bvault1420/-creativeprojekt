(function () {
"use strict";

const globalMetricsEl = document.getElementById("globalMetrics");
const coinsTableBody = document.getElementById("coinsTableBody");
const tableLoader = document.getElementById("tableLoader");
const loadingText = document.getElementById("loadingText");
const marketSummaryEl = document.getElementById("marketSummary");
const searchInput = document.getElementById("searchInput");
const footerNoteEl = document.getElementById("footerNote");

const homeView = document.getElementById("homeView");
const detailView = document.getElementById("detailView");
const backToHome = document.getElementById("backToHome");

const pills = document.querySelectorAll(".pill");
const homeButton = document.getElementById("homeButton");

const authModal = document.getElementById("authModal");
const openAuthModalBtn = document.getElementById("openAuthModal");
const closeAuthModalBtn = document.getElementById("closeAuthModal");
const showLoginTabBtn = document.getElementById("showLoginTab");
const showRegisterTabBtn = document.getElementById("showRegisterTab");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const loginMessage = document.getElementById("loginMessage");
const registerMessage = document.getElementById("registerMessage");
const authGuest = document.getElementById("authGuest");
const authUser = document.getElementById("authUser");
const authUserName = document.getElementById("authUserName");
const authAvatar = document.getElementById("authAvatar");

const settingsModal = document.getElementById("settingsModal");
const openSettingsButton = document.getElementById("openSettingsButton");
const closeSettingsModal = document.getElementById("closeSettingsModal");
const settingsLogoutButton = document.getElementById("settingsLogoutButton");
const languageSelect = document.getElementById("languageSelect");

let allCoins = [];
let currentMode = "all";
let watchlist = [];
let currentDetailCoin = null;
let currentUser = null;
let currentLanguage = "de";

const detailNameEl = document.getElementById("detailName");
const detailSymbolEl = document.getElementById("detailSymbol");
const detailPriceEl = document.getElementById("detailPrice");
const detailChangeEl = document.getElementById("detailChange");
const detailMcapEl = document.getElementById("detailMcap");
const detailVolumeEl = document.getElementById("detailVolume");
const detailSupplyEl = document.getElementById("detailSupply");
const detailRankEl = document.getElementById("detailRank");
const marketsTableBody = document.getElementById("marketsTable").querySelector("tbody");
const detailTabs = document.querySelectorAll(".detail-tab");
const detailTabContent = document.getElementById("detailTabContent");
const chartErrorEl = document.getElementById("chartError");

let chart = null;
let candleSeries = null;
let ws = null;

const STORAGE_KEYS = {
  users: "dayflow_users",
  session: "dayflow_session",
  watchlistPrefix: "dayflow_watchlist_",
  language: "dayflow_language",
};

const translations = window.DAYFLOW_TRANSLATIONS || {};
if (!Object.keys(translations).length) {
  console.error("DayFlow: i18n not loaded");
}

function t(key) {
  return translations[currentLanguage][key] ?? translations.de[key] ?? key;
}

function applyTemplate(str, values) {
  return str.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? "");
}

function setLanguage(lang) {
  currentLanguage = translations[lang] ? lang : "de";
  localStorage.setItem(STORAGE_KEYS.language, currentLanguage);
  document.documentElement.lang = currentLanguage;
  languageSelect.value = currentLanguage;
  applyTranslations();
  renderGlobalFromCoins(allCoins);
  renderTable(getFilteredCoins());
  if (currentDetailCoin) {
    updateDetailUI(currentDetailCoin);
    updateDetailTabContent(document.querySelector(".detail-tab.active")?.dataset.tab || "overview");
  }
}

function applyTranslations() {
  document.title = t("pageTitle");
  document.getElementById("authTitle").innerHTML = t("authTitle");
  document.getElementById("authSubtitle").textContent = t("authSubtitle");
  showLoginTabBtn.textContent = t("loginTab");
  showRegisterTabBtn.textContent = t("registerTab");
  document.getElementById("loginUsernameLabel").textContent = t("username");
  document.getElementById("loginPasswordLabel").textContent = t("password");
  document.getElementById("registerFirstNameLabel").textContent = t("firstName");
  document.getElementById("registerLastNameLabel").textContent = t("lastName");
  document.getElementById("registerUsernameLabel").textContent = t("username");
  document.getElementById("registerPasswordLabel").textContent = t("password");
  document.getElementById("loginUsername").placeholder = t("loginPlaceholder");
  document.getElementById("loginPassword").placeholder = t("passwordPlaceholder");
  document.getElementById("registerFirstName").placeholder = t("firstNamePlaceholder");
  document.getElementById("registerLastName").placeholder = t("lastNamePlaceholder");
  document.getElementById("registerUsername").placeholder = t("usernamePlaceholder");
  document.getElementById("registerPassword").placeholder = t("registerPasswordPlaceholder");
  document.getElementById("loginSubmitButton").textContent = t("loginSubmit");
  document.getElementById("registerSubmitButton").textContent = t("registerSubmit");
  document.getElementById("authGuestText").textContent = t("notLoggedIn");
  openAuthModalBtn.textContent = t("loginRegister");
  document.getElementById("authUserSub").textContent = t("loggedInLocal");
  document.getElementById("settingsTitle").innerHTML = t("settingsTitle");
  document.getElementById("settingsSubtitle").textContent = t("settingsSubtitle");
  document.getElementById("languageLabel").textContent = t("language");
  settingsLogoutButton.textContent = t("logout");
  homeButton.textContent = t("homeButton");
  document.querySelector('.pill[data-mode="all"]').textContent = t("all");
  document.querySelector('.pill[data-mode="gainers"]').textContent = t("gainers");
  document.querySelector('.pill[data-mode="losers"]').textContent = t("losers");
  document.querySelector('.pill[data-mode="watchlist"]').textContent = t("watchlist");
  searchInput.placeholder = t("searchPlaceholder");
  document.getElementById("homeTitle").textContent = t("homeTitle");
  document.getElementById("thName").textContent = t("thName");
  document.getElementById("thPrice").textContent = t("thPrice");
  document.getElementById("thMarketCap").textContent = t("thMarketCap");
  document.getElementById("thVolume").textContent = t("thVolume");
  document.getElementById("thSupply").textContent = t("thSupply");
  if (!allCoins.length) {
    footerNoteEl.textContent = t("footerLoaded");
  }
  backToHome.textContent = t("detailBack");
  document.getElementById("detailMcapLabel").textContent = t("detailMcap");
  document.getElementById("detailVolumeLabel").textContent = t("detailVolume");
  document.getElementById("detailSupplyLabel").textContent = t("detailSupply");
  document.getElementById("detailRankLabel").textContent = t("detailRank");
  document.getElementById("chartHeaderTitle").textContent = t("chartHeader");
  document.getElementById("chartInfo").textContent = t("chartInfo");
  document.getElementById("marketsHeaderTitle").textContent = t("marketsHeader");
  document.getElementById("marketsHeaderSub").textContent = t("marketsHeaderSub");
  document.getElementById("marketsThExchange").textContent = t("exchange");
  document.getElementById("marketsThType").textContent = t("type");
  document.getElementById("marketsThPair").textContent = t("pair");
  document.getElementById("marketsThPrice").textContent = t("price");
  document.getElementById("marketsThVolume").textContent = t("volume");
  document.querySelector('.detail-tab[data-tab="overview"]').textContent = t("overview");
  document.querySelector('.detail-tab[data-tab="markets"]').textContent = t("markets");
  document.querySelector('.detail-tab[data-tab="news"]').textContent = t("news");
  updateDetailTabContent(document.querySelector(".detail-tab.active")?.dataset.tab || "overview");
}

const STORAGE_USERS = "dayflow_users";

function formatNumber(num, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) return "-";
  return Number(num).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatBigNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return "-";
  const n = Number(num);
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(2) + "K";
  return n.toFixed(2);
}

function changeClass(val) {
  if (val === null || val === undefined || isNaN(val)) return "";
  return val >= 0 ? "change-pos" : "change-neg";
}

function changeText(val) {
  if (val === null || val === undefined || isNaN(val)) return "-";
  const n = Number(val);
  const sign = n > 0 ? "+" : "";
  return sign + n.toFixed(2) + "%";
}

function getUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_USERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
}

function getSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.session);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(user) {
  localStorage.setItem(STORAGE_KEYS.session, JSON.stringify({
    username: user.username,
  }));
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.session);
}

function getInitials(firstName, lastName) {
  const first = (firstName || "").trim().charAt(0).toUpperCase();
  const last = (lastName || "").trim().charAt(0).toUpperCase();
  return (first + last) || "CB";
}

function setAuthMessage(element, text, type = "") {
  element.textContent = text || "";
  element.className = "auth-message";
  if (type) element.classList.add(type);
}

function switchAuthTab(mode) {
  const isLogin = mode === "login";
  showLoginTabBtn.classList.toggle("active", isLogin);
  showRegisterTabBtn.classList.toggle("active", !isLogin);
  loginForm.classList.toggle("active", isLogin);
  registerForm.classList.toggle("active", !isLogin);
  setAuthMessage(loginMessage, "");
  setAuthMessage(registerMessage, "");
}

function openAuthModal(defaultTab = "login") {
  switchAuthTab(defaultTab);
  authModal.classList.add("active");
}

function closeAuthModal() {
  if (!currentUser) return;
  authModal.classList.remove("active");
}

function openSettings() {
  settingsModal.classList.add("active");
}

function closeSettings() {
  settingsModal.classList.remove("active");
}

function updateAuthUI() {
  if (currentUser) {
    authGuest.classList.add("hidden");
    authUser.classList.add("active");
    authUserName.textContent = currentUser.firstName + " " + currentUser.lastName;
    authAvatar.textContent = getInitials(currentUser.firstName, currentUser.lastName);
    authModal.classList.remove("active");
  } else {
    authGuest.classList.remove("hidden");
    authUser.classList.remove("active");
    authUserName.textContent = "-";
    authAvatar.textContent = "CB";
    authModal.classList.add("active");
    settingsModal.classList.remove("active");
  }
}

function loadCurrentUser() {
  const users = getUsers();
  const session = getSession();
  if (!session || !session.username) {
    currentUser = null;
    return;
  }
  currentUser = users.find(user => user.username === session.username) || null;
}

function getWatchlistKey() {
  return currentUser
    ? STORAGE_KEYS.watchlistPrefix + currentUser.username
    : STORAGE_KEYS.watchlistPrefix + "guest";
}

function loadWatchlist() {
  try {
    const raw = localStorage.getItem(getWatchlistKey());
    watchlist = raw ? JSON.parse(raw) : [];
  } catch {
    watchlist = [];
  }
}

function saveWatchlist() {
  localStorage.setItem(getWatchlistKey(), JSON.stringify(watchlist));
}

function isInWatchlist(coin) {
  return watchlist.includes(String(coin.id));
}

function toggleWatch(coin) {
  const id = String(coin.id);
  if (watchlist.includes(id)) {
    watchlist = watchlist.filter(x => x !== id);
  } else {
    watchlist.push(id);
  }
  saveWatchlist();
  renderTable(getFilteredCoins());
}

function renderGlobalFromCoins(coins) {
  if (!coins || coins.length === 0) return;
  const totalMcap = coins.reduce((sum, c) => sum + (c.market_cap || 0), 0);
  const totalVol = coins.reduce((sum, c) => sum + (c.total_volume || 0), 0);
  const avgChange = coins.reduce((sum, c) => sum + (c.price_change_percentage_24h || 0), 0) / coins.length;

  globalMetricsEl.innerHTML = "";

  const items = [
    {
      label: t("marketCap"),
      value: "$" + formatBigNumber(totalMcap),
      change: avgChange,
    },
    {
      label: t("globalVolume"),
      value: "$" + formatBigNumber(totalVol),
      change: null,
    },
    {
      label: t("coinsTop100"),
      value: coins.length.toString(),
      change: null,
    },
    {
      label: t("avgMarketChange"),
      value: changeText(avgChange),
      change: avgChange,
    },
  ];

  items.forEach(item => {
    const card = document.createElement("div");
    card.className = "metric-card";

    const label = document.createElement("span");
    label.className = "metric-label";
    label.textContent = item.label;

    const value = document.createElement("span");
    value.className = "metric-value";
    value.textContent = item.value;

    card.appendChild(label);
    card.appendChild(value);

    if (item.change !== null && !isNaN(item.change)) {
      const changeSpan = document.createElement("span");
      changeSpan.className = "metric-value " + (item.change >= 0 ? "metric-change-pos" : "metric-change-neg");
      changeSpan.textContent = changeText(item.change);
      card.appendChild(changeSpan);
    }

    globalMetricsEl.appendChild(card);
  });

  marketSummaryEl.textContent = applyTemplate(t("globalSummary"), {
    mcap: "$" + formatNumber(totalMcap, 0),
    change: changeText(avgChange),
  });
}

function renderTable(coins) {
  coinsTableBody.innerHTML = "";

  coins.forEach((coin, index) => {
    const tr = document.createElement("tr");

    tr.addEventListener("click", (e) => {
      if (e.target && e.target.classList.contains("watch-icon")) return;
      openDetail(coin.id);
    });

    const rankTd = document.createElement("td");
    rankTd.innerHTML = `<span class="rank">${coin.market_cap_rank || index + 1}</span>`;
    tr.appendChild(rankTd);

    const nameTd = document.createElement("td");
    nameTd.style.textAlign = "left";
    nameTd.innerHTML = `
      <div class="name-cell">
        <div class="name-left">
          <span class="watch-icon${isInWatchlist(coin) ? " watch-active" : ""}" title="${t("watchTitle")}">★</span>
          <div>
            <div>${coin.name}</div>
            <div class="symbol">${coin.symbol.toUpperCase()}</div>
          </div>
        </div>
        <div class="chip-symbol">${coin.symbol.toUpperCase()}</div>
      </div>
    `;

    const star = nameTd.querySelector(".watch-icon");
    star.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleWatch(coin);
    });
    tr.appendChild(nameTd);

    const priceTd = document.createElement("td");
    priceTd.textContent = "$" + formatNumber(coin.current_price, 2);
    tr.appendChild(priceTd);

    const h1Td = document.createElement("td");
    h1Td.className = "muted";
    h1Td.textContent = "-";
    tr.appendChild(h1Td);

    const h24Td = document.createElement("td");
    const ch24 = coin.price_change_percentage_24h;
    h24Td.className = changeClass(ch24);
    h24Td.textContent = changeText(ch24);
    tr.appendChild(h24Td);

    const d7Td = document.createElement("td");
    const ch7 = coin.price_change_percentage_7d_in_currency;
    d7Td.className = changeClass(ch7);
    d7Td.textContent = changeText(ch7);
    tr.appendChild(d7Td);

    const mcapTd = document.createElement("td");
    mcapTd.textContent = "$" + formatNumber(coin.market_cap, 0);
    tr.appendChild(mcapTd);

    const volTd = document.createElement("td");
    volTd.textContent = "$" + formatNumber(coin.total_volume, 0);
    tr.appendChild(volTd);

    const supplyTd = document.createElement("td");
    supplyTd.textContent = formatNumber(coin.circulating_supply || 0, 0) + " " + coin.symbol.toUpperCase();
    tr.appendChild(supplyTd);

    coinsTableBody.appendChild(tr);
  });

  if (coins.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 9;
    td.style.textAlign = "left";
    td.className = "muted";
    td.textContent = currentMode === "watchlist" ? t("emptyWatchlist") : t("emptyResult");
    tr.appendChild(td);
    coinsTableBody.appendChild(tr);
  }
}

function getFilteredCoins() {
  let coins = [...allCoins];

  const q = searchInput.value.trim().toLowerCase();
  if (q) {
    coins = coins.filter(c =>
      (c.name || "").toLowerCase().includes(q) ||
      (c.symbol || "").toLowerCase().includes(q)
    );
  }

  if (currentMode === "gainers") {
    coins.sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0));
    coins = coins.slice(0, 20);
  } else if (currentMode === "losers") {
    coins.sort((a, b) => (a.price_change_percentage_24h || 0) - (b.price_change_percentage_24h || 0));
    coins = coins.slice(0, 20);
  } else if (currentMode === "watchlist") {
    coins = coins.filter(c => isInWatchlist(c));
  } else {
    coins.sort((a, b) => (a.market_cap_rank || 9999) - (b.market_cap_rank || 9999));
  }

  return coins;
}

function applyFiltersAndRender() {
  renderTable(getFilteredCoins());
}

function updateDetailTabContent(tabName) {
  if (tabName === "overview") {
    detailTabContent.innerHTML = `<p class="muted">${t("detailOverviewText")}</p>`;
  } else if (tabName === "markets") {
    detailTabContent.innerHTML = `<p class="muted">${t("detailMarketsText")}</p>`;
  } else if (tabName === "news") {
    detailTabContent.innerHTML = `<p class="muted">${t("detailNewsText")}</p>`;
  }
}

searchInput.addEventListener("input", () => {
  applyFiltersAndRender();
});

pills.forEach(pill => {
  if (!pill.dataset.mode) return;
  pill.addEventListener("click", () => {
    pills.forEach(p => {
      if (p.dataset.mode) p.classList.remove("active");
    });
    pill.classList.add("active");
    currentMode = pill.dataset.mode;
    showHome();
    applyFiltersAndRender();
  });
});

homeButton.addEventListener("click", () => {
  pills.forEach(p => {
    if (p.dataset.mode) p.classList.remove("active");
  });
  const allCoinsPill = document.querySelector('.pill[data-mode="all"]');
  if (allCoinsPill) allCoinsPill.classList.add("active");
  currentMode = "all";
  showHome();
  applyFiltersAndRender();
});

openAuthModalBtn.addEventListener("click", () => {
  openAuthModal("login");
});

closeAuthModalBtn.addEventListener("click", () => {
  closeAuthModal();
});

openSettingsButton.addEventListener("click", () => {
  openSettings();
});

closeSettingsModal.addEventListener("click", () => {
  closeSettings();
});

settingsLogoutButton.addEventListener("click", () => {
  currentUser = null;
  clearSession();
  loadWatchlist();
  updateAuthUI();
  closeSettings();
  applyFiltersAndRender();
});

document.getElementById("settingsChangeUsernameBtn").addEventListener("click", () => {
  const msgEl = document.getElementById("settingsUsernameMessage");
  const newUsername = document.getElementById("settingsNewUsername").value.trim().toLowerCase();
  const password = document.getElementById("settingsUsernamePassword").value;

  if (!currentUser) { setAuthMessage(msgEl, "Nicht eingeloggt.", "error"); return; }
  if (!newUsername) { setAuthMessage(msgEl, "Bitte neuen Benutzernamen eingeben.", "error"); return; }
  if (!password) { setAuthMessage(msgEl, "Bitte Passwort eingeben.", "error"); return; }

  const users = getUsers();
  const me = users.find(u => u.username === currentUser.username);
  if (!me || me.password !== password) { setAuthMessage(msgEl, "Falsches Passwort.", "error"); return; }
  if (users.some(u => u.username === newUsername && u.username !== currentUser.username)) {
    setAuthMessage(msgEl, "Benutzername bereits vergeben.", "error"); return;
  }

  const oldKey = getWatchlistKey();
  me.username = newUsername;
  saveUsers(users);
  currentUser = me;
  saveSession(me);
  const wlData = localStorage.getItem(oldKey);
  if (wlData) {
    localStorage.setItem(STORAGE_KEYS.watchlistPrefix + newUsername, wlData);
    localStorage.removeItem(oldKey);
  }
  loadWatchlist();
  updateAuthUI();
  document.getElementById("settingsNewUsername").value = "";
  document.getElementById("settingsUsernamePassword").value = "";
  setAuthMessage(msgEl, "Benutzername erfolgreich geändert.", "success");
});

document.getElementById("settingsChangePasswordBtn").addEventListener("click", () => {
  const msgEl = document.getElementById("settingsPasswordMessage");
  const oldPw = document.getElementById("settingsOldPassword").value;
  const newPw = document.getElementById("settingsNewPassword").value;

  if (!currentUser) { setAuthMessage(msgEl, "Nicht eingeloggt.", "error"); return; }
  if (!oldPw || !newPw) { setAuthMessage(msgEl, "Bitte alle Felder ausfüllen.", "error"); return; }
  if (newPw.length < 6) { setAuthMessage(msgEl, "Neues Passwort muss mindestens 6 Zeichen haben.", "error"); return; }

  const users = getUsers();
  const me = users.find(u => u.username === currentUser.username);
  if (!me || me.password !== oldPw) { setAuthMessage(msgEl, "Aktuelles Passwort falsch.", "error"); return; }

  me.password = newPw;
  saveUsers(users);
  currentUser = me;
  document.getElementById("settingsOldPassword").value = "";
  document.getElementById("settingsNewPassword").value = "";
  setAuthMessage(msgEl, "Passwort erfolgreich geändert.", "success");
});

languageSelect.addEventListener("change", () => {
  setLanguage(languageSelect.value);
});

showLoginTabBtn.addEventListener("click", () => {
  switchAuthTab("login");
});

showRegisterTabBtn.addEventListener("click", () => {
  switchAuthTab("register");
});

authModal.addEventListener("click", (event) => {
  if (event.target === authModal && currentUser) {
    closeAuthModal();
  }
});

settingsModal.addEventListener("click", (event) => {
  if (event.target === settingsModal) {
    closeSettings();
  }
});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const username = document.getElementById("loginUsername").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;

  if (!username || !password) {
    setAuthMessage(loginMessage, t("loginMissing"), "error");
    return;
  }

  const users = getUsers();
  const matchedUser = users.find(user => user.username === username && user.password === password);

  if (!matchedUser) {
    setAuthMessage(loginMessage, t("loginFailed"), "error");
    return;
  }

  currentUser = matchedUser;
  saveSession(matchedUser);
  loadWatchlist();
  updateAuthUI();
  applyFiltersAndRender();
  loginForm.reset();
  setAuthMessage(loginMessage, t("loginSuccess"), "success");
});

registerForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const firstName = document.getElementById("registerFirstName").value.trim();
  const lastName = document.getElementById("registerLastName").value.trim();
  const username = document.getElementById("registerUsername").value.trim().toLowerCase();
  const password = document.getElementById("registerPassword").value;

  if (!firstName || !lastName || !username || !password) {
    setAuthMessage(registerMessage, t("registerMissing"), "error");
    return;
  }

  if (password.length < 6) {
    setAuthMessage(registerMessage, t("registerPasswordShort"), "error");
    return;
  }

  const users = getUsers();
  const usernameExists = users.some(user => user.username === username);

  if (usernameExists) {
    setAuthMessage(registerMessage, t("registerUsernameExists"), "error");
    return;
  }

  const newUser = {
    firstName,
    lastName,
    username,
    password,
  };

  users.push(newUser);
  saveUsers(users);
  currentUser = newUser;
  saveSession(newUser);
  loadWatchlist();
  updateAuthUI();
  applyFiltersAndRender();
  registerForm.reset();
  setAuthMessage(registerMessage, t("registerSuccess"), "success");
});

async function fetchCoinGeckoMarkets() {
  // OPTIMIZED: Single API call for top 100 coins (faster ~300ms vs 1.5s+ for 4 pages)
  const url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h,7d";
  const response = await fetch(url);
  if (!response.ok) throw new Error("CoinGecko API Error");
  const coins = await response.json();
  return coins;
}

async function loadData(initial = false) {
  try {
    if (initial) {
      loadCurrentUser();
      loadWatchlist();
      const savedLanguage = localStorage.getItem(STORAGE_KEYS.language) || "de";
      setLanguage(savedLanguage);
      updateAuthUI();
    }

    // Show loading spinner + skeletons
    tableLoader.style.display = "flex";
    coinsTableBody.classList.add("loading");
    loadingText.textContent = "Lade Top 100 Kryptowährungen...";

    const data = await fetchCoinGeckoMarkets();
    allCoins = data || [];
    
    // Hide loading, show data (fade transition)
    tableLoader.style.display = "none";
    coinsTableBody.classList.remove("loading");

    renderGlobalFromCoins(allCoins);
    applyFiltersAndRender();

    footerNoteEl.textContent = t("footerSource");

    if (currentDetailCoin) {
      const updated = allCoins.find(c => c.id === currentDetailCoin.id);
      if (updated) {
        currentDetailCoin = updated;
        updateDetailUI(currentDetailCoin);
      }
    }
  } catch (e) {
    console.error(e);
    tableLoader.style.display = "none";
    coinsTableBody.classList.remove("loading");
    if (initial) {
      marketSummaryEl.textContent = t("marketLoadError");
      globalMetricsEl.innerHTML = `
        <div class="metric-card">
          <span class="metric-label">${t("globalLoadError")}</span>
        </div>
      `;
    }
  }
}

function showHome() {
  detailView.style.display = "none";
  aggregatorView.style.display = "none";
  homeView.style.display = "block";
  if (ws) {
    ws.close();
    ws = null;
  }
}

function showDetail() {
  homeView.style.display = "none";
  aggregatorView.style.display = "none";
  detailView.style.display = "block";
}

backToHome.addEventListener("click", () => {
  currentMode = "all";
  pills.forEach(p => {
    if (p.dataset.mode) p.classList.remove("active");
  });
  const allCoinsPill = document.querySelector('.pill[data-mode="all"]');
  if (allCoinsPill) allCoinsPill.classList.add("active");
  showHome();
  applyFiltersAndRender();
});

function initChart(symbol) {
  const container = document.getElementById("chartContainer");
  container.innerHTML = "";
  chartErrorEl.textContent = "";

  const tvSymbol = "BINANCE:" + symbol.toUpperCase() + "USDT";

  const script = document.createElement("script");
  script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
  script.async = true;
  script.innerHTML = JSON.stringify({
    autosize: true,
    symbol: tvSymbol,
    interval: "1",
    timezone: "Europe/Berlin",
    theme: "dark",
    style: "1",
    locale: "de_DE",
    backgroundColor: "#020617",
    gridColor: "#111827",
    hide_top_toolbar: false,
    hide_legend: false,
    save_image: false,
    allow_symbol_change: false,
    calendar: false,
    hide_volume: false,
    support_host: "https://www.tradingview.com"
  });

  const widgetDiv = document.createElement("div");
  widgetDiv.className = "tradingview-widget-container";
  widgetDiv.style.height = "260px";
  widgetDiv.style.width = "100%";

  const widgetInner = document.createElement("div");
  widgetInner.className = "tradingview-widget-container__widget";
  widgetInner.style.height = "100%";
  widgetInner.style.width = "100%";

  widgetDiv.appendChild(widgetInner);
  widgetDiv.appendChild(script);
  container.appendChild(widgetDiv);
}

function updateDetailUI(coin) {
  detailNameEl.textContent = coin.name;
  detailSymbolEl.textContent = coin.symbol.toUpperCase();

  const icon = document.getElementById("detailIcon");
  if (coin.image) {
    icon.src = coin.image;
    icon.style.display = "block";
  } else {
    icon.style.display = "none";
  }

  const prevPrice = parseFloat(detailPriceEl.dataset.prev || coin.current_price);
  const newPrice = coin.current_price;
  detailPriceEl.textContent = "$" + formatNumber(newPrice, 2);
  detailPriceEl.dataset.prev = newPrice;
  if (newPrice > prevPrice) {
    detailPriceEl.classList.remove("price-flash-down");
    void detailPriceEl.offsetWidth;
    detailPriceEl.classList.add("price-flash-up");
  } else if (newPrice < prevPrice) {
    detailPriceEl.classList.remove("price-flash-up");
    void detailPriceEl.offsetWidth;
    detailPriceEl.classList.add("price-flash-down");
  }

  const change24 = coin.price_change_percentage_24h;
  const changeBadge = document.getElementById("detailChange");
  changeBadge.textContent = changeText(change24) + " (24h)";
  changeBadge.className = "detail-change-badge " + (change24 >= 0 ? "pos" : "neg");

  const low24 = coin.low_24h;
  const high24 = coin.high_24h;
  document.getElementById("detailLow24").textContent = low24 ? "$" + formatNumber(low24, 2) : "-";
  document.getElementById("detailHigh24").textContent = high24 ? "$" + formatNumber(high24, 2) : "-";
  if (low24 && high24 && high24 > low24) {
    const pct = ((newPrice - low24) / (high24 - low24)) * 100;
    document.getElementById("detailRangeFill").style.width = Math.min(100, Math.max(0, pct)) + "%";
  }

  document.getElementById("detailRankBadge").textContent = "#" + (coin.market_cap_rank || "-");
  detailMcapEl.textContent = "$" + formatBigNumber(coin.market_cap);
  detailVolumeEl.textContent = "$" + formatBigNumber(coin.total_volume);
  detailSupplyEl.textContent = formatBigNumber(coin.circulating_supply || 0) + " " + coin.symbol.toUpperCase();
  detailRankEl.textContent = coin.market_cap_rank || "-";

  const ch24stat = document.getElementById("detailChange24Stat");
  ch24stat.textContent = changeText(change24);
  ch24stat.className = "stat-value " + changeClass(change24);

  const ch7 = coin.price_change_percentage_7d_in_currency;
  const ch7stat = document.getElementById("detailChange7d");
  ch7stat.textContent = changeText(ch7);
  ch7stat.className = "stat-value " + changeClass(ch7);
}

async function loadBinanceCandles(symbol) {
  return [];
}

async function loadBinanceMarkets(symbol) {
  marketsTableBody.innerHTML = "";
  const spotSymbol = symbol + "USDT";
  const futSymbol = symbol + "USDT";

  try {
    const spotRes = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${spotSymbol}`);
    const spot = spotRes.ok ? await spotRes.json() : null;

    const futRes = await fetch(`https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${futSymbol}`);
    const fut = futRes.ok ? await futRes.json() : null;

    if (spot) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>Binance</td>
        <td>Spot</td>
        <td>${spotSymbol}</td>
        <td>$${formatNumber(spot.lastPrice, 2)}</td>
        <td>$${formatNumber(spot.quoteVolume, 0)}</td>
      `;
      marketsTableBody.appendChild(tr);
    }

    if (fut) {
      const tr2 = document.createElement("tr");
      tr2.innerHTML = `
        <td>Binance</td>
        <td>USDT‑M Futures</td>
        <td>${futSymbol}</td>
        <td>$${formatNumber(fut.lastPrice, 2)}</td>
        <td>$${formatNumber(fut.quoteVolume, 0)}</td>
      `;
      marketsTableBody.appendChild(tr2);
    }

    if (!spot && !fut) {
      marketsTableBody.innerHTML = `
        <tr><td colspan="5" style="text-align:left;">${t("noMarketsFound")}</td></tr>
      `;
    }
  } catch (e) {
    console.error(e);
    marketsTableBody.innerHTML = `
      <tr><td colspan="5" style="text-align:left;">${t("marketsLoadError")}</td></tr>
    `;
  }
}

function startBinanceWS(symbol) {
  if (ws) {
    ws.close();
    ws = null;
  }
  const stream = symbol.toLowerCase() + "usdt@miniTicker";
  const url = `wss://stream.binance.com:9443/ws/${stream}`;
  ws = new WebSocket(url);
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (!msg.c) return;
    if (currentDetailCoin && currentDetailCoin.symbol.toUpperCase() === symbol.toUpperCase()) {
      const oldPrice = currentDetailCoin.current_price;
      const newPrice = parseFloat(msg.c);
      currentDetailCoin.current_price = newPrice;
      detailPriceEl.dataset.prev = oldPrice;
      detailPriceEl.textContent = "$" + formatNumber(newPrice, 2);
      detailPriceEl.classList.remove("price-flash-up", "price-flash-down");
      void detailPriceEl.offsetWidth;
      detailPriceEl.classList.add(newPrice >= oldPrice ? "price-flash-up" : "price-flash-down");
    }
  };
  ws.onerror = () => {};
}

async function openDetail(coinId) {
  const coin = allCoins.find(c => c.id === coinId);
  if (!coin) return;
  currentDetailCoin = coin;
  updateDetailUI(coin);
  showDetail();

  const symbol = coin.symbol.toUpperCase();
  initChart(symbol);
  await loadBinanceMarkets(symbol);
  startBinanceWS(symbol);
}

detailTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    detailTabs.forEach(tEl => tEl.classList.remove("active"));
    tab.classList.add("active");
    updateDetailTabContent(tab.dataset.tab);
  });
});

const aggregatorView = document.getElementById("aggregatorView");
const aggregatorButton = document.getElementById("aggregatorButton");
const aggCoinInput = document.getElementById("aggCoinInput");
const aggCoinDropdown = document.getElementById("aggCoinDropdown");
const aggAmount = document.getElementById("aggAmount");
const aggSearchBtn = document.getElementById("aggSearchBtn");
const aggResult = document.getElementById("aggResult");

let aggSelectedCoin = null;

const PLATFORMS = [
  {
    id: "binance",
    name: "Binance",
    logo: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png",
    fee: 0.001,
    feeLabel: "0.10%",
    url: (sym) => `https://www.binance.com/en/trade/${sym}_USDT`,
    fetchPrice: async (sym) => {
      const r = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${sym}USDT`);
      if (!r.ok) return null;
      const d = await r.json();
      return parseFloat(d.price);
    }
  },
  {
    id: "kraken",
    name: "Kraken",
    logo: "https://cryptologos.cc/logos/kraken-krak-logo.png",
    fee: 0.0026,
    feeLabel: "0.26%",
    url: (sym) => `https://www.kraken.com/prices/${sym.toLowerCase()}`,
    fetchPrice: async (sym) => {
      const pair = sym + "USD";
      const r = await fetch(`https://api.kraken.com/0/public/Ticker?pair=${pair}`);
      if (!r.ok) return null;
      const d = await r.json();
      if (d.error && d.error.length) return null;
      const key = Object.keys(d.result)[0];
      return parseFloat(d.result[key].c[0]);
    }
  },
  {
    id: "coinbase",
    name: "Coinbase",
    logo: "https://cryptologos.cc/logos/coinbase-coin-coin-logo.png",
    fee: 0.006,
    feeLabel: "0.60%",
    url: (sym) => `https://www.coinbase.com/price/${sym.toLowerCase()}`,
    fetchPrice: async (sym) => {
      const r = await fetch(`https://api.coinbase.com/v2/prices/${sym}-USD/spot`);
      if (!r.ok) return null;
      const d = await r.json();
      return parseFloat(d.data?.amount);
    }
  },
  {
    id: "bybit",
    name: "Bybit",
    logo: "https://cryptologos.cc/logos/bybit-bit-logo.png",
    fee: 0.001,
    feeLabel: "0.10%",
    url: (sym) => `https://www.bybit.com/en/trade/spot/${sym}/USDT`,
    fetchPrice: async (sym) => {
      const r = await fetch(`https://api.bybit.com/v5/market/tickers?category=spot&symbol=${sym}USDT`);
      if (!r.ok) return null;
      const d = await r.json();
      return parseFloat(d.result?.list?.[0]?.lastPrice);
    }
  },
  {
    id: "kucoin",
    name: "KuCoin",
    logo: "https://cryptologos.cc/logos/kucoin-kcs-logo.png",
    fee: 0.001,
    feeLabel: "0.10%",
    url: (sym) => `https://www.kucoin.com/trade/${sym}-USDT`,
    fetchPrice: async (sym) => {
      const r = await fetch(`https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${sym}-USDT`);
      if (!r.ok) return null;
      const d = await r.json();
      return parseFloat(d.data?.price);
    }
  }
];

function showAggregator() {
  homeView.style.display = "none";
  detailView.style.display = "none";
  aggregatorView.style.display = "block";
  if (ws) { ws.close(); ws = null; }
  pills.forEach(p => { if (p.dataset.mode) p.classList.remove("active"); });
}

aggregatorButton.addEventListener("click", () => {
  showAggregator();
});

aggCoinInput.addEventListener("input", () => {
  const q = aggCoinInput.value.trim().toLowerCase();
  aggSelectedCoin = null;
  if (!q || q.length < 1) {
    aggCoinDropdown.innerHTML = "";
    aggCoinDropdown.classList.remove("open");
    return;
  }
  const matches = allCoins.filter(c =>
    c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
  ).slice(0, 10);

  if (!matches.length) {
    aggCoinDropdown.classList.remove("open");
    return;
  }
  aggCoinDropdown.innerHTML = matches.map(c => `
    <div class="agg-dropdown-item" data-id="${c.id}" data-symbol="${c.symbol.toUpperCase()}" data-name="${c.name}" data-img="${c.image || ''}">
      <img src="${c.image || ''}" onerror="this.style.display='none'" />
      <span>${c.name}</span>
      <span style="color:var(--text-muted);margin-left:auto;">${c.symbol.toUpperCase()}</span>
    </div>
  `).join("");
  aggCoinDropdown.classList.add("open");

  aggCoinDropdown.querySelectorAll(".agg-dropdown-item").forEach(item => {
    item.addEventListener("click", () => {
      aggSelectedCoin = { id: item.dataset.id, symbol: item.dataset.symbol, name: item.dataset.name, image: item.dataset.img };
      aggCoinInput.value = item.dataset.name + " (" + item.dataset.symbol + ")";
      aggCoinDropdown.classList.remove("open");
    });
  });
});

document.addEventListener("click", (e) => {
  if (!aggCoinInput.contains(e.target) && !aggCoinDropdown.contains(e.target)) {
    aggCoinDropdown.classList.remove("open");
  }
});

aggSearchBtn.addEventListener("click", async () => {
  if (!aggSelectedCoin) {
    aggResult.innerHTML = `<div class="agg-error">Bitte zuerst eine Kryptowährung auswählen.</div>`;
    return;
  }
  const usdAmount = parseFloat(aggAmount.value);
  if (!usdAmount || usdAmount <= 0) {
    aggResult.innerHTML = `<div class="agg-error">Bitte einen gültigen Betrag eingeben.</div>`;
    return;
  }

  aggResult.innerHTML = `<div class="agg-loading">Lade Echtzeit-Preise von allen Plattformen...</div>`;
  aggSearchBtn.disabled = true;

  const sym = aggSelectedCoin.symbol.toUpperCase();
  const results = await Promise.allSettled(PLATFORMS.map(async p => {
    const price = await p.fetchPrice(sym);
    return { platform: p, price };
  }));

  const data = results
    .filter(r => r.status === "fulfilled" && r.value.price && !isNaN(r.value.price))
    .map(r => r.value)
    .sort((a, b) => a.price - b.price);

  aggSearchBtn.disabled = false;

  if (!data.length) {
    aggResult.innerHTML = `<div class="agg-error">Keine Preisdaten verfügbar für ${sym}. Möglicherweise wird dieses Coin nicht auf allen Plattformen gehandelt.</div>`;
    return;
  }

  const bestPrice = data[0].price;
  const savings = data.length > 1 ? ((data[data.length - 1].price - bestPrice) / data[data.length - 1].price * 100).toFixed(2) : null;

  let html = `
    <div class="agg-summary">
      <div>Coin: <b>${aggSelectedCoin.name} (${sym})</b></div>
      <div>Betrag: <b>$${formatNumber(usdAmount, 2)}</b></div>
      <div>Bester Preis: <b>$${formatNumber(bestPrice, 2)}</b> auf <b>${data[0].platform.name}</b></div>
      ${savings ? `<div style="color:var(--positive);">Du sparst bis zu <b>${savings}%</b> gegenüber der teuersten Option</div>` : ""}
    </div>
    <div class="agg-platforms">
  `;

  data.forEach((item, i) => {
    const p = item.platform;
    const coinAmount = usdAmount / item.price;
    const fee = usdAmount * p.fee;
    const totalCost = usdAmount + fee;
    const coinAfterFee = (usdAmount - fee) / item.price;
    const isBest = i === 0;
    const priceDiff = i > 0 ? ((item.price - bestPrice) / bestPrice * 100).toFixed(2) : null;

    html += `
      <div class="agg-platform-card ${isBest ? "best" : ""}">
        ${isBest ? `<div class="agg-best-badge">BESTER PREIS</div>` : ""}
        <div class="agg-platform-name">
          <img class="agg-platform-logo" src="${p.logo}" onerror="this.style.display='none'" />
          ${p.name}
          ${priceDiff ? `<span style="margin-left:auto;font-size:11px;color:var(--negative);font-weight:400;">+${priceDiff}%</span>` : ""}
        </div>
        <div class="agg-price-big">$${formatNumber(item.price, 2)}</div>
        <div class="agg-row"><span>Du erhältst</span><span>${formatNumber(coinAfterFee, 6)} ${sym}</span></div>
        <div class="agg-row"><span>Handelsgebühr</span><span>${p.feeLabel} ($${formatNumber(fee, 2)})</span></div>
        <div class="agg-row"><span>Gesamtkosten</span><span>$${formatNumber(totalCost, 2)}</span></div>
        <a class="agg-buy-btn" href="${p.url(sym)}" target="_blank" rel="noopener">Auf ${p.name} kaufen →</a>
      </div>
    `;
  });

  html += `</div>`;
  aggResult.innerHTML = html;
});

loadData(true);
setInterval(() => {
  loadData(false);
}, 10000); // OPTIMIZED: 10s interval (less API spam, still responsive)

const GEMINI_KEY = "AIzaSyA-9AdDJlI22ycxCH_d_YuziqkcDmLuVng";
const aiFab = document.getElementById("aiFab");
const aiPanel = document.getElementById("aiPanel");
const aiPanelClose = document.getElementById("aiPanelClose");
const aiMessages = document.getElementById("aiMessages");
const aiInput = document.getElementById("aiInput");
const aiSend = document.getElementById("aiSend");
let aiHistory = [];

aiFab.addEventListener("click", () => {
  aiPanel.classList.toggle("open");
  if (aiPanel.classList.contains("open")) {
    aiInput.focus();
  }
});

aiPanelClose.addEventListener("click", () => {
  aiPanel.classList.remove("open");
});

function appendMessage(role, text) {
  const div = document.createElement("div");
  div.className = "ai-msg " + role;
  div.textContent = text;
  aiMessages.appendChild(div);
  aiMessages.scrollTop = aiMessages.scrollHeight;
  return div;
}

async function sendAIMessage() {
  const userText = aiInput.value.trim();
  if (!userText) return;

  aiInput.value = "";
  aiSend.disabled = true;
  appendMessage("user", userText);

  const thinkingDiv = appendMessage("thinking", "...");

  const topCoins = allCoins.slice(0, 10).map(c =>
    `${c.name} (${c.symbol.toUpperCase()}): $${c.current_price?.toFixed(2)} | 24h: ${c.price_change_percentage_24h?.toFixed(2)}%`
  ).join("\n");

  const systemPrompt = `Du bist ein hochintelligenter Krypto-Assistent auf einem Live-Crypto-Dashboard namens CryptoBoard.
Du gibst präzise, fundierte und aktuelle Antworten über Kryptowährungen, Blockchain, DeFi, NFTs, Trading-Strategien und Marktanalysen.
Antworte immer in der Sprache, in der der Nutzer fragt.
Hier sind die aktuellen Live-Preise der Top-Coins (Stand: gerade eben):
${topCoins}
Beziehe diese Daten in deine Antworten ein, wenn relevant.`;

  const contents = [
    { role: "user", parts: [{ text: systemPrompt }] },
    { role: "model", parts: [{ text: "Verstanden. Ich bin bereit, Krypto-Fragen zu beantworten." }] },
    ...aiHistory.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    })),
    { role: "user", parts: [{ text: userText }] }
  ];

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents })
      }
    );

    const data = await res.json();

    if (data.error) {
      thinkingDiv.className = "ai-msg assistant";
      thinkingDiv.textContent = "Fehler: " + data.error.message;
    } else {
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Keine Antwort erhalten.";
      thinkingDiv.className = "ai-msg assistant";
      thinkingDiv.textContent = reply;
      aiHistory.push({ role: "user", content: userText });
      aiHistory.push({ role: "assistant", content: reply });
      if (aiHistory.length > 20) aiHistory = aiHistory.slice(-20);
    }
  } catch (e) {
    thinkingDiv.className = "ai-msg assistant";
    thinkingDiv.textContent = "Fehler: " + e.message;
  }

  aiSend.disabled = false;
  aiMessages.scrollTop = aiMessages.scrollHeight;
  aiInput.focus();
}

aiSend.addEventListener("click", sendAIMessage);
aiInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendAIMessage();
});

})();
