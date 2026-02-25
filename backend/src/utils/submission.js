export function normalizeText(value) {
  return (value || "").replace(/\r\n/g, "\n").trimEnd();
}

export function mapExecutionVerdict(result, actualOutput, expectedOutput) {
  if (!result || !result.run) {
    return "Judge Error";
  }

  if (result.run.status === "TO") {
    return "Time Limit Exceeded";
  }

  if (result.compile && (result.compile.code !== 0 || result.compile.status)) {
    return "Compilation Error";
  }

  if (result.run.code !== 0 || result.run.signal || result.run.status === "RE" || result.run.status === "SG") {
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

export function getLanguageConfig(language) {
  if (language === "python") {
    return { executorLanguage: "python", version: "3.10.0", monaco: "python" };
  }

  return { executorLanguage: "c++", version: "10.2.0", monaco: "cpp" };
}
