const statusMap = {
  3: "Accepted",
  5: "Time Limit Exceeded",
  6: "Compilation Error",
  11: "Runtime Error"
};

export function normalizeText(value) {
  return (value || "").replace(/\r\n/g, "\n").trimEnd();
}

export function mapJudge0Status(statusId, actualOutput, expectedOutput) {
  if (statusId === 3) {
    return normalizeText(actualOutput) === normalizeText(expectedOutput)
      ? "Accepted"
      : "Wrong Answer";
  }

  return statusMap[statusId] || "Runtime Error";
}

export function getLanguageConfig(language) {
  if (language === "python") {
    return { judge0Id: 71, monaco: "python" };
  }

  return { judge0Id: 54, monaco: "cpp" };
}
