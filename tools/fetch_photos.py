#!/usr/bin/env python3
"""Download the photos listed in tools/photos.json into img/<name>.jpg.

Source: Unsplash, free photos only (Unsplash License: free to use, no permission needed).
Photos are stored in the repo so the site never loads anything from a foreign server
(needed for students in Russia without VPN).

Usage:  python3 tools/fetch_photos.py            # only missing photos
        python3 tools/fetch_photos.py v1-bike 2  # take the 3rd search result for one photo
"""
import json, os, sys, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, "img")
CREDITS = os.path.join(IMG, "credits.json")
UA = {"User-Agent": "Mozilla/5.0 (photo fetcher for an English test site)"}

def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
        return r.read()

def search(query):
    url = "https://unsplash.com/napi/search/photos?" + urllib.parse.urlencode({"query": query, "per_page": 30, "orientation": "landscape"})
    data = json.loads(get(url))
    return [p for p in data.get("results", []) if not p.get("premium") and not p.get("plus")]

def main():
    os.makedirs(IMG, exist_ok=True)
    wanted = json.load(open(os.path.join(ROOT, "tools", "photos.json")))
    credits = json.load(open(CREDITS)) if os.path.exists(CREDITS) else {}
    only, pick = (sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 0) if len(sys.argv) > 1 else (None, 0)
    for name, query in wanted.items():
        path = os.path.join(IMG, name + ".jpg")
        if only and name != only:
            continue
        if not only and os.path.exists(path):
            continue
        results = search(query)
        if len(results) <= pick:
            print(f"!! {name}: nothing found for '{query}'"); continue
        p = results[pick]
        raw = p["urls"]["raw"]
        src = raw + ("&" if "?" in raw else "?") + "w=1400&q=78&fm=jpg&fit=max"
        open(path, "wb").write(get(src))
        credits[name] = {"photographer": p["user"]["name"], "page": p["links"]["html"], "description": p.get("alt_description")}
        print(f"ok {name}: {p.get('alt_description')} — {p['user']['name']}")
    json.dump(credits, open(CREDITS, "w"), ensure_ascii=False, indent=1)

if __name__ == "__main__":
    main()
