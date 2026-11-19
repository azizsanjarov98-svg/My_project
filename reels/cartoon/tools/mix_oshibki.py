"""Sound mix for «3 ошибки туристов в Дубае». All sources are Mixkit files in audio_src/.
Usage: mix.py out.wav"""
import numpy as np, subprocess, sys, os
SR = 44100; DUR = 44.0; N = int(SR * DUR)
SRC = os.path.join(os.path.dirname(__file__), '..', 'audio_src')
mix = np.zeros((N, 2)); mus = np.zeros((N, 2))
cache = {}
def load(name, af=''):
    key = (name, af)
    if key not in cache:
        cmd = ['ffmpeg', '-v', 'error', '-i', os.path.join(SRC, name + '.mp3')] + (['-af', af] if af else []) + ['-ac', '2', '-ar', str(SR), '-f', 'f32le', '-']
        cache[key] = np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32).reshape(-1, 2).astype(float)
    return cache[key]
def put(name, at, gain=1., dur=None, af='', fade=.02, off=0., bus=None, pan=0.):
    x = load(name, af)[int(off * SR):]
    if dur: x = x[:int(dur * SR)]
    x = x.copy(); f = int(fade * SR)
    if f and len(x) > 2 * f: x[:f] *= np.linspace(0, 1, f)[:, None]; x[-f:] *= np.linspace(1, 0, f)[:, None]
    x *= gain; x[:, 0] *= 1 - max(0, pan); x[:, 1] *= 1 + min(0, pan)
    i = int(at * SR); j = min(N, i + len(x))
    if i < N: (mix if bus is None else bus)[i:j] += x[:j - i]
MRRF = 'asetrate=44100*0.72,aresample=44100,volume=1.6'     # camel voice: horse snort pitched down
# ---- hook: airport
put('crowd_mall', 0.0, .22, dur=2.6, off=8, fade=.3)
put('impact', .2, .45, dur=1.2); put('whoosh', .5, .4)
# ---- mistake 1: no plan
put('sand_impact', 2.6, .8); put('pop', 2.95, .6)
put('crowd_mall', 2.6, .4, dur=5.4, off=3, fade=.3)
put('clock_fast', 3.3, .45); put('clock_fast', 5.0, .4); put('clock_fast', 6.4, .35, dur=1.0)
put('whoosh', 6.9, .3); put('snort', 7.95, .85, af=MRRF)
put('correct', 8.1, .55); put('magic', 8.12, .3)
for k in range(3): put('pop', 8.45 + k * .45, .65)
put('money_bag', 9.6, .7)
# ---- mistake 2: official site
put('sand_impact', 11.0, .8); put('pop', 11.35, .6)
put('city', 11.0, .15, dur=2.4, off=40, fade=.2)
put('click', 12.5, .7); put('correct', 12.55, .45)
put('whoosh', 15.2, .35); put('pop', 15.6, .6); put('magic', 16.2, .5); put('chewing', 16.4, .7, dur=.6); put('correct', 16.9, .5)
# ---- mistake 3: hotel desk
put('sand_impact', 19.0, .8); put('pop', 19.35, .6)
put('crowd_mall', 19.0, .14, dur=8.0, off=14, fade=.3)
for k in range(5): put('coins_handle', 19.6 + k * .38, .45, pan=.2)
put('money_bag', 21.8, .6); put('insect', 21.9, .6, dur=1.4)
put('whoosh', 23.0, .3); put('correct', 24.2, .55)
for k in range(3): put('pop', 24.55 + k * .45, .65)
put('snort', 26.2, .8, af=MRRF)
# ---- the fix + montage
put('msg_pop', 27.1, .8); put('msg_pop', 27.55, .8); put('magic', 28.0, .5)
for c in (28.6, 30.3, 32.0, 33.7): put('whoosh', c - .15, .4)
put('magic', 29.0, .4); put('windy_swoosh', 30.35, .5, dur=1.1); put('impact', 31.4, .35, dur=.8)
# ---- selfie + end
put('shutter', 37.0, .9); put('magic', 37.05, .4)
for at in (38.5, 39.2, 40.0, 40.7): put('pop', at, .6)
put('snort', 43.0, .9, af=MRRF)
# ---- music: «Lazy Camel» (Mixkit). Light in the routine, gone in the loops, back warm at the turn.
put('music_lazy_camel', 0.0, 1.0, dur=44.0, fade=.3, bus=mus)
t = np.arange(N) / SR
env = np.interp(t, [0, 2.6, 26.8, 27.2, 38.2, 38.6, 43.4, 44], [.6, .42, .42, .65, .65, .75, .75, 0])
mix += mus * env[:, None]
fade = np.clip(t / .05, 0, 1) * np.clip((DUR - t) / .5, 0, 1); mix *= fade[:, None]
pk = np.abs(mix).max(); mix = np.tanh(mix / pk * 1.4) / np.tanh(1.4) * .9
import wave
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype('<i2').tobytes())
print('ok')
