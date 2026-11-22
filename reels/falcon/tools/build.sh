#!/bin/bash
# Final edit of «Билет с неба»: 4 generated shots + the real View at the Palm footage, titles, grade.
set -e
cd "$(dirname "$0")/.."
OUT=${1:-falcon_reel_silent.mp4}
V='scale=-2:1920:flags=lanczos,crop=1080:1920,fps=30,setsar=1,eq=saturation=1.06:contrast=1.03'
ffmpeg -loglevel error -y \
 -ss 0.6 -t 2.6 -i clips/c1_entrance.mp4 \
 -ss 0.3 -t 4.3 -i clips/c2_ticket.mp4 \
 -ss 0.0 -t 4.0 -i clips/c3_deck.mp4 \
 -ss 0.0 -t 3.4 -i clips/c4_falcon_glass.mp4 \
 -ss 15.2 -t 4.2 -i src/view_palm.mp4 \
 -loop 1 -t 18.5 -i clips/title.png \
 -loop 1 -t 18.5 -i clips/logo_card.png \
 -filter_complex "
 [0:v]$V,setpts=PTS-STARTPTS[a];
 [1:v]$V,setpts=PTS-STARTPTS[b];
 [2:v]$V,setpts=PTS-STARTPTS,fade=in:st=0:d=0.3:color=white[c];
 [3:v]$V,setpts=PTS-STARTPTS[d];
 [4:v]crop=608:1080:656:0,scale=1080:1920:flags=lanczos,fps=30,setsar=1,eq=saturation=1.1:contrast=1.04,colorbalance=rh=.03:bh=-.02,setpts=PTS-STARTPTS[e];
 [a][b][c][d][e]concat=n=5:v=1:a=0,format=yuv420p[base];
 [5:v]format=rgba,fade=in:st=15.0:d=0.7:alpha=1[ti];
 [6:v]format=rgba,fade=in:st=15.8:d=0.7:alpha=1[lo];
 [base][ti]overlay=0:0:enable='gte(t,15.0)'[b1];
 [b1][lo]overlay=0:0:enable='gte(t,15.8)',fade=out:st=18.1:d=0.4[v]" \
 -map "[v]" -r 30 -c:v libx264 -crf 17 -preset medium -pix_fmt yuv420p -an "$OUT"
ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT"
