"""Sound for «Друг в Дубае»: wordless comedy. Music stops on every reveal (pause = punchline).
Usage: mix_friend.py out.wav"""
import numpy as np, subprocess, sys, os, wave
SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'cartoon', 'audio_src')
SR = 44100; DUR = 38.4; N = int(SR * DUR)
mix = np.zeros((N, 2)); mus = np.zeros((N, 2)); cache = {}
def load(name, af=''):
    if (name, af) not in cache:
        cmd = ['ffmpeg', '-v', 'error', '-i', os.path.join(SRC, name + '.mp3')] + (['-af', af] if af else []) + ['-ac', '2', '-ar', str(SR), '-f', 'f32le', '-']
        cache[(name, af)] = np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32).reshape(-1, 2).astype(float)
    return cache[(name, af)]
def put(name, at, gain=1., dur=None, af='', fade=.02, off=0., bus=None, pan=0.):
    x = load(name, af)[int(off * SR):]
    if dur: x = x[:int(dur * SR)]
    x = x.copy(); f = int(fade * SR)
    if f and len(x) > 2 * f: x[:f] *= np.linspace(0, 1, f)[:, None]; x[-f:] *= np.linspace(1, 0, f)[:, None]
    x *= gain; x[:, 0] *= 1 - max(0, pan); x[:, 1] *= 1 + min(0, pan)
    i = int(at * SR); j = min(N, i + len(x))
    if i < N: (mix if bus is None else bus)[i:j] += x[:j - i]
MRRF = 'asetrate=44100*0.72,aresample=44100,volume=1.6'
R1, R2, R3, R4, MON, FIN, END = 0, 6.2, 11.9, 17.6, 24.4, 30.8, 34.6
# round 1 · balcony
put('birds', 0, .35, dur=6.2, fade=.4); put('city', 0, .12, dur=6.2, off=30, fade=.4)
put('pop', .4, .6); put('whoosh', 1.7, .4); put('pop', 2.3, .45)
put('chewing', 2.6, .8, dur=.7); put('paper_slide', 3.9, .8); put('pop', 5.0, .5)
# round 2 · marina
put('city', R2, .15, dur=5.7, off=50, fade=.3)
put('pop', R2 + .3, .6); [put('click', R2 + 1.1 + k * .16, .5) for k in range(4)]
put('whoosh', R2 + 1.95, .5); put('chewing', R2 + 3.3, .8, dur=.6); put('paper_quick', R2 + 3.7, .8); put('whoosh', R2 + 4.0, .4)
# round 3 · Burj
put('windy_swoosh', R3, .45, dur=1.3); put('pop', R3 + 1.4, .55); put('pop', R3 + 2.0, .7); put('magic', R3 + 2.0, .35)
put('snort', R3 + 3.6, .85, af=MRRF); put('paper_slide', R3 + 4.6, .8)
# round 4 · the test
put('city', R4, .14, dur=2.4, off=70, fade=.3); put('clock_fast', R4 + 1.0, .45, dur=1.4)
put('pop', R4 + 1.15, .55); put('race_speedup', R4 + 1.4, .5, dur=1.0, fade=.2)
put('car_driveby', R4 + 2.25, .8); put('impact', R4 + 2.4, .35, dur=1.0); put('chewing', R4 + 3.0, .7, dur=.4)
put('pop', R4 + 3.45, .6); put('correct', R4 + 3.5, .45); put('magic', R4 + 4.1, .35)
# montage · torn tickets
for i in range(4): put('paper_quick', MON + i * 1.6, .8); put('whoosh', MON + i * 1.6 - .1, .35)
put('windy_swoosh', MON + .1, .4, dur=1.2); put('impact', MON + 1.35, .25, dur=.6); put('race_speedup', MON + 4.85, .5, dur=1.3)
# finale + end
put('desert', FIN, .35, dur=END - FIN + 1, off=10, fade=.6); put('magic', FIN + .6, .3)
for k in range(5): put('pop', END + .4 + k * .08, .45)
put('pop', END + 1.0, .5); put('snort', DUR - 1.2, .85, af=MRRF)
# music: «Lazy Camel», cut out on every reveal, back on the beat after the punchline
put('music_lazy_camel', 0, 1., dur=DUR, fade=.4, bus=mus)
t = np.arange(N) / SR
K = [(0, .55), (2.25, .55), (2.35, 0), (3.85, 0), (4.0, .55),
     (R2 + 1.9, .55), (R2 + 2.0, 0), (R2 + 3.6, 0), (R2 + 3.75, .55),
     (R3 + 1.95, .55), (R3 + 2.05, 0), (R3 + 4.4, 0), (R3 + 4.55, .55),
     (R4 + 1.0, .3), (R4 + 2.35, .3), (R4 + 2.4, 0), (R4 + 3.4, 0), (R4 + 3.45, .7),
     (FIN, .7), (DUR - .5, .7), (DUR, 0)]
env = np.interp(t, [k[0] for k in K], [k[1] for k in K])
mix /= max(np.abs(mix).max(), 1e-9); mix *= .75
mix += mus * env[:, None] * .8
mix *= (np.clip(t / .05, 0, 1) * np.clip((DUR - t) / .5, 0, 1))[:, None]
mix = np.tanh(mix * 1.3) / np.tanh(1.3)
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767 * .95).astype('<i2').tobytes())
print('ok')
