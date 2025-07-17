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
    title: "Your First Contract",
    description: "Build a simple Flipper contract and learn the basics of ink! syntax",
    difficulty: "Beginner",
    duration: "15 min",
    completed: false,
    locked: false,
    objectives: [
      "Understand the basic structure of an ink! contract",
      "Learn about contract storage and state",
      "Write constructor and message functions",
      "Compile your first contract"
    ],
    steps: [
      {
        id: 1,
        title: "Welcome to ink!",
        content: `
# Welcome to ink! Smart Contracts! 🎉

**ink!** is Parity's smart contract language for the Polkadot ecosystem. It's built on top of Rust, which means you get all the safety and performance benefits of Rust, plus the ability to deploy on any Substrate-based blockchain.

## What makes ink! special?

- **Memory Safe**: Built on Rust, ink! prevents common vulnerabilities
- **Fast Execution**: Compiles to WebAssembly for blazing performance  
- **Interoperable**: Deploy on Polkadot, Kusama, and all Substrate chains
- **Developer Friendly**: Use familiar Rust tooling and ecosystem

In this lesson, we'll build a simple "Flipper" contract - the "Hello World" of smart contracts. It stores a boolean value that can be flipped between true and false.

Let's start by looking at the basic structure of an ink! contract!
        `,
      },
      {
        id: 2,
        title: "Contract Structure",
        content: `
# Basic Contract Structure

Every ink! contract follows a similar pattern. Let's break down the key components:

## 1. Contract Module
The contract is defined inside a module with the \`#[ink::contract]\` attribute.

## 2. Storage Struct  
This defines what data your contract stores on the blockchain.

## 3. Implementation Block
Contains your constructor and message functions.

Let's build our Flipper contract step by step. Start by creating the contract module and storage:
        `,
        code: `#![cfg_attr(not(feature = "std"), no_std)]

use ink_lang as ink;

#[ink::contract]
mod flipper {
    // TODO: Add storage struct here
}`,
        expectedCode: `#![cfg_attr(not(feature = "std"), no_std)]

use ink_lang as ink;

#[ink::contract]
mod flipper {
    #[ink(storage)]
    pub struct Flipper {
        value: bool,
    }
}`,
        hint: "Add a storage struct with the #[ink(storage)] attribute that contains a boolean field called 'value'",
        validation: [
          { type: "includes", patterns: ["#[ink(storage)]"] },
          { type: "includes", patterns: ["struct Flipper"] },
          { type: "includes", patterns: ["value: bool"] }
        ]
      },
      {
        id: 3,
        title: "Constructor Function",
        content: `
# Adding the Constructor

Great! Now we need to add a constructor function. In ink!, constructors are marked with \`#[ink(constructor)]\` and are responsible for initializing the contract's storage.

Our Flipper contract will have a constructor that takes an initial boolean value:
        `,
        code: `#![cfg_attr(not(feature = "std"), no_std)]

use ink_lang as ink;

#[ink::contract]
mod flipper {
    #[ink(storage)]
    pub struct Flipper {
        value: bool,
    }

    impl Flipper {
        // TODO: Add constructor function here
    }
}`,
        expectedCode: `#![cfg_attr(not(feature = "std"), no_std)]

use ink_lang as ink;

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
        hint: "Add a constructor function with #[ink(constructor)] that takes a bool parameter and returns Self",
        validation: [
          { type: "includes", patterns: ["#[ink(constructor)]"] },
          { type: "includes", patterns: ["pub fn new"] },
          { type: "includes", patterns: ["init_value: bool"] },
          { type: "includes", patterns: ["-> Self"] }
        ]
      },
      {
        id: 4,
        title: "Message Functions",
        content: `
# Adding Message Functions

Now let's add the core functionality! Message functions are public functions that can be called by users. They're marked with \`#[ink(message)]\`.

We need two functions:
- \`get()\` - Returns the current value (read-only)
- \`flip()\` - Toggles the boolean value (modifies state)

Add these functions to complete your Flipper contract:
        `,
        code: `#![cfg_attr(not(feature = "std"), no_std)]

use ink_lang as ink;

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

        // TODO: Add get() message function here

        // TODO: Add flip() message function here
    }
}`,
        expectedCode: `#![cfg_attr(not(feature = "std"), no_std)]

use ink_lang as ink;

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
        hint: "Add two message functions: get(&self) -> bool and flip(&mut self). Use #[ink(message)] attribute.",
        validation: [
          { type: "includes", patterns: ["#[ink(message)]"] },
          { type: "includes", patterns: ["pub fn get"] },
          { type: "includes", patterns: ["pub fn flip"] },
          { type: "includes", patterns: ["&mut self"] }
        ]
      },
      {
        id: 5,
        title: "Congratulations!",
        content: `
# 🎉 Congratulations! You've built your first ink! contract!

You've successfully created a complete Flipper contract that demonstrates the core concepts of ink! development:

## What you've learned:
- ✅ Contract module structure with \`#[ink::contract]\`
- ✅ Storage definition with \`#[ink(storage)]\`  
- ✅ Constructor functions with \`#[ink(constructor)]\`
- ✅ Message functions with \`#[ink(message)]\`
- ✅ Mutable vs immutable references (\`&mut self\` vs \`&self\`)

## Key concepts:
- **Storage**: Where your contract's data lives on the blockchain
- **Constructor**: Initializes your contract when it's deployed
- **Messages**: Public functions that users can call
- **Mutability**: Functions that modify state need \`&mut self\`

Your Flipper contract can now:
- Store a boolean value on the blockchain
- Read the current value with \`get()\`
- Toggle the value with \`flip()\`

## Next Steps
In the next lesson, we'll explore different data types and more complex storage patterns. You'll learn how to store numbers, strings, collections, and custom types.

Ready to continue your ink! journey?
        `,
      }
    ]
  },
  // Additional lessons would be added here...
];

export function getLessonById(id: number): Lesson | undefined {
  return lessons.find(lesson => lesson.id === id);
}

export function getAllLessons(): Lesson[] {
  return lessons;
}

export function getNextLesson(currentId: number): Lesson | undefined {
  return lessons.find(lesson => lesson.id === currentId + 1);
}

export function getPreviousLesson(currentId: number): Lesson | undefined {
  return lessons.find(lesson => lesson.id === currentId - 1);
}

// Client-side validation function
export function validateCode(code: string, rules: ValidationRule[]): boolean {
  return rules.every(rule => {
    switch (rule.type) {
      case "includes":
        return rule.patterns.every(pattern => code.includes(pattern));
      case "excludes":
        return rule.patterns.every(pattern => !code.includes(pattern));
      case "regex":
        return rule.patterns.every(pattern => new RegExp(pattern).test(code));
      default:
        return true;
    }
  });
} 