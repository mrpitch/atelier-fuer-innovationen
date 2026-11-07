---
name: icon-dependency-audit
description: Audit the repo for icon dependencies that bypass the src/components/ui/icons.tsx registry — direct lucide-react imports outside that file, and any other icon package (Radix Icons, Heroicons, Font Awesome, react-icons, an icon font, etc.) that's crept into package.json without going through the registry. Use periodically, before a release, or when asked to audit icons/icon dependencies. Not meant to run on every commit — the no-restricted-imports ESLint rule already catches direct lucide-react imports at build time; this is the backstop for what that rule can't cover.
---

# Icon dependency audit

Two checks, run in order. Report findings for both before proposing any fix — don't stop at the first hit.

## 1. Direct lucide-react imports outside the registry

```bash
grep -rln "from 'lucide-react'\|from \"lucide-react\"" src/ | grep -v "src/components/ui/icons.tsx"
```

**Completion criterion**: command run, and every matching file:line reported (or "none found").

This duplicates what the `no-restricted-imports` ESLint rule (`eslint.config.mjs`) already enforces at build time — a hit here means either the rule was weakened/removed, or the file predates it and was never linted (e.g. an `ignores` entry). Report which case it is; don't just re-fix the import and move on.

## 2. Other icon packages in the dependency tree

Registered icons all come from `lucide-react` via the registry. A second icon package is drift — someone reached for a component's native icon prop or a copy-pasted snippet instead of registering through `src/components/ui/icons.tsx`.

```bash
grep -E '"(lucide-react|@radix-ui/react-icons|@heroicons/react|react-icons|@fortawesome/[a-z-]+|@tabler/icons(-react)?|@phosphor-icons/react|iconify|@iconify/react|feather-icons|react-feather)"' package.json
```

**Completion criterion**: every matched line reported with its version. `lucide-react` itself is expected (the registry depends on it) — flag any other match as a finding, not just note its presence.

A hit that isn't `lucide-react` needs its call sites found (`grep -rn "from '<package>'" src/`) before reporting, so the finding names where it's used, not just that it's installed.

## Report

For each check: clean, or a list of `file:line` (check 1) / `package@version` + call sites (check 2). No findings in either check → say so in one line, nothing further to do. Findings → propose the fix (swap the import for `<Icon iconName="..." />`, registering a missing entry per `docs/reference/components/icon-registry.md` if needed; or remove the stray package and its usages) and apply only after the user confirms.
