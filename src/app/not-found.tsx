import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">🔬</div>
        <h1 className="text-4xl font-bold text-white mb-4">404 - Not Found</h1>
        <p className="text-slate-300 mb-8">
          This creature seems to have escaped the lab! The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 rounded-xl text-white font-semibold transition-all duration-200 transform hover:scale-105"
        >
          Return to Lab
        </Link>
      </div>
    </div>
  );
}
