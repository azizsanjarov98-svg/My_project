"""List Mixkit sounds on a tag page: id, title, duration. Usage: mixkit_list.py <url> [more urls]"""
import re, sys, subprocess
for url in sys.argv[1:]:
    h = subprocess.run(['curl', '-sS', '--max-time', '25', url], capture_output=True, text=True).stdout
    for blk in h.split('data-audio-player-item-id-value="')[1:]:
        iid = blk.split('"')[0]
        t = re.search(r'item-grid-card__title">\s*(.*?)\s*<', blk, re.S)
        d = re.search(r'(\d+:\d\d)', blk[:4000])
        kind = 'music' if '/music/' in blk[:800] else 'sfx'
        print(f"{kind}\t{iid}\t{d.group(1) if d else '?'}\t{t.group(1).strip() if t else '?'}")
