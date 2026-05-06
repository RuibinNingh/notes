# 2026-05-06 unified serif fonts

## 变更概述

统一全站字体为 Source Serif 4 + Noto Serif SC（衬线），去掉 Inter 无衬线/JetBrains Mono 等宽字体分层，同时将字体改为离线加载，清理 custom.scss 中的冗余 `!important` 覆盖。

---

## 配置与样式调整

### 1. 统一字体配置

**文件：** `quartz.config.ts`

- `typography` 全部改为 `"Source Serif 4"`（header / body / code 统一）
- `cdnCaching` 从 `true` 改为 `false`，字体在构建时下载到 `static/fonts/`，页面不再依赖 Google Fonts CDN

### 2. 主题层字体变量

**文件：** `quartz/util/theme.ts`

- 新增 `DEFAULT_SERIF` 常量，包含 CJK 回退栈：Noto Serif SC → Songti SC → SimSun
- `joinStyles()` 中 `--titleFont`、`--headerFont`、`--bodyFont`、`--codeFont` 全部使用统一的衬线栈
- 删除不再需要的 `DEFAULT_SANS_SERIF` 和 `DEFAULT_MONO`

### 3. 精简自定义样式

**文件：** `quartz/styles/custom.scss`

- 删除 `--cl-sans`、`--cl-serif`、`--cl-mono` 三个自定义变量
- 删除所有 `font-family: ... !important` 声明（约 16 处），字体由主题层统一控制
- 删除针对 sans/mono 的分离规则（UI 元素、标题、代码块等）
- 保留：正文字号 1.05rem / 行高 1.7、标题 weight 600、blockquote 样式、KaTeX 显示修复
- 文件从 ~120 行缩减到 ~68 行，仅剩 2 处 `!important`（KaTeX 必须）

### 4. OG 图片字体简化

**文件：** `quartz/util/og.tsx`

- 删除 `cjkSansFont`（Noto Sans SC），仅保留 `cjkSerifFont`（Noto Serif SC）
- OG 模板中标题、URL、日期、标签、正文全部使用同一衬线字体栈
- CJK 字体加载从 3 个（Sans 400/700 + Serif 400）减少到 2 个（Serif 400/700）

---

## 修改文件清单

| 文件 | 改动 |
|---|---|
| `quartz.config.ts` | 字体统一为 Source Serif 4，开启离线加载 |
| `quartz/util/theme.ts` | 新增 DEFAULT_SERIF，统一四个字体变量 |
| `quartz/styles/custom.scss` | 大幅精简，删除冗余变量与 !important |
| `quartz/util/og.tsx` | 删除 Noto Sans SC，OG 全衬线 |
| `AI/logs/2026-05-06-unified-serif-fonts.md` | 新增本次变更记录 |
| `AI/logs/log.md` | 更新总索引 |

---

## 测试记录

- `npx tsc --noEmit` 通过
- `npm exec quartz -- build` 通过（使用 SOCKS5 代理下载字体）
- `public/static/fonts/` 包含 5 个 Source Serif 4 .ttf 文件（400/600/700 权重）
- HTML 中无 Google Fonts CDN 链接，字体通过 `@font-face` 指向本地文件
- OG 图片 3 个均成功生成
