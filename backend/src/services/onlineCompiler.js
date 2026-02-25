import { env } from "../config/env.js";

export async function runCode({ sourceCode, compiler, stdin }) {
  const url = env.onlineCompilerApiUrl.replace(/\/+$/, "");
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "*/*",
      Authorization: env.onlineCompilerApiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      code: sourceCode,
      input: stdin,
      compiler
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`OnlineCompiler execute failed: ${response.status} ${message}`);
  }

  return response.json();
}
