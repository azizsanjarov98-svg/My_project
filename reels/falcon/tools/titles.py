"""Render the end-card title as a transparent PNG (exact text, no AI lettering)."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import sys
W, H = 1080, 1920
font = ImageFont.truetype('/usr/share/fonts/opentype/inter/InterDisplay-ExtraBold.otf', 92)
img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
lines = ['Свой человек', 'в Эмиратах']
y = 330
shadow = Image.new('RGBA', (W, H), (0, 0, 0, 0)); sd = ImageDraw.Draw(shadow)
d = ImageDraw.Draw(img)
for i, s in enumerate(lines):
    w = d.textlength(s, font=font); x = (W - w) / 2; yy = y + i * 112
    sd.text((x, yy + 6), s, font=font, fill=(10, 30, 60, 170))
    d.text((x, yy), s, font=font, fill=(255, 255, 255, 255))
shadow = shadow.filter(ImageFilter.GaussianBlur(14))

out = Image.alpha_composite(shadow, img); out.save(sys.argv[1]); print('ok')
