import json,subprocess,re
d=json.load(open('alignment.json'));a=d['alignment'];text=d['text']
s=json.load(open('script.json'))
# silence ranges
out=subprocess.run(['ffmpeg','-hide_banner','-i','vo.mp3','-af','silencedetect=n=-30dB:d=0.1','-f','null','-'],capture_output=True,text=True).stderr
ss=[float(x) for x in re.findall(r'silence_start: ([\d.]+)',out)]
se=[float(x) for x in re.findall(r'silence_end: ([\d.]+)',out)]
sil=list(zip(ss,se))
# sentence char ranges + alignment boundary
spans=[];i=0
for x in s:
  spans.append((i,i+len(x['text'])-1)); i+=len(x['text'])+1
CS=a['character_start_times_seconds'];CE=a['character_end_times_seconds']
import sys
total=float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0','vo.mp3'],capture_output=True,text=True).stdout)
cuts=[]  # boundary silences between sentence k and k+1
for k in range(len(s)-1):
  b=(CE[spans[k][1]]+CS[spans[k+1][0]])/2
  best=min(sil,key=lambda r: abs((r[0]+r[1])/2-b))
  cuts.append(best)
segs=[]
for k in range(len(s)):
  st=0.0 if k==0 else cuts[k-1][1]-0.04
  en=total if k==len(s)-1 else cuts[k][0]+0.08
  segs.append((st,en))
GAP=float(sys.argv[1]); LEAD=float(sys.argv[2]); TEMPO=float(sys.argv[3])
# build concat list
files=[];t=LEAD;newstart=[]
subprocess.run(['ffmpeg','-y','-v','error','-f','lavfi','-i','anullsrc=r=44100:cl=mono','-t',str(GAP),'gap.wav'])
subprocess.run(['ffmpeg','-y','-v','error','-f','lavfi','-i','anullsrc=r=44100:cl=mono','-t',str(LEAD),'lead.wav'])
lst=["file 'lead.wav'"]
for k,(st,en) in enumerate(segs):
  subprocess.run(['ffmpeg','-y','-v','error','-i','vo.mp3','-ss',str(st),'-to',str(en),'-ac','1','-ar','44100',f'seg{k}.wav'])
  newstart.append(t); t+=en-st
  lst.append(f"file 'seg{k}.wav'")
  if k<len(segs)-1: lst.append("file 'gap.wav'"); t+=GAP
open('list.txt','w').write('\n'.join(lst)+'\n')
subprocess.run(['ffmpeg','-y','-v','error','-f','concat','-safe','0','-i','list.txt','-af',f'atempo={TEMPO},loudnorm=I=-15:TP=-1.5:LRA=9','-ar','44100','-ac','2','-b:a','192k','vo_tight.mp3'])
def remap(tt,k): return (tt-segs[k][0]+newstart[k])/TEMPO
# words
words=[]
for k,(c0,c1) in enumerate(spans):
  j=c0
  for m in re.finditer(r'\S+',text[c0:c1+1]):
    w0=c0+m.start(); w1=c0+m.end()-1
    words.append({"scene":s[k]['id'],"w":m.group(),"s":round(remap(CS[w0],k),3),"e":round(remap(CE[w1],k),3)})
scenes=[{"id":s[k]['id'],"text":s[k]['text'],"s":round(remap(max(CS[spans[k][0]],segs[k][0]),k),3),"e":round(remap(min(CE[spans[k][1]],segs[k][1]),k),3)} for k in range(len(s))]
json.dump({"scenes":scenes,"words":words},open('timing.json','w'),ensure_ascii=False,indent=1)
for x in scenes: print(x['id'],x['s'],x['e'])
