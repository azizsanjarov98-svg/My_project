"""Synthesise the soundtrack for aziz_reels_v2: 120 BPM groove + SFX synced to the cuts."""
import numpy as np, wave, sys
SR = 44100; DUR = 20.5; N = int(SR * DUR); BEAT = .5
rng = np.random.default_rng(7)
L = np.zeros(N); R = np.zeros(N)
t_all = np.arange(N) / SR

def put(sig, at, gain=1., pan=0.):
    i = int(at * SR); j = min(N, i + len(sig))
    if i >= N or j <= i: return
    s = sig[:j - i] * gain
    L[i:j] += s * (1 - max(0, pan)); R[i:j] += s * (1 + min(0, pan))

def env(n, a=.005, d=.2):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / d)

def onepole_lp(x, fc):
    fc = np.broadcast_to(fc, x.shape)
    a = np.exp(-2 * np.pi * fc / SR); y = np.zeros_like(x); z = 0.
    for i in range(len(x)): z = (1 - a[i]) * x[i] + a[i] * z; y[i] = z
    return y

# --- drums ---
def kick():
    n = int(.45 * SR); t = np.arange(n) / SR
    f = 45 + 110 * np.exp(-t * 28); ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 7) + .3 * np.sin(ph * 2) * np.exp(-t * 30)
def clap():
    n = int(.25 * SR); x = rng.standard_normal(n); x = np.diff(x, prepend=0)
    e = env(n, .002, .07); e[:int(.01 * SR)] *= (1 + np.sin(np.arange(int(.01 * SR)) * .02))
    return x * e * .5
def hat(d=.035):
    n = int(.12 * SR); x = np.diff(np.diff(rng.standard_normal(n), prepend=0), prepend=0)
    return x * env(n, .001, d) * .18
K, CL, HT = kick(), clap(), hat()

DROP, END = 2.5, 17.5
for b in range(int(DUR / BEAT)):
    t = b * BEAT
    if DROP <= t < 20.0: put(K, t, .9)
    if DROP <= t < END and b % 2 == 1: put(CL, t, .55)
    if t < 20.0: put(HT, t + BEAT / 2, .7 if t >= DROP else .45, pan=.2)
    if DROP <= t < END: put(hat(.015), t + BEAT / 4, .35, pan=-.25); put(hat(.015), t + 3 * BEAT / 4, .3, pan=-.25)

# sidechain envelope (pump on each kick)
sc = np.ones(N)
for b in range(int(DROP / BEAT), int(20 / BEAT)):
    i = int(b * BEAT * SR); n = int(.3 * SR); j = min(N, i + n)
    sc[i:j] = np.minimum(sc[i:j], 1 - .75 * np.exp(-np.arange(j - i) / SR * 9)[: j - i])

# --- harmony: Am – F – C – G, one chord per bar (2 s) ---
mtof = lambda m: 440 * 2 ** ((m - 69) / 12)
CH = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]
ROOT = [45, 41, 48, 43]
pad = np.zeros(N); bass = np.zeros(N); arp = np.zeros(N)
for bar in range(11):
    t0 = bar * 2.0; i = int(t0 * SR); j = min(N, int((t0 + 2) * SR)); t = np.arange(j - i) / SR
    if i >= N: break
    c = CH[bar % 4]
    for m in c:
        for det in (-.07, .07):
            f = mtof(m + 12 + det)
            pad[i:j] += sum(np.sin(2 * np.pi * f * h * t) / h ** 1.6 for h in range(1, 6)) * .045
    if t0 >= DROP - .01:
        for k in range(4):  # off-beat bass, house style
            s = t0 + k * BEAT + BEAT / 2; n = int(.22 * SR); tt = np.arange(n) / SR
            f = mtof(ROOT[bar % 4] - 12 + 12)
            note = (np.sin(2 * np.pi * f * tt) + .35 * np.sin(4 * np.pi * f * tt)) * env(n, .004, .12)
            ii = int(s * SR); jj = min(N, ii + n)
            if ii < N: bass[ii:jj] += note[: jj - ii] * .5
    # pluck arpeggio, 8th notes
    seq = [c[0] + 24, c[1] + 24, c[2] + 24, c[1] + 24, c[0] + 36, c[2] + 24, c[1] + 24, c[2] + 12]
    for k, m in enumerate(seq):
        s = t0 + k * .25
        if s >= DUR: break
        n = int(.3 * SR); tt = np.arange(n) / SR; f = mtof(m)
        note = (np.sin(2 * np.pi * f * tt) + .4 * np.sin(4 * np.pi * f * tt) * np.exp(-tt * 20)) * env(n, .002, .09)
        ii = int(s * SR); jj = min(N, ii + n)
        if ii < N: arp[ii:jj] += note[: jj - ii] * (.10 if t0 >= DROP else .06)

# intro filter on pad: muffled before the drop, opens up
fc = np.where(t_all < DROP, 500 + 2500 * (t_all / DROP) ** 2, 6000)
pad = onepole_lp(pad, fc)
mus = (pad * .9 + bass) * sc + arp * (.6 + .4 * sc)
L += mus; R += mus
# arp ping-pong feel
d = int(.375 * SR); R[d:] += arp[:-d] * .35; L[2 * d:] += arp[:-2 * d] * .2

# --- SFX ---
def whoosh(d=.45, up=True):
    n = int(d * SR); x = rng.standard_normal(n); t = np.arange(n) / SR
    fc = 300 + 5000 * ((t / d) if up else (1 - t / d)) ** 2
    y = onepole_lp(x, fc); y = y - onepole_lp(y, 150)
    e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2 if up else np.exp(-t * 8)
    return y * e * .9
def impact():
    n = int(1.2 * SR); t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * (40 + 60 * np.exp(-t * 15)) * t) * np.exp(-t * 3.5)
    nz = onepole_lp(rng.standard_normal(n), 2500) * np.exp(-t * 10) * .6
    return boom + nz
def pop(f=900):
    n = int(.12 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * (f + 900 * t / .12) * t) * env(n, .001, .03) * .6
def ding(f=1318.5):
    n = int(.8 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * f * 2.01 * t) + .2 * np.sin(2 * np.pi * f * 3 * t)) * env(n, .002, .25) * .35
def riser(d=2.0):
    n = int(d * SR); t = np.arange(n) / SR
    x = onepole_lp(rng.standard_normal(n), 200 + 7000 * (t / d) ** 3)
    tone = np.sin(2 * np.pi * np.cumsum(200 + 600 * (t / d) ** 2) / SR) * .25
    return (x + tone) * (t / d) ** 2 * .7

CUTS = [2.5, 5.0, 11.0, 15.0, 17.5]
put(riser(2.2), DROP - 2.2, .55)
for c in CUTS:
    put(whoosh(.45), c - .42, .5, pan=-.3); put(impact(), c, .75)
for i in range(7):            # service cards slam in on each beat
    put(whoosh(.25, up=False), 6.0 + i * .5, .35, pan=(.4 if i % 2 else -.4)); put(pop(700 + i * 60), 6.05 + i * .5, .5)
for i in range(7): put(pop(1000 + i * 80), 9.5 + i * .05, .3)        # recap ring
put(ding(1046.5), 9.75, .6)
for s in (11.75, 12.45, 13.15, 13.85): put(pop(1200), s, .55)     # chat bubbles
put(pop(600), 11.5, .5); put(pop(650), 13.6, .5)                   # stickers
put(ding(1318.5), 15.8, .7); put(ding(1568), 16.15, .7)            # checks on cards
put(impact(), 16.25, .55)                                          # stamp
put(ding(1760), 18.4, .5); put(pop(800), 18.05, .5)                # end card

# fades + master
fade = np.clip(t_all / .05, 0, 1) * np.clip((DUR - t_all) / 1.2, 0, 1)
L *= fade; R *= fade
mx = max(np.abs(L).max(), np.abs(R).max())
L = np.tanh(L / mx * 1.6) / np.tanh(1.6) * .89; R = np.tanh(R / mx * 1.6) / np.tanh(1.6) * .89
out = np.stack([L, R], 1)
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((out * 32767).astype('<i2').tobytes())
print('ok', sys.argv[1])
