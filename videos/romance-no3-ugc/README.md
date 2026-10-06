# Romance N°3: Somali UGC ad inside the Falarosa Luxury store

A Somali presenter in a burgundy hijab and abaya talks to camera behind the store's marble counter, sprays Romance N°3 and invites viewers to Falarosa Luxury, Surrey. Generated with Seedance 2.5 (Higgsfield API, reference-to-video, 720p, 20 s), finished in HyperFrames with word-by-word Somali captions and an end card with the store logo and +1 (604) 396-6638.

- **Final videos** (22.9s, 1080×1920):
  - `renders/romance-no3-ugc-sagal.mp4`: the exact ElevenLabs Somali voice ("Sagal"), plus the clip's own spray and shop sound in the pause.
  - `renders/romance-no3-ugc-native.mp4`: the clip's own Seedance voice, which follows the same lines and timing.
  - `renders/romance-no3-ugc-ubax.mp4`: the Microsoft `so-SO-UbaxNeural` voice (`assets/ubax-raw.mp3`), with each sentence fitted to her mouth timing (at most 12% slower) in `assets/ubax-fitted.mp3`. For exact lip-sync, run `assets/seedance-take.mp4` with `assets/ubax-fitted.mp3` through a lip-sync model.
- Source clip: `assets/seedance-take.mp4`. The request is in `src/seedance-request.json` (references: `videos/ugc-ads/seedance/refs/rom3-bottle.jpg`, `store-woman-burgundy.jpg`, `store-interior.jpg`, and the voice `videos/ugc-ads/seedance/voice/rom3-sagal.mp3`).
- Rebuild: upscale the take to `assets/clip.mp4` (`ffmpeg -i assets/seedance-take.mp4 -vf "scale=1080:1920:flags=lanczos,unsharp=5:5:0.5:5:5:0.0" -an -crf 15 assets/clip.mp4`), then `python3 src/build.py 20.06 vo-mix.mp3` (or `seedance-audio.mp3`) and `npx hyperframes render`.
- Before posting on TikTok, turn on the "AI-generated" label.
