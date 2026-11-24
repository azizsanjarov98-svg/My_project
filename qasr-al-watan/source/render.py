import bpy, sys, math, os
from mathutils import Vector
args=sys.argv[sys.argv.index('--')+1:]
blend, outdir = args[0], args[1]; views=args[2].split(',') if len(args)>2 else ['hero','aerial','oblique']
samples=int(args[3]) if len(args)>3 else 24
bpy.ops.wm.open_mainfile(filepath=blend)
sc=bpy.context.scene
sc.render.engine='CYCLES'; sc.cycles.device='CPU'; sc.cycles.samples=samples; sc.cycles.use_denoising=True
sc.render.resolution_x=1280; sc.render.resolution_y=720
sc.cycles.max_bounces=6
sc.view_settings.view_transform='AgX'; sc.view_settings.look='AgX - Medium High Contrast' if 'AgX - Medium High Contrast' in [l for l in []] else 'None'
w=bpy.data.worlds.new('W'); sc.world=w; w.use_nodes=True
nt=w.node_tree; bg=nt.nodes['Background']; sky=nt.nodes.new('ShaderNodeTexSky')
try: sky.sky_type='NISHITA'
except Exception: 
    try: sky.sky_type='SINGLE_SCATTERING'
    except Exception: pass
sky.sun_elevation=math.radians(38); sky.sun_rotation=math.radians(150)
nt.links.new(sky.outputs[0],bg.inputs[0]); bg.inputs[1].default_value=0.35
sun=bpy.data.lights.new('sun','SUN'); sun.energy=4.2; sun.angle=math.radians(.6)
so=bpy.data.objects.new('sun',sun); sc.collection.objects.link(so)
so.rotation_euler=(math.radians(90-38),0,math.radians(150+90))
V={'gh':((14,57,4),(-4,92,24),18),'sp':((-62,102,3.5),(-72,112,13),16),'bq':((-108,104,3),(-130,140,5),20),'kn':((90,104,4),(60,130,2),20),'gf':((142,104,4),(115,140,2),20),'bz':((-48,140,3),(-90,160,3),20),'hero':((0,-205,3),(0,40,22),35),'aerial':((330,-420,260),(0,-40,10),35),'oblique':((-150,-190,8),(-20,40,22),40),
   'gate':((-110,-215,2),(-150,-212,10),55),'garden':((40,-480,6),(0,-260,8),45),'back':((260,300,140),(0,60,15),35)}
for v in views:
    p,t,lens=V[v]
    cam=bpy.data.cameras.new(v); cam.lens=lens; cam.clip_end=8000
    co=bpy.data.objects.new(v,cam); sc.collection.objects.link(co); co.location=p
    d=Vector(t)-Vector(p); co.rotation_euler=d.to_track_quat('-Z','Y').to_euler()
    sc.camera=co; sc.render.filepath=os.path.join(outdir,'r_%s.png'%v)
    bpy.ops.render.render(write_still=True); print('rendered',v)
