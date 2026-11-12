# Блоки промптов для анимационного стиля

Структура JSON (task, continuity_lock, scene, frame_layout_from_viewer, lighting, camera, negative) — та же, что в ai-realism-and-transitions, но блоки `realism` и «слова реализма» оттуда не использовать: они тянут картинку в фото. Вместо них — блоки ниже. Промпты пишутся на английском.

## style_lock — паспорт стиля

Заполняется один раз на проект и вставляется без изменений в каждый промпт картинки. Это главный блок навыка: по нему модель понимает, что все кадры — из одного фильма.

```json
"style_lock": {
  "medium": "stylised 3D animated feature film still, auteur festival short, handcrafted look with the feel of a physical miniature set",
  "characters": "simplified expressive proportions, clear readable silhouettes, large hands, small eyes with strong eyelids, restrained acting; no anime, no flat 2D, no toy-like plastic",
  "materials": "tactile and imperfect: wool with visible fibres, rough plaster, forged iron, worn wood grain, heavy woven fabric, clay-like skin with subtle unevenness",
  "lighting": "physically plausible cinema lighting, low-key, deep shadows; one warm practical light source against cool ambient light",
  "palette": "<night: blue-green darkness with one small orange glow | day: sun-bleached ochre and dry grass with one saturated accent>",
  "lens": "shallow depth of field as on a real camera, slight miniature scale feel, soft film grain",
  "world": "<place and era: e.g. Uzbek mountain village, mud-brick house, wooden veranda, apricot tree>"
}
```

Почему так: `medium` и `materials` задают «дорогую» авторскую анимацию вместо мультсериала; `characters` запрещает самые частые сползания стиля (аниме, плоский рисунок, пластик); `lighting` повторяет главный приём эталона. `world` — своё место действия, не аргентинская степь.

Блок описывает рабочий стандарт до калибровки по видео эталона; после разбора обновить формулировки `medium` и `characters` под увиденное.

## Лист персонажа

Для листов использовать процесс Higgsfield «character-sheet», вариант 3D-стилизации, и добавлять в него `style_lock`. Если собирать вручную:

```json
{
  "task": "character sheet for an animated film",
  "style_lock": { },
  "subject": "<who: age, build, 3 defining traits; costume with materials and colours>",
  "silhouette_rule": "recognisable as a black silhouette: <hat shape / poncho / horns / ears>",
  "layout": "16:9 sheet on neutral grey: front view, three-quarter view, profile, plus four head studies: neutral, annoyed, astonished, tender",
  "lighting": "soft even studio light so colours and materials read clearly",
  "negative": "photoreal human skin, anime, flat cartoon, glossy plastic, text, labels"
}
```

Персонаж-помеха (животное, предмет) получает такой же лист. Его эмоции: neutral stare, chewing, ears turned, looking away — он не «играет лицом».

## Мастер-кадр мира

```json
{
  "task": "master establishing frame of the main location; this frame defines the look of the whole film",
  "style_lock": { },
  "scene": "<location, time of day, weather>",
  "frame_layout_from_viewer": "<what is on the left, right, top, bottom; where the character will stand; horizon line>",
  "lighting": "<the one warm source and where it is> against <the cool ambient source>",
  "camera": "wide static shot, 28mm equivalent, eye level or slightly high angle, deep composition with foreground element",
  "negative": "people, text, modern objects, flat lighting"
}
```

Утверждённый мастер-кадр прикреплять референсом к каждому следующему кадру с фразой: «match the materials, level of stylisation and lighting of the attached master frame».

## Кадр сцены

К структуре стартового кадра добавить:

```json
"style_lock": { },
"continuity_lock": { "character": "exactly as on the attached character sheet: <proportions, costume, colours, marks>" },
"pose_and_emotion": "<one clear pose readable in silhouette; one emotion>",
"light_story": "<warm source> lights <what>; everything else falls into cool shadow",
"negative": "photorealistic, live action, anime, flat 2D, plastic toy look, overlit scene, second warm light source, text"
```

Композиции, которые дают «кадр как картину»: герой маленький в нижней трети под большим небом; герой в дверном проёме, снято из тёмной комнаты; два персонажа на противоположных краях кадра с пустотой между ними; верхний угол комнаты, лампа с одной стороны, окно с другой.

## Видео

```json
{
  "clip": "<name>",
  "duration": "5s",
  "start_state": "exactly the attached first frame",
  "style_lock": "keep the stylised animated look, materials and lighting of the first frame; do not drift toward photorealism",
  "camera_law": "locked-off wide shot, no camera movement",
  "shots": [
    { "tc": "0-1s", "action": "<anticipation: small preparatory move>" },
    { "tc": "1-3.5s", "action": "<the one action>" },
    { "tc": "3.5-5s", "action": "<stops and holds the final pose; only breathing and blinking>" }
  ],
  "living_set": "<2-3 things moving on their own: grass in the wind, lamp flame, rain on the glass>",
  "language_lock": "no speech, mouths closed",
  "negative_prompt": "floaty morphing motion, slow motion, extra limbs, camera shake, style change, photoreal faces"
}
```

Варианты `camera_law`: «very slow push-in over the whole clip» — для нарастания в кругах повтора; «handheld, wind-shaken» — только для сцены бури.

Для невозмутимого животного действие одно и маленькое: «the sheep chews slowly and stares at the man without blinking; one ear twitches».

## Текст в кадре

Надписи не генерировать — модели искажают буквы. Название, кодовое слово и призыв добавлять при монтаже поверх готовой картинки.
