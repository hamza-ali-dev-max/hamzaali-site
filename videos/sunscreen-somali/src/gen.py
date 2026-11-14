import json,urllib.request,base64,sys
s=json.load(open('script.json'))
text=' '.join(x['text'] for x in s)
voice=sys.argv[1] if len(sys.argv)>1 else 'TX3LPaxmHKxFdv7VOQHJ'
body={"text":text,"model_id":"eleven_v3","language_code":"so","voice_settings":{"stability":0.5,"similarity_boost":0.75}}
req=urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{voice}/with-timestamps?output_format=mp3_44100_192",data=json.dumps(body).encode(),headers={"Content-Type":"application/json"})
d=json.load(urllib.request.urlopen(req,timeout=300))
open("vo.mp3","wb").write(base64.b64decode(d["audio_base64"]))
a=d["alignment"]
json.dump({"text":text,"alignment":a},open("alignment.json","w"))
print(len(text), a["character_end_times_seconds"][-1])
