# Body lotion on your face: short Somali narration

Voice: Microsoft `so-SO-MuuseNeural`, matching the sunscreen video.

- Script: `src/somali-vo.txt`
- Original narration: `assets/audio/muuse.mp3`
- Default speaking rate, volume, and pitch. No music or retiming applied.
- Audio and script only; cuts, captions, and final video still need to be built.

The script cautions against heavy or fragranced body lotions that may cause breakouts or irritation for some people. It does not claim that every body moisturizer is unsafe for the face. It recommends a suitable fragrance-free, non-comedogenic moisturizer.

English meaning:

1. Do you put body cream on your face?
2. Be careful with heavy or fragranced cream.
3. For some people, it can cause pimples or itching.
4. Choose a cream suitable for your face, without fragrance and that does not clog pores.
5. Not every body cream is bad; what matters is that it suits your skin.
6. Care for your skin and read the label!

Dermatology sources checked September 25, 2026:

- https://www.aad.org/public/everyday-care/skin-care-basics/care/winter-skin-survival-kit
- https://www.aad.org/public/everyday-care/skin-care-basics/care/skin-care-for-men

Generate with:

```sh
edge-tts --voice so-SO-MuuseNeural --file src/somali-vo.txt --write-media assets/audio/muuse.mp3
```
