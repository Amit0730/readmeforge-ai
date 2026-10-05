"use client";

import React, { useEffect, useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import {
  FileText, GitBranch, Eye, Shield, Clock, Settings, Sparkles,
  Download, Copy, Trash2, RotateCcw, Search, Undo2, Redo2,
  Maximize2, Minimize2, Upload, X, GripVertical, Plus, Check,
  AlertTriangle, Info, ChevronDown, Send, Bot, ArrowRight,
  Github, Star, ChevronRight, RefreshCw, Loader2, CheckCircle2,
  AlertCircle, BookOpen, Code2, Zap,
} from "lucide-react";
import { useStore } from "@/lib/store";
import type {
  DashboardView, ReadmeTemplate, Badge, Screenshot,
  AccuracyCheck, QualityScoreItem, AiMessage,
} from "@/lib/types";

/* ════════════════════════════════════════════════
   DASHBOARD LAYOUT
   ════════════════════════════════════════════════ */

export default function DashboardPage() {
  const { view, setView, hydrateVersions } = useStore();
  const params = useSearchParams();

  useEffect(() => {
    hydrateVersions();
    if (params.get("demo") === "true") {
      useStore.getState().setGithubUrl("https://github.com/vercel/next.js");
      toast.info("Demo mode — we've pre-filled a popular repo for you.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navItems: { id: DashboardView; label: string; icon: React.ElementType }[] = [
    { id: "generate", label: "Generate", icon: Sparkles },
    { id: "editor", label: "Editor", icon: Code2 },
    { id: "preview", label: "Preview", icon: Eye },
    { id: "quality", label: "Quality", icon: Shield },
    { id: "history", label: "History", icon: Clock },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* top bar */}
      <header className="glass border-b border-dark-700/50 h-14 flex items-center px-4 gap-4 shrink-0 z-30">
        <Link href="/" className="flex items-center gap-2 font-bold text-white text-sm mr-4">
          <FileText className="w-4 h-4 text-accent-400" />
          ReadmeForge<span className="text-accent-400"> AI</span>
        </Link>

        <div className="tab-bar overflow-x-auto">
          {navItems.map((n) => (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              className={`tab flex items-center gap-1.5 ${view === n.id ? "tab-active" : ""}`}
            >
              <n.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{n.label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1" />
        <ExportButtons />
      </header>

      {/* panels */}
      <main className="flex-1 overflow-hidden">
        {view === "generate" && <GeneratePanel />}
        {view === "editor" && <EditorPanel />}
        {view === "preview" && <PreviewPanel />}
        {view === "quality" && <QualityPanel />}
        {view === "history" && <HistoryPanel />}
        {view === "settings" && <SettingsPanel />}
      </main>
    </div>
  );
}

/* ════════════════════════════════════════════════
   EXPORT BUTTONS (always visible in header)
   ════════════════════════════════════════════════ */

function ExportButtons() {
  const markdown = useStore((s) => s.markdown);

  const copyMd = useCallback(() => {
    if (!markdown) { toast.error("Nothing to copy yet."); return; }
    navigator.clipboard.writeText(markdown);
    toast.success("Markdown copied!");
  }, [markdown]);

  const downloadMd = useCallback(() => {
    if (!markdown) { toast.error("Nothing to download yet."); return; }
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "README.md";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("README.md downloaded!");
  }, [markdown]);

  return (
    <div className="flex items-center gap-1">
      <button onClick={copyMd} className="btn-icon" title="Copy Markdown"><Copy className="w-4 h-4" /></button>
      <button onClick={downloadMd} className="btn-icon" title="Download README.md"><Download className="w-4 h-4" /></button>
    </div>
  );
}

/* ════════════════════════════════════════════════
   GENERATE PANEL — input + analysis + generation
   ════════════════════════════════════════════════ */

function GeneratePanel() {
  const {
    inputMode, setInputMode, githubUrl, setGithubUrl,
    manual, patchManual,
    analysis, analysisLoading, analysisError,
    setAnalysis, setAnalysisLoading, setAnalysisError,
    readme, readmeLoading, readmeError,
    setReadme, setReadmeLoading, setReadmeError,
    template, setTemplate, setMarkdown, setView,
    setBadges, setQualityScore, setAccuracyChecks,
    screenshots,
  } = useStore();

  const [techInput, setTechInput] = useState("");
  const [featInput, setFeatInput] = useState("");

  /* ── analyse ── */
  const analyze = useCallback(async () => {
    if (!githubUrl.trim()) { toast.error("Please enter a GitHub URL."); return; }
    setAnalysisLoading(true);
    setAnalysisError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: githubUrl.trim() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Analysis failed.");
      setAnalysis(data.data);
      toast.success(`Analyzed ${data.data.repo.fullName}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Analysis failed.";
      setAnalysisError(msg);
      toast.error(msg);
    } finally {
      setAnalysisLoading(false);
    }
  }, [githubUrl, setAnalysis, setAnalysisLoading, setAnalysisError]);

  /* ── generate ── */
  const generate = useCallback(async () => {
    setReadmeLoading(true);
    setReadmeError(null);
    try {
      const body: Record<string, unknown> = { template };
      if (inputMode === "github" && analysis) {
        body.analysis = analysis;
      } else {
        body.manualInput = manual;
      }
      body.screenshots = screenshots.map((s) => ({ caption: s.caption, filename: s.filename }));
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Generation failed.");
      setReadme(data.data);
      setMarkdown(data.data.markdown);
      if (data.data.badges) setBadges(data.data.badges);
      if (data.data.qualityScore) setQualityScore(data.data.qualityScore);
      if (data.data.accuracyChecks) setAccuracyChecks(data.data.accuracyChecks);
      toast.success("README generated!");
      setView("editor");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Generation failed.";
      setReadmeError(msg);
      toast.error(msg);
    } finally {
      setReadmeLoading(false);
    }
  }, [inputMode, analysis, manual, template, screenshots, setReadme, setReadmeLoading, setReadmeError, setMarkdown, setBadges, setQualityScore, setAccuracyChecks, setView]);

  /* ── add tech / feature helpers ── */
  const addTech = () => {
    const t = techInput.trim();
    if (!t || manual.technologies.includes(t)) return;
    patchManual({ technologies: [...manual.technologies, t] });
    setTechInput("");
  };
  const removeTech = (t: string) => patchManual({ technologies: manual.technologies.filter((x) => x !== t) });
  const addFeat = () => {
    const f = featInput.trim();
    if (!f) return;
    patchManual({ features: [...manual.features, f] });
    setFeatInput("");
  };
  const removeFeat = (i: number) => patchManual({ features: manual.features.filter((_, j) => j !== i) });

  const canGenerate = inputMode === "github" ? !!analysis : !!manual.name.trim();

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">

        {/* mode tabs */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setInputMode("github")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
              inputMode === "github"
                ? "bg-accent-500/15 text-accent-400 border border-accent-500/30"
                : "bg-dark-800 text-dark-300 border border-dark-700 hover:text-white"
            }`}
          >
            <Github className="w-4 h-4" /> GitHub Repository
          </button>
          <button
            onClick={() => setInputMode("manual")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
              inputMode === "manual"
                ? "bg-accent-500/15 text-accent-400 border border-accent-500/30"
                : "bg-dark-800 text-dark-300 border border-dark-700 hover:text-white"
            }`}
          >
            <BookOpen className="w-4 h-4" /> Manual Project
          </button>
        </div>

        {/* ── GitHub mode ── */}
        {inputMode === "github" && (
          <div className="card space-y-4">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-accent-400" /> Enter Repository URL
            </h2>
            <div className="flex gap-3">
              <input
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/user/project"
                className="input input-mono flex-1"
                onKeyDown={(e) => e.key === "Enter" && analyze()}
              />
              <button
                onClick={analyze}
                disabled={analysisLoading || !githubUrl.trim()}
                className="btn-primary flex items-center gap-2 shrink-0"
              >
                {analysisLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {analysisLoading ? "Analyzing…" : "Analyze"}
              </button>
            </div>
            {analysisError && (
              <div className="flex items-start gap-2 text-error-400 text-sm bg-error-500/10 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {analysisError}
              </div>
            )}
            {analysis && <AnalysisCard />}
          </div>
        )}

        {/* ── Manual mode ── */}
        {inputMode === "manual" && (
          <div className="card space-y-5">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-accent-400" /> Project Details
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">Project Name *</label>
                <input value={manual.name} onChange={(e) => patchManual({ name: e.target.value })} className="input" placeholder="My Awesome Project" />
              </div>
              <div>
                <label className="label">License</label>
                <input value={manual.license} onChange={(e) => patchManual({ license: e.target.value })} className="input" placeholder="MIT" />
              </div>
            </div>

            <div>
              <label className="label">Description</label>
              <textarea value={manual.description} onChange={(e) => patchManual({ description: e.target.value })} className="input" placeholder="A brief description of what your project does." rows={3} />
            </div>

            {/* technologies */}
            <div>
              <label className="label">Technologies</label>
              <div className="flex gap-2 mb-2">
                <input value={techInput} onChange={(e) => setTechInput(e.target.value)} className="input flex-1" placeholder="e.g. React, Node.js, PostgreSQL" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTech())} />
                <button onClick={addTech} className="btn-secondary shrink-0"><Plus className="w-4 h-4" /></button>
              </div>
              <div className="flex flex-wrap gap-2">
                {manual.technologies.map((t) => (
                  <span key={t} className="badge badge-accent flex items-center gap-1">
                    {t} <button onClick={() => removeTech(t)}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            </div>

            {/* features */}
            <div>
              <label className="label">Features</label>
              <div className="flex gap-2 mb-2">
                <input value={featInput} onChange={(e) => setFeatInput(e.target.value)} className="input flex-1" placeholder="Add a feature" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeat())} />
                <button onClick={addFeat} className="btn-secondary shrink-0"><Plus className="w-4 h-4" /></button>
              </div>
              <ul className="space-y-1">
                {manual.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-dark-200">
                    <span className="flex-1">• {f}</span>
                    <button onClick={() => removeFeat(i)} className="text-dark-400 hover:text-error-400"><X className="w-3.5 h-3.5" /></button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">Install Commands</label>
                <input value={manual.installCommands} onChange={(e) => patchManual({ installCommands: e.target.value })} className="input input-mono" placeholder="npm install" />
              </div>
              <div>
                <label className="label">Run Command</label>
                <input value={manual.runCommand} onChange={(e) => patchManual({ runCommand: e.target.value })} className="input input-mono" placeholder="npm run dev" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">Repository URL</label>
                <input value={manual.repoUrl} onChange={(e) => patchManual({ repoUrl: e.target.value })} className="input input-mono" placeholder="https://github.com/user/project" />
              </div>
              <div>
                <label className="label">Live URL</label>
                <input value={manual.liveUrl} onChange={(e) => patchManual({ liveUrl: e.target.value })} className="input input-mono" placeholder="https://project.vercel.app" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">Deployment Platform</label>
                <input value={manual.deploymentPlatform} onChange={(e) => patchManual({ deploymentPlatform: e.target.value })} className="input" placeholder="Vercel, Docker, AWS…" />
              </div>
              <div>
                <label className="label">Author Name</label>
                <input value={manual.authorName} onChange={(e) => patchManual({ authorName: e.target.value })} className="input" placeholder="Your Name" />
              </div>
            </div>
          </div>
        )}

        {/* ── Template selector ── */}
        <div className="card">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent-400" /> README Template
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(["developer", "portfolio", "open-source", "minimal"] as ReadmeTemplate[]).map((t) => (
              <button
                key={t}
                onClick={() => setTemplate(t)}
                className={`p-3 rounded-xl text-sm font-medium text-center transition border ${
                  template === t
                    ? "bg-accent-500/15 text-accent-400 border-accent-500/30"
                    : "bg-dark-800 text-dark-300 border-dark-700 hover:border-dark-500"
                }`}
              >
                {t === "developer" && "🛠️ Developer"}
                {t === "portfolio" && "🎨 Portfolio"}
                {t === "open-source" && "🌐 Open Source"}
                {t === "minimal" && "✨ Minimal"}
              </button>
            ))}
          </div>
        </div>

        {/* ── Screenshot builder ── */}
        <ScreenshotBuilder />

        {/* ── Generate button ── */}
        <div className="flex items-center gap-4">
          <button
            onClick={generate}
            disabled={readmeLoading || !canGenerate}
            className="btn-primary flex items-center gap-2 text-base px-8 py-3"
          >
            {readmeLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
            {readmeLoading ? "Generating…" : "Generate README"}
          </button>
          {readmeError && (
            <span className="text-error-400 text-sm flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> {readmeError}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Analysis result card ── */

function AnalysisCard() {
  const analysis = useStore((s) => s.analysis);
  if (!analysis) return null;
  const { repo, technologies, fileTree, configFiles, envVariables } = analysis;

  return (
    <div className="space-y-4 animate-fade-in mt-4">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="badge badge-success"><Check className="w-3 h-3" /> Analyzed</span>
        <span className="text-white font-semibold">{repo.fullName}</span>
        {repo.license && <span className="badge badge-neutral">{repo.license}</span>}
      </div>

      {repo.description && <p className="text-dark-300 text-sm">{repo.description}</p>}

      <div className="grid md:grid-cols-3 gap-4 text-sm">
        <div className="bg-dark-900 rounded-lg p-3">
          <span className="text-dark-400 text-xs uppercase tracking-wider">Stars</span>
          <p className="text-white font-bold mt-1">{repo.stars.toLocaleString()}</p>
        </div>
        <div className="bg-dark-900 rounded-lg p-3">
          <span className="text-dark-400 text-xs uppercase tracking-wider">Forks</span>
          <p className="text-white font-bold mt-1">{repo.forks.toLocaleString()}</p>
        </div>
        <div className="bg-dark-900 rounded-lg p-3">
          <span className="text-dark-400 text-xs uppercase tracking-wider">Files</span>
          <p className="text-white font-bold mt-1">{fileTree.length}</p>
        </div>
      </div>

      {/* technologies */}
      {technologies.length > 0 && (
        <div>
          <h4 className="text-xs text-dark-400 uppercase tracking-wider mb-2">Detected Technologies</h4>
          <div className="flex flex-wrap gap-2">
            {technologies.map((t, i) => (
              <span key={i} className="badge badge-accent">{t.name}</span>
            ))}
          </div>
        </div>
      )}

      {/* config files */}
      {configFiles.length > 0 && (
        <div>
          <h4 className="text-xs text-dark-400 uppercase tracking-wider mb-2">Config Files</h4>
          <div className="flex flex-wrap gap-2">
            {configFiles.map((f, i) => (
              <span key={i} className="badge badge-neutral font-mono text-xs">{f}</span>
            ))}
          </div>
        </div>
      )}

      {/* env vars */}
      {envVariables.length > 0 && (
        <div>
          <h4 className="text-xs text-dark-400 uppercase tracking-wider mb-2">Environment Variables ({envVariables.length})</h4>
          <div className="flex flex-wrap gap-2">
            {envVariables.slice(0, 8).map((v, i) => (
              <span key={i} className="badge badge-warning font-mono text-xs">{v.key}</span>
            ))}
            {envVariables.length > 8 && <span className="badge badge-neutral">+{envVariables.length - 8} more</span>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════
   SCREENSHOT BUILDER
   ════════════════════════════════════════════════ */

function ScreenshotBuilder() {
  const { screenshots, addScreenshot, removeScreenshot, updateScreenshot } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const s: Screenshot = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
        preview: URL.createObjectURL(file),
        filename: file.name,
        caption: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
        mime: file.type,
      };
      addScreenshot(s);
    });
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="card">
      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
        <Upload className="w-4 h-4 text-accent-400" /> Screenshots
      </h3>
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-dark-600 rounded-xl p-6 text-center cursor-pointer hover:border-accent-500/40 transition"
      >
        <Upload className="w-6 h-6 text-dark-400 mx-auto mb-2" />
        <p className="text-sm text-dark-400">Drag & drop images or click to browse</p>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {screenshots.length > 0 && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
          {screenshots.map((s) => (
            <div key={s.id} className="relative bg-dark-900 rounded-lg overflow-hidden group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.preview} alt={s.caption} className="w-full h-32 object-cover" />
              <div className="p-2">
                <input
                  value={s.caption}
                  onChange={(e) => updateScreenshot(s.id, { caption: e.target.value })}
                  className="input text-xs py-1 px-2"
                  placeholder="Caption"
                />
              </div>
              <button
                onClick={() => removeScreenshot(s.id)}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-dark-900/80 text-dark-300 hover:text-error-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════
   EDITOR PANEL — split pane: markdown + preview
   ════════════════════════════════════════════════ */

function EditorPanel() {
  const { markdown, setMarkdown, saveVersion } = useStore();
  const [fullscreen, setFullscreen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const textRef = useRef<HTMLTextAreaElement>(null);
  const historyRef = useRef<{ past: string[]; future: string[] }>({ past: [], future: [] });

  const pushHistory = useCallback(() => {
    historyRef.current.past.push(markdown);
    if (historyRef.current.past.length > 100) historyRef.current.past.shift();
    historyRef.current.future = [];
  }, [markdown]);

  const undo = useCallback(() => {
    const { past, future } = historyRef.current;
    if (past.length === 0) return;
    future.push(markdown);
    setMarkdown(past.pop()!);
  }, [markdown, setMarkdown]);

  const redo = useCallback(() => {
    const { past, future } = historyRef.current;
    if (future.length === 0) return;
    past.push(markdown);
    setMarkdown(future.pop()!);
  }, [markdown, setMarkdown]);

  const handleChange = (val: string) => {
    pushHistory();
    setMarkdown(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "z") {
      e.preventDefault();
      if (e.shiftKey) redo(); else undo();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "f") {
      e.preventDefault();
      setSearchOpen(true);
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      saveVersion("Auto-save");
      toast.success("Version saved!");
    }
  };

  return (
    <div className={`flex flex-col ${fullscreen ? "fixed inset-0 z-50 bg-dark-950" : "h-[calc(100vh-3.5rem)]"}`}>
      {/* toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-dark-700 bg-dark-900 shrink-0">
        <button onClick={undo} className="btn-icon" title="Undo (Ctrl+Z)"><Undo2 className="w-4 h-4" /></button>
        <button onClick={redo} className="btn-icon" title="Redo (Ctrl+Shift+Z)"><Redo2 className="w-4 h-4" /></button>
        <div className="w-px h-5 bg-dark-700 mx-1" />
        <button onClick={() => setSearchOpen(!searchOpen)} className="btn-icon" title="Search (Ctrl+F)"><Search className="w-4 h-4" /></button>
        <button onClick={() => setFullscreen(!fullscreen)} className="btn-icon" title="Fullscreen">
          {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
        <div className="w-px h-5 bg-dark-700 mx-1" />
        <button onClick={() => { handleChange(""); toast.info("Editor reset."); }} className="btn-icon text-dark-400 hover:text-error-400" title="Reset"><RotateCcw className="w-4 h-4" /></button>
        <div className="flex-1" />
        <AiAssistantToggle />
      </div>

      {/* search bar */}
      {searchOpen && (
        <div className="flex items-center gap-2 px-3 py-2 bg-dark-800 border-b border-dark-700">
          <Search className="w-4 h-4 text-dark-400" />
          <input
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Find…"
            className="input text-sm py-1 flex-1"
          />
          <button onClick={() => setSearchOpen(false)} className="btn-icon"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* split pane */}
      <div className="flex-1 flex overflow-hidden">
        {/* editor */}
        <div className="w-1/2 flex flex-col border-r border-dark-700">
          <div className="px-3 py-1.5 text-xs text-dark-400 bg-dark-900 border-b border-dark-700 font-medium">
            MARKDOWN
          </div>
          <textarea
            ref={textRef}
            value={markdown}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 p-4 bg-dark-950 text-dark-100 font-mono text-sm resize-none outline-none leading-relaxed"
            placeholder="Your README markdown will appear here after generation, or start typing..."
            spellCheck={false}
          />
        </div>

        {/* preview */}
        <div className="w-1/2 flex flex-col">
          <div className="px-3 py-1.5 text-xs text-dark-400 bg-dark-900 border-b border-dark-700 font-medium">
            PREVIEW
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="markdown-preview max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]}>
                {markdown || "*Nothing to preview yet.*"}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   PREVIEW PANEL (full-width preview)
   ════════════════════════════════════════════════ */

function PreviewPanel() {
  const markdown = useStore((s) => s.markdown);

  return (
    <div className="h-[calc(100vh-3.5rem)] overflow-y-auto p-8">
      <div className="max-w-3xl mx-auto markdown-preview animate-fade-in">
        {markdown ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]}>
            {markdown}
          </ReactMarkdown>
        ) : (
          <div className="text-center py-20 text-dark-400">
            <FileText className="w-12 h-12 mx-auto mb-4 text-dark-500" />
            <p className="text-lg font-medium">No README generated yet.</p>
            <p className="text-sm mt-1">Go to Generate to create your README.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   QUALITY PANEL — score + accuracy checks + badges
   ════════════════════════════════════════════════ */

function QualityPanel() {
  const { qualityScore, accuracyChecks, badges, toggleBadge, readme } = useStore();

  if (!readme && !qualityScore) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center text-dark-400">
        <div className="text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-dark-500" />
          <p className="text-lg font-medium">No quality data yet.</p>
          <p className="text-sm mt-1">Generate a README first to see quality metrics.</p>
        </div>
      </div>
    );
  }

  const score = qualityScore;
  const pct = score ? Math.round((score.total / score.maxTotal) * 100) : 0;
  const color = pct >= 80 ? "text-success-400" : pct >= 50 ? "text-warning-400" : "text-error-400";

  return (
    <div className="h-[calc(100vh-3.5rem)] overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">

        {/* score */}
        {score && (
          <div className="card">
            <div className="flex items-center gap-4 mb-4">
              <div className={`text-4xl font-extrabold ${color}`}>{score.total}</div>
              <div>
                <p className="text-white font-semibold">README Quality Score</p>
                <p className="text-dark-400 text-sm">out of {score.maxTotal} — heuristic score, not an official metric</p>
              </div>
            </div>
            <div className="w-full bg-dark-700 rounded-full h-2 mb-4">
              <div className={`h-2 rounded-full transition-all ${pct >= 80 ? "bg-success-500" : pct >= 50 ? "bg-warning-500" : "bg-error-500"}`} style={{ width: `${pct}%` }} />
            </div>
            <div className="space-y-2">
              {score.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-dark-200">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-dark-400 text-xs">{item.reason}</span>
                    <span className={`font-mono font-bold ${item.score === item.maxScore ? "text-success-400" : item.score > 0 ? "text-warning-400" : "text-dark-500"}`}>
                      {item.score}/{item.maxScore}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* accuracy checks */}
        {accuracyChecks.length > 0 && (
          <div className="card">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent-400" /> Accuracy Verification
            </h3>
            <div className="space-y-2">
              {accuracyChecks.map((c) => (
                <div key={c.id} className={`flex items-start gap-2 text-sm p-2 rounded-lg ${
                  c.severity === "error" ? "bg-error-500/10 text-error-400" :
                  c.severity === "warning" ? "bg-warning-500/10 text-warning-400" :
                  "bg-info-500/10 text-info-400"
                }`}>
                  {c.severity === "error" ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> :
                   c.severity === "warning" ? <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> :
                   <Info className="w-4 h-4 shrink-0 mt-0.5" />}
                  <div>
                    <p>{c.message}</p>
                    {c.suggestion && <p className="text-xs mt-1 opacity-75">{c.suggestion}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* section confidence */}
        {readme?.sections && readme.sections.length > 0 && (
          <div className="card">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-accent-400" /> Section Confidence
            </h3>
            <div className="space-y-2">
              {readme.sections.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <span className="text-dark-200">{s.title}</span>
                  <span className={`badge ${
                    s.confidence === "verified" ? "badge-success" :
                    s.confidence === "user-provided" ? "badge-info" :
                    s.confidence === "ai-suggestion" ? "badge-accent" :
                    "badge-warning"
                  }`}>
                    {s.confidence.replace("-", " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* badges */}
        {badges.length > 0 && (
          <div className="card">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-accent-400" /> Badges
            </h3>
            <div className="space-y-2">
              {badges.map((b) => (
                <label key={b.id} className="flex items-center gap-3 text-sm cursor-pointer hover:bg-dark-700/50 p-2 rounded-lg transition">
                  <input
                    type="checkbox"
                    checked={b.enabled}
                    onChange={() => toggleBadge(b.id)}
                    className="w-4 h-4 rounded accent-accent-500"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.imageUrl} alt={b.label} className="h-5" />
                  <span className="text-dark-300">{b.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   HISTORY PANEL
   ════════════════════════════════════════════════ */

function HistoryPanel() {
  const { versions, restoreVersion, deleteVersion, clearVersions, saveVersion, markdown } = useStore();
  const [saveLabel, setSaveLabel] = useState("");

  const handleSave = () => {
    if (!markdown) { toast.error("Nothing to save."); return; }
    saveVersion(saveLabel || `Version ${versions.length + 1}`);
    setSaveLabel("");
    toast.success("Version saved!");
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <div className="card">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent-400" /> Save Current Version
          </h3>
          <div className="flex gap-3">
            <input value={saveLabel} onChange={(e) => setSaveLabel(e.target.value)} className="input flex-1" placeholder="Version label (optional)" />
            <button onClick={handleSave} className="btn-primary shrink-0">Save</button>
          </div>
        </div>

        {versions.length === 0 ? (
          <div className="text-center py-12 text-dark-400">
            <Clock className="w-12 h-12 mx-auto mb-4 text-dark-500" />
            <p className="text-lg font-medium">No versions saved yet.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">{versions.length} Version{versions.length !== 1 ? "s" : ""}</h3>
              <button onClick={() => { clearVersions(); toast.info("History cleared."); }} className="btn-ghost text-error-400 hover:text-error-300">
                <Trash2 className="w-4 h-4 mr-1" /> Clear All
              </button>
            </div>
            <div className="space-y-3">
              {versions.map((v) => (
                <div key={v.id} className="card flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{v.label}</p>
                    <p className="text-dark-400 text-xs mt-0.5">
                      {new Date(v.timestamp).toLocaleString()} · {v.template} template · {v.markdown.length} chars
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => { restoreVersion(v.id); toast.success("Version restored!"); }}
                      className="btn-secondary text-xs px-3 py-1.5"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" /> Restore
                    </button>
                    <button
                      onClick={() => deleteVersion(v.id)}
                      className="btn-icon text-dark-400 hover:text-error-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   SETTINGS PANEL
   ════════════════════════════════════════════════ */

function SettingsPanel() {
  const { resetProject } = useStore();
  const [exportDone, setExportDone] = useState(false);
  const analysis = useStore((s) => s.analysis);

  const exportJson = () => {
    if (!analysis) { toast.error("No analysis to export."); return; }
    const blob = new Blob([JSON.stringify(analysis, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${analysis.repo.name}-analysis.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportDone(true);
    setTimeout(() => setExportDone(false), 2000);
    toast.success("Analysis exported as JSON!");
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <div className="card">
          <h3 className="text-white font-semibold mb-4">Export</h3>
          <div className="space-y-3">
            <button onClick={exportJson} disabled={!analysis} className="btn-secondary w-full text-left flex items-center gap-3">
              <Download className="w-4 h-4" />
              <span>Export Analysis as JSON</span>
              {exportDone && <Check className="w-4 h-4 text-success-400 ml-auto" />}
            </button>
          </div>
        </div>

        <div className="card">
          <h3 className="text-white font-semibold mb-4">Privacy</h3>
          <ul className="space-y-2 text-sm text-dark-300">
            <li className="flex items-start gap-2"><Shield className="w-4 h-4 text-success-500 shrink-0 mt-0.5" /> Only public repositories are analyzed via GitHub&apos;s public API.</li>
            <li className="flex items-start gap-2"><Shield className="w-4 h-4 text-success-500 shrink-0 mt-0.5" /> Repository data is processed in memory, not stored on servers.</li>
            <li className="flex items-start gap-2"><Shield className="w-4 h-4 text-success-500 shrink-0 mt-0.5" /> Version history is stored in your browser&apos;s localStorage only.</li>
            <li className="flex items-start gap-2"><Shield className="w-4 h-4 text-success-500 shrink-0 mt-0.5" /> AI requests may send project metadata to the configured AI provider.</li>
          </ul>
        </div>

        <div className="card border-error-500/20">
          <h3 className="text-white font-semibold mb-4">Danger Zone</h3>
          <button
            onClick={() => { resetProject(); toast.info("Project data cleared."); }}
            className="btn-secondary border-error-500/30 text-error-400 hover:bg-error-500/10 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Reset Everything
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   AI ASSISTANT (slide-out panel in editor)
   ════════════════════════════════════════════════ */

function AiAssistantToggle() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(!open)} className={`btn-ghost flex items-center gap-1.5 ${open ? "text-accent-400" : ""}`}>
        <Bot className="w-4 h-4" />
        <span className="hidden sm:inline">AI Assistant</span>
      </button>
      {open && <AiAssistantPanel onClose={() => setOpen(false)} />}
    </>
  );
}

function AiAssistantPanel({ onClose }: { onClose: () => void }) {
  const { aiMessages, addAiMessage, aiLoading, setAiLoading, markdown, setMarkdown, analysis } = useStore();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [aiMessages]);

  const send = async () => {
    const msg = input.trim();
    if (!msg || aiLoading) return;
    setInput("");

    const userMsg: AiMessage = {
      id: Date.now().toString(),
      role: "user",
      content: msg,
      timestamp: Date.now(),
    };
    addAiMessage(userMsg);
    setAiLoading(true);

    try {
      const res = await fetch("/api/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          currentReadme: markdown,
          projectContext: analysis
            ? `Repo: ${analysis.repo.fullName}\nDescription: ${analysis.repo.description}\nTechnologies: ${analysis.technologies.map((t) => t.name).join(", ")}`
            : "Manual project — no analysis data.",
        }),
      });
      const data = await res.json();
      const assistantMsg: AiMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.data?.message || "No response.",
        proposedReadme: data.data?.updatedReadme,
        status: data.data?.updatedReadme ? "pending" : undefined,
        timestamp: Date.now(),
      };
      addAiMessage(assistantMsg);
    } catch {
      addAiMessage({
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Failed to reach AI assistant. Check your connection.",
        timestamp: Date.now(),
      });
    } finally {
      setAiLoading(false);
    }
  };

  const applyReadme = (msgId: string, proposed: string) => {
    setMarkdown(proposed);
    // update status
    const msgs = useStore.getState().aiMessages.map((m) =>
      m.id === msgId ? { ...m, status: "applied" as const } : m
    );
    useStore.setState({ aiMessages: msgs });
    toast.success("AI suggestion applied to editor!");
  };

  return (
    <div className="fixed right-0 top-14 bottom-0 w-96 bg-dark-900 border-l border-dark-700 z-40 flex flex-col animate-fade-in shadow-2xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700">
        <h3 className="text-white font-semibold flex items-center gap-2 text-sm">
          <Bot className="w-4 h-4 text-accent-400" /> AI Assistant
        </h3>
        <button onClick={onClose} className="btn-icon"><X className="w-4 h-4" /></button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {aiMessages.length === 0 && (
          <div className="text-center py-8 text-dark-400 text-sm">
            <Bot className="w-8 h-8 mx-auto mb-3 text-dark-500" />
            <p>Ask the AI to improve your README.</p>
            <div className="mt-4 space-y-2 text-left">
              {["Make this more professional", "Shorten the description", "Add a contribution guide", "Improve the installation section"].map((s) => (
                <button key={s} onClick={() => setInput(s)} className="block w-full text-left px-3 py-2 rounded-lg bg-dark-800 text-dark-300 hover:bg-dark-700 text-xs transition">
                  &ldquo;{s}&rdquo;
                </button>
              ))}
            </div>
          </div>
        )}
        {aiMessages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
              m.role === "user"
                ? "bg-accent-500/20 text-accent-100"
                : "bg-dark-800 text-dark-200"
            }`}>
              <p className="whitespace-pre-wrap">{m.content}</p>
              {m.proposedReadme && m.status === "pending" && (
                <button
                  onClick={() => applyReadme(m.id, m.proposedReadme!)}
                  className="mt-2 btn-primary text-xs px-3 py-1"
                >
                  Apply to Editor
                </button>
              )}
              {m.status === "applied" && (
                <span className="mt-2 inline-flex items-center gap-1 text-xs text-success-400">
                  <Check className="w-3 h-3" /> Applied
                </span>
              )}
            </div>
          </div>
        ))}
        {aiLoading && (
          <div className="flex items-center gap-2 text-dark-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Thinking…
          </div>
        )}
      </div>

      <div className="p-3 border-t border-dark-700">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask the AI…"
            className="input text-sm flex-1"
            disabled={aiLoading}
          />
          <button onClick={send} disabled={aiLoading || !input.trim()} className="btn-primary px-3">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
