INSERT INTO contests (title, description, starts_at, ends_at)
VALUES
  (
    'Weekly Contest 1',
    'Three quick warm-up problems with standard implementation and graph practice.',
    NOW() + INTERVAL '1 day',
    NOW() + INTERVAL '1 day 2 hours'
  )
ON CONFLICT DO NOTHING;

INSERT INTO problems
  (slug, title, description, constraints, input_format, output_format, sample_input, sample_output, explanation, difficulty, tags)
VALUES
  (
    'a-plus-b',
    'A + B',
    'Given two integers A and B, print their sum.',
    '1 <= A, B <= 10^9',
    'A single line containing two integers A and B.',
    'Print A + B.',
    '2 5',
    '7',
    'Read two integers and output their sum.',
    800,
    ARRAY['math', 'implementation']
  ),
  (
    'maximum-of-n',
    'Maximum of N',
    'Given N integers, output the largest value.',
    '1 <= N <= 2 * 10^5',
    'First line contains N. Second line contains N integers.',
    'Print the maximum integer.',
    '5\n3 9 1 4 2',
    '9',
    'Track the maximum while scanning the array.',
    900,
    ARRAY['arrays', 'implementation']
  )
ON CONFLICT (slug) DO NOTHING;

INSERT INTO problem_test_cases (problem_id, input, expected_output, is_sample, sort_order)
SELECT p.id, t.input, t.expected_output, t.is_sample, t.sort_order
FROM (
  VALUES
    ('a-plus-b', '2 5', '7', TRUE, 0),
    ('a-plus-b', '100 250', '350', FALSE, 1),
    ('maximum-of-n', '5\n3 9 1 4 2', '9', TRUE, 0),
    ('maximum-of-n', '6\n-10 -4 -30 -1 -7 -2', '-1', FALSE, 1)
) AS t(slug, input, expected_output, is_sample, sort_order)
JOIN problems p ON p.slug = t.slug
WHERE NOT EXISTS (
  SELECT 1
  FROM problem_test_cases existing
  WHERE existing.problem_id = p.id
    AND existing.sort_order = t.sort_order
);

INSERT INTO contest_problems (contest_id, problem_id, problem_order)
SELECT c.id, p.id, mapping.problem_order
FROM (
  VALUES
    ('Weekly Contest 1', 'a-plus-b', 0),
    ('Weekly Contest 1', 'maximum-of-n', 1)
) AS mapping(contest_title, problem_slug, problem_order)
JOIN contests c ON c.title = mapping.contest_title
JOIN problems p ON p.slug = mapping.problem_slug
ON CONFLICT DO NOTHING;
