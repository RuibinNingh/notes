# 2026-05-03 footer blog link

## 变更概述

将 Quartz 页脚默认的上游项目链接替换为个人博客链接，减少默认模板痕迹，并让站点页脚指向自己的主页。

---

## 文档重构

### 1. 页脚链接替换

**文件：** `quartz.layout.ts`

- 删除默认页脚链接 `GitHub`。
- 删除默认页脚链接 `Discord Community`。
- 新增页脚链接 `我的博客`，地址为 `https://www.ruibin-ningh.top`。
- 保持 Footer 组件结构不变，仅调整布局配置中的链接项。

---

## 修改文件清单

| 文件 | 改动 |
|---|---|
| `quartz.layout.ts` | 将页脚链接替换为个人博客 |
| `AI/logs/2026-05-03-footer-blog-link.md` | 新增本次变更记录 |
| `AI/logs/log.md` | 更新总索引与统计 |

---

## 测试记录

- `npm exec quartz -- build` 通过。
