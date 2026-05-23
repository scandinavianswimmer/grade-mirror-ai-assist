-- ============================================================================
-- aiTA — DEMO SEED: teacher style-learning loop
-- ============================================================================
-- Purpose: stage the "learns your style / looks like the teacher graded it" demo.
-- Seeds, for the test teacher, a distinctive grading voice (Socratic, warm, demands
-- evidence, closes with "Next step:") as:
--   1) ten training_examples  (the teacher's "past graded work")
--   2) one teacher_style_profiles.style_summary  (what grade-submission injects)
--   3) flips privacy_settings.allow_training_on_content = TRUE  (training consent)
--
-- grade-submission reads ONLY teacher_style_profiles.style_summary at grade time,
-- so (2) is what makes a WITH-profile vs WITHOUT-profile re-grade differ on camera.
-- (1) makes the narrative real and lets build-style-profile regenerate the summary later.
--
-- HOW TO RUN (same session-pooler pattern as the migrations; runs as `postgres`,
-- so RLS does not block and the consent flip is YOUR explicit action):
--   PW='<your_db_password>'
--   HOST=aws-1-us-west-2.pooler.supabase.com
--   USER=postgres.yhdobsmmhdvqswjpousc
--   PGPASSWORD="$PW" psql "host=$HOST port=5432 user=$USER dbname=postgres sslmode=require" \
--     -v ON_ERROR_STOP=1 -f scripts/seed-demo-style-profile.sql
--
-- Idempotent: fixed row ids + ON CONFLICT; safe to re-run.
-- To UNDO: see the DELETE block at the very bottom (commented out).
-- ============================================================================

\set teacher '''b1a916bb-21fa-4cfd-9959-ce737a5cf465'''

BEGIN;

-- ── 1) Training examples (the teacher's past graded work, in their voice) ──────
-- Fixed ids (prefix 5eed...) so re-runs upsert instead of duplicating.
INSERT INTO public.training_examples (id, user_id, essay, rubric, feedback, grade, is_exemplar) VALUES
('5eed0001-0000-4000-8000-000000000001', :teacher,
 'In Holes, Stanley changes a lot. He starts out unlucky and sad. Then he digs holes and gets stronger. At the end he saves Zero and breaks the family curse. This shows he grew as a person.',
 'Literary analysis: thesis clarity, use of textual evidence, depth of analysis, organization.',
 'You clearly understand the shape of Stanley''s arc — nice work tracking him from "unlucky" to someone who acts. Right now this is retelling, not analysis yet: you tell me WHAT happens but not HOW or WHY it matters. Where in the text does Stanley first choose to act instead of accept his fate? Evidence? Next step: pick ONE moment and explain what it reveals about his change.',
 '72/100', true),
('5eed0002-0000-4000-8000-000000000002', :teacher,
 'Sachar uses the motif of digging to show transformation. Each hole Stanley digs literally hardens his body, but the digging also unearths the past — the buried boat, the lipstick tube, the truth of Kissin'' Kate. Stanley''s growth is mirrored in what the earth gives back.',
 'Literary analysis: thesis clarity, use of textual evidence, depth of analysis, organization.',
 'Now THIS is analysis — you connect the literal digging to what it "unearths," and that''s exactly the how-and-why I look for. Strong instinct quoting the buried objects. What does it mean that the past is literally beneath their feet? Push that one inch further. Next step: add one sentence naming the theme this motif serves (fate vs. choice?).',
 '94/100', true),
('5eed0003-0000-4000-8000-000000000003', :teacher,
 'The Giver is about a boy named Jonas. He lives in a community with no color and no pain. He gets memories from the Giver and learns about the real world. He decides to leave. It is a good book about freedom.',
 'Literary analysis: thesis clarity, use of textual evidence, depth of analysis, organization.',
 'You''ve got the premise down and your last line gestures at a real theme — freedom. But "it is a good book" is a reader''s reaction, not an argument. What specifically about the memories changes Jonas? Evidence? Next step: turn "it is a good book about freedom" into a claim you can prove — e.g., what the memories cost him.',
 '68/100', false),
('5eed0004-0000-4000-8000-000000000004', :teacher,
 'When Jonas receives the memory of war, he feels real pain for the first time, and Lowry writes that he "wept." That single word marks the end of his innocence: feeling becomes the price of truth. From that moment Jonas can no longer accept Sameness, because he now carries what his community chose to forget.',
 'Literary analysis: thesis clarity, use of textual evidence, depth of analysis, organization.',
 'Beautiful — you anchored the whole claim to one word, "wept," and let it carry the weight. That is exactly how to use evidence. Your line "feeling becomes the price of truth" is the kind of sentence I''d read aloud to the class. Could you trace this "price" to his final choice? Next step: connect this moment to why he leaves.',
 '97/100', true),
('5eed0005-0000-4000-8000-000000000005', :teacher,
 'The author uses symbolism alot in The Great Gatsby. The green light is hope. The eyes of Doctor T J Eckleburg are like god watching. The valley of ashes is poorness. These symbols show the theme of the american dream.',
 'Literary analysis: thesis clarity, use of textual evidence, depth of analysis, organization.',
 'You''ve spotted three of the big symbols — good eye. (Quick mechanics note: "a lot" is two words; small thing, don''t sweat it.) The trouble is each symbol gets one label and then we move on. Pick the green light: WHY does Fitzgerald make it green, and make it a light? What does Gatsby DO when he sees it? Evidence? Next step: develop ONE symbol into a full paragraph instead of listing three.',
 '70/100', false),
('5eed0006-0000-4000-8000-000000000006', :teacher,
 'Gatsby reaches toward the green light at the end of Daisy''s dock, and Fitzgerald ties it to "the orgastic future that year by year recedes before us." The light is hope, but hope aimed backward — Gatsby wants to repeat the past. The dream glows precisely because it can never be touched.',
 'Literary analysis: thesis clarity, use of textual evidence, depth of analysis, organization.',
 'Yes — "hope aimed backward" is a genuinely sharp reading, and you earned it by quoting the receding future. You''re doing the how AND the why now. One challenge: is Fitzgerald mourning the dream or criticizing it? Sit with that tension. Next step: add a closing line that takes a stand on what Fitzgerald wants us to feel.',
 '96/100', true),
('5eed0007-0000-4000-8000-000000000007', :teacher,
 'Stanley and Zero become friends. Zero helps Stanley dig and Stanley teaches Zero to read. They run away together and climb the mountain. Their friendship is important in the book.',
 'Literary analysis: thesis clarity, use of textual evidence, depth of analysis, organization.',
 'You''ve chosen a friendship worth writing about — and teaching Zero to read is the perfect moment to zoom in on. So zoom in! What does Stanley risk by helping Zero? What changes in him when he does? Evidence? Right now the friendship is summarized, not argued. Next step: replace "their friendship is important" with what the friendship PROVES about Stanley.',
 '66/100', false),
('5eed0008-0000-4000-8000-000000000008', :teacher,
 'Climbing the mountain with Zero on his back, Stanley unknowingly fulfills his great-great-grandfather''s broken promise to Madame Zeroni. Sachar lets the curse dissolve not through luck but through loyalty — Stanley carries the very person everyone else discarded. Redemption, the novel argues, is something you do, not something you''re owed.',
 'Literary analysis: thesis clarity, use of textual evidence, depth of analysis, organization.',
 'This is honors-level work. "Redemption is something you do, not something you''re owed" is a thesis I wish more adults understood, and you proved it with the mountain scene. Lovely connection between the broken promise and the literal carrying. Could the same idea explain Zero''s arc too? Next step: one sentence extending your claim to a second character.',
 '99/100', true),
('5eed0009-0000-4000-8000-000000000009', :teacher,
 'In the book the community in the Giver has rules for everything. They cant choose jobs or spouses. The committee decides. This is bad because people should be free. Jonas sees this is wrong.',
 'Literary analysis: thesis clarity, use of textual evidence, depth of analysis, organization.',
 'I can hear your conviction — you clearly value freedom, and that''s the right nerve to touch. But "this is bad" tells me your opinion, not Lowry''s craft. HOW does Lowry make us feel the cost of Sameness? Find the moment the control stops being comfortable and starts being frightening. Evidence? Next step: ground your claim in one scene where a rule does real harm.',
 '69/100', false),
('5eed0010-0000-4000-8000-000000000010', :teacher,
 'Lowry never lets Sameness look like a villain at first; the community is gentle, orderly, kind. That''s the trap. By the time Jonas watches his father "release" a newborn with a needle, the horror lands harder because we, like Jonas, were lulled. Lowry argues that the most dangerous control is the kind that feels like care.',
 'Literary analysis: thesis clarity, use of textual evidence, depth of analysis, organization.',
 'Chilling and exactly right — you noticed the TRAP, that the comfort is the point, and the "release" scene is the perfect proof. "The most dangerous control is the kind that feels like care" is your best sentence of the year. I have nothing to fix here, only to ask: where else does comfort hide harm? Next step: nominate one more example for a future essay.',
 '100/100', true)
ON CONFLICT (id) DO UPDATE
  SET essay = EXCLUDED.essay, rubric = EXCLUDED.rubric, feedback = EXCLUDED.feedback,
      grade = EXCLUDED.grade, is_exemplar = EXCLUDED.is_exemplar;

-- ── 2) Style profile (what grade-submission injects into the grader) ──────────
INSERT INTO public.teacher_style_profiles (user_id, style_summary, updated_at) VALUES
(:teacher,
'- Voice: warm, encouraging, and plainspoken — never sarcastic or punitive. Always address the student directly as "you."
- Open each note with a brief, specific affirmation that names the student''s actual move (e.g., "Strong instinct to tie the curse to Stanley''s arc here.").
- Coach with questions, not commands: prefer "What evidence from the text could anchor this claim?" over "Add evidence."
- Insist on textual support for every analytical claim; flag unsupported assertions briefly with "Evidence?"
- Reward genuine analysis (the how and the why) over plot retelling; gently name summary as "retelling, not analysis yet."
- Quote the student''s own strong phrases back to them when praising a specific word choice or connection.
- Grade hard on thesis clarity and argument structure; be lenient on minor grammar/mechanics — note them in one short clause, do not dwell.
- Frame every weakness as a growth opportunity ("This is close — to push it further...").
- Use short sentences and concrete language; avoid jargon and AI-sounding phrasing like "exceptionally well-organized."
- Close every piece of feedback with one concrete, forward-looking instruction labeled exactly "Next step:".
- Summary feedback should sound like a caring mentor speaking to one student, not a rubric report.',
 now())
ON CONFLICT (user_id) DO UPDATE
  SET style_summary = EXCLUDED.style_summary, updated_at = now();

-- ── 3) Training consent (required for build-style-profile; demo realism) ───────
-- NOTE: this flips the teacher's training-on-content consent to TRUE.
UPDATE public.privacy_settings SET allow_training_on_content = TRUE WHERE user_id = :teacher;
-- If no privacy row exists yet, create one with consent on:
INSERT INTO public.privacy_settings (user_id, allow_training_on_content)
SELECT :teacher, TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.privacy_settings WHERE user_id = :teacher);

COMMIT;

-- Verify:
SELECT
  (SELECT count(*) FROM public.training_examples WHERE user_id = :teacher) AS training_examples,
  (SELECT length(style_summary) FROM public.teacher_style_profiles WHERE user_id = :teacher) AS style_summary_len,
  (SELECT allow_training_on_content FROM public.privacy_settings WHERE user_id = :teacher) AS consent;

-- ── UNDO (uncomment to remove the seeded demo data) ───────────────────────────
-- DELETE FROM public.training_examples WHERE id LIKE '5eed%';
-- DELETE FROM public.teacher_style_profiles WHERE user_id = :teacher;
-- UPDATE public.privacy_settings SET allow_training_on_content = FALSE WHERE user_id = :teacher;
