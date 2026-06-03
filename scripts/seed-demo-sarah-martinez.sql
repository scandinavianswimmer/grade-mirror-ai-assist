-- ============================================================================
-- aiTA — DEMO SEED: "Sarah Martinez" (primary ICP demo account)
-- ============================================================================
-- Builds a believable, busy-but-real teacher account: profile + grading voice +
-- consent + training samples + 6 classes + 10 assignments + ~14 real student
-- essays (varied ability archetypes + edge cases) staged as `uploaded` (ready to
-- grade). Grades + inline annotations are produced AUTHENTICALLY by running the
-- grader afterward (see docs/DEMO-SARAH-MARTINEZ.md) — annotations anchor to real
-- essay text, so they cannot be faked in SQL.
--
-- WHY SQL: live bulk writes via the app are permission-gated; running this as the
-- `postgres` role via psql bypasses RLS and keeps the consent flip your explicit act.
--
-- ── CHOOSE THE ACCOUNT (set :teacher below) ────────────────────────────────
-- RECOMMENDED (clean slate): in the app, sign up  sarah.martinez.demo@aitaedu.ai
--   then get her id:  SELECT id FROM auth.users WHERE email='sarah.martinez.demo@aitaedu.ai';
--   and set :teacher to that uuid. (A fresh account has none of the existing test junk.)
-- FAST (reuse, mixed with existing data): use the existing test teacher id below.
\set teacher '''b1a916bb-21fa-4cfd-9959-ce737a5cf465'''
--
-- ── RUN ─────────────────────────────────────────────────────────────────────
--   PW='<db_password>'
--   PGPASSWORD="$PW" psql "host=aws-1-us-west-2.pooler.supabase.com port=5432 \
--     user=postgres.yhdobsmmhdvqswjpousc dbname=postgres sslmode=require" \
--     -v ON_ERROR_STOP=1 -f scripts/seed-demo-sarah-martinez.sql
--
-- Idempotent (fixed ids + ON CONFLICT). UNDO block at the bottom.
-- ============================================================================

BEGIN;

-- ── Teacher profile (rebrand to Sarah) ───────────────────────────────────────
UPDATE public.users SET
  name = 'Sarah Martinez',
  full_name = 'Sarah Martinez',
  school = 'Westlake Ridge High School',
  onboarding_complete = TRUE,
  role = 'teacher'
WHERE id = :teacher;

-- ── Training consent (required for build-style-profile; demo realism) ─────────
UPDATE public.privacy_settings SET allow_training_on_content = TRUE WHERE user_id = :teacher;
INSERT INTO public.privacy_settings (user_id, allow_training_on_content)
SELECT :teacher, TRUE WHERE NOT EXISTS (SELECT 1 FROM public.privacy_settings WHERE user_id = :teacher);

-- ── Grading-style profile (Sarah's voice — injected into the grader) ──────────
INSERT INTO public.teacher_style_profiles (user_id, style_summary, updated_at) VALUES
(:teacher,
'- Tone: warm, constructive, and academic — supportive but never effusive. Treat the student as a capable writer who can revise.
- Be specific, never generic: point to the exact sentence or quote. Explicitly avoid empty praise like "Great job!" — say what specifically worked and why.
- Lead with the genuine strength, then the precise next move: e.g., "Strong textual evidence here, but push your analysis one step further."
- Use growth language and revision verbs (push, develop, connect, integrate, sharpen). Frame feedback as the next draft, not a verdict.
- Reward analysis (the why it matters) over plot/source summary. Flag where analysis decays into summary, especially near the conclusion ("starts strong but becomes summary-heavy").
- Coach quotation use: "Consider integrating quotations more naturally into your sentences" rather than dropping them in.
- Grade hard on thesis clarity and paragraph transitions/structure; be encouraging about ideas and effort.
- Never harsh, sarcastic, or punitive. Address the student as "you." Note minor grammar briefly; do not dwell on mechanics.
- Concise, academic register: complete sentences, no emojis, no exclamation-point praise.
- End each note with a clear, actionable revision direction, not a justification of the score.',
 now())
ON CONFLICT (user_id) DO UPDATE SET style_summary = EXCLUDED.style_summary, updated_at = now();

-- ── Training examples (Sarah''s past graded work, in her voice) ───────────────
INSERT INTO public.training_examples (id, user_id, essay, rubric, feedback, grade, is_exemplar) VALUES
('5a4a0001-0000-4000-8000-000000000001', :teacher,
 'Fitzgerald uses the green light to show hope. Gatsby looks at it across the bay. It means he wants Daisy and his dream. The green light is a symbol of the American Dream.',
 'Literary analysis: thesis, evidence, analysis depth, organization.',
 'You''ve correctly identified the green light as central, and connecting it to the American Dream is the right move. Right now the symbol gets labeled but not unpacked — push your analysis one step further: why does Fitzgerald make the light green, and what does Gatsby DO when he reaches for it? Develop this into a full paragraph instead of a definition.',
 'B-', false),
('5a4a0002-0000-4000-8000-000000000002', :teacher,
 'When Gatsby stretches his arms toward the "single green light, minute and far away," Fitzgerald fuses longing with distance: the dream glows precisely because it cannot be reached. The color green—growth, money, envy—lets the symbol carry both Gatsby''s hope and its corruption at once.',
 'Literary analysis: thesis, evidence, analysis depth, organization.',
 'This is a thoughtful interpretation with solid evidence support — quoting "minute and far away" to argue the dream depends on distance is exactly the kind of close reading I look for. Your gloss on the color is sharp. To sharpen further, connect this reading to Gatsby''s end so the symbol pays off across the novel.',
 'A', true),
('5a4a0003-0000-4000-8000-000000000003', :teacher,
 'In his letter MLK uses ethos pathos and logos. He talks about justice. He says injustice anywhere is a threat to justice everywhere. This makes the reader feel something. He is a good writer.',
 'Rhetorical analysis: thesis, evidence, analysis of strategy, organization.',
 'You''ve named the appeals and pulled a key line — good start. But "he is a good writer" is a reaction, not analysis. Your thesis is clear, though the body needs to show HOW the rhetoric works: what does the "injustice anywhere" line DO to a clergy audience? Develop one appeal in depth rather than listing all three.',
 'C+', false),
('5a4a0004-0000-4000-8000-000000000004', :teacher,
 'King anticipates his readers'' objection that he is an "outsider," then dismantles it: by invoking the prophets and Paul, he reframes himself not as an intruder but as part of a moral lineage his clergy audience already reveres. The strategy converts his weakest position—being jailed, being doubted—into authority.',
 'Rhetorical analysis: thesis, evidence, analysis of strategy, organization.',
 'Excellent — you analyze the strategy, not just label it, and "converts his weakest position into authority" is a precise, earned claim. The lineage point shows you understand his audience. One step further: how does sentence structure or pacing reinforce this move? Connect form to effect.',
 'A', true),
('5a4a0005-0000-4000-8000-000000000005', :teacher,
 'Social media should be regulated because it is bad for teens. It causes anxiety and people compare themselves. Also there is misinformation. The government should do something about it.',
 'Argumentative: claim, evidence, reasoning, counterargument, organization.',
 'You have a clear position and two real reasons — that''s a solid skeleton. The argument needs evidence and reasoning: WHO says social media raises anxiety, and how does that prove regulation is the fix? You also haven''t addressed the obvious counterargument (free speech). Add one credible source and one paragraph answering the other side.',
 'C', false),
('5a4a0006-0000-4000-8000-000000000006', :teacher,
 'Holes shows that redemption is earned through loyalty. When Stanley carries Zero up the mountain, he unknowingly repays his family''s broken promise to Madame Zeroni. Sachar makes the curse dissolve through an act of friendship, not luck—suggesting we are freed by what we do for others.',
 'Literary analysis: thesis, evidence, analysis depth, organization.',
 'This is a thoughtful interpretation with strong evidence — the mountain scene is the perfect anchor and "freed by what we do for others" is a genuine thesis. Your analysis stays analytical instead of slipping into summary. To push it: does Zero''s arc support the same claim? Extend your idea to a second character.',
 'A-', true),
('5a4a0007-0000-4000-8000-000000000007', :teacher,
 'The Necklace is about a woman who borrows a necklace and loses it. She works for ten years to pay it back. Then she finds out it was fake. The theme is that you should be happy with what you have.',
 'Short response: theme + textual support.',
 'You''ve tracked the plot accurately and landed on a reasonable theme. This is retelling more than analysis, though — show me the moment in Maupassant''s text that proves your theme, and explain the irony of the ending rather than just reporting it. One quote plus one sentence of analysis will lift this.',
 'C+', false),
('5a4a0008-0000-4000-8000-000000000008', :teacher,
 'Maupassant lets the ending''s irony do the moral work: Mathilde sacrifices ten years for a necklace "worth at most five hundred francs." The reveal indicts not her vanity alone but a society that equates worth with appearance—her real poverty was believing the surface.',
 'Short response: theme + textual support.',
 'Sharp — you quote the appraisal and use the irony as evidence, which is exactly right, and "her real poverty was believing the surface" is a strong line. You moved past summary into argument. Consider integrating the quotation a little more smoothly into your sentence so it reads as yours.',
 'A', true),
('5a4a0009-0000-4000-8000-000000000009', :teacher,
 'Thoreau argues for civil disobedience. He thinks people should follow their conscience over unjust laws. He went to jail. This is similar to MLK. Civil disobedience is important for democracy.',
 'Argumentative/synthesis: claim, evidence, reasoning, synthesis.',
 'Good insight linking Thoreau to King — that connection is worth building. Now explain why it matters to your argument: what specifically does Thoreau add that King doesn''t? Right now the sources sit side by side instead of speaking to each other. Synthesize them around one shared claim about conscience and law.',
 'B-', false),
('5a4a0010-0000-4000-8000-000000000010', :teacher,
 'Both Thoreau and King ground disobedience in conscience, but they diverge on audience: Thoreau writes for the individual withdrawing consent, while King writes for a community demanding inclusion. Read together, they suggest civil disobedience is most powerful when private conviction becomes public, collective refusal.',
 'Argumentative/synthesis: claim, evidence, reasoning, synthesis.',
 'This is genuine synthesis — you put the sources in conversation and the divergence (individual vs. community) becomes your insight. Your thesis is clear and the structure earns it. Your analysis starts strong but becomes summary-heavy in the last paragraph; bring the argument back to your claim in the conclusion.',
 'A-', true)
ON CONFLICT (id) DO UPDATE SET essay=EXCLUDED.essay, rubric=EXCLUDED.rubric, feedback=EXCLUDED.feedback, grade=EXCLUDED.grade, is_exemplar=EXCLUDED.is_exemplar;

-- ── Classes (6) ──────────────────────────────────────────────────────────────
INSERT INTO public.classes (id, user_id, class_name, details_jsonb) VALUES
('c1a55001-0000-4000-8000-000000000001', :teacher, 'English II — Period 1', '{"grade":"10th Grade","size":29,"level":"On-Level","time":"8:00 AM"}'),
('c1a55002-0000-4000-8000-000000000002', :teacher, 'English II — Period 2', '{"grade":"10th Grade","size":31,"level":"On-Level","time":"9:00 AM"}'),
('c1a55003-0000-4000-8000-000000000003', :teacher, 'English II — Period 3', '{"grade":"10th Grade","size":28,"level":"On-Level","time":"10:15 AM"}'),
('c1a55004-0000-4000-8000-000000000004', :teacher, 'English II — Period 5', '{"grade":"10th Grade","size":30,"level":"On-Level","time":"12:30 PM"}'),
('c1a55005-0000-4000-8000-000000000005', :teacher, 'AP Lang — Period 6', '{"grade":"11th Grade","size":24,"level":"AP / Honors","time":"1:30 PM"}'),
('c1a55006-0000-4000-8000-000000000006', :teacher, 'AP Lang — Period 7', '{"grade":"11th Grade","size":25,"level":"AP / Honors","time":"2:30 PM"}')
ON CONFLICT (id) DO UPDATE SET class_name=EXCLUDED.class_name, details_jsonb=EXCLUDED.details_jsonb;

-- ── Assignments (10) ─────────────────────────────────────────────────────────
-- prompt_instructions + description both set (v1/v2-safe). status in (draft,active,completed).
INSERT INTO public.assignments (id, user_id, class_id, title, description, prompt_instructions, status, due_date, created_at) VALUES
('a5519001-0000-4000-8000-000000000001', :teacher, 'c1a55001-0000-4000-8000-000000000001',
 'Literary Analysis: Symbolism in The Great Gatsby',
 'Write a 5-paragraph literary analysis explaining how Fitzgerald uses ONE symbol (the green light, the eyes of Dr. T.J. Eckleburg, or the valley of ashes) to develop the theme of the American Dream. Include a clear thesis, at least three pieces of textual evidence with analysis, and a conclusion.',
 'Write a 5-paragraph literary analysis explaining how Fitzgerald uses ONE symbol to develop the theme of the American Dream. Clear thesis, 3+ pieces of textual evidence with analysis of how each supports the argument, conclusion tying the symbol to the theme.',
 'active', now() + interval '3 days', now() - interval '2 days'),
('a5519002-0000-4000-8000-000000000002', :teacher, 'c1a55002-0000-4000-8000-000000000002',
 'Argumentative Essay: Should Social Media Be Regulated?',
 'Take a position on whether the U.S. government should regulate social media platforms for minors. Make a defensible claim, support it with credible evidence and reasoning, and address at least one counterargument.',
 'Take and defend a position on government regulation of social media for minors. Defensible claim, credible evidence + reasoning, and a genuine counterargument paragraph.',
 'active', now() + interval '5 days', now() - interval '1 day'),
('a5519003-0000-4000-8000-000000000003', :teacher, 'c1a55003-0000-4000-8000-000000000003',
 'Short Response: Theme & Irony in "The Necklace"',
 'In one well-developed paragraph, identify a central theme of Maupassant''s "The Necklace" and prove it using the irony of the ending. Use at least one direct quotation.',
 'One paragraph: state a theme of "The Necklace" and prove it through the ending''s irony, with at least one integrated direct quotation and analysis.',
 'active', now() + interval '1 day', now() - interval '3 days'),
('a5519004-0000-4000-8000-000000000004', :teacher, 'c1a55004-0000-4000-8000-000000000004',
 'Character Analysis: Stanley''s Transformation in Holes',
 'Analyze how Stanley Yelnats changes over the course of Holes and what causes the change. Use at least three quotations and connect his growth to one of the novel''s themes (fate vs. choice, friendship, justice).',
 'Analyze Stanley''s transformation in Holes and its causes; 3+ quotations; connect his growth to a theme (fate vs. choice / friendship / justice).',
 'completed', now() - interval '6 days', now() - interval '20 days'),
('a5519005-0000-4000-8000-000000000005', :teacher, 'c1a55005-0000-4000-8000-000000000005',
 'Rhetorical Analysis: MLK''s "Letter from Birmingham Jail"',
 'Analyze how Dr. King uses rhetorical strategies to persuade his clergy audience. Focus on his purpose and how specific choices (appeals, allusions, structure, tone) advance it. Avoid summary; analyze effect.',
 'Rhetorical analysis of MLK''s "Letter from Birmingham Jail": thesis on his strategy, evidence of specific rhetorical choices, analysis of HOW each advances his purpose for the clergy audience. No summary.',
 'active', now() + interval '4 days', now() - interval '2 days'),
('a5519006-0000-4000-8000-000000000006', :teacher, 'c1a55006-0000-4000-8000-000000000006',
 'Synthesis Essay: The Value of a College Education',
 'Using at least three of the provided sources, develop a position on whether a four-year college degree is still worth the cost. Synthesize the sources into your own argument rather than summarizing each.',
 'Synthesis essay using 3+ sources to argue whether a 4-year degree is worth the cost; sources must be synthesized into one argument, not summarized serially.',
 'active', now() + interval '7 days', now() - interval '1 day'),
('a5519007-0000-4000-8000-000000000007', :teacher, 'c1a55005-0000-4000-8000-000000000005',
 'Timed Writing: Argument on Civil Disobedience',
 'In 40 minutes, argue whether civil disobedience strengthens or threatens a democratic society. Use Thoreau and King as evidence.',
 'Timed (40 min) argument: does civil disobedience strengthen or threaten democracy? Use Thoreau and King as evidence; clear claim and reasoning.',
 'active', now() + interval '2 days', now() - interval '4 days'),
('a5519008-0000-4000-8000-000000000008', :teacher, 'c1a55006-0000-4000-8000-000000000006',
 'Research Paper: Author Study — Proposal',
 'Submit a one-page proposal for your author study research paper: chosen author, working research question, and three potential sources.',
 'One-page research proposal: author, working research question, three potential sources with one sentence each on relevance.',
 'draft', now() + interval '10 days', now() - interval '1 day'),
('a5519009-0000-4000-8000-000000000009', :teacher, 'c1a55001-0000-4000-8000-000000000001',
 'Thesis Workshop: Refining Your Claim',
 'Bring a draft thesis for the Gatsby analysis. We will workshop specificity and arguability.',
 'Submit one draft thesis statement for the Gatsby analysis to be workshopped for specificity and arguability.',
 'draft', now() + interval '1 day', now() - interval '1 day'),
('a5519010-0000-4000-8000-000000000010', :teacher, 'c1a55002-0000-4000-8000-000000000002',
 'Peer Review Draft: Argument Essay',
 'Upload your rough draft of the social-media argument essay for peer review.',
 'Upload a rough draft of the social-media argument essay (any state) for structured peer review.',
 'active', now() + interval '2 days', now() - interval '2 days')
ON CONFLICT (id) DO UPDATE SET class_id=EXCLUDED.class_id, title=EXCLUDED.title, description=EXCLUDED.description, prompt_instructions=EXCLUDED.prompt_instructions, status=EXCLUDED.status, due_date=EXCLUDED.due_date;

-- The grader reads assignments.instructions (added in migration 0002, NULL for new rows) as the
-- prompt it synthesizes the rubric from — backfill it from prompt_instructions so grading isn't generic.
UPDATE public.assignments SET instructions = prompt_instructions
WHERE id LIKE 'a5519%' AND (instructions IS NULL OR instructions = '');

-- ── Student submissions (real essays; staged `uploaded` = ready to grade) ─────
-- essay + extracted_text both set so the grader has text. Archetype noted in comments.
-- HERO A: Gatsby symbolism (a5519001) — varied ability + 2 edge cases.
INSERT INTO public.submissions (id, assignment_id, student_name, essay, extracted_text, status, created_at) VALUES
-- high achiever
('5e550001-0000-4000-8000-000000000001','a5519001-0000-4000-8000-000000000001','Sofia Reyes',
 'Fitzgerald never lets the green light be simple hope. When Gatsby reaches for the "single green light, minute and far away," the adjectives do the arguing: the dream is luminous only because it stays out of reach. Green—growth, money, envy—lets one image hold Gatsby''s aspiration and its rot at once. By the novel''s end, Nick reframes the light as "the orgastic future that year by year recedes before us," widening Gatsby''s private longing into a national condition. Fitzgerald''s symbol indicts the American Dream not for failing, but for being designed to recede.',
 'Fitzgerald never lets the green light be simple hope. When Gatsby reaches for the "single green light, minute and far away," the adjectives do the arguing: the dream is luminous only because it stays out of reach. Green—growth, money, envy—lets one image hold Gatsby''s aspiration and its rot at once. By the novel''s end, Nick reframes the light as "the orgastic future that year by year recedes before us," widening Gatsby''s private longing into a national condition. Fitzgerald''s symbol indicts the American Dream not for failing, but for being designed to recede.',
 'uploaded', now() - interval '20 hours'),
-- strong analysis, weak structure
('5e550002-0000-4000-8000-000000000002','a5519001-0000-4000-8000-000000000001','Marcus Johnson',
 'The valley of ashes is where the dream goes to die. Fitzgerald describes it as a "fantastic farm where ashes grow like wheat," which is ironic because nothing grows there but poverty. The eyes of Dr. T.J. Eckleburg watch over it like a god that gave up. Also the green light is in the book and it means hope for Gatsby. The rich people drive through the ashes and never stop. This shows the American Dream leaves people behind. The symbols all connect to money and class which is the theme.',
 'The valley of ashes is where the dream goes to die. Fitzgerald describes it as a "fantastic farm where ashes grow like wheat," which is ironic because nothing grows there but poverty. The eyes of Dr. T.J. Eckleburg watch over it like a god that gave up. Also the green light is in the book and it means hope for Gatsby. The rich people drive through the ashes and never stop. This shows the American Dream leaves people behind. The symbols all connect to money and class which is the theme.',
 'uploaded', now() - interval '19 hours'),
-- struggling writer
('5e550003-0000-4000-8000-000000000003','a5519001-0000-4000-8000-000000000001','Tyler Nguyen',
 'In the Great Gatsby there are alot of symbols. The green light is hope. The eyes are like god watching everyone. The valley of ashes is poor. Gatsby wants Daisy and the green light shows that. The american dream is about being rich. Gatsby was poor and got rich but he was not happy. So the dream is not real. These symbols show the theme of the american dream in the book.',
 'In the Great Gatsby there are alot of symbols. The green light is hope. The eyes are like god watching everyone. The valley of ashes is poor. Gatsby wants Daisy and the green light shows that. The american dream is about being rich. Gatsby was poor and got rich but he was not happy. So the dream is not real. These symbols show the theme of the american dream in the book.',
 'uploaded', now() - interval '18 hours'),
-- english language learner (ideas present, language developing)
('5e550004-0000-4000-8000-000000000004','a5519001-0000-4000-8000-000000000001','Diego Hernández',
 'The green light have big meaning in the story. Gatsby see it every night and he reach his hand to it. For him it is the future with Daisy and also to be important person. But the light is far and small, so the dream is difficult to touch. I think Fitzgerald want to say the american dream give hope but also make people sad because they can not reach. The color green is like money and also like hope, two things together.',
 'The green light have big meaning in the story. Gatsby see it every night and he reach his hand to it. For him it is the future with Daisy and also to be important person. But the light is far and small, so the dream is difficult to touch. I think Fitzgerald want to say the american dream give hope but also make people sad because they can not reach. The color green is like money and also like hope, two things together.',
 'uploaded', now() - interval '17 hours'),
-- EDGE: off-topic (trust/relevance-gate demo)
('5e550005-0000-4000-8000-000000000005','a5519001-0000-4000-8000-000000000001','Brandon Davis',
 'The best way to improve your jump shot is consistent practice. Start with proper form: feet shoulder-width apart, elbow under the ball, and follow through with your wrist. Shoot 100 free throws a day and track your makes. Watching film of professional shooters like Steph Curry can also help you learn arc and release timing. Strength training for your legs adds range over time.',
 'The best way to improve your jump shot is consistent practice. Start with proper form: feet shoulder-width apart, elbow under the ball, and follow through with your wrist. Shoot 100 free throws a day and track your makes. Watching film of professional shooters like Steph Curry can also help you learn arc and release timing. Strength training for your legs adds range over time.',
 'uploaded', now() - interval '16 hours'),
-- EDGE: extremely short
('5e550006-0000-4000-8000-000000000006','a5519001-0000-4000-8000-000000000001','Logan Mitchell',
 'The green light means hope and the american dream. Gatsby wants Daisy.',
 'The green light means hope and the american dream. Gatsby wants Daisy.',
 'uploaded', now() - interval '15 hours'),
-- HERO B: MLK Rhetorical Analysis (a5519005) — AP Lang.
-- strong AP writer
('5e550007-0000-4000-8000-000000000007','a5519005-0000-4000-8000-000000000005','Priya Patel',
 'King turns his imprisonment into his credential. Writing to clergymen who called him an "outsider," he answers not with defensiveness but with lineage: he stands "as Paul," carrying "the gospel of freedom" beyond his own town. By aligning himself with the prophets his audience reveres, King reframes his presence in Birmingham as obligation, not intrusion. The move is strategic humility—he concedes his outsider status only to dissolve it, converting the clergy''s strongest objection into the very proof of his moral authority.',
 'King turns his imprisonment into his credential. Writing to clergymen who called him an "outsider," he answers not with defensiveness but with lineage: he stands "as Paul," carrying "the gospel of freedom" beyond his own town. By aligning himself with the prophets his audience reveres, King reframes his presence in Birmingham as obligation, not intrusion. The move is strategic humility—he concedes his outsider status only to dissolve it, converting the clergy''s strongest objection into the very proof of his moral authority.',
 'uploaded', now() - interval '14 hours'),
-- gifted but unfocused
('5e550008-0000-4000-8000-000000000008','a5519005-0000-4000-8000-000000000005','Aaliyah Williams',
 'MLK''s letter is incredibly powerful and honestly still relevant today. He uses ethos by mentioning he is president of the SCLC, pathos when he describes his daughter asking why she can''t go to the amusement park, and logic about just and unjust laws. The part about "wait" almost always meaning "never" is so true. He also references Socrates and the Boston Tea Party. There are so many strategies packed in here that it''s hard to pick just one, but they all work together to make his case undeniable.',
 'MLK''s letter is incredibly powerful and honestly still relevant today. He uses ethos by mentioning he is president of the SCLC, pathos when he describes his daughter asking why she can''t go to the amusement park, and logic about just and unjust laws. The part about "wait" almost always meaning "never" is so true. He also references Socrates and the Boston Tea Party. There are so many strategies packed in here that it''s hard to pick just one, but they all work together to make his case undeniable.',
 'uploaded', now() - interval '13 hours'),
-- inconsistent effort / summary-heavy
('5e550009-0000-4000-8000-000000000009','a5519005-0000-4000-8000-000000000005','Ethan Carter',
 'In his letter MLK responds to the clergy who criticized the protests. He explains why he is in Birmingham and that injustice anywhere is a threat to justice everywhere. He talks about just and unjust laws and gives examples. He says he is disappointed in the white moderate. Then he talks about being an extremist for love. At the end he hopes for brotherhood. He uses ethos pathos and logos throughout the letter to make his points to the audience.',
 'In his letter MLK responds to the clergy who criticized the protests. He explains why he is in Birmingham and that injustice anywhere is a threat to justice everywhere. He talks about just and unjust laws and gives examples. He says he is disappointed in the white moderate. Then he talks about being an extremist for love. At the end he hopes for brotherhood. He uses ethos pathos and logos throughout the letter to make his points to the audience.',
 'uploaded', now() - interval '12 hours'),
-- EDGE: likely AI-generated (uniform, polished, generic — risk-flag demo)
('5e550010-0000-4000-8000-000000000010','a5519005-0000-4000-8000-000000000005','Hannah Lee',
 'In his seminal "Letter from Birmingham Jail," Dr. Martin Luther King Jr. masterfully employs a tripartite rhetorical framework to advance his argument. Firstly, through ethos, he establishes credibility. Secondly, through pathos, he evokes profound emotional resonance. Thirdly, through logos, he constructs an irrefutable logical foundation. Furthermore, his strategic utilization of allusion and anaphora enhances persuasive efficacy. In conclusion, King''s rhetorical mastery renders his argument both compelling and enduring, cementing the letter''s status as a paragon of persuasive discourse.',
 'In his seminal "Letter from Birmingham Jail," Dr. Martin Luther King Jr. masterfully employs a tripartite rhetorical framework to advance his argument. Firstly, through ethos, he establishes credibility. Secondly, through pathos, he evokes profound emotional resonance. Thirdly, through logos, he constructs an irrefutable logical foundation. Furthermore, his strategic utilization of allusion and anaphora enhances persuasive efficacy. In conclusion, King''s rhetorical mastery renders his argument both compelling and enduring, cementing the letter''s status as a paragon of persuasive discourse.',
 'uploaded', now() - interval '11 hours'),
-- HERO C lite: Necklace short response (a5519003) — 2 quick ones for volume.
('5e550011-0000-4000-8000-000000000011','a5519003-0000-4000-8000-000000000003','Mia Gonzalez',
 'A central theme of "The Necklace" is that vanity costs more than it is worth. Mathilde borrows a glittering necklace to appear wealthy, then loses it and spends ten years in poverty to replace it. The cruel irony lands in the final line, when Madame Forestier reveals the original was "worth at most five hundred francs." Maupassant uses that reveal to show that Mathilde''s real loss was not the jewels but the years she traded for an illusion.',
 'A central theme of "The Necklace" is that vanity costs more than it is worth. Mathilde borrows a glittering necklace to appear wealthy, then loses it and spends ten years in poverty to replace it. The cruel irony lands in the final line, when Madame Forestier reveals the original was "worth at most five hundred francs." Maupassant uses that reveal to show that Mathilde''s real loss was not the jewels but the years she traded for an illusion.',
 'uploaded', now() - interval '10 hours'),
('5e550012-0000-4000-8000-000000000012','a5519003-0000-4000-8000-000000000003','Jacob Kim',
 'The theme of The Necklace is be happy with what you have. Mathilde was not happy and she wanted to be rich. She lost the necklace and had to work for ten years. Then she found out it was fake. If she was happy before none of this would happen. So the theme is do not be greedy.',
 'The theme of The Necklace is be happy with what you have. Mathilde was not happy and she wanted to be rich. She lost the necklace and had to work for ten years. Then she found out it was fake. If she was happy before none of this would happen. So the theme is do not be greedy.',
 'uploaded', now() - interval '9 hours'),
-- Social media argument (a5519002) — 2 for volume.
('5e550013-0000-4000-8000-000000000013','a5519002-0000-4000-8000-000000000002','Zoe Anderson',
 'The government should regulate social media for minors because the platforms are designed to be addictive and that harms developing brains. Internal research leaked from a major platform showed the company knew its app worsened body image for teen girls and built it anyway. A reasonable counterargument is that regulation threatens free speech—but age-based design rules limit how a product manipulates children, not what anyone is allowed to say. We already regulate tobacco and gambling for minors; attention-engineering deserves the same scrutiny.',
 'The government should regulate social media for minors because the platforms are designed to be addictive and that harms developing brains. Internal research leaked from a major platform showed the company knew its app worsened body image for teen girls and built it anyway. A reasonable counterargument is that regulation threatens free speech—but age-based design rules limit how a product manipulates children, not what anyone is allowed to say. We already regulate tobacco and gambling for minors; attention-engineering deserves the same scrutiny.',
 'uploaded', now() - interval '8 hours'),
('5e550014-0000-4000-8000-000000000014','a5519002-0000-4000-8000-000000000002','Carlos Ramírez',
 'Social media is bad and should be regulated. It makes people feel bad about themselves and spreads fake news. Kids spend too much time on it instead of doing homework. The government needs to step in and fix this problem before it gets worse for our generation.',
 'Social media is bad and should be regulated. It makes people feel bad about themselves and spreads fake news. Kids spend too much time on it instead of doing homework. The government needs to step in and fix this problem before it gets worse for our generation.',
 'uploaded', now() - interval '7 hours')
ON CONFLICT (id) DO UPDATE SET assignment_id=EXCLUDED.assignment_id, student_name=EXCLUDED.student_name, essay=EXCLUDED.essay, extracted_text=EXCLUDED.extracted_text, status=EXCLUDED.status;

-- The grader gates on extraction_confidence >= 0.2 (NULL is treated as 0 → "needs manual review").
-- These essays are clean typed text, so mark them fully extracted.
UPDATE public.submissions SET extraction_confidence = 1.0 WHERE id::text LIKE '5e55%';

COMMIT;

-- Verify:
SELECT
  (SELECT name FROM public.users WHERE id = :teacher) AS teacher,
  (SELECT allow_training_on_content FROM public.privacy_settings WHERE user_id = :teacher) AS consent,
  (SELECT length(style_summary) FROM public.teacher_style_profiles WHERE user_id = :teacher) AS style_len,
  (SELECT count(*) FROM public.training_examples WHERE user_id = :teacher) AS training,
  (SELECT count(*) FROM public.classes WHERE user_id = :teacher) AS classes,
  (SELECT count(*) FROM public.assignments WHERE user_id = :teacher) AS assignments,
  (SELECT count(*) FROM public.submissions s JOIN public.assignments a ON a.id=s.assignment_id WHERE a.user_id = :teacher AND s.id LIKE '5e55%') AS seeded_submissions;

-- ── UNDO (uncomment to remove ONLY the seeded demo content) ───────────────────
-- DELETE FROM public.submissions WHERE id LIKE '5e55%';
-- DELETE FROM public.assignments WHERE id LIKE 'a5519%';
-- DELETE FROM public.classes WHERE id LIKE 'c1a55%';
-- DELETE FROM public.training_examples WHERE id LIKE '5a4a%';
-- DELETE FROM public.teacher_style_profiles WHERE user_id = :teacher;
-- (profile name/consent left as-is; reset manually if desired.)
