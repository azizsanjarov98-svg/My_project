# Блоки промптов для реалистичного стиля

Шаблоны карточки героя, стартового кадра, редактирования и видео — в ai-realism-and-transitions. Здесь только блоки, которые этот навык добавляет в те же JSON. Промпты пишутся на английском.

## look_lock — паспорт образа

Заполняется один раз на проект и вставляется без изменений в каждый промпт картинки. Менять можно только `scene_light` — он свой у каждой сцены.

```json
"look_lock": {
  "genre": "docudrama realism, observational, looks like footage shot by a small documentary crew, not a commercial",
  "palette": "muted and cool: steel grey, grey-green, desaturated skin tones; one accent colour per scene: <accent, e.g. sodium-orange emergency light>",
  "scene_light": "<named source: overhead fluorescent tubes with a slight green cast / overcast daylight through a window on the left / single desk lamp>; no light without a visible or implied source",
  "contrast": "soft highlights, slightly lifted blacks, no crushed shadows, no HDR look",
  "texture": "fine film grain, natural skin with pores, worn surfaces, dust, scuffed metal, creased fabric",
  "era_and_place": "<year and place; period-correct devices, signage, uniforms, vehicles>",
  "framing": "<2.39:1 composition inside a 16:9 frame, keep key action away from the top and bottom 12% | 9:16 vertical, subject in the lower two thirds, clean space on top>"
}
```

Почему так: жанр и фактуры стоят первыми, потому что именно они отличают «снято» от «сгенерировано»; акцентный цвет назван явно, иначе модель раскрасит кадр равномерно; `era_and_place` не даёт появиться современному смартфону в сцене из прошлого.

## camera — по крупности

```json
"camera": "ARRI Alexa Mini, 28mm, f/4, eye level, locked-off tripod, deep focus, subject small in frame"
"camera": "ARRI Alexa Mini, 100mm, f/2.2, handheld, focus on the near eye, background reduced to soft shapes"
"camera": "100mm macro, f/4, shallow focus on <detail>, dust visible in the light beam"
"camera": "35mm, shot from behind a doorway, door frame out of focus in the foreground, observational"
```

Для съёмки «с телефона» и экшн-камеры оставить формулировки из ai-realism-and-transitions.

## negative — добавить к обычному списку

```
"negative": "glossy commercial look, teal-and-orange blockbuster grade, HDR, neon, lens flares without a source, perfect symmetrical faces, beauty retouching, oversaturated colours, fantasy lighting, text, captions, watermarks"
```

## Видео: движение камеры и темп

Одно движение на клип, описанное как действие оператора:

```
"camera_law": "real time, no slow motion; handheld with subtle breathing, the operator holds position"
"camera_law": "locked-off tripod, nothing moves except <what moves>"
"camera_law": "very slow push-in over the whole clip, about 5% closer by the end"
"camera_law": "handheld follow from behind at walking pace, the subject stays in the centre"
```

`living_set` обязателен: в реальном кадре всегда что-то живёт само — пыль в луче, мигающая лампа, вода, ткань на ветру, люди на дальнем плане. Перечислять два-три таких движения.

## Титр-факт

Текст в кадре не генерировать — модели искажают буквы. Оставить в стартовом кадре спокойную зону по центру и добавить титр при финише: `finish.py --title "Место — дата"`. Формула: «Город, страна — день месяц год». Одна строка, без точки в конце.

## Атмосферный открывающий план

Первый план мини-фильма — среда без героя, 3–5 секунд, под титр:

```json
{
  "task": "establishing texture shot, no people",
  "scene": "<the element that will matter later: murky water with suspended particles / wind moving sand across an empty road / rain on a control-room window>",
  "look_lock": { },
  "camera": "50mm, static, shallow focus, slow natural drift of particles",
  "negative": "people, text, logos"
}
```

Для Reels этот план не открывает ролик (первые 0,5 секунды нужны движению и хуку), но годится как фон под титр на 2–4-й секунде.
