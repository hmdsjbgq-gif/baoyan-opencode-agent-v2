---
name: student-profile-intake
description: Collect a complete baoyan student profile and normalize it into a structured record
compatibility: opencode
metadata:
  domain: baoyan
  stage: intake
---

## What I do
I collect and normalize a student's baoyan profile into a structured form.

## Required fields
- basic.school
- basic.major
- basic.grade
- academic.gpa
- academic.rank
- academic.rank_percent
- academic.english
- experience.research
- experience.competitions
- experience.projects
- preferences.cities
- preferences.target_directions
- preferences.degree_type
- preferences.career_goal
- preferences.family_constraints
- application_state.materials_ready
- current_stage

## Workflow
1. Check which required fields are missing.
2. Ask only the highest-value missing questions first.
3. Normalize the answers into concise structured data.
4. Normalize `current_stage` into one of `early_prep` / `summer_camp` / `pre_recommendation` / `offer_choice` when the stage is clear.
5. Mark uncertain fields as `unknown`, not guessed.
6. Save the profile after each major update.

## Priority order for questioning
1. School / major / rank
2. GPA and rank percent
3. English score
4. Research and project depth
5. Degree preference and city preference
6. Career goal and family constraints
7. Current material readiness

## Output format
Follow root `AGENTS.md` -> `## Skill 输出规范`.
Use the four-part structure `## [Skill 名称] 输出` + `### 核心结论` + `### 关键数据` + `### 置信度说明` + `### 建议下一步`.
Place the skill-specific items below inside those four sections, and annotate sourced facts in `关键数据` as `[来源类型] URL 或说明`.

### Student Profile Card
- School:
- Major:
- Grade / Current stage:
- GPA / Rank:
- English:
- Research:
- Competitions:
- Projects:
- Degree preference:
- City preference:
- Career goal:
- Constraints:

### Missing Critical Fields
- ...

### Initial Read
- Strengths:
- Weaknesses:
- Risks:
- Next step:
