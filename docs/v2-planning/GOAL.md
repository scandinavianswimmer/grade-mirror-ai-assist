# aiTA — Project Goal & Product Context

> Canonical product north star for the V2 rebuild. The repo is currently named
> `grade-mirror-ai-assist`; the product is **aiTA**. Every V2 decision in this
> `docs/v2-planning/` package should serve the principles below. Source: Luke's
> brainstorming `/goal`, captured 2026-05-21.

## What aiTA is

aiTA is an **AI-native instructional assistant platform** built to reduce teacher workload while improving the **quality, consistency, speed, and personalization** of educational feedback. It is a **teacher-aligned instructional intelligence system**, not a generic AI assistant — an **intelligent instructional co-pilot** that amplifies expert teaching while keeping the teacher fully in control.

## Core problem

Teachers are overwhelmed by repetitive cognitive labor that doesn't scale manually. They must review large volumes of student work (essays, short answers, discussion responses, writing assignments, revisions, projects) while still delivering personalized, rubric-aligned, instructionally sound, consistent, timely feedback. Each submission demands reading comprehension, rubric interpretation, contextual judgment, score justification, written commentary, instructional reasoning, and tone consistency. The result is a constant **tradeoff between grading speed and educational quality** — leading to grading fatigue, inconsistent feedback, delayed turnaround, generic comments, burnout, and weaker student outcomes.

## Why existing tools fail

Most AI education tools behave like generic chatbots, shallow auto-graders, prompt wrappers, or template generators. They don't understand teacher expectations, assignment context, rubric nuance, grading philosophy, writing standards, instructional style, or teacher tone. Their output feels robotic, generic, overly positive, inconsistent, and educationally weak — so **teachers spend more time correcting the AI than benefiting from it.**

## Core workflow (human-in-the-loop)

1. **Teacher uploads:** assignment instructions, grading rubric, student submissions.
2. **System extracts:** assignment requirements, grading criteria, rubric dimensions, student response content.
3. **AI generates:** inline annotations, suggested comments, rubric-aligned reasoning, proposed scores, summary feedback.
4. **Teacher reviews:** approve / edit / reject / rewrite / refine. The teacher remains final reviewer, final grader, final authority.
5. **System learns** from teacher corrections over time: tone, strictness, grading patterns, feedback preferences, instructional philosophy, wording style.

The AI acts as: grading assistant · annotation assistant · rubric interpreter · feedback draft generator · instructional support layer.

## Long-term vision — persistent pedagogical memory

Over time aiTA should become a **digital extension of the teacher**, learning how they evaluate, explain, mentor, communicate, and what standards they prioritize — helping educators **scale their expertise without sacrificing quality.**

## Non-negotiable requirements

1. **Human-in-the-loop approval is mandatory.**
2. **AI suggestions must remain editable.**
3. **Feedback must be rubric-aware.**
4. **Outputs must align with teacher voice.**
5. **Teacher trust is more important than automation speed.**
6. **Educational quality is more important than aggressive automation.**
7. **Context accumulation and memory are core system features.**

## Product principles

Prioritize: teacher trust · explainability · educational quality · workflow speed · contextual awareness · natural human-feeling feedback · consistency.

Must **not** feel like: a generic chatbot · automated grading spam · AI-generated slop · a teacher-replacement system.

Should feel like: a professional grading workspace · an intelligent instructional co-pilot · a pedagogically-aware assistant · a trusted educator tool.

## UX direction

Grammarly-style inline annotation workflow · fast review/approval loops · clean educator-focused interface · minimal-friction editing.

## Strategic thesis

aiTA is ultimately an **infrastructure layer for capturing, preserving, and scaling educational expertise** — learning how expert educators think, evaluate, explain, mentor, and communicate, then helping them apply that expertise consistently and efficiently at scale.
