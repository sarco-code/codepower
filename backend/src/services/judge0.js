import { env } from "../config/env.js";

function getHeaders() {
  const headers = {
    "Content-Type": "application/json"
  };

  if (env.judge0ApiKey) {
    headers["X-RapidAPI-Key"] = env.judge0ApiKey;
  }

  if (env.judge0ApiHost) {
    headers["X-RapidAPI-Host"] = env.judge0ApiHost;
  }

  return headers;
}

export async function runCode({ sourceCode, languageId, stdin, expectedOutput }) {
  const createResponse = await fetch(
    `${env.judge0ApiUrl}/submissions?base64_encoded=false&wait=true&fields=status_id,stdout,stderr,compile_output,message,time,memory`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        source_code: sourceCode,
        language_id: languageId,
        stdin,
        expected_output: expectedOutput
      })
    }
  );

  if (!createResponse.ok) {
    const message = await createResponse.text();
    throw new Error(`Judge0 create submission failed: ${message}`);
  }

  return createResponse.json();
}
