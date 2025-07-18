"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import to avoid SSR issues if any
const CodeEditor = dynamic(() => import("../../components/CodeEditor"), { ssr: false });
const ConsolePanel = dynamic(() => import("../ConsolePanel"), { ssr: false });

export default function PlaygroundPage() {
  const [code, setCode] = useState<string>(
    `#![cfg_attr(not(feature = \"std\"), no_std, no_main)]\n\n#[ink::contract]\nmod example {\n    #[ink(storage)]\n    pub struct Example { value: u32 }\n\n    impl Example {\n        #[ink(constructor)]\n        pub fn new() -> Self { Self { value: 0 } }\n        #[ink(message)]\n        pub fn get(&self) -> u32 { self.value }\n    }\n}`
  );

  // Optionally: Add logic to pass code to ConsolePanel if needed
  // For now, they are side by side, user can copy code to console

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: 24, minHeight: "100vh", background: "#f8fafc" }}>
      <h1 style={{ fontWeight: 700, fontSize: 32, marginBottom: 0 }}>Playground</h1>
      <div className="playground-main" style={{ flex: 1, display: "flex", gap: 0, padding: "0 2.5rem 2rem 2.5rem", alignItems: "stretch", minHeight: 0, height: "100%" }}>
        <div className="playground-editor" style={{ flex: 1, minWidth: 0, background: "#fff", borderRadius: "1rem 0 0 1rem", boxShadow: "0 2px 16px 0 #0001", overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" }}>
          <CodeEditor value={code} onChange={setCode} language="rust" className="fullsize-editor" style={{ flex: 1, width: "100%", height: "100%", minHeight: 0, minWidth: 0, display: "flex", flexDirection: "column" }} />
        </div>
        <div className="playground-terminal">
          <ConsolePanel defaultVisible={true} />
        </div>
      </div>
      <div style={{ fontSize: 14, color: "#888", marginTop: 16 }}>
        Write your ink! smart contract in the editor and use the Console Panel to compile, deploy, and interact with it.
      </div>
    </div>
  );
}
