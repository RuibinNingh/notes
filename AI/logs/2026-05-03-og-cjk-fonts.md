# 2026-05-03 og cjk fonts

## 变更概述

修复 Quartz 动态生成 OG 图片时中文标题、日期、标签被渲染成方块的问题，并保持与站点 Claude 风格一致的字体分层。

---

## 中风险修复

### 1. OG 字体加载补充中文子集

**文件：** `quartz/util/og.tsx`

- 在 satori 字体列表中额外加入 `Noto Sans SC` 与 `Noto Serif SC`。
- 使用 Google Fonts `text=` 参数按当前站点标题、页面标题、描述、标签和常用日期字符生成字体子集。
- 通过文本 hash 缓存字体文件，避免不同页面文字变化时复用错误子集。

### 2. OG 模板字体 fallback

**文件：** `quartz/util/og.tsx`

- 标题、站点 URL、日期、阅读时间、标签使用 `Inter, Noto Sans SC`。
- 描述正文使用 `Source Serif 4, Noto Serif SC`。
- 继续保持标题/UI 无衬线、正文衬线的 Claude 风格。

### 3. 构建前收集 OG 文本

**文件：** `quartz/plugins/emitters/ogImage.tsx`

- 在生成 OG 图片前收集页面标题、描述、标签、站点标题和 baseUrl。
- 将收集到的文本传给字体加载函数，确保中文字符进入 satori 可用字体。

---

## 修改文件清单

| 文件 | 改动 |
|---|---|
| `quartz/util/og.tsx` | 增加中文字体子集加载与 OG 字体 fallback |
| `quartz/plugins/emitters/ogImage.tsx` | 构建前收集 OG 相关文本用于字体子集 |
| `AI/logs/2026-05-03-og-cjk-fonts.md` | 新增本次变更记录 |
| `AI/logs/log.md` | 更新总索引与统计 |

---

## 测试记录

- `npm exec quartz -- build` 通过。
- `npm exec tsc -- --noEmit` 通过。
- 人工查看 `public/index-og-image.webp` 与 `public/AI/什么是AI-og-image.webp`，中文、日期、阅读时间和标签均不再显示为方块。
