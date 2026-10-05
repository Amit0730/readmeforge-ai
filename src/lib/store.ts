// ============================================================
// Zustand Store — ReadmeForge AI global state
// ============================================================

import { create } from "zustand";
import type {
  AnalysisResult,
  ManualProjectInput,
  ReadmeTemplate,
  GeneratedReadme,
  Screenshot,
  Badge,
  ReadmeVersion,
  AiMessage,
  QualityScore,
  AccuracyCheck,
  DashboardView,
  InputMode,
} from "./types";

export interface AppStore {
  /* ── nav ── */
  view: DashboardView;
  inputMode: InputMode;
  setView: (v: DashboardView) => void;
  setInputMode: (m: InputMode) => void;

  /* ── input ── */
  githubUrl: string;
  setGithubUrl: (u: string) => void;
  manual: ManualProjectInput;
  patchManual: (p: Partial<ManualProjectInput>) => void;

  /* ── analysis ── */
  analysis: AnalysisResult | null;
  analysisLoading: boolean;
  analysisError: string | null;
  setAnalysis: (a: AnalysisResult | null) => void;
  setAnalysisLoading: (b: boolean) => void;
  setAnalysisError: (e: string | null) => void;

  /* ── generation ── */
  readme: GeneratedReadme | null;
  readmeLoading: boolean;
  readmeError: string | null;
  template: ReadmeTemplate;
  setReadme: (r: GeneratedReadme | null) => void;
  setReadmeLoading: (b: boolean) => void;
  setReadmeError: (e: string | null) => void;
  setTemplate: (t: ReadmeTemplate) => void;

  /* ── editor ── */
  markdown: string;
  setMarkdown: (m: string) => void;

  /* ── quality ── */
  qualityScore: QualityScore | null;
  accuracyChecks: AccuracyCheck[];
  setQualityScore: (q: QualityScore | null) => void;
  setAccuracyChecks: (c: AccuracyCheck[]) => void;

  /* ── badges ── */
  badges: Badge[];
  setBadges: (b: Badge[]) => void;
  toggleBadge: (id: string) => void;

  /* ── screenshots ── */
  screenshots: Screenshot[];
  addScreenshot: (s: Screenshot) => void;
  removeScreenshot: (id: string) => void;
  updateScreenshot: (id: string, u: Partial<Screenshot>) => void;
  reorderScreenshots: (ss: Screenshot[]) => void;

  /* ── version history ── */
  versions: ReadmeVersion[];
  saveVersion: (label: string) => void;
  restoreVersion: (id: string) => void;
  deleteVersion: (id: string) => void;
  clearVersions: () => void;
  hydrateVersions: () => void;

  /* ── AI ── */
  aiMessages: AiMessage[];
  aiLoading: boolean;
  addAiMessage: (m: AiMessage) => void;
  setAiLoading: (b: boolean) => void;
  clearAiMessages: () => void;

  /* ── reset ── */
  resetProject: () => void;
}

const blankManual: ManualProjectInput = {
  name: "",
  description: "",
  technologies: [],
  features: [],
  installCommands: "",
  runCommand: "",
  usage: "",
  envVariables: [],
  deploymentPlatform: "",
  authorName: "",
  authorGithub: "",
  repoUrl: "",
  liveUrl: "",
  license: "MIT",
};

export const useStore = create<AppStore>((set, get) => ({
  /* nav */
  view: "generate",
  inputMode: "github",
  setView: (view) => set({ view }),
  setInputMode: (inputMode) => set({ inputMode }),

  /* input */
  githubUrl: "",
  setGithubUrl: (githubUrl) => set({ githubUrl }),
  manual: { ...blankManual },
  patchManual: (p) => set((s) => ({ manual: { ...s.manual, ...p } })),

  /* analysis */
  analysis: null,
  analysisLoading: false,
  analysisError: null,
  setAnalysis: (analysis) => set({ analysis }),
  setAnalysisLoading: (analysisLoading) => set({ analysisLoading }),
  setAnalysisError: (analysisError) => set({ analysisError }),

  /* generation */
  readme: null,
  readmeLoading: false,
  readmeError: null,
  template: "developer",
  setReadme: (readme) => set({ readme }),
  setReadmeLoading: (readmeLoading) => set({ readmeLoading }),
  setReadmeError: (readmeError) => set({ readmeError }),
  setTemplate: (template) => set({ template }),

  /* editor */
  markdown: "",
  setMarkdown: (markdown) => set({ markdown }),

  /* quality */
  qualityScore: null,
  accuracyChecks: [],
  setQualityScore: (qualityScore) => set({ qualityScore }),
  setAccuracyChecks: (accuracyChecks) => set({ accuracyChecks }),

  /* badges */
  badges: [],
  setBadges: (badges) => set({ badges }),
  toggleBadge: (id) =>
    set((s) => ({
      badges: s.badges.map((b) =>
        b.id === id ? { ...b, enabled: !b.enabled } : b
      ),
    })),

  /* screenshots */
  screenshots: [],
  addScreenshot: (s) => set((st) => ({ screenshots: [...st.screenshots, s] })),
  removeScreenshot: (id) =>
    set((s) => ({ screenshots: s.screenshots.filter((x) => x.id !== id) })),
  updateScreenshot: (id, u) =>
    set((s) => ({
      screenshots: s.screenshots.map((x) =>
        x.id === id ? { ...x, ...u } : x
      ),
    })),
  reorderScreenshots: (screenshots) => set({ screenshots }),

  /* versions */
  versions: [],
  saveVersion: (label) => {
    const { markdown, template, versions } = get();
    const v: ReadmeVersion = {
      id: Date.now().toString(),
      markdown,
      timestamp: Date.now(),
      label,
      template,
    };
    const next = [v, ...versions].slice(0, 30);
    set({ versions: next });
    try { localStorage.setItem("rf-versions", JSON.stringify(next)); } catch {}
  },
  restoreVersion: (id) => {
    const v = get().versions.find((x) => x.id === id);
    if (v) set({ markdown: v.markdown, template: v.template });
  },
  deleteVersion: (id) => {
    const next = get().versions.filter((x) => x.id !== id);
    set({ versions: next });
    try { localStorage.setItem("rf-versions", JSON.stringify(next)); } catch {}
  },
  clearVersions: () => {
    set({ versions: [] });
    try { localStorage.removeItem("rf-versions"); } catch {}
  },
  hydrateVersions: () => {
    try {
      const raw = localStorage.getItem("rf-versions");
      if (raw) set({ versions: JSON.parse(raw) });
    } catch {}
  },

  /* AI */
  aiMessages: [],
  aiLoading: false,
  addAiMessage: (m) => set((s) => ({ aiMessages: [...s.aiMessages, m] })),
  setAiLoading: (aiLoading) => set({ aiLoading }),
  clearAiMessages: () => set({ aiMessages: [] }),

  /* reset */
  resetProject: () =>
    set({
      analysis: null,
      analysisError: null,
      readme: null,
      readmeError: null,
      markdown: "",
      qualityScore: null,
      accuracyChecks: [],
      badges: [],
      screenshots: [],
      aiMessages: [],
      view: "generate",
    }),
}));
