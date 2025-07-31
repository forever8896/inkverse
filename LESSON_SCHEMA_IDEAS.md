From o3:

Below is a pragmatic —but still future-proof—TypeScript schema that covers everything a contributor needs to ship a new lesson without touching runtime code.
I’ve leaned on patterns used by Codecademy, Exercism, Cryptozombies, and a few Solidity-focused boot-camps.

```ts
/**
 * -----------------------------------------------------------
 *  MonstersInk! Lesson Schema                                     v1.0.0
 * -----------------------------------------------------------
 *
 *  • Each lesson lives in a single JSON/TS file that
 *    conforms to the interfaces below.
 *  • Only markdown + plain-text are allowed in content fields
 *    to keep rendering logic in the app, not in the lesson.
 *  • Files are validated at build-time with zod / json-schema.
 *  • All optional fields are marked with “?”; everything else
 *    is required.
 */

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type LessonKind = 'tutorial' | 'challenge' | 'project';
export type Language = 'ink'; // room to add "rust" | "solidity" later
export type RewardKind = 'xp' | 'item' | 'nft';

/** ----------------------------------------
 * 1.  Top-level lesson manifest
 * ------------------------------------- */
export interface Lesson {
  /** Stable, URL-safe identifier (slug). */
  id: string;

  /** Human-readable title shown in UI + SEO tags. */
  title: string;

  /** One-line elevator pitch for card views (≈ 140 chars). */
  summary: string;

  /** Longer marketing copy (markdown) for landing page. */
  description: string;

  /** The language the code editor should load. */
  language: Language;

  /** Minutes it takes an average learner to finish. */
  estDurationMin: number;

  /** Beginner, intermediate, advanced — used for filtering. */
  difficulty: Difficulty;

  /** "tutorial" (guided), "challenge" (no scaffolding), "project" (multi-step). */
  kind: LessonKind;

  /** Tags for search & filtering: ["storage", "NFT", "testing"] */
  tags: string[];

  /** IDs of lessons that MUST be completed first. */
  prerequisites?: string[];

  /** Array of ordered steps (see below). */
  steps: Step[];

  /** Optional rewards given on completion. */
  rewards?: Reward[];

  /** Free-form author credits and metadata. */
  author: AuthorMeta;

  /** Used for breaking changes in the schema. */
  schemaVersion: '1.0.0';
}

/** ----------------------------------------
 * 2.  Per-step definition
 * ------------------------------------- */
export interface Step {
  /** Local step id (must be unique within lesson). */
  id: string;

  /** What the learner sees in the sidebar. */
  title: string;

  /** Markdown content (supports fenced code blocks & images). */
  contentMd: string;

  /**
   * Code pre-loaded into the editor **before** the learner types
   * (`undefined` ⇒ keep previous step’s editor state).
   */
  starterCode?: string;

  /**
   * Minimal code the learner must end up with after this step.
   * Used to re-populate the editor if they “Reset” the step.
   */
  solutionCode?: string;

  /** Array of validation checks that must all pass. */
  tests: ValidationTest[];

  /** Optional hint buttons — shown one at a time on demand. */
  hints?: Hint[];

  /** XP or item reward granted immediately after passing this step. */
  stepReward?: Reward;
}

/** ----------------------------------------
 * 3.  Validation layer
 * ------------------------------------- */
export interface ValidationTest {
  /** Developer-friendly name (“Constructor present”). */
  name: string;

  /**
   * “pattern” = simple include/exclude;
   * “compile” = compile contract in WASM & run custom checker;
   * “unit”    = run unit test file in Wasm sandbox.
   */
  type: 'pattern' | 'compile' | 'unit';

  /** Only for type="pattern". */
  pattern?: {
    includes?: string[]; // must be present
    excludes?: string[]; // must NOT be present
    regex?: string | string[]; // JS regex as string
  };

  /** Only for type="compile" | "unit":  path to helper in /validators */
  validatorFn?: string;

  /** Message shown if the test fails (plain-text, no markdown). */
  failMessage: string;

  /** Severity: block progression or just warn. */
  level: 'error' | 'warning';
}

/** ----------------------------------------
 * 4.  Rewards & gamification
 * ------------------------------------- */
export interface Reward {
  kind: RewardKind;
  /** e.g. 100 xp  OR  "egg-shell-pattern-blue" for items */
  value: number | string;
}

export interface Hint {
  /** Hint text (markdown allowed). */
  text: string;
  /** 0-based index; lower numbers reveal first. */
  order: number;
}

export interface AuthorMeta {
  name: string; // “Alice Smith”
  twitter?: string; // “@alice”
  website?: string;
  repo?: string; // link to source-code if open-sourced
}
```

---

### Why these fields?

| Section                                 | Rationale                                                                                 |
| --------------------------------------- | ----------------------------------------------------------------------------------------- |
| **id / title / summary / description**  | Separates SEO-friendly metadata (summary) from longer landing-page content (description). |
| **language**                            | Leaves room to add Rust or Solidity lessons later without a new schema.                   |
| **estDurationMin**                      | Enables progress bars like “\~15 min left”. Power-users appreciate time budgeting.        |
| **difficulty / kind / tags**            | Filter + search facets from day 1—critical once you have dozens of lessons.               |
| **prerequisites**                       | Simple DAG lets you lock advanced content until prior concepts are mastered.              |
| **steps\[]**                            | Fine-grained control; step-level rewards keep dopamine flowing.                           |
| **starterCode / solutionCode**          | Eliminates brittle “diff” logic when users press “Reset to starter”.                      |
| **ValidationTest.type**                 | Splits cheap string checks from heavier WASM compilation; keeps runtime fast on mobile.   |
| **pattern.includes / excludes / regex** | Covers 95 % of quick checks without invoking the compiler.                                |
| **validatorFn**                         | Pointer to custom TS/RS code for edge-cases (e.g., ABI conformance).                      |
| **level**                               | Lets you surface best-practice warnings without blocking progress.                        |
| **rewards**                             | Extensible vs. hardcoding XP; NFT rewards planned for Milestone 2 slot straight in.       |
| **schemaVersion**                       | Safe migrations—loader can refuse unknown versions at runtime.                            |
| **AuthorMeta**                          | Automatic attribution & “edit on GitHub” links encourage community contributions.         |

---

### Usage pattern

```ts
import lessonJson from "@/content/lessons/intro-to-storage.json";

// zod parsing + narrow typing:
const lesson: Lesson = lessonSchema.parse(lessonJson);

// In lesson page:
<LessonPlayer lesson={lesson} />
```

**Hot reload**: Because each file is pure data, Next.js can invalidate only the JSON when a contributor edits it—no rebuild of lesson runtime code.

---

### Next steps

1. **zod / AJV JSON-Schema generation** – generate a `.schema.json` from the interfaces so contributors get IDE validation even in plain JSON files.
2. **cli `npx monstersink new-lesson`** – scaffold a pre-filled JSON with placeholder steps, pulls git user name into `author`.
3. **Markdown licences** – keep code+text in the JSON but store media in `/public/creatures` to avoid bloating diffs.

This schema keeps your hack-night velocity while giving external contributors a one-file, friction-free path to add content.
