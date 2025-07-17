export interface CodeSuggestion {
  text: string;
  description: string;
  category: "structure" | "storage" | "constructor" | "message" | "event" | "error";
  icon: string;
}

export interface SimpleStep {
  id: number;
  title: string;
  problem: string;
  solution: string;
  goal: string;
  targetCode: string;
  suggestions: CodeSuggestion[];
  successMessage: string;
  icon: string;
}

export interface SimpleChapter {
  id: number;
  title: string;
  creature: string;
  tagline: string;
  story: string;
  steps: SimpleStep[];
  completed: boolean;
}

const simpleChapters: SimpleChapter[] = [
  {
    id: 1,
    title: "First Life",
    creature: "🥚",
    tagline: "Hatch your first digital creature!",
    story: "Welcome to the Bio-Engineering Lab! You've found a mysterious digital egg 🥚. Your mission: bring it to life using ink! smart contracts. But first, you need to set up your laboratory equipment...",
    completed: false,
    steps: [
      {
        id: 1,
        title: "🔬 Power Up the Laboratory",
        problem: "The lab equipment is offline! Your bio-engineering station needs power before you can create any creatures.",
        solution: "Flip the main power switch to activate your ink! laboratory. This tells the blockchain you're ready to create smart contracts!",
        goal: "Turn on the lab power",
        icon: "⚡",
        targetCode: `#[ink::contract]
mod my_creature {

}`,
        suggestions: [
          {
            text: "#[ink::contract]",
            description: "🔌 Main power switch - turns on the lab!",
            category: "structure",
            icon: "⚡"
          },
          {
            text: "mod my_creature {",
            description: "🏗️ Create your creature workspace",
            category: "structure", 
            icon: "🧪"
          },
          {
            text: "}",
            description: "🔒 Close the workspace safely",
            category: "structure",
            icon: "🔒"
          }
        ],
        successMessage: "⚡ BZZT! Lab powered up! The machines are humming and ready for bio-engineering!"
      },
      {
        id: 2,
        title: "🧠 The Creature Has Amnesia!",
        problem: "Oh no! Your creature hatched but it can't remember ANYTHING - not even if it's awake or asleep! It needs a brain to store memories.",
        solution: "Install a memory chip (storage) so your creature can remember basic information like whether it's awake or sleeping.",
        goal: "Give your creature a memory",
        icon: "🧠",
        targetCode: `#[ink::contract]
mod my_creature {
    #[ink(storage)]
    pub struct Creature {
        is_awake: bool,
    }
}`,
        suggestions: [
          {
            text: "#[ink(storage)]",
            description: "🧠 Install memory chip in creature's brain",
            category: "storage",
            icon: "🧠"
          },
          {
            text: "pub struct Creature {",
            description: "🏗️ Design the creature's body structure",
            category: "storage",
            icon: "🦴"
          },
          {
            text: "is_awake: bool,",
            description: "💤 Memory slot: Am I awake? (true/false)",
            category: "storage",
            icon: "😴"
          },
          {
            text: "}",
            description: "✨ Complete the brain installation",
            category: "storage",
            icon: "✨"
          }
        ],
        successMessage: "🧠 Success! Your creature now has a working memory and can remember if it's awake or sleeping!"
      },
      {
        id: 3,
        title: "🐣 The Creature Won't Wake Up!",
        problem: "Your creature has a brain but it's just lying there motionless! It needs a 'birth ceremony' to come to life with its first memory.",
        solution: "Create a magical birth ritual (constructor) that awakens your creature and sets its initial state.",
        goal: "Perform the birth ceremony",
        icon: "🐣",
        targetCode: `#[ink::contract]
mod my_creature {
    #[ink(storage)]
    pub struct Creature {
        is_awake: bool,
    }

    impl Creature {
        #[ink(constructor)]
        pub fn new(awake: bool) -> Self {
            Self { is_awake: awake }
        }
    }
}`,
        suggestions: [
          {
            text: "impl Creature {",
            description: "🔮 Begin the magical implementation ritual",
            category: "constructor",
            icon: "🔮"
          },
          {
            text: "#[ink(constructor)]",
            description: "🐣 Cast the birth spell",
            category: "constructor",
            icon: "🐣"
          },
          {
            text: "pub fn new(awake: bool) -> Self {",
            description: "✨ The awakening incantation",
            category: "constructor",
            icon: "⭐"
          },
          {
            text: "Self { is_awake: awake }",
            description: "💫 Breathe life into the creature!",
            category: "constructor",
            icon: "💫"
          },
          {
            text: "}",
            description: "🎉 Complete the birth ceremony",
            category: "constructor",
            icon: "🎉"
          }
        ],
        successMessage: "🐣 IT'S ALIVE! Your creature has awakened and taken its first breath of digital life!"
      },
      {
        id: 4,
        title: "😶 Your Creature is Mute!",
        problem: "People keep asking your creature 'Are you awake?' but it just stares blankly! It can't talk back to anyone.",
        solution: "Teach your creature its first word! Add a communication function so it can answer simple questions.",
        goal: "Teach creature to speak",
        icon: "💬",
        targetCode: `#[ink::contract]
mod my_creature {
    #[ink(storage)]
    pub struct Creature {
        is_awake: bool,
    }

    impl Creature {
        #[ink(constructor)]
        pub fn new(awake: bool) -> Self {
            Self { is_awake: awake }
        }

        #[ink(message)]
        pub fn is_awake(&self) -> bool {
            self.is_awake
        }
    }
}`,
        suggestions: [
          {
            text: "#[ink(message)]",
            description: "📢 Install voice box for communication",
            category: "message",
            icon: "📢"
          },
          {
            text: "pub fn is_awake(&self) -> bool {",
            description: "❓ Teach creature to answer: 'Am I awake?'",
            category: "message",
            icon: "❓"
          },
          {
            text: "self.is_awake",
            description: "🧠 Creature checks its memory and responds",
            category: "message",
            icon: "💭"
          },
          {
            text: "}",
            description: "🗣️ First words complete!",
            category: "message",
            icon: "🗣️"
          }
        ],
        successMessage: "💬 Amazing! Your creature spoke its first words! It can now answer when people ask if it's awake!"
      },
      {
        id: 5,
        title: "😴 Creature is Stuck Sleeping!",
        problem: "Your creature fell asleep and now it's STUCK! No matter what anyone does, it won't wake up. It needs a 'wake up' button!",
        solution: "Add a magical wake-up command that lets others shake your creature awake when it's sleeping.",
        goal: "Add wake-up button",
        icon: "☀️",
        targetCode: `#[ink::contract]
mod my_creature {
    #[ink(storage)]
    pub struct Creature {
        is_awake: bool,
    }

    impl Creature {
        #[ink(constructor)]
        pub fn new(awake: bool) -> Self {
            Self { is_awake: awake }
        }

        #[ink(message)]
        pub fn is_awake(&self) -> bool {
            self.is_awake
        }

        #[ink(message)]
        pub fn wake_up(&mut self) {
            self.is_awake = true;
        }
    }
}`,
        suggestions: [
          {
            text: "#[ink(message)]",
            description: "⏰ Install magical alarm system",
            category: "message",
            icon: "⏰"
          },
          {
            text: "pub fn wake_up(&mut self) {",
            description: "☀️ Create the wake-up spell",
            category: "message",
            icon: "☀️"
          },
          {
            text: "self.is_awake = true;",
            description: "✨ *POKE* Change memory to 'awake'!",
            category: "message",
            icon: "👆"
          },
          {
            text: "}",
            description: "🌅 Wake-up button installed!",
            category: "message",
            icon: "🌅"
          }
        ],
        successMessage: "☀️ Perfect! Now anyone can wake up your sleepy creature! You've created your first living digital being! 🎉"
      }
    ]
  },
  {
    id: 2,
    title: "Growing Up",
    creature: "🧠",
    tagline: "Your creature needs an identity!",
    story: "Your creature has grown up and is tired of being called 'Hey you!' It wants a name, an age, and its own personality. Time to upgrade that simple brain to something more sophisticated!",
    completed: false,
    steps: [
      {
        id: 1,
        title: "😢 Identity Crisis!",
        problem: "Your creature is having an existential crisis! It doesn't know its name, age, or anything about itself. The simple true/false memory isn't enough anymore!",
        solution: "Perform a brain upgrade surgery! Replace the simple memory with a sophisticated multi-slot brain that can store complex information.",
        goal: "Upgrade creature's brain",
        icon: "🧠",
        targetCode: `#[ink::contract]
mod smart_creature {
    #[ink(storage)]
    pub struct SmartCreature {
        name: String,
        age: u32,
        energy: u8,
    }
}`,
        suggestions: [
          {
            text: "#[ink::contract]",
            description: "🔬 Set up advanced bio-lab",
            category: "structure",
            icon: "🔬"
          },
          {
            text: "mod smart_creature {",
            description: "🏷️ Create workspace for smart creature",
            category: "structure",
            icon: "🧪"
          },
          {
            text: "#[ink(storage)]",
            description: "🧠 Install super-brain 3000™",
            category: "storage",
            icon: "🧠"
          },
          {
            text: "pub struct SmartCreature {",
            description: "🏗️ Design advanced creature body",
            category: "storage",
            icon: "🏗️"
          },
          {
            text: "name: String,",
            description: "📛 Memory slot: 'What's my name?'",
            category: "storage",
            icon: "📛"
          },
          {
            text: "age: u32,",
            description: "🎂 Memory slot: 'How old am I?' (0-4 billion)",
            category: "storage",
            icon: "🎂"
          },
          {
            text: "energy: u8,",
            description: "⚡ Memory slot: 'How energetic am I?' (0-255)",
            category: "storage",
            icon: "⚡"
          },
          {
            text: "}",
            description: "✨ Brain upgrade complete!",
            category: "storage",
            icon: "✨"
          }
        ],
        successMessage: "🧠 BRAIN UPGRADE SUCCESSFUL! Your creature now has a super-brain that can remember its name, age, and energy!"
      },
      {
        id: 2,
        title: "👶 Nameless Baby Problem!",
        problem: "Babies are being born without names! The hospital is in chaos - every creature is just called 'SmartCreature' and no one can tell them apart!",
        solution: "Create a naming ceremony for newborns! Each baby should get a unique name at birth and start as a fresh youngster with full energy.",
        goal: "Add naming ceremony",
        icon: "👶",
        targetCode: `#[ink::contract]
mod smart_creature {
    #[ink(storage)]
    pub struct SmartCreature {
        name: String,
        age: u32,
        energy: u8,
    }

    impl SmartCreature {
        #[ink(constructor)]
        pub fn new(creature_name: String) -> Self {
            Self {
                name: creature_name,
                age: 0,
                energy: 100,
            }
        }
    }
}`,
        suggestions: [
          {
            text: "impl SmartCreature {",
            description: "🔮 Begin advanced creature rituals",
            category: "constructor",
            icon: "🔮"
          },
          {
            text: "#[ink(constructor)]",
            description: "👶 Cast naming ceremony spell",
            category: "constructor",
            icon: "👶"
          },
          {
            text: "pub fn new(creature_name: String) -> Self {",
            description: "📛 The naming incantation",
            category: "constructor",
            icon: "📛"
          },
          {
            text: "Self {",
            description: "✨ Begin creature creation ritual",
            category: "constructor",
            icon: "✨"
          },
          {
            text: "name: creature_name,",
            description: "🏷️ 'I name thee...' (assign the name)",
            category: "constructor",
            icon: "🏷️"
          },
          {
            text: "age: 0,",
            description: "👶 'Born today!' (start as baby)",
            category: "constructor",
            icon: "👶"
          },
          {
            text: "energy: 100,",
            description: "🔋 'Full of life!' (maximum energy)",
            category: "constructor",
            icon: "🔋"
          },
          {
            text: "}",
            description: "🎉 Naming ceremony complete!",
            category: "constructor",
            icon: "🎉"
          }
        ],
        successMessage: "👶 Success! Now every creature is born with a unique name and full energy! No more identity confusion!"
      },
      {
        id: 3,
        title: "🤐 The Shy Creature Won't Introduce Itself!",
        problem: "Your creature is super shy! When people ask 'What's your name?', it just hides behind a rock. This is making it hard to make friends!",
        solution: "Give your creature confidence! Teach it to proudly introduce itself when someone asks for its name.",
        goal: "Cure creature's shyness",
        icon: "👋",
        targetCode: `#[ink::contract]
mod smart_creature {
    #[ink(storage)]
    pub struct SmartCreature {
        name: String,
        age: u32,
        energy: u8,
    }

    impl SmartCreature {
        #[ink(constructor)]
        pub fn new(creature_name: String) -> Self {
            Self {
                name: creature_name,
                age: 0,
                energy: 100,
            }
        }

        #[ink(message)]
        pub fn get_name(&self) -> String {
            self.name.clone()
        }
    }
}`,
        suggestions: [
          {
            text: "#[ink(message)]",
            description: "🎤 Install confidence microphone",
            category: "message",
            icon: "🎤"
          },
          {
            text: "pub fn get_name(&self) -> String {",
            description: "👋 Teach creature to say: 'Hi, I'm...'",
            category: "message",
            icon: "👋"
          },
          {
            text: "self.name.clone()",
            description: "📛 'My name is [name]!' (share the name)",
            category: "message",
            icon: "📛"
          },
          {
            text: "}",
            description: "😊 Shyness cured!",
            category: "message",
            icon: "😊"
          }
        ],
        successMessage: "👋 Hooray! Your creature is no longer shy and proudly introduces itself to everyone!"
      },
      {
        id: 4,
        title: "🎂 The Immortal Creature Problem!",
        problem: "Oh no! Your creature is stuck at age 0 forever! It can't have birthdays or grow up. Time is meaningless to it!",
        solution: "Install a birthday mechanism! Give your creature the ability to age up and celebrate getting older.",
        goal: "Enable birthdays",
        icon: "🎂",
        targetCode: `#[ink::contract]
mod smart_creature {
    #[ink(storage)]
    pub struct SmartCreature {
        name: String,
        age: u32,
        energy: u8,
    }

    impl SmartCreature {
        #[ink(constructor)]
        pub fn new(creature_name: String) -> Self {
            Self {
                name: creature_name,
                age: 0,
                energy: 100,
            }
        }

        #[ink(message)]
        pub fn get_name(&self) -> String {
            self.name.clone()
        }

        #[ink(message)]
        pub fn grow_older(&mut self) {
            self.age += 1;
        }
    }
}`,
        suggestions: [
          {
            text: "#[ink(message)]",
            description: "🎉 Install birthday party system",
            category: "message",
            icon: "🎉"
          },
          {
            text: "pub fn grow_older(&mut self) {",
            description: "🎂 The 'Happy Birthday!' function",
            category: "message",
            icon: "🎂"
          },
          {
            text: "self.age += 1;",
            description: "📈 *POOF* Add one year to age!",
            category: "message",
            icon: "📈"
          },
          {
            text: "}",
            description: "🎈 Birthday system activated!",
            category: "message",
            icon: "🎈"
          }
        ],
        successMessage: "🎂 Happy Birthday! Your creature can now age and celebrate getting older!"
      },
      {
        id: 5,
        title: "⚡ Energy Crisis Emergency!",
        problem: "DANGER! Your creature is using energy for activities but the energy meter is broken! It might accidentally use more energy than it has and break reality!",
        solution: "Install an emergency energy safety system! The creature should check if it has enough energy before spending any.",
        goal: "Fix energy crisis",
        icon: "🚨",
        targetCode: `#[ink::contract]
mod smart_creature {
    #[ink(storage)]
    pub struct SmartCreature {
        name: String,
        age: u32,
        energy: u8,
    }

    impl SmartCreature {
        #[ink(constructor)]
        pub fn new(creature_name: String) -> Self {
            Self {
                name: creature_name,
                age: 0,
                energy: 100,
            }
        }

        #[ink(message)]
        pub fn get_name(&self) -> String {
            self.name.clone()
        }

        #[ink(message)]
        pub fn grow_older(&mut self) {
            self.age += 1;
        }

        #[ink(message)]
        pub fn use_energy(&mut self, amount: u8) {
            if self.energy >= amount {
                self.energy -= amount;
            }
        }
    }
}`,
        suggestions: [
          {
            text: "#[ink(message)]",
            description: "🚨 Install energy safety system",
            category: "message",
            icon: "🚨"
          },
          {
            text: "pub fn use_energy(&mut self, amount: u8) {",
            description: "⚡ The safe energy spending function",
            category: "message",
            icon: "⚡"
          },
          {
            text: "if self.energy >= amount {",
            description: "🤔 'Do I have enough energy for this?'",
            category: "message",
            icon: "🤔"
          },
          {
            text: "self.energy -= amount;",
            description: "✅ 'Yes! Spend the energy safely!'",
            category: "message",
            icon: "✅"
          },
          {
            text: "}",
            description: "🛡️ Safety check complete",
            category: "message",
            icon: "🛡️"
          },
          {
            text: "}",
            description: "🔒 Energy crisis resolved!",
            category: "message",
            icon: "🔒"
          }
        ],
        successMessage: "🚨 Crisis averted! Your creature now safely manages its energy and won't break the universe!"
      }
    ]
  }
];

export function getSimpleChapterById(id: number): SimpleChapter | undefined {
  return simpleChapters.find(chapter => chapter.id === id);
}

export function getAllSimpleChapters(): SimpleChapter[] {
  return simpleChapters;
} 