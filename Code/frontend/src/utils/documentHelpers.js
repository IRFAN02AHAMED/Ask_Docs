export const formatTokenCount = (count) => {
  if (!count && count !== 0) return "N/A";
  if (count >= 1000) return `~${(count / 1000).toFixed(1)}k`;
  return `~${count}`;
};

export const getConfidenceBadge = (score, answerText) => {
  const s = parseFloat(score || 0);

  const isFallback =
    answerText?.toLowerCase().includes("could not find enough information") ||
    answerText?.toLowerCase().includes("no chunks found") ||
    answerText?.toLowerCase().includes("please process or publish");

  if (isFallback) {
    return {
      label: "Low",
      color: "#EF4444",
      bg: "#FEE2E2",
      border: "#FECACA",
    };
  }

  if (s >= 0.8) {
    return {
      label: "High",
      color: "#16A34A",
      bg: "#DCFCE7",
      border: "#86EFAC",
    };
  }

  if (s >= 0.5) {
    return {
      label: "Medium",
      color: "#D97706",
      bg: "#FEF3C7",
      border: "#FDE68A",
    };
  }

  return {
    label: "Low",
    color: "#EF4444",
    bg: "#FEE2E2",
    border: "#FECACA",
  };
};

export const parseDocumentStatus = (rawStatus) => {
  const statusStr =
    typeof rawStatus === "object" && rawStatus !== null
      ? rawStatus.status_name || rawStatus.name
      : rawStatus;
  return String(statusStr || "").toLowerCase();
};

export const getVersionLabel = (currentVersion, doc) => {
  return currentVersion?.version_label ||
    (currentVersion?.version_no ? `v${currentVersion.version_no}.0` : null) ||
    (doc?.current_version_no ? `v${doc.current_version_no}.0` : "N/A");
};
