import Link from "next/link";
import { getAllLessons } from "@/lib/lessons";

export default function LabPage() {
  const chapters = getAllLessons(); // Use lessons data instead of simplified chapters
  const totalXP = chapters
    .filter((c) => c.completed)
    .reduce((sum, c) => sum + 100, 0); // Simplified XP calculation
  const completedChapters = chapters.filter((c) => c.completed).length;

  return (
    <div className="min-h-screen">
      {/* Navigation */}

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Lab Header */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">🔬⚗️🧪</div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Welcome to the{" "}
            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Bio-Engineering Lab
            </span>
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
            Create and evolve your own blockchain creature through interactive
            bio-engineering experiments. Each chapter will teach you new
            techniques to bring digital life to the blockchain!
          </p>

          {/* Progress Overview */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold mb-4 text-purple-400">
              🏆 Your Bio-Engineering Progress
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-cyan-400">
                  {totalXP}
                </div>
                <div className="text-sm text-slate-400">Experience Points</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">
                  {completedChapters}
                </div>
                <div className="text-sm text-slate-400">Chapters Complete</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">
                  {completedChapters > 0 ? "Active" : "Novice"}
                </div>
                <div className="text-sm text-slate-400">Engineer Status</div>
              </div>
            </div>
          </div>
        </div>

        {/* Chapter Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {chapters.map((chapter, index) => {
            // Map lesson data to display format
            const creatureEmojis = ["👁️", "🦵", "🧪", "🌍"];
            const creature = creatureEmojis[chapter.id - 1] || "🧬";

            return (
              <div
                key={chapter.id}
                className={`relative bg-slate-800/50 backdrop-blur-sm border rounded-2xl p-8 transition-all duration-300 ${
                  chapter.id > 1 && !chapters[index - 1]?.completed
                    ? "border-slate-700 opacity-50"
                    : chapter.completed
                    ? "border-green-500/50 bg-green-900/10"
                    : "border-slate-700 hover:border-purple-400/50 hover:transform hover:scale-[1.02] cursor-pointer"
                }`}
              >
                {/* Lock/Completion Status */}
                <div className="absolute top-6 right-6">
                  {chapter.id > 1 && !chapters[index - 1]?.completed ? (
                    <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
                      <span className="text-sm">🔒</span>
                    </div>
                  ) : chapter.completed ? (
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <span className="text-sm">✅</span>
                    </div>
                  ) : null}
                </div>

                {/* Chapter Content */}
                <div className="mb-6">
                  {/* Chapter Icon & Title */}
                  <div className="flex items-center space-x-4 mb-4">
                    <div
                      className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl ${
                        chapter.completed
                          ? "bg-green-600/20 border-2 border-green-500/50"
                          : chapter.id === 1 || chapters[index - 1]?.completed
                          ? "bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border-2 border-purple-400/30"
                          : "bg-slate-700/50 border-2 border-slate-600"
                      }`}
                    >
                      {creature}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-purple-400 text-sm font-semibold">
                          Chapter {chapter.id}
                        </span>
                        <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs">
                          Ready to Build
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold mb-2">
                        {chapter.title}
                      </h3>
                      <p className="text-slate-400 text-sm mb-2">
                        {chapter.description}
                      </p>
                    </div>
                  </div>

                  {/* Chapter Story */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-purple-400 mb-2">
                      📖 Learning Goals:
                    </h4>
                    <div className="text-slate-300 text-sm">
                      {chapter.objectives.join(" • ")}
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                {chapter.id === 1 || chapters[index - 1]?.completed ? (
                  <Link
                    href={`/lab/chapter/${chapter.id}`}
                    className={`w-full font-semibold py-4 px-6 rounded-xl transition-all duration-200 text-center block ${
                      chapter.completed
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white transform hover:scale-105"
                    }`}
                  >
                    {chapter.completed
                      ? "🔄 Review Chapter"
                      : "🚀 Start Bio-Engineering"}
                  </Link>
                ) : (
                  <div className="w-full bg-slate-700 text-slate-400 font-semibold py-4 px-6 rounded-xl text-center">
                    Complete Chapter {chapter.id - 1} to unlock
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Lab Assistant Tips */}
        <div className="mt-16 bg-gradient-to-r from-purple-900/20 to-cyan-900/20 border border-purple-500/30 rounded-2xl p-8">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-cyan-400 rounded-full flex items-center justify-center text-2xl">
              🤖
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2 text-purple-400">
                Meet Your Lab Assistant
              </h3>
              <p className="text-slate-300 mb-4">
                I'm here to guide you through every step of the bio-engineering
                process! Each chapter is ready to be built:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <span className="text-green-400">👁️</span>
                  <span className="text-slate-300">
                    Chapter 1: Awakening Eyes
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-400">🦵</span>
                  <span className="text-slate-300">
                    Chapter 2: Growing Limbs
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-400">🧪</span>
                  <span className="text-slate-300">
                    Chapter 3: Elixir of Consciousness
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-400">🌍</span>
                  <span className="text-slate-300">
                    Chapter 4: Into the Wild
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ready to Start */}
        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold mb-4">Ready to Begin?</h2>
          <p className="text-xl text-slate-300 mb-8">
            Start with Chapter 1 and begin your journey into bio-engineering a
            digital creature!
          </p>
          <Link
            href="/lab/chapter/1"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 rounded-xl text-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            🧪 Awaken Your First Creature →
          </Link>
        </div>
      </div>
    </div>
  );
}
