export function normalizeText(value) {
  return (value || "").replace(/\r\n/g, "\n").trimEnd();
}

export function mapExecutionVerdict(result, actualOutput, expectedOutput) {
  if (!result || typeof result !== "object") {
    return "Judge Error";
  }

  if (result.status && String(result.status).toLowerCase() !== "success") {
    return "Judge Error";
  }

  if (String(result.error || "").trim().length > 0) {
    const errorText = String(result.error).toLowerCase();

    if (errorText.includes("time limit") || errorText.includes("timeout")) {
      return "Time Limit Exceeded";
    }

    if (errorText.includes("compile") || errorText.includes("compilation")) {
      return "Compilation Error";
    }

    return "Runtime Error";
  }

  if (String(result.signal || "").trim().length > 0) {
    return "Runtime Error";
  }

  if (Number(result.exit_code) !== 0 && result.exit_code !== null && result.exit_code !== undefined) {
    return "Runtime Error";
  }

  if (normalizeText(actualOutput).startsWith("time limit exceeded")) {
    return "Time Limit Exceeded";
  }

  if (looksLikeCompilationError(actualOutput)) {
    return "Compilation Error";
  }

  if (looksLikeRuntimeError(actualOutput)) {
    return "Runtime Error";
  }

  return normalizeText(actualOutput) === normalizeText(expectedOutput)
    ? "Accepted"
    : "Wrong Answer";
}

function looksLikeRuntimeError(output) {
  const text = normalizeText(output).toLowerCase();
  return [
    "traceback",
    "exception in thread",
    "segmentation fault",
    "floating point exception",
    "runtime error",
    "zerodivisionerror",
    "indexerror",
    "keyerror",
    "typeerror",
    "valueerror",
    "syntax error"
  ].some((pattern) => text.includes(pattern));
}

function looksLikeCompilationError(output) {
  const text = normalizeText(output).toLowerCase();
  return [
    "error:",
    "compilation failed",
    "undefined reference",
    "expected ';'",
    "syntaxerror",
    "nameerror"
  ].some((pattern) => text.includes(pattern));
}

export function getLanguageConfig(language) {
  if (language === "python") {
    return { compiler: "python-3.9.7", monaco: "python" };
  }

  return { compiler: "g++-4.9", monaco: "cpp" };
}
