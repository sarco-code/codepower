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

export async function runCode({ sourceCode, languageId, stdin }) {
  const createResponse = await fetch(
    `${env.judge0ApiUrl}/submissions?base64_encoded=false&wait=false`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        source_code: sourceCode,
        language_id: languageId,
        stdin
      })
    }
  );

  if (!createResponse.ok) {
    const message = await createResponse.text();
    throw new Error(`Judge0 create submission failed: ${message}`);
  }

  const { token } = await createResponse.json();

  for (let attempt = 0; attempt < 15; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const resultResponse = await fetch(
      `${env.judge0ApiUrl}/submissions/${token}?base64_encoded=false&fields=status_id,stdout,stderr,compile_output,message,time,memory`,
      {
        headers: getHeaders()
      }
    );

    if (!resultResponse.ok) {
      const message = await resultResponse.text();
      throw new Error(`Judge0 fetch result failed: ${message}`);
    }

    const result = await resultResponse.json();

    if (result.status_id > 2) {
      return result;
    }
  }

  return {
    status_id: 5,
    stdout: "",
    stderr: "Execution timed out while polling Judge0.",
    compile_output: "",
    message: "",
    time: null,
    memory: null
  };
}
