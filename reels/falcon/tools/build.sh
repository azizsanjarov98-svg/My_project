#!/bin/bash
# «Билет с неба» — 30 s edit from existing clips only.
# queue → close-up sigh ⇢(dissolve) smooth pull-back → falcon → REAL deck pan → Anya on deck → falcon over the Palm → REAL binocular → REAL glass + end card
set -e
cd "$(dirname "$0")/.."
OUT=${1:-falcon_reel_silent.mp4}
V='scale=-2:1920:flags=lanczos,crop=1080:1920,fps=30,setsar=1,eq=saturation=1.06:contrast=1.03'
R='scale=1080:1920:flags=lanczos,fps=30,setsar=1,eq=saturation=1.1:contrast=1.04,colorbalance=rh=.03:bh=-.02'
# smooth pull-back: 63 frames, smoothstep ease-in-out, path kept inside the frame so it never sticks to an edge
N=62
E="((on/$N)*(on/$N)*(3-2*on/$N))"
ffmpeg -loglevel error -y \
 -ss 0.2 -t 2.2 -i clips/c0_queue.mp4 \
 -ss 0.0 -t 2.6 -i clips/c05_sigh_close.mp4 \
 -ss 2.6 -t 2.1 -i clips/c0_queue.mp4 \
 -ss 0.3 -t 4.7 -i clips/c2_ticket.mp4 \
 -ss 0.0 -t 3.2 -i src/view_palm.mp4 \
 -ss 0.0 -t 4.6 -i clips/c3_deck.mp4 \
 -ss 0.0 -t 4.0 -i clips/c4_falcon_glass.mp4 \
 -ss 10.8 -t 2.4 -i src/view_palm.mp4 \
 -ss 15.0 -t 4.6 -i src/view_palm.mp4 \
 -loop 1 -t 30.1 -i clips/title.png \
 -loop 1 -t 30.1 -i clips/logo_card.png \
 -loop 1 -t 30.1 -i clips/logo_corner.png \
 -filter_complex "
 [0:v]$V,setpts=PTS-STARTPTS[a];
 [1:v]$V,setpts=PTS-STARTPTS[b];
 [2:v]fps=30,setpts=PTS-STARTPTS,scale=2880:5104:flags=lanczos,zoompan=z='1.9-0.9*$E':x='iw*(0.265+0.235*$E)-iw/zoom/2':y='ih*(0.55-0.05*$E)-ih/zoom/2':d=1:s=1080x1920:fps=30,setsar=1,eq=saturation=1.06:contrast=1.03[c];
 [b][c]xfade=transition=fade:duration=0.35:offset=2.25[bc];
 [3:v]$V,setpts=PTS-STARTPTS[d];
 [4:v]crop=608:1080:x='max(0\,min(1312\,1336-207*t))':y=0,$R,setpts=PTS-STARTPTS,fade=in:st=0:d=0.3:color=white[e];
 [5:v]$V,setpts=PTS-STARTPTS[f];
 [6:v]$V,setpts=PTS-STARTPTS[g];
 [7:v]crop=608:1080:256:0,$R,setpts=PTS-STARTPTS[h];
 [8:v]crop=608:1080:656:0,$R,setpts=PTS-STARTPTS[i];
 [a][bc][d][e][f][g][h][i]concat=n=8:v=1:a=0,format=yuv420p[base];
 [11:v]format=rgba,fade=out:st=26.5:d=0.3:alpha=1[wm];
 [9:v]format=rgba,fade=in:st=26.1:d=0.7:alpha=1[ti];
 [10:v]format=rgba,fade=in:st=26.9:d=0.7:alpha=1[lo];
 [base][wm]overlay=0:0:enable='lt(t,26.8)'[b0];
 [b0][ti]overlay=0:0:enable='gte(t,26.1)'[b1];
 [b1][lo]overlay=0:0:enable='gte(t,26.9)',fade=out:st=29.6:d=0.45[v]" \
 -map "[v]" -r 30 -c:v libx264 -crf 17 -preset medium -pix_fmt yuv420p -an "$OUT"
ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT"
