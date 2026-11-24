import sys, os, math, random
sys.path.insert(0, os.path.dirname(__file__))
import bpy, bmesh
from mathutils import Vector, Matrix
import lib
from lib import box, cyl, sphere, arch_outline, prism_xz, poly_xz, boolean, world_uv, join, mesh_obj, shade_smooth, mat

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
lib.TEX = os.path.join(ROOT, 'tex')
OUT = sys.argv[sys.argv.index('--') + 1]
lib.reset()
M = lib.std_materials()
M['floor_great'] = mat('floor_great', (1, 1, 1), 0.12, albedo='floor_great.jpg')
M['dome_in'] = mat('dome_interior', (1, 1, 1), 0.35, 0.25, albedo='dome_interior.jpg', double=True)
M['skylight'] = mat('skylight', (1, .97, .9), 0.5, albedo='lattice_albedo.jpg', emit=(1, .93, .8), emit_str=2.5)
M['carpet_blue'] = mat('carpet_blue', (1, 1, 1), 0.9, albedo='carpet_blue.jpg')
M['carpet_red'] = mat('carpet_red', (1, 1, 1), 0.9, albedo='carpet_red.jpg')
M['carpet_dark'] = mat('carpet_dark', (1, 1, 1), 0.9, albedo='carpet_dark.jpg')
M['books'] = mat('books', (1, 1, 1), 0.8, albedo='books.jpg')
M['crystal'] = mat('crystal', (1, 1, 1), 0.03, 0.9, emit=(1, .9, .7), emit_str=1.6)
M['cloth'] = mat('table_cloth', (.96, .95, .92), 0.7)
M['gilt'] = mat('gilt_chair', (.78, .6, .3), 0.35, 0.8)
M['blue_fab'] = mat('blue_fabric', (.12, .2, .42), 0.8)
M['cream_fab'] = mat('cream_fabric', (.9, .85, .74), 0.85)
M['navy_wall'] = mat('navy_wall', (.08, .1, .16), 0.6)
M['vitrine'] = mat('vitrine_glass', (.85, .92, 1), 0.02, 0.0, alpha=0.18)
M['screen'] = mat('screen', (.2, .35, .6), 0.3, emit=(.35, .55, .9), emit_str=3)
M['page'] = mat('manuscript', (.92, .85, .66), 0.8, emit=(1, .85, .6), emit_str=.25)
M['inner_wall'] = mat('inner_wall', (.95, .92, .85), 0.55, albedo='stone_albedo.jpg', double=True)

GROUPS = {}
def G(n):
    if n not in GROUPS:
        GROUPS[n] = {'c': lib.coll('I_' + n), 'objs': [], 'inst': [], 'ceil': []}
    return GROUPS[n]
def reg(g, o, kind='objs'):
    G(g)[kind].append(o); return o
def B(g, name, x0, y0, z0, x1, y1, z1, m, uv=4, kind='objs'):
    o = box(name, x0, y0, z0, x1, y1, z1, M[m], G(g)['c'])
    if uv: world_uv(o, uv)
    return reg(g, o, kind)

def wall_with_arches(g, name, x0, x1, y, t, h, arches, mtl='inner_wall', face=1):
    """Wall slab along X at y (thickness t toward +y*face), arches=(cx,w,hs,ha,depth or None=through)."""
    o = box(name, x0, y if face > 0 else y - t, 0, x1, y + t if face > 0 else y, h, M[mtl], G(g)['c'])
    cb = bmesh.new()
    for (cx, w, hs, ha, d) in arches:
        if d is None:
            prism_xz(cb, arch_outline(w, hs, ha, 14), y - t - 1, y + t + 1, ox=cx)
        else:
            if face > 0:
                prism_xz(cb, arch_outline(w, hs, ha, 14), y - 1, y + d, ox=cx)
            else:
                prism_xz(cb, arch_outline(w, hs, ha, 14), y - d, y + 1, ox=cx)
    bmesh.ops.recalc_face_normals(cb, faces=cb.faces)
    if arches:
        boolean(o, cb)
    world_uv(o, 4); return reg(g, o)

def rot_new(before, deg, pivot):
    for o in set(bpy.data.objects) - before:
        if o.type == 'MESH':
            o.data.transform(Matrix.Translation(pivot) @ Matrix.Rotation(math.radians(deg), 4, 'Z') @ Matrix.Translation(-Vector(pivot)))
            if o.data.materials and o.data.materials[0].name in ('inner_wall',):
                world_uv(o, 4)
            elif o.data.materials and o.data.materials[0].name == 'lattice':
                world_uv(o, 2.2)

def ring_windows_cut(ob, x, y, z0, z1, r, n, inward=True):
    cb = bmesh.new(); h = (z1 - z0) * .66; w = min(2 * math.pi * r / n * .5, h * .5)
    ol = arch_outline(w, h - w * .62, h, 8, 'round')
    for i in range(n):
        a = i / n * 2 * math.pi; d = Vector((math.cos(a), math.sin(a), 0)); tg = Vector((-math.sin(a), math.cos(a), 0))
        A = [cb.verts.new(Vector((x, y, z0 + (z1 - z0) * .17 + pz)) + d * (r - 1.5) + tg * px) for px, pz in ol]
        Bv = [cb.verts.new(Vector((x, y, z0 + (z1 - z0) * .17 + pz)) + d * (r + 1.5) + tg * px) for px, pz in ol]
        cb.faces.new(A); cb.faces.new(Bv[::-1])
        for k in range(len(ol)):
            m = (k + 1) % len(ol); cb.faces.new((A[k], Bv[k], Bv[m], A[m]))
    bmesh.ops.recalc_face_normals(cb, faces=cb.faces); boolean(ob, cb)
    gb = bmesh.new()
    for i in range(n):
        a = i / n * 2 * math.pi; d = Vector((math.cos(a), math.sin(a), 0)); tg = Vector((-math.sin(a), math.cos(a), 0))
        gb.faces.new([gb.verts.new(Vector((x, y, z0 + (z1 - z0) * .17 + pz)) + d * (r + .35) + tg * px) for px, pz in ol])
    return gb, ol

def inner_dome(g, name, x, y, zb, R, rise, m='dome_in'):
    bm = bmesh.new(); uvl = bm.loops.layers.uv.new('UVMap'); segs = 64; NV = 24; rings = []
    for i in range(NV + 1):
        t = i / NV; a = t * math.pi / 2
        r = max(R * math.cos(a), .001); z = zb + rise * math.sin(a)
        rings.append(([bm.verts.new((x + r * math.cos(j / segs * 2 * math.pi), y + r * math.sin(j / segs * 2 * math.pi), z)) for j in range(segs)], t))
    for i in range(NV):
        ra, ta = rings[i]; rb, tb = rings[i + 1]
        for j in range(segs):
            k = (j + 1) % segs
            f = bm.faces.new((ra[j], rb[j], rb[k], ra[k]))  # inward facing
            for l, uv in zip(f.loops, ((j / segs, ta), (j / segs, tb), ((j + 1) / segs, tb), ((j + 1) / segs, ta))):
                l[uvl].uv = uv
    o = mesh_obj(name, bm, M[m], G(g)['c']); shade_smooth(o); return reg(g, o, 'ceil')

def disc(g, name, x, y, z, r, m, segs=64, kind='objs', uvfull=True):
    bm = bmesh.new(); uvl = bm.loops.layers.uv.new('UVMap')
    vs = [bm.verts.new((x + r * math.cos(i / segs * 2 * math.pi), y + r * math.sin(i / segs * 2 * math.pi), z)) for i in range(segs)]
    f = bm.faces.new(vs)
    for l in f.loops:
        co = l.vert.co; l[uvl].uv = ((co.x - x) / (2 * r) + .5, (co.y - y) / (2 * r) + .5)
    return reg(g, mesh_obj(name, bm, M[m], G(g)['c']), kind)

def floor_rect(g, name, x0, y0, x1, y1, z, m, full=True, kind='objs'):
    bm = bmesh.new(); uvl = bm.loops.layers.uv.new('UVMap')
    vs = [bm.verts.new(p) for p in ((x0, y0, z), (x1, y0, z), (x1, y1, z), (x0, y1, z))]
    f = bm.faces.new(vs if z < 5 else vs[::-1])
    for l in f.loops:
        co = l.vert.co
        l[uvl].uv = ((co.x - x0) / (x1 - x0), (co.y - y0) / (y1 - y0)) if full else (co.x / 6, co.y / 6)
    return reg(g, mesh_obj(name, bm, M[m], G(g)['c']), kind)

def instances(g, proto, positions, name):
    for i, (x, y, z, rz) in enumerate(positions):
        o = bpy.data.objects.new('%s_%d' % (name, i), proto.data)
        o.location = (x, y, z); o.rotation_euler = (0, 0, rz)
        G(g)['c'].objects.link(o); G(g)['inst'].append(o)

PROTO = lib.coll('proto')
def chair_proto(name, seat_m, frame_m, back_h=1.1):
    parts = [box(name + 's', -.28, -.28, .45, .28, .28, .58, M[seat_m], PROTO), box(name + 'b', -.28, .2, .58, .28, .28, .58 + back_h, M[seat_m], PROTO)]
    for (x, y) in ((-.24, -.24), (.24, -.24), (-.24, .24), (.24, .24)):
        parts.append(box(name + 'l%d%d' % (x * 10, y * 10), x - .03, y - .03, 0, x + .03, y + .03, .45, M[frame_m], PROTO))
    return join(parts, name)

def crystal_strand(name, n, step=.32, size=.12):
    bm = bmesh.new()
    for i in range(n):
        bmesh.ops.create_icosphere(bm, subdivisions=0, radius=size, matrix=Matrix.Translation((0, 0, -i * step)) @ Matrix.Diagonal((1, 1, 1.8, 1)))
    o = mesh_obj(name, bm, M['crystal'], PROTO); return o

def chandelier(g, name, x, y, ztop, tiers):
    """tiers: (radius, z, strand_len) — gold rings with crystal strands, instanced."""
    strands = {}
    pos = {}
    for (r, z, L) in tiers:
        key = L
        if key not in strands:
            strands[key] = crystal_strand('%s_strand%d' % (name, L), L)
        n = int(2 * math.pi * r / .55)
        for i in range(n):
            a = i / n * 2 * math.pi
            pos.setdefault(key, []).append((x + r * math.cos(a), y + r * math.sin(a), z, a))
        ring = bpy.data.objects.new  # placeholder
        bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=False, segments=64, radius1=r + .1, radius2=r + .1, depth=.35, matrix=Matrix.Translation((x, y, z + .15)))
        rg = mesh_obj(name + '_ring%.1f' % r, bm, M['gilt'], G(g)['c']); shade_smooth(rg); reg(g, rg)
    for key, pl in pos.items():
        instances(g, strands[key], pl, '%s_s%d' % (name, key))
    reg(g, cyl(name + '_rod', x, y, tiers[0][1], ztop, .18, M['gold'], G(g)['c'], 12))
    reg(g, sphere(name + '_core', x, y, tiers[-1][1] - 2.5, .9, M['crystal'], G(g)['c'], 16, 10))

# ====================================================================== GREAT HALL
g = 'great'
X, Y = 0, 75; S = 50; H = 26
x0, x1, y0, y1 = X - S / 2, X + S / 2, Y - S / 2, Y + S / 2
floor_rect(g, 'gh_floor', x0, y0, x1, y1, .02, 'floor_great')
# four walls each with a giant pointed arch niche (depth 4) and an arcaded two-storey screen inside
for k, ang in enumerate((0, 90, 180, 270)):
    before = set(bpy.data.objects)
    # wall along X at y0 (south): inner face at y0, giant arch opening into a 5 m deep niche
    wall_with_arches(g, 'gh_wall%d' % k, x0, x1, y0 - 1.5, 1.5, H, [(X, 30, 14, 25.5, None)], face=1)
    NB = y0 - 6.5   # niche back plane
    scr = box('gh_screen%d' % k, X - 16, NB - 1, 0, X + 16, NB, 26.5, M['inner_wall'], G(g)['c'])
    cb = bmesh.new()
    for cx in (-8, 0, 8):
        prism_xz(cb, arch_outline(4.2, 5.2, 8.2, 10), NB - .45, NB + 1, ox=X + cx)
    for cx in (-10, -5, 0, 5, 10):
        prism_xz(cb, arch_outline(2.6, 2.4, 4.2, 8, 'round'), NB - .45, NB + 1, ox=X + cx, oz=10.6)
    for cx in (-6, 0, 6):
        prism_xz(cb, arch_outline(3.4, 2.6, 4.8, 8), NB - .45, NB + 1, ox=X + cx, oz=16.6)
    bmesh.ops.recalc_face_normals(cb, faces=cb.faces); boolean(scr, cb); world_uv(scr, 4); reg(g, scr)
    for sx in (-1, 1):
        sw = box('gh_nside%d%d' % (k, sx), X + sx * 15.6 - .6, NB, 0, X + sx * 15.6 + .6, y0 - 1.4, 26.5, M['inner_wall'], G(g)['c']); world_uv(sw, 4); reg(g, sw)
    vt = box('gh_nvault%d' % k, X - 16, NB, 25.4, X + 16, y0 - 1.4, 26.5, M['lattice'], G(g)['c']); world_uv(vt, 2.2); reg(g, vt)
    # balcony slab between storeys
    reg(g, B(g, 'gh_balc%d' % k, X - 15, NB, 9.8, X + 15, NB + 1.4, 10.2, 'gilt', 0))
    db = bmesh.new()
    for cx in (-8, 0, 8):
        db.faces.new([db.verts.new((X + cx + px, NB - .42, pz)) for px, pz in arch_outline(4.2, 5.2, 8.2, 10)])
    reg(g, mesh_obj('gh_doors%d' % k, db, M['wood'], G(g)['c']))
    gl = bmesh.new()
    for cx in (-10, -5, 0, 5, 10):
        gl.faces.new([gl.verts.new((X + cx + px, NB - .42, 10.6 + pz)) for px, pz in arch_outline(2.6, 2.4, 4.2, 8, 'round')])
    for cx in (-6, 0, 6):
        gl.faces.new([gl.verts.new((X + cx + px, NB - .42, 16.6 + pz)) for px, pz in arch_outline(3.4, 2.6, 4.8, 8)])
    reg(g, mesh_obj('gh_gallery_glass%d' % k, gl, M['glass'], G(g)['c']))
    # lattice spandrels + carved band on the screen
    sp = box('gh_spandrel%d' % k, X - S / 2 + 2, y0 - .02, 12, X + S / 2 - 2, y0 + .08, H - .8, M['lattice'], G(g)['c'])
    cb = bmesh.new(); prism_xz(cb, arch_outline(31.6, 14, 26.6, 16), y0 - 1, y0 + 1, ox=X); bmesh.ops.recalc_face_normals(cb, faces=cb.faces)
    boolean(sp, cb); world_uv(sp, 2.2); reg(g, sp)
    mb = bmesh.new(); prism_xz(mb, arch_outline(31.6, 14, 26.6, 16), y0 - .1, y0 + .35, ox=X); bmesh.ops.recalc_face_normals(mb, faces=mb.faces)
    mo = mesh_obj('gh_mould%d' % k, mb, M['gilt'], G(g)['c'])
    cb = bmesh.new(); prism_xz(cb, arch_outline(30, 14, 25.5, 16), y0 - 1, y0 + 1, ox=X); bmesh.ops.recalc_face_normals(cb, faces=cb.faces)
    boolean(mo, cb); reg(g, mo)
    lp = box('gh_lowpanel%d' % k, X - S / 2 + 2, y0 - .02, 1, X - 16.5, y0 + .08, 11, M['lattice'], G(g)['c']); world_uv(lp, 2.2); reg(g, lp)
    lp = box('gh_lowpanel_b%d' % k, X + 16.5, y0 - .02, 1, X + S / 2 - 2, y0 + .08, 11, M['lattice'], G(g)['c']); world_uv(lp, 2.2); reg(g, lp)
    rot_new(before, ang, (X, Y, 0))
# corner piers
for sx in (-1, 1):
    for sy in (-1, 1):
        reg(g, cyl('gh_pier%d%d' % (sx, sy), X + sx * (S / 2 - 1.6), Y + sy * (S / 2 - 1.6), 0, H, 1.6, M['trim'], G(g)['c'], 8))
# ceiling with circular opening + corner skylights
cl = box('gh_ceiling', x0 - 5, y0 - 5, H, x1 + 5, y1 + 5, H + 1.2, M['inner_wall'], G(g)['c'])
cb = bmesh.new(); bmesh.ops.create_cone(cb, cap_ends=True, segments=64, radius1=19.5, radius2=19.5, depth=4, matrix=Matrix.Translation((X, Y, H + .6)))
for sx in (-1, 1):
    for sy in (-1, 1):
        bmesh.ops.create_cube(cb, size=1, matrix=Matrix.Translation((X + sx * 20.5, Y + sy * 20.5, H + .6)) @ Matrix.Diagonal((7, 7, 4, 1)))
bmesh.ops.recalc_face_normals(cb, faces=cb.faces); boolean(cl, cb); world_uv(cl, 4); reg(g, cl, 'ceil')
for sx in (-1, 1):
    for sy in (-1, 1):
        floor_rect(g, 'gh_sky%d%d' % (sx, sy), X + sx * 20.5 - 3.5, Y + sy * 20.5 - 3.5, X + sx * 20.5 + 3.5, Y + sy * 20.5 + 3.5, H + 1.15, 'skylight', kind='ceil')
# stepped rings at the dome opening
for i, (r, z, hh) in enumerate(((19.5, H, 1.2), (19.0, H + 1.2, 1.2), (18.6, H + 2.4, 1.0))):
    rr = cyl('gh_ring%d' % i, X, Y, z, z + hh, r + .6, M['gilt'] if i == 1 else M['trim'], G(g)['c'], 64)
    cb = bmesh.new(); bmesh.ops.create_cone(cb, cap_ends=True, segments=64, radius1=r, radius2=r, depth=hh + 2, matrix=Matrix.Translation((X, Y, z + hh / 2)))
    boolean(rr, cb); reg(g, rr, 'ceil')
# drum with 24 blue windows
drm = cyl('gh_drum', X, Y, H + 3.4, H + 12, 19.6, M['inner_wall'], G(g)['c'], 64)
cb = bmesh.new(); bmesh.ops.create_cone(cb, cap_ends=True, segments=64, radius1=18.6, radius2=18.6, depth=10, matrix=Matrix.Translation((X, Y, H + 7.7)))
boolean(drm, cb)
gb, _ = ring_windows_cut(drm, X, Y, H + 3.4, H + 12, 19.1, 24)
world_uv(drm, 4); reg(g, drm, 'ceil')
reg(g, mesh_obj('gh_drum_glass', gb, M['glass_blue'], G(g)['c']), 'ceil')
inner_dome(g, 'gh_dome', X, Y, H + 12, 18.6, 18.5)
reg(g, cyl('gh_domering', X, Y, H + 11.6, H + 12.6, 18.9, M['gilt'], G(g)['c'], 64, cap=False), 'ceil')
# lecterns (lit info kiosks) and side seating
for sx in (-1, 1):
    reg(g, B(g, 'gh_lect%d' % sx, X + sx * 12 - .7, Y - 14 - .5, 0, X + sx * 12 + .7, Y - 14 + .5, 3.2, 'wood', 0))
    reg(g, B(g, 'gh_lect_scr%d' % sx, X + sx * 12 - .55, Y - 14 - .56, 1.1, X + sx * 12 + .55, Y - 14 - .5, 2.9, 'skylight', 0))
armch = chair_proto('gh_armchair', 'cream_fab', 'gilt', .7)
instances(g, armch, [(X + sx * 21, Y + k * 3.2, 0, -sx * math.pi / 2) for sx in (-1, 1) for k in range(-4, 5)], 'gh_chairs')

# ====================================================================== SPIRIT OF COLLABORATION
g = 'spirit'
X, Y, R, H = -72, 112, 17, 20
disc(g, 'sp_floor', X, Y, .02, R, 'carpet_blue')
shell = cyl('sp_shell', X, Y, 0, H, R + 1.2, M['inner_wall'], G(g)['c'], 96)
cb = bmesh.new(); bmesh.ops.create_cone(cb, cap_ends=True, segments=96, radius1=R, radius2=R, depth=H + 2, matrix=Matrix.Translation((X, Y, H / 2)))
for i in range(16):
    a = i / 16 * 2 * math.pi; d = Vector((math.cos(a), math.sin(a), 0)); tg = Vector((-math.sin(a), math.cos(a), 0))
    ol = arch_outline(4.4, 9, 13.5, 10)
    A = [cb.verts.new(Vector((X, Y, 1 + pz)) + d * (R - 1) + tg * px) for px, pz in ol]
    Bv = [cb.verts.new(Vector((X, Y, 1 + pz)) + d * (R + .7) + tg * px) for px, pz in ol]
    cb.faces.new(A); cb.faces.new(Bv[::-1])
    for k in range(len(ol)):
        m = (k + 1) % len(ol); cb.faces.new((A[k], Bv[k], Bv[m], A[m]))
bmesh.ops.recalc_face_normals(cb, faces=cb.faces); boolean(shell, cb); world_uv(shell, 4); reg(g, shell)
lat = cyl('sp_niche_back', X, Y, 1, 15, R + .72, M['lattice'], G(g)['c'], 96)
cb = bmesh.new(); bmesh.ops.create_cone(cb, cap_ends=True, segments=96, radius1=R + .62, radius2=R + .62, depth=20, matrix=Matrix.Translation((X, Y, 8)))
boolean(lat, cb); world_uv(lat, 2.2); reg(g, lat)
reg(g, cyl('sp_cornice', X, Y, H - .6, H + .4, R + .2, M['gilt'], G(g)['c'], 96, cap=False))
ceil = cyl('sp_ceiling', X, Y, H + .4, H + 1.4, R + 1.2, M['inner_wall'], G(g)['c'], 96)
cb = bmesh.new(); bmesh.ops.create_cone(cb, cap_ends=True, segments=96, radius1=14.6, radius2=14.6, depth=4, matrix=Matrix.Translation((X, Y, H + .9)))
boolean(ceil, cb); reg(g, ceil, 'ceil')
drm = cyl('sp_drum', X, Y, H + 1.4, H + 6.4, 15.4, M['inner_wall'], G(g)['c'], 96)
cb = bmesh.new(); bmesh.ops.create_cone(cb, cap_ends=True, segments=96, radius1=14.6, radius2=14.6, depth=8, matrix=Matrix.Translation((X, Y, H + 4)))
boolean(drm, cb); gb, _ = ring_windows_cut(drm, X, Y, H + 1.4, H + 6.4, 15, 16); reg(g, drm, 'ceil')
reg(g, mesh_obj('sp_drum_glass', gb, M['glass_blue'], G(g)['c']), 'ceil')
inner_dome(g, 'sp_dome', X, Y, H + 6.4, 14.6, 12)
tb = bmesh.new(); bmesh.ops.create_cone(tb, cap_ends=True, segments=96, radius1=8.8, radius2=8.8, depth=.12, matrix=Matrix.Translation((X, Y, .8)))
bmesh.ops.create_cone(tb, cap_ends=True, segments=96, radius1=6.2, radius2=6.2, depth=1, matrix=Matrix.Translation((X, Y, .8)))
table = mesh_obj('sp_table_top', tb, M['wood'], G(g)['c'])
cb = bmesh.new(); bmesh.ops.create_cone(cb, cap_ends=True, segments=96, radius1=6.6, radius2=6.6, depth=3, matrix=Matrix.Translation((X, Y, .8)))
boolean(table, cb); reg(g, table)
reg(g, cyl('sp_table_skirt', X, Y, 0, .75, 8.2, M['wood'], G(g)['c'], 96))
sk = g
chair = chair_proto('sp_chair', 'blue_fab', 'gilt', 1.0)
instances(g, chair, [(X + 9.6 * math.cos(a), Y + 9.6 * math.sin(a), 0, a + math.pi / 2) for a in [i / 40 * 2 * math.pi for i in range(40)]], 'sp_chairs')
chandelier(g, 'sp_chand', X, Y, H + 18, [(6.4, H - 3.2, 14), (4.6, H - 6.4, 12), (2.8, H - 9.2, 10)])

# ====================================================================== GENERIC HALLS
def room(g, name, x0, y0, x1, y1, H, floor_m, wall_m='inner_wall', niches=True):
    floor_rect(g, name + '_floor', x0, y0, x1, y1, .02, floor_m)
    for k, (a, b, yy, face, ang) in enumerate(((x0, x1, y0, 1, 0), (x0, x1, y1, -1, 0))):
        n = max(2, int((b - a) / 6)); arches = [(a + (b - a) * (i + .5) / n, 3.6, 5.5, 8.5, .8) for i in range(n)] if niches else []
        wall_with_arches(g, '%s_w%d' % (name, k), a, b, yy, .9, H, arches, mtl=wall_m, face=face)
    for k, (xx, face) in enumerate(((x0, 1), (x1, -1))):
        before = set(bpy.data.objects)
        L = y1 - y0; n = max(2, int(L / 6))
        arches = [(-L / 2 + L * (i + .5) / n, 3.6, 5.5, 8.5, .8) for i in range(n)] if niches else []
        wall_with_arches(g, '%s_s%d' % (name, k), -L / 2, L / 2, 0, .9, H, arches, mtl=wall_m, face=1)
        for o in set(bpy.data.objects) - before:
            if o.type == 'MESH':
                o.data.transform(Matrix.Translation((xx, (y0 + y1) / 2, 0)) @ Matrix.Rotation(math.radians(-90 if face > 0 else 90), 4, 'Z'))
                world_uv(o, 4)
    reg(g, B(g, name + '_cornice', x0, y0, H - .7, x1, y0 + .5, H, 'gilt', 0))
    reg(g, B(g, name + '_cornice2', x0, y1 - .5, H - .7, x1, y1, H, 'gilt', 0))
    cl = B(g, name + '_ceiling', x0 - 1, y0 - 1, H, x1 + 1, y1 + 1, H + .8, 'inner_wall', 4, 'ceil')
    # coffers
    cb = bmesh.new()
    nx, ny = max(2, int((x1 - x0) / 7)), max(2, int((y1 - y0) / 7))
    for i in range(nx):
        for j in range(ny):
            cx = x0 + (x1 - x0) * (i + .5) / nx; cy = y0 + (y1 - y0) * (j + .5) / ny
            bmesh.ops.create_cube(cb, size=1, matrix=Matrix.Translation((cx, cy, H)) @ Matrix.Diagonal(((x1 - x0) / nx * .78, (y1 - y0) / ny * .78, .9, 1)))
    bmesh.ops.recalc_face_normals(cb, faces=cb.faces); boolean(cl, cb); world_uv(cl, 4)

# Banquet
g = 'banquet'; x0, y0, x1, y1, H = -148, 100, -104, 146, 16
room(g, 'bq', x0, y0, x1, y1, H, 'carpet_red')
gch = chair_proto('bq_chair', 'gilt', 'gilt', .9)
pos = []
for k, cx in enumerate((-136, -126, -116)):
    reg(g, B(g, 'bq_table%d' % k, cx - 1.1, y0 + 5, 0, cx + 1.1, y1 - 5, .78, 'cloth', 0))
    for j in range(16):
        yy = y0 + 6.2 + j * 2.25
        pos += [(cx - 1.7, yy, 0, -math.pi / 2), (cx + 1.7, yy, 0, math.pi / 2)]
    for j in range(5):
        yy = y0 + 8 + j * 7.5
        reg(g, cyl('bq_cand%d_%d' % (k, j), cx, yy, .78, 1.6, .08, M['gold'], G(g)['c'], 8))
instances(g, gch, pos, 'bq_chairs')
for k, cy in enumerate((112, 123, 134)):
    chandelier(g, 'bq_ch%d' % k, -126, cy, H, [(2.2, H - 2.5, 6), (1.4, H - 4.2, 5)])
for j in range(5):
    yy = y0 + 6 + j * 8.5
    reg(g, B(g, 'bq_vit%d' % j, x0 + .9, yy - 1.5, 0, x0 + 2, yy + 1.5, 2.6, 'wood', 0))
    reg(g, B(g, 'bq_vitg%d' % j, x0 + .9, yy - 1.4, 2.6, x0 + 2, yy + 1.4, 5.2, 'vitrine', 0))

# Al Barza (majlis)
g = 'barza'; x0, y0, x1, y1, H = -96, 136, -44, 164, 15
room(g, 'bz', x0, y0, x1, y1, H, 'carpet_red')
sofa = join([box('bz_sofa_s', -1, -.5, 0, 1, .5, .55, M['cream_fab'], PROTO), box('bz_sofa_b', -1, .3, .55, 1, .5, 1.25, M['cream_fab'], PROTO)], 'bz_sofa')
pos = [(x0 + 3 + i * 2.05, y1 - 1.9, 0, 0) for i in range(24)] + [(x0 + 1.9, y0 + 4 + i * 2.05, 0, math.pi / 2) for i in range(10)] + [(x1 - 1.9, y0 + 4 + i * 2.05, 0, -math.pi / 2) for i in range(10)]
instances(g, sofa, pos, 'bz_sofas')
for i in range(6):
    reg(g, B(g, 'bz_table%d' % i, x0 + 8 + i * 7.2, y1 - 6, 0, x0 + 10.5 + i * 7.2, y1 - 4.8, .45, 'wood', 0))
reg(g, B(g, 'bz_screen', -78, y0 + 1.2, 3, -62, y0 + 1.35, 11, 'screen', 0))
for k, cx in enumerate((-84, -70, -56)):
    chandelier(g, 'bz_ch%d' % k, cx, 150, H, [(1.8, H - 2.2, 5)])

# House of Knowledge
g = 'knowledge'; x0, y0, x1, y1, H = 44, 100, 96, 136, 15
room(g, 'kn', x0, y0, x1, y1, H, 'carpet_dark')
for i in range(4):
    for j in range(3):
        cx = x0 + 10 + i * 11; cy = y0 + 9 + j * 9
        reg(g, B(g, 'kn_base%d%d' % (i, j), cx - 2.2, cy - 1, 0, cx + 2.2, cy + 1, 1, 'wood', 0))
        reg(g, B(g, 'kn_book%d%d' % (i, j), cx - 1.6, cy - .6, 1, cx + 1.6, cy + .6, 1.08, 'page', 0))
        reg(g, B(g, 'kn_glass%d%d' % (i, j), cx - 2.1, cy - .95, 1, cx + 2.1, cy + .95, 2.3, 'vitrine', 0))
for i in range(6):
    reg(g, B(g, 'kn_wallcase%d' % i, x0 + 4 + i * 8, y1 - 1.6, 0, x0 + 9 + i * 8, y1 - .9, 4.5, 'books', 2))

# Presidential Gifts
g = 'gifts'; x0, y0, x1, y1, H = 104, 100, 148, 146, 15
room(g, 'gf', x0, y0, x1, y1, H, 'carpet_dark', wall_m='navy_wall')
for i in range(3):
    for j in range(4):
        cx = x0 + 9 + i * 13; cy = y0 + 8 + j * 10
        reg(g, B(g, 'gf_ped%d%d' % (i, j), cx - 1.6, cy - 1.6, 0, cx + 1.6, cy + 1.6, 1.4, 'navy_wall', 0))
        reg(g, B(g, 'gf_case%d%d' % (i, j), cx - 1.5, cy - 1.5, 1.4, cx + 1.5, cy + 1.5, 4.2, 'vitrine', 0))
        obj = (sphere if (i + j) % 2 else cyl)
        if (i + j) % 2:
            reg(g, sphere('gf_obj%d%d' % (i, j), cx, cy, 2.4, .7, M['gold'], G(g)['c'], 16, 10))
        else:
            reg(g, cyl('gf_obj%d%d' % (i, j), cx, cy, 1.4, 3.2, .45, M['gold'], G(g)['c'], 16, r2=.2))

# Library
g = 'library'; x0, y0, x1, y1, H = 192, -358, 248, -312, 13
room(g, 'lb', x0, y0, x1, y1, H, 'carpet_dark', niches=False)
for i in range(9):
    reg(g, B(g, 'lb_shelf_n%d' % i, x0 + 1 + i * 6, y1 - 2, 0, x0 + 6.5 + i * 6, y1 - 1, 7.5, 'books', 2))
    reg(g, B(g, 'lb_shelf_s%d' % i, x0 + 1 + i * 6, y0 + 1, 0, x0 + 6.5 + i * 6, y0 + 2, 7.5, 'books', 2))
reg(g, B(g, 'lb_gallery_n', x0, y1 - 4.5, 7.5, x1, y1 - 1, 8, 'wood', 0))
reg(g, B(g, 'lb_gallery_s', x0, y0 + 1, 7.5, x1, y0 + 4.5, 8, 'wood', 0))
for i in range(4):
    reg(g, B(g, 'lb_table%d' % i, x0 + 10 + i * 10, -337.5, 0, x0 + 15 + i * 10, -332.5, .8, 'wood', 0))
lch = chair_proto('lb_chair', 'wood', 'wood', .8)
instances(g, lch, [(x0 + 11 + i * 10 + k * 1.6, -338.6 + s * 7.2, 0, (0 if s < 0 else math.pi)) for i in range(4) for k in range(3) for s in (0, 1)], 'lb_chairs')

# ====================================================================== finalize
for gname, d in GROUPS.items():
    emp = bpy.data.objects.new('I_' + gname, None); bpy.context.scene.collection.objects.link(emp)
    for kind in ('objs', 'ceil'):
        bymat = {}
        for o in d[kind]:
            if o and o.name in bpy.data.objects and o.type == 'MESH' and o.data.materials:
                lst = bymat.setdefault(o.data.materials[0].name, [])
                if o not in lst: lst.append(o)
        for mn, objs in bymat.items():
            j = join(objs, '%s__%s%s' % (gname, mn, '__ceil' if kind == 'ceil' else ''))
            j.parent = emp
    for o in d['inst']:
        o.parent = emp
for o in list(PROTO.objects):
    bpy.data.objects.remove(o)
for _o in bpy.data.objects:
    if _o.type == 'MESH' and not _o.data.uv_layers:
        world_uv(_o, 4)
bpy.ops.wm.save_as_mainfile(filepath=OUT.replace('.glb', '.blend'))
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_yup=True, export_apply=True, export_gpu_instances=True,
                          export_cameras=False, export_lights=False, export_image_format='AUTO')
print('exported', OUT, os.path.getsize(OUT) // 1024, 'KB')
