"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import to avoid SSR issues if any
const CodeEditor = dynamic(() => import("../../components/CodeEditor"), {
  ssr: false,
});
const ConsolePanel = dynamic(() => import("../ConsolePanel"), { ssr: false });

export default function PlaygroundPage() {
  const [code, setCode] = useState<string>(
    `#![cfg_attr(not(feature = \"std\"), no_std, no_main)]\n\n#[ink::contract]\nmod example {\n    #[ink(storage)]\n    pub struct Example { value: u32 }\n\n    impl Example {\n        #[ink(constructor)]\n        pub fn new() -> Self { Self { value: 0 } }\n        #[ink(message)]\n        pub fn get(&self) -> u32 { self.value }\n    }\n}`
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#000",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-20 h-20 bg-purple-500/20 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-cyan-500/20 rounded-full animate-bounce delay-300"></div>
        <div className="absolute bottom-40 left-1/4 w-12 h-12 bg-pink-500/20 rounded-full animate-pulse delay-700"></div>
        <div className="absolute bottom-20 right-1/3 w-14 h-14 bg-green-500/20 rounded-full animate-bounce delay-1000"></div>

        {/* Floating orbs */}
        <div className="absolute top-[20%] left-[20%] w-24 h-24 bg-purple-400/40 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-[70%] right-[20%] w-20 h-20 bg-cyan-400/35 rounded-full blur-lg animate-bounce"></div>
        <div className="absolute bottom-[20%] left-[35%] w-16 h-16 bg-pink-400/40 rounded-full blur-xl animate-pulse delay-500"></div>

        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-cyan-500/10 rounded-full blur-2xl animate-ping"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-pink-500/10 rounded-full blur-3xl animate-bounce"></div>
      </div>

      {/* Animated background specifically for header area */}
      <div className="absolute top-0 left-0 right-0 h-32 overflow-hidden">
        {/* Moving gradient waves - slower animations */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-cyan-500/20 via-pink-500/20 via-yellow-500/20 to-purple-500/20"
          style={{ animation: "pulse 4s ease-in-out infinite" }}
        ></div>
        <div
          className="absolute inset-0 bg-gradient-to-l from-cyan-500/15 via-pink-500/15 via-green-500/15 via-blue-500/15 to-cyan-500/15"
          style={{ animation: "pulse 6s ease-in-out infinite 2s" }}
        ></div>

        {/* Floating particles in header - slower movements */}
        <div
          className="absolute top-2 left-[10%] w-4 h-4 bg-purple-400/40 rounded-full"
          style={{ animation: "pulse 3s ease-in-out infinite 0.5s" }}
        ></div>
        <div
          className="absolute top-4 left-[20%] w-3 h-3 bg-cyan-400/40 rounded-full"
          style={{ animation: "pulse 4s ease-in-out infinite 1s" }}
        ></div>
        <div
          className="absolute top-6 left-[30%] w-2 h-2 bg-pink-400/40 rounded-full"
          style={{ animation: "pulse 5s ease-in-out infinite 1.5s" }}
        ></div>
        <div
          className="absolute top-3 left-[40%] w-3 h-3 bg-yellow-400/40 rounded-full"
          style={{ animation: "pulse 3.5s ease-in-out infinite 2s" }}
        ></div>
        <div
          className="absolute top-5 left-[50%] w-4 h-4 bg-green-400/40 rounded-full"
          style={{ animation: "pulse 4.5s ease-in-out infinite 2.5s" }}
        ></div>
        <div
          className="absolute top-2 left-[60%] w-2 h-2 bg-blue-400/40 rounded-full"
          style={{ animation: "pulse 3.2s ease-in-out infinite 3s" }}
        ></div>
        <div
          className="absolute top-4 left-[70%] w-3 h-3 bg-indigo-400/40 rounded-full"
          style={{ animation: "pulse 4.2s ease-in-out infinite 3.5s" }}
        ></div>
        <div
          className="absolute top-6 left-[80%] w-4 h-4 bg-purple-400/40 rounded-full"
          style={{ animation: "pulse 5.2s ease-in-out infinite 4s" }}
        ></div>
        <div
          className="absolute top-3 left-[90%] w-3 h-3 bg-red-400/40 rounded-full"
          style={{ animation: "pulse 3.8s ease-in-out infinite 4.5s" }}
        ></div>

        {/* Gentle pulsing glow behind text */}
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[200px] bg-gradient-to-r from-purple-500/15 via-cyan-500/15 via-pink-500/15 to-yellow-500/15 rounded-full blur-3xl"
          style={{ animation: "pulse 8s ease-in-out infinite" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[150px] bg-gradient-to-l from-cyan-500/10 via-pink-500/10 via-green-500/10 to-blue-500/10 rounded-full blur-2xl"
          style={{ animation: "pulse 10s ease-in-out infinite 3s" }}
        ></div>
      </div>

      <h1
        style={{
          fontWeight: 700,
          fontSize: 32,
          margin: 0,
          padding: "25px 24px",
          textAlign: "center",
          flexShrink: 0,
          position: "relative",
          zIndex: 10,
        }}
        className="bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent"
      >
        Coming soon
      </h1>
      <div
        className="playground-main"
        style={{
          flex: 1,
          display: "flex",
          gap: 0,
          alignItems: "stretch",
          minHeight: 0,
          overflow: "hidden",
          position: "relative",
          zIndex: 5,
        }}
      >
        <div
          className="playground-editor"
          style={{
            flex: 1,
            minWidth: 0,
            background: "#fff",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          {/* Glow effect behind editor */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-cyan-400/20 rounded-lg blur-xl -z-10"></div>

          <CodeEditor
            value={code}
            onChange={setCode}
            language="rust"
            className="fullsize-editor"
            style={{
              flex: 1,
              width: "100%",
              minHeight: 0,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
            }}
          />
        </div>
        <div
          className="playground-terminal"
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Glow effect behind terminal */}
          <div className="absolute inset-0 bg-gradient-to-l from-cyan-400/20 to-pink-400/20 rounded-lg blur-xl -z-10"></div>

          <ConsolePanel defaultVisible={true} />
        </div>
      </div>
    </div>
  );
}
