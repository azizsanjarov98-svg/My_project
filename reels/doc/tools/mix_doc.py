"""Sound for «Турист обыкновенный»: narration + Mixkit music/SFX, timed by the narration.
Usage: mix_doc.py out.wav"""
import numpy as np, subprocess, sys, os, json, re, wave
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(HERE, '..')
SRC = os.path.join(ROOT, '..', 'cartoon', 'audio_src')
T = json.load(open(os.path.join(ROOT, 'assets', 'vo_times.json')))
SR = 44100; DUR = T['_dur']; N = int(SR * DUR)
LINES = {k: v for k, v in re.findall(r"^\s+(\w+): '(.*)',$", open(os.path.join(ROOT, 'doc_shots.js')).read(), re.M)}
def words(k):
    ws = [w for w in LINES[k].split(' ') if w != '—']
    wt = [9 if re.search(r'\d', w) else max(1, len(re.findall('[аеёиоуыэюяАЕЁИОУЫЭЮЯ]', w))) + (.8 if re.search(r'[.,:]$', w) else 0) for w in ws]
    a, b = T[k]; tot = sum(wt); acc = 0; out = []
    for x in wt: out.append(a + (b - a) * acc / tot); acc += x
    return out
wAt = lambda k, i: words(k)[min(i, len(words(k)) - 1)]
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
    i = int(max(0, at) * SR); j = min(N, i + len(x))
    if i < N: (mix if bus is None else bus)[i:j] += x[:j - i]
MRRF = 'asetrate=44100*0.72,aresample=44100,volume=1.6'
PLOP = 'asetrate=44100*0.55,aresample=44100'
# cut points (same formulas as doc_shots.js)
s1b = T['species'][0] + 1.4; s2 = T['full'][0] - .15; s3 = T['peak'][0] - .2; ice = T['icecream'][0] - .1; s4 = T['m2'][0] - .2; tw = T['twitch'][0] - .15
s5 = T['m3'][0] - .2; s6 = T['nature'][0] - .25; s6b = T['knows'][0] - .15; s7 = T['tickets'][0] - .15; burj = wAt('tickets', 3) - .1; guide = T['guide'][0] - .15
aqua = T['all'][0] - .1; yacht = wAt('all', 1) - .05; safari = wAt('all', 2) - .05; grid = wAt('all', 3) - .05; s8 = T['rare'][0] - .3; s9 = T['cta'][0] - .35
# ambience
put('desert', 0, .35, dur=s2, off=4, fade=.8); put('city', s1b, .2, dur=s2 - s1b, off=20, fade=.3)
put('shutter', T['species'][1] - .05, .8); put('pop', T['species'][1] + .05, .5)
put('whoosh', wAt('species', 6) - .15, .35)
# mistake 1
put('sand_impact', wAt('full', 6), .8); put('impact', wAt('full', 6), .3, dur=.9); put('pop', wAt('full', 6) + .3, .5)
put('crowd_mall', s3, .4, dur=ice - s3, off=3, fade=.3); put('clock_fast', s3 + .2, .4); put('clock_fast', s3 + 1.6, .35, dur=1.0)
put('pop', wAt('icecream', 2) + .55, .9, af=PLOP); put('sand_impact', wAt('icecream', 2) + .6, .5)
# mistake 2
put('sand_impact', T['m2'][0], .8); put('pop', T['m2'][0] + .3, .5)
put('whoosh', wAt('m2', 6) - .1, .4); put('impact', wAt('m2', 6), .35, dur=.8)
put('click', wAt('m2', 7) + .05, .7); put('correct', wAt('m2', 7) + .3, .4)
put('whoosh', wAt('twitch', 1) - .1, .45); 
for k in range(5): put('click', wAt('twitch', 1) + .05 + k * .14, .35)
# mistake 3
put('sand_impact', T['m3'][0], .8); put('pop', T['m3'][0] + .3, .5)
put('crowd_mall', s5, .14, dur=s6 - s5, off=14, fade=.3)
for k in range(5): put('coins_handle', T['m3'][1] - .4 + k * .35, .45, pan=.2)
put('money_bag', wAt('wallet', 1), .7); put('insect', wAt('wallet', 2), .8, dur=s6 - wAt('wallet', 2) + .2)
# nature provides
put('desert', s6, .45, dur=s6b - s6, off=20, fade=.5); put('magic', wAt('nature', 6) - .3, .4)
put('snort', wAt('nature', 10) + .3, .85, af=MRRF)
put('chewing', s6b + .05, .7, dur=.5); put('whoosh', T['knows'][0] + .1, .35); put('msg_pop', T['knows'][1] - .2, .8)
# the fix
put('magic', T['tickets'][0] + .1, .5)
for k in range(4): put('pop', T['tickets'][0] + .3 + k * .12, .55)
put('correct', wAt('tickets', 4) - .1, .55); put('coins', wAt('tickets', 4), .5)
put('pop', wAt('guide', 0), .65); put('pop', wAt('guide', 3), .65)
for c in (aqua, yacht, safari): put('whoosh', c - .12, .45)
put('windy_swoosh', aqua, .4, dur=.8)
for k in range(4): put('pop', grid + .08 * k, .5)
# rare phenomenon + end
put('shutter', T['noerr'][0] - .05, .9); put('magic', T['noerr'][0], .4)
for at in (s9 + .05, s9 + .6, s9 + .9, s9 + 1.5): put('pop', at, .5)
put('snort', DUR - 1.3, .85, af=MRRF)
# music: oriental «Feast From The East» under the observation, «Lazy Camel» from the fix
put('music_feast_east', 0, 1., dur=s7 + .4, fade=.6, bus=mus)
put('music_lazy_camel', s7 - .1, 1., dur=DUR - s7 + .1, off=20, fade=.5, bus=mus)
t = np.arange(N) / SR
env = np.interp(t, [0, s7 - .3, s7, DUR - .6, DUR], [.55, .55, .75, .75, 0])
# narration + ducking
with wave.open(os.path.join(ROOT, 'assets', 'narration.wav')) as w:
    vr = w.getframerate(); v = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(float) / 32768
v = np.interp(np.arange(int(len(v) * SR / vr)) / SR, np.arange(len(v)) / vr, v); v = v / np.abs(v).max() * .9
vo = np.zeros(N); vo[:min(N, len(v))] = v[:N]
e = np.convolve(np.abs(vo), np.ones(int(.15 * SR)) / int(.15 * SR), 'same'); duck = 1 - .72 * np.clip(e / (e.max() * .22), 0, 1)
mix += mus * (env * duck)[:, None]
mix *= (1 - .45 * np.clip(e / (e.max() * .22), 0, 1))[:, None] * .9 + .1      # SFX sit a bit under the voice
mix /= max(np.abs(mix).max(), 1e-9); mix *= .5
mix += vo[:, None] * .95
mix *= (np.clip(t / .05, 0, 1) * np.clip((DUR - t) / .5, 0, 1))[:, None]
mix = np.tanh(mix * 1.25) / np.tanh(1.25)
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767 * .95).astype('<i2').tobytes())
print('ok', round(DUR, 2), len(LINES))
