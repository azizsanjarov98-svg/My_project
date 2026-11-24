import numpy as np, math, os, sys
from PIL import Image, ImageDraw, ImageFilter
OUT=sys.argv[1]; os.makedirs(OUT,exist_ok=True)
rng=np.random.default_rng(7)
def save(a,name,q=88):
    im=Image.fromarray(np.clip(a,0,255).astype(np.uint8)); 
    if name.endswith('.png'): im.save(os.path.join(OUT,name),optimize=True)
    else: im.save(os.path.join(OUT,name),quality=q,optimize=True)
def noise(n,oct=5,seed=1):
    r=np.random.default_rng(seed); acc=np.zeros((n,n)); amp=1; tot=0
    for o in range(oct):
        s=2**(o+2); g=r.random((s,s)); g=np.array(Image.fromarray((g*255).astype(np.uint8)).resize((n,n),Image.BICUBIC))/255.
        acc+=g*amp; tot+=amp; amp*=.5
    return acc/tot
def normal_from_height(h,strength=2.0):
    gy,gx=np.gradient(h); nx=-gx*strength; ny=-gy*strength; nz=np.ones_like(h)
    l=np.sqrt(nx**2+ny**2+nz**2); n=np.stack([nx/l,-ny/l,nz/l],-1)
    return (n*.5+.5)*255
# 1 limestone: 1 uv unit = 4 m ; courses 0.8 m -> 5 rows ; blocks 1.6 m
N=1024
n=noise(N,6,3); h=np.ones((N,N))*.6
rows=5; rh=N//rows
for r in range(rows):
    y=r*rh; h[y:y+3,:]=0.25
    off=(r%2)*(N//5)
    for c in range(0,N,N*2//5):
        x=(c+off)%N; h[y:y+rh,x:x+3]=0.25
h=np.array(Image.fromarray((h*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2)))/255.
base=np.array([239,234,224.])
alb=base[None,None,:]*(0.94+0.08*n[...,None]) - (0.6-h[...,None])*40
save(alb,'stone_albedo.jpg'); save(normal_from_height(h+n*.08,6),'stone_normal.png')
# 2 paving: 1 uv unit = 24 m. Star grid of light marble with granite bands
N=2048; img=Image.new('RGB',(N,N),(232,226,215)); d=ImageDraw.Draw(img)
mar=noise(N,6,11); 
G=(118,113,108); bw=int(N*0.012)
def star(cx,cy,R,r,rot=0):
    return [(cx+math.cos(rot+i*math.pi/8)*(R if i%2==0 else r), cy+math.sin(rot+i*math.pi/8)*(R if i%2==0 else r)) for i in range(16)]
S=N//2
for gx in range(-1,3):
    for gy in range(-1,3):
        cx,cy=gx*S+S/2,gy*S+S/2
        d.polygon(star(cx,cy,S*.47,S*.36,math.pi/8),outline=G,width=bw)
        d.polygon(star(cx,cy,S*.2,S*.15,math.pi/8),fill=(208,200,188),outline=G,width=bw//2)
        d.ellipse([cx-S*.04,cy-S*.04,cx+S*.04,cy+S*.04],fill=G)
        # lozenges between stars
        for (dx,dy) in [(S/2,0),(0,S/2)]:
            x,y=cx+dx,cy+dy; L=S*.12
            d.polygon([(x-L,y),(x,y-L),(x+L,y),(x,y+L)],fill=(150,144,137),outline=G,width=bw//2)
for i in range(0,N+1,S): d.line([(i,0),(i,N)],fill=G,width=bw); d.line([(0,i),(N,i)],fill=G,width=bw)
a=np.array(img).astype(float); a*= (0.93+0.1*mar[...,None])
veins=noise(N,7,21); a-= (np.abs(np.sin(veins*40))<0.04)[...,None]*12
save(a,'paving_albedo.jpg',85)
# 3 dome arabesque: u around (8 sectors), v base->top
W,H=2048,1024; img=Image.new('RGB',(W,H),(246,244,239)); d=ImageDraw.Draw(img)
LG=(176,170,160); GO=(201,160,72)
def curve(pts,col,w):
    d.line(pts,fill=col,width=w,joint='curve')
sec=8; sw=W/sec
for s in range(sec):
    x0=s*sw; cx=x0+sw/2
    # ogee arch outline from base to apex area
    pts=[]
    for t in np.linspace(0,1,80):
        y=H*(0.10+0.70*t); xo=sw*0.46*(1-t**1.6)*(1+0.25*math.sin(t*math.pi*1.2))
        pts.append((cx-xo,H-y))
    pts2=[(2*cx-x,y) for (x,y) in pts]
    curve(pts,LG,7); curve(pts2,LG,7)
    # inner scroll spirals
    for side in (-1,1):
        sp=[]
        for t in np.linspace(0,4.2,120):
            r=sw*0.16*math.exp(-0.33*t); sp.append((cx+side*(sw*0.18)+side*r*math.cos(t), H-(H*0.38+r*math.sin(t)*1.6)))
        curve(sp,LG,5)
        sp=[]
        for t in np.linspace(0,3.6,100):
            r=sw*0.10*math.exp(-0.35*t); sp.append((cx+side*(sw*0.12)+side*r*math.cos(t+math.pi), H-(H*0.62+r*math.sin(t)*1.4)))
        curve(sp,GO,4)
    # medallion teardrop
    md=[(cx+sw*0.07*math.sin(t)*(1-0.5*math.cos(t)), H-(H*0.50+ H*0.09*(-math.cos(t)))) for t in np.linspace(0,2*math.pi,60)]
    d.polygon(md,outline=GO,width=4); d.ellipse([cx-10,H-H*0.5-10,cx+10,H-H*0.5+10],fill=GO)
    # small leaf motifs between sectors
    lx=x0; 
    for k in range(3):
        y=H-(H*(0.18+k*0.2)); d.polygon([(lx,y-26),(lx+10,y),(lx,y+26),(lx-10,y)],fill=LG)
# gold base band + lines
d.rectangle([0,H-int(H*0.065),W,H],fill=GO); d.rectangle([0,H-int(H*0.085),W,H-int(H*0.078)],fill=GO)
d.rectangle([0,0,W,int(H*0.04)],fill=GO)
a=np.array(img.filter(ImageFilter.GaussianBlur(0.8))).astype(float); save(a,'dome_albedo.jpg',90)
hgt=1-np.array(img.convert('L').filter(ImageFilter.GaussianBlur(1.5)))/255.; save(normal_from_height(hgt,3),'dome_normal.png')
# 4 carved lattice (spandrels/panels) 512 tile
N=512; img=Image.new('L',(N,N),40); d=ImageDraw.Draw(img); s=N/4
for i in range(5):
    for j in range(5):
        cx,cy=i*s,j*s; d.polygon(star(cx,cy,s*.5,s*.36),outline=230,width=7); d.polygon(star(cx,cy,s*.22,s*.15),fill=230)
        d.polygon(star(cx+s/2,cy+s/2,s*.16,s*.11),outline=230,width=5)
hh=np.array(img.filter(ImageFilter.GaussianBlur(2)))/255.
alb=np.stack([228+hh*14,221+hh*14,206+hh*14],-1); save(alb,'lattice_albedo.jpg'); save(normal_from_height(hh,5),'lattice_normal.png')
# 5 palm frond with alpha (leaflets)
W,H=1024,256; img=Image.new('RGBA',(W,H),(0,0,0,0)); d=ImageDraw.Draw(img)
d.line([(0,H/2),(W,H/2)],fill=(96,88,52,255),width=8)
for x in range(20,W-10,9):
    t=x/W; L=(H*0.48)*(math.sin(t*math.pi)**0.6)*(1-0.35*t); 
    for sgn in (-1,1):
        col=(int(78+30*rng.random()),int(110+30*rng.random()),int(48+15*rng.random()),255)
        d.line([(x,H/2),(x+L*0.55,H/2+sgn*L)],fill=col,width=4)
save(np.array(img),'frond.png')
# 6 mosaic band
W,H=512,64; img=Image.new('RGB',(W,H),(40,46,84)); d=ImageDraw.Draw(img)
for x in range(0,W,32):
    d.polygon(star(x+16,32,15,9),fill=(205,165,80)); d.polygon(star(x+16,32,7,4),fill=(122,62,128)); d.rectangle([x,0,x+32,5],fill=(60,170,170)); d.rectangle([x,58,x+32,64],fill=(60,170,170))
save(np.array(img),'mosaic.jpg')
# 7 interior marble floor medallion (1 uv = whole hall)
N=2048; img=Image.new('RGB',(N,N),(241,237,229)); d=ImageDraw.Draw(img); c=N/2
for r in range(80,1000,90): d.ellipse([c-r,c-r,c+r,c+r],outline=(184,154,98),width=6)
d.polygon(star(c,c,620,430),outline=(160,128,70),width=10); d.polygon(star(c,c,300,210),fill=(214,192,140),outline=(160,128,70),width=8)
d.polygon(star(c,c,120,80),fill=(120,96,52))
for i in range(0,N,N//8): d.line([(i,0),(i,N)],fill=(220,212,198),width=3); d.line([(0,i),(N,i)],fill=(220,212,198),width=3)
a=np.array(img).astype(float)*(0.95+0.06*noise(N,6,5)[...,None]); save(a,'floor_great.jpg',86)
# 8 interior dome (gold geometric), u around, v base->top
W,H=2048,1024; img=Image.new('RGB',(W,H),(246,236,210)); d=ImageDraw.Draw(img)
for i in range(32):
    x=i*W/32; d.line([(x,0),(x,H)],fill=(190,150,70),width=4)
    for j in range(1,10):
        y=H-j*H/10; sc=1-j/13; cx=x+W/64; d.polygon(star(cx,y,W/64*.8*sc,W/64*.5*sc),outline=(178,138,60),width=3)
d.rectangle([0,H-60,W,H],fill=(214,186,120)); 
for i in range(0,W,24): d.polygon([(i,H-60),(i+12,H-84),(i+24,H-60)],fill=(196,160,88))
save(np.array(img),'dome_interior.jpg',88)
# 9 carpet patterns
def carpet(name,c1,c2,c3):
    N=1024; img=Image.new('RGB',(N,N),c1); d=ImageDraw.Draw(img)
    for k in range(4): d.rectangle([30+k*28,30+k*28,N-30-k*28,N-30-k*28],outline=c2 if k%2==0 else c3,width=10)
    for i in range(3):
        for j in range(3):
            cx,cy=N*(i+.5)/3,N*(j+.5)/3; d.polygon(star(cx,cy,120,80),outline=c2,width=8); d.polygon(star(cx,cy,50,32),fill=c3)
    save(np.array(img),name)
carpet('carpet_blue.jpg',(28,44,86),(201,162,74),(120,150,200))
carpet('carpet_red.jpg',(110,32,38),(214,180,106),(40,60,90))
carpet('carpet_dark.jpg',(24,28,40),(150,120,66),(70,80,110))
# 10 bookshelf
W,H=512,512; img=Image.new('RGB',(W,H),(70,46,26)); d=ImageDraw.Draw(img)
for r in range(6):
    y=r*H/6; d.rectangle([0,y,W,y+8],fill=(92,62,34))
    x=4
    while x<W-6:
        w=int(6+rng.random()*10); col=[(122,46,46),(46,79,123),(201,162,74),(47,93,58),(232,220,194),(75,46,91)][int(rng.random()*6)]
        d.rectangle([x,y+12+rng.random()*10,x+w-2,y+H/6-2],fill=col); x+=w
save(np.array(img),'books.jpg')
print('ok')
