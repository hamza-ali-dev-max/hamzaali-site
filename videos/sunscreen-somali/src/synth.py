import numpy as np, wave
from scipy.signal import butter, lfilter
SR=44100; rng=np.random.default_rng(7)
def w(name,x):
  x=np.clip(x,-1,1); y=(x*32767).astype(np.int16)
  if y.ndim==1: y=np.stack([y,y],1)
  f=wave.open(name,'wb'); f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes(y.tobytes()); f.close()
def bp(x,lo,hi): b,a=butter(2,[lo/(SR/2),hi/(SR/2)],'band'); return lfilter(b,a,x)
def hp(x,c): b,a=butter(2,c/(SR/2),'high'); return lfilter(b,a,x)
def lp(x,c): b,a=butter(2,c/(SR/2),'low'); return lfilter(b,a,x)
BPM=112; beat=60/BPM; DUR=46.0; N=int(SR*DUR)
L=np.zeros(N); R=np.zeros(N)
def add(buf,sig,t,g=1.0):
  i=int(t*SR); j=min(N,i+len(sig)); 
  if i<N: buf[i:j]+=sig[:j-i]*g
def kick():
  t=np.arange(int(.35*SR))/SR; f=50+90*np.exp(-t*30); return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*9)
def clap():
  t=np.arange(int(.22*SR))/SR; n=bp(rng.standard_normal(len(t)),900,3500)
  env=np.exp(-t*22)+0.6*np.exp(-np.maximum(t-.012,0)*30)*(t>.012)+0.4*np.exp(-np.maximum(t-.024,0)*30)*(t>.024)
  return n*env*0.5
def hat():
  t=np.arange(int(.06*SR))/SR; return hp(rng.standard_normal(len(t)),7000)*np.exp(-t*70)*0.25
def pluck(freq,dur=.5):
  n=int(SR/freq); buf=rng.uniform(-1,1,n); out=np.zeros(int(dur*SR))
  for i in range(len(out)):
    out[i]=buf[i%n]; buf[i%n]=0.5*(buf[i%n]+buf[(i+1)%n])*0.996
  return lp(out,4000)
def bass(freq,dur):
  t=np.arange(int(dur*SR))/SR; s=np.sin(2*np.pi*freq*t)+0.3*np.sin(4*np.pi*freq*t)
  return s*np.minimum(1,t*80)*np.exp(-t*2.5)*0.5
nt=lambda m:440*2**((m-69)/12)
# progression: F  C  Dm Bb  (bright) -> I V vi IV in F
prog=[[65,69,72],[60,64,67],[62,65,69],[58,62,65]]
bassn=[41,36,38,34]
K,C,H=kick(),clap(),hat()
plucks={}
bar=4*beat; nbars=int(DUR/bar)+1
for b in range(nbars):
  t0=b*bar; ch=prog[b%4]
  for q in range(4):
    add(L,K,t0+q*beat,0.8); add(R,K,t0+q*beat,0.8)
    if q in(1,3): add(L,C,t0+q*beat,0.7); add(R,C,t0+q*beat+0.004,0.7)
  for e in range(8):
    add(L,H,t0+e*beat/2+beat/4,0.8 if e%2 else 0.5); add(R,H,t0+e*beat/2+beat/4+0.002,0.6)
  add(L,bass(nt(bassn[b%4]),bar*0.95),t0,0.9); add(R,bass(nt(bassn[b%4]),bar*0.95),t0,0.9)
  pat=[0,1.5,2,3,3.5] if b%2==0 else [0,0.75,1.5,2.5,3]
  for k,p in enumerate(pat):
    m=ch[k%3]+12
    if m not in plucks: plucks[m]=pluck(nt(m),.6)
    add(L,plucks[m],t0+p*beat,0.35 if k%2 else 0.2); add(R,plucks[m],t0+p*beat+0.01,0.2 if k%2 else 0.35)
mix=np.stack([L,R],1)
t=np.arange(N)/SR; fade=np.minimum(1,t/0.4)*np.clip((DUR-t)/1.5,0,1)
mix*=fade[:,None]; mix/=np.abs(mix).max()*1.12
w('bgm.wav',mix)
# SFX
t=np.arange(int(.45*SR))/SR; n=rng.standard_normal(len(t)); env=np.sin(np.pi*t/.45)**2
out=np.zeros_like(n); 
for i,c in enumerate(np.linspace(600,6000,20)):
  seg=slice(i*len(n)//20,(i+1)*len(n)//20); out[seg]=bp(n,c*0.6,min(c*1.6,20000))[seg]
w('whoosh.wav',out*env*0.9/np.abs(out*env).max())
t=np.arange(int(.12*SR))/SR; f=500+1200*np.exp(-t*40); p=np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*35); w('pop.wav',p*0.8)
t=np.arange(int(.9*SR))/SR; d=(np.sin(2*np.pi*1318*t)+0.5*np.sin(2*np.pi*1975*t)+0.25*np.sin(2*np.pi*2637*t))*np.exp(-t*5)*np.minimum(1,t*400); w('ding.wav',d/np.abs(d).max()*0.7)
print("ok")
