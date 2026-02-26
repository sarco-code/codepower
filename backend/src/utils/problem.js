export function aggregateProblem(problemRow, testCaseRows = []) {
  return {
    id: problemRow.id,
    slug: problemRow.slug,
    title: problemRow.title,
    difficulty: problemRow.difficulty,
    tags: problemRow.tags || [],
    constraints: problemRow.constraints,
    description: problemRow.description,
    inputFormat: problemRow.input_format,
    outputFormat: problemRow.output_format,
    sampleInput: problemRow.sample_input,
    sampleOutput: problemRow.sample_output,
    explanation: problemRow.explanation,
    createdAt: problemRow.created_at,
    updatedAt: problemRow.updated_at,
    testCases: testCaseRows.map((row) => ({
      id: row.id,
      input: row.input,
      expectedOutput: row.expected_output,
      isSample: row.is_sample,
      sampleType: row.sample_type || "worked",
      sortOrder: row.sort_order
    }))
  };
}
