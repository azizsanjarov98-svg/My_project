import sys, os, math, random
sys.path.insert(0, os.path.dirname(__file__))
import bpy, bmesh
from mathutils import Vector, Matrix
import lib
from lib import box, cyl, sphere, arch_outline, prism_xz, poly_xz, boolean, world_uv, join, mesh_obj, shade_smooth

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
lib.TEX = os.path.join(ROOT, 'tex')
OUT = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else os.path.join(ROOT, 'out', 'exterior.glb')
lib.reset()
M = lib.std_materials()
random.seed(3)

GROUPS = {}
def G(name):
    if name not in GROUPS:
        c = lib.coll('G_' + name)
        GROUPS[name] = {'c': c, 'objs': [], 'inst': []}
    return GROUPS[name]
def reg(g, ob, inst=False):
    (G(g)['inst'] if inst else G(g)['objs']).append(ob); return ob

# ------------------------------------------------------------------ windows / blocks
def win_shape(kind, w, h):
    if kind == 'arch':
        return arch_outline(w, h - w * 0.62, h, 10, 'round')
    if kind == 'parch':
        return arch_outline(w, h - w * 0.75, h, 10, 'pointed')
    return [(-w / 2, 0), (-w / 2, h), (w / 2, h), (w / 2, 0)]

def face_map(face, b, s, x, d, z):
    x0, y0, x1, y1 = b
    if face == 'S': return (s + x, y0 + d, z)
    if face == 'N': return (s - x, y1 - d, z)
    if face == 'W': return (x0 + d, s - x, z)
    return (x1 - d, s + x, z)

def add_cut(bm, face, b, s, z, outline, depth):
    a = [bm.verts.new(face_map(face, b, s, x, -0.3, z + zz)) for x, zz in outline]
    c = [bm.verts.new(face_map(face, b, s, x, depth, z + zz)) for x, zz in outline]
    bm.faces.new(a); bm.faces.new(c[::-1])
    n = len(outline)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((a[i], c[i], c[j], a[j]))

def add_pane(bm, face, b, s, z, outline, depth):
    vs = [bm.verts.new(face_map(face, b, s, x, depth - 0.02, z + zz)) for x, zz in outline]
    f = bm.faces.new(vs)
    return f

def block(g, name, x0, y0, x1, y1, z0, z1, wins=(), material='stone', depth=0.55, frames=True):
    """A building volume with real recessed openings. wins: list of (face, s, z, kind, w, h)."""
    ob = box(name, x0, y0, z0, x1, y1, z1, M[material], G(g)['c'])
    b = (x0, y0, x1, y1)
    if wins:
        cb = bmesh.new()
        for (face, s, z, kind, w, h) in wins:
            add_cut(cb, face, b, s, z, win_shape(kind, w, h), depth)
        bmesh.ops.recalc_face_normals(cb, faces=cb.faces)
        boolean(ob, cb)
        gb = bmesh.new(); fb = bmesh.new()
        for (face, s, z, kind, w, h) in wins:
            add_pane(gb, face, b, s, z, win_shape(kind, w * 0.999, h * 0.999), depth)
            if frames and kind != 'niche':
                # thin projecting surround (architrave)
                ol = win_shape(kind, w + 0.7, h + 0.45)
                vs = [fb.verts.new(face_map(face, b, s, x, -0.12, z - 0.2 + zz)) for x, zz in ol]
                vi = [fb.verts.new(face_map(face, b, s, x, -0.12, z + zz)) for x, zz in win_shape(kind, w, h)]
        bmesh.ops.recalc_face_normals(gb, faces=gb.faces)
        reg(g, mesh_obj(name + '_glass', gb, M['glass'], G(g)['c']))
        fb.free()
    world_uv(ob, 4.0)
    reg(g, ob)
    return ob

def cornice(g, name, x0, y0, x1, y1, z, big=1.0):
    o = []
    o.append(box(name + '_c1', x0 - .25 * big, y0 - .25 * big, z - .7 * big, x1 + .25 * big, y1 + .25 * big, z - .2 * big, M['trim'], G(g)['c']))
    o.append(box(name + '_c2', x0 - .6 * big, y0 - .6 * big, z - .2 * big, x1 + .6 * big, y1 + .6 * big, z + .35 * big, M['trim'], G(g)['c']))
    o.append(box(name + '_c3', x0 - .2, y0 - .2, z + .35 * big, x1 + .2, y1 + .2, z + .9 * big, M['stone'], G(g)['c']))
    for ob in o: world_uv(ob, 4); reg(g, ob)

def band(g, name, x0, y0, x1, y1, z, h=.35, out=.15):
    ob = box(name, x0 - out, y0 - out, z, x1 + out, y1 + out, z + h, M['trim'], G(g)['c']); world_uv(ob, 4); reg(g, ob)

def row(face, s0, s1, z, kind, w, h, n=None, spacing=None):
    if n is None:
        n = max(1, int((s1 - s0) / spacing))
    step = (s1 - s0) / n
    return [(face, s0 + step * (i + .5), z, kind, w, h) for i in range(n)]

def facade_rows(face, s0, s1, floors, spacing, pattern):
    """floors: list of z; pattern: list of (kind,w,h) per floor"""
    out = []
    for z, (kind, w, h) in zip(floors, pattern):
        out += row(face, s0, s1, z, kind, w, h, spacing=spacing)
    return out

# ------------------------------------------------------------------ arcades
def arcade_front(g, name, x0, x1, yface, depth, height, bay, face='S', thick=1.4, arch_w=None, kind='pointed'):
    """Loggia: a slab pierced by pointed arches + roof + back floor, for a run along X (face S or N)."""
    n = max(1, round((x1 - x0) / bay)); bw = (x1 - x0) / n
    aw = arch_w or bw * 0.72
    ha = height * 0.78; hs = ha - aw * 0.75
    if face == 'S':
        slab = box(name, x0, yface, 0, x1, yface + thick, height, M['stone'], G(g)['c'])
    else:
        slab = box(name, x0, yface - thick, 0, x1, yface, height, M['stone'], G(g)['c'])
    cb = bmesh.new()
    for i in range(n):
        cx = x0 + bw * (i + .5)
        prism_xz(cb, arch_outline(aw, hs, ha, 12, kind), yface - 3, yface + 3, ox=cx, oz=0)
    bmesh.ops.recalc_face_normals(cb, faces=cb.faces)
    boolean(slab, cb); world_uv(slab, 4); reg(g, slab)
    # arch moulding (thin frame) and colonnettes
    fb = bmesh.new()
    ysig = -1 if face == 'S' else 1
    for i in range(n):
        cx = x0 + bw * (i + .5)
        for sx in (-1, 1):
            bmesh.ops.create_cone(fb, cap_ends=True, segments=10, radius1=.28, radius2=.28, depth=hs,
                                  matrix=Matrix.Translation((cx + sx * (aw / 2 - .1), yface + ysig * .2 + (0 if face == 'S' else 0), hs / 2)))
    reg(g, mesh_obj(name + '_cols', fb, M['trim'], G(g)['c']))
    # roof slab + floor + back wall darkness
    if face == 'S':
        r = box(name + '_roof', x0, yface, height - .6, x1, yface + depth, height, M['stone'], G(g)['c'])
        cornice(g, name + '_cor', x0, yface, x1, yface + depth, height + .1, .8)
        bk = box(name + '_back', x0, yface + depth - .5, 0, x1, yface + depth, height - .5, M['stone'], G(g)['c'])
        bk_y = yface + depth - .52
    else:
        r = box(name + '_roof', x0, yface - depth, height - .6, x1, yface, height, M['stone'], G(g)['c'])
        cornice(g, name + '_cor', x0, yface - depth, x1, yface, height + .1, .8)
        bk = box(name + '_back', x0, yface - depth, 0, x1, yface - depth + .5, height - .5, M['stone'], G(g)['c'])
        bk_y = yface - depth + .52
    world_uv(r, 4); world_uv(bk, 4); reg(g, r); reg(g, bk)
    # doors/windows on back wall (dark glass)
    gb = bmesh.new()
    for i in range(n):
        cx = x0 + bw * (i + .5)
        ol = arch_outline(aw * .55, hs * .75, hs * .75 + aw * .4, 8, 'pointed')
        vs = [gb.verts.new((cx + x, bk_y, z)) for x, z in ol]
        gb.faces.new(vs if face == 'S' else vs[::-1])
    reg(g, mesh_obj(name + '_doors', gb, M['glass'], G(g)['c']))

def arcade_side(g, name, y0, y1, xface, depth, height, bay, face='E'):
    """Arcade running along Y, arches facing +X (face 'E') or -X ('W'). Built along X then rotated."""
    L = y1 - y0
    tmpc = G(g)['c']
    before = set(bpy.data.objects)
    arcade_front(g, name, -L / 2, L / 2, 0, depth, height, bay, 'S')
    new = [o for o in bpy.data.objects if o not in before]
    ang = 90 if face == 'E' else -90
    for o in new:
        R = Matrix.Rotation(math.radians(ang), 4, 'Z')
        o.data.transform(R)
        o.data.transform(Matrix.Translation((xface, (y0 + y1) / 2, 0)))
        if o.data.uv_layers and o.data.materials and o.data.materials[0] in (M['stone'], M['trim']):
            world_uv(o, 4)

# ------------------------------------------------------------------ domes
def dome(g, name, x, y, zb, R, rise, band_h=None, finial_h=None, segs=64, bulge=.07, gold_band=True):
    bm = bmesh.new()
    NV = 28; rings = []
    uvl = bm.loops.layers.uv.new('UVMap')
    for i in range(NV + 1):
        t = i / NV; a = t * math.pi / 2
        r = R * (1 + bulge * math.sin(math.pi * min(t * 1.35, 1))) * (math.cos(a) ** .82)
        if i == NV: r = 0.001
        z = zb + rise * (math.sin(a) ** 1.05)
        ring = [bm.verts.new((x + r * math.cos(j / segs * 2 * math.pi), y + r * math.sin(j / segs * 2 * math.pi), z)) for j in range(segs)]
        rings.append((ring, t))
    for i in range(NV):
        ra, ta = rings[i]; rb, tb = rings[i + 1]
        for j in range(segs):
            k = (j + 1) % segs
            f = bm.faces.new((ra[j], ra[k], rb[k], rb[j]))
            u0, u1 = j / segs, (j + 1) / segs
            for l, uv in zip(f.loops, ((u0, ta), (u1, ta), (u1, tb), (u0, tb))):
                l[uvl].uv = uv
    ob = mesh_obj(name, bm, M['dome'], G(g)['c']); shade_smooth(ob); reg(g, ob)
    bh = band_h or max(.4, R * .07)
    if gold_band:
        gb = cyl(name + '_band', x, y, zb - bh, zb + .05, R * 1.005, M['gold'], G(g)['c'], seg=segs); shade_smooth(gb); reg(g, gb)
    fh = finial_h or max(2.5, R * .45)
    finial(g, name + '_fin', x, y, zb + rise - .1, fh)
    return ob

def finial(g, name, x, y, z, h):
    parts = []
    s = h / 6
    parts.append(cyl(name + 'a', x, y, z, z + s * .6, s * .45, M['gold'], G(g)['c'], 16))
    parts.append(sphere(name + 'b', x, y, z + s * 1.1, s * .55, M['gold'], G(g)['c'], 16, 10))
    parts.append(sphere(name + 'c', x, y, z + s * 2.0, s * .38, M['gold'], G(g)['c'], 16, 10))
    parts.append(sphere(name + 'd', x, y, z + s * 2.75, s * .28, M['gold'], G(g)['c'], 16, 10))
    parts.append(cyl(name + 'e', x, y, z + s * 3.0, z + h, s * .12, M['gold'], G(g)['c'], 12, r2=.01))
    for p in parts: shade_smooth(p)
    reg(g, join(parts, name))

def drum(g, name, x, y, z0, z1, r, nwin=16, segs=64):
    ob = cyl(name, x, y, z0, z1, r, M['stone'], G(g)['c'], segs)
    if nwin:
        cb = bmesh.new()
        h = (z1 - z0) * .62; w = min(2 * math.pi * r / nwin * .45, h * .5)
        for i in range(nwin):
            a = i / nwin * 2 * math.pi
            ol = arch_outline(w, h - w * .62, h, 8, 'round')
            vs1 = []; vs2 = []
            for (px, pz) in ol:
                d = Vector((math.cos(a), math.sin(a), 0)); tng = Vector((-math.sin(a), math.cos(a), 0))
                p1 = Vector((x, y, z0 + (z1 - z0) * .18 + pz)) + d * (r + .3) + tng * px
                p2 = Vector((x, y, z0 + (z1 - z0) * .18 + pz)) + d * (r - .6) + tng * px
                vs1.append(cb.verts.new(p1)); vs2.append(cb.verts.new(p2))
            cb.faces.new(vs1); cb.faces.new(vs2[::-1])
            n = len(ol)
            for k in range(n):
                m = (k + 1) % n
                cb.faces.new((vs1[k], vs2[k], vs2[m], vs1[m]))
        bmesh.ops.recalc_face_normals(cb, faces=cb.faces)
        boolean(ob, cb)
        gb = bmesh.new()
        for i in range(nwin):
            a = i / nwin * 2 * math.pi
            ol = arch_outline(w, h - w * .62, h, 8, 'round')
            d = Vector((math.cos(a), math.sin(a), 0)); tng = Vector((-math.sin(a), math.cos(a), 0))
            vs = [gb.verts.new(Vector((x, y, z0 + (z1 - z0) * .18 + pz)) + d * (r - .5) + tng * px) for px, pz in ol]
            gb.faces.new(vs[::-1])
        reg(g, mesh_obj(name + '_glass', gb, M['glass'], G(g)['c']))
    world_uv(ob, 4); reg(g, ob)
    band(g, name + '_top', x - r, y - r, x + r, y + r, z1 - .1, .01, 0) if False else None
    return ob

# ------------------------------------------------------------------ pavilions & kiosks
def arch_frame_panel(g, name, cx, y, w, ha, hs, W, H, face_sign=-1, z0=None):
    """Carved lattice panel (spandrel) around an arch on a plane y, facing -Y if face_sign<0."""
    z0 = hs * .8 if z0 is None else z0
    pnl = box(name, cx - W / 2, y - .12 if face_sign < 0 else y, z0, cx + W / 2, y if face_sign < 0 else y + .12, H, M['lattice'], G(g)['c'])
    cb = bmesh.new(); prism_xz(cb, arch_outline(w, hs, ha, 14, 'pointed'), y - 1, y + 1, ox=cx); bmesh.ops.recalc_face_normals(cb, faces=cb.faces)
    boolean(pnl, cb); world_uv(pnl, 2.2); reg(g, pnl)
    # arch moulding
    mb = bmesh.new()
    ol_o = arch_outline(w + .9, hs, ha + .55, 14, 'pointed'); ol_i = arch_outline(w, hs, ha, 14, 'pointed')
    prism_xz(mb, ol_o, y - (.3 if face_sign < 0 else -.1), y + (.1 if face_sign < 0 else .3), ox=cx)
    bmesh.ops.recalc_face_normals(mb, faces=mb.faces)
    mo = mesh_obj(name + '_mould', mb, M['trim'], G(g)['c'])
    cb = bmesh.new(); prism_xz(cb, ol_i, y - 1, y + 1, ox=cx); bmesh.ops.recalc_face_normals(cb, faces=cb.faces)
    boolean(mo, cb); reg(g, mo)

def gate_pavilion(g, name, cx, cy, W, H, R, rot=0):
    before = set(bpy.data.objects)
    t = 2.2
    shell = box(name, -W / 2, -W / 2, 0, W / 2, W / 2, H, M['stone'], G(g)['c'])
    aw = W * .52; ha = H * .74; hs = ha - aw * .78
    cb = bmesh.new()
    bmesh.ops.create_cube(cb, size=1.0, matrix=Matrix.Translation((0, 0, (H - 1.2) / 2)) @ Matrix.Diagonal((W - 2 * t, W - 2 * t, H - 1.2, 1)))
    prism_xz(cb, arch_outline(aw, hs, ha, 14, 'pointed'), -W, W)
    ol = arch_outline(aw, hs, ha, 14, 'pointed')
    a = [cb.verts.new((-W, x, z)) for x, z in ol]; b = [cb.verts.new((W, x, z)) for x, z in ol]
    cb.faces.new(a); cb.faces.new(b[::-1])
    for i in range(len(ol)):
        j = (i + 1) % len(ol); cb.faces.new((a[i], b[i], b[j], a[j]))
    # small square niches above the arch
    for k in (-1, 0, 1):
        for sgn in (-1, 1):
            prism_xz(cb, [(-.9, 0), (-.9, 1.8), (.9, 1.8), (.9, 0)], sgn * W / 2 - .35, sgn * W / 2 + .35, ox=k * W * .24, oz=H * .82)
    bmesh.ops.recalc_face_normals(cb, faces=cb.faces)
    boolean(shell, cb); world_uv(shell, 4); reg(g, shell)
    for (sx, sy, ang) in ((0, -1, 0), (0, 1, 180), (-1, 0, -90), (1, 0, 90)):
        b4 = set(bpy.data.objects)
        arch_frame_panel(g, name + '_sp%d' % ang, 0, -W / 2, aw, ha, hs, W * .8, H * .8)
        for o in set(bpy.data.objects) - b4:
            o.data.transform(Matrix.Rotation(math.radians(ang), 4, 'Z'))
    cornice(g, name + '_cor', -W / 2, -W / 2, W / 2, W / 2, H + .1, 1.2)
    att = box(name + '_attic', -W * .36, -W * .36, H + 1, W * .36, W * .36, H + 3.2, M['stone'], G(g)['c']); world_uv(att, 4); reg(g, att)
    dome(g, name + '_dome', 0, 0, H + 3.4, R, R * .82)
    for o in set(bpy.data.objects) - before:
        if o.type == 'MESH':
            o.data.transform(Matrix.Translation((cx, cy, 0)) @ Matrix.Rotation(math.radians(rot), 4, 'Z'))
            if o.data.materials and o.data.materials[0] == M['stone']:
                world_uv(o, 4)
            elif o.data.materials and o.data.materials[0] == M['lattice']:
                world_uv(o, 2.2)

def kiosk_proto(name, c):
    """Small open domed kiosk (chhatri). Returns single joined object at origin."""
    before = set(bpy.data.objects)
    W, H = 5.0, 6.5
    sh = box(name, -W / 2, -W / 2, 0, W / 2, W / 2, H, M['stone'], c)
    cb = bmesh.new()
    bmesh.ops.create_cube(cb, size=1.0, matrix=Matrix.Translation((0, 0, (H - .8) / 2)) @ Matrix.Diagonal((W - 1.4, W - 1.4, H - .8, 1)))
    ol = arch_outline(W - 1.6, 3.2, 5.0, 10, 'pointed')
    prism_xz(cb, ol, -W, W)
    a = [cb.verts.new((-W, x, z)) for x, z in ol]; b = [cb.verts.new((W, x, z)) for x, z in ol]
    cb.faces.new(a); cb.faces.new(b[::-1])
    for i in range(len(ol)):
        j = (i + 1) % len(ol); cb.faces.new((a[i], b[i], b[j], a[j]))
    bmesh.ops.recalc_face_normals(cb, faces=cb.faces)
    boolean(sh, cb)
    parts = [sh,
             box(name + 'c', -W / 2 - .35, -W / 2 - .35, H, W / 2 + .35, W / 2 + .35, H + .45, M['trim'], c),
             box(name + 'p', -W / 2 - .2, -W / 2 - .2, -.3, W / 2 + .2, W / 2 + .2, 0.02, M['trim'], c)]
    for p in parts: world_uv(p, 4)
    g = '_tmp'
    GROUPS.setdefault(g, {'c': c, 'objs': [], 'inst': []})
    dome(g, name + 'd', 0, 0, H + .45, 2.1, 1.9, finial_h=1.4)
    new = [o for o in bpy.data.objects if o not in before]
    GROUPS[g]['objs'].clear()
    # join by material into separate objects then parent under one empty-like root
    return new

def lamp_proto(c):
    parts = []
    parts.append(cyl('lp_base', 0, 0, 0, .8, .42, M['bronze'], c, 16, r2=.3))
    parts.append(cyl('lp_pole', 0, 0, .8, 10.5, .16, M['bronze'], c, 12, r2=.11))
    glow = []
    for k in range(6):
        a = k / 6 * 2 * math.pi; ex, ey = math.cos(a) * 1.25, math.sin(a) * 1.25
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=True, segments=6, radius1=.06, radius2=.06, depth=1.5,
                              matrix=Matrix.Translation((ex / 2, ey / 2, 9.4)) @ Matrix.Rotation(math.atan2(1.25, .5), 4, Vector((-ey, ex, 0)).normalized()))
        parts.append(mesh_obj('lp_arm%d' % k, bm, M['bronze'], c))
        parts.append(cyl('lp_cup%d' % k, ex, ey, 9.75, 10.1, .12, M['bronze'], c, 8, r2=.3))
        glow.append(cyl('lp_tulip%d' % k, ex, ey, 10.1, 10.75, .3, M['lamp'], c, 10, r2=.18))
    glow.append(sphere('lp_top', 0, 0, 11.0, .36, M['lamp'], c, 12, 8))
    parts.append(cyl('lp_crown', 0, 0, 10.5, 10.75, .2, M['bronze'], c, 8, r2=.05))
    for p in parts + glow: shade_smooth(p)
    return join(parts, 'lamp_metal'), join(glow, 'lamp_glass')

def palm_proto(c, h, seed):
    rnd = random.Random(seed)
    lean = Vector((rnd.uniform(-.06, .06), rnd.uniform(-.06, .06), 1)).normalized()
    bm = bmesh.new(); seg = 8; rings = 12
    prev = None
    for i in range(rings + 1):
        t = i / rings; z = h * t; r = .42 - .14 * t + (.06 if i % 2 else 0)
        ctr = lean * z
        ring = [bm.verts.new((ctr.x + r * math.cos(j / seg * 2 * math.pi), ctr.y + r * math.sin(j / seg * 2 * math.pi), ctr.z)) for j in range(seg)]
        if prev:
            for j in range(seg):
                k = (j + 1) % seg; bm.faces.new((prev[j], prev[k], ring[k], ring[j]))
        prev = ring
    trunk = mesh_obj('palm_trunk_%d' % seed, bm, M['trunk'], c); shade_smooth(trunk)
    top = lean * h
    fb = bmesh.new(); uvl = fb.loops.layers.uv.new('UVMap')
    nf = 16
    for k in range(nf):
        a = k / nf * 2 * math.pi + rnd.uniform(-.15, .15)
        tilt = rnd.uniform(-.25, .55) if k % 2 else rnd.uniform(.2, .7)
        L = rnd.uniform(4.2, 5.6); wdt = 1.15
        d = Vector((math.cos(a), math.sin(a), 0)); side = Vector((-math.sin(a), math.cos(a), 0))
        N = 8; prevL = prevR = None
        for i in range(N + 1):
            t = i / N; s = t * L
            p = top + d * s * math.cos(tilt * (1 - t)) + Vector((0, 0, s * math.sin(tilt) - .55 * s * s / L * 1.6 * t))
            twist = side * (wdt / 2)
            vl = fb.verts.new(p - twist + Vector((0, 0, .08 * t))); vr = fb.verts.new(p + twist + Vector((0, 0, .08 * t)))
            if prevL:
                f = fb.faces.new((prevL, prevR, vr, vl))
                t0 = (i - 1) / N
                for l, uv in zip(f.loops, ((t0, 1), (t0, 0), (t, 0), (t, 1))):
                    l[uvl].uv = uv
            prevL, prevR = vl, vr
    fr = mesh_obj('palm_fronds_%d' % seed, fb, M['frond'], c); shade_smooth(fr)
    return trunk, fr

def star_outline(R, r, n=8, rot=math.pi / 8):
    return [(math.cos(rot + i * math.pi / n) * (R if i % 2 == 0 else r), math.sin(rot + i * math.pi / n) * (R if i % 2 == 0 else r)) for i in range(2 * n)]

def star_pool(g, name, cx, cy, R, rim_mat, z=0, h=0.9):
    ol = star_outline(R, R * .78)
    bm = bmesh.new()
    a = [bm.verts.new((cx + x, cy + y, z)) for x, y in ol]; b = [bm.verts.new((cx + x, cy + y, z + h)) for x, y in ol]
    bm.faces.new(a[::-1]); bm.faces.new(b)
    for i in range(len(ol)):
        j = (i + 1) % len(ol); bm.faces.new((a[i], a[j], b[j], b[i]))
    rim = mesh_obj(name, bm, rim_mat, G(g)['c'])
    cb = bmesh.new()
    ol2 = star_outline(R * .86, R * .67)
    a = [cb.verts.new((cx + x, cy + y, z + .35)) for x, y in ol2]; b = [cb.verts.new((cx + x, cy + y, z + h + 1)) for x, y in ol2]
    cb.faces.new(a[::-1]); cb.faces.new(b)
    for i in range(len(ol2)):
        j = (i + 1) % len(ol2); cb.faces.new((a[i], a[j], b[j], b[i]))
    boolean(rim, cb); world_uv(rim, 3); reg(g, rim)
    wb = bmesh.new(); vs = [wb.verts.new((cx + x, cy + y, z + h - .18)) for x, y in ol2]; wb.faces.new(vs)
    reg(g, mesh_obj(name + '_water', wb, M['water'], G(g)['c']))
    reg(g, cyl(name + '_jet', cx, cy, z + .3, z + h + .5, .5, M['marble'], G(g)['c'], 16, r2=.3))

def plane(g, name, x0, y0, x1, y1, z, material, uvscale):
    bm = bmesh.new()
    vs = [bm.verts.new(p) for p in ((x0, y0, z), (x1, y0, z), (x1, y1, z), (x0, y1, z))]
    bm.faces.new(vs)
    ob = mesh_obj(name, bm, material, G(g)['c'])
    if uvscale: world_uv(ob, uvscale)
    reg(g, ob); return ob

# ================================================================== MAIN PALACE
# Tiered facade, symmetric about x=0, front plane y=0 facing -Y.
FL = [13.6, 18.4, 23.2, 28.0, 32.6]           # upper floor sill heights

def mirror_x(fn):
    for s in (-1, 1):
        fn(s)

# --- central entrance: pishtaq with great iwan
g = 'facade'
PW, PH = 28, 27
pis = box('pishtaq', -PW / 2, -2, 0, PW / 2, 14, PH, M['stone'], G(g)['c'])
cb = bmesh.new()
prism_xz(cb, arch_outline(19, 12.5, 23.5, 16, 'pointed'), -4, 10.5)
for k in (-1, 0, 1):
    prism_xz(cb, [(-1.1, 0), (-1.1, 2.2), (1.1, 2.2), (1.1, 0)], -2.6, -1.4, ox=k * 4.2, oz=24.2)
bmesh.ops.recalc_face_normals(cb, faces=cb.faces)
boolean(pis, cb); world_uv(pis, 4); reg(g, pis)
arch_frame_panel(g, 'pishtaq_spandrel', 0, -2, 19, 23.5, 12.5, 25, 25.5)
reg(g, poly_xz('iwan_back', arch_outline(19, 12.5, 23.5, 16, 'pointed'), 10.45, M['dark'], G(g)['c']))
cornice(g, 'pishtaq_cor', -PW / 2, -2, PW / 2, 14, PH + .1, 1.1)
# small domed kiosk inside the iwan (as in photos)
kp = kiosk_proto('iwan_kiosk', G(g)['c'])
for o in kp:
    o.data.transform(Matrix.Translation((0, 6.5, 0)) @ Matrix.Diagonal((1.05, 1.05, 1.15, 1)))
    reg(g, o)
reg(g, poly_xz('iwan_door', arch_outline(4.5, 5, 8, 10, 'pointed'), 10.35, M['wood'], G(g)['c']))
# flanking pylons
def pylon(s):
    x0, x1 = (PW / 2, PW / 2 + 7) if s > 0 else (-PW / 2 - 7, -PW / 2)
    w = []
    for z in (4.0, 11.5, 18.5, 24.5):
        w.append(('S', (x0 + x1) / 2, z, 'parch' if z < 20 else 'rect', 2.0, 4.2 if z < 20 else 2.0))
    block('facade', 'pylon%d' % s, x0, -3, x1, 16, 0, 30.5, w)
    cornice('facade', 'pylon_cor%d' % s, x0, -3, x1, 16, 30.6, .9)
mirror_x(pylon)
# central tower carrying the front dome
block('facade', 'center_tower', -20, 14, 20, 46, 0, 34, row('S', -18, 18, 30.2, 'rect', 1.6, 2.0, n=6))
cornice('facade', 'center_tower_cor', -20, 14, 20, 46, 34.1, 1.1)
oct_base = cyl('front_dome_base', 0, 30, 34.9, 37.4, 15.2, M['stone'], G('facade')['c'], 8); world_uv(oct_base, 4); reg('facade', oct_base)
dome('facade', 'front_dome', 0, 30, 37.6, 13.6, 11.5, finial_h=7.5)

# --- Great Hall block + main dome (37 m interior → ~40 m exterior)
g = 'great'
block(g, 'great_block', -27, 46, 27, 104, 0, 40.5,
      row('S', -24, 24, 36.2, 'rect', 1.6, 2.2, n=8) + row('W', 50, 100, 30, 'parch', 2.2, 5, n=7) + row('E', 50, 100, 30, 'parch', 2.2, 5, n=7)
      + row('W', 50, 100, 18, 'parch', 2.2, 5, n=7) + row('E', 50, 100, 18, 'parch', 2.2, 5, n=7))
cornice(g, 'great_cor', -27, 46, 27, 104, 40.6, 1.3)
drum(g, 'great_drum', 0, 75, 41.4, 46.4, 21.2, nwin=24)
dome(g, 'great_dome', 0, 75, 46.6, 20.3, 17.5, finial_h=11)
for (x, y) in ((-21, 52), (21, 52), (-21, 98), (21, 98)):
    block(g, 'great_corner_%d_%d' % (x, y), x - 4, y - 4, x + 4, y + 4, 40.5, 44.5)
    dome(g, 'great_cd_%d_%d' % (x, y), x, y, 44.8, 3.6, 3.2, finial_h=2.2)

# --- tiered wings (mirrored)
g = 'facade'
def wing(s):
    def X(a, b):
        return (min(s * a, s * b), max(s * a, s * b))
    # Tier A: inner tall block with dome
    x0, x1 = X(21.5, 52)
    w = []
    for z, kind, h in ((13.6, 'arch', 3.6), (18.8, 'rect', 2.6), (23.4, 'arch', 3.4), (28.6, 'rect', 2.2)):
        w += row('S', x0 + 2, x1 - 2, z, kind, 1.8, h, spacing=4.6)
    block(g, 'tierA%d' % s, x0, 4, x1, 78, 0, 35, w)
    cornice(g, 'tierA_cor%d' % s, x0, 4, x1, 78, 35.1, 1.1)
    block(g, 'tierA_cap%d' % s, s * 36.75 - 7.5, 10, s * 36.75 + 7.5, 25, 35.9, 39.4, row('S', s * 36.75 - 6, s * 36.75 + 6, 36.6, 'rect', 1.2, 1.6, n=3))
    cornice(g, 'tierA_capc%d' % s, s * 36.75 - 7.5, 10, s * 36.75 + 7.5, 25, 39.5, .8)
    dome(g, 'tierA_dome%d' % s, s * 36.75, 17.5, 40.3, 6.6, 5.6)
    # Tier B: middle block
    x0, x1 = X(52, 92)
    w = []
    for z, kind, h in ((13.6, 'rect', 2.6), (18.4, 'arch', 3.4), (23.6, 'rect', 2.4)):
        w += row('S', x0 + 2, x1 - 2, z, kind, 1.8, h, spacing=4.4)
    block(g, 'tierB%d' % s, x0, 8, x1, 78, 0, 29, w)
    cornice(g, 'tierB_cor%d' % s, x0, 8, x1, 78, 29.1, 1.0)
    # Tier C: projecting corner pavilion with small dome
    x0, x1 = X(92, 112)
    w = []
    for z, kind, h in ((13.6, 'parch', 4.4), (20.2, 'rect', 2.4), (25.4, 'arch', 3.0)):
        w += row('S', x0 + 2, x1 - 2, z, kind, 2.0, h, n=3)
    block(g, 'tierC%d' % s, x0, -6, x1, 78, 0, 32, w)
    cornice(g, 'tierC_cor%d' % s, x0, -6, x1, 78, 32.1, 1.1)
    block(g, 'tierC_cap%d' % s, s * 102 - 6, -3, s * 102 + 6, 9, 32.9, 35.6)
    dome(g, 'tierC_dome%d' % s, s * 102, 3, 36.2, 5.4, 4.7)
    # Tier D: outer lower wing
    x0, x1 = X(112, 152)
    w = []
    for z, kind, h in ((13.6, 'arch', 3.4), (18.6, 'rect', 2.4)):
        w += row('S', x0 + 2, x1 - 2, z, kind, 1.8, h, spacing=4.6)
    w += row('E' if s > 0 else 'W', 10, 74, 13.6, 'arch', 1.8, 3.4, spacing=5) + row('E' if s > 0 else 'W', 10, 74, 4, 'parch', 2.4, 5, spacing=5)
    block(g, 'tierD%d' % s, x0, 6, x1, 78, 0, 23.5, w)
    cornice(g, 'tierD_cor%d' % s, x0, 6, x1, 78, 23.6, 1.0)
    # ground-floor loggias in front of tiers (arcade with pointed arches)
    arcade_front(g, 'loggiaA%d' % s, *X(21.5, 52), -4, 8.5, 12.2, 5.2)
    arcade_front(g, 'loggiaB%d' % s, *X(52, 92), -4, 12.5, 12.2, 5.2)
    arcade_front(g, 'loggiaD%d' % s, *X(112, 152), -4, 10.5, 12.2, 5.2)
    # terrace balustrade bands on loggia roofs
    for (a, b, d) in ((21.5, 52, 8.5), (52, 92, 12.5), (112, 152, 10.5)):
        xa, xb = X(a, b); band(g, 'balu%d_%d' % (s, a), xa, -4, xb, -3.6, 12.9, .9, 0)
    # lanterns pavilions at loggia joints (small kiosks on corners, as in photo)
    kp = kiosk_proto('wing_kiosk%d' % s, G(g)['c'])
    for o in kp:
        o.data.transform(Matrix.Translation((s * 52, -6.5, 0)) @ Matrix.Diagonal((.8, .8, .85, 1)))
        reg(g, o)
mirror_x(wing)
# rear service ranges to close the courtyard behind (lower)
block('facade', 'rear_range', -152, 78, 152, 96, 0, 20, row('N', -148, 148, 6, 'parch', 2.2, 5, spacing=6) + row('N', -148, 148, 13, 'arch', 1.8, 3.4, spacing=6))
cornice('facade', 'rear_cor', -152, 78, 152, 96, 20.1, .9)

# ================================================================== HALL BUILDINGS (behind/along wings)
def hall_block(gname, x0, y0, x1, y1, h, nwin=True):
    w = []
    if nwin:
        w += row('N', x0 + 2, x1 - 2, 6, 'parch', 2.2, 6, spacing=6)
    block(gname, gname + '_blk', x0, y0, x1, y1, 0, h, w)
    cornice(gname, gname + '_cor', x0, y0, x1, y1, h + .1, 1.0)
# Spirit of Collaboration: round hall with its own dome
g = 'spirit'
rc = cyl('spirit_rot', -72, 112, 0, 26, 19, M['stone'], G(g)['c'], 64); world_uv(rc, 4); reg(g, rc)
band(g, 'spirit_b', -72 - 19, 112 - 19, -72 + 19, 112 + 19, 26, .01, 0)
rc2 = cyl('spirit_ring', -72, 112, 26, 27.2, 19.8, M['trim'], G(g)['c'], 64); reg(g, rc2)
drum(g, 'spirit_drum', -72, 112, 27.2, 31.5, 15.5, nwin=16)
dome(g, 'spirit_dome', -72, 112, 31.7, 15, 12.5, finial_h=7)
hall_block('banquet', -152, 96, -100, 150, 22)
hall_block('barza', -100, 132, -40, 168, 21)
g = 'knowledge'
hall_block('knowledge', 40, 96, 100, 140, 22)
for dx in (-14, 14):
    block(g, 'kn_cap%d' % dx, 70 + dx - 4, 114, 70 + dx + 4, 122, 22.9, 25.5)
    dome(g, 'kn_dome%d' % dx, 70 + dx, 118, 25.8, 3.8, 3.3)
hall_block('gifts', 100, 96, 152, 150, 22)
block('facade', 'back_court_s', -40, 140, 40, 168, 0, 16)
cornice('facade', 'back_court_sc', -40, 140, 40, 168, 16.1, .8)

# ================================================================== FORECOURT
g = 'court'
CY0, CY1 = -236, -8
plane(g, 'court_paving', -150, CY1 - 236 + 8, 150, CY1, .04, M['paving'], 24)
plane(g, 'court_side_n', -175, CY0 - 10, -150, CY1, .03, M['paving'], 24)
plane(g, 'court_side_s', 150, CY0 - 10, 175, CY1, .03, M['paving'], 24)
plane(g, 'palace_apron', -170, -8, 170, 4, .035, M['paving'], 24)
# side arcades (face the court)
arcade_side(g, 'arc_w', -205, -36, -148, 9, 11, 6.4, 'E')
arcade_side(g, 'arc_e', -205, -36, 148, 9, 11, 6.4, 'W')
# great gate pavilions at court corners by the palace, and at the far end
gate_pavilion(g, 'gate_nw', -150, -22, 26, 24, 8.6)
gate_pavilion(g, 'gate_ne', 150, -22, 26, 24, 8.6)
gate_pavilion(g, 'gate_sw', -150, -220, 22, 20, 7.2)
gate_pavilion(g, 'gate_se', 150, -220, 22, 20, 7.2)
# central star fountain + white marble basins
star_pool(g, 'court_fountain', 0, -150, 15, M['marble'])
for (x, y, w, d) in ((-26, -150, 8, 34), (26, -150, 8, 34), (0, -122, 34, 6), (0, -178, 34, 6)):
    ob = box('court_basin_%d_%d' % (x, y), x - w / 2, y - d / 2, 0, x + w / 2, y + d / 2, .75, M['marble'], G(g)['c']); world_uv(ob, 4); reg(g, ob)
star_pool(g, 'court_fountain2', 0, -60, 7, M['marble'])
# hedges in front of palace
for x in (-22, 22):
    ob = box('front_hedge%d' % x, x - 6, -14, 0, x + 6, -10, 1.1, M['hedge'], G(g)['c']); reg(g, ob)

# ---- instanced props (kiosks, lamps, bollards, palms) under the court/gardens groups
INST = lib.coll('instances')
def inst_place(proto_objs, g, positions, name):
    for i, (x, y, rz) in enumerate(positions):
        for po in proto_objs:
            o = bpy.data.objects.new('%s_%s_%d' % (name, po.name, i), po.data)
            o.location = (x, y, 0); o.rotation_euler = (0, 0, rz)
            G(g)['c'].objects.link(o)
            G(g)['inst'].append(o)

kio = kiosk_proto('kiosk', INST)
kio_j = {}
for o in kio:
    key = o.data.materials[0].name
    kio_j.setdefault(key, []).append(o)
kio = [join(v, 'kiosk_' + k) for k, v in kio_j.items()]
for o in kio:
    o.data.name = o.name; lib.link(o, INST)
inst_place(kio, 'court', [(s * 133, y, 0) for s in (-1, 1) for y in (-62, -120, -178)], 'kiosk')
lm, lg = lamp_proto(INST)
lamp_pos = [(s * 118, y, 0) for s in (-1, 1) for y in range(-40, -215, -22)] + [(s * 40, y, 0) for s in (-1, 1) for y in (-122, -178)]
inst_place([lm, lg], 'court', lamp_pos, 'lamp')
bol = join([sphere('bol_ball', 0, 0, .75, .55, M['marble'], INST, 16, 10), cyl('bol_base', 0, 0, 0, .3, .45, M['marble'], INST, 16)], 'bollard')
inst_place([bol], 'court', [(s * x, y, 0) for s in (-1, 1) for x in (10, 60) for y in range(-30, -230, -40)], 'bollard')

# ================================================================== GARDENS
g = 'gardens'
GY0, GY1 = -250, -470
plane(g, 'garden_lawn', -160, GY1, 160, GY0, .03, M['grass'], 10)
plane(g, 'garden_axis', -9, GY1, 9, GY0, .05, M['paving'], 24)
plane(g, 'garden_cross', -160, -356, 160, -344, .05, M['paving'], 24)
for (cx, cy, w, d) in ((-80, -300, 110, 70), (80, -300, 110, 70), (-80, -410, 110, 80), (80, -410, 110, 80)):
    rim = box('pool_rim_%d_%d' % (cx, cy), cx - w / 2 - 1.2, cy - d / 2 - 1.2, 0, cx + w / 2 + 1.2, cy + d / 2 + 1.2, 1.1, M['mosaic'], G(g)['c'])
    cb = bmesh.new(); bmesh.ops.create_cube(cb, size=1, matrix=Matrix.Translation((cx, cy, 1.0)) @ Matrix.Diagonal((w, d, 1.2, 1)))
    boolean(rim, cb); world_uv(rim, 8); reg(g, rim)
    plane(g, 'pool_water_%d_%d' % (cx, cy), cx - w / 2, cy - d / 2, cx + w / 2, cy + d / 2, .85, M['water'], None)
    for (a, b) in ((cx - w / 2 - 1.2, cy - d / 2 - 4), (cx - w / 2 - 1.2, cy + d / 2 + 1.5)):
        ob = box('flowers_%d_%d' % (a, b), a, b, 0, a + w + 2.4, b + 2.5, .55, M['flower'], G(g)['c']); reg(g, ob)
for cy in (-262, -300, -350, -410, -458):
    star_pool(g, 'mosaic_fountain_%d' % cy, 0, cy, 5.5, M['mosaic'], h=.8)
for x in (-14, 14):
    ob = box('hedge_axis%d' % x, x - 1.2, GY1, 0, x + 1.2, GY0, 1.0, M['hedge'], G(g)['c']); reg(g, ob)
palms = [palm_proto(INST, h, sd) for sd, h in ((1, 11), (2, 13), (3, 9.5), (4, 12))]
for t, f in palms:
    t.data.name = t.name; f.data.name = f.name
ppos = []
for y in range(-258, -470, -12):
    ppos += [(-20, y), (20, y)]
for x in range(-150, 151, 15):
    ppos += [(x, -246), (x, -474)]
for y in range(-30, -236, -20):
    ppos += [(-166, y), (166, y), (-182, y - 10), (182, y - 10)]
for x in range(-200, 201, 25):
    ppos += [(x, 185), (x + 12, 200)]
for y in range(-30, 180, 22):
    ppos += [(-190, y), (190, y)]
for i, (x, y) in enumerate(ppos):
    t, f = palms[i % 4]
    for po in (t, f):
        o = bpy.data.objects.new('palm_%s_%d' % (po.name, i), po.data)
        o.location = (x, y, 0); o.rotation_euler = (0, 0, (i * 1.7) % 6.28)
        G('gardens')['c'].objects.link(o); G('gardens')['inst'].append(o)

# ================================================================== LIBRARY & VISITOR CENTRE (approximate positions)
g = 'library'
block(g, 'library_blk', 190, -360, 250, -310, 0, 15, row('W', -355, -315, 3, 'parch', 3, 8, spacing=7))
cornice(g, 'library_cor', 190, -360, 250, -310, 15.1, 1)
dome(g, 'library_dome', 220, -335, 15.9, 8, 6.8)
g = 'visitor'
block(g, 'visitor_blk', -70, -640, 70, -600, 0, 12)
cornice(g, 'visitor_cor', -70, -640, 70, -600, 12.1, 1)
arcade_front(g, 'visitor_arc', -70, 70, -606, 6, 10, 7)
dome(g, 'visitor_dome', 0, -620, 13, 9, 7.5)
gate_pavilion(g, 'visitor_gate_w', -95, -585, 16, 15, 5.4)
gate_pavilion(g, 'visitor_gate_e', 95, -585, 16, 15, 5.4)

# ================================================================== CONTEXT (not interactive)
g = 'context'
plane(g, 'ground', -1400, -1300, 1400, 600, -.02, M['sand'], 30)
plane(g, 'sea_w', -6000, 600, 6000, 6000, -.3, M['sea'], None)
plane(g, 'sea_n', -6000, -6000, -1400, 600, -.3, M['sea'], None)
plane(g, 'sea_s', 1400, -1300, 6000, 600, -.3, M['sea'], None)
plane(g, 'city_ground', -1400, -6000, 6000, -1300, -.02, M['sand'], 30)
plane(g, 'road_e', -900, -680, 900, -660, .02, M['road'], 10)
# Etihad Towers (5 towers, real heights 305/277/260/234/218 m), east of the palace
for i, (dx, dy, h) in enumerate(((0, 0, 305), (60, -30, 277), (120, -10, 260), (-55, -40, 234), (40, -95, 218))):
    t = cyl('etihad_%d' % i, 520 + dx, -2100 + dy, 0, h, 24, M['tower_glass'], G(g)['c'], 24, r2=17); shade_smooth(t); reg(g, t)
rnd = random.Random(9)
for i in range(70):
    x = rnd.uniform(-900, 2600); y = rnd.uniform(-4200, -2350); w = rnd.uniform(25, 55); h = rnd.uniform(40, 220)
    reg(g, box('city_%d' % i, x, y, 0, x + w, y + w * rnd.uniform(.6, 1.2), h, M['city'] if i % 3 else M['tower_glass'], G(g)['c']))

# ================================================================== finalize: join per group/material, parent under group empties
for o in list(bpy.data.objects):
    if o.type == 'MESH' and o.name.endswith('_cut'):
        bpy.data.objects.remove(o)
for gname, d in list(GROUPS.items()):
    if gname == '_tmp':
        continue
    emp = bpy.data.objects.new('H_' + gname, None)
    bpy.context.scene.collection.objects.link(emp)
    bymat = {}
    for o in d['objs']:
        if o is None or o.name not in bpy.data.objects or o.type != 'MESH' or not o.data.materials:
            continue
        bymat.setdefault(o.data.materials[0].name, []).append(o)
    for mname, objs in bymat.items():
        j = join(objs, '%s__%s' % (gname, mname))
        j.parent = emp
    for o in d['inst']:
        o.parent = emp
# remove proto objects from export (keep their meshes alive through instances)
for o in list(INST.objects):
    bpy.data.objects.remove(o)
# recompute normals/cleanup
for o in bpy.data.objects:
    if o.type == 'MESH':
        o.data.validate()
print('objects', len([o for o in bpy.data.objects if o.type == 'MESH']), 'tris', sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in bpy.data.objects if o.type == 'MESH' and o.data.users == 1))
for _o in bpy.data.objects:
    if _o.type == 'MESH' and not _o.data.uv_layers:
        world_uv(_o, 4)
bpy.ops.wm.save_as_mainfile(filepath=OUT.replace('.glb', '.blend'))
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_yup=True, export_apply=True,
                          export_gpu_instances=True, export_extras=False, export_cameras=False, export_lights=False,
                          export_image_format='AUTO', export_texcoords=True, export_normals=True)
print('exported', OUT, os.path.getsize(OUT) // 1024, 'KB')
