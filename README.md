# Atelier für Innovationen

A modern documentation platform built with Next.js 15, FumaDocs, and TypeScript. This project serves as a digital workspace for innovation methodologies and knowledge sharing, featuring static site generation with MDX content and comprehensive image optimization.

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18+)
- **pnpm** (recommended)

```bash
# Verify installations
node --version  # Should be v18.x.x or higher
pnpm --version  # Should be installed
```

### Installation

```bash
# Clone and setup
git clone <repository-url>
cd atelier-fuer-innovationen
pnpm install

# Start development
pnpm dev
# Open http://localhost:3000
```

## 📁 Project Structure

```
atelier-fuer-innovationen/
├── src/                          # Source code
│   ├── app/                      # Next.js App Router
│   │   ├── (home)/              # Home page route group
│   │   ├── _components/         # App-level components
│   │   ├── api/                 # API routes
│   │   ├── docs/                # Documentation routes
│   │   ├── layout.tsx           # Root layout
│   │   └── layout.config.tsx    # FumaDocs layout config
│   ├── components/              # Reusable components
│   │   ├── ui/                  # Base UI (Shadcn UI)
│   │   ├── accordion.tsx        # Custom accordion
│   │   ├── banner.tsx           # Banner component
│   │   ├── callout.tsx          # Callout/alert
│   │   ├── card.tsx             # Card component
│   │   ├── illus.tsx            # Illustration handler
│   │   ├── image-zoom.tsx       # Image zoom functionality
│   │   ├── inline-toc.tsx       # Inline table of contents
│   │   ├── overview-cards.tsx   # Overview cards
│   │   ├── slides.tsx           # Slides/presentation
│   │   ├── steps.tsx            # Step-by-step guide
│   │   └── tabs.tsx             # Custom tabs
│   ├── content/                 # MDX documentation
│   │   └── docs/                # Main documentation
│   ├── data/                    # JSON data files
│   │   ├── illus.json           # Illustration metadata
│   │   └── slides.json          # Slides data
│   └── lib/                     # Utilities
│       ├── cn.ts                # Class name utility
│       ├── source.ts            # FumaDocs source config
│       ├── styles/              # Global styles & fonts
│       └── use-copy-button.ts   # Copy functionality hook
├── public/                      # Static assets
│   ├── illus/                   # Illustrations
│   ├── images/                  # General images
│   └── slides/                  # Presentation materials
├── .github/workflows/           # CI/CD
├── .source/                     # FumaDocs generated files
├── out/                         # Build output (static files)
└── Configuration files
    ├── next.config.mjs          # Next.js config
    ├── export-images.config.js  # Image optimization
    ├── source.config.ts         # FumaDocs config
    ├── tsconfig.json           # TypeScript config
    ├── postcss.config.mjs      # PostCSS config
    └── package.json            # Dependencies & scripts
```

## ⚙️ Configuration

### Next.js Configuration (`next.config.mjs`)

```javascript
import { createMDX } from 'fumadocs-mdx/next'
import withExportImages from 'next-export-optimize-images'

const withMDX = createMDX()

const config = {
  output: 'export',                    // Static export
  reactStrictMode: true,              // Development strict mode
  images: {
    imageSizes: [640, 960, 1280, 1600, 1920],
    deviceSizes: [640, 960, 1280, 1600, 1920],
  },
}

export default withExportImages(withMDX(config))
```

### Image Optimization (`export-images.config.js`)

```javascript
const config = {
  imageDir: '_optimized',             // Optimized images output
  cacheDir: 'out/.cache',             // Processing cache
  quality: 75,                        // JPEG/WebP quality
  convertFormat: [
    ['png', 'webp'],                  // PNG → WebP
    ['jpg', 'webp'],                  // JPG → WebP
  ],
  generateFormats: ['webp'],          // Generate WebP versions
  filenameGenerator: ({ path, name, extension, width }) =>
    `${path.replace(/^\//, '').replace(/\//g, '-')}-${name}.${width}.${extension}`,
}
```

### TypeScript Path Mapping (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/app/*": ["./src/app/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/components/*": ["./src/components/*"],
      "@/data/*": ["./src/data/*"],
      "@/public/*": ["./public/*"],
      "@/.source": ["./.source/index.ts"]
    }
  }
}
```

## 🛠️ Available Scripts

| Command | Description | Output |
|---------|-------------|---------|
| `pnpm dev` | Development server | `http://localhost:3000` |
| `pnpm build` | Production build | `out/` directory |
| `pnpm start` | Serve production build | Local static server |
| `pnpm nuke` | Clean dependencies | Removes node_modules |
| `pnpm postinstall` | Process MDX files | Auto-runs after install |

### Build Process Details

```bash
pnpm build
# 1. next build - Compiles Next.js app to static files
# 2. next-export-optimize-images - Optimizes all images
#    - Converts PNG/JPG to WebP
#    - Creates responsive sizes (640, 960, 1280, 1600, 1920px)
#    - Updates image references in HTML
# Output: Static files in out/ directory
```

## 🏗️ Architecture

### Static Site Generation

- **Framework**: Next.js 15 with App Router
- **Export**: Static HTML/CSS/JS files
- **Content**: MDX with React components
- **Styling**: Tailwind CSS 4 with custom components

### Component Architecture

```
Components/
├── ui/                    # Base components (Shadcn UI)
│   ├── button.tsx        # Button with variants
│   ├── collapsible.tsx   # Collapsible content
│   └── tabs.tsx          # Tab navigation
├── Custom Components      # Project-specific components
│   ├── accordion.tsx     # Expandable sections
│   ├── banner.tsx        # Promotional banners
│   ├── callout.tsx       # Highlighted content
│   ├── card.tsx          # Content containers
│   ├── illus.tsx         # Illustration display
│   ├── image-zoom.tsx    # Interactive zoom
│   ├── inline-toc.tsx    # Table of contents
│   ├── overview-cards.tsx # Grid layouts
│   ├── slides.tsx        # Presentations
│   ├── steps.tsx         # Step-by-step guides
│   └── tabs.tsx          # Custom tabbed content
```

### Content Structure

```
content/docs/
├── index.mdx             # Documentation homepage
├── meta.json             # Navigation & metadata
├── atelier/              # Innovation workspace
├── xeniapolis/           # Knowledge city concept
├── components.mdx        # Component documentation
└── impressum.mdx         # Legal information
```

## 🚀 Deployment

### GitHub Actions Workflow

```yaml
name: Deploy Website
on: [push: main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm build
      - run: aws s3 sync ./out/ s3://${{ vars.AWS_S3_BUCKET_NAME }}
      - run: aws cloudfront create-invalidation --distribution-id ${{ secrets.AWS_CF_DISTRIBUTION_ID }}
```

### Deployment Architecture

```
GitHub Repository
       ↓
GitHub Actions (CI/CD)
       ↓
Build Process (Next.js + Image Optimization)
       ↓
Static Files (out/ directory)
       ↓
AWS S3 Bucket
       ↓
CloudFront CDN
       ↓
Global Users
```

## 🎨 Styling & UI

### Tailwind CSS 4 Configuration

- **Framework**: Tailwind CSS 4 with PostCSS
- **Custom Components**: Built with Radix UI primitives
- **Icons**: Lucide React icon library
- **Typography**: Custom Inter font family
- **Utilities**: Class Variance Authority for component variants

### Image Optimization Strategy

- **Format**: Automatic WebP conversion
- **Sizes**: 640, 960, 1280, 1600, 1920px
- **Quality**: 75% for optimal compression
- **Caching**: Intelligent cache system
- **Lazy Loading**: Built-in performance optimization

## 🔧 Development Tools

### Code Quality

- **TypeScript**: Full type safety
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Editor Config**: Consistent coding style

### VS Code Configuration

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## 📦 Key Dependencies

### Core Framework

- **Next.js 15**: React framework with App Router
- **React 19**: Latest React with concurrent features
- **TypeScript 5**: Type-safe development

### Documentation

- **FumaDocs**: MDX documentation framework
- **FumaDocs UI**: Pre-built documentation components

### Styling & UI

- **Tailwind CSS 4**: Utility-first CSS
- **Radix UI**: Accessible UI primitives
- **Lucide React**: Icon library
- **Class Variance Authority**: Component variants

### Image Processing

- **next-export-optimize-images**: Static export optimization
- **Sharp**: High-performance image processing

### Development

- **ESLint**: Code quality
- **Prettier**: Code formatting
- **PostCSS**: CSS processing

## 🐛 Troubleshooting

```bash
# Dependency issues
pnpm nuke && pnpm install

# Cache problems
pnpm store prune

# Update dependencies
pnpm update

# Check outdated packages
pnpm outdated
```

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [FumaDocs Documentation](https://fumadocs.vercel.app)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com)

---

This project is configured for high-performance static site generation with comprehensive image optimization and modern development tooling.
