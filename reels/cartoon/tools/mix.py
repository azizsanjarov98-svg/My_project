"""Sound mix for «День 1. Снова». All sources are Mixkit files in audio_src/.
Usage: mix.py out.wav"""
import numpy as np, subprocess, sys, os
SR = 44100; DUR = 45.0; N = int(SR * DUR)
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
# ---- 1–2 alarm, «ДЕНЬ 1», again
put('alarm_classic', .1, .55, dur=.72)
put('money_bag', .8, .9); put('sand_impact', .9, .7)
put('rewind_fast', 1.4, .8, dur=.4)
put('alarm_classic', 1.75, .6, dur=1.25, fade=.005)
put('pop', 1.95, .8); put('sand_impact', 2.1, .6); put('sand_impact', 2.35, .7)
# ---- 3 bedroom run
put('city', 3.0, .18, dur=2.0, off=10, fade=.2)
put('whoosh', 3.15, .45); put('windy_swoosh', 3.6, .35, dur=1.2)
# ---- 4 queue noon→sunset
put('crowd_mall', 5.0, .45, dur=2.6, off=3, fade=.25)
put('clock_fast', 5.2, .5); put('clock_fast', 6.6, .4, dur=1.0)
# ---- 5 the stare: silence, blink, «мррф»
put('snort', 8.32, .9, af=MRRF)
# ---- 6 alarm 2
put('rewind_fast', 8.8, .8, dur=.25)
put('alarm_classic', 9.0, .6, dur=.3, fade=.005); put('money_bag', 9.3, 1.0); put('sand_impact', 9.35, .7)
# ---- 7 online purchase
put('city', 9.6, .15, dur=2.8, off=40, fade=.2)
put('click', 11.35, .7); put('correct', 11.45, .5)
# ---- 8 twitch + camel head
put('whoosh', 13.05, .35); put('chewing', 13.65, .9, dur=.55)
# ---- 9 alarm 3
put('rewind_fast', 14.2, .8, dur=.22); put('alarm_classic', 14.55, .6, dur=.45, fade=.002); put('sand_impact', 14.65, .6)
# ---- 10 lobby: bills, empty wallet, moth
put('crowd_mall', 15.0, .14, dur=3.6, off=14, fade=.2)
for k in range(5): put('coins_handle', 15.55 + k * .38, .45, pan=.2)
put('money_bag', 17.45, .6); put('insect', 17.6, .6, dur=1.0)
# ---- 11 pause + chew
put('chewing', 19.15, .9, dur=.6)
# ---- 12 storm
put('wind', 19.8, .9, dur=4.9, off=5, fade=.4); put('desert', 19.8, .4, dur=4.9, off=2, fade=.4)
put('storm_whoosh', 20.0, .55); put('sand_impact', 22.45, .5)
put('snort', 23.25, .7, af=MRRF); put('magic', 24.1, .45)
# ---- 13 phone glow
put('wind', 24.6, .35, dur=2.0, off=12, fade=.8); put('msg_pop', 25.1, .8)
# ---- 14 new morning
put('birds', 27.0, .5, dur=1.4); put('click', 27.35, .7); put('sand_impact', 27.8, .5); put('correct', 27.85, .55)
# ---- 15 montage
for c in (28.4, 30.15, 31.9, 33.65): put('whoosh', c - .15, .4)
for k in range(4): put('pop', 28.65 + k * .3, .7)
put('magic', 30.45, .5); put('windy_swoosh', 31.95, .5, dur=1.1); put('impact', 33.0, .35, dur=.8)
# ---- 16 selfie
put('shutter', 37.18, .9); put('magic', 37.25, .45)
# ---- 17 end card
for at in (39.1, 39.9, 40.8, 41.4): put('pop', at, .6)
put('snort', 44.15, .9, af=MRRF)
# ---- music: «Lazy Camel» (Mixkit). Light in the routine, gone in the loops, back warm at the turn.
put('music_lazy_camel', 0.0, 1.0, dur=8.8, fade=.3, bus=mus)
put('music_lazy_camel', 27.0, 1.0, dur=18.0, off=20, fade=.6, bus=mus)
t = np.arange(N) / SR
env = np.interp(t, [0, 7.4, 7.6, 8.8, 26.8, 27.0, 38.8, 39.2, 44.0, 45], [.55, .55, .12, 0, 0, .6, .6, .75, .75, .0])
mix += mus * env[:, None]
fade = np.clip(t / .05, 0, 1) * np.clip((DUR - t) / .5, 0, 1); mix *= fade[:, None]
pk = np.abs(mix).max(); mix = np.tanh(mix / pk * 1.4) / np.tanh(1.4) * .9
import wave
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype('<i2').tobytes())
print('ok')
