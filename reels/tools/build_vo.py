"""Cut the break-separated TTS into phrases and re-space them to the edit's timing.
Usage: build_vo.py in.wav out.wav  -> prints phrase start/end times (seconds) as JSON."""
import numpy as np, wave, sys, json
src, dst = sys.argv[1], sys.argv[2]
with wave.open(src) as w:
    sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(float)
# phrase boundaries (speech spans) found with silencedetect -40 dB / 0.6 s
GAPS = [(0.89,2.28),(3.68,4.89),(6.30,7.70),(10.44,11.74),(12.95,14.07),(14.89,15.89),(16.82,17.82),(18.75,19.89),
        (20.21,21.30),(22.51,23.77),(24.58,25.64),(26.67,28.00),(30.02,31.02),(32.17,33.50),(33.85,34.46),(35.25,36.94),
        (37.45,38.88),(40.80,42.70),(44.32,45.58),(46.92,48.52),(49.33,50.33)]
end = len(x) / sr
spans = []; s = 0.0
for a, b in GAPS: spans.append((s, a)); s = b
spans.append((s, end))
NAMES = ['hook1','hook2','who1','who2','tk_title','tk1','tk2','tk3','tk4','tk5','tk6','tk7','chat1','chat2',
         'pay_title_a','pay_title_b','pay_cash','pay_foreign','pay_visa_mc','pay_ru','cta1','cta2']
assert len(spans) == len(NAMES), (len(spans), len(NAMES))
# silence after each phrase in the new edit
AFTER = {'hook1':.2,'hook2':.4,'who1':.2,'who2':.4,'tk_title':.3,'tk1':.85,'tk2':.95,'tk3':.85,'tk4':1.05,'tk5':.85,'tk6':.85,'tk7':.5,
         'chat1':.25,'chat2':.45,'pay_title_a':.08,'pay_title_b':.4,'pay_cash':.55,'pay_foreign':.15,'pay_visa_mc':.55,'pay_ru':.5,
         'cta1':.25,'cta2':2.2}
PAD = 0; out = [np.zeros(int(.3 * sr))]; t = .3; times = {}
for (a, b), n in zip(spans, NAMES):
    a = max(0, a - PAD); b = min(end, b + PAD)
    seg = x[int(a * sr):int(b * sr)].copy()
    # trim low-level edges (below -36 dBFS over 10 ms windows)
    win = int(.01 * sr); thr = 32768 * 10 ** (-36 / 20)
    rms = np.sqrt(np.convolve(seg ** 2, np.ones(win) / win, 'same'))
    idx = np.where(rms > thr)[0]
    if len(idx): seg = seg[max(0, idx[0] - int(.05 * sr)): idx[-1] + int(.08 * sr)]
    f = int(.01 * sr); seg[:f] *= np.linspace(0, 1, f); seg[-f:] *= np.linspace(1, 0, f)
    times[n] = [round(t + PAD, 3), round(t + len(seg) / sr - PAD, 3)]
    out.append(seg); t += len(seg) / sr
    out.append(np.zeros(int(AFTER[n] * sr))); t += AFTER[n]
y = np.concatenate(out)
with wave.open(dst, 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(y.astype('<i2').tobytes())
times['_dur'] = round(len(y) / sr, 3)
print(json.dumps(times))
