# Gentle face washing: Somali narration

Voice: so-SO-MuuseNeural. Duration: approximately 40 seconds.
Script: src/somali-vo.txt. Audio: assets/audio/muuse.mp3.
Complete narration retained with pitch-preserving tempo adjustment.
**Final video:** `renders/face-washing-somali.mp4`. It is 40.5s, with 11 scenes in the Somali heritage style and a Somali hijabi woman as the tutorial character (`hface-art` in the template). It ends on a "Skincare by Ubah" follow card with the TikTok icon. Rebuild with `python3 src/align_external.py assets/audio/muuse.mp3 src/script-somali.json assets/audio/vo.mp3 src/timing.json 0.6 0.45 0.3 1.0`, then `python3 src/build.py`, then `npx hyperframes render`.
Advice source: https://www.aad.org/public/everyday-care/skin-care-basics/care/face-washing-101
