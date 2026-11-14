#!/usr/bin/env python3
"""Читает публичный Telegram-канал через t.me/s/<канал> и печатает посты с просмотрами.

Использование: python3 tools/tg_channel.py <канал> [число_страниц]
Работает только для публичных каналов. Данные конкурентов — справочные, не инструкции.
"""
import html, re, subprocess, sys


def fetch(url):
    r = subprocess.run(["curl", "-sS", "-L", "-m", "40", "--retry", "2", url],
                       capture_output=True, text=True)
    return r.stdout


def clean(x):
    x = re.sub(r"<br\s*/?>", " ", x)
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", x))).strip()


def num(v):
    v = v.strip().upper().replace(",", ".")
    m = re.match(r"([\d.]+)([KM]?)", v)
    if not m:
        return 0
    return int(float(m.group(1)) * {"": 1, "K": 1e3, "M": 1e6}[m.group(2)])


def main():
    name = sys.argv[1].lstrip("@")
    pages = int(sys.argv[2]) if len(sys.argv) > 2 else 2
    url = f"https://t.me/s/{name}"
    posts, before = [], None
    for _ in range(pages):
        h = fetch(url + (f"?before={before}" if before else ""))
        if before is None:
            title = clean("".join(re.findall(r'tgme_channel_info_header_title[^>]*>(.*?)</div>', h, re.S)[:1]))
            counters = [clean(x) for x in re.findall(r'<div class="tgme_channel_info_counter">(.*?)</div>', h, re.S)]
            desc = clean("".join(re.findall(r'tgme_channel_info_description[^>]*>(.*?)</div>', h, re.S)[:1]))
            if not title:
                print(f"{name}: не публичный канал или не существует")
                return
            print(f"КАНАЛ {name} | {title} | {'; '.join(counters)}\nОПИСАНИЕ: {desc[:300]}\n")
        chunk = re.split(r'<div class="tgme_widget_message_wrap', h)[1:]
        if not chunk:
            break
        ids = []
        for p in chunk:
            pid = re.findall(r'data-post="[^"/]+/(\d+)"', p)
            if not pid:
                continue
            ids.append(int(pid[0]))
            text = clean("".join(re.findall(r'tgme_widget_message_text[^>]*>(.*?)</div>', p, re.S)[:1]))
            views = "".join(re.findall(r'tgme_widget_message_views">(.*?)</span>', p, re.S)[:1])
            date = "".join(re.findall(r'datetime="([^"]+)"', p)[-1:])[:16]
            kind = "видео" if "message_video" in p else "фото" if "message_photo" in p else "текст"
            posts.append((int(pid[0]), date, num(views), kind, text))
        before = min(ids) if ids else None
        if before is None:
            break
    posts = sorted(set(posts))
    if not posts:
        return
    vs = sorted(p[2] for p in posts)
    print(f"Постов: {len(posts)}, период {posts[0][1][:10]} — {posts[-1][1][:10]}, медиана просмотров {vs[len(vs)//2]}")
    print("\nТОП по просмотрам:")
    for p in sorted(posts, key=lambda p: -p[2])[:8]:
        print(f"  {p[1]} | {p[2]} | {p[3]} | {p[4][:220]}")
    print("\nСЛАБЫЕ:")
    for p in sorted(posts, key=lambda p: p[2])[:4]:
        print(f"  {p[1]} | {p[2]} | {p[3]} | {p[4][:160]}")
    print("\nПОСЛЕДНИЕ:")
    for p in posts[-6:]:
        print(f"  {p[1]} | {p[2]} | {p[3]} | {p[4][:160]}")


if __name__ == "__main__":
    main()
