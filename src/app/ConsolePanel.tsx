import React, { useState, useRef, useEffect } from "react";

interface JobLog {
  timestamp: string;
  type: string;
  message: string;
}

interface JobStatus {
  job_id: string;
  status: string;
  contract_name: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  exit_code?: number | null;
  result?: any;
  error?: any;
}

const SERVER_URL = "https://web3summit-hackaton-pop-server-production.up.railway.app";



const EXAMPLE_CODE = `#![cfg_attr(not(feature = \"std\"), no_std, no_main)]\n\n#[ink::contract]\nmod example {\n    #[ink(storage)]\n    pub struct Example { value: u32 }\n\n    impl Example {\n        #[ink(constructor)]\n        pub fn new() -> Self { Self { value: 0 } }\n        #[ink(message)]\n        pub fn get(&self) -> u32 { self.value }\n    }\n}`;

type TerminalLine = {
  text: string;
  type: 'stdout' | 'stderr' | 'command' | 'info' | 'success' | 'error';
  timestamp?: string;
};

interface ConsolePanelProps {
  defaultVisible?: boolean;
}

export default function ConsolePanel({ defaultVisible = false }: ConsolePanelProps) {
  const [visible, setVisible] = useState(defaultVisible);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [logs, setLogs] = useState<JobLog[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Terminal state
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [commandInput, setCommandInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when terminal opens
  useEffect(() => {
    if (visible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [visible]);

  // Poll job status
  useEffect(() => {
    if (!jobId || !polling) return;
    let interval = setInterval(async () => {
      try {
        const resp = await fetch(`${SERVER_URL}/compile-job/${jobId}`);
        const data = await resp.json();
        setJobStatus(data);
        if (data.status === "completed" || data.status === "failed") {
          setPolling(false);
        }
      } catch (e: any) {
        setError("Failed to fetch job status");
        setPolling(false);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [jobId, polling]);

  // Poll job logs
  useEffect(() => {
    if (!jobId || !polling) return;
    let interval = setInterval(async () => {
      try {
        const resp = await fetch(`${SERVER_URL}/compile-job/${jobId}/logs`);
        const data = await resp.json();
        setLogs(data.logs || []);
      } catch (e: any) {
        setError("Failed to fetch job logs");
        setPolling(false);
      }
    }, 1200);
    return () => clearInterval(interval);
  }, [jobId, polling]);

  // Simulate running 'pop build' in the terminal
  const submitJob = async () => {
    setSubmitting(true);
    setError(null);
    setLogs([]);
    setJobStatus(null);
    setJobId(null);
    setPolling(false);
    setTerminalLines(lines => [
      ...lines,
      { text: "$ pop build", type: "command", timestamp: new Date().toISOString() },
      { text: "Compiling...", type: "info", timestamp: new Date().toISOString() }
    ]);
    try {
      const resp = await fetch(`${SERVER_URL}/compile-job`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: EXAMPLE_CODE, contractName: "lesson_contract" }),
      });
      let data;
      try {
        data = await resp.json();
      } catch (err) {
        setTerminalLines(lines => [
          ...lines,
          { text: `Server returned invalid JSON: ${err}`, type: "error", timestamp: new Date().toISOString() }
        ]);
        setError("Server returned invalid JSON");
        setSubmitting(false);
        return;
      }
      if (!resp.ok) {
        setTerminalLines(lines => [
          ...lines,
          { text: `HTTP ${resp.status}: ${data.error || JSON.stringify(data)}`, type: "error", timestamp: new Date().toISOString() }
        ]);
        setError(data.error || `HTTP ${resp.status}`);
        setSubmitting(false);
        return;
      }
      if (data.job_id) {
        setJobId(data.job_id);
        setPolling(true);
      } else {
        setTerminalLines(lines => [
          ...lines,
          { text: data.error || "Unknown error", type: "error", timestamp: new Date().toISOString() }
        ]);
        setError(data.error || "Unknown error");
      }
    } catch (e: any) {
      setTerminalLines(lines => [
        ...lines,
        { text: `Failed to submit job: ${e.message || e}`, type: "error", timestamp: new Date().toISOString() }
      ]);
      setError(`Failed to submit job: ${e.message || e}`);
    }
    setSubmitting(false);
  };

  // Handle user command input (terminal form)
  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = commandInput.trim();
    if (!cmd) return;
    setTerminalLines(lines => [
      ...lines,
      { text: `$ ${cmd}`, type: "command", timestamp: new Date().toISOString() }
    ]);
    setCommandInput("");
    if (cmd === "pop build") {
      submitJob();
    } else {
      setTerminalLines(lines => [
        ...lines,
        { text: `Command not found: ${cmd}`, type: "error", timestamp: new Date().toISOString() }
      ]);
    }
  };

  // Stream job logs to terminal
  useEffect(() => {
    if (!jobId || !polling) return;
    let stopped = false;
    let lastLogLength = 0;
    const interval = setInterval(async () => {
      if (stopped) return;
      try {
        const resp = await fetch(`${SERVER_URL}/compile-job/${jobId}/logs`);
        const data = await resp.json();
        // Only append new logs
        if (data.logs && data.logs.length > lastLogLength) {
          const newLogs = data.logs.slice(lastLogLength).map((log: JobLog) => ({
            text: log.message,
            type: log.type as TerminalLine["type"],
            timestamp: log.timestamp
          }));
          setTerminalLines(lines => [...lines, ...newLogs]);
          lastLogLength = data.logs.length;
        }
      } catch (e) { /* ignore */ }
    }, 1000);
    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [jobId, polling]);

  const clearJob = () => {
    setJobId(null);
    setJobStatus(null);
    setLogs([]);
    setPolling(false);
    setError(null);
  };

  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, width: "100%", zIndex: 1000, fontFamily: "monospace" }}>
      <button
        onClick={() => setVisible((v) => !v)}
        style={{
          position: "absolute",
          right: 24,
          bottom: visible ? 320 : 0,
          zIndex: 1010,
          padding: "8px 24px",
          fontWeight: 700,
          background: "#23272f",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          boxShadow: "0 2px 10px #0002",
          cursor: "pointer",
        }}
      >
        {visible ? "Hide Console" : "Show Console"}
      </button>
      {visible && (
        <div
          style={{
            background: "#181a20",
            color: "#e6e6e6",
            borderTop: "2px solid #23272f",
            boxShadow: "0 -2px 12px #0006",
            minHeight: 320,
            maxHeight: 480,
            overflow: "auto",
            padding: 0,
            position: "relative",
          }}
        >
          <div style={{ padding: "10px 20px 6px 20px", borderBottom: "1px solid #23272f", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 700, fontSize: 18 }}>🖥️ Ink! Compile Console</span>
            <button
              onClick={clearJob}
              style={{ background: "#31343a", color: "#fff", border: "none", borderRadius: 4, padding: "4px 12px", marginLeft: 16, fontWeight: 600, cursor: "pointer" }}
              disabled={submitting || polling}
            >
              Clear
            </button>
          </div>
          
          <div style={{
            background: "#101216",
            borderTop: "1px solid #23272f",
            padding: 0,
            fontFamily: "Fira Mono, monospace",
            fontSize: 15,
            minHeight: 220,
            maxHeight: 340,
            overflowY: "auto",
            borderRadius: "0 0 8px 8px"
          }}>
            <div style={{ padding: "0 0 0 0", minHeight: 180, maxHeight: 260, overflowY: "auto" }}>
              {terminalLines.map((line, idx) => (
                <div key={idx} style={{
                  color: line.type === "stderr" ? "#ff5555" : line.type === "stdout" ? "#aaffaa" : line.type === "command" ? "#7ec7ff" : line.type === "info" ? "#8ecfff" : line.type === "success" ? "#4caf50" : line.type === "error" ? "#ff5555" : "#cdd6f4",
                  whiteSpace: "pre-wrap",
                  fontWeight: line.type === "command" ? 700 : 400,
                  letterSpacing: line.type === "command" ? 0.5 : 0,
                  fontSize: 15,
                  marginBottom: 2
                }}>
                  {line.timestamp && <span style={{ color: "#444", fontSize: 11, marginRight: 8 }}>{line.timestamp.slice(11,19)}</span>}
                  <span>{line.text}</span>
                </div>
              ))}
              {error && <div style={{ color: "#ff5555", fontWeight: 600 }}>{error}</div>}
            </div>
            <form
              style={{ display: "flex", alignItems: "center", padding: "10px 20px 10px 12px", borderTop: "1px solid #23272f", background: "#181a20", borderRadius: "0 0 8px 8px" }}
              onSubmit={handleCommandSubmit}
              autoComplete="off"
            >
              <span style={{ color: "#7ec7ff", fontWeight: 700, marginRight: 8 }}>$</span>
              <input
                ref={inputRef}
                type="text"
                value={commandInput}
                onChange={e => setCommandInput(e.target.value)}
                placeholder="Type a command (e.g. pop build)"
                style={{
                  flex: 1,
                  background: "#23272f",
                  color: "#fff",
                  border: "none",
                  outline: "none",
                  fontFamily: "Fira Mono, monospace",
                  fontSize: 15,
                  padding: "7px 8px",
                  borderRadius: 4,
                  marginRight: 8
                }}
                disabled={submitting || polling}
              />
              <button
                type="submit"
                style={{ background: "#4caf50", color: "#fff", border: "none", borderRadius: 4, padding: "7px 18px", fontWeight: 700, cursor: submitting || polling ? "not-allowed" : "pointer" }}
                disabled={submitting || polling || !commandInput.trim()}
              >
                Run
              </button>
            </form>
          </div>
          <div style={{ padding: "0 20px 12px 20px", minHeight: 110, maxHeight: 180, overflow: "auto", background: "#111216", borderRadius: 4, margin: 12 }}>
            <div style={{ fontWeight: 600, color: "#aaa", marginBottom: 4 }}>Job Output:</div>
            {logs.length === 0 && <div style={{ color: "#555", fontStyle: "italic" }}>No logs yet.</div>}
            {logs.map((log, i) => (
              <div key={i} style={{ color: log.type === "stderr" ? "#ff5555" : log.type === "stdout" ? "#aaffaa" : log.type === "info" ? "#8ecfff" : log.type === "success" ? "#4caf50" : log.type === "error" ? "#ff5555" : "#ccc", whiteSpace: "pre-wrap", fontSize: 13 }}>
                <span style={{ color: "#666", fontSize: 11, marginRight: 8 }}>{log.timestamp.slice(11,19)}</span>
                <span>{log.message}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: "0 20px 12px 20px", fontSize: 14, color: "#aaa" }}>
            {jobStatus && (
              <div>
                <b>Status:</b> <span style={{ color: jobStatus.status === "completed" ? "#4caf50" : jobStatus.status === "failed" ? "#ff5555" : "#ffb86c" }}>{jobStatus.status}</span>
                {jobStatus.exit_code !== undefined && (
                  <span style={{ marginLeft: 12 }}><b>Exit Code:</b> {jobStatus.exit_code}</span>
                )}
                {jobStatus.completed_at && (
                  <span style={{ marginLeft: 12 }}><b>Completed:</b> {new Date(jobStatus.completed_at).toLocaleTimeString()}</span>
                )}
                {jobStatus.error && jobStatus.error.rust_errors && jobStatus.error.rust_errors.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <b>Rust Errors:</b>
                    <ul style={{ color: "#ff5555" }}>
                      {jobStatus.error.rust_errors.map((err: any, idx: number) => (
                        <li key={idx}>
                          <div>{err.code}: {err.message}</div>
                          {err.location && <div style={{ fontSize: 12 }}>at {err.location.file}:{err.location.line}:{err.location.column}</div>}
                          {err.details && err.details.length > 0 && (
                            <pre style={{ fontSize: 12, color: "#ffb86c" }}>{err.details.join("\n")}</pre>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
