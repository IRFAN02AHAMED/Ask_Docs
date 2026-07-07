export const markdownToPlainText = (text = "") => {
  if (!text) return "";

  return String(text)
    .replace(/```[\s\S]*?```/g, (match) =>
      match.replace(/```[a-zA-Z]*\n?/g, "").replace(/```/g, "")
    )
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};
