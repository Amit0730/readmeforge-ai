// ============================================================
// README Generator — Template-based Markdown Generation
// ============================================================

import type {
  AnalysisResult,
  ManualProjectInput,
  ReadmeTemplate,
  GeneratedReadme,
  SectionReport,
  SectionConfidence,
  QualityScore,
  QualityScoreItem,
  AccuracyCheck,
  Badge,
  DetectedTech,
  EnvVariable,
  FileTreeItem,
} from './types';

// ---- Template configs ----

const templateConfig: Record<ReadmeTemplate, {
  sections: string[];
  badges: boolean;
  toc: boolean;
}> = {
  developer: {
    sections: ['overview','features','techstack','architecture','structure','prerequisites','installation','env','running','usage','api','deployment','contributing','license'],
    badges: true, toc: true,
  },
  portfolio: {
    sections: ['overview','demo','screenshots','features','techstack','installation','usage','license'],
    badges: true, toc: false,
  },
  'open-source': {
    sections: ['overview','features','techstack','structure','prerequisites','installation','env','running','usage','api','deployment','contributing','codeofconduct','license'],
    badges: true, toc: true,
  },
  minimal: {
    sections: ['overview','features','installation','usage','license'],
    badges: false, toc: false,
  },
};

// ---- helpers ----

function buildTree(files: FileTreeItem[], maxDepth = 3): string {
  const tree: Record<string, unknown> = {};
  for (const f of files) {
    const parts = f.path.split('/');
    if (parts.length > maxDepth + 1) continue;
    if (['node_modules','.git','.next','__pycache__','.venv','dist','build'].includes(parts[0])) continue;
    let cur: Record<string, unknown> = tree;
    for (let i = 0; i < parts.length; i++) {
      if (i === parts.length - 1 && f.type === 'file') { cur[parts[i]] = null; }
      else { if (!cur[parts[i]] || typeof cur[parts[i]] !== 'object') cur[parts[i]] = {}; cur = cur[parts[i]] as Record<string, unknown>; }
    }
  }
  function render(obj: Record<string, unknown>, pfx = ''): string {
    const entries = Object.entries(obj).sort(([,a],[,b]) => (a !== null ? -1 : 0) - (b !== null ? -1 : 0));
    let r = '';
    entries.forEach(([k, v], i) => {
      const last = i === entries.length - 1;
      r += `${pfx}${last ? '└── ' : '├── '}${k}${v !== null ? '/' : ''}\n`;
      if (v !== null) r += render(v as Record<string, unknown>, pfx + (last ? '    ' : '│   '));
    });
    return r;
  }
  return render(tree);
}

const catLabel: Record<string, string> = {
  language: '💻 Languages', frontend: '🎨 Frontend', backend: '⚙️ Backend',
  database: '🗄️ Database', styling: '🎨 Styling', infrastructure: '☁️ Infrastructure',
  testing: '🧪 Testing', tooling: '🔧 Tooling',
};

function groupTechs(techs: DetectedTech[]): Record<string, DetectedTech[]> {
  const g: Record<string, DetectedTech[]> = {};
  for (const t of techs) { (g[t.category] ??= []).push(t); }
  return g;
}

// ---- main ----

export function generateReadme(
  analysis: AnalysisResult | null,
  manual: ManualProjectInput | null,
  template: ReadmeTemplate,
  screenshots: { caption: string; filename: string }[] = [],
  badges: Badge[] = [],
): GeneratedReadme {
  const cfg = templateConfig[template];
  const sections: SectionReport[] = [];
  const checks: AccuracyCheck[] = [];

  const name       = analysis?.repo?.name ?? manual?.name ?? 'Project';
  const desc       = analysis?.repo?.description ?? manual?.description ?? '';
  const repoUrl    = analysis?.repo?.url ?? manual?.repoUrl ?? '';
  const liveUrl    = analysis?.repo?.homepage ?? manual?.liveUrl ?? '';
  const license    = analysis?.repo?.license ?? manual?.license ?? '';
  const techs      = analysis?.technologies ?? [];
  const features   = manual?.features ?? [];
  const envVars    = analysis?.envVariables ?? manual?.envVariables ?? [];
  const files      = analysis?.fileTree ?? [];
  const installCmd = analysis?.installCommand ?? manual?.installCommands ?? '';
  const startCmd   = analysis?.scripts?.dev ? `${analysis.packageManager === 'yarn' ? 'yarn' : analysis.packageManager === 'pnpm' ? 'pnpm' : 'npm run'} dev` : (manual?.runCommand ?? '');
  const buildCmd   = analysis?.scripts?.build ? `${analysis.packageManager === 'yarn' ? 'yarn' : analysis.packageManager === 'pnpm' ? 'pnpm' : 'npm run'} build` : '';
  const deploy     = manual?.deploymentPlatform ?? '';
  const author     = manual?.authorName ?? analysis?.repo?.owner ?? '';
  const authorUrl  = manual?.authorGithub ?? (analysis?.repo ? `https://github.com/${analysis.repo.owner}` : '');
  const topics     = analysis?.repo?.topics ?? [];

  let md = '';

  // badges
  const eb = badges.filter(b => b.enabled);
  if (cfg.badges && eb.length) { md += eb.map(b => `[![${b.label}](${b.imageUrl})](${b.url})`).join(' ') + '\n\n'; }

  // per-section builder
  const add = (id: string, heading: string, body: string, conf: SectionConfidence, isH1 = false) => {
    sections.push({ id, title: heading, confidence: conf, note: '' });
    md += `${isH1 ? '#' : '##'} ${heading}\n\n${body}\n\n`;
  };

  for (const sid of cfg.sections) {
    switch (sid) {
      case 'overview': {
        const lines: string[] = [];
        if (desc) lines.push(desc, '');
        if (liveUrl) lines.push(`🌐 **[Live Demo](${liveUrl})**`, '');
        if (repoUrl) lines.push(`📦 **[Repository](${repoUrl})**`, '');
        if (!desc) checks.push({ id: 'no-desc', severity: 'warning', category: 'feature', message: 'No project description provided.', suggestion: 'Add a brief description of what your project does.' });
        add('overview', name, lines.join('\n'), desc ? 'verified' : 'needs-confirmation', true);
        break;
      }
      case 'features': {
        if (features.length) {
          add('features', '✨ Features', features.map(f => `- ${f}`).join('\n'), 'user-provided');
        } else if (analysis) {
          add('features', '✨ Features', '*Add your project features here.*', 'needs-confirmation');
          checks.push({ id: 'no-feat', severity: 'info', category: 'feature', message: 'No features manually provided.', suggestion: 'Add key features for a better README.' });
        }
        break;
      }
      case 'demo': {
        if (liveUrl) add('demo', '🎬 Demo', `Check out the live demo: **[${name}](${liveUrl})**`, 'verified');
        break;
      }
      case 'screenshots': {
        if (screenshots.length) {
          const body = screenshots.map(s => `### ${s.caption || 'Screenshot'}\n\n![${s.caption || 'Screenshot'}](./screenshots/${s.filename})`).join('\n\n');
          add('screenshots', '📸 Screenshots', body, 'user-provided');
        }
        break;
      }
      case 'techstack': {
        if (techs.length) {
          const groups = groupTechs(techs);
          const parts: string[] = [];
          for (const [c, ts] of Object.entries(groups)) {
            parts.push(`**${catLabel[c] || c}**`);
            for (const t of ts) parts.push(`- ${t.name}`);
            parts.push('');
          }
          add('techstack', '🛠️ Tech Stack', parts.join('\n'), 'verified');
        } else if (manual?.technologies?.length) {
          add('techstack', '🛠️ Tech Stack', manual.technologies.map(t => `- ${t}`).join('\n'), 'user-provided');
        }
        break;
      }
      case 'architecture': {
        if (analysis) {
          const lines: string[] = [];
          if (techs.some(t => t.name === 'Next.js')) lines.push('This project uses **Next.js** with the App Router architecture.');
          const dbs = techs.filter(t => t.category === 'database').map(t => t.name);
          if (dbs.length) lines.push(`Database: **${dbs.join(', ')}**`);
          if (analysis.configFiles.includes('Dockerfile')) lines.push('Containerized with **Docker**.');
          if (lines.length) add('architecture', '🏗️ Architecture', lines.join('\n\n'), 'ai-suggestion');
        }
        break;
      }
      case 'structure': {
        if (files.length) {
          add('structure', '📂 Project Structure', '```\n' + buildTree(files) + '```', 'verified');
        }
        break;
      }
      case 'prerequisites': {
        const p: string[] = [];
        if (analysis?.packageManager || techs.some(t => t.category === 'frontend' || t.name === 'Node.js')) {
          p.push(`- **Node.js** >= 18.0`);
          p.push(`- **${analysis?.packageManager || 'npm'}**`);
        }
        if (techs.some(t => t.name === 'Python')) p.push('- **Python** >= 3.8');
        if (techs.some(t => t.name === 'Docker')) p.push('- **Docker**');
        if (techs.some(t => t.name === 'Go')) p.push('- **Go** >= 1.21');
        if (techs.some(t => t.name === 'Rust')) p.push('- **Rust** (latest stable)');
        if (p.length) add('prerequisites', '📋 Prerequisites', p.join('\n'), 'verified');
        break;
      }
      case 'installation': {
        const s: string[] = [];
        s.push('1. **Clone the repository**\n```bash');
        s.push(`git clone ${repoUrl || 'https://github.com/username/project.git'}`);
        s.push(`cd ${name}\n\`\`\``);
        if (installCmd) { s.push('\n2. **Install dependencies**\n```bash'); s.push(installCmd); s.push('```'); }
        add('installation', '🚀 Installation', s.join('\n'), 'verified');
        if (!repoUrl) checks.push({ id: 'no-url', severity: 'info', category: 'link', message: 'No repository URL for clone command.' });
        break;
      }
      case 'env': {
        if (envVars.length) {
          const l: string[] = ['Create a `.env.local` file in the root directory:\n', '```env'];
          for (const v of envVars) l.push(`${v.key}=your_${v.key.toLowerCase()}`);
          l.push('```\n', '| Variable | Description | Required |', '|----------|-------------|----------|');
          for (const v of envVars) l.push(`| \`${v.key}\` | ${v.description || 'Required'} | ${v.required ? '✅' : '❌'} |`);
          add('env', '🔑 Environment Variables', l.join('\n'), 'verified');
        }
        break;
      }
      case 'running': {
        if (startCmd) {
          let body = '```bash\n' + startCmd + '\n```';
          if (buildCmd) body += '\n\n**Build for production:**\n```bash\n' + buildCmd + '\n```';
          add('running', '▶️ Running Locally', body, 'verified');
        }
        break;
      }
      case 'usage': {
        if (liveUrl) {
          add('usage', '📖 Usage', `Visit **[${liveUrl}](${liveUrl})** to use the application.\n\nOr run locally following the installation instructions above.`, 'verified');
        } else if (manual?.usage) {
          add('usage', '📖 Usage', manual.usage, 'user-provided');
        } else {
          add('usage', '📖 Usage', '*Describe how to use the application here.*', 'needs-confirmation');
        }
        break;
      }
      case 'api': {
        const hasApi = files.some(f => f.path.includes('api/') || f.path.includes('routes/')) ||
          techs.some(t => ['Express','FastAPI','Flask','Django','NestJS','Fastify','Gin','Fiber','Actix','Spring Boot'].includes(t.name));
        if (hasApi) {
          add('api', '📡 API', '*Document your API endpoints here.*\n\n| Method | Endpoint | Description |\n|--------|----------|-------------|\n| GET | `/api/example` | Description |', 'needs-confirmation');
          checks.push({ id: 'api-ph', severity: 'info', category: 'api', message: 'API section uses placeholder content.', suggestion: 'Replace with your actual API endpoints.' });
        }
        break;
      }
      case 'deployment': {
        const dl: string[] = [];
        if (techs.some(t => t.name === 'Vercel') || deploy.toLowerCase().includes('vercel') || techs.some(t => t.name === 'Next.js')) {
          dl.push('### Vercel\n\nOptimized for **[Vercel](https://vercel.com)**.\n\n[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=' + encodeURIComponent(repoUrl) + ')');
        }
        if (analysis?.configFiles.includes('Dockerfile') || deploy.toLowerCase().includes('docker')) {
          dl.push(`### Docker\n\n\`\`\`bash\ndocker build -t ${name.toLowerCase()} .\ndocker run -p 3000:3000 ${name.toLowerCase()}\n\`\`\``);
        }
        if (dl.length) add('deployment', '🚀 Deployment', dl.join('\n\n'), 'verified');
        break;
      }
      case 'contributing': {
        add('contributing', '🤝 Contributing', `Contributions are welcome! Please follow these steps:\n\n1. Fork the repository\n2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)\n3. Commit your changes (\`git commit -m 'Add amazing feature'\`)\n4. Push to the branch (\`git push origin feature/amazing-feature\`)\n5. Open a Pull Request`, template === 'open-source' ? 'verified' : 'ai-suggestion');
        break;
      }
      case 'codeofconduct': {
        add('codeofconduct', '📜 Code of Conduct', 'This project follows the [Contributor Covenant](https://www.contributor-covenant.org/) code of conduct.', 'ai-suggestion');
        break;
      }
      case 'license': {
        if (license) {
          add('license', '📄 License', `This project is licensed under the **${license}** license. See the [LICENSE](./LICENSE) file for details.`, 'verified');
        } else {
          add('license', '📄 License', '*Add your license information here.*', 'needs-confirmation');
          checks.push({ id: 'no-lic', severity: 'info', category: 'placeholder', message: 'No license detected.', suggestion: 'Consider adding a license.' });
        }
        break;
      }
    }
  }

  // TOC
  if (cfg.toc && sections.length > 4) {
    let toc = '## 📑 Table of Contents\n\n';
    for (const s of sections) {
      if (s.id === 'overview') continue;
      const anchor = s.title.replace(/[^\w\s-]/g, '').trim().toLowerCase().replace(/\s+/g, '-');
      toc += `- [${s.title.replace(/^[^\w]*/, '').trim()}](#${anchor})\n`;
    }
    // Insert after first section (overview)
    const firstNewline = md.indexOf('\n\n', md.indexOf('\n\n') + 1);
    if (firstNewline > 0) {
      md = md.slice(0, firstNewline + 2) + toc + '\n---\n\n' + md.slice(firstNewline + 2);
    }
  }

  // footer
  if (author) {
    md += `---\n\n<p align="center">Made with ❤️ by <a href="${authorUrl}">${author}</a></p>\n`;
  }

  // quality score
  const qualityScore = calcScore(sections, envVars, screenshots, eb, desc, license);

  return {
    markdown: md.trim(),
    template,
    sections,
    generatedAt: new Date().toISOString(),
    qualityScore,
    accuracyChecks: checks,
  } as GeneratedReadme & { qualityScore: QualityScore; accuracyChecks: AccuracyCheck[] };
}

// ---- quality score ----

function calcScore(
  sections: SectionReport[],
  envVars: EnvVariable[],
  screenshots: { caption: string; filename: string }[],
  badges: Badge[],
  desc: string,
  license: string,
): QualityScore {
  const items: QualityScoreItem[] = [];
  const has = (id: string) => sections.some(s => s.id === id && s.confidence !== 'needs-confirmation');

  items.push({ label: 'Project Description', score: desc ? (desc.length > 50 ? 15 : 10) : 0, maxScore: 15, reason: desc ? 'Provided' : 'Missing' });
  items.push({ label: 'Features', score: has('features') ? 15 : 0, maxScore: 15, reason: has('features') ? 'Documented' : 'Missing' });
  items.push({ label: 'Installation', score: has('installation') ? 15 : 0, maxScore: 15, reason: has('installation') ? 'Provided' : 'Missing' });
  items.push({ label: 'Tech Stack', score: has('techstack') ? 10 : 0, maxScore: 10, reason: has('techstack') ? 'Documented' : 'Missing' });
  items.push({ label: 'Environment Docs', score: envVars.length ? 10 : 0, maxScore: 10, reason: envVars.length ? 'Documented' : 'N/A' });
  items.push({ label: 'Usage', score: has('usage') ? 10 : 0, maxScore: 10, reason: has('usage') ? 'Provided' : 'Missing' });
  items.push({ label: 'Deployment', score: has('deployment') ? 5 : 0, maxScore: 5, reason: has('deployment') ? 'Provided' : 'N/A' });
  items.push({ label: 'Screenshots', score: screenshots.length ? 10 : 0, maxScore: 10, reason: screenshots.length ? `${screenshots.length} added` : 'None' });
  items.push({ label: 'Contributing', score: has('contributing') ? 5 : 0, maxScore: 5, reason: has('contributing') ? 'Included' : 'Missing' });
  items.push({ label: 'License & Badges', score: (license ? 3 : 0) + (badges.length ? 2 : 0), maxScore: 5, reason: [license ? 'License' : '', badges.length ? 'Badges' : ''].filter(Boolean).join(', ') || 'None' });

  return { total: items.reduce((s, i) => s + i.score, 0), maxTotal: items.reduce((s, i) => s + i.maxScore, 0), items };
}

// ---- badge generator ----

export function generateBadges(repoUrl: string, license: string | null, techs: DetectedTech[]): Badge[] {
  const badges: Badge[] = [];
  const m = repoUrl.match(/github\.com\/([^/]+)\/([^/\s#?]+)/);
  if (m) {
    const [, owner, rawRepo] = m;
    const repo = rawRepo.replace(/\.git$/, '');
    badges.push({ id: 'stars', label: 'Stars', url: `https://github.com/${owner}/${repo}/stargazers`, imageUrl: `https://img.shields.io/github/stars/${owner}/${repo}?style=for-the-badge`, enabled: true, category: 'repository', evidence: 'GitHub API' });
    badges.push({ id: 'forks', label: 'Forks', url: `https://github.com/${owner}/${repo}/network/members`, imageUrl: `https://img.shields.io/github/forks/${owner}/${repo}?style=for-the-badge`, enabled: true, category: 'repository', evidence: 'GitHub API' });
    badges.push({ id: 'issues', label: 'Issues', url: `https://github.com/${owner}/${repo}/issues`, imageUrl: `https://img.shields.io/github/issues/${owner}/${repo}?style=for-the-badge`, enabled: true, category: 'repository', evidence: 'GitHub API' });
    if (license) badges.push({ id: 'license', label: 'License', url: `https://github.com/${owner}/${repo}/blob/main/LICENSE`, imageUrl: `https://img.shields.io/github/license/${owner}/${repo}?style=for-the-badge`, enabled: true, category: 'license', evidence: 'GitHub API' });
    badges.push({ id: 'last-commit', label: 'Last Commit', url: `https://github.com/${owner}/${repo}/commits`, imageUrl: `https://img.shields.io/github/last-commit/${owner}/${repo}?style=for-the-badge`, enabled: false, category: 'repository', evidence: 'GitHub API' });
  }

  const colorMap: Record<string, string> = { react: '61DAFB', 'next.js': '000000', 'vue.js': '4FC08D', angular: 'DD0031', typescript: '3178C6', javascript: 'F7DF1E', python: '3776AB', docker: '2496ED', 'tailwind css': '06B6D4', postgresql: '4169E1', mongodb: '47A248' };
  for (const t of techs) {
    const c = colorMap[t.name.toLowerCase()];
    if (c) {
      const slug = t.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      badges.push({ id: `tech-${slug}`, label: t.name, url: '#', imageUrl: `https://img.shields.io/badge/${encodeURIComponent(t.name)}-${c}?style=for-the-badge&logo=${slug}&logoColor=white`, enabled: false, category: 'technology', evidence: t.evidence });
    }
  }

  return badges;
}
