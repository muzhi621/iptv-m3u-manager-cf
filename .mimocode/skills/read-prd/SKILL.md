---
name: read-prd
description: Read PRD documents and implement features based on requirements. Use when user says "阅读PRD", "read PRD", "implement PRD", or similar phrases to process product requirements.
---

# Read PRD Skill

Standardized workflow for reading PRD documents and implementing features.

## When to Use

- User says "阅读PRD文档" (read PRD document)
- User says "read PRD", "implement PRD", "complete PRD"
- User wants to implement features based on product requirements

## Procedure

### Step 1: Locate PRD Files

Search for PRD files in the project:
- Look for `*.md` files with "prd" in the name
- Check common locations: root directory, `docs/`, `requirements/`
- Use glob pattern: `**/*prd*.md` or `**/*PRD*.md`

### Step 2: Read PRD Content

Read the PRD file(s) thoroughly:
- Understand the overall project goals
- Identify specific features to implement
- Note technical requirements and constraints
- Extract acceptance criteria

### Step 3: Analyze Current State

Before implementing:
- Check what's already implemented
- Identify gaps between PRD and current state
- Review existing code structure
- Understand architecture patterns

### Step 4: Plan Implementation

Create an implementation plan:
1. Break down features into tasks
2. Prioritize based on dependencies
3. Estimate effort for each task
4. Identify potential risks

### Step 5: Implement Features

Execute the plan:
- Implement features incrementally
- Follow existing code patterns
- Write tests for new functionality
- Update documentation as needed

### Step 6: Verify Implementation

Validate against PRD requirements:
- Test all acceptance criteria
- Ensure features work as expected
- Check for edge cases
- Verify integration with existing system

## Example Workflow

```
User: "阅读prdv25.md 完成修复工作"

Agent:
1. Read prdv25.md to understand requirements
2. Analyze current codebase
3. Identify gaps and issues
4. Create implementation plan
5. Implement fixes
6. Test against PRD criteria
7. Report completion
```

## Tips

- Always read the PRD completely before starting
- Ask for clarification if requirements are unclear
- Break large features into smaller, manageable tasks
- Test incrementally rather than at the end
- Document any deviations from the PRD with rationale