/* Connections — daily puzzle from puzzles.js, progress saved per puzzle. */
(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const COLORS = ["y", "g", "b", "p"];
  const EMOJI = { y: "🟨", g: "🟩", b: "🟦", p: "🟪" };
  const N = PUZZLES.length;
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const lsGet = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? d : v; } catch { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } };

  // ---------- which puzzle ----------
  // Endless: every player gets their own shuffled sequence through the bank.
  // When the sequence runs out it's reshuffled and appended, so the puzzle
  // number just keeps climbing. Progress is stored per position, not per
  // puzzle, so a repeat much later starts fresh.
  let seq = lsGet("connections:seq", null);
  if (!Array.isArray(seq) || seq.length === 0) { seq = shuffle([...Array(N).keys()]); lsSet("connections:seq", seq); }
  let cursor = Number(lsGet("connections:cursor", 0)) || 0;
  while (cursor >= seq.length) {
    const more = shuffle([...Array(N).keys()]);
    // don't repeat the puzzle you literally just played
    if (N > 1 && more[0] === seq[seq.length - 1]) [more[0], more[1]] = [more[1], more[0]];
    seq = seq.concat(more); lsSet("connections:seq", seq);
  }
  const params = new URLSearchParams(location.search);
  const debugIdx = params.has("p") ? Number(params.get("p")) : NaN;
  const isDebug = Number.isInteger(debugIdx) && debugIdx >= 0 && debugIdx < N;
  const idx = isDebug ? debugIdx : seq[cursor];
  const number = cursor + 1;                       // what the player sees
  const puzzle = PUZZLES[idx];
  const KEY = isDebug ? `connections:dbg:${idx}` : `connections:v2:${cursor}`;
  const solvedCount = () => Number(lsGet("connections:solved", 0)) || 0;
  const advance = () => { if (!isDebug) lsSet("connections:cursor", cursor + 1); location.href = location.pathname; };

  // ---------- state ----------
  const st = { selected: [], solved: [], attempts: [], mistakes: 0, done: false, order: [] };
  const words = puzzle.flatMap(([, ws], gi) => ws.map((w) => ({ w, gi })));
  const groupOf = (w) => words.find((x) => x.w === w).gi;

  function save() { lsSet(KEY, { solved: st.solved, attempts: st.attempts, mistakes: st.mistakes, done: st.done, order: st.order, counted: !!st.counted }); }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!s) return false;
      Object.assign(st, { solved: s.solved || [], attempts: s.attempts || [], mistakes: s.mistakes || 0, done: !!s.done, order: s.order || [], counted: !!s.counted });
      return true;
    } catch { return false; }
  }

  // ---------- render ----------
  const grid = $("#grid"), solvedEl = $("#solved");

  function renderSolved() {
    solvedEl.innerHTML = "";
    for (const gi of st.solved) {
      const [title, ws] = puzzle[gi];
      const el = document.createElement("div");
      el.className = `group ${COLORS[gi]}`;
      el.innerHTML = `<b>${title}</b><span>${ws.join(", ")}</span>`;
      solvedEl.appendChild(el);
    }
  }

  function renderGrid() {
    grid.innerHTML = "";
    const remaining = st.order.filter((w) => !st.solved.includes(groupOf(w)));
    for (const w of remaining) {
      const b = document.createElement("button");
      b.className = "tile" + (st.selected.includes(w) ? " selected" : "");
      b.textContent = w;
      b.dataset.w = w;
      b.onclick = () => toggle(w);
      grid.appendChild(b);
    }
    updateButtons();
  }

  function renderDots() {
    [...$("#dots").children].forEach((d, i) => d.classList.toggle("gone", i >= 4 - st.mistakes));
  }

  function updateButtons() {
    $("#btn-submit").disabled = st.selected.length !== 4 || st.done;
    $("#btn-deselect").disabled = st.selected.length === 0 || st.done;
    $("#btn-shuffle").disabled = st.done;
  }

  function toggle(w) {
    if (st.done) return;
    const i = st.selected.indexOf(w);
    if (i >= 0) st.selected.splice(i, 1);
    else if (st.selected.length < 4) st.selected.push(w);
    else return;
    grid.querySelectorAll(".tile").forEach((t) => t.classList.toggle("selected", st.selected.includes(t.dataset.w)));
    updateButtons();
  }

  let toastTimer = 0;
  function toast(msg, ms = 1600) {
    const t = $("#toast"); t.textContent = msg; t.classList.remove("hidden");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.add("hidden"), ms);
  }

  // ---------- submit ----------
  let busy = false;
  async function submit() {
    if (busy || st.selected.length !== 4 || st.done) return;
    busy = true;
    const tiles = st.selected.map((w) => grid.querySelector(`[data-w="${CSS.escape(w)}"]`));
    // bounce in order like the original
    for (const t of tiles) { t.classList.add("bounce"); await wait(90); }
    await wait(260);
    tiles.forEach((t) => t.classList.remove("bounce"));

    const groups = st.selected.map(groupOf);
    st.attempts.push(groups.map((gi) => COLORS[gi]));
    const counts = {}; for (const gi of groups) counts[gi] = (counts[gi] || 0) + 1;
    const best = Math.max(...Object.values(counts));

    if (best === 4) {
      const gi = groups[0];
      tiles.forEach((t) => t.classList.add("fade"));
      await wait(220);
      st.solved.push(gi);
      st.selected = [];
      renderSolved(); renderGrid();
      if (st.solved.length === 4) finish(true);
    } else {
      // already guessed this exact set?
      const key = [...st.selected].sort().join("|");
      if (st.prevSets && st.prevSets.includes(key)) {
        st.attempts.pop();
        toast("Already guessed!");
        busy = false;
        return;
      }
      (st.prevSets = st.prevSets || []).push(key);
      if (best === 3) toast("One away…");
      tiles.forEach((t) => t.classList.add("shake"));
      await wait(420);
      tiles.forEach((t) => t.classList.remove("shake"));
      st.mistakes++;
      renderDots();
      if (st.mistakes >= 4) {
        await wait(300);
        finish(false);
      }
    }
    save();
    busy = false;
  }

  async function finish(won) {
    st.done = true;
    updateButtons();
    if (won && !st.counted) { st.counted = true; lsSet("connections:solved", solvedCount() + 1); }
    if (!won) {
      toast("Next time!", 1400);
      // reveal the rest, one group at a time
      for (let gi = 0; gi < 4; gi++) {
        if (st.solved.includes(gi)) continue;
        await wait(650);
        st.solved.push(gi); st.selected = [];
        renderSolved(); renderGrid();
      }
    }
    save();
    await wait(700);
    showResults(won);
  }

  function showResults(won) {
    const m = st.mistakes;
    const title = !won ? "Next Time!" : m === 0 ? "Perfect!" : m === 1 ? "Great!" : m === 2 ? "Solid!" : "Phew!";
    $("#result-title").textContent = title;
    $("#result-sub").textContent = `Puzzle #${number} · ${won ? `${m} mistake${m === 1 ? "" : "s"}` : "out of mistakes"} · ${solvedCount()} solved`;
    $("#result-grid").innerHTML = st.attempts.map((a) => `<div>${a.map((c) => EMOJI[c]).join("")}</div>`).join("");
    $("#modal").classList.remove("hidden");
  }

  function shareText() {
    const head = `Daytona Connections #${number}`;
    return `${head}\n${st.attempts.map((a) => a.map((c) => EMOJI[c]).join("")).join("\n")}`;
  }

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // ---------- wire up ----------
  $("#btn-submit").onclick = submit;
  $("#btn-deselect").onclick = () => { st.selected = []; renderGrid(); };
  $("#btn-shuffle").onclick = () => { shuffle(st.order); renderGrid(); save(); };
  $("#btn-help").onclick = () => $("#help").classList.remove("hidden");
  document.querySelectorAll("[data-close]").forEach((b) => { b.onclick = () => b.closest(".modal").classList.add("hidden"); });
  document.querySelectorAll(".modal").forEach((m) => { m.addEventListener("click", (e) => { if (e.target === m) m.classList.add("hidden"); }); });
  $("#btn-share").onclick = async () => {
    const text = shareText();
    try {
      if (navigator.share) await navigator.share({ text });
      else { await navigator.clipboard.writeText(text); toast("Copied to clipboard"); }
    } catch { /* cancelled */ }
  };
  $("#btn-another").onclick = advance;
  $("#btn-skip").onclick = advance;
  $("#btn-random").onclick = () => {
    // swap a different random puzzle into this slot and start it fresh
    let r = idx; while (r === idx && N > 1) r = Math.floor(Math.random() * N);
    if (!isDebug) { seq[cursor] = r; lsSet("connections:seq", seq); try { localStorage.removeItem(KEY); } catch { /* ignore */ } }
    location.href = location.pathname;
  };

  // ---------- boot ----------
  $("#puzzle-label").textContent = `Puzzle #${number}${solvedCount() ? ` · ${solvedCount()} solved` : ""}`;
  if (!load() || st.order.length !== 16) { st.order = shuffle(words.map((x) => x.w)); save(); }
  renderSolved(); renderGrid(); renderDots();
  if (st.done) showResults(st.solved.length === 4 && st.mistakes < 4);
})();
