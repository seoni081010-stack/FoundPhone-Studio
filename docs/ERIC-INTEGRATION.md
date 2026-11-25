# Eric Sohn Day 1–31 integration

Sources: the 31 approved files on main at `54f20d3efa6370aeaa78910efde57eb5b5716498`: `eric-day01-02-full.md`, `eric-day03-full.md` through `eric-day31-full.md`, and `eric-date-responses.md`. No manuscript is edited. The compiler reads each complete file, attaches original file/line references to every dialogue, narration, reply and choice, and rejects uncovered content. `stories/eric-source-audit.json` records SHA-256 hashes, sizes, source coverage and daily score ranges. Historical drafts outside these archives cannot independently be certified as identical; no external version was substituted.

The existing authored scene runtime, SceneDialogue, progress hook, mail backlog, album notices, Quidditch wager/results, map, four dock buttons and ending screen are reused. Eric uses the separate `hogwarts-eric-v1:<runId>` progress key; other route keys and saved identities are not migrated or reset. The six other manuscripts and generated route stories remain unchanged. Speech uses the existing typewriter, narration appears as complete paragraph blocks, and fixed replies require clicks. Player identity retains name, house and year; the archive contains only the `{{playerName}}` text variable and does not presume a lower school year. Eric is the existing Gryffindor Seeker, displayed as Eric Sohn.

## Source exceptions resolved without rewriting dialogue

- Day 19: the authored line `刚才听你说想做一个放在床边的。` appears only if option 1B was chosen. All other common dialogue is retained. The sentence remains verbatim in the compiled data, with a choice-history condition.
- Day 24: option 5 has two responses but no common merge heading before the hug/card. Those subsequent paragraphs form a common beat, so both responses receive the same approved scene and Christmas card.
- Day 25: option 4 alone lacks score annotations. Metadata assigns A +2 / B +1, matching every other scored Eric A/B pair. The source Markdown is unchanged. The common farewell after option 2 and castle return after option 6 are separated from B without altering wording/order.
- Day 30: exactly five choice groups. The intentionally deleted owl option 6 is not restored.
- A clue earned after mail must use the shared modal, not remain inside the mail thread. The runtime now renders that clue as a mandatory acknowledgement dialog; this fixes Eric Day 6/20/22/24 announcements without altering mail or story copy.

## Endings and affinity

Shared thresholds are unchanged: <80 unspoken, 80–99 friends, >=100 lover; invitations require >45. All 183 authored A/B pairs retain +2/+1 (including the Day 25 metadata repair). Full all-B play earns 183 before initial affinity/gifts; all-A earns 366. Face-to-face choices alone earn at least 139. Consequently complete fresh normal campaigns reach the lover ending under the required shared gates. The other two complete endings are independently playable via isolated previews; scores are not normalized and no route-specific threshold was invented.

The normal gate locks only after Day 31's five common choices. Each variant contains the complete common opening plus only its own exclusive story, fixed replies and final sentence. The unspoken ending includes its 00:42 mail before completion. The final album clue `比胜利更珍贵` exists only in the lover variant. The first five entries are `合拢的翅膀`, `初雪与槲寄生`, `购物清单之外`, `第三个生日愿望`, `槲寄生下的私心`. No photographs or additional clues are created. The Day 20 crossed-out manuscript line is rendered with a strike-through, not raw Markdown markers.

## Entries

- `?route=eric`: normal registration with Eric selected; an existing Eric run resumes. Another route's saved identity remains intact until registration is explicitly confirmed.
- `?preview=eric-dayN`: isolated full-day preview, N = 1–31.
- `?preview=eric-ending-together`
- `?preview=eric-ending-friends`
- `?preview=eric-ending-unspoken`

Previews do not write the normal identity, route affinity, choices, mail or album progress. The common ending UI is unchanged: END label, exact final sentence, character/affinity/jealousy and the existing seal control; no secondary book-title label is inserted.

## Reproducible verification

- `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run story:validate`, `npm run story:test`, `npm run build`; deployment build additionally uses `STORY_FILE=stories/hyunjae/story.json`, matching the existing workflow.
- `scripts/verify-eric-runtime.mjs`: all 31 days, mobile B/desktop A, all choices/fixed replies, exact recorded point totals, refresh, all six album acknowledgements, six full ending previews (both choices per variant), isolated normal saves.
- `scripts/verify-eric-map.mjs`: every scene time/place, seven map markers, selected-person header and explicit coordinates.
- `scripts/verify-eric-interactions.mjs`: registration/resume, narration/typewriter, clickable fixed replies, repeated choice clicks and refresh scoring.
- `scripts/verify-eric-backlog.mjs`: delayed mail and refresh without replaying scores or changing the current day.
- `scripts/verify-eric-ending-gates.mjs`: restored 0/79/80/99/100/250 boundary cases.
- `INVITATION_LEAD=eric scripts/verify-date-invitations.mjs`: 45/46, six venues, four independent accept/decline replies, twice-refreshed saved replies.
- `GIFT_LEAD=eric scripts/verify-gift-persistence.mjs`: +5/+2 gifts, rival jealousy +3/+5, stable across two refreshes.
- Existing seven-route isolation and Juyeon/Sunwoo/Younghoon browser verifiers provide regression checks.

The original `.github/workflows/pages.yml` is retained. It validates main and publishes the same tested commit from its existing permitted release branch, `feature/instagram-video-call-spotify-playlist`. The deployed `build-info.json` identifies the exact Actions commit. Real iOS/Safari hardware is not claimed by Chromium desktop/mobile viewport tests.

## Pre-release results

Clean installation, typecheck, lint, 195 unit tests, template and deployment-story validation/tests, and production builds passed. Mobile all-B and desktop all-A campaigns completed all 31 days with 183 choices each, 576/587 clicked fixed replies and exactly six album acknowledgements. All 123 scene time/location markers passed. All three endings completed with both common-choice paths; the five requested single-day preview links completed without touching normal saves. Registration/typewriter/fixed-reply/double-click/refresh, delayed mail, unchanged ending gates, all eight Date replies across six venues, and gift/jealousy persistence passed. Seven-route entry/isolation and existing Younghoon/Sunwoo/Juyeon complete ending previews passed. Mobile preview width was checked visually and corrected only for Eric's preview notice.

## Day 8 paper-star interruption

The user subsequently authorized replacing the two star-description/lifting paragraphs with a timed animation. The archive and generated source-backed data remain unchanged. At the existing narration block, the runtime displays only `你也完成了自己的第一颗星星。`, presents the pale-blue folded star from frame one, then fades the italic teal `Wingardium Leviosa` in/out before a slow upward drift. At 10 seconds it automatically resumes the unchanged next speech `诶，你这个挺好看的。`. No popup buttons or extra story copy are added. `ericPaperStar.startedAt/done` preserves elapsed time across normal-save refreshes; the existing narration-step/next-speech cursor numbers are unchanged, and older saves beyond the block do not replay it. Verification: `node scripts/verify-eric-paper-star.mjs` on both branches, mobile/desktop, plus normal Day8 traversal and existing route checks.

## Day 22 editable birthday card

At `那里夹着一张你亲手写下的生日贺卡。`, an ivory/cream card fades in with italic `To Eric Sohn`, a multiline blessing input and Submit. A nonblank submission is stored verbatim as plain text, replaces the two fixed printed blessings in the active presentation, and becomes immutable. Only Continue dismisses it; the next narration is exactly `他安静地看了很久，手指轻轻抚过贺卡上的字迹。`. Draft, submitted text and acknowledgement live in optional `ericBirthdayCard` progress state; both stages restore across refresh without changing affinity. The original grouped narration's cursor 14 is reused, so old checkpoints at the following speech (15+) do not replay the card. Archive/generated source data are unchanged. `node scripts/verify-eric-birthday-card.mjs` verifies both branch fixtures, mobile/desktop, trigger timing, empty-input rejection, multiline text/escaping, refresh and old-save compatibility.

## Day 24 Christmas envelope

After the existing `你轻轻拆开信封。` / `卡片里面是他熟悉的字迹。` narration, the reader opens a full-page ivory envelope/card overlay. The saved player name follows a curved, muted-gold handwritten path on the envelope; a small holly sprig decorates its front. Fade/rise, flap-opening and a restrained seam highlight precede the card sliding out. The user's latest approved card wording is `希望你度过一个很幸福的圣诞节，也希望明年后年我们还能一起看初雪。圣诞快乐！` plus `Eric Sohn`; characters appear at a deterministic 90–140 ms cadence with a soft opacity ramp. Only after the signature finishes can any page click (or Enter/Space) return to the existing first-snow A/B choice. No visible buttons, automatic dismissal or new score are added. `ericChristmasCard.startedAt/done` resumes the animation/writing on refresh; existing beat/cursor indices and manuscript data remain intact. Verification: `node scripts/verify-eric-christmas-card.mjs`, covering mobile/desktop, two saved names, early clicks, refresh, final hold, both click surfaces and correct A/B points.
