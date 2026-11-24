"""Shared Blender helpers for the Qasr Al Watan model (Blender 5.x, bpy module).
Coordinates: metres, Z up. Main facade faces -Y (forecourt at negative Y)."""
import bpy, bmesh, math, os
from mathutils import Vector, Matrix

TEX = None
MATS = {}

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    MATS.clear()

def coll(name, parent=None):
    c = bpy.data.collections.get(name) or bpy.data.collections.new(name)
    if c.name not in (parent or bpy.context.scene.collection).children:
        (parent or bpy.context.scene.collection).children.link(c)
    return c

# ---------------- materials ----------------
def _img(name, noncolor=False):
    path = os.path.join(TEX, name)
    im = bpy.data.images.get(name) or bpy.data.images.load(path)
    if noncolor:
        im.colorspace_settings.name = 'Non-Color'
    return im

def mat(name, color=(1, 1, 1), rough=0.6, metal=0.0, albedo=None, normal=None, nstr=1.0,
        emit=None, emit_str=0.0, alpha_clip=False, alpha=1.0, double=False):
    if name in MATS:
        return MATS[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = rough
    p.inputs['Metallic'].default_value = metal
    if albedo:
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = _img(albedo)
        nt.links.new(t.outputs['Color'], p.inputs['Base Color'])
        if alpha_clip:
            nt.links.new(t.outputs['Alpha'], p.inputs['Alpha'])
            try:
                m.blend_method = 'CLIP'
            except Exception:
                pass
    if normal:
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = _img(normal, True)
        nm = nt.nodes.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value = nstr
        nt.links.new(t.outputs['Color'], nm.inputs['Color'])
        nt.links.new(nm.outputs['Normal'], p.inputs['Normal'])
    if emit:
        p.inputs['Emission Color'].default_value = (*emit, 1)
        p.inputs['Emission Strength'].default_value = emit_str
    if alpha < 1:
        p.inputs['Alpha'].default_value = alpha
        try:
            m.blend_method = 'BLEND'
        except Exception:
            pass
    m.use_backface_culling = not double
    MATS[name] = m
    return m

def std_materials():
    M = {}
    M['stone'] = mat('stone', (0.93, 0.91, 0.87), 0.62, albedo='stone_albedo.jpg', normal='stone_normal.png', nstr=0.6)
    M['trim'] = mat('stone_trim', (0.88, 0.85, 0.79), 0.5)
    M['lattice'] = mat('lattice', (0.9, 0.88, 0.82), 0.55, albedo='lattice_albedo.jpg', normal='lattice_normal.png', nstr=1.4)
    M['dome'] = mat('dome', (1, 1, 1), 0.35, albedo='dome_albedo.jpg', normal='dome_normal.png', nstr=0.5)
    M['gold'] = mat('gold', (0.86, 0.66, 0.30), 0.25, 1.0)
    M['glass'] = mat('glass', (0.07, 0.09, 0.11), 0.08, 0.6, emit=(1.0, 0.72, 0.38), emit_str=0.0)
    M['glass_blue'] = mat('glass_blue', (0.12, 0.35, 0.7), 0.1, 0.2, emit=(0.25, 0.55, 1.0), emit_str=2.0)
    M['dark'] = mat('recess_dark', (0.16, 0.14, 0.12), 0.9)
    M['wood'] = mat('wood', (0.33, 0.2, 0.1), 0.45)
    M['bronze'] = mat('bronze', (0.18, 0.15, 0.12), 0.45, 0.8)
    M['lamp'] = mat('lamp_glow', (1, 0.95, 0.85), 0.3, emit=(1, 0.8, 0.5), emit_str=0.0)
    M['paving'] = mat('paving', (1, 1, 1), 0.35, albedo='paving_albedo.jpg')
    M['marble'] = mat('marble_white', (0.95, 0.94, 0.91), 0.18)
    M['water'] = mat('water', (0.05, 0.32, 0.45), 0.04, 0.1)
    M['mosaic'] = mat('mosaic', (1, 1, 1), 0.3, albedo='mosaic.jpg')
    M['grass'] = mat('grass', (0.27, 0.42, 0.16), 0.95)
    M['hedge'] = mat('hedge', (0.13, 0.26, 0.09), 0.95)
    M['flower'] = mat('flower', (0.72, 0.1, 0.38), 0.9)
    M['sand'] = mat('sand', (0.78, 0.69, 0.53), 0.98)
    M['road'] = mat('asphalt', (0.2, 0.2, 0.21), 0.9)
    M['trunk'] = mat('palm_trunk', (0.42, 0.34, 0.24), 0.95)
    M['frond'] = mat('palm_frond', (1, 1, 1), 0.7, albedo='frond.png', alpha_clip=True, double=True)
    M['sea'] = mat('sea', (0.03, 0.22, 0.32), 0.06, 0.1)
    M['tower_glass'] = mat('tower_glass', (0.35, 0.45, 0.55), 0.12, 0.7)
    M['city'] = mat('city', (0.75, 0.74, 0.72), 0.7)
    return M

# ---------------- geometry primitives ----------------
def link(obj, c):
    for uc in obj.users_collection:
        uc.objects.unlink(obj)
    c.objects.link(obj)
    return obj

def mesh_obj(name, bm, material, c):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me)
    c.objects.link(ob)
    if material:
        ob.data.materials.append(material)
    return ob

def box(name, x0, y0, z0, x1, y1, z1, material, c):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x = x0 + (v.co.x + .5) * (x1 - x0)
        v.co.y = y0 + (v.co.y + .5) * (y1 - y0)
        v.co.z = z0 + (v.co.z + .5) * (z1 - z0)
    return mesh_obj(name, bm, material, c)

def cyl(name, x, y, z0, z1, r, material, c, seg=32, r2=None, cap=True):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=cap, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=z1 - z0)
    bmesh.ops.translate(bm, verts=bm.verts, vec=(x, y, (z0 + z1) / 2))
    return mesh_obj(name, bm, material, c)

def sphere(name, x, y, z, r, material, c, seg=16, ring=10):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=ring, radius=r)
    bmesh.ops.translate(bm, verts=bm.verts, vec=(x, y, z))
    return mesh_obj(name, bm, material, c)

def arch_outline(w, hs, ha, n=14, kind='pointed'):
    """Closed outline (x,z) of an arch opening, base at z=0, springing hs, apex ha."""
    pts = [(-w / 2, 0.0), (-w / 2, hs)]
    def bez(p0, p1, p2, p3, t):
        return tuple((1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t * t * cc + t ** 3 * d
                     for a, b, cc, d in zip(p0, p1, p2, p3))
    if kind == 'round':
        for i in range(1, n):
            a = math.pi - i / n * math.pi / 2
            pts.append((w / 2 * math.cos(a), hs + (ha - hs) * math.sin(a)))
    else:
        P0, P1, P2, P3 = (-w / 2, hs), (-w / 2, hs + (ha - hs) * .62), (-w * .13, ha - (ha - hs) * .14), (0, ha)
        for i in range(1, n):
            pts.append(bez(P0, P1, P2, P3, i / n))
    pts.append((0, ha))
    right = [(-x, z) for (x, z) in reversed(pts[1:-1])]
    return pts + right + [(w / 2, 0.0)]

def prism_xz(bm, outline, y0, y1, ox=0, oz=0):
    """Add an extruded prism of a (x,z) outline between y0..y1 to bm."""
    a = [bm.verts.new((ox + x, y0, oz + z)) for x, z in outline]
    b = [bm.verts.new((ox + x, y1, oz + z)) for x, z in outline]
    bm.faces.new(a[::-1]); bm.faces.new(b)
    n = len(outline)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((a[i], a[j], b[j], b[i]))

def poly_xz(name, outline, y, material, c, ox=0, oz=0, flip=False):
    bm = bmesh.new()
    vs = [bm.verts.new((ox + x, y, oz + z)) for x, z in outline]
    bm.faces.new(vs if flip else vs[::-1])
    return mesh_obj(name, bm, material, c)

def boolean(target, cutter_bm, op='DIFFERENCE', solver='EXACT'):
    cme = bpy.data.meshes.new(target.name + '_cut')
    cutter_bm.to_mesh(cme); cutter_bm.free()
    cutter = bpy.data.objects.new(target.name + '_cut', cme)
    bpy.context.scene.collection.objects.link(cutter)
    mod = target.modifiers.new('bool', 'BOOLEAN')
    mod.operation = op; mod.object = cutter; mod.solver = solver
    dg = bpy.context.evaluated_depsgraph_get()
    ev = target.evaluated_get(dg)
    newme = bpy.data.meshes.new_from_object(ev)
    target.modifiers.clear()
    bmn = bmesh.new(); bmn.from_mesh(newme)
    bmesh.ops.remove_doubles(bmn, verts=bmn.verts, dist=1e-4)
    bmesh.ops.recalc_face_normals(bmn, faces=bmn.faces)
    bmn.to_mesh(newme); bmn.free()
    old = target.data
    target.data = newme
    bpy.data.meshes.remove(old)
    bpy.data.objects.remove(cutter); bpy.data.meshes.remove(cme)
    return target

def rotate_obj(ob, deg, pivot):
    R = Matrix.Translation(pivot) @ Matrix.Rotation(math.radians(deg), 4, 'Z') @ Matrix.Translation(-Vector(pivot))
    ob.data.transform(R)

def world_uv(ob, scale=4.0):
    """Box-project UVs in world units: 1 uv = scale metres."""
    me = ob.data
    if not me.uv_layers:
        me.uv_layers.new(name='UVMap')
    bm = bmesh.new(); bm.from_mesh(me)
    uv = bm.loops.layers.uv.active
    mw = ob.matrix_world
    for f in bm.faces:
        n = f.normal
        ax = max(range(3), key=lambda i: abs(n[i]))
        for l in f.loops:
            co = mw @ l.vert.co
            if ax == 0:
                u, v = co.y * (1 if n[0] > 0 else -1), co.z
            elif ax == 1:
                u, v = co.x * (-1 if n[1] > 0 else 1), co.z
            else:
                u, v = co.x, co.y
            l[uv].uv = (u / scale, v / scale)
    bm.to_mesh(me); bm.free()

def shade_flat(ob):
    for p in ob.data.polygons:
        p.use_smooth = False

def shade_smooth(ob):
    for p in ob.data.polygons:
        p.use_smooth = True

def join(objs, name):
    objs = [o for o in objs if o and o.type == 'MESH']
    if not objs:
        return None
    if len(objs) == 1:
        objs[0].name = name
        return objs[0]
    ctx = {'active_object': objs[0], 'selected_editable_objects': objs, 'object': objs[0],
           'selected_objects': objs}
    with bpy.context.temp_override(**ctx):
        bpy.ops.object.join()
    objs[0].name = name
    return objs[0]
