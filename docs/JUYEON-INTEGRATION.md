# Juyeon Day 1–31 integration

The only sources are main's `story-archive/juyeon-day01-02-full.md` and `juyeon-day03-full.md` through `juyeon-day31-full.md`. The manuscripts are unchanged. `scripts/compile-juyeon.py` emits structured beats with source file/line references; `--check` rejects stale generated data. Both story build and validation run the compiler.

The route reuses the existing authored scene runtime, SceneDialogue, progress hook, owl backlog, shared album notices, Quidditch paper/result, four dock apps and ending screen. Juyeon has a separate `hogwarts-juyeon-v1:<runId>` save. Other routes' keys and stored data are preserved. Morning and evening mail on Day 17 remain distinct, with a face-to-face scene between them. Optional unread evening mail stays in the backlog.

## Confirmed ending policy

The user explicitly confirmed preserving all manuscript +1/+2 scores and shared 80/100 thresholds, with friends/unspoken available through isolated previews. Required face-to-face choices, including the three Day 31 common choices, award at least 100; reading every owl letter makes the minimum 118 (before starting affinity/gifts). Therefore a complete normal campaign reaches the lover ending. This is intentional, not a claim that all three are achievable by a fresh complete campaign. The shared gate still covers all scores: <80 unspoken, 80–99 friends, >=100 together. It locks only after Day 31's common story and shared album memory. Preview flags lock a specified variant from the start without writing normal progress or identity.

Day 30 takes place in the West Tower and makes the authored appointment for the following night. Day 31's lake scenes map to `黑湖湖畔的大山毛榉树下`; the source dialogue and stage order are unchanged. Exact authored place labels elsewhere have explicit map coordinates. The final common album memory appears once, irrespective of ending.

## Entries

- `?route=juyeon`: normal route registration, preselecting Juyeon; an existing Juyeon identity resumes. A different route's identity is retained until the player explicitly confirms registration.
- `?preview=juyeon-dayN`: isolated single-day preview, 1–31.
- `?preview=juyeon-ending-together`
- `?preview=juyeon-ending-friends`
- `?preview=juyeon-ending-unspoken`

The four approved acceptance and rejection lines use the existing >45 invitation gate, random pool selection, persisted replies and common date restrictions. No unapproved venue-specific dialogue was invented.

## Browser verification

- `scripts/verify-juyeon-runtime.mjs`: all 31 days on mobile/desktop, A/B campaigns, optional unread mail, exact point totals from recorded choices, refreshed progress, album acknowledgements and six complete finale previews (both choices per ending).
- `scripts/verify-juyeon-map.mjs`: every authored scene time/place, seven markers and no corridor fallback.
- `scripts/verify-juyeon-backlog.mjs`: delayed mail, fixed replies, refresh, single scoring and current-day isolation.
- `scripts/verify-juyeon-interactions.mjs`: route entry preservation, instantaneous narration, typed speech, clickable fixed replies, queued duplicate clicks and refresh scoring.
- `scripts/verify-juyeon-ending-gates.mjs`: unchanged 80/100 boundary behavior on restored progress.
- `INVITATION_LEAD=juyeon scripts/verify-date-invitations.mjs`: 45/46 boundary, six venues, all four replies and refresh persistence.

The existing Pages workflow and protected release branch remain unchanged. main and the allowed release branch receive the same tested commit.

The deployed `build-info.json` records the Actions commit SHA so the live website can be compared with the exact released commit.

## Pre-release results

- npm clean install, typecheck, lint, 182 unit tests, both authored compilers, story validation/test and production build passed.
- Three 31-day Chromium campaigns passed: mobile A, desktop B and mobile B with optional unread mail. Recorded choice sums matched saved affinity every day. Each unlocked exactly four album memories.
- All three ending previews completed with both A and B choices (mobile/desktop), preserving existing formal identity and route saves.
- All 102 authored scene time/place markers passed; seven people remained on the map.
- Restored progress at 0/79/80/99/100/250 used the unchanged ending gates correctly; normal fresh complete campaigns followed the explicitly approved lover-only policy.
- Invitations at 45 and 46, six venues, all four acceptance/refusal lines and refreshed replies passed.
- Juyeon gifts awarded +5/+2, gifts to a rival awarded jealousy +3/+5, and two refreshes preserved the exact numbers. Existing Hyunjae/Jacob/Q/Younghoon gift behavior, Younghoon's three full ending previews, Sunwoo's three ending previews, Day 5 parchment, Day 19 wish input and seven-route save isolation passed regression checks.

## Day 14 animated star chart

The existing 19:40 narration is interrupted after Juyeon spreads the parchment on the stone table. The paper unfolds, a wand-light sweep wakes sequential curved star trails, and the upper constellations settle into a gently breathing/drifting sky while the lower ink chart stays on the textured parchment. The only visible label in this overlay is its lower-right Continue button. Quiet Web Audio paper noise and low harmonic tones are generated locally; no speech, character art or additional story text is added.

The reveal takes 10.5 seconds, then remains open until Continue. `juyeonStarChart.startedAt/done` persists the phase and acknowledgement without changing existing cursor numbering, choice scores or manuscript data. Continue restores the original narration block containing `你不由得低头看了一会儿。`; the next fixed reply still requires its normal click. Old saves already past the narration block bypass the new interruption. The browser verification is `scripts/verify-juyeon-star-chart.mjs` (both preceding branches, phone/desktop, audio cleanup, no auto-close, refresh, old checkpoint compatibility and unchanged affinity).
