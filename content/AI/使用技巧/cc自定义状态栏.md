---
title: cc自定义状态栏
date: 2026-07-07
tags: []
publish: true
description: ""
---
![[Pasted image 20260707184846.png]]
```提示词
  请为当前用户配置 Claude Code statusLine，要求：

1. 修改当前用户的 Claude Code settings.json：
   - 优先使用 ~/.claude/settings.json
   - 如果是软链接，跟随软链接修改真实文件
   - 修改前先备份为 settings.json.bak.YYYYMMDD-HHMMSS
   - 保留现有配置，不要覆盖 env、model、permissions、mcp 等已有字段

2. 添加一个 statusline 脚本：
   - 路径：~/.claude/statusline.py
   - Python 3 脚本
   - 从 stdin 读取 Claude Code 传入的 JSON
   - 输出一行状态栏，格式：
     <模型名> │ ctx <10格进度条> <百分比%> <ctx用量>/<ctx上限> │ used <总消耗tokens>
     示例：deepseek-v4-flash[1M] │ ctx ▓▓░░░░░░░░ 20% 54.1k/272k │ used 1.03M

3. 状态栏内容要求：
   - 显示当前模型：优先 .model.display_name，fallback 到 .model.id
   - 上下文使用率：.context_window.used_percentage，带 10 格进度条 ▓/░
   - ctx 用量/上限：从 used_percentage 和 context_window_size 推导（ctx_used = round(ctx_max * pct / 100)），不要直接读 total_input_tokens，否则百分比和数值可能不一致
   - 总消耗 tokens：从 transcript_path JSONL 中统计 assistant message 的 usage，累加 input_tokens + output_tokens + cache_creation_input_tokens + cache_read_input_tokens。usage 可能在 entry.usage 或 entry.message.usage
   - tokens 自动缩写：999→999, 1000→1k, 10500→10.5k, 1000000→1M, 1030000→1.03M（去尾零）

4. Windows 注意事项：
   - 用 sys.stdin.buffer.read() 读原始字节再 decode("utf-8")，绕过 GBK 编码
   - sys.stdout.reconfigure(encoding="utf-8") 输出 Unicode
   - settings.json 的 command 用 Git Bash 路径：python3 /c/Users/xxx/.claude/statusline.py

5. settings.json 中配置：
   {
     "statusLine": {
       "type": "command",
       "command": "python3 ~/.claude/statusline.py 的绝对路径",
       "padding": 0
     }
   }

6. 如果 settings.json 的 env 里存在 ANTHROPIC_MODEL（裸模型名没有 [1M] alias），删除它，保留 ANTHROPIC_DEFAULT_*_MODEL

7. 完成后做 ad-hoc 验证：构造 fake input JSON + fake transcript JSONL → 调用 statusline.py → 断言输出含模型名、进度条、百分比、token 缩写

8. 完成后只汇报：修改了哪个 settings.json、创建了哪个 statusline.py、是否删除了 ANTHROPIC_MODEL、验证输出示例
```