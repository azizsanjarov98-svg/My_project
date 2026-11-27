#!/bin/bash
# «Билет с неба» — approved story, existing renders only, no animated zooms (no jitter):
# queue (wide) → same shot pushed in: the sigh → she texts Aziz (chat insert) → queue (wide) again → falcon gives the ticket → deck → falcon over the Palm → real glass + end card
set -e
cd "$(dirname "$0")/.."
OUT=${1:-falcon_reel_silent.mp4}
G='fps=30,setsar=1,eq=saturation=1.06:contrast=1.03'
V="scale=-2:1920:flags=lanczos,crop=1080:1920,$G"
R='scale=1080:1920:flags=lanczos,fps=30,setsar=1,eq=saturation=1.1:contrast=1.04,colorbalance=rh=.03:bh=-.02'
ffmpeg -loglevel error -y \
 -i clips/c0_queue.mp4 \
 -i clips/c01_chat.mp4 \
 -i clips/c2_ticket.mp4 \
 -i clips/c3_deck.mp4 \
 -ss 0.0 -t 4.0 -i clips/c4_falcon_glass.mp4 \
 -ss 15.8 -t 1.5 -i src/view_palm.mp4 \
 -loop 1 -t 3.6 -i clips/end_still.png \
 -loop 1 -t 30.82 -i clips/title.png \
 -loop 1 -t 30.82 -i clips/logo_card.png \
 -loop 1 -t 30.82 -i clips/logo_corner.png \
 -filter_complex "
 [0:v]split=3[q1][q2][q3];
 [q1]trim=0:2.0,setpts=PTS-STARTPTS,$V[a];
 [q2]trim=2.0:3.3,setpts=PTS-STARTPTS,crop=300:533:0:570,scale=1080:1920:flags=lanczos,unsharp=5:5:0.8,$G[b];
 [q3]trim=start=3.3,setpts=PTS-STARTPTS,$V[c];
 [2:v]$V,setpts=PTS-STARTPTS[d];
 [3:v]$V,setpts=PTS-STARTPTS,fade=in:st=0:d=0.3:color=white[e];
 [4:v]$V,setpts=PTS-STARTPTS[f];
 [5:v]crop=608:1080:700:0,$R,setpts=PTS-STARTPTS[g];
 [6:v]fps=30,scale=4320:7680:flags=lanczos,zoompan=z='1+0.04*(on/107)*(on/107)*(3-2*on/107)':x='iw/2-iw/zoom/2':y='ih*0.45-ih/zoom/2':d=1:s=1080x1920:fps=30,setsar=1,setpts=PTS-STARTPTS[st];
 [1:v]fps=30,setsar=1,setpts=PTS-STARTPTS[ch];
 [a][b][ch][c][d][e][f][g][st]concat=n=9:v=1:a=0,format=yuv420p[base];
 [9:v]format=rgba,fade=out:st=27.0:d=0.3:alpha=1[wm];
 [7:v]format=rgba,fade=in:st=27.5:d=0.7:alpha=1[ti];
 [8:v]format=rgba,fade=in:st=28.1:d=0.7:alpha=1[lo];
 [base][wm]overlay=0:0:enable='lt(t,27.3)'[b0];
 [b0][ti]overlay=0:0:enable='gte(t,27.5)'[b1];
 [b1][lo]overlay=0:0:enable='gte(t,28.1)',fade=out:st=30.4:d=0.42[v]" \
 -map "[v]" -r 30 -c:v libx264 -crf 17 -preset medium -pix_fmt yuv420p -an "$OUT"
ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT"
