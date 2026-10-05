// ============================================================
// Technology Detection Engine
// ============================================================

import type { RepoInfo, FileTreeItem, DetectedTech, TechCategory } from './types';

interface TechRule {
  name: string;
  category: TechCategory;
  detect: (ctx: DetectionContext) => boolean;
  source: (ctx: DetectionContext) => string;
}

interface DetectionContext {
  repo: RepoInfo;
  files: FileTreeItem[];
  configFiles: string[];
  fileContents: Record<string, string>;
  npmDeps: string[];
  npmDevDeps: string[];
}

const techRules: TechRule[] = [
  // ---- Languages ----
  { name: 'TypeScript', category: 'language', detect: ctx => ctx.files.some(f => f.path.endsWith('.ts') || f.path.endsWith('.tsx')) || ctx.npmDevDeps.includes('typescript'), source: ctx => ctx.npmDevDeps.includes('typescript') ? 'package.json' : '.ts files' },
  { name: 'JavaScript', category: 'language', detect: ctx => ctx.files.some(f => f.path.endsWith('.js') || f.path.endsWith('.jsx')) && !ctx.npmDevDeps.includes('typescript'), source: () => '.js files' },
  { name: 'Python', category: 'language', detect: ctx => ctx.files.some(f => f.path.endsWith('.py')) || ctx.configFiles.includes('requirements.txt') || ctx.configFiles.includes('pyproject.toml'), source: ctx => ctx.configFiles.includes('requirements.txt') ? 'requirements.txt' : '.py files' },
  { name: 'Java', category: 'language', detect: ctx => ctx.files.some(f => f.path.endsWith('.java')) || ctx.configFiles.includes('pom.xml') || ctx.configFiles.includes('build.gradle'), source: () => '.java files' },
  { name: 'Go', category: 'language', detect: ctx => ctx.files.some(f => f.path.endsWith('.go')) || ctx.configFiles.includes('go.mod'), source: () => 'go.mod' },
  { name: 'Rust', category: 'language', detect: ctx => ctx.files.some(f => f.path.endsWith('.rs')) || ctx.configFiles.includes('Cargo.toml'), source: () => 'Cargo.toml' },
  { name: 'Ruby', category: 'language', detect: ctx => ctx.files.some(f => f.path.endsWith('.rb')) || ctx.configFiles.includes('Gemfile'), source: () => 'Gemfile' },
  { name: 'PHP', category: 'language', detect: ctx => ctx.files.some(f => f.path.endsWith('.php')) || ctx.configFiles.includes('composer.json'), source: () => 'composer.json' },
  { name: 'C++', category: 'language', detect: ctx => ctx.files.some(f => f.path.endsWith('.cpp') || f.path.endsWith('.cc') || f.path.endsWith('.cxx')), source: () => '.cpp files' },
  { name: 'C#', category: 'language', detect: ctx => ctx.files.some(f => f.path.endsWith('.cs') || f.path.endsWith('.csproj')), source: () => '.cs files' },
  { name: 'Swift', category: 'language', detect: ctx => ctx.files.some(f => f.path.endsWith('.swift')), source: () => '.swift files' },
  { name: 'Kotlin', category: 'language', detect: ctx => ctx.files.some(f => f.path.endsWith('.kt') || f.path.endsWith('.kts')), source: () => '.kt files' },
  { name: 'Dart', category: 'language', detect: ctx => ctx.files.some(f => f.path.endsWith('.dart')), source: () => '.dart files' },

  // ---- Frontend Frameworks ----
  { name: 'React', category: 'frontend', detect: ctx => ctx.npmDeps.includes('react') || ctx.npmDevDeps.includes('react'), source: () => 'package.json' },
  { name: 'Next.js', category: 'frontend', detect: ctx => ctx.npmDeps.includes('next'), source: () => 'package.json' },
  { name: 'Vue.js', category: 'frontend', detect: ctx => ctx.npmDeps.includes('vue'), source: () => 'package.json' },
  { name: 'Nuxt.js', category: 'frontend', detect: ctx => ctx.npmDeps.includes('nuxt') || ctx.configFiles.includes('nuxt.config.ts'), source: () => 'package.json' },
  { name: 'Angular', category: 'frontend', detect: ctx => ctx.npmDeps.includes('@angular/core') || ctx.configFiles.includes('angular.json'), source: () => 'package.json' },
  { name: 'Svelte', category: 'frontend', detect: ctx => ctx.npmDeps.includes('svelte') || ctx.npmDevDeps.includes('svelte'), source: () => 'package.json' },
  { name: 'SvelteKit', category: 'frontend', detect: ctx => ctx.npmDeps.includes('@sveltejs/kit'), source: () => 'package.json' },
  { name: 'Astro', category: 'frontend', detect: ctx => ctx.npmDeps.includes('astro'), source: () => 'package.json' },
  { name: 'Flutter', category: 'frontend', detect: ctx => ctx.files.some(f => f.path === 'pubspec.yaml'), source: () => 'pubspec.yaml' },
  { name: 'Remix', category: 'frontend', detect: ctx => ctx.npmDeps.includes('@remix-run/react'), source: () => 'package.json' },

  // ---- Backend ----
  { name: 'Express', category: 'backend', detect: ctx => ctx.npmDeps.includes('express'), source: () => 'package.json' },
  { name: 'Fastify', category: 'backend', detect: ctx => ctx.npmDeps.includes('fastify'), source: () => 'package.json' },
  { name: 'NestJS', category: 'backend', detect: ctx => ctx.npmDeps.includes('@nestjs/core'), source: () => 'package.json' },
  { name: 'Django', category: 'backend', detect: ctx => (ctx.fileContents['requirements.txt'] || '').includes('django') || (ctx.fileContents['pyproject.toml'] || '').includes('django'), source: () => 'requirements.txt' },
  { name: 'Flask', category: 'backend', detect: ctx => (ctx.fileContents['requirements.txt'] || '').includes('flask') || (ctx.fileContents['pyproject.toml'] || '').includes('flask'), source: () => 'requirements.txt' },
  { name: 'FastAPI', category: 'backend', detect: ctx => (ctx.fileContents['requirements.txt'] || '').includes('fastapi') || (ctx.fileContents['pyproject.toml'] || '').includes('fastapi'), source: () => 'requirements.txt' },
  { name: 'Spring Boot', category: 'backend', detect: ctx => ctx.configFiles.includes('pom.xml') && ctx.files.some(f => f.path.includes('spring')), source: () => 'pom.xml' },
  { name: 'Ruby on Rails', category: 'backend', detect: ctx => ctx.files.some(f => f.path.includes('config/routes.rb')), source: () => 'config/routes.rb' },
  { name: 'Laravel', category: 'backend', detect: ctx => (ctx.fileContents['composer.json'] || '').includes('laravel'), source: () => 'composer.json' },
  { name: 'Gin', category: 'backend', detect: ctx => (ctx.fileContents['go.mod'] || '').includes('gin-gonic'), source: () => 'go.mod' },
  { name: 'Fiber', category: 'backend', detect: ctx => (ctx.fileContents['go.mod'] || '').includes('gofiber'), source: () => 'go.mod' },
  { name: 'Actix', category: 'backend', detect: ctx => (ctx.fileContents['Cargo.toml'] || '').includes('actix'), source: () => 'Cargo.toml' },

  // ---- Databases ----
  { name: 'PostgreSQL', category: 'database', detect: ctx => ctx.npmDeps.includes('pg') || ctx.npmDeps.includes('postgres') || ctx.npmDeps.includes('@prisma/client') && (ctx.fileContents['package.json'] || '').includes('postgres'), source: () => 'package.json' },
  { name: 'MongoDB', category: 'database', detect: ctx => ctx.npmDeps.includes('mongodb') || ctx.npmDeps.includes('mongoose'), source: () => 'package.json' },
  { name: 'MySQL', category: 'database', detect: ctx => ctx.npmDeps.includes('mysql') || ctx.npmDeps.includes('mysql2'), source: () => 'package.json' },
  { name: 'SQLite', category: 'database', detect: ctx => ctx.npmDeps.includes('better-sqlite3') || ctx.npmDeps.includes('sqlite3'), source: () => 'package.json' },
  { name: 'Redis', category: 'database', detect: ctx => ctx.npmDeps.includes('redis') || ctx.npmDeps.includes('ioredis'), source: () => 'package.json' },
  { name: 'Firebase', category: 'database', detect: ctx => ctx.npmDeps.includes('firebase') || ctx.npmDeps.includes('firebase-admin'), source: () => 'package.json' },
  { name: 'Supabase', category: 'database', detect: ctx => ctx.npmDeps.includes('@supabase/supabase-js'), source: () => 'package.json' },
  { name: 'Prisma', category: 'database', detect: ctx => ctx.npmDeps.includes('@prisma/client') || ctx.npmDevDeps.includes('prisma'), source: () => 'package.json' },
  { name: 'Drizzle ORM', category: 'database', detect: ctx => ctx.npmDeps.includes('drizzle-orm'), source: () => 'package.json' },

  // ---- Styling ----
  { name: 'Tailwind CSS', category: 'styling', detect: ctx => ctx.npmDevDeps.includes('tailwindcss') || ctx.npmDeps.includes('tailwindcss') || ctx.configFiles.includes('tailwind.config.js') || ctx.configFiles.includes('tailwind.config.ts'), source: () => 'package.json' },
  { name: 'Sass/SCSS', category: 'styling', detect: ctx => ctx.npmDevDeps.includes('sass') || ctx.files.some(f => f.path.endsWith('.scss') || f.path.endsWith('.sass')), source: () => 'package.json' },
  { name: 'Styled Components', category: 'styling', detect: ctx => ctx.npmDeps.includes('styled-components'), source: () => 'package.json' },
  { name: 'Material UI', category: 'styling', detect: ctx => ctx.npmDeps.includes('@mui/material'), source: () => 'package.json' },
  { name: 'Chakra UI', category: 'styling', detect: ctx => ctx.npmDeps.includes('@chakra-ui/react'), source: () => 'package.json' },
  { name: 'shadcn/ui', category: 'styling', detect: ctx => ctx.files.some(f => f.path.includes('components/ui/')) && ctx.npmDeps.includes('class-variance-authority'), source: () => 'project structure' },

  // ---- Infrastructure ----
  { name: 'Docker', category: 'infrastructure', detect: ctx => ctx.configFiles.includes('Dockerfile') || ctx.configFiles.includes('docker-compose.yml'), source: () => 'Dockerfile' },
  { name: 'Vercel', category: 'infrastructure', detect: ctx => ctx.configFiles.includes('vercel.json') || ctx.npmDeps.includes('next'), source: ctx => ctx.configFiles.includes('vercel.json') ? 'vercel.json' : 'Next.js project' },
  { name: 'GitHub Actions', category: 'infrastructure', detect: ctx => ctx.files.some(f => f.path.startsWith('.github/workflows/')), source: () => '.github/workflows' },
  { name: 'Netlify', category: 'infrastructure', detect: ctx => ctx.configFiles.includes('netlify.toml') || ctx.files.some(f => f.path === 'netlify.toml'), source: () => 'netlify.toml' },

  // ---- Testing ----
  { name: 'Jest', category: 'testing', detect: ctx => ctx.npmDevDeps.includes('jest') || ctx.npmDeps.includes('jest'), source: () => 'package.json' },
  { name: 'Vitest', category: 'testing', detect: ctx => ctx.npmDevDeps.includes('vitest'), source: () => 'package.json' },
  { name: 'Cypress', category: 'testing', detect: ctx => ctx.npmDevDeps.includes('cypress'), source: () => 'package.json' },
  { name: 'Playwright', category: 'testing', detect: ctx => ctx.npmDevDeps.includes('@playwright/test'), source: () => 'package.json' },
  { name: 'pytest', category: 'testing', detect: ctx => (ctx.fileContents['requirements.txt'] || '').includes('pytest'), source: () => 'requirements.txt' },

  // ---- Bundlers ----
  { name: 'Vite', category: 'bundler', detect: ctx => ctx.npmDevDeps.includes('vite') || ctx.configFiles.includes('vite.config.ts') || ctx.configFiles.includes('vite.config.js'), source: () => 'package.json' },
  { name: 'Webpack', category: 'bundler', detect: ctx => ctx.npmDevDeps.includes('webpack') || ctx.configFiles.includes('webpack.config.js'), source: () => 'package.json' },
  { name: 'Turbopack', category: 'bundler', detect: ctx => (ctx.fileContents['package.json'] || '').includes('turbo'), source: () => 'package.json' },
];

export function detectTechnologies(
  repo: RepoInfo,
  files: FileTreeItem[],
  configFiles: string[],
  fileContents: Record<string, string>,
  npmDeps: string[],
  npmDevDeps: string[]
): DetectedTech[] {
  const ctx: DetectionContext = { repo, files, configFiles, fileContents, npmDeps, npmDevDeps };
  const detected: DetectedTech[] = [];

  for (const rule of techRules) {
    try {
      if (rule.detect(ctx)) {
        detected.push({
          name: rule.name,
          category: rule.category,
          confidence: 'high',
          source: rule.source(ctx),
        });
      }
    } catch {
      // Skip rules that error
    }
  }

  // Add languages from GitHub API as medium confidence if not already detected
  for (const [lang] of Object.entries(repo.languages)) {
    if (!detected.some(t => t.name.toLowerCase() === lang.toLowerCase())) {
      detected.push({
        name: lang,
        category: 'language',
        confidence: 'medium',
        source: 'GitHub API',
      });
    }
  }

  return detected;
}
