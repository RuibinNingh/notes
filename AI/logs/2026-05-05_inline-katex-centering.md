# 2026-05-05 行内公式段落居中修复

## 变更概述

修复含有单个行内 KaTeX 元素的普通段落被误判为公式段落，从而整段文字居中的问题。

---

## 中风险修复

### 1. 移除行内 KaTeX 段落居中规则

**文件：** `quartz/styles/custom.scss`

- 删除 `article p:has(> .katex:only-child)` 相关规则。
- 避免 `:only-child` 忽略文本节点后，将“文字 + 一个行内公式”的段落误判为单公式段落。
- 保留 `.katex-display` 的块级公式居中样式，确保真正的公式块视觉不变。

---

## 修改文件清单

| 文件 | 改动 |
|---|---|
| `quartz/styles/custom.scss` | 移除误伤行内公式段落的居中样式 |
| `AI/logs/log.md` | 新增本次索引并更新统计 |
| `AI/logs/2026-05-05_inline-katex-centering.md` | 本文件 |

---

## 测试记录

- `npm exec quartz -- build` 通过。
- `npm exec prettier -- quartz/styles/custom.scss --write` 完成格式化。
- 检查生成后的 `public/数学/几何/定弦定角+位似轨迹最值.html`，截图相关内容仍为普通 `<p>` 段落，已不再受行内公式居中规则影响。
