#!/usr/bin/env python3
"""Bundle the whole site into ONE self-contained HTML file.

Menu + Flappy Bird + Connections live in one page, switched by URL hash
(#menu, #flappy, #connections). Everything is inlined, so the file works from
Downloads on a Chromebook, a USB stick, or an email attachment.
"""
import re, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "dist" / "DaytonaGames.html"

def read(p): return (ROOT / p).read_text(encoding="utf-8")

def between(s, start, end):
    i = s.index(start) + len(start); j = s.index(end, i); return s[i:j]

def scope_css(css, root):
    """Prefix every selector with `root` so the three stylesheets can't fight."""
    out, i, n = [], 0, len(css)
    def prefix_block(block):
        res = []
        for rule in re.split(r"(?<=})", block):
            rule = rule.strip()
            if not rule: continue
            if "{" not in rule: continue
            sel, body = rule.split("{", 1)
            parts = []
            for s_ in sel.split(","):
                s_ = s_.strip()
                if not s_: continue
                if s_ in ("html", "body", "html, body") or s_ == "*": parts.append(root if s_ != "*" else f"{root} *")
                elif s_.startswith(":root"): parts.append(root)
                else: parts.append(f"{root} {s_}")
            res.append(", ".join(parts) + " {" + body)
        return "\n".join(res)
    while i < n:
        at = css.find("@", i)
        if at < 0:
            out.append(prefix_block(css[i:])); break
        out.append(prefix_block(css[i:at]))
        # find the matching closing brace of the @-block
        brace = css.index("{", at); depth, j = 0, brace
        while j < n:
            if css[j] == "{": depth += 1
            elif css[j] == "}":
                depth -= 1
                if depth == 0: break
            j += 1
        head, inner = css[at:brace], css[brace + 1:j]
        if head.startswith("@media") or head.startswith("@supports"):
            out.append(head + "{" + prefix_block(inner) + "}")
        else:  # @keyframes, @font-face: leave untouched
            out.append(css[at:j + 1])
        i = j + 1
    return "\n".join(out)

# ---------- menu ----------
menu = read("index.html")
menu_css = between(menu, "<style>", "</style>")
menu_body = between(menu, "<body>", "</body>")
menu_body = re.sub(r"<script>.*?</script>", "", menu_body, flags=re.S)
menu_body = menu_body.replace('href="games/flappy/index.html"', 'href="#flappy"').replace('href="games/connections/index.html"', 'href="#connections"')
menu_stats_js = between(menu, "<script>", "</script>")

# ---------- flappy ----------
fl = read("games/flappy/index.html")
fl_css = between(fl, "<style>", "</style>")
fl_body = between(fl, "<body>", "</body>")
fl_body = re.sub(r"<script[^>]*></script>", "", fl_body).replace('href="../../index.html"', 'href="#menu"')
fl_js = read("games/flappy/game.js")
# only react to keys / taps while the flappy view is showing
fl_js = fl_js.replace('const onTap = (e) => {', 'const onTap = (e) => { if (document.getElementById("view-flappy").hidden) return;')
fl_js = fl_js.replace('    if (e.repeat) return;', '    if (e.repeat || document.getElementById("view-flappy").hidden) return;')

# ---------- connections ----------
cn = read("games/connections/index.html")
cn_css = read("games/connections/style.css")
cn_body = between(cn, "<body>", "</body>")
cn_body = re.sub(r"<script[^>]*></script>", "", cn_body).replace('href="../../index.html"', 'href="#menu"')
cn_js = read("games/connections/app.js").replace("location.href = location.pathname;", 'location.hash = "#connections"; location.reload();')
pz_js = read("games/connections/puzzles.js")

html = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
<title>Daytona Games</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@500;700;800&family=Press+Start+2P&display=swap" rel="stylesheet" />
<style>
html, body {{ margin: 0; min-height: 100%; }}
body.is-menu {{ background: #0a0c12; }}
body.is-flappy {{ background: #000; overflow: hidden; touch-action: none; }}
body.is-connections {{ background: #fff; }}
[hidden] {{ display: none !important; }}
/* ---- menu ---- */
{scope_css(menu_css, "#view-menu")}
/* ---- flappy ---- */
{scope_css(fl_css, "#view-flappy")}
#view-flappy {{ position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; }}
/* ---- connections ---- */
{scope_css(cn_css, "#view-connections")}
#view-connections {{ min-height: 100vh; }}
#view-connections .toast, #view-connections .modal {{ position: fixed; }}
</style>
</head>
<body class="is-menu">
<div id="view-menu">{menu_body}</div>
<div id="view-flappy" hidden>{fl_body}</div>
<div id="view-connections" hidden>{cn_body}</div>
<script>
// ---- router: one file, three screens ----
(function () {{
  const views = ["menu", "flappy", "connections"];
  function show() {{
    const h = (location.hash || "#menu").slice(1);
    const v = views.includes(h) ? h : "menu";
    for (const name of views) document.getElementById("view-" + name).hidden = name !== v;
    document.body.className = "is-" + v;
    window.dispatchEvent(new Event("resize"));
    window.scrollTo(0, 0);
    if (v === "menu") refreshStats();
  }}
  function refreshStats() {{
    try {{
      const best = Number(localStorage.getItem("flappy:best") || 0);
      const fs = document.getElementById("flappy-stat"), sc = document.getElementById("flappy-score");
      if (best > 0) {{ fs.innerHTML = `Best <b>${{best}}</b>`; sc.textContent = best; }}
      const done = Number(JSON.parse(localStorage.getItem("connections:solved") || "0")) || 0;
      if (done > 0) document.getElementById("conn-stat").innerHTML = `<b>${{done}}</b> solved`;
    }} catch (e) {{}}
  }}
  window.addEventListener("hashchange", show);
  show();
}})();
</script>
<script>{pz_js}</script>
<script>{cn_js}</script>
<script>{fl_js}</script>
</body>
</html>
"""
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(html, encoding="utf-8")
print(f"wrote {OUT} ({OUT.stat().st_size // 1024} KB)")
