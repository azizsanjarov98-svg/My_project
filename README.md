# My_project

Навыки Claude для производства видео.

| Навык | Когда использовать | Эталон |
|---|---|---|
| `cinematic-realism` | реалистичное видео, фильм или Reels | «Fukushima», AIST |
| `cinematic-animation` | мультяшное, анимационное видео, фильм или Reels | «Listen to Meh», Purga Studio |

- Исходники: `.claude/skills/<навык>/` — в сессиях Claude Code в этом репозитории навыки подключаются сами.
- Готовые файлы для установки в профиль Claude: `dist/<навык>.skill`.
- В каждом навыке: `SKILL.md` (стандарт стиля и конвейер), `references/` (сведения об эталоне и блоки промптов), `scripts/analyze_reference.py` (бесплатный разбор видео по кадрам) и `scripts/finish.py` (цветокоррекция, зерно, титр, громкость).
