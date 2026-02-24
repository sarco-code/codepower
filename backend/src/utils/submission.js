const statusMap = {
  3: "Accepted",
  4: "Wrong Answer",
  5: "Time Limit Exceeded",
  6: "Compilation Error",
  7: "Runtime Error",
  8: "Runtime Error",
  9: "Runtime Error",
  10: "Runtime Error",
  11: "Runtime Error",
  12: "Runtime Error",
  13: "Judge Error",
  14: "Judge Error"
};

export function normalizeText(value) {
  return (value || "").replace(/\r\n/g, "\n").trimEnd();
}

export function mapJudge0Status(statusId, actualOutput, expectedOutput) {
  if (statusId === 3 || statusId === 4) {
    return normalizeText(actualOutput) === normalizeText(expectedOutput)
      ? "Accepted"
      : "Wrong Answer";
  }

  return statusMap[statusId] || "Runtime Error";
}

export function getResultOutput(result) {
  if (typeof result.stdout === "string" && result.stdout.length > 0) {
    return result.stdout;
  }

  if (typeof result.compile_output === "string" && result.compile_output.length > 0) {
    return result.compile_output;
  }

  if (typeof result.stderr === "string" && result.stderr.length > 0) {
    return result.stderr;
  }

  if (typeof result.message === "string" && result.message.length > 0) {
    return result.message;
  }

  return "";
}

export function getLanguageConfig(language) {
  if (language === "python") {
    return { judge0Id: 71, monaco: "python" };
  }

  return { judge0Id: 54, monaco: "cpp" };
}
