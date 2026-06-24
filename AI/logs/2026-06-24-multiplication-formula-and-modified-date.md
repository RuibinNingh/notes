# 2026-06-24 乘法公式渲染修复 & 页面显示修改时间

本会话包含两个独立改动：

1. 修复 `乘法公式.md` 页面 LaTeX 公式块渲染失败的问题。
2. 在每篇笔记顶部同时显示「创建于」和「修改于」两个时间戳。

---

## 1. 乘法公式 LaTeX 渲染修复

### 现象

`content/数学/初高衔接/乘法公式.md` 整个公式块渲染失败，源文本直接以原始 `$$\begin{aligned}...\end{aligned}$$` 形式显示在页面上。

### 根因

原文件写法：

```markdown
$$\begin{aligned}
(a+b)^3 &= a^3 + 3a^2b + 3ab^2 + b^3 \\
...
\end{aligned}$$
```

`$$` 没有独占一行，而是与 `\begin{aligned}` 挤在同一行。remark-math 在解析多行公式块时，要求 `$$` 前后是换行，否则会把整段当作行内公式（inline math）处理。`aligned` 环境内含 `\\` 等只能用于 display 模式的命令，在 inline 上下文里直接解析失败。

对照同样使用 `aligned` 但渲染正常的 `content/数学/代数学/因式分解-主元法.md`，其中所有 `$$` 都是独占一行的，因此工作正常。

### 修复

将 `$$` 拆到独立行：

```markdown
$$
\begin{aligned}
(a+b)^3 &= a^3 + 3a^2b + 3ab^2 + b^3 \\
(a-b)^3 &= a^3 - 3a^2b + 3ab^2 - b^3 \\
a^3 + b^3 &= (a+b)(a^2 - ab + b^2) \\
a^3 - b^3 &= (a-b)(a^2 + ab + b^2)
\end{aligned}
$$
```

---

## 2. 页面显示「创建于」+「修改于」

### 现状

`quartz.config.ts` 中 `defaultDateType: "modified"`，但 `ContentMeta` 组件只显示 `defaultDateType` 指定的那一个日期。也就是说，原本要么只显示创建时间，要么只显示修改时间，无法两个同时显示。

### 改动

**文件：** `quartz/components/ContentMeta.tsx`

替换原本的单一日期渲染逻辑：

```tsx
if (fileData.dates) {
  segments.push(<Date date={getDate(cfg, fileData)!} locale={cfg.locale} />)
}
```

改为同时输出创建时间与修改时间，附中文前缀：

```tsx
if (fileData.dates) {
  const created = fileData.dates.created
  const modified = fileData.dates.modified
  if (created) {
    segments.push(
      <span>
        创建于 <Date date={created} locale={cfg.locale} />
      </span>,
    )
  }
  if (modified && (!created || modified.getTime() !== created.getTime())) {
    segments.push(
      <span>
        修改于 <Date date={modified} locale={cfg.locale} />
      </span>,
    )
  }
}
```

同时移除不再使用的 `getDate` 导入：

```tsx
import { Date } from "./Date"
```

### 设计要点

- **来源**：仍然使用 `CreatedModifiedDate` 插件已注入的 `fileData.dates`。但优先级需要调整（见下方"踩坑"）。
- **去重**：若创建时间与修改时间是同一时刻，仅显示「创建于」，避免两个相同日期挨在一起。
- **顺序**：创建于 → 修改于 →「X 分钟阅读」。
- **国际化**：直接硬编码了中文「创建于 / 修改于」前缀，未走 i18n 表。本站 `locale: "zh-CN"`，暂不需要多语言。如未来引入英文界面，可再迁移到 `quartz/i18n/locales/*.ts` 的 `contentMeta` 节点。

### 踩坑：「修改于」始终不显示

#### 现象

实装后访问任意页面（例如 `因式分解-主元法`），只显示「创建于 2026年5月10日」，没有「修改于」。即使该文件明显在后续 commit 过多次（git log 可以看到 `626f752 因式分解主元法`、`6323804 vault backup` 等修改记录），「修改于」仍然不出现。

#### 根因

Quartz 的 `frontmatter` transformer 在 `quartz/plugins/transformers/frontmatter.ts:115` 有这样一行：

```js
data.modified ||= created   // if modified is not set, use created
```

含义：如果 frontmatter 里没有显式声明 `modified:` / `lastmod:` 字段，则**默认把 `modified` 填成 `created` 的值**（也就是 frontmatter 里的 `date:`）。

原本 `quartz.config.ts` 的配置是：

```ts
Plugin.CreatedModifiedDate({
  priority: ["frontmatter", "git", "filesystem"],
}),
```

`lastmod.ts` 按优先级处理时，会先看 frontmatter —— 因为 frontmatter 已经塞了 `modified`（等于 `created`），后续 `git` source 的真实修改时间就被 `||=` 短路跳过。最终 `dates.modified === dates.created`，被前面的「相同则隐藏」逻辑过滤掉。

#### 修复

修改 `quartz.config.ts`，把 `git` 提到 `frontmatter` 前面：

```ts
Plugin.CreatedModifiedDate({
  priority: ["git", "frontmatter", "filesystem"],
}),
```

这样修改时间走 git 提交历史（真实的最后一次 commit 时间），`created` 因为 git source 不提供（`lastmod.ts:80-92` 只设 `modified`），自然回退到 frontmatter 的 `date:` 字段，行为符合预期。

#### 备选方案

如果担心未来 git 不可用或想完全用 frontmatter 控制，可以在写笔记时显式声明 `modified:` 字段，跳过 `||=` 兜底逻辑：

```yaml
---
title: xxx
date: 2026-05-10
modified: 2026-06-24
---
```

但 vault 已经有几十篇笔记，逐个补 `modified` 不现实，所以选了调优先级方案。

---

## 修改文件清单

| 文件 | 改动 |
|---|---|
| `content/数学/初高衔接/乘法公式.md` | 将 `$$` 与 `\begin{aligned}` 拆为独立行 |
| `quartz/components/ContentMeta.tsx` | 同时渲染「创建于」与「修改于」；移除 `getDate` 导入 |
| `quartz.config.ts` | `CreatedModifiedDate.priority` 调整为 `["git", "frontmatter", "filesystem"]` |
| `AI/logs/2026-06-24-multiplication-formula-and-modified-date.md` | 新增本次变更记录 |
| `AI/logs/log.md` | 更新总索引 |

---

## 后续注意事项

- 修改时间从 git 提交历史读取。对于新建但尚未 commit 的文件，会回退到文件系统 mtime，可能不准确——常规 vault backup commit 流程下不受影响。
- 若以后想自定义日期前缀（例如「Created / Modified」或更短的「✏️」），改 `ContentMeta.tsx` 内的 `<span>` 文本即可。
