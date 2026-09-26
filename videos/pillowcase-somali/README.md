# Change your pillowcase: 40-second Somali narration

Voice: Microsoft `so-SO-MuuseNeural`, matching the sunscreen narration.

- Script: `src/somali-vo.txt`, one sentence per line.
- Audio: `assets/audio/muuse.mp3`, 40 seconds, subject to MP3 frame padding.
- Speech tempo adjusted without changing pitch; complete narration retained.
- Script and audio only. Video scenes, captions, and rendering remain to be created.

The narration recommends washing and changing pillowcases at least weekly and sooner when dirty or sweaty, following fabric care instructions, drying thoroughly, and choosing fragrance-free detergent for sensitive skin. It explicitly says a clean pillowcase alone does not cure acne.

Sources checked September 25, 2026:

- https://newsroom.clevelandclinic.org/2025/11/20/how-often-should-you-wash-your-sheets
- https://my.clevelandclinic.org/health/diseases/22468-pimples

Initial synthesis:

```sh
edge-tts --voice so-SO-MuuseNeural --file src/somali-vo.txt --write-media muuse-raw.mp3
```
