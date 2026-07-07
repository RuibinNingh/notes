---
title: cc自定义状态栏
date: 2026-07-07
tags: []
publish: true
description: ""
---
![[Pasted image 20260707183129.png]]
```提示词
  请为当前用户配置 Claude Code statusLine，要求：                                                                                                             
  1. 修改当前用户的 Claude Code settings.json：                                                                                                               
	 - 优先使用 ~/.claude/settings.json                                                                                                                       
	 - 如果它是软链接，跟随软链接修改真实文件                                                                                                                 
	 - 修改前先备份为 settings.json.bak.YYYYMMDD-HHMMSS                                                                                                       
	 - 保留现有配置，不要覆盖 env、model、permissions、mcp 等已有字段                                                                                         
  2. 添加一个 statusline 脚本：                                                                                                                               
	 - 路径建议：~/.claude/statusline.py                                                                                                                      
	 - Python 3 脚本                                                                                                                                          
	 - 从 stdin 读取 Claude Code 传入的 JSON                                                                                                                  
	 - 输出一行状态栏，格式类似：                                                                                                                             
	   <model> │ ctx <progress_bar> <percent>% │ used <tokens>                                                                                                
  3. 状态栏内容要求：                                                                                                                                         
	 - 显示当前模型：优先 .model.display_name，fallback 到 .model.id                                                                                          
	 - 显示上下文使用率：                                                                                                                                     
	   - 使用 .context_window.used_percentage                                                                                                                 
	   - 带 10 格进度条，例如：▓▓▓░░░░░░░                                                                                                                     
	 - 显示已消耗 tokens：                                                                                                                                    
	   - 不是上下文窗口大小                                                                                                                                   
	   - 要统计整个 Claude Code 会话 transcript_path 里的 token 消耗                                                                                          
	   - 从 JSONL transcript 中累计 assistant message usage                                                                                                   
	   - 必须计入：                                                                                                                                           
		 input_tokens                                                                                                                                         
		 output_tokens                                                                                                                                        
		 cache_creation_input_tokens                                                                                                                          
		 cache_read_input_tokens                                                                                                                              
	 - tokens 要自动缩写：                                                                                                                                    
	   - 999 -> 999                                                                                                                                           
	   - 1000 -> 1k                                                                                                                                           
	   - 10500 -> 10.5k                                                                                                                                       
	   - 1000000 -> 1M                                                                                                                                        
	   - 1030000 -> 1.03M                                                                                                                                     
  4. settings.json 中配置：                                                                                                                                   
	 {                                                                                                                                                        
	   "statusLine": {                                                                                                                                        
		 "type": "command",                                                                                                                                   
		 "command": "<statusline.py 的绝对路径>",                                                                                                             
		 "padding": 0                                                                                                                                         
	   }                                                                                                                                                      
	 }                                                                                                                                                        
  5. 如果 settings.json 的 env 里存在 ANTHROPIC_MODEL，并且它是不带长上下文 alias 的裸模型名，例如 deepseek-v4-pro，而 ANTHROPIC_DEFAULT_SONNET_MODEL /       
  OPUS / HAIKU 里已有 [1M] alias：                                                                                                                            
	 - 删除 env.ANTHROPIC_MODEL                                                                                                                               
	 - 不要删除 ANTHROPIC_DEFAULT_*_MODEL                                                                                                                     
	 - 保留 settings.json 顶层 model 字段                                                                                                                     
	 - 目的是避免裸默认模型覆盖 [1M] 长上下文 alias                                                                                                           
  6. 完成后做 ad-hoc 验证：                                                                                                                                   
	 - 创建 /tmp/hermes-verify-statusline-XXXXXX.py 临时验证脚本                                                                                              
	 - 构造 fake Claude Code input JSON                                                                                                                       
	 - 构造 fake transcript JSONL，其中包含 input/output/cache_creation/cache_read tokens                                                                     
	 - 调用 statusline.py                                                                                                                                     
	 - 断言输出包含：                                                                                                                                         
	   - 模型名                                                                                                                                               
	   - 进度条                                                                                                                                               
	   - ctx 百分比                                                                                                                                           
	   - used token 缩写                                                                                                                                      
	 - 验证后删除临时文件                                                                                                                                     
  7. 最后只汇报：                                                                                                                                             
	 - 修改了哪个 settings.json                                                                                                                               
	 - 创建了哪个 statusline.py                                                                                                                               
	 - 是否删除了 ANTHROPIC_MODEL                                                                                                                             
	 - 验证输出示例                                                                                                                                           
  注意：                                                                                                                                                      
  - 不要把 API key 写入文件                                                                                                                                   
  - 不要破坏用户已有配置                                                                                                                                      
  - 不要使用 jq 依赖，脚本用 Python 标准库实现                                                                                                                
  - 如果权限不足，明确说明需要用户手动执行的命令        
```