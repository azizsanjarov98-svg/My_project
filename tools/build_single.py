#!/usr/bin/env python3
"""Build dist/money-tenses-test.html: one self-contained file (CSS, JS, fonts and any photos in img/ inlined).
It opens offline on any computer or phone and can be shared via Telegram, WhatsApp or email — no VPN, no internet needed."""
import base64, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
read = lambda p: open(os.path.join(ROOT, p), encoding="utf-8").read()
b64 = lambda p: base64.b64encode(open(os.path.join(ROOT, p), "rb").read()).decode()

css = read("assets/style.css")
css = re.sub(r'url\("\.\./(fonts/[^"]+\.woff2)"\)', lambda m: f'url(data:font/woff2;base64,{b64(m.group(1))})', css)

app = read("assets/app.js")
photos = {f[:-4]: "data:image/jpeg;base64," + b64("img/" + f) for f in sorted(os.listdir(os.path.join(ROOT, "img"))) if f.endswith(".jpg")} if os.path.isdir(os.path.join(ROOT, "img")) else {}
if photos:
    import json
    app = "const PHOTO_DATA=" + json.dumps(photos) + ";\n" + app.replace('src="img/${name}.jpg"', 'src="${PHOTO_DATA[name]||"img/"+name+".jpg"}"')

html = read("index.html")
html = re.sub(r'<link rel="preload"[^>]*>\n', "", html)
html = html.replace('<link rel="stylesheet" href="assets/style.css">', f"<style>\n{css}\n</style>")
html = html.replace('<script src="assets/data.js"></script>', f"<script>\n{read('assets/data.js')}\n</script>")
html = html.replace('<script src="assets/app.js"></script>', f"<script>\n{app}\n</script>")
os.makedirs(os.path.join(ROOT, "dist"), exist_ok=True)
out = os.path.join(ROOT, "dist", "money-tenses-test.html")
open(out, "w", encoding="utf-8").write(html)
print(out, round(os.path.getsize(out) / 1024), "KB,", len(photos), "photos")
