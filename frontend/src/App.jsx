import { useState, useCallback, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import "./app.css";

const API_URL = "http://localhost:8000";

const LANGS = [
  { id: "python", label: "Python", ext: "main.py", mono: "python", icon: "🐍", desc: "Web backends, AI/ML, scripts" },
  { id: "javascript", label: "JavaScript", ext: "app.js", mono: "javascript", icon: "⚡", desc: "Frontend & Node.js" },
  { id: "typescript", label: "TypeScript", ext: "app.ts", mono: "typescript", icon: "🔷", desc: "Type-safe apps" },
  { id: "java", label: "Java", ext: "Main.java", mono: "java", icon: "☕", desc: "Enterprise & Android" },
  { id: "c", label: "C / C++", ext: "main.c", mono: "c", icon: "⚙️", desc: "Systems & embedded" },
];

const SAMPLES = {
  python: `import pickle
import os

# Database password
db_password = "admin_password_12345"

def process(user_input):
    data = eval(user_input)
    os.system('rm -rf ' + user_input)
    return data

def load_data(path):
    with open(path, 'rb') as f:
        return pickle.load(f)
`,
  javascript: `const express = require('express');
const { exec } = require('child_process');
const app = express();

const API_SECRET = "sk_live_supersecretkey12345";

app.get('/search', (req, res) => {
  document.innerHTML = req.query.search;
  exec(req.query.cmd);
  res.send("Done");
});
`,
  typescript: `import express, { Request, Response } from 'express';

const API_KEY: any = "sk_live_secret_key_12345678";

const handler = (req: Request, res: Response) => {
  const data = JSON.parse(req.body) as any;
  const result = eval(data.expression);
  document.innerHTML = data.content;
  res.json({ result });
};
`,
  java: `import java.sql.*;
import java.io.*;

public class UserService {
    private String dbPassword = "production_db_pass_2024";

    public User getUser(String userId) throws Exception {
        Runtime.getRuntime().exec(userId);

        ObjectInputStream ois = new ObjectInputStream(new FileInputStream("data.ser"));
        Object obj = ois.readObject();

        return null;
    }
}
`,
  c: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define API_TOKEN "hardcoded_api_token_secret"

int main() {
    char buffer[64];
    gets(buffer);
    system(user_input);

    return 0;
}
`,
};

function LandingPage({ onStart }) {
  return (
    <div>
      <div className="mesh-bg">
        <div className="mesh-gradient" />
      </div>
      
      <nav className="nav-bar animate-up">
        <div className="nav-brand">
          <span className="nav-logo">🛡️</span>
          <span className="nav-brand-text">CodeVigil</span>
        </div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="https://github.com/Pushpendra143/CodeVigil-AI-Vulnerabilty-Detector-main" target="_blank" rel="noreferrer">Documentation ↗</a>
        </div>
      </nav>

      <div className="hero-container">
        <div className="hero-badge animate-up delay-1">
          <span>✨</span> Intelligent Security Scanner
        </div>
        <h1 className="hero-title animate-up delay-1">
          Ship secure code faster.<br />
          <span className="gradient-text">Zero Compromises.</span>
        </h1>
        <p className="hero-subtitle animate-up delay-2">
          Harness the power of local machine learning and deep static analysis. Get real-time vulnerability detection with automated, context-aware fixes—completely offline.
        </p>
        <div className="hero-actions animate-up delay-3">
          <button className="btn-glow" onClick={onStart}>Start Scanning 🚀</button>
          <a className="btn-glass" href="https://github.com/Pushpendra143/CodeVigil-AI-Vulnerabilty-Detector-main" target="_blank" rel="noreferrer">
            Source Code
          </a>
        </div>
      </div>

      <div className="features-grid" id="features">
        <div className="feature-card animate-up delay-2">
          <div className="feature-icon-wrapper">🧠</div>
          <h3>Local AI Engine</h3>
          <p>Runs a highly optimized Random Forest model to analyze syntax with rich explanations, all locally.</p>
        </div>
        <div className="feature-card animate-up delay-3">
          <div className="feature-icon-wrapper">🌳</div>
          <h3>Deep AST Parsing</h3>
          <p>We analyze the true underlying Abstract Syntax Tree structure, dramatically reducing regex false positives.</p>
        </div>
        <div className="feature-card animate-up delay-4">
          <div className="feature-icon-wrapper">✨</div>
          <h3>Auto-Fix Magic</h3>
          <p>Don't just find bugs—fix them. Instantly apply drop-in secure alternatives for standard CWE vulnerabilities.</p>
        </div>
      </div>
    </div>
  );
}

function LanguagePage({ onSelect, onBack }) {
  return (
    <div>
      <div className="mesh-bg">
        <div className="mesh-gradient" />
      </div>
      
      <nav className="nav-bar animate-up">
        <button onClick={onBack} className="btn-glass" style={{padding: '8px 16px', fontSize: '14px', border: 'none', background: 'transparent'}}>
          ← Return Home
        </button>
      </nav>

      <div className="lang-container">
        <h2 className="lang-title animate-up">Choose Environment 🚀</h2>
        <p className="lang-sub animate-up delay-1">Select the target language format for your deep static scan.</p>
        
        <div className="lang-grid">
          {LANGS.map((l, idx) => (
            <div key={l.id} className={`lang-item animate-up delay-${(idx % 4) + 1}`} onClick={() => onSelect(l.id)}>
              <span className="lang-emoji">{l.icon}</span>
              <h3>{l.label}</h3>
              <p>{l.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScannerPage({ lang, onBack, onChangeLang }) {
  const [code, setCode] = useState(SAMPLES[lang] || "");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fixes, setFixes] = useState({});
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decRef = useRef([]);

  const langInfo = LANGS.find(l => l.id === lang);

  useEffect(() => {
    setCode(SAMPLES[lang] || "");
    setResults(null);
    setFixes({});
    if (editorRef.current) decRef.current = editorRef.current.deltaDecorations(decRef.current, []);
  }, [lang]);

  const onMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    monaco.editor.defineTheme("vigil-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#060608",
        "editor.lineHighlightBackground": "#0f1014",
        "editorLineNumber.foreground": "#475569",
        "editor.selectionBackground": "#334155",
      }
    });
    monaco.editor.setTheme("vigil-dark");
  };

  const markVulns = useCallback((vulns) => {
    if (!editorRef.current || !monacoRef.current) return;
    const m = monacoRef.current;
    
    decRef.current = editorRef.current.deltaDecorations(
      decRef.current,
      vulns.map((v) => ({
        range: new m.Range(v.line, 1, v.line, 1),
        options: {
          isWholeLine: true,
          className: `vuln-line-${v.severity}`,
          glyphMarginClassName: `vuln-glyph-${v.severity}`,
        },
      }))
    );
  }, []);

  const scan = async () => {
    setLoading(true); setFixes({});
    try {
      const r = await fetch(`${API_URL}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language: lang }),
      });
      if (r.ok) {
        const data = await r.json();
        setResults(data);
        markVulns(data.vulnerabilities);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scanner-layout">
      <header className="workspace-header">
        <div className="ws-left">
          <button className="back-btn" onClick={onBack}>← Back</button>
          <span style={{fontSize: '15px', fontWeight: '700', color: '#fff', letterSpacing: '0.5px'}}>
            🛡️ CodeVigil
          </span>
        </div>
        <div className="ws-center">
          {LANGS.map(l => (
            <button
              key={l.id}
              className={`ws-tab ${lang === l.id ? 'active' : ''}`}
              onClick={() => onChangeLang(l.id)}
            >
              {l.icon} {l.label}
            </button>
          ))}
        </div>
        <button className="scan-pulse-btn" onClick={scan} disabled={loading}>
          {loading ? "Analyzing..." : "Run Inspection 🔍"}
        </button>
      </header>

      <div className="workspace-grid">
        <div className="editor-pane">
          <div className="editor-toolbar">
            <div className="et-dot" />
            {langInfo?.ext}
          </div>
          <div className="editor-wrap">
            <Editor
              language={langInfo?.mono}
              value={code}
              onChange={v => setCode(v || "")}
              onMount={onMount}
              options={{
                fontFamily: "'Fira Code', monospace",
                fontSize: 14,
                minimap: { enabled: false },
                glyphMargin: true,
                padding: { top: 16 },
                cursorSmoothCaretAnimation: "on",
                smoothScrolling: true
              }}
            />
          </div>
        </div>

        <div className="inspector-pane">
          <div className="ins-header">
            <h3>Diagnostic Inspector</h3>
            {results && <span className="ins-count">{results.total_issues} Issues</span>}
          </div>

          <div className="ins-body">
            {!results && !loading && (
              <div className="empty-state">
                <div className="empty-icon">🔬</div>
                <h4>Ready to Inspect</h4>
                <p>Paste your snippet and click Run Inspection to trigger the machine learning analysis.</p>
              </div>
            )}
            
            {loading && (
              <div className="empty-state">
                <div className="empty-icon" style={{animation: 'spin 2s linear infinite'}}>⚙️</div>
                <h4>Crunching Data...</h4>
                <p>Running AST checks and Random Forest inferences.</p>
              </div>
            )}

            {results && results.total_issues === 0 && (
              <div className="empty-state">
                <div className="empty-icon" style={{filter: 'none'}}>✅</div>
                <h4 style={{color: '#34d399'}}>Code is Secure!</h4>
                <p>We found zero vulnerabilities in this snippet. Ship it!</p>
              </div>
            )}

            {results && results.total_issues > 0 && (
              <>
                <div className="summary-dash">
                  <div className="dash-row">
                    <span className="dash-total">⚠️ {results.total_issues} Risks Found</span>
                  </div>
                  <div style={{display:'flex', gap:'8px'}}>
                    <span className="dash-conf">ML Confidence: {Math.round(results.model_confidence * 100)}%</span>
                  </div>
                </div>
                
                {results.vulnerabilities.map((v, i) => (
                  <div key={i} className={`vuln-card ${v.severity}`}>
                    <div className="vc-top">
                      <span className={`vc-sev ${v.severity}`}>{v.severity}</span>
                      <span className="vc-line">Line: {v.line}</span>
                    </div>
                    
                    <div className="vc-title">{v.title}</div>
                    <span className="vc-cwe">{v.cwe_id}</span>
                    <div className="vc-desc">{v.explanation}</div>
                    
                    {v.fixed_code && (
                      <div>
                        <button className="fix-toggle" onClick={() => setFixes(p => ({...p, [i]: !p[i]}))}>
                          🔧 {fixes[i] ? "Collapse Safe Fix" : "Reveal Safe Fix"}
                        </button>
                        {fixes[i] && (
                          <div className="fix-box">{v.fixed_code}</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("landing");
  const [lang, setLang] = useState("python");

  if (page === "landing") return <LandingPage onStart={() => setPage("language")} />;
  if (page === "language") return <LanguagePage onSelect={(l) => { setLang(l); setPage("scanner"); }} onBack={() => setPage("landing")} />;
  return <ScannerPage lang={lang} onBack={() => setPage("language")} onChangeLang={setLang} />;
}