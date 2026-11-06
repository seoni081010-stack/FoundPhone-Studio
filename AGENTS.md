# Agent instructions

Check the working tree and remotes before editing. Preserve existing files and uncommitted work.

This is an existing interactive virtual phone framework. Users usually want to add a story, not rebuild the phone. Read docs/ARCHITECTURE.md, docs/PROGRESS.md, docs/AI_STORY_GUIDE.md and docs/STORY_SCHEMA.md.

Prefer editing stories/template/story.json. stories/blank/story.json remains a blank starting point. Keep story data separate from UI code and player saves. Accept natural language, chat records, images and event requirements as author input; convert them to validated structured story data. Ask about missing major plot decisions and use reasonable defaults for minor details.

Reuse the Phone Runtime, App registry and event engine. Do not rewrite App UI or shared engines merely to add content. For a new App follow docs/APP_DEVELOPMENT.md. Keep stable IDs and versioned schemas. Reject arbitrary scripts, HTML and executable imports. Never copy private account data into a story.

Run npm run story:validate, npm run story:test and npm run build after story changes. Add passing paths for every new ending, including passwords, hidden content, calls and cross-App events. Preview the result and check saves. For engine changes also run typecheck, lint, unit and relevant browser tests. Report unverified device behavior honestly; App registration is not complete app-specific fidelity.

Preserve MIT, dependency licenses and source copyright notices. Do not automatically Fork, Star, Push or publish. Inspect existing remotes before proposing a target repository. Forking is a user workflow, not an MIT requirement. Confirm public release scope before upload. Exclude local backups, private media, credentials, caches and development-only image assets.

## Hogwarts Unspoken shared route contract

All seven love interests use the existing HogwartsDevice, event engine and SceneDialogue. Add authored character content to this framework. The user has explicitly designated the reviewed Hyunjae version as the template for every route.

- Use src/runtime/sharedRules.ts for global dates and conditions. December 6 is first snow, December 12 is the Quidditch match and betting minigame, December 22 starts the holiday, December 24 is the ball, and December 31 is the relationship resolution and ending. These events occur on the same dates for all seven routes.
- The match's betting popup, stake range, reward and loss handling, interaction sequence and date restrictions are shared. Character dialogue may differ. Never make a shared minigame exclusive to a love interest.
- All routes share invitation eligibility, blocked dates, messages, gifts, relationship triggers, event timing gates and ending transitions. Keep character-specific wording and authored choices in route content. Do not invent additional requirements for a particular character.
- Keep the four dock apps in this exact order: 魔法相册, 猫头鹰信箱, 巫师手札, Date. The seven-person inbox has names and portraits. 巫师手札 contains character profiles and the map entry. Date contains invitations. 魔法相册 contains clues. Preserve the reviewed design and interactions when adding any character.
- Map header shows only the selected love interest with date, time and current activity/location. The map drawing shows all seven people's name markers. Do not add a separate roster of their classes or locations below the drawing. New story activities must update their time/location data.
- All face-to-face speech uses SceneDialogue's typewriter effect. Narration appears immediately. Fixed player replies require one clickable reply button. Alternative replies require choice buttons. Later lines and completion actions wait until the player advances.
- Each route has four album entries. Preserve the reviewed Hyunjae album wording. Mistletoe recurs naturally through first snow, the ball and the final day. New clues must reveal previously unknown information instead of restating the preceding conversation.
- Every newly earned album clue must show the shared “魔法相册解锁新内容” dialog after its scene finishes, on that same day. Queue simultaneous unlocks one by one; acknowledge only the explicit button click, never Escape or an automatic close. Persist acknowledgement separately per player run and character. Use the shared albumNotices helpers for all current and future routes; never silently insert a clue only into the album. The final memory also announces its unlock before the ending.
- Other routes are authored incrementally. Reuse shared features as their days are added. Do not fabricate unseen route content or replace existing character writing merely to fill the calendar.
