"""Re-space the narrator phrases to the edit. Usage: build_vo.py in.wav out.wav -> prints JSON timings."""
import numpy as np, wave, sys, json
with wave.open(sys.argv[1]) as w:
    sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(float)
GAPS = [(0.45,1.89),(5.73,7.05),(9.88,11.57),(13.14,13.94),(15.16,16.97),(18.06,19.38),(23.33,24.71),(25.86,27.17),(29.41,30.81),
        (32.73,34.28),(38.75,40.29),(41.40,42.69),(46.37,47.93),(50.21,51.79),(54.82,56.18),(58.33,59.55),(60.74,62.08)]
NAMES = ['dubai','species','full','peak','queue','icecream','m2','twitch','m3','wallet','nature','knows','tickets','guide','all','rare','noerr','cta']
AFTER = {'dubai':.5,'species':.6,'full':.35,'peak':.25,'queue':.3,'icecream':.6,'m2':.45,'twitch':.6,'m3':.35,'wallet':.6,'nature':.35,'knows':.5,
         'tickets':.35,'guide':.35,'all':.6,'rare':.35,'noerr':.5,'cta':2.4}
end = len(x) / sr; spans = []; s = 0.0
for a, b in GAPS: spans.append((s, a)); s = b
spans.append((s, end)); assert len(spans) == len(NAMES)
out = [np.zeros(int(.8 * sr))]; t = .8; T = {}
for (a, b), n in zip(spans, NAMES):
    seg = x[int(a * sr):int(b * sr)].copy()
    win = int(.01 * sr); thr = 32768 * 10 ** (-38 / 20)
    rms = np.sqrt(np.convolve(seg ** 2, np.ones(win) / win, 'same')); idx = np.where(rms > thr)[0]
    if len(idx): seg = seg[max(0, idx[0] - int(.04 * sr)): idx[-1] + int(.1 * sr)]
    f = int(.008 * sr); seg[:f] *= np.linspace(0, 1, f); seg[-f:] *= np.linspace(1, 0, f)
    T[n] = [round(t, 3), round(t + len(seg) / sr, 3)]
    out += [seg, np.zeros(int(AFTER[n] * sr))]; t += len(seg) / sr + AFTER[n]
y = np.concatenate(out)
with wave.open(sys.argv[2], 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(y.astype('<i2').tobytes())
T['_dur'] = round(len(y) / sr, 3); print(json.dumps(T))
