// Leonida Trophy Guide — offline tracker for GTA VI (PS5), 55 trophies.
// Loads the official trophy list and the roadmap from local JSON files only;
// progress and settings live in this browser's localStorage. No network use.

const TROPHIES_URL = "data/trophies.json";
const ROADMAP_URL = "data/roadmap.json";
const EARNED_KEY = "leonida-trophy-earned-v1";
const SPOILER_KEY = "leonida-trophy-spoilers-v1";

const KIND_LABELS = {
  all: "All kinds",
  story: "Story",
  missable: "Missable",
  collectibles: "Collectibles",
  activities: "Activities",
  online: "Online",
};

const GRADE_POINTS = { platinum: 180, gold: 90, silver: 30, bronze: 15 };

const state = {
  trophies: [],
  roadmap: null,
  earned: new Set(),
  spoilersHidden: true,
  kind: "all",
  grade: "all",
  status: "all",
  query: "",
  detailId: null,
};

const $ = (id) => document.getElementById(id);

function loadEarned() {
  try {
    const raw = localStorage.getItem(EARNED_KEY);
    if (!raw) return new Set();
    const ids = JSON.parse(raw);
    return new Set(Array.isArray(ids) ? ids.filter((n) => Number.isInteger(n)) : []);
  } catch {
    return new Set();
  }
}

function saveEarned() {
  localStorage.setItem(EARNED_KEY, JSON.stringify([...state.earned].sort((a, b) => a - b)));
}

function loadSpoilers() {
  try {
    return localStorage.getItem(SPOILER_KEY) !== "off";
  } catch {
    return true;
  }
}

function saveSpoilers() {
  try {
    localStorage.setItem(SPOILER_KEY, state.spoilersHidden ? "on" : "off");
  } catch {
    /* storage unavailable: spoiler choice just does not persist */
  }
}

function isStory(trophy) {
  return trophy.kind === "story";
}

function isSpoilerHidden(trophy) {
  return state.spoilersHidden && isStory(trophy) && !state.earned.has(trophy.id);
}

function gradePoints(trophy) {
  return GRADE_POINTS[trophy.grade] || 0;
}

function trophyMatches(trophy) {
  if (state.kind !== "all") {
    if (state.kind === "missable") {
      if (!trophy.missable) return false;
    } else if (trophy.kind !== state.kind) {
      return false;
    }
  }
  if (state.grade !== "all" && trophy.grade !== state.grade) return false;
  if (state.status === "earned" && !state.earned.has(trophy.id)) return false;
  if (state.status === "unearned" && state.earned.has(trophy.id)) return false;
  if (state.query) {
    const hay = [trophy.name, trophy.description, trophy.guide, trophy.kind]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!hay.includes(state.query)) return false;
  }
  return true;
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function sourceLinks(trophy) {
  const sources = Array.isArray(trophy.sources) ? trophy.sources : [];
  if (sources.length === 0) return "";
  const links = sources
    .map((s) => {
      if (s.url) return `<a href="${escapeHtml(s.url)}" target="_blank" rel="noopener">${escapeHtml(s.name)}</a>`;
      return escapeHtml(s.name);
    })
    .join(" · ");
  return `<p class="trophy-sources"><span class="label">Sources:</span> ${links}</p>`;
}

function renderProgress() {
  const total = state.trophies.length;
  const earned = state.earned.size;
  const pct = total ? Math.round((earned / total) * 100) : 0;
  const points = state.trophies
    .filter((t) => state.earned.has(t.id))
    .reduce((sum, t) => sum + gradePoints(t), 0);
  const totalPoints = state.trophies.reduce((sum, t) => sum + gradePoints(t), 0);
  $("progressFill").style.width = `${pct}%`;
  $("progressCount").textContent = `${earned} / ${total}`;
  $("progressPct").textContent = `${pct}%`;
  $("progressPoints").textContent = String(points);
  $("progressTotal").textContent = String(totalPoints);
  const platinum = state.trophies.find((t) => t.grade === "platinum");
  $("platinumState").textContent =
    platinum && state.earned.has(platinum.id) ? "earned!" : "not yet earned";
}

function renderKindFilters() {
  const wrap = $("kindFilters");
  wrap.innerHTML = "";
  for (const [key, label] of Object.entries(KIND_LABELS)) {
    const count =
      key === "all"
        ? state.trophies.length
        : key === "missable"
          ? state.trophies.filter((t) => t.missable).length
          : state.trophies.filter((t) => t.kind === key).length;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip";
    btn.setAttribute("aria-pressed", String(state.kind === key));
    btn.innerHTML = `${escapeHtml(label)} <span class="count">${count}</span>`;
    btn.addEventListener("click", () => {
      state.kind = key;
      renderKindFilters();
      renderGrid();
    });
    wrap.appendChild(btn);
  }
}

function trophyCard(trophy) {
  const earned = state.earned.has(trophy.id);
  const hidden = isSpoilerHidden(trophy);
  const card = document.createElement("article");
  card.className = `trophy-card${earned ? " earned" : ""}${hidden ? " spoiler-hidden" : ""}`;
  card.dataset.trophyId = String(trophy.id);

  const top = document.createElement("div");
  top.className = "trophy-top";
  const badge = document.createElement("span");
  badge.className = `grade-badge grade-${trophy.grade}`;
  badge.textContent = trophy.grade;
  const name = document.createElement("h3");
  name.className = "trophy-name";
  name.textContent = hidden ? "Hidden story trophy" : trophy.name;
  top.append(badge, name);
  card.appendChild(top);

  if (hidden) {
    const note = document.createElement("p");
    note.className = "spoiler-note";
    note.textContent =
      "Story trophy — its name and description stay hidden until you earn it or switch spoilers off.";
    card.appendChild(note);
  } else {
    const desc = document.createElement("p");
    desc.className = "trophy-desc";
    desc.textContent = `“${trophy.description}”`;
    card.appendChild(desc);

    const guide = document.createElement("p");
    guide.className = "trophy-guide";
    guide.innerHTML = `<span class="label">Guide:</span> ${escapeHtml(trophy.guide)}`;
    card.appendChild(guide);

    const sources = document.createElement("div");
    sources.innerHTML = sourceLinks(trophy);
    card.appendChild(sources);
  }

  const tags = document.createElement("div");
  tags.className = "trophy-tags";
  const kindTag = document.createElement("span");
  kindTag.className = "tag kind-tag";
  kindTag.textContent = KIND_LABELS[trophy.kind] || trophy.kind || "misc";
  tags.appendChild(kindTag);
  if (trophy.missable) {
    const miss = document.createElement("span");
    miss.className = "tag missable-tag";
    miss.textContent = "⚠ Missable";
    tags.appendChild(miss);
  }
  if (trophy.hidden) {
    const hid = document.createElement("span");
    hid.className = "tag";
    hid.textContent = "Hidden on PSN";
    tags.appendChild(hid);
  }
  if (trophy.roadmap) {
    const stage = document.createElement("span");
    stage.className = "tag";
    stage.textContent = trophy.roadmap;
    tags.appendChild(stage);
  }
  card.appendChild(tags);

  const row = document.createElement("div");
  row.className = "earn-row";
  const box = document.createElement("input");
  box.type = "checkbox";
  box.id = `earn-${trophy.id}`;
  box.checked = earned;
  box.setAttribute("aria-label", `Mark ${trophy.name} as earned`);
  box.addEventListener("change", () => {
    if (box.checked) state.earned.add(trophy.id);
    else state.earned.delete(trophy.id);
    saveEarned();
    renderProgress();
    renderGrid();
    if (state.detailId === trophy.id) openDetail(trophy.id);
  });
  const label = document.createElement("label");
  label.htmlFor = box.id;
  label.textContent = earned ? "Earned ✓" : "Mark as earned";
  const open = document.createElement("button");
  open.type = "button";
  open.className = "open-guide";
  open.textContent = "Read guide";
  open.addEventListener("click", () => openDetail(trophy.id));
  row.append(box, label, open);
  card.appendChild(row);

  return card;
}

function renderGrid() {
  const grid = $("trophyGrid");
  grid.innerHTML = "";
  const shown = state.trophies.filter(trophyMatches);
  for (const trophy of shown) grid.appendChild(trophyCard(trophy));
  $("resultCount").textContent =
    shown.length === state.trophies.length
      ? `Showing all ${shown.length} trophies.`
      : `Showing ${shown.length} of ${state.trophies.length} trophies.`;
}

function renderRoadmap() {
  const data = state.roadmap;
  if (!data) return;
  $("roadmapIntro").textContent = data.intro || "";
  const steps = $("roadmapSteps");
  steps.innerHTML = "";
  for (const step of data.steps || []) {
    const li = document.createElement("li");
    const h3 = document.createElement("h3");
    h3.textContent = step.title;
    const hours = document.createElement("p");
    hours.className = "hours";
    hours.textContent = step.hours || "";
    const body = document.createElement("p");
    body.textContent = step.body || "";
    li.append(h3, hours, body);
    steps.appendChild(li);
  }
  const notes = $("roadmapNotes");
  notes.innerHTML = "";
  for (const note of data.notes || []) {
    const p = document.createElement("p");
    p.innerHTML = `<strong>${escapeHtml(note.title)}:</strong> ${escapeHtml(note.body)}`;
    notes.appendChild(p);
  }

  const missable = state.trophies.filter((t) => t.missable);
  $("missableIntro").textContent = data.missableIntro || "";
  const list = $("missableList");
  list.innerHTML = "";
  for (const trophy of missable) {
    const li = document.createElement("li");
    li.innerHTML =
      `<span class="flag possible">POSSIBLY MISSABLE</span><strong>${escapeHtml(trophy.name)}</strong> — ` +
      `${escapeHtml(trophy.missableNote || trophy.guide)}`;
    list.appendChild(li);
  }
  if (missable.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No trophy is confirmed missable from the official descriptions.";
    list.appendChild(li);
  }
}

function renderSources() {
  const data = state.roadmap;
  const body = $("sourcesBody");
  body.innerHTML = "";
  const method = document.createElement("p");
  method.textContent =
    "Method: the trophy names, descriptions and grades come from the official " +
    "PlayStation list as published by Exophase and PSNProfiles (18 Nov 2026), which agree on all 55 " +
    "(1 platinum, 2 gold, 6 silver, 46 bronze; 28 of them hidden on PlayStation until earned). " +
    "Each guide below is written in our own words from the cited source; where no source has yet " +
    "documented a method, the guide says so honestly instead of inventing a step. " +
    "The roadmap and missable flag are built from the official descriptions plus PowerPyx's roadmap.";
  body.appendChild(method);
  const list = document.createElement("ul");
  for (const src of data?.sources || []) {
    const li = document.createElement("li");
    if (src.url) {
      const a = document.createElement("a");
      a.href = src.url;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = src.name;
      li.append(a, document.createTextNode(` — ${src.what || ""}`));
    } else {
      li.textContent = `${src.name} — ${src.what || ""}`;
    }
    list.appendChild(li);
  }
  body.appendChild(list);
}

function openDetail(id) {
  const trophy = state.trophies.find((t) => t.id === id);
  if (!trophy) return;
  state.detailId = id;
  const section = $("detail");
  const body = $("detailBody");
  body.innerHTML = "";
  const hidden = isSpoilerHidden(trophy);
  const h3 = document.createElement("h3");
  h3.textContent = hidden ? "Hidden story trophy" : trophy.name;
  body.appendChild(h3);
  if (hidden) {
    const p = document.createElement("p");
    p.textContent =
      "This is a story trophy and spoilers are hidden. Earn it in-game, or switch “Hide story spoilers” off to read its guide.";
    body.appendChild(p);
  } else {
    const meta = document.createElement("p");
    meta.innerHTML =
      `<strong>Grade:</strong> ${escapeHtml(trophy.grade)} · ` +
      `<strong>Official description:</strong> “${escapeHtml(trophy.description)}”`;
    body.appendChild(meta);
    const guide = document.createElement("p");
    guide.innerHTML = `<strong>Guide:</strong> ${escapeHtml(trophy.guide)}`;
    body.appendChild(guide);
    if (trophy.missable) {
      const warn = document.createElement("p");
      warn.innerHTML = `<strong>⚠ Missable:</strong> ${escapeHtml(trophy.missableNote || "")}`;
      body.appendChild(warn);
    }
    const sources = document.createElement("p");
    sources.className = "sources-list";
    sources.innerHTML = sourceLinks(trophy) || "Sources: official trophy description (PlayStation).";
    body.appendChild(sources);
    const earned = document.createElement("p");
    earned.textContent = state.earned.has(id)
      ? "Status: earned ✓ — saved in this browser."
      : "Status: not yet earned.";
    body.appendChild(earned);
  }
  section.hidden = false;
  section.scrollIntoView({ behavior: "smooth", block: "start" });
  history.replaceState(null, "", `#trophy-${id}`);
}

function closeDetail() {
  state.detailId = null;
  $("detail").hidden = true;
  history.replaceState(null, "", location.pathname + location.search);
}

function exportProgress() {
  const payload = {
    app: "leonida-trophy-guide",
    game: "Grand Theft Auto VI",
    exportedAt: new Date().toISOString(),
    earned: [...state.earned].sort((a, b) => a - b),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "gta6-trophy-progress.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      const ids = Array.isArray(data) ? data : data.earned;
      if (!Array.isArray(ids)) throw new Error("no earned list");
      const valid = new Set(state.trophies.map((t) => t.id));
      const next = new Set(ids.filter((n) => Number.isInteger(n) && valid.has(n)));
      state.earned = next;
      saveEarned();
      renderProgress();
      renderGrid();
      alert(`Imported ${next.size} earned trophies.`);
    } catch {
      alert("That file is not a valid progress export from this guide.");
    }
  };
  reader.readAsText(file);
}

function bindControls() {
  $("searchInput").addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
    renderGrid();
  });
  $("spoilerToggle").addEventListener("change", (event) => {
    state.spoilersHidden = event.target.checked;
    saveSpoilers();
    renderGrid();
    if (state.detailId) openDetail(state.detailId);
  });
  $("gradeFilter").addEventListener("change", (event) => {
    state.grade = event.target.value;
    renderGrid();
  });
  $("statusFilter").addEventListener("change", (event) => {
    state.status = event.target.value;
    renderGrid();
  });
  $("exportBtn").addEventListener("click", exportProgress);
  $("importBtn").addEventListener("click", () => $("importFile").click());
  $("importFile").addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    if (file) importProgress(file);
    event.target.value = "";
  });
  $("resetBtn").addEventListener("click", () => {
    if (confirm("Clear all earned trophies and start over?")) {
      state.earned = new Set();
      saveEarned();
      renderProgress();
      renderGrid();
    }
  });
  $("detailClose").addEventListener("click", closeDetail);
}

async function init() {
  state.earned = loadEarned();
  state.spoilersHidden = loadSpoilers();
  $("spoilerToggle").checked = state.spoilersHidden;

  const [trophyRes, roadmapRes] = await Promise.all([
    fetch(TROPHIES_URL),
    fetch(ROADMAP_URL),
  ]);
  const trophyData = await trophyRes.json();
  state.trophies = trophyData.trophies || [];
  state.roadmap = await roadmapRes.json();

  bindControls();
  renderProgress();
  renderKindFilters();
  renderRoadmap();
  renderSources();
  renderGrid();

  const match = location.hash.match(/^#trophy-(\d+)$/);
  if (match) openDetail(Number(match[1]));
}

init().catch((error) => {
  document.querySelector("main").insertAdjacentHTML(
    "afterbegin",
    `<p style="color:#ff7a7a">Could not load the trophy data (${escapeHtml(error.message)}). ` +
      "Serve the app/ folder over HTTP and try again.</p>",
  );
});
