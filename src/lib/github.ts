// ============================================================
// GitHub API Service — Repository Analysis
// ============================================================

import type {
  RepoInfo,
  FileTreeItem,
  DetectedTech,
  EnvVariable,
  AnalysisResult,
} from './types';
import { detectTechnologies } from './tech-detector';

const GITHUB_API = 'https://api.github.com';

// Parse a GitHub URL into owner/repo
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const patterns = [
    /github\.com\/([^/]+)\/([^/\s#?]+)/,
    /^([^/]+)\/([^/\s#?]+)$/,
  ];

  for (const pattern of patterns) {
    const match = url.trim().match(pattern);
    if (match) {
      return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
    }
  }
  return null;
}

// Fetch with optional auth header
async function ghFetch(path: string, token?: string): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'ReadmeForge-AI',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${GITHUB_API}${path}`, { headers, next: { revalidate: 300 } });
  return res;
}

// Get basic repo info
export async function getRepoInfo(owner: string, repo: string, token?: string): Promise<RepoInfo> {
  const res = await ghFetch(`/repos/${owner}/${repo}`, token);
  if (!res.ok) {
    if (res.status === 404) throw new Error('Repository not found. Please check the URL and ensure the repository is public.');
    if (res.status === 403) throw new Error('GitHub API rate limit exceeded. Please try again later or provide a GitHub token.');
    throw new Error(`GitHub API error: ${res.status}`);
  }

  const data = await res.json();
  if (data.private) {
    throw new Error('This is a private repository. ReadmeForge AI only supports public repositories. Please use Manual Mode instead.');
  }

  // Fetch languages
  const langRes = await ghFetch(`/repos/${owner}/${repo}/languages`, token);
  const languages = langRes.ok ? await langRes.json() : {};

  return {
    name: data.name,
    fullName: data.full_name,
    description: data.description || '',
    language: data.language || '',
    languages,
    topics: data.topics || [],
    license: data.license?.spdx_id || null,
    url: data.html_url,
    homepage: data.homepage || null,
    stars: data.stargazers_count,
    forks: data.forks_count,
    openIssues: data.open_issues_count,
    defaultBranch: data.default_branch,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    owner: data.owner.login,
    isPrivate: data.private,
  };
}

// Get the file tree (top-level + src if exists)
export async function getFileTree(
  owner: string,
  repo: string,
  branch: string,
  token?: string
): Promise<FileTreeItem[]> {
  const res = await ghFetch(`/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, token);
  if (!res.ok) return [];

  const data = await res.json();
  const items: FileTreeItem[] = (data.tree || [])
    .filter((item: { type: string }) => item.type === 'blob' || item.type === 'tree')
    .slice(0, 500) // Limit to prevent oversized responses
    .map((item: { path: string; type: string; size?: number }) => ({
      path: item.path,
      type: item.type === 'blob' ? 'file' : 'dir',
      size: item.size,
    }));

  return items;
}

// Get file content
export async function getFileContent(
  owner: string,
  repo: string,
  path: string,
  token?: string
): Promise<string | null> {
  const res = await ghFetch(`/repos/${owner}/${repo}/contents/${path}`, token);
  if (!res.ok) return null;

  const data = await res.json();
  if (data.encoding === 'base64' && data.content) {
    return Buffer.from(data.content, 'base64').toString('utf-8');
  }
  return null;
}

// Parse .env.example to extract env variables
function parseEnvExample(content: string): EnvVariable[] {
  const vars: EnvVariable[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const key = trimmed.substring(0, eqIndex).trim();
    const value = trimmed.substring(eqIndex + 1).trim();

    vars.push({
      key,
      description: '',
      example: value || `your_${key.toLowerCase()}`,
      required: true,
    });
  }

  return vars;
}

// Parse package.json for scripts
function parsePackageJson(content: string): {
  installCommand: string | null;
  startCommand: string | null;
  buildCommand: string | null;
  packageManager: string | null;
  dependencies: string[];
  devDependencies: string[];
} {
  try {
    const pkg = JSON.parse(content);
    const scripts = pkg.scripts || {};
    const deps = Object.keys(pkg.dependencies || {});
    const devDeps = Object.keys(pkg.devDependencies || {});

    let packageManager: string | null = 'npm';
    if (pkg.packageManager) {
      if (pkg.packageManager.includes('yarn')) packageManager = 'yarn';
      else if (pkg.packageManager.includes('pnpm')) packageManager = 'pnpm';
      else if (pkg.packageManager.includes('bun')) packageManager = 'bun';
    }

    const installCmd = packageManager === 'yarn' ? 'yarn install' :
      packageManager === 'pnpm' ? 'pnpm install' :
      packageManager === 'bun' ? 'bun install' : 'npm install';

    return {
      installCommand: installCmd,
      startCommand: scripts.dev ? `${packageManager === 'npm' ? 'npm run' : packageManager} dev` :
        scripts.start ? `${packageManager === 'npm' ? 'npm run' : packageManager} start` : null,
      buildCommand: scripts.build ? `${packageManager === 'npm' ? 'npm run' : packageManager} build` : null,
      packageManager,
      dependencies: deps,
      devDependencies: devDeps,
    };
  } catch {
    return {
      installCommand: null,
      startCommand: null,
      buildCommand: null,
      packageManager: null,
      dependencies: [],
      devDependencies: [],
    };
  }
}

// Full analysis pipeline
export async function analyzeRepository(url: string, token?: string): Promise<AnalysisResult> {
  const parsed = parseGitHubUrl(url);
  if (!parsed) throw new Error('Invalid GitHub URL. Please enter a valid repository URL (e.g., https://github.com/user/repo).');

  const { owner, repo } = parsed;

  // Step 1: Get basic info
  const repoInfo = await getRepoInfo(owner, repo, token);

  // Step 2: Get file tree
  const fileTree = await getFileTree(owner, repo, repoInfo.defaultBranch, token);

  // Step 3: Get key config files
  const configFileNames = [
    'package.json',
    'requirements.txt',
    'pyproject.toml',
    'Pipfile',
    'pom.xml',
    'build.gradle',
    'build.gradle.kts',
    'Cargo.toml',
    'go.mod',
    'Gemfile',
    'composer.json',
    'Dockerfile',
    'docker-compose.yml',
    'docker-compose.yaml',
    '.env.example',
    '.env.sample',
    'vercel.json',
    'netlify.toml',
    'next.config.js',
    'next.config.ts',
    'next.config.mjs',
    'vite.config.ts',
    'vite.config.js',
    'angular.json',
    'vue.config.js',
    'nuxt.config.ts',
    'tsconfig.json',
    'tailwind.config.js',
    'tailwind.config.ts',
    'webpack.config.js',
    '.github/workflows',
  ];

  const configFiles: string[] = [];
  const fileContents: Record<string, string> = {};

  for (const fileName of configFileNames) {
    const exists = fileTree.some(f => f.path === fileName || f.path.startsWith(fileName));
    if (exists) {
      configFiles.push(fileName);
      // Fetch content for important files
      if (['package.json', 'requirements.txt', 'pyproject.toml', 'Cargo.toml', 'go.mod',
           '.env.example', '.env.sample', 'composer.json', 'Gemfile', 'Pipfile'].includes(fileName)) {
        const content = await getFileContent(owner, repo, fileName, token);
        if (content) fileContents[fileName] = content;
      }
    }
  }

  // Get existing README
  let existingReadme: string | null = null;
  const readmeFile = fileTree.find(f =>
    f.path.toLowerCase() === 'readme.md' ||
    f.path.toLowerCase() === 'readme.rst' ||
    f.path.toLowerCase() === 'readme.txt' ||
    f.path.toLowerCase() === 'readme'
  );
  if (readmeFile) {
    existingReadme = await getFileContent(owner, repo, readmeFile.path, token);
  }

  // Step 4: Parse package info
  let installCommand: string | null = null;
  let startCommand: string | null = null;
  let buildCommand: string | null = null;
  let packageManager: string | null = null;
  let npmDeps: string[] = [];
  let npmDevDeps: string[] = [];

  if (fileContents['package.json']) {
    const pkgInfo = parsePackageJson(fileContents['package.json']);
    installCommand = pkgInfo.installCommand;
    startCommand = pkgInfo.startCommand;
    buildCommand = pkgInfo.buildCommand;
    packageManager = pkgInfo.packageManager;
    npmDeps = pkgInfo.dependencies;
    npmDevDeps = pkgInfo.devDependencies;
  } else if (fileContents['requirements.txt'] || fileContents['pyproject.toml'] || fileContents['Pipfile']) {
    packageManager = 'pip';
    installCommand = fileContents['requirements.txt'] ? 'pip install -r requirements.txt' :
      fileContents['Pipfile'] ? 'pipenv install' : 'pip install .';
  } else if (fileContents['Cargo.toml']) {
    packageManager = 'cargo';
    installCommand = 'cargo build';
    startCommand = 'cargo run';
  } else if (fileContents['go.mod']) {
    packageManager = 'go';
    installCommand = 'go mod download';
    startCommand = 'go run .';
    buildCommand = 'go build .';
  }

  // Step 5: Parse env variables
  let envVariables: EnvVariable[] = [];
  const envContent = fileContents['.env.example'] || fileContents['.env.sample'];
  if (envContent) {
    envVariables = parseEnvExample(envContent);
  }

  // Step 6: Detect technologies
  const technologies = detectTechnologies(
    repoInfo,
    fileTree,
    configFiles,
    fileContents,
    npmDeps,
    npmDevDeps
  );

  // Step 7: Check for Docker and CI
  const hasDockerfile = configFiles.includes('Dockerfile') ||
    configFiles.includes('docker-compose.yml') ||
    configFiles.includes('docker-compose.yaml');
  const hasCI = fileTree.some(f => f.path.startsWith('.github/workflows/'));

  return {
    repo: repoInfo,
    technologies,
    fileTree,
    envVariables,
    hasDockerfile,
    hasCI,
    packageManager,
    installCommand,
    startCommand,
    buildCommand,
    existingReadme,
    configFiles,
  };
}
