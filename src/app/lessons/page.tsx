import Link from "next/link";
import { getAllLessons } from "@/lib/lessons";

export default function LessonsPage() {
  const lessons = getAllLessons();

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6 border-b border-slate-800">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-cyan-400 rounded-lg flex items-center justify-center">
            <span className="text-slate-900 font-bold text-xl">I</span>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Inkverse
          </h1>
        </Link>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-slate-400">
            Progress: <span className="text-purple-400 font-semibold">0/{lessons.length}</span>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Bio-Engineering{" "}
            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Creature
            </span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Create and evolve your own blockchain creature through interactive ink! smart contract lessons
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="bg-slate-800 rounded-full h-2 max-w-md mx-auto">
            <div className="bg-gradient-to-r from-purple-400 to-cyan-400 h-2 rounded-full w-0 transition-all duration-500"></div>
          </div>
          <p className="text-center text-slate-400 mt-2 text-sm">0% Complete</p>
        </div>

        {/* Lessons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {lessons.map((lesson) => (
            <div
              key={lesson.id}
              className={`relative bg-slate-800/50 backdrop-blur-sm border rounded-xl p-6 transition-all duration-200 ${
                lesson.locked
                  ? "border-slate-700 opacity-60"
                  : "border-slate-700 hover:border-purple-400/50 hover:transform hover:scale-105 cursor-pointer"
              }`}
            >
              {lesson.locked && (
                <div className="absolute top-4 right-4">
                  <div className="w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center">
                    <span className="text-xs">🔒</span>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-purple-400 text-sm font-semibold">
                    Lesson {lesson.id}
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      lesson.difficulty === "Beginner"
                        ? "bg-green-600/20 text-green-400"
                        : lesson.difficulty === "Intermediate"
                        ? "bg-yellow-600/20 text-yellow-400"
                        : lesson.difficulty === "Advanced"
                        ? "bg-orange-600/20 text-orange-400"
                        : "bg-red-600/20 text-red-400"
                    }`}
                  >
                    {lesson.difficulty}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{lesson.title}</h3>
                <p className="text-slate-400 text-sm mb-4">{lesson.description}</p>
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>⏱️ {lesson.duration}</span>
                  {lesson.completed && <span className="text-green-400">✓ Completed</span>}
                </div>
              </div>

              {!lesson.locked ? (
                <Link
                  href={`/lessons/${lesson.id}`}
                  className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 text-center block"
                >
                  {lesson.completed ? "Review Lesson" : "Start Journey"}
                </Link>
              ) : (
                <div className="w-full bg-slate-700 text-slate-400 font-semibold py-3 px-4 rounded-lg text-center">
                  Complete Previous Lessons
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Creature Journey Info */}
        <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-4">🧬 Your Creature Journey</h2>
          <p className="text-slate-300 mb-6">
            Embark on an epic bio-engineering adventure! Start with a simple creature and evolve it through 
            each lesson until it becomes a fully conscious being living on the blockchain.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">👁️</div>
              <div>
                <h3 className="font-semibold text-purple-400">Awakening</h3>
                <p className="text-sm text-slate-400">Watch your creature open its eyes as you master ink! basics</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="text-2xl">🦵</div>
              <div>
                <h3 className="font-semibold text-purple-400">Growth</h3>
                <p className="text-sm text-slate-400">Add limbs and movement with functions and events</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="text-2xl">🧪</div>
              <div>
                <h3 className="font-semibold text-purple-400">Consciousness</h3>
                <p className="text-sm text-slate-400">Feed the elixir of life through contract testing</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="text-2xl">🌍</div>
              <div>
                <h3 className="font-semibold text-purple-400">Freedom</h3>
                <p className="text-sm text-slate-400">Deploy your creature to live on the blockchain forever</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/lessons/1"
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 rounded-lg font-semibold transition-all duration-200 text-center"
            >
              Begin Bio-Engineering →
            </Link>
            <a
              href="https://use.ink"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 border border-purple-400 hover:bg-purple-400/10 rounded-lg font-semibold transition-colors duration-200 text-center"
            >
              Learn ink! Docs
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 