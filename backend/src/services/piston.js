import { env } from "../config/env.js";

export async function runCode({ sourceCode, language, version, stdin }) {
  const response = await fetch(env.pistonApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      language,
      version,
      files: [
        {
          content: sourceCode
        }
      ],
      stdin,
      compile_timeout: 10000,
      run_timeout: 3000,
      compile_cpu_time: 10000,
      run_cpu_time: 3000
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Piston execute failed: ${response.status} ${message}`);
  }

  return response.json();
}
