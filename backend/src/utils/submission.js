export function normalizeText(value) {
  return (value || "").replace(/\r\n/g, "\n").trimEnd();
}

function includesAny(value, patterns) {
  const haystack = String(value || "").toLowerCase();
  return patterns.some((pattern) => haystack.includes(pattern));
}

export function mapExecutionVerdict(result, expectedOutput) {
  const actualOutput = getResultOutput(result);
  const normalizedActual = normalizeText(actualOutput);
  const normalizedExpected = normalizeText(expectedOutput);
  const statusText = [
    result.error,
    result.message,
    result.stderr,
    result.compileError,
    result.compiler_error,
    result.compilation_error,
    result.status,
    result.result,
    result.verdict
  ]
    .filter(Boolean)
    .join(" ");

  if (normalizedActual === normalizedExpected) {
    return "Accepted";
  }

  if (includesAny(statusText, ["judge", "callback", "service unavailable", "internal server error"])) {
    return "Judge Error";
  }

  if (result.compileError || result.compiler_error || result.compilation_error) {
    return "Compilation Error";
  }

  if (result.timeout || result.timedOut || result.time_limit_exceeded || includesAny(statusText, ["time limit", "timeout"])) {
    return "Time Limit Exceeded";
  }

  if (includesAny(statusText, ["memory limit", "out of memory", "memory exceeded"])) {
    return "Memory Limit Exceeded";
  }

  if (includesAny(statusText, ["output limit", "too much output"])) {
    return "Output Limit Exceeded";
  }

  if (result.error || result.runtimeError || result.stderr) {
    return "Runtime Error";
  }

  return "Wrong Answer";
}

export function getResultOutput(result) {
  if (typeof result.output === "string" && result.output.length > 0) {
    return result.output;
  }

  if (typeof result.stdout === "string" && result.stdout.length > 0) {
    return result.stdout;
  }

  if (typeof result.response === "string" && result.response.length > 0) {
    return result.response;
  }

  if (typeof result.compileError === "string" && result.compileError.length > 0) {
    return result.compileError;
  }

  if (typeof result.compiler_error === "string" && result.compiler_error.length > 0) {
    return result.compiler_error;
  }

  if (typeof result.stderr === "string" && result.stderr.length > 0) {
    return result.stderr;
  }

  if (typeof result.error === "string" && result.error.length > 0) {
    return result.error;
  }

  if (typeof result.message === "string" && result.message.length > 0) {
    return result.message;
  }

  return "";
}

export function getLanguageConfig(language) {
  if (language === "python") {
    return { compiler: "python-3.9.7", monaco: "python" };
  }

  return { compiler: "g++-4.9", monaco: "cpp" };
}

export function getExecutionMetrics(result) {
  const timeMs = Math.round(
    Number(result.cpuTime || result.executionTime || result.time || result.elapsedTime || 0) * 1000
  );
  const memoryKb = Number(result.memory || result.memoryKb || result.memory_usage || 0);

  return {
    timeMs: Number.isFinite(timeMs) ? timeMs : 0,
    memoryKb: Number.isFinite(memoryKb) ? memoryKb : 0
  };
}

export function parseCallbackResult(payload) {
  const base = payload?.data && typeof payload.data === "object" ? payload.data : payload;

  return {
    output:
      base?.output ??
      base?.stdout ??
      base?.response ??
      "",
    stderr:
      base?.stderr ??
      "",
    error:
      base?.error ??
      base?.message ??
      "",
    compileError:
      base?.compileError ??
      base?.compiler_error ??
      base?.compilation_error ??
      "",
    cpuTime:
      base?.cpuTime ??
      base?.executionTime ??
      base?.time ??
      base?.elapsedTime ??
      0,
    memory:
      base?.memory ??
      base?.memoryKb ??
      base?.memory_usage ??
      0,
    raw: payload
  };
}
