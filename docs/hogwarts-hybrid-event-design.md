# Hogwarts high-year romance: hybrid event system (design specification)

Status: design specification only; the runtime event engine is not yet implemented.

## Locked design decisions
- Playable protagonist years: 5, 6, or 7. One selected academic year per playthrough (September through the following summer); no automatic year-up.
- Male lead fixed years: 7 Jacob, Younghoon, Hyunjae; 6 Juyeon, Kevin, Q; 5 Sunwoo, Eric.
- The protagonist's house and year do not restrict which of the eight leads can be romanced.
- Main story progresses automatically on an in-game calendar. Hidden scenes are discovered through voluntary exploration.
- Hogwarts life is independent of romance: classes, homework, Quidditch, House Cup, Hogsmeade, holidays, exams.
- Hogsmeade trips are scheduled and require appropriate permission; all playable years are at least year 5.
- Fifth-year O.W.L. and seventh-year N.E.W.T. matter to school-life scenes.

## Event types
1. `world_main`: fixed-date or chapter-gated compulsory scenes, guaranteed to surface.
2. `romance_main`: scenes for the selected lead, surfaced automatically when story milestones are reached; reasonable fallbacks if optional stats are low.
3. `exploration`: optional location/time/season scenes. May change affinity, trust, secrets, memories, and ending variants, but never permanently block the ordinary romance ending.
4. `ambient`: short repeatable messages, classes, and notices with cooldowns.

## Suggested event data model
```ts
type EventDefinition = {
  id: string;
  type: "world_main" | "romance_main" | "exploration" | "ambient";
  chapter: string;
  dateWindow?: { start: string; end: string }; // in-game month-day
  timeSlot?: "morning" | "afternoon" | "evening";
  location?: string;
  requiredYear?: number[];
  requiredHouse?: string[];
  leadId?: string;
  prerequisites?: string[];
  minTrust?: number;
  maxPlays?: number;
  priority?: number;
  choices: Array<{
    label: string;
    next?: string;
    effects?: { affection?: number; trust?: number; clues?: string[]; memories?: string[] };
  }>;
};
```

## Daily loop
1. Advance in-game date and resolve fixed school schedule.
2. Queue mandatory world/romance scenes first, never silently skip them.
3. Offer a limited number of optional free-time slots; player picks locations.
4. Find eligible exploration events by location, season, year, lead, prerequisites, and unplayed status.
5. Save flags and choices, update diary and relationship.
6. Advance day; allow fast-forward through uneventful days.

## School-year milestones
- September: arrival, timetable, classes, first lead encounters.
- October: lessons, first Quidditch build-up, Halloween.
- November: Quidditch fixtures and Hogsmeade weekends.
- December: Christmas holiday stay/return choice and winter scenes.
- January–March: classes, character conflicts, Quidditch, school mysteries.
- Spring: Easter holiday and exam preparation.
- May–June: O.W.L./N.E.W.T. as applicable, climax, relationship outcome.
- Summer: epilogue for the selected year.

## Example events (illustrative, not canonized scripts)
- `school.halloween.feast`: world_main, Oct 31, Great Hall, all years.
- `hyunjae.library.secret`: exploration, library evening, selected lead Hyunjae, once, reveals clue.
- `eric.quidditch.after_match`: romance_main, after relevant Quidditch match, selected lead Eric.
- `hogsmeade.honeydukes.encounter`: exploration, approved Hogsmeade weekend, Honeydukes, once.

## Implementation sequence
1. Calendar + save state + event evaluator.
2. School-wide main story and location exploration UI.
3. One complete romance route with ordinary and hidden scenes.
4. Extend to remaining seven routes and test year/house combinations.

Important: do not mistake this specification for implemented functionality.

## Character school roles (confirmed)
| Character | Year | House | Role |
| --- | --- | --- | --- |
| Hyunjae | 7 | Slytherin | Student council; gentle and reliable senior, secretly carrying a personal mystery |
| Jacob | 7 | Hufflepuff | Student council |
| Younghoon | 7 | Hufflepuff | No additional role decided |
| Juyeon | 6 | Slytherin | Quidditch player |
| Kevin | 6 | Ravenclaw | No additional role decided |
| Q | 6 | Ravenclaw | Student council |
| Sunwoo | 5 | Slytherin | Quidditch player |
| Eric | 5 | Gryffindor | Quidditch player |

Student council is a game-specific student organization, distinct from Hogwarts prefects. Do not assign Quidditch positions, council ranks, or secret details without further creative decisions.

## Course timetable and encounters
- The selected protagonist year sets eligible course levels. Year 5 follows O.W.L. curriculum; years 6–7 have N.E.W.T.-level elective/course prerequisites.
- House determines teaching group and timetable. Some lessons may be shared between houses, but **house pairings must be authored per course, term, year, and period**, not universally assumed.
- An ordinary class encounter requires: matching academic year, both students enrolled in the same subject, matching scheduled teaching group and time slot, and both present.
- Different-year students cannot be in the same standard class by default. Cross-year encounters belong in library, Great Hall, corridors, student council, Quidditch, Hogsmeade, or special mixed-year events.
- Student council duties enable meetings, announcements, and event-planning encounters for Hyunjae, Jacob, and Q; protagonist membership is not assumed.
- Quidditch training and matches enable field, stadium, and post-match encounters for Juyeon, Sunwoo, and Eric. Players represent their own houses; house rivalry can change scene context.
- A player choosing a different house may receive a different classroom cohort and route into the same mandatory romance milestone via a different scene. No romance route should become inaccessible merely due to house or year.
- Course schedules, subject enrollments, house pairings, Quidditch positions, and council ranks remain to be designed; examples are not canon.

### Suggested schedule record
```ts
type Lesson = {
  id: string;
  academicYear: 5 | 6 | 7;
  term: string;
  weekday: number;
  period: string;
  subject: string;
  houseGroup: string[];
  enrolledCharacterIds: string[];
  location: string;
};
```

## Additional course
| Alchemy / 炼金术 | No fixed instructor named in the books / 原著未指定固定教师 | Only offered when enough students enroll; classroom unspecified | Optional advanced elective, availability conditional |
