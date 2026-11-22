#!/bin/bash
# Final edit of «Билет с неба»: queue → close-up sigh → pull-back → falcon → deck → falcon over the Palm → real footage + end card.
set -e
cd "$(dirname "$0")/.."
OUT=${1:-falcon_reel_silent.mp4}
V='scale=-2:1920:flags=lanczos,crop=1080:1920,fps=30,setsar=1,eq=saturation=1.06:contrast=1.03'
# eased digital pull-back on the approved queue shot: from Anya's face (z=1.9) to the full frame (z=1)
E='(if(lt(t\,1.4)\,(t/1.4)*(t/1.4)*(3-2*t/1.4)\,1))'
Z="(1.9-0.9*$E)"
ffmpeg -loglevel error -y \
 -ss 0.4 -t 1.8 -i clips/c0_queue.mp4 \
 -ss 0.0 -t 2.4 -i clips/c05_sigh_close.mp4 \
 -ss 2.6 -t 2.0 -i clips/c0_queue.mp4 \
 -ss 0.3 -t 4.0 -i clips/c2_ticket.mp4 \
 -ss 0.0 -t 4.0 -i clips/c3_deck.mp4 \
 -ss 0.0 -t 3.4 -i clips/c4_falcon_glass.mp4 \
 -ss 15.2 -t 4.2 -i src/view_palm.mp4 \
 -loop 1 -t 21.8 -i clips/title.png \
 -loop 1 -t 21.8 -i clips/logo_card.png \
 -loop 1 -t 21.8 -i clips/logo_corner.png \
 -filter_complex "
 [0:v]$V,setpts=PTS-STARTPTS[a];
 [1:v]$V,setpts=PTS-STARTPTS[b];
 [2:v]setpts=PTS-STARTPTS,scale=w='trunc(720*$Z/2)*2':h='trunc(1276*$Z/2)*2':eval=frame:flags=lanczos,crop=720:1276:x='min(max(in_w*(0.20+0.30*$E)-360\,0)\,in_w-720)':y='min(max(in_h*(0.58-0.08*$E)-638\,0)\,in_h-1276)',$V[c];
 [3:v]$V,setpts=PTS-STARTPTS[d];
 [4:v]$V,setpts=PTS-STARTPTS,fade=in:st=0:d=0.3:color=white[e];
 [5:v]$V,setpts=PTS-STARTPTS[f];
 [6:v]crop=608:1080:656:0,scale=1080:1920:flags=lanczos,fps=30,setsar=1,eq=saturation=1.1:contrast=1.04,colorbalance=rh=.03:bh=-.02,setpts=PTS-STARTPTS[g];
 [a][b][c][d][e][f][g]concat=n=7:v=1:a=0,format=yuv420p[base];
 [9:v]format=rgba,fade=out:st=18.9:d=0.3:alpha=1[wm];
 [7:v]format=rgba,fade=in:st=18.3:d=0.7:alpha=1[ti];
 [8:v]format=rgba,fade=in:st=19.1:d=0.7:alpha=1[lo];
 [base][wm]overlay=0:0:enable='lt(t,19.2)'[b0];
 [b0][ti]overlay=0:0:enable='gte(t,18.3)'[b1];
 [b1][lo]overlay=0:0:enable='gte(t,19.1)',fade=out:st=21.4:d=0.4[v]" \
 -map "[v]" -r 30 -c:v libx264 -crf 17 -preset medium -pix_fmt yuv420p -an "$OUT"
ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT"
