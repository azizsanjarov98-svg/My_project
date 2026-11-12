#!/usr/bin/env python3
"""Финишная обработка смонтированного ролика: единый образ, зерно, титр, громкость.

Запускать на уже собранном монтаже (склейки, голос, звуки и музыка на месте),
до наложения карточек и анимаций — тогда графика остаётся чистой, а вся
картинка под ней получает один «плёночный» слой.

    python3 finish.py cut.mp4 final.mp4 --look realism --format film
    python3 finish.py cut.mp4 final.mp4 --look animation --format reels
    python3 finish.py cut.mp4 final.mp4 --look realism --format film \
        --title "Самарканд, Узбекистан — 14 июня 2026" --title-at 1.0

--format film   16:9, 1920×1080, 24 к/с
--format reels  9:16, 1080×1920, 30 к/с
--scope         чёрные поля 2.39:1 (только film; для realism включены по умолчанию)
--no-scope      без чёрных полей
--strength      сила цветокоррекции от 0 до 1.5 (по умолчанию 1.0)
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

FONT_CANDIDATES = (
    "/usr/share/fonts/opentype/inter/Inter-Medium.otf",
    "/usr/share/fonts/opentype/inter/InterDisplay-Medium.otf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
)

# Каждый образ — набор чисел. strength масштабирует отклонение от нейтрали.
LOOKS = {
    # Докудрама: холодные тени, приглушённый цвет, мягкие света, заметное зерно.
    "realism": dict(contrast=0.04, saturation=-0.18, gamma=-0.03,
                    sh=(-0.03, 0.01, 0.05), mid=(-0.01, 0.0, 0.01), hi=(0.02, 0.0, -0.03),
                    black=0.025, white=0.965, vignette=6.0, grain=9, bloom=0.0,
                    scope_default=True),
    # Тактильная анимация: глубокие сине-зелёные тени, тёплые источники света,
    # плотный цвет, мягкое свечение вокруг ярких точек, тонкое зерно.
    "animation": dict(contrast=0.08, saturation=0.10, gamma=-0.04,
                      sh=(-0.04, 0.0, 0.06), mid=(0.0, 0.0, 0.0), hi=(0.05, 0.01, -0.05),
                      black=0.010, white=0.985, vignette=4.5, grain=4, bloom=0.14,
                      scope_default=False),
}


def esc(text):
    """Экранирование текста для drawtext."""
    return (text.replace("\\", "\\\\").replace(":", "\\:")
                .replace("'", "’").replace("%", "\\%").replace(",", "\\,"))


def build_filters(args, look):
    k = args.strength
    w, h, fps = (1920, 1080, 24) if args.format == "film" else (1080, 1920, 30)

    def tri(name, vals):
        return ":".join(f"{c}{name}={v * k:.3f}" for c, v in zip("rgb", vals))

    black, white = look["black"] * k, 1 - (1 - look["white"]) * k
    chain = [
        f"scale={w}:{h}:force_original_aspect_ratio=increase:flags=lanczos",
        f"crop={w}:{h}",
        f"fps={fps}",
        "format=gbrp",
        f"eq=contrast={1 + look['contrast'] * k:.3f}"
        f":saturation={1 + look['saturation'] * k:.3f}"
        f":gamma={1 + look['gamma'] * k:.3f}",
        "colorbalance=" + ":".join([tri("s", look["sh"]), tri("m", look["mid"]),
                                    tri("h", look["hi"])]),
        f"curves=all='0/{black:.3f} 0.25/{0.25 - 0.02 * k:.3f} "
        f"0.75/{0.75 + 0.01 * k:.3f} 1/{white:.3f}'",
    ]
    graph = "[0:v]" + ",".join(chain) + "[g]"
    last = "g"

    if look["bloom"] > 0 and k > 0:
        # Свечение считаем на уменьшенной копии: так в разы быстрее, а размытию
        # мелкие детали всё равно не нужны.
        graph += (f";[{last}]split[b0][b1];"
                  f"[b1]scale={w // 4}:{h // 4},gblur=sigma=5,"
                  f"scale={w}:{h}:flags=bilinear[b2];"
                  f"[b0][b2]blend=all_mode=screen:all_opacity={look['bloom'] * k:.3f}[bl]")
        last = "bl"

    tail = [f"vignette=PI/{look['vignette']:.1f}",
            f"noise=alls={max(0, round(look['grain'] * k))}:allf=t+u"]

    scope = args.scope if args.scope is not None else look["scope_default"]
    if scope and args.format == "film":
        bar = round((h - w / 2.39) / 2 / 2) * 2
        tail.append(f"drawbox=x=0:y=0:w=iw:h={bar}:color=black:t=fill")
        tail.append(f"drawbox=x=0:y=ih-{bar}:w=iw:h={bar}:color=black:t=fill")

    if args.title:
        font = next((f for f in FONT_CANDIDATES if Path(f).exists()), None)
        t0, t1 = args.title_at, args.title_at + args.title_dur
        fade = 0.6
        alpha = (f"if(lt(t\\,{t0})\\,0\\,if(lt(t\\,{t0 + fade})\\,(t-{t0})/{fade}\\,"
                 f"if(lt(t\\,{t1 - fade})\\,1\\,if(lt(t\\,{t1})\\,({t1}-t)/{fade}\\,0))))")
        size = round(h * 0.036) if args.format == "film" else round(w * 0.044)
        draw = (f"drawtext=text='{esc(args.title)}':fontsize={size}"
                f":fontcolor=0xE6E8E6:alpha='{alpha}'"
                f":shadowcolor=black@0.45:shadowx=0:shadowy=2"
                f":x=(w-text_w)/2:y=(h-text_h)/2")
        if font:
            draw += f":fontfile={font}"
        tail.append(draw)

    tail.append("format=yuv420p")
    graph += f";[{last}]" + ",".join(tail) + "[v]"
    return graph, fps


def has_audio(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a",
                          "-show_entries", "stream=index", "-of", "csv=p=0", str(path)],
                         capture_output=True, text=True).stdout
    return bool(out.strip())


def loudnorm_filter(src, target):
    """Два прохода: сначала измерить, потом выровнять по измеренному.

    Один проход подстраивается на ходу и промахивается на 2–3 LUFS на роликах
    с тишиной и резкими ударами, а в этих стилях тишина — рабочий приём.
    """
    base = f"loudnorm=I={target}:TP=-1.5:LRA=11"
    err = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", src, "-vn",
                          "-af", base + ":print_format=json", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    try:
        m = json.loads(err[err.rindex("{"):err.rindex("}") + 1])
        float(m["input_i"])
    except (ValueError, KeyError):
        return base
    if m["input_i"] == "-inf":
        return base
    return (f"{base}:measured_I={m['input_i']}:measured_TP={m['input_tp']}"
            f":measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}"
            f":offset={m['target_offset']}:linear=true")


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--look", choices=sorted(LOOKS), required=True)
    ap.add_argument("--format", choices=("film", "reels"), required=True)
    ap.add_argument("--scope", dest="scope", action="store_true", default=None)
    ap.add_argument("--no-scope", dest="scope", action="store_false")
    ap.add_argument("--strength", type=float, default=1.0)
    ap.add_argument("--title", help="титр места и даты по центру кадра")
    ap.add_argument("--title-at", type=float, default=1.0)
    ap.add_argument("--title-dur", type=float, default=3.5)
    ap.add_argument("--lufs", type=float, default=-15.0,
                    help="целевая громкость (по умолчанию −15 LUFS)")
    ap.add_argument("--keep-audio", action="store_true",
                    help="не трогать громкость (звук уже сведён)")
    args = ap.parse_args()

    if not Path(args.src).exists():
        sys.exit(f"Файл не найден: {args.src}")
    if not 0 <= args.strength <= 1.5:
        sys.exit("--strength должен быть от 0 до 1.5")

    graph, fps = build_filters(args, LOOKS[args.look])
    cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", args.src,
           "-filter_complex", graph, "-map", "[v]"]
    if has_audio(args.src):
        cmd += ["-map", "0:a:0"]
        if args.keep_audio:
            cmd += ["-c:a", "copy"]
        else:
            cmd += ["-af", loudnorm_filter(args.src, args.lufs),
                    "-c:a", "aac", "-b:a", "256k", "-ar", "48000"]
    cmd += ["-c:v", "libx264", "-preset", "fast", "-crf", "18", "-maxrate", "16M",
            "-bufsize", "32M", "-r", str(fps), "-movflags", "+faststart", args.dst]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        sys.exit("ffmpeg не справился:\n" + res.stderr[-2000:])
    print(f"Готово: {args.dst} ({args.look}, {args.format})")


if __name__ == "__main__":
    main()
