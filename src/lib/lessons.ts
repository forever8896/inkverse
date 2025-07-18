export interface ValidationRule {
  type: "includes" | "excludes" | "regex" | "custom";
  patterns: string[];
  message?: string;
}

export interface LessonStep {
  id: number;
  title: string;
  content: string;
  code?: string;
  expectedCode?: string;
  hint?: string;
  validation?: ValidationRule[];
  image?: string; // Optional image URL or import for this step
}

export interface Lesson {
  id: number;
  title: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  duration: string;
  objectives: string[];
  steps: LessonStep[];
  completed: boolean;
  locked: boolean;
}

const lessons: Lesson[] = [
  {
    id: 1,
    title: "Awakening Eyes",
    description:
      "Create a simple creature with closed eyes. Deploy your first flipper contract to bring it to life!",
    difficulty: "Beginner",
    duration: "20 min",
    objectives: [
      "Understand ink! contract basics and syntax",
      "Create your first bio-engineered creature",
      "Deploy a flipper contract on-chain",
      "Watch your creature's eyes open for the first time",
    ],
    steps: [
      {
        id: 1,
        title: "🥚 Meet Your Mysterious Egg",
        image: "/creatures/first_egg.png",
        content: `
<h1>Welcome! 🧬</h1>

<p>You're about to create your first digital creature using <strong>ink!</strong> - Polkadot's smart contract language!</p>

<p>Every ink! contract starts with this basic template. Think of it as the DNA blueprint for your creature.</p>

<div style="background: #059669; border: 1px solid #10b981; border-radius: 8px; padding: 5px 10px; margin: 16px 0; color: white;">
<strong>✅ Task Complete!</strong> Just observe the code structure - no changes needed yet!
</div>
        `,
        code: `#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod creature {
    // Your creature will live here!
}`,
        expectedCode: `#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod creature {
    // Your creature will live here!
}`,
        hint: "This is your foundation! Every ink! contract needs these lines to work on the blockchain. No changes needed - just get familiar with the structure!",
      },
      {
        id: 2,
        title: "🧠 Add Storage Structure",
        image: "/creatures/egg_cracks.png",
        content: `
<h1>Give Your Creature Memory! 🧠</h1>

<p>Your creature needs memory to remember if it's awake or sleeping.</p>

<h2>Your Task:</h2>
<p>Replace the comment with a storage structure.</p>

<div style="background: #1e293b; border: 1px solid #475569; border-radius: 8px; padding: 16px; margin: 16px 0;">
<strong>💡 Add these 4 lines:</strong><br>
1. <code>#[ink(storage)]</code><br>
2. <code>pub struct Creature {</code><br>
3. <code>&nbsp;&nbsp;&nbsp;&nbsp;is_conscious: bool,</code><br>
4. <code>}</code>
</div>
        `,
        code: `#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod creature {
    // Your creature will live here!
}`,
        expectedCode: `#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod creature {
    #[ink(storage)]
    pub struct Creature {
        is_conscious: bool,
    }
}`,
        hint: "Replace the comment with the storage structure. Start with #[ink(storage)], then create the struct with one boolean field!",
        validation: [
          { type: "includes", patterns: ["#[ink(storage)]"] },
          { type: "includes", patterns: ["struct Creature"] },
          { type: "includes", patterns: ["is_conscious"] },
          { type: "includes", patterns: ["bool"] },
        ],
      },
      {
        id: 3,
        title: "🏗️ Add Implementation Block",
        image: "/creatures/egg_cracks.png",
        content: `
<h1>Create the Implementation Block! 🏗️</h1>

<p>Now we need to add functions to your creature. First, create the implementation block.</p>

<h2>Your Task:</h2>
<p>After the struct, add an empty implementation block.</p>

<div style="background: #1e293b; border: 1px solid #475569; border-radius: 8px; padding: 16px; margin: 16px 0;">
<strong>💡 Add these 3 lines after the struct:</strong><br>
1. Empty line<br>
2. <code>impl Creature {</code><br>
3. <code>}</code>
</div>
        `,
        code: `#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod creature {
    #[ink(storage)]
    pub struct Creature {
        is_conscious: bool,
    }
}`,
        expectedCode: `#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod creature {
    #[ink(storage)]
    pub struct Creature {
        is_conscious: bool,
    }

    impl Creature {
    }
}`,
        hint: "Add 'impl Creature { }' after the struct to create a place for your creature's functions!",
        validation: [{ type: "includes", patterns: ["impl Creature"] }],
      },
      {
        id: 4,
        title: "🐣 Add Birth Constructor",
        image: "/creatures/first_sleeping.png",
        content: `
<h1>Birth Your Creature! 🐣</h1>

<p>Every creature needs a way to be born. Let's add a constructor!</p>

<h2>Your Task:</h2>
<p>Inside the impl block, add a constructor function.</p>

<div style="background: #1e293b; border: 1px solid #475569; border-radius: 8px; padding: 16px; margin: 16px 0;">
<strong>💡 Add inside the impl block:</strong><br>
<code>#[ink(constructor)]</code><br>
<code>pub fn new() -> Self {</code><br>
<code>&nbsp;&nbsp;&nbsp;&nbsp;Self { is_conscious: false }</code><br>
<code>}</code>
</div>
        `,
        code: `#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod creature {
    #[ink(storage)]
    pub struct Creature {
        is_conscious: bool,
    }

    impl Creature {
    }
}`,
        expectedCode: `#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod creature {
    #[ink(storage)]
    pub struct Creature {
        is_conscious: bool,
    }

    impl Creature {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self { is_conscious: false }
        }
    }
}`,
        hint: "Add the constructor inside the impl block. Don't forget the #[ink(constructor)] attribute!",
        validation: [
          { type: "includes", patterns: ["#[ink(constructor)]"] },
          { type: "includes", patterns: ["pub fn new"] },
          { type: "includes", patterns: ["Self { is_conscious: false }"] },
        ],
      },
      {
        id: 5,
        title: "👁️ Add Status Check",
        image: "/creatures/first_sleeping.png",
        content: `
<h1>Let Your Creature Speak! 👁️</h1>

<p>Your creature needs to tell others if it's awake or sleeping.</p>

<h2>Your Task:</h2>
<p>Add a function to check if the creature is awake.</p>

<div style="background: #1e293b; border: 1px solid #475569; border-radius: 8px; padding: 16px; margin: 16px 0;">
<strong>💡 Add after the constructor:</strong><br>
<code>#[ink(message)]</code><br>
<code>pub fn is_awake(&self) -> bool {</code><br>
<code>&nbsp;&nbsp;&nbsp;&nbsp;self.is_conscious</code><br>
<code>}</code>
</div>
        `,
        code: `#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod creature {
    #[ink(storage)]
    pub struct Creature {
        is_conscious: bool,
    }

    impl Creature {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self { is_conscious: false }
        }
    }
}`,
        expectedCode: `#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod creature {
    #[ink(storage)]
    pub struct Creature {
        is_conscious: bool,
    }

    impl Creature {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self { is_conscious: false }
        }

        #[ink(message)]
        pub fn is_awake(&self) -> bool {
            self.is_conscious
        }
    }
}`,
        hint: `This function is a read (getter) function. In ink! smart contracts, &self means you're only reading data, not changing anything. 

Add #[ink(message)] above your function to make it callable from outside. 

pub fn is_awake(&self) -> bool simply checks the creature's state and returns it—like asking, "Are you awake?". This does not change the contract's storage, it just reports the answer!`,
        validation: [
          { type: "includes", patterns: ["#[ink(message)]"] },
          { type: "includes", patterns: ["pub fn is_awake"] },
          { type: "includes", patterns: ["&self"] },
        ],
      },
      {
        id: 6,
        title: "🔄 Add Wake Up Power",
        image: "/creatures/first_awake.png",
        content: `
<h1>The Final Power: Wake Up! 🔄</h1>

<p>Give your creature the ultimate ability - to control its own consciousness!</p>

<h2>Your Task:</h2>
<p>Add a function to toggle the creature's consciousness.</p>

<div style="background: #1e293b; border: 1px solid #475569; border-radius: 8px; padding: 16px; margin: 16px 0;">
<strong>💡 Add after the is_awake function:</strong><br>
<code>#[ink(message)]</code><br>
<code>pub fn wake_up(&mut self) {</code><br>
<code>&nbsp;&nbsp;&nbsp;&nbsp;self.is_conscious = !self.is_conscious;</code><br>
<code>}</code>
</div>

<div style="background: #059669; border: 1px solid #10b981; border-radius: 8px; padding: 16px; margin: 16px 0; color: white;">
<strong>🌟 Your creature will awaken when you complete this!</strong> Watch its eyes open! 👁️
</div>
        `,
        code: `#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod creature {
    #[ink(storage)]
    pub struct Creature {
        is_conscious: bool,
    }

    impl Creature {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self { is_conscious: false }
        }

        #[ink(message)]
        pub fn is_awake(&self) -> bool {
            self.is_conscious
        }
    }
}`,
        expectedCode: `#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod creature {
    #[ink(storage)]
    pub struct Creature {
        is_conscious: bool,
    }

    impl Creature {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self { is_conscious: false }
        }

        #[ink(message)]
        pub fn is_awake(&self) -> bool {
            self.is_conscious
        }

        #[ink(message)]
        pub fn wake_up(&mut self) {
            self.is_conscious = !self.is_conscious;
        }
    }
}`,
        hint: `This function is a write (setter) function. In ink!, using &mut self means you want to change the contract's state. 

Add #[ink(message)] above your function to make it callable from outside. 

pub fn wake_up(&mut self) lets your creature switch its state—like flipping a light switch! The ! operator flips the boolean: true becomes false and vice versa. This function modifies the blockchain storage!`,
        validation: [
          { type: "includes", patterns: ["#[ink(message)]"] },
          { type: "includes", patterns: ["pub fn wake_up"] },
          { type: "includes", patterns: ["&mut self"] },
          { type: "includes", patterns: ["!self.is_conscious"] },
        ],
      },
     
    ],
    completed: false,
    locked: false,
  },
  {
    id: 2,
    title: "Growing Limbs",
    description:
      "Design your creature's body and legs. Control its walking speed and movement patterns.",
    difficulty: "Beginner",
    duration: "25 min",
    objectives: [
      "Learn about ink! functions and events",
      "Add body parts to your creature",
      "Implement walking mechanics",
      "Control movement speed and patterns",
    ],
    steps: [],
    completed: false,
    locked: true,
  },
  {
    id: 3,
    title: "Elixir of Consciousness",
    description:
      "Your creature grows thirsty! Feed it the elixir of life and watch it become super conscious.",
    difficulty: "Intermediate",
    duration: "30 min",
    objectives: [
      "Learn integration testing with ink!",
      "Simulate contract interactions",
      "Implement drinking mechanics",
      "Unlock creature consciousness",
    ],
    steps: [],
    completed: false,
    locked: true,
  },
  {
    id: 4,
    title: "Into the Wild",
    description:
      "Deploy your fully conscious creature into the wild using PopCLI. Set it free on the blockchain!",
    difficulty: "Advanced",
    duration: "35 min",
    objectives: [
      "Master PopCLI deployment",
      "Deploy to live networks",
      "Monitor your creature in the wild",
      "Complete the bio-engineering journey",
    ],
    steps: [],
    completed: false,
    locked: true,
  },
];

export function getLessonById(id: number): Lesson | undefined {
  return lessons.find((lesson) => lesson.id === id);
}

export function getAllLessons(): Lesson[] {
  return lessons;
}

export function getNextLesson(currentId: number): Lesson | undefined {
  return lessons.find((lesson) => lesson.id === currentId + 1);
}

export function getPreviousLesson(currentId: number): Lesson | undefined {
  return lessons.find((lesson) => lesson.id === currentId - 1);
}

// Client-side validation function
export function validateCode(code: string, rules: ValidationRule[]): boolean {
  return rules.every((rule) => {
    switch (rule.type) {
      case "includes":
        return rule.patterns.every((pattern) => code.includes(pattern));
      case "excludes":
        return rule.patterns.every((pattern) => !code.includes(pattern));
      case "regex":
        return rule.patterns.every((pattern) => new RegExp(pattern).test(code));
      default:
        return true;
    }
  });
}
