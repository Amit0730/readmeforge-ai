// ============================================================
// ReadmeForge AI — Core Type Definitions
// ============================================================

// ---- GitHub analysis ----

export interface RepoInfo {
  name: string;
  fullName: string;
  description: string;
  language: string;
  languages: Record<string, number>;
  topics: string[];
  license: string | null;
  licenseName: string | null;
  url: string;
  homepage: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  defaultBranch: string;
  owner: string;
  updatedAt: string;
}

export interface FileTreeItem {
  path: string;
  type: 'file' | 'dir';
  size?: number;
}

export type TechCategory =
  | 'language'
  | 'frontend'
  | 'backend'
  | 'database'
  | 'styling'
  | 'infrastructure'
  | 'testing'
  | 'tooling';

export interface DetectedTech {
  name: string;
  category: TechCategory;
  /** File or signal that proves the technology is used. */
  evidence: string;
}

export interface EnvVariable {
  key: string;
  description: string;
  required: boolean;
}

export interface AnalysisResult {
  repo: RepoInfo;
  technologies: DetectedTech[];
  fileTree: FileTreeItem[];
  treeTruncated: boolean;
  envVariables: EnvVariable[];
  envSource: string | null;
  packageManager: string | null;
  scripts: Record<string, string>;
  installCommand: string | null;
  nodeEngine: string | null;
  pythonVersion: string | null;
  dockerPort: string | null;
  existingReadme: string | null;
  readmeFeatures: string[];
  configFiles: string[];
  analyzedAt: string;
  /** Where the analysis ran: server API route or browser fallback. */
  analyzedBy: 'server' | 'browser';
}

// ---- Manual / supplementary input ----

export interface ManualProjectInput {
  name: string;
  description: string;
  technologies: string[];
  features: string[];
  installCommands: string;
  runCommand: string;
  usage: string;
  envVariables: EnvVariable[];
  deploymentPlatform: string;
  authorName: string;
  authorGithub: string;
  repoUrl: string;
  liveUrl: string;
  license: string;
}

// ---- Evidence-tracked project context ----

/** Where a piece of information came from. */
export type Origin = 'detected' | 'user' | 'readme';

export interface Sourced<T> {
  value: T;
  origin: Origin;
  evidence?: string;
}

export interface ProjectContext {
  source: 'github' | 'manual';
  name: string;
  description: Sourced<string> | null;
  repoUrl: string;
  liveUrl: Sourced<string> | null;
  license: Sourced<string> | null;
  author: { name: string; url: string } | null;
  technologies: (DetectedTech & { origin: Origin })[];
  features: Sourced<string>[];
  files: string[];
  envVars: (EnvVariable & { origin: Origin })[];
  installCommands: Sourced<string[]> | null;
  runCommand: Sourced<string> | null;
  buildCommand: Sourced<string> | null;
  testCommand: Sourced<string> | null;
  usage: Sourced<string> | null;
  deployment: Sourced<string>[];
  apiEvidence: string[];
  packageManager: string | null;
  nodeEngine: string | null;
  pythonVersion: string | null;
  dockerPort: string | null;
  hasLicenseFile: boolean;
  hasContributingFile: boolean;
  hasCodeOfConductFile: boolean;
  topics: string[];
}

// ---- README generation ----

export type ReadmeTemplate = 'developer' | 'portfolio' | 'open-source' | 'minimal';

export type SectionConfidence = 'verified' | 'user-provided' | 'ai-suggestion' | 'needs-confirmation';

export interface SectionReport {
  id: string;
  title: string;
  confidence: SectionConfidence;
  note: string;
}

export interface GeneratedReadme {
  markdown: string;
  template: ReadmeTemplate;
  sections: SectionReport[];
  generatedAt: string;
}

// ---- Quality & verification ----

export interface QualityScoreItem {
  label: string;
  score: number;
  maxScore: number;
  reason: string;
}

export interface QualityScore {
  total: number;
  maxTotal: number;
  items: QualityScoreItem[];
}

export type CheckSeverity = 'error' | 'warning' | 'info';

export interface AccuracyCheck {
  id: string;
  severity: CheckSeverity;
  category: 'technology' | 'command' | 'env' | 'deployment' | 'feature' | 'link' | 'api' | 'placeholder' | 'secret';
  message: string;
  suggestion?: string;
}

// ---- Badges ----

export interface Badge {
  id: string;
  label: string;
  url: string;
  imageUrl: string;
  enabled: boolean;
  category: 'repository' | 'license' | 'package' | 'deployment' | 'technology';
  evidence: string;
}

// ---- Screenshots ----

export interface Screenshot {
  id: string;
  /** Object URL — exists only in this browser tab, never uploaded. */
  preview: string;
  filename: string;
  caption: string;
  mime: string;
}

// ---- Version history ----

export interface ReadmeVersion {
  id: string;
  markdown: string;
  timestamp: number;
  label: string;
  template: ReadmeTemplate;
}

// ---- AI assistant ----

export interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  proposedReadme?: string;
  status?: 'pending' | 'applied' | 'discarded';
  timestamp: number;
}

export type DashboardView = 'generate' | 'editor' | 'preview' | 'quality' | 'history' | 'settings';
export type InputMode = 'github' | 'manual';
