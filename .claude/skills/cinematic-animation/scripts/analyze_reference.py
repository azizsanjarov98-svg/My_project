#!/usr/bin/env python3
"""Бесплатный разбор видео по кадрам: монтажный ритм, цвет, звук.

Нужен, чтобы (1) снять мерки с эталонного фильма и (2) сравнить с ними свой
готовый ролик. Работает локально через ffmpeg + Pillow, кредиты не тратит.

    python3 analyze_reference.py film.mp4 --out analysis/film

На выходе в папке --out:
    report.md      краткий отчёт для чтения
    report.json    те же числа для сравнения двух видео
    sheet_XX.jpg   раскадровка: средний кадр каждого плана с номером и длиной
    loudness.png   кривая громкости по времени
"""
import argparse
import json
import math
import re
import statistics
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True, errors="replace")


def probe(path):
    out = run(["ffprobe", "-v", "error", "-print_format", "json",
               "-show_format", "-show_streams", str(path)]).stdout
    data = json.loads(out)
    v = next(s for s in data["streams"] if s["codec_type"] == "video")
    a = next((s for s in data["streams"] if s["codec_type"] == "audio"), None)
    num, den = (v.get("avg_frame_rate") or "0/1").split("/")
    fps = float(num) / float(den) if float(den) else 0.0
    return {
        "duration": float(data["format"]["duration"]),
        "width": int(v["width"]),
        "height": int(v["height"]),
        "fps": round(fps, 3),
        "has_audio": a is not None,
    }


def detect_active_picture(path, info):
    """Ищет чёрные поля (каше): возвращает размер активной картинки."""
    start = max(0.0, info["duration"] * 0.2)
    err = run(["ffmpeg", "-hide_banner", "-ss", f"{start:.2f}", "-i", str(path),
               "-t", "20", "-vf", "cropdetect=limit=24:round=2:reset=0",
               "-an", "-f", "null", "-"]).stderr
    crops = re.findall(r"crop=(\d+):(\d+):(\d+):(\d+)", err)
    if not crops:
        return info["width"], info["height"]
    w, h, _, _ = map(int, crops[-1])
    if w < info["width"] * 0.5 or h < info["height"] * 0.3:
        return info["width"], info["height"]
    return w, h


def detect_cuts(path, threshold):
    err = run(["ffmpeg", "-hide_banner", "-i", str(path), "-an",
               "-vf", f"select='gt(scene,{threshold})',showinfo",
               "-f", "null", "-"]).stderr
    return [float(t) for t in re.findall(r"pts_time:([0-9.]+)", err)]


def build_shots(cuts, duration, min_len=0.25):
    edges = [0.0]
    for t in cuts:
        if t - edges[-1] >= min_len and duration - t >= min_len:
            edges.append(t)
    edges.append(duration)
    return [{"n": i + 1, "start": round(a, 3), "end": round(b, 3),
             "len": round(b - a, 3)}
            for i, (a, b) in enumerate(zip(edges, edges[1:]))]


def grab_frame(path, t, dest, width=480):
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", f"{t:.3f}",
         "-i", str(path), "-frames:v", "1", "-vf", f"scale={width}:-2",
         "-q:v", "3", str(dest)])
    return dest.exists()


def hexc(rgb):
    return "#%02x%02x%02x" % tuple(int(round(c)) for c in rgb)


def pixels(img):
    """Список пикселей; имя метода зависит от версии Pillow."""
    getter = getattr(img, "get_flattened_data", None) or img.getdata
    return list(getter())


def frame_colour(img):
    """Яркость, насыщенность, оттенок теней/светов, 5 главных цветов."""
    small = img.convert("RGB").resize((96, 54))
    px = pixels(small)
    lum = [0.2126 * r + 0.7152 * g + 0.0722 * b for r, g, b in px]
    hsv = pixels(small.convert("HSV"))
    order = sorted(range(len(px)), key=lambda i: lum[i])
    q = max(1, len(px) // 4)

    def mean_rgb(idx):
        return [sum(px[i][c] for i in idx) / len(idx) for c in range(3)]

    pal = small.quantize(colors=5, method=Image.Quantize.MEDIANCUT)
    raw = pal.getpalette()[:15]
    counts = sorted(pal.getcolors(), reverse=True)
    dominant = [hexc(raw[i * 3:i * 3 + 3]) for _, i in counts]
    mean = mean_rgb(range(len(px)))
    return {
        "luma": round(sum(lum) / len(lum) / 255, 3),
        "saturation": round(sum(s for _, s, _ in hsv) / len(hsv) / 255, 3),
        "warmth": round((mean[0] - mean[2]) / 255, 3),
        "shadows": hexc(mean_rgb(order[:q])),
        "highlights": hexc(mean_rgb(order[-q:])),
        "dominant": dominant,
    }


def font(size):
    for p in ("/usr/share/fonts/opentype/inter/Inter-Medium.otf",
              "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"):
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def contact_sheets(shots, frames_dir, out, cols=5, rows=6, tw=384):
    made = []
    per = cols * rows
    f = font(15)
    for page in range(math.ceil(len(shots) / per)):
        chunk = shots[page * per:(page + 1) * per]
        thumbs = []
        for s in chunk:
            p = frames_dir / f"shot_{s['n']:04d}.jpg"
            if p.exists():
                im = Image.open(p).convert("RGB")
                im = im.resize((tw, round(im.height * tw / im.width)))
                thumbs.append((s, im))
        if not thumbs:
            continue
        th = max(im.height for _, im in thumbs)
        cell_h = th + 24
        n_rows = math.ceil(len(thumbs) / cols)
        sheet = Image.new("RGB", (cols * tw, n_rows * cell_h), (18, 18, 18))
        d = ImageDraw.Draw(sheet)
        for i, (s, im) in enumerate(thumbs):
            x, y = (i % cols) * tw, (i // cols) * cell_h
            sheet.paste(im, (x, y))
            d.text((x + 6, y + th + 3),
                   f"#{s['n']}  {s['start']:.1f}s  длина {s['len']:.1f}s",
                   fill=(230, 230, 230), font=f)
        dest = out / f"sheet_{page + 1:02d}.jpg"
        sheet.save(dest, quality=88)
        made.append(dest.name)
    return made


def analyse_audio(path, duration, out):
    err = run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-vn",
               "-af", "ebur128=peak=true,silencedetect=noise=-45dB:d=0.6",
               "-f", "null", "-"]).stderr
    curve = [(float(t), float(m)) for t, m in
             re.findall(r"t:\s*([0-9.]+)\s+TARGET.*?M:\s*(-?[0-9.]+)", err)]
    summary = err[err.rfind("Summary:"):] if "Summary:" in err else ""

    def grab(pattern):
        m = re.search(pattern, summary)
        return float(m.group(1)) if m else None

    starts = [float(x) for x in re.findall(r"silence_start: (-?[0-9.]+)", err)]
    ends = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", err)]
    silences = [{"start": round(max(0.0, s), 2), "end": round(e, 2),
                 "len": round(e - max(0.0, s), 2)}
                for s, e in zip(starts, ends)]
    per_sec = {}
    for t, m in curve:
        per_sec.setdefault(int(t), []).append(max(m, -70.0))
    seconds = sorted(per_sec)
    series = [max(per_sec[s]) for s in seconds]
    peaks = sorted(zip(series, seconds), reverse=True)[:5]

    if series:
        w, h, pad = 1400, 320, 40
        img = Image.new("RGB", (w, h), (18, 18, 18))
        d = ImageDraw.Draw(img)
        f = font(14)
        lo, hi = -60.0, 0.0
        for db in (-50, -40, -30, -20, -10):
            y = pad + (hi - db) / (hi - lo) * (h - 2 * pad)
            d.line([(pad, y), (w - 10, y)], fill=(50, 50, 50))
            d.text((4, y - 8), str(db), fill=(150, 150, 150), font=f)
        pts = []
        for s, v in zip(seconds, series):
            x = pad + s / max(duration, 1) * (w - pad - 10)
            y = pad + (hi - max(v, lo)) / (hi - lo) * (h - 2 * pad)
            pts.append((x, y))
        if len(pts) > 1:
            d.line(pts, fill=(120, 200, 255), width=2)
        d.text((pad, 8), "Громкость по времени (LUFS, пиковое значение за секунду)",
               fill=(230, 230, 230), font=f)
        img.save(out / "loudness.png")

    return {
        "integrated_lufs": grab(r"I:\s+(-?[0-9.]+) LUFS"),
        "loudness_range_lu": grab(r"LRA:\s+(-?[0-9.]+) LU"),
        "true_peak_dbfs": grab(r"Peak:\s+(-?[0-9.]+) dBFS"),
        "silences": silences,
        "silence_total": round(sum(s["len"] for s in silences), 2),
        "loudest_seconds": [{"t": s, "lufs": round(v, 1)} for v, s in peaks],
    }


def stats_block(lens):
    if not lens:
        return {}
    buckets = [("до 1 с", 0, 1), ("1–2 с", 1, 2), ("2–4 с", 2, 4),
               ("4–8 с", 4, 8), ("дольше 8 с", 8, 1e9)]
    return {
        "shots": len(lens),
        "avg": round(statistics.mean(lens), 2),
        "median": round(statistics.median(lens), 2),
        "min": round(min(lens), 2),
        "max": round(max(lens), 2),
        "histogram": {name: sum(1 for x in lens if lo <= x < hi)
                      for name, lo, hi in buckets},
    }


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("video")
    ap.add_argument("--out", default="analysis")
    ap.add_argument("--threshold", type=float, default=0.30,
                    help="чувствительность поиска склеек (0.2 — больше склеек, 0.4 — меньше)")
    args = ap.parse_args()

    src = Path(args.video)
    if not src.exists():
        sys.exit(f"Файл не найден: {src}")
    out = Path(args.out)
    frames_dir = out / "frames"
    frames_dir.mkdir(parents=True, exist_ok=True)

    info = probe(src)
    aw, ah = detect_active_picture(src, info)
    shots = build_shots(detect_cuts(src, args.threshold), info["duration"])

    for s in shots:
        dest = frames_dir / f"shot_{s['n']:04d}.jpg"
        if grab_frame(src, s["start"] + s["len"] / 2, dest):
            s["colour"] = frame_colour(Image.open(dest))

    lens = [s["len"] for s in shots]
    third = info["duration"] / 3
    acts = []
    for i, name in enumerate(("начало", "середина", "финал")):
        part = [s["len"] for s in shots if i * third <= s["start"] < (i + 1) * third]
        acts.append({"part": name, "shots": len(part),
                     "avg": round(statistics.mean(part), 2) if part else None})

    col = [s["colour"] for s in shots if "colour" in s]
    weights = [s["len"] for s in shots if "colour" in s]

    def wmean(key):
        tot = sum(weights)
        return round(sum(c[key] * w for c, w in zip(col, weights)) / tot, 3) if tot else None

    palette = []
    thumbs = sorted(frames_dir.glob("shot_*.jpg"))
    if thumbs:
        strip = Image.new("RGB", (64 * len(thumbs), 36))
        for i, p in enumerate(thumbs):
            strip.paste(Image.open(p).convert("RGB").resize((64, 36)), (i * 64, 0))
        q = strip.quantize(colors=8, method=Image.Quantize.MEDIANCUT)
        raw = q.getpalette()[:24]
        total = strip.width * strip.height
        for n, i in sorted(q.getcolors(), reverse=True):
            palette.append({"hex": hexc(raw[i * 3:i * 3 + 3]),
                            "share": round(n / total, 3)})

    audio = analyse_audio(src, info["duration"], out) if info["has_audio"] else None
    sheets = contact_sheets(shots, frames_dir, out)

    report = {
        "file": src.name,
        "video": {**info, "active_width": aw, "active_height": ah,
                  "active_aspect": round(aw / ah, 3)},
        "rhythm": {**stats_block(lens), "by_part": acts},
        "colour": {"luma": wmean("luma"), "saturation": wmean("saturation"),
                   "warmth": wmean("warmth"), "palette": palette},
        "audio": audio,
        "shots": shots,
        "sheets": sheets,
    }
    (out / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=1))

    r, v, c = report["rhythm"], report["video"], report["colour"]
    md = [f"# Разбор: {src.name}", "",
          "## Картинка",
          f"- Длина {v['duration']:.1f} с, {v['width']}×{v['height']}, {v['fps']} к/с",
          f"- Активная картинка {aw}×{ah}, соотношение сторон {v['active_aspect']}:1"
          + (" — есть чёрные поля (каше)" if (aw, ah) != (v['width'], v['height']) else ""),
          "", "## Монтажный ритм",
          f"- Планов: {r.get('shots')}; средняя длина {r.get('avg')} с, "
          f"медиана {r.get('median')} с, от {r.get('min')} до {r.get('max')} с"]
    for name, n in (r.get("histogram") or {}).items():
        md.append(f"- {name}: {n}")
    for a in acts:
        if a["shots"]:
            md.append(f"- {a['part']}: планов {a['shots']}, средняя длина {a['avg']} с")
        else:
            md.append(f"- {a['part']}: новых планов нет (тянется предыдущий)")
    md += ["", "## Цвет",
           f"- Средняя яркость {c['luma']} (0 — чёрный, 1 — белый)",
           f"- Средняя насыщенность {c['saturation']} (0 — ч/б, 1 — максимум)",
           f"- Теплота {c['warmth']} (минус — холодная картинка, плюс — тёплая)",
           "- Палитра: " + ", ".join(f"{p['hex']} {p['share']:.0%}" for p in palette)]
    if audio:
        md += ["", "## Звук",
               f"- Общая громкость {audio['integrated_lufs']} LUFS, "
               f"диапазон {audio['loudness_range_lu']} LU, пик {audio['true_peak_dbfs']} dBFS",
               f"- Тишина: {len(audio['silences'])} пауз, всего {audio['silence_total']} с"]
        for s in audio["silences"][:12]:
            md.append(f"  - {s['start']}–{s['end']} с ({s['len']} с)")
        md.append("- Самые громкие секунды: " + ", ".join(
            f"{p['t']} с ({p['lufs']} LUFS)" for p in audio["loudest_seconds"]))
    md += ["", "## Раскадровка", *[f"- {s}" for s in sheets],
           "", "Смотреть раскадровку глазами: числа говорят о ритме и цвете, "
           "но крупность планов, свет и игру видно только на кадрах."]
    (out / "report.md").write_text("\n".join(md) + "\n")
    print("\n".join(md))


if __name__ == "__main__":
    main()
