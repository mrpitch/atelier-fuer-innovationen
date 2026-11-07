# Third-party notices

This repository contains material from third parties. Each item below lists its
source, its license and where it appears here. This file does not grant any
license to the project's own code or content.

## Agent skills from mattpocock/skills (MIT)

Files under `.agents/skills/` partly come from
[mattpocock/skills](https://github.com/mattpocock/skills), compared against
upstream commit `4ae2317ddb22b046e26455e4f9c9b3aaaf62212d` on 2026-11-07.

| Skill                           | Upstream path   | State in this repository                                                        |
| ------------------------------- | --------------- | ------------------------------------------------------------------------------- |
| `git-guardrails-claude-code`    | `misc/`         | Same as upstream                                                                |
| `migrate-to-shoehorn`           | `misc/`         | Same as upstream                                                                |
| `scaffold-exercises`            | `misc/`         | Same as upstream                                                                |
| `setup-pre-commit`              | `misc/`         | Same as upstream                                                                |
| `loop-me`                       | `in-progress/`  | Same as upstream                                                                |
| `setup-ts-deep-modules`         | `in-progress/`  | Same as upstream                                                                |
| `writing-beats`                 | `in-progress/`  | Same as upstream                                                                |
| `writing-fragments`             | `in-progress/`  | Same as upstream                                                                |
| `writing-shape`                 | `in-progress/`  | Same as upstream                                                                |
| `claude-handoff`                | `in-progress/`  | Differs from upstream (earlier version or local edit)                           |
| `implement-spec`                | `engineering/`  | Differs from upstream (earlier version or local edit)                           |
| `retro`                         | `engineering/`  | Differs from upstream (earlier version or local edit)                           |
| `implement`                     | `engineering/`  | Differs from upstream (earlier version or local edit)                           |
| `tdd`                           | `engineering/`  | Modified: reads `docs/agents/domain.md` instead of `CONTEXT.md` and `docs/adr/` |
| `triage`                        | `engineering/`  | Modified, same change                                                           |
| `diagnosing-bugs`               | `engineering/`  | Modified, same change                                                           |
| `codebase-design`               | `engineering/`  | Modified, same change                                                           |
| `improve-codebase-architecture` | `engineering/`  | Modified, same change                                                           |
| `wait-what`                     | `productivity/` | Modified, same change                                                           |
| `domain-modeling`               | `engineering/`  | Fork, substantially changed                                                     |
| `grill-with-docs`               | `engineering/`  | Fork, changed                                                                   |
| `to-spec`                       | `engineering/`  | Fork, changed                                                                   |

`skills-lock.json` lists only `tdd`, `triage`, `implement`, `diagnosing-bugs`,
`codebase-design`, `improve-codebase-architecture` and `wait-what` as coming
from `mattpocock/skills`. The other skills above are tracked by this file alone.

```
MIT License

Copyright (c) 2026 Matt Pocock

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## arc42 template (CC BY-SA 4.0)

The architecture templates and section reference of the `docs` skill
(`.agents/skills/docs/templates/architecture/`,
`.agents/skills/docs/references/architecture/arc42-sections.md`) adapt the
[arc42](https://arc42.org) template, © Dr. Gernot Starke and Dr. Peter
Hruschka, licensed under
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Changes: the templates are Markdown skeletons with frontmatter, comment prompts, Q42 tags and lint rules added; the section reference is a condensed summary. The licensors do not endorse this repository. These adaptations are
shared under the same license.

`docs/architecture/` follows the arc42 section structure. The architecture
content itself is this project's own.

## Q42 quality model (CC BY-SA 4.0)

`.agents/skills/docs/references/architecture/q42-quality-model.md` summarizes the
[arc42 Quality Model (Q42)](https://quality.arc42.org), created by Gernot
Starke, licensed under CC BY-SA 4.0. The file is a condensed summary, shared under the same license.

## Diátaxis (CC BY-SA 4.0)

`.agents/skills/docs/references/framework.md` summarizes the
[Diátaxis](https://diataxis.fr) framework, © Daniele Procida, licensed under
CC BY-SA 4.0. The file is a condensed summary, shared under the same license. The `docs/` folder layout follows the framework.

## Open Knowledge Format (Apache-2.0)

Markdown files use the frontmatter of the
[Open Knowledge Format v0.2](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md),
published by Google Cloud Platform under the Apache License 2.0.

## Xeniapolis content

The pages under `src/content/docs/xeniapolis/`, the illustrations and slides
under `public/illus/` and `public/slides/`, and the originals under
`public/illus/_source/` migrate the 1996 site xeniapolis.de. No license is
granted for this content by this repository. Rights remain with the original
rightsholders. The original notice reads:

> Copyright für das Leitbild "Städte des Wissens als Stätten der Begegnung"
> initiert von Dr. Helmut Volkmann in der Zentralabteilung Forschung und
> Entwicklung in der Siemens AG. Die Internet-Präsentation steht im Dienste der
> Verbreitung des Leitbildes. Vervielfätigung und Weiterverbreitung zu
> kommerziellen Zwecken sind ausgeschlossen.

Vector illustrations in `public/illus/` and `public/slides/` are adaptations of
the original artwork.
