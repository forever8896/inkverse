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
        hint: "Add the message function after the constructor. Use &self to read the creature's state!",
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
        hint: "Add the wake_up function with &mut self to change the creature's state. Use ! to flip the boolean!",
        validation: [
          { type: "includes", patterns: ["#[ink(message)]"] },
          { type: "includes", patterns: ["pub fn wake_up"] },
          { type: "includes", patterns: ["&mut self"] },
          { type: "includes", patterns: ["!self.is_conscious"] },
        ],
      },
      {
        id: 2,
        title: "🧠 Give Your Creature Memory",
        image: "/creatures/egg_cracks.png",
        content: `
<h1>Give Your Creature a Brain! 🧠</h1>

<p>Every creature needs memory to remember if it's awake or asleep. In ink!, we call this <strong>storage</strong>.</p>

<h2>Your Task:</h2>
<p>Replace the comment <code>// Your creature will live here!</code> with a storage structure.</p>

<h3>Step by step:</h3>
<ol>
<li>First, add the storage attribute: <code>#[ink(storage)]</code></li>
<li>Then create a public struct called <code>Creature</code></li>
<li>Inside the struct, add a field called <code>is_conscious</code> of type <code>bool</code></li>
<li>Add a comment above the field explaining what it stores</li>
</ol>

<div style="background: #1e293b; border: 1px solid #475569; border-radius: 8px; padding: 16px; margin: 16px 0;">
<strong>💡 Hint:</strong> Remember to use proper Rust syntax - struct fields need commas, and don't forget the curly braces!
</div>

<div style="background: #451a03; border: 1px solid #92400e; border-radius: 8px; padding: 16px; margin: 16px 0; color: #fef3c7;">
<strong>🎯 Goal:</strong> Create storage that tracks whether your creature is awake (conscious) or asleep!
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
    /// The creature's memory - tracks its consciousness state
    #[ink(storage)]
    pub struct Creature {
        /// Whether the creature is currently conscious/awake
        is_conscious: bool,
    }
}`,
        hint: "Think of this as giving your creature a brain! First, add #[ink(storage)] above your struct to tell ink! this will be stored on the blockchain. Then create 'pub struct Creature { is_conscious: bool, }' - the 'pub' makes it public, and don't forget the comma after the field!",
        validation: [
          { type: "includes", patterns: ["#[ink(storage)]"] },
          { type: "includes", patterns: ["struct Creature"] },
          { type: "includes", patterns: ["is_conscious"] },
          { type: "includes", patterns: ["bool"] },
        ],
      },
      {
        id: 3,
        title: "🐣 Birth Your Creature",
        image: "/creatures/first_sleeping.png",
        content: `
<h1>Bring Your Creature to Life! 🐣</h1>

<p>Now your creature needs a "birth ceremony" - a constructor that brings it to life when deployed to the blockchain.</p>

<h2>Your Task:</h2>
<p>After the storage struct, create an implementation block with two constructors.</p>

<h3>Step by step:</h3>
<ol>
<li>Start with <code>impl Creature {</code></li>
<li>Create a constructor called <code>birth_awake</code> that takes a <code>conscious</code> parameter</li>
<li>Add the <code>#[ink(constructor)]</code> attribute above it</li>
<li>Make it return <code>Self { is_conscious: conscious }</code></li>
<li>Create another constructor called <code>birth_sleeping</code> with no parameters</li>
<li>Make it call <code>Self::birth_awake(false)</code></li>
<li>Don't forget to close the impl block with <code>}</code></li>
</ol>

<div style="background: #1e293b; border: 1px solid #475569; border-radius: 8px; padding: 16px; margin: 16px 0;">
<strong>💡 Hint:</strong> Both functions need <code>pub fn</code> and the constructor attribute. The first one needs <code>-> Self</code> return type.
</div>

<div style="background: #451a03; border: 1px solid #92400e; border-radius: 8px; padding: 16px; margin: 16px 0; color: #fef3c7;">
<strong>🎯 Goal:</strong> Create two ways to birth your creature - awake or sleeping!
</div>
        `,
        code: `#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod creature {
    /// The creature's memory - tracks its consciousness state
    #[ink(storage)]
    pub struct Creature {
        /// Whether the creature is currently conscious/awake
        is_conscious: bool,
    }
}`,
        expectedCode: `#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod creature {
    /// The creature's memory - tracks its consciousness state
    #[ink(storage)]
    pub struct Creature {
        /// Whether the creature is currently conscious/awake
        is_conscious: bool,
    }

    impl Creature {
        /// Birth a creature with a specific consciousness state
        #[ink(constructor)]
        pub fn birth_awake(conscious: bool) -> Self {
            Self { is_conscious: conscious }
        }

        /// Birth a creature that starts sleeping
        #[ink(constructor)]
        pub fn birth_sleeping() -> Self {
            Self::birth_awake(false)
        }
    }
}`,
        hint: "Constructors are like birth ceremonies! Create 'impl Creature {' first. Then add '#[ink(constructor)]' before each function. For 'birth_awake', it should be 'pub fn birth_awake(conscious: bool) -> Self { Self { is_conscious: conscious } }'. For 'birth_sleeping', just call the first one: 'Self::birth_awake(false)'. Don't forget the closing '}' for the impl block!",
        validation: [
          { type: "includes", patterns: ["impl Creature"] },
          { type: "includes", patterns: ["#[ink(constructor)]"] },
          { type: "includes", patterns: ["birth_awake"] },
          { type: "includes", patterns: ["birth_sleeping"] },
        ],
      },
      {
        id: 4,
        title: "👁️ Teach Your Creature to Respond",
        image: "/creatures/first_sleeping.png",
        content: `
<h1>Your Creature's First Communication! 👁️‍🗨️</h1>

<p>Your creature can think, but it can't communicate yet! Let's teach it to respond when someone asks about its consciousness.</p>

<h2>Your Task:</h2>
<p>Add a message function that allows others to check if your creature is awake.</p>

<h3>Step by step:</h3>
<ol>
<li>Inside the existing <code>impl Creature</code> block (after the constructors)</li>
<li>Add the <code>#[ink(message)]</code> attribute</li>
<li>Create a public function called <code>is_awake</code></li>
<li>It should take <code>&self</code> as parameter and return <code>bool</code></li>
<li>Make it return <code>self.is_conscious</code></li>
</ol>

<div style="background: #1e293b; border: 1px solid #475569; border-radius: 8px; padding: 16px; margin: 16px 0;">
<strong>💡 Hint:</strong> Message functions are like getter methods - they let external users read the creature's state without changing it.
</div>

<div style="background: #451a03; border: 1px solid #92400e; border-radius: 8px; padding: 16px; margin: 16px 0; color: #fef3c7;">
<strong>🎯 Goal:</strong> Let your creature answer "Am I awake?" when asked!
</div>
        `,
        code: `#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod creature {
    /// The creature's memory - tracks its consciousness state
    #[ink(storage)]
    pub struct Creature {
        /// Whether the creature is currently conscious/awake
        is_conscious: bool,
    }

    impl Creature {
        /// Birth a creature with a specific consciousness state
        #[ink(constructor)]
        pub fn birth_awake(conscious: bool) -> Self {
            Self { is_conscious: conscious }
        }

        /// Birth a creature that starts sleeping
        #[ink(constructor)]
        pub fn birth_sleeping() -> Self {
            Self::birth_awake(false)
        }
    }
}`,
        expectedCode: `#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod creature {
    /// The creature's memory - tracks its consciousness state
    #[ink(storage)]
    pub struct Creature {
        /// Whether the creature is currently conscious/awake
        is_conscious: bool,
    }

    impl Creature {
        /// Birth a creature with a specific consciousness state
        #[ink(constructor)]
        pub fn birth_awake(conscious: bool) -> Self {
            Self { is_conscious: conscious }
        }

        /// Birth a creature that starts sleeping
        #[ink(constructor)]
        pub fn birth_sleeping() -> Self {
            Self::birth_awake(false)
        }

        /// Check if the creature is currently awake
        #[ink(message)]
        pub fn is_awake(&self) -> bool {
            self.is_conscious
        }
    }
}`,
        hint: "Message functions let others talk to your creature! Add '#[ink(message)]' above the function. Use '&self' for read-only access (like asking a question). The full function: 'pub fn is_awake(&self) -> bool { self.is_conscious }'. The '&self' means 'borrow me temporarily' and '-> bool' means 'return a true/false answer'.",
        validation: [
          { type: "includes", patterns: ["#[ink(message)]"] },
          { type: "includes", patterns: ["pub fn is_awake"] },
          { type: "includes", patterns: ["&self"] },
          { type: "includes", patterns: ["self.is_conscious"] },
        ],
      },
      {
        id: 5,
        title: "🔄 The Power of Consciousness Toggle",
        image: "/creatures/first_awake.png",
        content: `
<h1>Ultimate Power: Consciousness Control! 🔄</h1>

<p>Now for the final magical ability - let your creature control its own consciousness, switching between awake and asleep at will!</p>

<h2>Your Task:</h2>
<p>Add the final function that gives your creature the power to toggle its consciousness.</p>

<h3>Step by step:</h3>
<ol>
<li>Add the <code>#[ink(message)]</code> attribute</li>
<li>Create a public function called <code>toggle_consciousness</code></li>
<li>It should take <code>&mut self</code> (mutable reference) and return nothing</li>
<li>Inside, flip the consciousness: <code>self.is_conscious = !self.is_conscious;</code></li>
</ol>

<div style="background: #1e293b; border: 1px solid #475569; border-radius: 8px; padding: 16px; margin: 16px 0;">
<strong>💡 Hint:</strong> Use <code>&mut self</code> because we're changing the creature's state. The <code>!</code> operator flips a boolean value.
</div>

<h2>🎉 Congratulations!</h2>
<p>Once you add this, your creature will be complete! It can:</p>
<ul>
<li>✅ Remember its consciousness state (storage)</li>
<li>✅ Be born awake or sleeping (constructors)</li>
<li>✅ Tell others if it's awake (getter)</li>
<li>✅ Control its own consciousness (toggle)</li>
</ul>

<div style="background: #059669; border: 1px solid #10b981; border-radius: 8px; padding: 16px; margin: 16px 0; color: white;">
<strong>🌟 Your creature will awaken when you complete this step!</strong> Watch its eyes open! 👁️‍🗨️
</div>

<p>You've just built your first complete ink! smart contract - a digital creature that lives on the blockchain! 🧬✨</p>
        `,
        code: `#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod creature {
    /// The creature's memory - tracks its consciousness state
    #[ink(storage)]
    pub struct Creature {
        /// Whether the creature is currently conscious/awake
        is_conscious: bool,
    }

    impl Creature {
        /// Birth a creature with a specific consciousness state
        #[ink(constructor)]
        pub fn birth_awake(conscious: bool) -> Self {
            Self { is_conscious: conscious }
        }

        /// Birth a creature that starts sleeping
        #[ink(constructor)]
        pub fn birth_sleeping() -> Self {
            Self::birth_awake(false)
        }

        /// Check if the creature is currently awake
        #[ink(message)]
        pub fn is_awake(&self) -> bool {
            self.is_conscious
        }
    }
}`,
        expectedCode: `#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod creature {
    /// The creature's memory - tracks its consciousness state
    #[ink(storage)]
    pub struct Creature {
        /// Whether the creature is currently conscious/awake
        is_conscious: bool,
    }

    impl Creature {
        /// Birth a creature with a specific consciousness state
        #[ink(constructor)]
        pub fn birth_awake(conscious: bool) -> Self {
            Self { is_conscious: conscious }
        }

        /// Birth a creature that starts sleeping
        #[ink(constructor)]
        pub fn birth_sleeping() -> Self {
            Self::birth_awake(false)
        }

        /// Check if the creature is currently awake
        #[ink(message)]
        pub fn is_awake(&self) -> bool {
            self.is_conscious
        }

        /// Toggle the creature's consciousness between awake and sleeping
        #[ink(message)]
        pub fn toggle_consciousness(&mut self) {
            self.is_conscious = !self.is_conscious;
        }
    }
}`,
        hint: "This gives your creature the power to change itself! Use '&mut self' for mutable access (permission to change things). The function: 'pub fn toggle_consciousness(&mut self) { self.is_conscious = !self.is_conscious; }'. The '!' operator is like a magic switch - it flips true to false and false to true. Don't forget the semicolon at the end!",
        validation: [
          { type: "includes", patterns: ["pub fn toggle_consciousness"] },
          { type: "includes", patterns: ["&mut self"] },
          {
            type: "includes",
            patterns: ["self.is_conscious = !self.is_conscious"],
          },
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
