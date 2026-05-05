# 2026-05-05 单行公式块换行修复

## 变更概述

修复 Quartz 中行尾单行 `$$公式$$` 被解析为段落内行内公式，导致公式贴着上一行并居中的问题。

---

## 中风险修复

### 1. 行尾单行 display math 规整

**文件：** `quartz/plugins/transformers/latex.ts`

- 在 `remark-math` 后增加 AST 规整插件，识别源码中位于行尾的 `$$...$$`。
- 将这类 `inlineMath` 从所在段落中拆出，转换为块级 `math` 节点。
- 保留真正写在正文中的行内 `$$...$$` 行为，避免影响普通段落内公式。

### 2. 段落软换行清理

**文件：** `quartz/plugins/transformers/latex.ts`

- 拆分段落时移除公式块前后的软换行文本。
- 确保公式块前后的文字分别保持为正常段落，避免 HTML 中继续粘连。

---

## 修改文件清单

| 文件 | 改动 |
|---|---|
| `quartz/plugins/transformers/latex.ts` | 增加行尾单行 `$$...$$` 转块级公式的 Markdown AST 处理 |
| `AI/logs/log.md` | 重建总索引并新增本次记录 |
| `AI/logs/2026-05-05_single-line-display-math.md` | 本文件 |

---

## 测试记录

- `npm exec tsc -- --noEmit` 通过。
- `npm exec quartz -- build` 通过。
- 检查生成后的 `public/数学/几何/定弦定角+位似轨迹最值.html`，`所以$$...$$` 已拆分为 `<p>所以</p>` 与 `.katex-display`。
