"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [isEggCracking, setIsEggCracking] = useState(false);
  const router = useRouter();

  const handleEggClick = () => {
    if (isEggCracking) return; // Prevent multiple clicks

    setIsEggCracking(true);

    // After 1 second, navigate to /lab
    setTimeout(() => {
      router.push("/lab");
    }, 1000);
  };

  return (
    <div className="min-h-screen overflow-hidden">
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
            {/* Title with logo */}
            <div className="mb-6">
              <div className="flex justify-center mb-8 relative min-h-[300px]">
                {/* Background glow effects - positioned behind logo */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-cyan-500/20 rounded-full blur-2xl animate-ping"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-pink-500/25 rounded-full blur-3xl animate-bounce"></div>

                {/* Floating orbs */}
                <div className="absolute top-[20%] left-[20%] w-24 h-24 bg-purple-400/40 rounded-full blur-xl animate-float-slow"></div>
                <div className="absolute top-[70%] right-[20%] w-20 h-20 bg-cyan-400/35 rounded-full blur-lg animate-float-medium"></div>
                <div className="absolute bottom-[20%] left-[35%] w-16 h-16 bg-pink-400/40 rounded-full blur-xl animate-float-fast"></div>

                {/* Logo on top */}
                <img
                  src="/logo.png"
                  alt="ink! Creatures Logo"
                  width={500}
                  className="object-contain relative z-10 mt-20 mb-10"
                />
              </div>
            </div>

            <h1 className="text-4xl font-bold leading-tight mb-2">
              Create your own{" "}
              <span className="bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                adorable
              </span>{" "}
              creature
            </h1>

            <p className="text-2xl text-slate-300 mb-8 leading-relaxed max-w-3xl mx-auto">
              and learn Polkadot and Ink development along the way!
            </p>

            {/* Bouncing Egg CTA */}
            <div className="flex justify-center mb-16">
              <div
                onClick={handleEggClick}
                className="relative group cursor-pointer transform transition-all duration-300"
              >
                <div className="relative">
                  {/* Glow effect behind egg */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400/30 to-cyan-400/30 rounded-full blur-2xl animate-pulse scale-150"></div>

                  {/* Bouncing egg */}
                  <img
                    src={
                      isEggCracking
                        ? "/creatures/egg_cracks.png"
                        : "/creatures/first_egg.png"
                    }
                    alt="Click to enter the lab"
                    className="hover:scale-110 w-48 h-48 object-contain animate-egg-bounce relative z-10 group-hover:animate-pulse"
                  />

                  {/* Text superimposed on egg */}
                  <div className="absolute -bottom-[44px] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xl font-medium text-white text-center whitespace-nowrap z-20">
                    {isEggCracking ? "" : "Crack the egg to start!"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
