import { env } from "../config/env.js";

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

export async function runCode({ sourceCode, compiler, stdin }) {
  const url = trimTrailingSlash(env.onlineCompilerApiUrl);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: env.onlineCompilerApiKey
    },
    body: JSON.stringify({
      code: sourceCode,
      compiler,
      input: stdin || ""
    })
  });

  const text = await response.text();
  let payload = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { raw: text };
  }

  if (!response.ok) {
    throw new Error(
      `OnlineCompiler execute failed: ${response.status} ${typeof payload === "string" ? payload : JSON.stringify(payload)}`
    );
  }

  return payload;
}
