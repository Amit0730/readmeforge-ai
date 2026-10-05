"use client";

import Link from "next/link";
import {
  GitBranch,
  FileText,
  Eye,
  Sparkles,
  Shield,
  LayoutTemplate,
  Image,
  Lock,
  ChevronRight,
  Star,
  Zap,
  ArrowRight,
  Github,
  CheckCircle2,
  Code2,
  Download,
  MessageSquare,
} from "lucide-react";
import { useState, useEffect } from "react";

/* ─────────── LANDING PAGE ─────────── */
export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-dark-700/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-white">
            <FileText className="w-5 h-5 text-accent-400" />
            <span>ReadmeForge<span className="text-accent-400"> AI</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-dark-200">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#how-it-works" className="hover:text-white transition">How It Works</a>
            <a href="#privacy" className="hover:text-white transition">Privacy</a>
            <a href="#faq" className="hover:text-white transition">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/Amit0730/readmeforge-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-icon"
            >
              <Github className="w-4 h-4" />
            </a>
            <Link href="/dashboard" className="btn-primary text-sm flex items-center gap-1.5">
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* gradient blobs */}
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-accent-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent-600/8 rounded-full blur-[100px] pointer-events-none" />

        <div
          className={`max-w-4xl mx-auto text-center relative z-10 transition-all duration-700 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="inline-flex items-center gap-2 badge badge-accent mb-6 text-xs px-3 py-1.5 rounded-full">
            <Sparkles className="w-3.5 h-3.5" /> AI-Powered Documentation
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-white mb-5">
            Turn Any Project Into a{" "}
            <span className="gradient-text">Professional README</span>
          </h1>
          <p className="text-lg sm:text-xl text-dark-300 max-w-2xl mx-auto mb-8 leading-relaxed">
            Analyze your repository, generate accurate documentation, and ship a README that actually explains your project.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard" className="btn-primary text-base px-8 py-3 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Generate README
            </Link>
            <Link href="/dashboard?demo=true" className="btn-secondary text-base px-8 py-3 flex items-center gap-2">
              <Eye className="w-4 h-4" /> Try Demo
            </Link>
          </div>

          {/* trust signals */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-dark-400">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-success-500" /> Free &amp; Open Source</span>
            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-accent-400" /> No Secrets Stored</span>
            <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-warning-500" /> Public Repos Only</span>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 px-6 bg-dark-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Powerful Features</h2>
            <p className="text-dark-300 max-w-xl mx-auto">
              Everything you need to create comprehensive, accurate documentation.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div
                key={i}
                className="card card-hover group cursor-default"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center mb-4 group-hover:bg-accent-500/20 transition">
                  <f.icon className="w-5 h-5 text-accent-400" />
                </div>
                <h3 className="text-white font-semibold text-base mb-1.5">{f.title}</h3>
                <p className="text-dark-300 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">How It Works</h2>
            <p className="text-dark-300 max-w-xl mx-auto">Three steps to a professional README.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <div key={i} className="relative text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-accent-500/10 flex items-center justify-center mb-4 relative">
                  <span className="text-xl font-bold gradient-text">{i + 1}</span>
                </div>
                <h3 className="text-white font-semibold mb-1.5">{s.title}</h3>
                <p className="text-dark-300 text-sm">{s.desc}</p>
                {i < 2 && (
                  <ChevronRight className="hidden md:block absolute top-6 -right-4 w-5 h-5 text-dark-500" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Privacy ── */}
      <section id="privacy" className="py-20 px-6 bg-dark-900/50">
        <div className="max-w-3xl mx-auto card glass">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-success-500/10 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-success-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg mb-2">Privacy &amp; Security</h3>
              <ul className="space-y-2 text-sm text-dark-300">
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-success-500 shrink-0 mt-0.5" /> Only public repositories are analyzed via GitHub&apos;s public API.</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-success-500 shrink-0 mt-0.5" /> Repository contents are not stored on our servers.</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-success-500 shrink-0 mt-0.5" /> AI processing sends only project metadata to the configured provider.</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-success-500 shrink-0 mt-0.5" /> Never submit secrets or private credentials.</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-success-500 shrink-0 mt-0.5" /> All processing happens in your browser or via secure server-side API routes.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-10 text-center">FAQ</h2>
          <div className="space-y-4">
            {faqs.map((f, i) => (
              <details
                key={i}
                className="card group"
              >
                <summary className="flex items-center justify-between cursor-pointer text-white font-medium list-none">
                  {f.q}
                  <ChevronRight className="w-4 h-4 text-dark-400 transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm text-dark-300 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Level Up Your Documentation?
          </h2>
          <p className="text-dark-300 mb-8">
            Start generating professional READMEs in seconds.
          </p>
          <Link href="/dashboard" className="btn-primary text-base px-10 py-3.5 inline-flex items-center gap-2">
            <Zap className="w-5 h-5" /> Generate README Now
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-dark-700/50 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-dark-400">
            <FileText className="w-4 h-4 text-accent-400" />
            <span>ReadmeForge AI</span>
            <span className="mx-1">·</span>
            <span>Built with Next.js &amp; TypeScript</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-dark-400">
            <a
              href="https://github.com/Amit0730/readmeforge-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition flex items-center gap-1"
            >
              <Github className="w-4 h-4" /> GitHub
            </a>
            <span>&copy; {new Date().getFullYear()} Amit Kumar Singh</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── data ─── */

const features = [
  { icon: GitBranch, title: "Repository Analysis", desc: "Analyze any public GitHub repo — detect technologies, scripts, dependencies, and project structure automatically." },
  { icon: Sparkles, title: "AI-Powered Generation", desc: "Generate a polished README from your project's actual information. No fabrication — only verified facts." },
  { icon: Code2, title: "Split-Pane Editor", desc: "Write Markdown on the left, see a live preview on the right. Syntax highlighting, search, undo/redo included." },
  { icon: Shield, title: "Accuracy Guard", desc: "Every claim is tagged as Verified, User-Provided, or AI Suggestion. No uncertain info disguised as fact." },
  { icon: LayoutTemplate, title: "Multiple Templates", desc: "Developer, Portfolio, Open Source, and Minimal templates — switch freely without losing data." },
  { icon: Star, title: "Quality Score", desc: "Transparent 0–100 heuristic score showing exactly why your README gained or lost points." },
  { icon: Image, title: "Screenshot Builder", desc: "Drag-and-drop screenshots, add captions, and auto-generate Markdown image sections." },
  { icon: Download, title: "Export & History", desc: "Copy Markdown, download .md files, export JSON analysis, and restore previous versions from local history." },
  { icon: MessageSquare, title: "AI Assistant", desc: "Ask the assistant to rewrite sections, improve clarity, or add missing content — constrained to real project data." },
];

const steps = [
  { title: "Enter Your Project", desc: "Paste a GitHub URL or fill in project details manually." },
  { title: "Analyze & Generate", desc: "We detect technologies, parse configs, and draft a README." },
  { title: "Edit & Export", desc: "Fine-tune in the editor, verify accuracy, and download your README." },
];

const faqs = [
  { q: "Does it work with private repositories?", a: "No. ReadmeForge AI only uses GitHub's public API. For private repos, use Manual Mode to enter your project details directly." },
  { q: "Is the AI going to make things up?", a: "No. Our accuracy guard ensures every claim is supported by actual project data. Uncertain information is clearly labeled and never presented as verified fact." },
  { q: "What AI provider does it use?", a: "Google Gemini (free tier). If no API key is configured, the app still works — you get repository analysis, templates, quality checks, and the full Markdown editor without AI features." },
  { q: "Is my data stored?", a: "No. Repository data is processed in memory and never persisted on our servers. Version history is stored in your browser's localStorage." },
  { q: "Is it free?", a: "Yes, completely free and open source." },
];
