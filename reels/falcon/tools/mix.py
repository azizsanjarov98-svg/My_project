"""Sound for «Билет с неба» (Mixkit music + SFX). Usage: mix.py out.wav"""
import numpy as np, subprocess, sys, os, wave
SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'cartoon', 'audio_src')
SR = 44100; DUR = 20.17; N = int(SR * DUR)
mix = np.zeros((N, 2)); cache = {}
def load(path, af=''):
    if (path, af) not in cache:
        cmd = ['ffmpeg', '-v', 'error', '-i', path] + (['-af', af] if af else []) + ['-ac', '2', '-ar', str(SR), '-f', 'f32le', '-']
        cache[(path, af)] = np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32).reshape(-1, 2).astype(float)
    return cache[(path, af)]
def put(name, at, gain=1., dur=None, af='', fade=.02, off=0., pan=0., path=None):
    x = load(path or os.path.join(SRC, name + '.mp3'), af)[int(off * SR):]
    if dur: x = x[:int(dur * SR)]
    x = x.copy(); f = int(fade * SR)
    if f and len(x) > 2 * f: x[:f] *= np.linspace(0, 1, f)[:, None]; x[-f:] *= np.linspace(1, 0, f)[:, None]
    x *= gain; x[:, 0] *= 1 - max(0, pan); x[:, 1] *= 1 + min(0, pan)
    i = int(at * SR); j = min(N, i + len(x))
    if i < N: mix[i:j] += x[:j - i]
# music bed
put('music_serene_view', 0, .55, dur=DUR, fade=.6)
# the queue at the ticket kiosk (hot, bored crowd, ticking time)
put('city', 0, .16, dur=8.5, off=30, fade=.4); put('crowd_mall', 0, .22, dur=4.2, off=6, fade=.3)
put('clock_fast', .5, .28, dur=2.2)
# falcon arrives with the ticket (+1.6 s against the first cut)
put('whoosh', 3.95, .5, pan=.3); put('bird_flap', 4.15, .9)
put('magic', 5.7, .35); put('paper_quick', 5.8, .45)
put('bird_flap', 7.0, .6, pan=-.3)
# up to the deck
put('correct', 8.4, .35); put('windy_swoosh', 8.35, .3, dur=.9)
put('wind', 8.5, .12, dur=DUR - 8.5, off=8, fade=.6)
# falcon over the Palm
put('bird_flap', 12.8, .5, pan=.4); put('whoosh', 14.0, .35, pan=-.3)
# real footage room tone + end card
put(None, 15.9, .35, dur=4.2, off=15.2, fade=.2, path=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'view_palm.mp4'))
put('magic', 16.6, .3)
t = np.arange(N) / SR
mix *= (np.clip(t / .08, 0, 1) * np.clip((DUR - t) / .45, 0, 1))[:, None]
mix /= max(np.abs(mix).max(), 1e-9); mix = np.tanh(mix * 1.2) / np.tanh(1.2) * .92
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype('<i2').tobytes())
print('ok')
