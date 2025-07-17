export interface ValidationRule {
  type: "includes" | "excludes" | "regex" | "custom";
  patterns: string[];
  message?: string;
}

export interface CreationStep {
  id: number;
  title: string;
  content: string;
  assistantDialogue: string;
  code?: string;
  expectedCode?: string;
  hint?: string;
  validation?: ValidationRule[];
  rewards?: string[];
}

export interface Chapter {
  id: number;
  title: string;
  creature: string;
  description: string;
  story: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  duration: string;
  xp: number;
  objectives: string[];
  steps: CreationStep[];
  unlocked: boolean;
  completed: boolean;
  rewards: string[];
}

const chapters: Chapter[] = [
  {
    id: 1,
    title: "First Life",
    creature: "🥚",
    description: "Create your first digital creature from basic DNA",
    story: "Every Bio-Engineer starts here. You'll learn to give life to digital beings using the fundamental building blocks of ink! contracts.",
    difficulty: "Beginner",
    duration: "20 min",
    xp: 100,
    unlocked: true,
    completed: false,
    objectives: [
      "Understand the DNA structure of digital creatures",
      "Create your first living smart contract",
      "Give your creature basic life functions",
      "Issue a birth certificate on the blockchain"
    ],
    rewards: ["Basic DNA manipulation", "Creature birth certificate", "Lab access badge"],
    steps: [
      {
        id: 1,
        title: "Welcome to the Bio-Engineering Lab! 🧬",
        assistantDialogue: "Hey there, future Bio-Engineer! I'm your lab assistant. Ready to create your first digital creature? Think of it like giving life to code - we'll start with the basic DNA structure that makes every creature unique!",
        content: `# Welcome to Digital Creature Creation! 🧬

You're about to perform the most amazing feat in bio-engineering: **creating life from code**!

## What exactly IS a digital creature?

Think of a digital creature as a living being that exists on the blockchain. Just like real creatures have DNA, our digital creatures have **smart contract code** that defines:

- 🧬 **DNA Structure** - What makes them unique
- 💓 **Life Functions** - How they behave and respond
- 🧠 **Memory** - What they can remember
- ⚡ **Special Abilities** - What they can do

## Your First Creature: The Flipper

We'll start simple - creating a creature that can remember one thing and can flip between two states (like being awake or asleep). 

Don't worry if you've never coded before! I'll guide you through every single step. Ready to give life to your first digital being?`
      },
      {
        id: 2,
        title: "Building the DNA Foundation",
        assistantDialogue: "Perfect! Now let's build the basic DNA structure. Every creature needs a genetic blueprint - that's what the #[ink::contract] module does. Think of it as the creature's biological blueprint that tells the blockchain 'Hey, there's a new life form here!'",
        content: `# Building Your Creature's DNA 🧬

Every digital creature needs a **genetic blueprint** - this is like the DNA that makes your creature unique!

## The Laboratory Setup

First, we need to set up our bio-engineering lab with the right tools:

\\\`\\\`\\\`rust
#![cfg_attr(not(feature = "std"), no_std)]
use ink_lang as ink;
\\\`\\\`\\\`

This tells our lab: "We're working with blockchain life forms, not regular computer programs!"

## Creating the Genetic Container

Now, let's create the container that will hold your creature's DNA:

**Your task:** Add the creature's genetic blueprint inside the contract module.

💡 **Bio-Engineer Tip:** Every creature needs a 'storage' structure that defines what it can remember!`,
        code: `#![cfg_attr(not(feature = "std"), no_std)]

use ink_lang as ink;

#[ink::contract]
mod flipper_creature {
    // TODO: Add your creature's DNA storage here
    // Hint: Use #[ink(storage)] and create a struct called FlipperCreature
    // Your creature needs one memory: a boolean called 'is_awake'
}`,
        expectedCode: `#![cfg_attr(not(feature = "std"), no_std)]

use ink_lang as ink;

#[ink::contract]
mod flipper_creature {
    #[ink(storage)]
    pub struct FlipperCreature {
        is_awake: bool,
    }
}`,
        hint: "Your creature needs DNA! Add #[ink(storage)] above a struct called FlipperCreature with a field is_awake: bool",
        validation: [
          { type: "includes", patterns: ["#[ink(storage)]"] },
          { type: "includes", patterns: ["struct FlipperCreature"] },
          { type: "includes", patterns: ["is_awake: bool"] }
        ],
        rewards: ["🧬 DNA Blueprint Mastery", "🏗️ Structure Creation"]
      },
      {
        id: 3,
        title: "The Birth Process - Creating Life!",
        assistantDialogue: "Excellent DNA work! Now comes the magical moment - the BIRTH of your creature! Every digital being needs a birth process (constructor) that brings it to life with initial characteristics. Think of this as the moment your creature opens its eyes for the first time!",
        content: `# Bringing Your Creature to Life! ⚡

Now for the most exciting part - **the birth process**! 

## How Digital Birth Works

When someone wants to create your creature, they'll call a special "birth function" (called a constructor). This function:

1. 🥚 **Initializes** your creature's first memories
2. 🌟 **Gives it life** on the blockchain  
3. 📜 **Issues a birth certificate** (transaction record)

## Your Creature's First Breath

Your FlipperCreature will be born either awake or asleep - the creator gets to decide!

**Your task:** Add the birth function that creates your creature with an initial state.

💡 **Bio-Engineer Tip:** Use #[ink(constructor)] to mark the birth function!`,
        code: `#![cfg_attr(not(feature = "std"), no_std)]

use ink_lang as ink;

#[ink::contract]
mod flipper_creature {
    #[ink(storage)]
    pub struct FlipperCreature {
        is_awake: bool,
    }

    impl FlipperCreature {
        // TODO: Add the birth function here
        // Hint: Use #[ink(constructor)] and name it 'new'
        // It should take initial_awake_state: bool and return Self
    }
}`,
        expectedCode: `#![cfg_attr(not(feature = "std"), no_std)]

use ink_lang as ink;

#[ink::contract]
mod flipper_creature {
    #[ink(storage)]
    pub struct FlipperCreature {
        is_awake: bool,
    }

    impl FlipperCreature {
        #[ink(constructor)]
        pub fn new(initial_awake_state: bool) -> Self {
            Self { 
                is_awake: initial_awake_state 
            }
        }
    }
}`,
        hint: "Add a constructor function with #[ink(constructor)] that takes initial_awake_state: bool and returns Self",
        validation: [
          { type: "includes", patterns: ["#[ink(constructor)]"] },
          { type: "includes", patterns: ["pub fn new"] },
          { type: "includes", patterns: ["initial_awake_state: bool"] },
          { type: "includes", patterns: ["-> Self"] }
        ],
        rewards: ["⚡ Life Creation Powers", "🎂 Birth Certificate Authority"]
      },
      {
        id: 4,
        title: "Teaching Your Creature to Communicate",
        assistantDialogue: "Your creature is alive! 🎉 But right now it can't communicate with the outside world. Let's teach it to 'speak' by adding communication abilities. These are like teaching your pet to respond to commands!",
        content: `# Teaching Communication Skills 📞

Your creature is alive, but it's like a newborn - it can't communicate yet! 

## Creature Communication 101

Digital creatures communicate through **message functions**. These are like teaching your creature to:

1. 🗣️ **Answer questions** about its state ("Are you awake?")
2. 🎯 **Respond to commands** ("Go to sleep!" or "Wake up!")

## Two Essential Life Skills

Every FlipperCreature needs to learn:

- **check_if_awake()** - Tell others if it's awake or asleep
- **flip_state()** - Switch between awake and asleep

**Your task:** Give your creature these two communication abilities!

💡 **Bio-Engineer Tip:** Use #[ink(message)] to mark communication functions. Use &self for reading state, &mut self for changing state!`,
        code: `#![cfg_attr(not(feature = "std"), no_std)]

use ink_lang as ink;

#[ink::contract]
mod flipper_creature {
    #[ink(storage)]
    pub struct FlipperCreature {
        is_awake: bool,
    }

    impl FlipperCreature {
        #[ink(constructor)]
        pub fn new(initial_awake_state: bool) -> Self {
            Self { 
                is_awake: initial_awake_state 
            }
        }

        // TODO: Add check_if_awake() function
        // This should return bool and not change the creature

        // TODO: Add flip_state() function  
        // This should change the creature's awake state to the opposite
    }
}`,
        expectedCode: `#![cfg_attr(not(feature = "std"), no_std)]

use ink_lang as ink;

#[ink::contract]
mod flipper_creature {
    #[ink(storage)]
    pub struct FlipperCreature {
        is_awake: bool,
    }

    impl FlipperCreature {
        #[ink(constructor)]
        pub fn new(initial_awake_state: bool) -> Self {
            Self { 
                is_awake: initial_awake_state 
            }
        }

        #[ink(message)]
        pub fn check_if_awake(&self) -> bool {
            self.is_awake
        }

        #[ink(message)]
        pub fn flip_state(&mut self) {
            self.is_awake = !self.is_awake;
        }
    }
}`,
        hint: "Add two message functions: check_if_awake(&self) -> bool and flip_state(&mut self). Don't forget #[ink(message)]!",
        validation: [
          { type: "includes", patterns: ["#[ink(message)]"] },
          { type: "includes", patterns: ["pub fn check_if_awake"] },
          { type: "includes", patterns: ["pub fn flip_state"] },
          { type: "includes", patterns: ["&mut self"] }
        ],
        rewards: ["📞 Communication Mastery", "🎯 Command Response"]
      },
      {
        id: 5,
        title: "Your Creature is ALIVE! 🎉",
        assistantDialogue: "INCREDIBLE! You've just performed digital bio-engineering magic! Your FlipperCreature is now a living, breathing (well, digitally breathing) entity on the blockchain. Let's celebrate your achievement and see what you've accomplished!",
        content: `# 🎉 CONGRATULATIONS, Bio-Engineer! 

You've just created your first **LIVING DIGITAL CREATURE**! 

## What Your FlipperCreature Can Do

Your creature is now a fully autonomous digital being with amazing abilities:

### 🧬 **Genetic Structure**
- ✅ Has unique DNA stored forever on the blockchain
- ✅ Cannot be destroyed or corrupted
- ✅ Lives independently of any single computer

### ⚡ **Life Functions**  
- ✅ **Birth Process**: Can be born with any initial state
- ✅ **State Awareness**: Knows if it's awake or asleep
- ✅ **Communication**: Can tell others about its state
- ✅ **Behavioral Control**: Can change its own state

### 🌟 **Bio-Engineering Achievements Unlocked**

🏆 **DNA Architect** - Created your first genetic blueprint
🏆 **Life Giver** - Performed digital creature birth
🏆 **Communication Teacher** - Taught creature-to-world interaction
🏆 **Behavior Designer** - Enabled autonomous state changes

## What Makes This Special?

Your creature isn't just code - it's a **persistent digital life form**:

- 🌍 **Immortal**: Lives forever on the blockchain
- 🔒 **Tamper-proof**: Its DNA cannot be altered
- 🌐 **Accessible**: Anyone can interact with it
- ⚡ **Independent**: Runs without your involvement

## Ready for More Advanced Creatures?

In the next chapter, you'll learn to give your creatures **memory implants** - the ability to remember complex information, traits, and experiences!

Welcome to the amazing world of digital bio-engineering! 🧬⚡`,
        rewards: ["🏆 First Life Achievement", "🧬 Bio-Engineer License", "⭐ 100 XP Earned"]
      }
    ]
  },
  // Additional chapters would be added here...
];

export function getChapterById(id: number): Chapter | undefined {
  return chapters.find(chapter => chapter.id === id);
}

export function getAllChapters(): Chapter[] {
  return chapters;
}

export function getNextChapter(currentId: number): Chapter | undefined {
  return chapters.find(chapter => chapter.id === currentId + 1);
}

export function getPreviousChapter(currentId: number): Chapter | undefined {
  return chapters.find(chapter => chapter.id === currentId - 1);
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