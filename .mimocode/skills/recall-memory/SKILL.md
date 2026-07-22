---
name: recall-memory
description: Recall and summarize project memory from checkpoint files, memory files, and session history. Use when user says "找回记忆", "recall memory", "restore memory", or similar phrases to review project context.
---

# Recall Memory Skill

Standardized workflow for recalling project memory across sessions.

## When to Use

- User says "找回记忆" (recall memory)
- User says "recall memory", "restore memory", "resume context"
- User wants to understand project history and current state

## Procedure

### Step 1: Read Memory Files

Read the following files in parallel:
- `projects/<project_id>/MEMORY.md` - Project-level memory
- `sessions/<session_id>/checkpoint.md` - Latest session checkpoint
- `sessions/<session_id>/notes.md` - Session notes

### Step 2: Query Database (Optional)

If memory files are insufficient, query the trajectory database:

```sql
-- Get recent sessions
SELECT id, title, time_created 
FROM session 
ORDER BY time_created DESC 
LIMIT 10;

-- Get user requests from recent sessions
SELECT p.data 
FROM part p 
JOIN message m ON p.message_id = m.id 
WHERE json_extract(m.data, '$.role') = 'user' 
  AND json_extract(p.data, '$.type') = 'text' 
ORDER BY p.time_created DESC 
LIMIT 20;
```

### Step 3: Synthesize Summary

Create a structured summary with:

1. **Project Overview**
   - What is this project?
   - Tech stack
   - Current status

2. **Key Accomplishments**
   - Completed features
   - Major milestones

3. **Current State**
   - What's working
   - What's in progress
   - Known issues

4. **Next Steps**
   - Pending tasks
   - Recommended actions

### Step 4: Present to User

Format the summary clearly with:
- Bullet points for readability
- Code blocks for technical details
- Clear sections for different aspects

## Example Output Structure

```
## 项目概览
**项目名称**: [Name]
**技术栈**: [Stack]
**当前状态**: [Status]

## 已完成功能
- [Feature 1]
- [Feature 2]

## 当前状态
- [Working item]
- [In progress item]

## 下一步
- [Pending task]
- [Recommended action]
```

## Notes

- Always read memory files first before querying database
- Synthesize information from multiple sources
- Focus on actionable information
- Keep summary concise but comprehensive