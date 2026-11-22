#!/bin/bash
# «Билет с неба» — approved story, existing renders only, no animated zooms (no jitter):
# queue (wide) → same shot pushed in: the sigh → queue (wide) again → falcon gives the ticket → deck → falcon over the Palm → real glass + end card
set -e
cd "$(dirname "$0")/.."
OUT=${1:-falcon_reel_silent.mp4}
G='fps=30,setsar=1,eq=saturation=1.06:contrast=1.03'
V="scale=-2:1920:flags=lanczos,crop=1080:1920,$G"
R='scale=1080:1920:flags=lanczos,fps=30,setsar=1,eq=saturation=1.1:contrast=1.04,colorbalance=rh=.03:bh=-.02'
ffmpeg -loglevel error -y \
 -i clips/c0_queue.mp4 \
 -i clips/c2_ticket.mp4 \
 -i clips/c3_deck.mp4 \
 -ss 0.0 -t 4.0 -i clips/c4_falcon_glass.mp4 \
 -ss 15.0 -t 4.6 -i src/view_palm.mp4 \
 -loop 1 -t 25.72 -i clips/title.png \
 -loop 1 -t 25.72 -i clips/logo_card.png \
 -loop 1 -t 25.72 -i clips/logo_corner.png \
 -filter_complex "
 [0:v]split=3[q1][q2][q3];
 [q1]trim=0:2.0,setpts=PTS-STARTPTS,$V[a];
 [q2]trim=2.0:3.3,setpts=PTS-STARTPTS,crop=300:533:0:570,scale=1080:1920:flags=lanczos,unsharp=5:5:0.8,$G[b];
 [q3]trim=start=3.3,setpts=PTS-STARTPTS,$V[c];
 [1:v]$V,setpts=PTS-STARTPTS[d];
 [2:v]$V,setpts=PTS-STARTPTS,fade=in:st=0:d=0.3:color=white[e];
 [3:v]$V,setpts=PTS-STARTPTS[f];
 [4:v]crop=608:1080:656:0,$R,setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration=2[g];
 [a][b][c][d][e][f][g]concat=n=7:v=1:a=0,format=yuv420p[base];
 [7:v]format=rgba,fade=out:st=20.2:d=0.3:alpha=1[wm];
 [5:v]format=rgba,fade=in:st=19.8:d=0.7:alpha=1[ti];
 [6:v]format=rgba,fade=in:st=20.6:d=0.7:alpha=1[lo];
 [base][wm]overlay=0:0:enable='lt(t,20.5)'[b0];
 [b0][ti]overlay=0:0:enable='gte(t,19.8)'[b1];
 [b1][lo]overlay=0:0:enable='gte(t,20.6)',fade=out:st=25.3:d=0.45[v]" \
 -map "[v]" -r 30 -c:v libx264 -crf 17 -preset medium -pix_fmt yuv420p -an "$OUT"
ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT"
