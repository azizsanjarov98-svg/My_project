"""Sound for «Билет с неба» (Mixkit music + SFX). Usage: mix.py out.wav"""
import numpy as np, subprocess, sys, os, wave
SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'cartoon', 'audio_src')
SR = 44100; DUR = 25.73; N = int(SR * DUR)
mix = np.zeros((N, 2)); cache = {}
SRCV = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'view_palm.mp4')
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
# queue (wide) → sigh (close) → queue (wide)
put('city', 0, .16, dur=10.08, off=30, fade=.4); put('crowd_mall', 0, .22, dur=5.04, off=6, fade=.3)
put('clock_fast', .3, .28, dur=1.6)
# falcon arrives with the ticket
put('whoosh', 4.8, .5, pan=.3); put('bird_flap', 5.0, .9)
put('magic', 7.1, .35); put('paper_quick', 7.2, .45)
put('bird_flap', 8.4, .6, pan=-.3)
# up to the deck
put('correct', 9.98, .35); put('windy_swoosh', 9.95, .3, dur=.9)
put('wind', 10.08, .12, dur=DUR - 10.08, off=8, fade=.6)
# falcon over the Palm
put('bird_flap', 15.4, .5, pan=.4); put('whoosh', 16.6, .35, pan=-.3)
# real glass + end card
put(None, 19.12, .35, dur=4.6, off=15.0, fade=.3, path=SRCV)
put('magic', 19.8, .3)
t = np.arange(N) / SR
mix *= (np.clip(t / .08, 0, 1) * np.clip((DUR - t) / .45, 0, 1))[:, None]
mix /= max(np.abs(mix).max(), 1e-9); mix = np.tanh(mix * 1.2) / np.tanh(1.2) * .92
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype('<i2').tobytes())
print('ok')
