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

<p>You're about to create your first digital creature!</p>

<p>On the right, you'll see the basic template for an ink! smart contract. This is the foundation that every ink! contract needs.</p>

<h2>What you see:</h2>
<ul>
<li><code>#![cfg_attr...]</code> - Rust configuration (just ignore this for now)</li>
<li><code>#[ink::contract]</code> - This tells Rust "this is an ink! smart contract"</li>
<li><code>mod flipper</code> - Creates a module called "flipper" for our contract</li>
</ul>

<div style="background: #1e293b; border: 1px solid #475569; border-radius: 8px; padding: 16px; margin: 16px 0;">
<strong>Your task:</strong> Just read through this code and click "Next" when ready. No changes needed yet!
</div>

<p>The template is already perfect for step 1. 🎉</p>
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
        hint: "No code changes needed for this step - just familiarize yourself with the template!",
        validation: [
          { type: "includes", patterns: ["#[ink::contract]"] },
          { type: "includes", patterns: ["mod flipper"] },
        ],
      },
      {
        id: 2,
        title: "🧠 Add a Brain (Storage)",
        content: `
<h1>Give Your Creature a Brain! 🧠</h1>

<p>Every creature needs memory to remember if it's awake or asleep.</p>

<h2>What to do:</h2>
<ol>
<li>Look at the code on the right</li>
<li>Find the comment <code>// Your creature will live here!</code></li>
<li>Replace that comment with this exact code:</li>
</ol>

<div style="background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin: 16px 0; font-family: monospace;">
#[ink(storage)]<br>
pub struct Flipper {<br>
&nbsp;&nbsp;&nbsp;&nbsp;value: bool,<br>
}
</div>

<div style="background: #1e293b; border: 1px solid #475569; border-radius: 8px; padding: 16px; margin: 16px 0;">
<strong>Copy the code above and paste it to replace the comment!</strong>
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
    #[ink(storage)]
    pub struct Flipper {
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

<p>Now your creature needs a "birth ceremony" - a way to come alive when deployed to the blockchain.</p>

<h2>What to do:</h2>
<p>After the storage struct (after the closing <code>}</code>), add this code:</p>

<div style="background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin: 16px 0; font-family: monospace;">
<br>
impl Flipper {<br>
&nbsp;&nbsp;&nbsp;&nbsp;#[ink(constructor)]<br>
&nbsp;&nbsp;&nbsp;&nbsp;pub fn new(init_value: bool) -> Self {<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Self { value: init_value }<br>
&nbsp;&nbsp;&nbsp;&nbsp;}<br>
}
</div>

<div style="background: #1e293b; border: 1px solid #475569; border-radius: 8px; padding: 16px; margin: 16px 0;">
<strong>Copy and paste this code after the storage struct!</strong>
</div>

<p>This creates a "new" function that gives birth to your creature and sets whether it starts awake or asleep.</p>
        `,
        code: `#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod flipper {
    #[ink(storage)]
    pub struct Flipper {
        value: bool,
    }
}`,
        expectedCode: `#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod flipper {
    #[ink(storage)]
    pub struct Flipper {
        value: bool,
    }

    impl Flipper {
        #[ink(constructor)]
        pub fn new(init_value: bool) -> Self {
            Self { value: init_value }
        }
    }
}`,
        hint: "Add the impl block with the constructor after the storage struct",
        validation: [
          { type: "includes", patterns: ["impl Flipper"] },
          { type: "includes", patterns: ["#[ink(constructor)]"] },
          { type: "includes", patterns: ["pub fn new"] },
        ],
      },
      {
        id: 4,
        title: "👁️ Teach Your Creature to Talk",
        content: `
<h1>Your Creature's First Words! 👁️‍🗨️</h1>

<p>Your creature can think, but it can't talk yet! Let's teach it to answer when someone asks "Are you awake?"</p>

<h2>What to do:</h2>
<p>Inside the <code>impl Flipper</code> block, after the constructor, add:</p>

<div style="background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin: 16px 0; font-family: monospace;">
<br>
&nbsp;&nbsp;&nbsp;&nbsp;#[ink(message)]<br>
&nbsp;&nbsp;&nbsp;&nbsp;pub fn get(&self) -> bool {<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;self.value<br>
&nbsp;&nbsp;&nbsp;&nbsp;}
</div>

<div style="background: #1e293b; border: 1px solid #475569; border-radius: 8px; padding: 16px; margin: 16px 0;">
<strong>Copy and paste this inside the impl block, after the constructor!</strong>
</div>

<p>This lets your creature answer "true" if it's awake or "false" if it's asleep.</p>
        `,
        code: `#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod flipper {
    #[ink(storage)]
    pub struct Flipper {
        value: bool,
    }

    impl Flipper {
        #[ink(constructor)]
        pub fn new(init_value: bool) -> Self {
            Self { value: init_value }
        }
    }
}`,
        expectedCode: `#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod flipper {
    #[ink(storage)]
    pub struct Flipper {
        value: bool,
    }

    impl Flipper {
        #[ink(constructor)]
        pub fn new(init_value: bool) -> Self {
            Self { value: init_value }
        }

        #[ink(message)]
        pub fn get(&self) -> bool {
            self.value
        }
    }
}`,
        hint: "Add the get message function inside the impl block, after the constructor",
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
&nbsp;&nbsp;&nbsp;&nbsp;#[ink(message)]<br>
&nbsp;&nbsp;&nbsp;&nbsp;pub fn flip(&mut self) {<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;self.value = !self.value;<br>
&nbsp;&nbsp;&nbsp;&nbsp;}
</div>

<div style="background: #1e293b; border: 1px solid #475569; border-radius: 8px; padding: 16px; margin: 16px 0;">
<strong>Copy and paste this as the last function in your impl block!</strong>
</div>

<h2>🎉 Congratulations!</h2>
<p>Once you add this, your creature will be complete! It can:</p>
<ul>
<li>✅ Remember if it's awake or asleep</li>
<li>✅ Tell others its state</li>
<li>✅ Transform between awake and asleep</li>
</ul>

<div style="background: #059669; border: 1px solid #10b981; border-radius: 8px; padding: 16px; margin: 16px 0; color: white;">
<strong>Your creature will awaken when you complete this step!</strong> 👁️‍🗨️
</div>
        `,
        code: `#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod flipper {
    #[ink(storage)]
    pub struct Flipper {
        value: bool,
    }

    impl Flipper {
        #[ink(constructor)]
        pub fn new(init_value: bool) -> Self {
            Self { value: init_value }
        }

        #[ink(message)]
        pub fn get(&self) -> bool {
            self.value
        }
    }
}`,
        expectedCode: `#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod flipper {
    #[ink(storage)]
    pub struct Flipper {
        value: bool,
    }

    impl Flipper {
        #[ink(constructor)]
        pub fn new(init_value: bool) -> Self {
            Self { value: init_value }
        }

        #[ink(message)]
        pub fn get(&self) -> bool {
            self.value
        }

        #[ink(message)]
        pub fn flip(&mut self) {
            self.value = !self.value;
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
