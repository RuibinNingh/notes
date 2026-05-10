# 2026-05-10 explorer font weight fix

## 变更概述

修复左侧目录（Explorer）字体粗细不均的问题，同时修正正文中 `strong` / `b` / `th` 使用 `font-weight: 600` 导致中文字符出现伪粗体（faux bold）的问题。

---

## 根因分析

1. **Explorer 文件夹名使用 600，文件名使用 400**
   - `quartz/components/styles/explorer.scss:173,198` 中，`.folder-container div > a` 和 `.folder-container div > button span` 的 `font-weight: $semiBoldWeight`（即 600）。
   - 普通文件链接没有设置字重，默认为 400。
   - 同一目录树中文件夹名和文件名粗细不一致。

2. **Noto Serif SC 缺少 600 字重**
   - 当前加载的 `Noto Serif SC` 只有 400 和 700 两个字重。
   - 当浏览器遇到 `font-weight: 600` 的中文字符时，`Source Serif 4` 有 600 可以正常渲染英文字符，但 `Noto Serif SC` 没有 600，浏览器只能对 400 进行算法加粗（faux bold），导致中文部分发虚、粗细不自然，甚至与相邻英文字符的粗细脱节。

---

## 修复内容

### 1. Explorer 文件夹名字重统一

**文件：** `quartz/styles/custom.scss`

新增覆盖规则，将 `.folder-container` 内的文件夹标题和按钮文本统一为 400，与文件名保持一致：

```scss
.folder-container div > a,
.folder-container div > button span {
  font-weight: 400;
}
```

### 2. 正文字重修正

**文件：** `quartz/styles/custom.scss`

将 `article strong, article b` 和 `article th` 的 `font-weight` 从 600 改为 700：

- `600` → `700`（`article strong, article b`）
- `600` → `700`（`article th`）

`Noto Serif SC` 和 `Source Serif 4` 均提供 700 字重，因此中英文混合内容在此字重下都能正常渲染，不会再出现伪粗体。

### 3. 保留未动的设置

- `article h1-h6` 仍保持 `font-weight: 600`。标题通常较短，且 Source Serif 4 的 600 在英文标题上效果良好；若后续中文标题也发现问题，可再考虑引入 Noto Serif SC 的 600 字重或统一改为 700。

---

## 修改文件清单

| 文件 | 改动 |
|---|---|
| `quartz/styles/custom.scss` | 新增 `.folder-container` 字重覆盖；`strong/b/th` 600 → 700 |
| `AI/logs/2026-05-10-explorer-font-weight-fix.md` | 新增本次变更记录 |
| `AI/logs/log.md` | 更新总索引 |

---

## 测试记录

- `npx tsc --noEmit` 通过
- `npm exec quartz -- build` 通过
- 左侧目录中文件夹名与文件名粗细一致
- 正文加粗文本和表头的中英文渲染粗细统一
