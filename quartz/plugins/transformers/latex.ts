import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import rehypeMathjax from "rehype-mathjax/svg"
//@ts-ignore
import rehypeTypst from "@myriaddreamin/rehype-typst"
import { QuartzTransformerPlugin } from "../types"
import { Root, Paragraph, PhrasingContent, Content, Parent } from "mdast"
import { KatexOptions } from "katex"
import { Options as MathjaxOptions } from "rehype-mathjax/svg"
import { VFile } from "vfile"
import { visit } from "unist-util-visit"
import { BuildVisitor } from "unist-util-visit"
//@ts-ignore
import { Options as TypstOptions } from "@myriaddreamin/rehype-typst"

interface Options {
  renderEngine: "katex" | "mathjax" | "typst"
  customMacros: MacroType
  katexOptions: Omit<KatexOptions, "macros" | "output">
  mathJaxOptions: Omit<MathjaxOptions, "macros">
  typstOptions: TypstOptions
}

// mathjax macros
export type Args = boolean | number | string | null
interface MacroType {
  [key: string]: string | Args[]
}

type InlineMathNode = PhrasingContent & {
  type: "inlineMath"
  value: string
}

type MathNode = Content & {
  type: "math"
  value: string
  meta: null
  data: {
    hName: "pre"
    hChildren: [
      {
        type: "element"
        tagName: "code"
        properties: { className: ["language-math", "math-display"] }
        children: [{ type: "text"; value: string }]
      },
    ]
  }
}

function isInlineMathNode(node: PhrasingContent): node is InlineMathNode {
  return node.type === "inlineMath"
}

function isLineEndingDoubleDollarDisplay(node: InlineMathNode, file: VFile): boolean {
  const position = node.position
  if (!position || position.start.line !== position.end.line) {
    return false
  }

  const lines = file.value.toString().split(/\r?\n/)
  const line = lines[position.start.line - 1]
  if (!line) {
    return false
  }

  const source = line.slice(position.start.column - 1, position.end.column - 1)
  const trailing = line.slice(position.end.column - 1)

  return source.startsWith("$$") && source.endsWith("$$") && trailing.trim().length === 0
}

function makeDisplayMathNode(node: InlineMathNode): MathNode {
  return {
    type: "math",
    value: node.value,
    meta: null,
    data: {
      hName: "pre",
      hChildren: [
        {
          type: "element",
          tagName: "code",
          properties: { className: ["language-math", "math-display"] },
          children: [{ type: "text", value: node.value }],
        },
      ],
    },
    position: node.position,
  }
}

function trimTrailingSoftBreak(children: PhrasingContent[]) {
  const last = children.at(-1)
  if (last?.type !== "text" || !last.value.includes("\n")) {
    return
  }

  const nextValue = last.value.replace(/[ \t]*\r?\n[ \t]*$/, "")
  if (nextValue.length === 0) {
    children.pop()
  } else {
    last.value = nextValue
  }
}

function trimLeadingSoftBreak(children: PhrasingContent[]) {
  const first = children[0]
  if (first?.type !== "text" || !first.value.includes("\n")) {
    return
  }

  const nextValue = first.value.replace(/^[ \t]*\r?\n[ \t]*/, "")
  if (nextValue.length === 0) {
    children.shift()
  } else {
    first.value = nextValue
  }
}

function paragraph(children: PhrasingContent[], source: Paragraph): Paragraph | null {
  if (children.length === 0) {
    return null
  }

  return {
    type: "paragraph",
    children,
    position: source.position,
  }
}

function normalizeSingleLineDisplayMath() {
  return (tree: Root, file: VFile) => {
    visit(tree, "paragraph", ((node: Paragraph, index: number, parent: Parent | null) => {
      if (index === undefined || !parent || !node.children.some(isInlineMathNode)) {
        return
      }

      const replacement: Content[] = []
      let currentParagraph: PhrasingContent[] = []
      let changed = false

      for (const child of node.children) {
        if (isInlineMathNode(child) && isLineEndingDoubleDollarDisplay(child, file)) {
          trimTrailingSoftBreak(currentParagraph)
          const previousParagraph = paragraph(currentParagraph, node)
          if (previousParagraph) {
            replacement.push(previousParagraph)
          }

          replacement.push(makeDisplayMathNode(child))
          currentParagraph = []
          changed = true
          continue
        }

        currentParagraph.push(child)
        if (changed) {
          trimLeadingSoftBreak(currentParagraph)
        }
      }

      const finalParagraph = paragraph(currentParagraph, node)
      if (finalParagraph) {
        replacement.push(finalParagraph)
      }

      if (changed) {
        parent.children.splice(index, 1, ...replacement)
      }
    }) as BuildVisitor<Root, "paragraph">)
  }
}

/**
 * Normalize display-math `$$` delimiters that are glued to adjacent content.
 *
 * remark-math's math-flow tokenizer only treats `$$` as a display fence when
 * it sits alone on its own line. When `$$` is glued to content — e.g. an
 * opening `$$\begin{cases}` or a closing `\end{cases}$$` — the opening `$$`
 * consumes the glued text as "fence meta" (discarding it) and the closing
 * `$$` is never recognized, so the block swallows every following line up to
 * EOF (headings and paragraphs included) and surfaces as a red KaTeX
 * ParseError.
 *
 * This runs before parsing and rewrites such blocks so both delimiters land on
 * their own lines: `$$\begin{cases}…\end{cases}$$` becomes a clean fenced
 * block. Fenced code blocks and inline code are skipped so literal `$$`
 * inside code is left untouched. Already-well-formed blocks are unchanged
 * (the transform is idempotent).
 */
function normalizeDisplayMathDelimiters(src: string): string {
  if (!src.includes("$$")) {
    return src
  }

  // Split out fenced code blocks (``` / ~~~) and inline code so literal `$$`
  // inside them is never rewritten. The capturing group keeps the code spans
  // in the result array; even indices are prose, odd indices are code.
  const segments = src.split(/(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`)/)
  for (let i = 0; i < segments.length; i += 2) {
    segments[i] = segments[i].replace(
      /(^|\n)([ \t]*)\$\$([\s\S]*?)\$\$(?=[ \t]*(?:\n|$))/g,
      (_match: string, lead: string, indent: string, body: string) => {
        const content = body.replace(/^\n+/, "").replace(/\n+$/, "")
        return `${lead}${indent}$$\n${content}\n$$`
      },
    )
  }
  return segments.join("")
}

export const Latex: QuartzTransformerPlugin<Partial<Options>> = (opts) => {
  const engine = opts?.renderEngine ?? "katex"
  const macros = opts?.customMacros ?? {}
  return {
    name: "Latex",
    textTransform(_ctx, src) {
      return normalizeDisplayMathDelimiters(src)
    },
    markdownPlugins() {
      return [remarkMath, normalizeSingleLineDisplayMath]
    },
    htmlPlugins() {
      switch (engine) {
        case "katex": {
          return [[rehypeKatex, { output: "html", macros, ...(opts?.katexOptions ?? {}) }]]
        }
        case "typst": {
          return [[rehypeTypst, opts?.typstOptions ?? {}]]
        }
        default:
        case "mathjax": {
          return [
            [
              rehypeMathjax,
              {
                ...(opts?.mathJaxOptions ?? {}),
                tex: {
                  ...(opts?.mathJaxOptions?.tex ?? {}),
                  macros,
                },
              },
            ],
          ]
        }
      }
    },
    externalResources() {
      switch (engine) {
        case "katex":
          return {
            css: [{ content: "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" }],
            js: [
              {
                // fix copy behaviour: https://github.com/KaTeX/KaTeX/blob/main/contrib/copy-tex/README.md
                src: "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/copy-tex.min.js",
                loadTime: "afterDOMReady",
                contentType: "external",
              },
            ],
          }
      }
    },
  }
}
