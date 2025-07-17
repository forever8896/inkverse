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
    description: "Create a simple creature with closed eyes. Deploy your first flipper contract to bring it to life!",
    difficulty: "Beginner",
    duration: "20 min",
    objectives: [
      "Understand ink! contract basics and syntax",
      "Create your first bio-engineered creature",
      "Deploy a flipper contract on-chain",
      "Watch your creature's eyes open for the first time"
    ],
    steps: [
      {
        id: 1,
        title: "🧬 Your First ink! Contract",
        content: `
<h1>Welcome to Bio-Engineering! 🧬</h1>

<p>You're about to create your first digital creature using ink! - Polkadot's smart contract language!</p>

<p>On the right, you'll see the basic template for an ink! smart contract. This is the foundation that every ink! contract needs.</p>

<h2>What you see:</h2>
<ul>
<li><code>#![cfg_attr...]</code> - Rust configuration for blockchain deployment</li>
<li><code>#[ink::contract]</code> - This tells Rust "this is an ink! smart contract"</li>
<li><code>mod flipper</code> - Creates a module called "flipper" for our contract</li>
</ul>

<div style="background: #059669; border: 1px solid #10b981; border-radius: 8px; padding: 16px; margin: 16px 0; color: white;">
<strong>✅ Perfect!</strong> This template is ready. Click <strong>Next →</strong> to start building your creature!
</div>

<p>No code changes needed for this step - just get familiar with the structure! 🎉</p>
        `,
        code: `#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod flipper {
    // Your creature will live here!
}`,
        expectedCode: `#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod flipper {
    // Your creature will live here!
}`,
        hint: "No code changes needed for this step - just familiarize yourself with the template!"
      },
      {
        id: 2,
        title: "🧠 Add a Brain (Storage)",
        content: `
<h1>Give Your Creature a Brain! 🧠</h1>

<p>Every creature needs memory to remember if it's awake or asleep. In ink!, we call this <strong>storage</strong>.</p>

<h2>What to do:</h2>
<ol>
<li>Look at the code on the right</li>
<li>Find the comment <code>// Your creature will live here!</code></li>
<li>Replace that comment with this storage structure:</li>
</ol>

<div style="background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin: 16px 0; font-family: monospace;">
#[ink(storage)]<br>
pub struct Flipper {<br>
    /// Stores a single \`bool\` value on the storage.<br>
    value: bool,<br>
}
</div>

<div style="background: #1e293b; border: 1px solid #475569; border-radius: 8px; padding: 16px; margin: 16px 0;">
<strong>📝 Your task:</strong> Copy the code above and paste it to replace the comment! Then click <strong>Check Code</strong> to validate.
</div>

<p>This creates your creature's brain that can remember one thing: whether it's awake (true) or asleep (false).</p>
        `,
        code: `#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod flipper {
    // Your creature will live here!
}`,
        expectedCode: `#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod flipper {
    /// Defines the storage of your contract.
    /// Add new fields to the below struct in order
    /// to add new static storage fields to your contract.
    #[ink(storage)]
    pub struct Flipper {
        /// Stores a single \`bool\` value on the storage.
        value: bool,
    }
}`,
        hint: "Replace the comment '// Your creature will live here!' with the storage struct code",
        validation: [
          { type: "includes", patterns: ["#[ink(storage)]"] },
          { type: "includes", patterns: ["struct Flipper"] },
          { type: "includes", patterns: ["value: bool"] },
        ],
      },
      {
        id: 3,
        title: "🐣 Birth Your Creature (Constructor)",
        content: `
<h1>Bring Your Creature to Life! 🐣</h1>

<p>Now your creature needs a "birth ceremony" - a constructor that brings it to life when deployed to the blockchain.</p>

<h2>What to do:</h2>
<p>After the storage struct (after the closing <code>}</code>), add this constructor:</p>

<div style="background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin: 16px 0; font-family: monospace;">
<br>
    impl Flipper {<br>
        /// Constructor that initializes the \`bool\` value to the given \`init_value\`.<br>
        #[ink(constructor)]<br>
        pub fn new(init_value: bool) -> Self {<br>
            Self { value: init_value }<br>
        }<br>
<br>
        /// Constructor that initializes the \`bool\` value to \`false\`.<br>
        #[ink(constructor)]<br>
        pub fn default() -> Self {<br>
            Self::new(Default::default())<br>
        }<br>
    }
</div>

<div style="background: #1e293b; border: 1px solid #475569; border-radius: 8px; padding: 16px; margin: 16px 0;">
<strong>📝 Your task:</strong> Copy and paste this code after the storage struct! Then click <strong>Check Code</strong>.
</div>

<p>This creates two ways to birth your creature: with a specific starting state, or asleep by default.</p>
        `,
        code: `#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod flipper {
    /// Defines the storage of your contract.
    /// Add new fields to the below struct in order
    /// to add new static storage fields to your contract.
    #[ink(storage)]
    pub struct Flipper {
        /// Stores a single \`bool\` value on the storage.
        value: bool,
    }
}`,
        expectedCode: `#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod flipper {
    /// Defines the storage of your contract.
    /// Add new fields to the below struct in order
    /// to add new static storage fields to your contract.
    #[ink(storage)]
    pub struct Flipper {
        /// Stores a single \`bool\` value on the storage.
        value: bool,
    }

    impl Flipper {
        /// Constructor that initializes the \`bool\` value to the given \`init_value\`.
        #[ink(constructor)]
        pub fn new(init_value: bool) -> Self {
            Self { value: init_value }
        }

        /// Constructor that initializes the \`bool\` value to \`false\`.
        ///
        /// Constructors can delegate to other constructors.
        #[ink(constructor)]
        pub fn default() -> Self {
            Self::new(Default::default())
        }
    }
}`,
        hint: "Add the impl block with both constructors after the storage struct",
        validation: [
          { type: "includes", patterns: ["impl Flipper"] },
          { type: "includes", patterns: ["#[ink(constructor)]"] },
          { type: "includes", patterns: ["pub fn new"] },
          { type: "includes", patterns: ["pub fn default"] },
        ],
      },
      {
        id: 4,
        title: "👁️ Teach Your Creature to Speak",
        content: `
<h1>Your Creature's First Words! 👁️‍🗨️</h1>

<p>Your creature can think, but it can't talk yet! Let's teach it to answer when someone asks "Are you awake?"</p>

<h2>What to do:</h2>
<p>Inside the <code>impl Flipper</code> block, after the constructors, add this getter function:</p>

<div style="background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin: 16px 0; font-family: monospace;">
<br>
        /// Simply returns the current value of our \`bool\`.<br>
        #[ink(message)]<br>
        pub fn get(&self) -> bool {<br>
            self.value<br>
        }
</div>

<div style="background: #1e293b; border: 1px solid #475569; border-radius: 8px; padding: 16px; margin: 16px 0;">
<strong>📝 Your task:</strong> Copy and paste this inside the impl block, after the constructors! Then click <strong>Check Code</strong>.
</div>

<p>This lets your creature answer "true" if it's awake or "false" if it's asleep. The <code>#[ink(message)]</code> makes it a public function that can be called from outside the contract.</p>
        `,
        code: `#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod flipper {
    /// Defines the storage of your contract.
    /// Add new fields to the below struct in order
    /// to add new static storage fields to your contract.
    #[ink(storage)]
    pub struct Flipper {
        /// Stores a single \`bool\` value on the storage.
        value: bool,
    }

    impl Flipper {
        /// Constructor that initializes the \`bool\` value to the given \`init_value\`.
        #[ink(constructor)]
        pub fn new(init_value: bool) -> Self {
            Self { value: init_value }
        }

        /// Constructor that initializes the \`bool\` value to \`false\`.
        ///
        /// Constructors can delegate to other constructors.
        #[ink(constructor)]
        pub fn default() -> Self {
            Self::new(Default::default())
        }
    }
}`,
        expectedCode: `#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod flipper {
    /// Defines the storage of your contract.
    /// Add new fields to the below struct in order
    /// to add new static storage fields to your contract.
    #[ink(storage)]
    pub struct Flipper {
        /// Stores a single \`bool\` value on the storage.
        value: bool,
    }

    impl Flipper {
        /// Constructor that initializes the \`bool\` value to the given \`init_value\`.
        #[ink(constructor)]
        pub fn new(init_value: bool) -> Self {
            Self { value: init_value }
        }

        /// Constructor that initializes the \`bool\` value to \`false\`.
        ///
        /// Constructors can delegate to other constructors.
        #[ink(constructor)]
        pub fn default() -> Self {
            Self::new(Default::default())
        }

        /// Simply returns the current value of our \`bool\`.
        #[ink(message)]
        pub fn get(&self) -> bool {
            self.value
        }
    }
}`,
        hint: "Add the get message function inside the impl block, after the constructors",
        validation: [
          { type: "includes", patterns: ["#[ink(message)]"] },
          { type: "includes", patterns: ["pub fn get"] },
          { type: "includes", patterns: ["self.value"] },
        ],
      },
      {
        id: 5,
        title: "🔄 The Power of Transformation",
        content: `
<h1>Ultimate Power: Shape-Shifting! 🔄</h1>

<p>Now for the final magical power - let your creature flip between awake and asleep at will!</p>

<h2>What to do:</h2>
<p>Add one more function inside the <code>impl</code> block:</p>

<div style="background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin: 16px 0; font-family: monospace;">
<br>
        /// A message that can be called on instantiated contracts.<br>
        /// This one flips the value of the stored \`bool\` from \`true\`<br>
        /// to \`false\` and vice versa.<br>
        #[ink(message)]<br>
        pub fn flip(&mut self) {<br>
            self.value = !self.value;<br>
        }
</div>

<div style="background: #1e293b; border: 1px solid #475569; border-radius: 8px; padding: 16px; margin: 16px 0;">
<strong>📝 Your task:</strong> Copy and paste this as the last function in your impl block! Then click <strong>Check Code</strong>.
</div>

<h2>🎉 Congratulations!</h2>
<p>Once you add this, your creature will be complete! It can:</p>
<ul>
<li>✅ Remember if it's awake or asleep (storage)</li>
<li>✅ Be born with a chosen state (constructors)</li>
<li>✅ Tell others its state (getter)</li>
<li>✅ Transform between awake and asleep (flipper)</li>
</ul>

<div style="background: #059669; border: 1px solid #10b981; border-radius: 8px; padding: 16px; margin: 16px 0; color: white;">
<strong>🌟 Your creature will awaken when you complete this step!</strong> Watch its eyes open! 👁️‍🗨️
</div>

<p>You've just built your first complete ink! smart contract - a digital creature that lives on the blockchain! 🧬✨</p>
        `,
        code: `#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod flipper {
    /// Defines the storage of your contract.
    /// Add new fields to the below struct in order
    /// to add new static storage fields to your contract.
    #[ink(storage)]
    pub struct Flipper {
        /// Stores a single \`bool\` value on the storage.
        value: bool,
    }

    impl Flipper {
        /// Constructor that initializes the \`bool\` value to the given \`init_value\`.
        #[ink(constructor)]
        pub fn new(init_value: bool) -> Self {
            Self { value: init_value }
        }

        /// Constructor that initializes the \`bool\` value to \`false\`.
        ///
        /// Constructors can delegate to other constructors.
        #[ink(constructor)]
        pub fn default() -> Self {
            Self::new(Default::default())
        }

        /// Simply returns the current value of our \`bool\`.
        #[ink(message)]
        pub fn get(&self) -> bool {
            self.value
        }
    }
}`,
        expectedCode: `#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod flipper {
    /// Defines the storage of your contract.
    /// Add new fields to the below struct in order
    /// to add new static storage fields to your contract.
    #[ink(storage)]
    pub struct Flipper {
        /// Stores a single \`bool\` value on the storage.
        value: bool,
    }

    impl Flipper {
        /// Constructor that initializes the \`bool\` value to the given \`init_value\`.
        #[ink(constructor)]
        pub fn new(init_value: bool) -> Self {
            Self { value: init_value }
        }

        /// Constructor that initializes the \`bool\` value to \`false\`.
        ///
        /// Constructors can delegate to other constructors.
        #[ink(constructor)]
        pub fn default() -> Self {
            Self::new(Default::default())
        }

        /// A message that can be called on instantiated contracts.
        /// This one flips the value of the stored \`bool\` from \`true\`
        /// to \`false\` and vice versa.
        #[ink(message)]
        pub fn flip(&mut self) {
            self.value = !self.value;
        }

        /// Simply returns the current value of our \`bool\`.
        #[ink(message)]
        pub fn get(&self) -> bool {
            self.value
        }
    }
}`,
        hint: "Add the flip function inside the impl block, after the get function",
        validation: [
          { type: "includes", patterns: ["pub fn flip"] },
          { type: "includes", patterns: ["&mut self"] },
          { type: "includes", patterns: ["self.value = !self.value"] },
        ],
      },
    ],
    completed: false,
    locked: false,
  },
  {
    id: 2,
    title: "Growing Limbs",
    description: "Design your creature's body and legs. Control its walking speed and movement patterns.",
    difficulty: "Beginner",
    duration: "25 min",
    objectives: [
      "Learn about ink! functions and events",
      "Add body parts to your creature",
      "Implement walking mechanics",
      "Control movement speed and patterns"
    ],
    steps: [],
    completed: false,
    locked: true,
  },
  {
    id: 3,
    title: "Elixir of Consciousness",
    description: "Your creature grows thirsty! Feed it the elixir of life and watch it become super conscious.",
    difficulty: "Intermediate",
    duration: "30 min",
    objectives: [
      "Learn integration testing with ink!",
      "Simulate contract interactions",
      "Implement drinking mechanics",
      "Unlock creature consciousness"
    ],
    steps: [],
    completed: false,
    locked: true,
  },
  {
    id: 4,
    title: "Into the Wild",
    description: "Deploy your fully conscious creature into the wild using PopCLI. Set it free on the blockchain!",
    difficulty: "Advanced",
    duration: "35 min",
    objectives: [
      "Master PopCLI deployment",
      "Deploy to live networks",
      "Monitor your creature in the wild",
      "Complete the bio-engineering journey"
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
