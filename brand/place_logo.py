"""The ONLY way to put the AzizDubaiGuide emblem into a frame.
Places brand/logo_aziz.png unchanged (only uniform scaling) on a transparent 1080x1920 canvas.
No «@», no recolouring, no shadows, halos, plates or opacity changes — the file already looks like the original.

Usage: python3 brand/place_logo.py out.png --width 330 --x right --y 120
       --x/--y accept pixels, or left/center/right (x) and top/center/bottom (y); margin 40 px from the edges.
"""
import argparse, os
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
p = argparse.ArgumentParser()
p.add_argument('out'); p.add_argument('--width', type=int, required=True)
p.add_argument('--x', default='center'); p.add_argument('--y', default='center')
p.add_argument('--canvas', default='1080x1920')
a = p.parse_args()
CW, CH = map(int, a.canvas.split('x'))
L = Image.open(os.path.join(HERE, 'logo_aziz.png'))
h = round(L.height * a.width / L.width); L = L.resize((a.width, h), Image.LANCZOS)
pos = lambda v, size, full: {'left': 40, 'top': 40, 'center': (full - size) // 2, 'right': full - size - 40, 'bottom': full - size - 40}.get(v, None) if not str(v).lstrip('-').isdigit() else int(v)
C = Image.new('RGBA', (CW, CH), (0, 0, 0, 0)); C.alpha_composite(L, (pos(a.x, a.width, CW), pos(a.y, h, CH)))  # alpha kept exactly as in the original
C.save(a.out); print('logo', a.width, h)
