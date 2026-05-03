# 2026-05-03 claude style fonts

## 变更概述

把 Quartz 的字体加载从 `custom.scss` 内联 `@import` 改为配置层的 `fontOrigin: "googleFonts"`，并保留正文衬线、标题无衬线、代码等宽的排版方案，目标是实现 Claude 页面风格。

---

## 配置与样式调整

### 1. Quartz 字体配置

**文件：** `quartz.config.ts`

- 使用 `fontOrigin: "googleFonts"` 交给 Quartz 自动生成字体链接。
- 保持 `cdnCaching: true`。
- 字体映射改为：
  - `header: "Inter"`
  - `body: "Source Serif 4"`
  - `code: "JetBrains Mono"`
- 这次记录同时包含用户手动修改的配置内容。

### 2. 自定义样式表

**文件：** `quartz/styles/custom.scss`

- 删除 `@import url(...)`，避免 Sass 合并位置导致语法错误。
- 保留 `:root` 字体变量与全局排版规则。
- 维持 Claude 风格的视觉策略：
  - UI、导航、标题使用无衬线
  - 正文使用衬线
  - 代码使用等宽字体

---

## 修改文件清单

| 文件 | 改动 |
|---|---|
| `quartz.config.ts` | 字体改为 Google Fonts 方案，目标是 Claude 风格排版 |
| `quartz/styles/custom.scss` | 移除 `@import`，保留样式规则 |
| `AI/logs/2026-05-03-claude-style-fonts.md` | 新增单日记录 |
| `AI/logs/log.md` | 新增索引 |

---

## 测试记录

- `npm exec quartz -- build` 通过。
