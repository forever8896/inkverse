import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden">
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-slate-900 font-bold text-2xl">🧬</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              ink! Creatures
            </h1>
            <p className="text-xs text-slate-400">Bio-Engineering Lab</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Link 
            href="/lab" 
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Enter the Lab →
          </Link>
        </div>
      </nav>

      {/* Hero Section with animated background */}
      <div className="relative">
        {/* Animated creatures in background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-20 h-20 bg-purple-500/20 rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-20 w-16 h-16 bg-cyan-500/20 rounded-full animate-bounce delay-300"></div>
          <div className="absolute bottom-40 left-1/4 w-12 h-12 bg-pink-500/20 rounded-full animate-pulse delay-700"></div>
          <div className="absolute bottom-20 right-1/3 w-14 h-14 bg-green-500/20 rounded-full animate-bounce delay-1000"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center px-6 py-20 text-center">
          <div className="max-w-5xl mx-auto">
            {/* Title with creature emoji */}
            <div className="mb-6">
              <div className="text-6xl mb-4">🧬🔬⚡</div>
              <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-tight">
                Create Digital{" "}
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                  Creatures
                </span>
                <br />
                <span className="text-4xl md:text-6xl text-slate-300">
                  with ink! Smart Contracts
                </span>
              </h1>
            </div>
            
            <p className="text-xl md:text-2xl text-slate-300 mb-8 leading-relaxed max-w-3xl mx-auto">
              Welcome to the Polkadot Bio-Engineering Lab! Use the power of{" "}
              <span className="text-purple-400 font-semibold">ink! smart contracts</span> to create, 
              evolve, and battle unique digital creatures across the{" "}
              <span className="text-cyan-400 font-semibold">multichain ecosystem</span>.
            </p>

            {/* Story Introduction */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 mb-12 max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-4 text-purple-400">🏛️ Your Mission, Bio-Engineer</h2>
              <div className="text-left space-y-4 text-slate-300">
                <p>
                  The Polkadot ecosystem needs YOU! As a Bio-Engineer, you'll master the ancient art of 
                  <strong className="text-purple-300"> ink! programming</strong> to create living digital creatures.
                </p>
                <p>
                  Each creature you design will be <strong className="text-cyan-300">stored forever on the blockchain</strong>, 
                  capable of evolving, trading, and even battling with creatures from other parachains!
                </p>
                <p className="text-amber-300">
                  💡 <em>Don't worry if you've never coded before - our lab will teach you everything step by step!</em>
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Link 
                href="/lab"
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 rounded-xl text-xl font-semibold transition-all duration-200 transform hover:scale-105 animate-glow shadow-2xl"
              >
                🧪 Start Creating Creatures
              </Link>
              <Link 
                href="/gallery"
                className="px-8 py-4 border-2 border-purple-400 hover:bg-purple-400/10 rounded-xl text-xl font-semibold transition-colors duration-200"
              >
                🎨 View Creature Gallery
              </Link>
            </div>

            {/* Game Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-20">
              <div className="text-center bg-slate-800/30 rounded-xl p-6">
                <div className="text-4xl font-bold text-purple-400 mb-2">12</div>
                <div className="text-slate-400">Creature Types</div>
                <div className="text-xs text-slate-500 mt-1">To Discover</div>
              </div>
              <div className="text-center bg-slate-800/30 rounded-xl p-6">
                <div className="text-4xl font-bold text-cyan-400 mb-2">∞</div>
                <div className="text-slate-400">Possible Combinations</div>
                <div className="text-xs text-slate-500 mt-1">Your Creativity</div>
              </div>
              <div className="text-center bg-slate-800/30 rounded-xl p-6">
                <div className="text-4xl font-bold text-pink-400 mb-2">7</div>
                <div className="text-slate-400">Parachains</div>
                <div className="text-xs text-slate-500 mt-1">To Explore</div>
              </div>
              <div className="text-center bg-slate-800/30 rounded-xl p-6">
                <div className="text-4xl font-bold text-green-400 mb-2">0</div>
                <div className="text-slate-400">Prior Experience</div>
                <div className="text-xs text-slate-500 mt-1">Required</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What You'll Learn (Gamified) */}
      <div className="relative z-10 px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">
            🧬 Creature Creation Powers You'll Master
          </h2>
          <p className="text-xl text-slate-300 text-center mb-16">
            Each chapter unlocks new abilities for your Bio-Engineering toolkit
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Chapter 1 */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-purple-400/50 transition-all duration-200 group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-white text-2xl">🥚</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-purple-400">First Life</h3>
              <p className="text-slate-300 mb-4">
                Learn to create your first creature from digital DNA. Master the basic life-giving commands 
                that bring contracts to life on the blockchain.
              </p>
              <div className="text-sm text-slate-400">
                <strong>Unlocks:</strong> Basic creature creation, DNA structure, birth certificates
              </div>
            </div>

            {/* Chapter 2 */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-cyan-400/50 transition-all duration-200 group">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-white text-2xl">🧠</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-cyan-400">Memory Implants</h3>
              <p className="text-slate-300 mb-4">
                Give your creatures the ability to remember! Store memories, traits, and experiences 
                that persist across the entire blockchain forever.
              </p>
              <div className="text-sm text-slate-400">
                <strong>Unlocks:</strong> Permanent storage, creature memories, trait inheritance
              </div>
            </div>

            {/* Chapter 3 */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-pink-400/50 transition-all duration-200 group">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-white text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-pink-400">Special Abilities</h3>
              <p className="text-slate-300 mb-4">
                Teach your creatures to communicate! Design special abilities that other creatures 
                (and humans) can trigger to interact with your creation.
              </p>
              <div className="text-sm text-slate-400">
                <strong>Unlocks:</strong> Public abilities, creature interactions, communication protocols
              </div>
            </div>

            {/* Chapter 4 */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-amber-400/50 transition-all duration-200 group">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-white text-2xl">📡</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-amber-400">Telepathy</h3>
              <p className="text-slate-300 mb-4">
                Enable your creatures to send signals across the blockchain! Learn how creatures 
                can broadcast their thoughts and emotions to the world.
              </p>
              <div className="text-sm text-slate-400">
                <strong>Unlocks:</strong> Event broadcasting, creature emotions, thought sharing
              </div>
            </div>

            {/* Chapter 5 */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-green-400/50 transition-all duration-200 group">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-white text-2xl">🛡️</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-green-400">Self-Defense</h3>
              <p className="text-slate-300 mb-4">
                Protect your creatures from harm! Build immune systems that handle errors gracefully 
                and keep your creatures healthy in the wild blockchain environment.
              </p>
              <div className="text-sm text-slate-400">
                <strong>Unlocks:</strong> Error immunity, creature health, defensive mechanisms
              </div>
            </div>

            {/* Chapter 6 */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-indigo-400/50 transition-all duration-200 group">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-white text-2xl">🌍</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-indigo-400">Evolution</h3>
              <p className="text-slate-300 mb-4">
                The ultimate power! Create advanced creatures that can evolve, trade, and even 
                reproduce with creatures from other Bio-Engineers across the multiverse.
              </p>
              <div className="text-sm text-slate-400">
                <strong>Unlocks:</strong> Advanced genetics, cross-chain travel, creature evolution
              </div>
            </div>
          </div>

          <div className="text-center mt-16">
            <Link 
              href="/lab"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 rounded-xl text-xl font-semibold transition-all duration-200 transform hover:scale-105"
            >
              🚀 Begin Your Bio-Engineering Journey
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800 px-6 py-12">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-cyan-400 rounded-lg flex items-center justify-center">
              <span className="text-slate-900 font-bold">🧬</span>
            </div>
            <span className="text-lg font-semibold">ink! Creatures</span>
          </div>
          <p className="text-slate-400 mb-4">
            Master the art of digital creature creation on Polkadot
          </p>
          <div className="flex justify-center space-x-6 text-sm text-slate-500">
            <a href="https://use.ink" target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors">
              ink! Documentation
            </a>
            <a href="https://substrate.io" target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors">
              Substrate Framework
            </a>
            <a href="https://polkadot.network" target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors">
              Polkadot Network
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
