// Helper utility functions

/**
 * Format a date string to a readable format
 */
export const formatDate = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Format a date to include time
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Format relative time (e.g., "2 mins ago")
 */
export const formatRelativeTime = (dateString) => {
  if (!dateString) return "—";
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return formatDate(dateString);
};

/**
 * Truncate text to a max length
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

/**
 * Format file size from bytes
 */
export const formatFileSize = (bytes) => {
  if (!bytes) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

/**
 * Format a number with commas
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined) return "0";
  return num.toLocaleString();
};

/**
 * Get initials from a name
 */
export const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Capitalize first letter
 */
export const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Safely parse document tags into an array of strings
 */
export const parseTags = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  
  if (typeof tags === 'string') {
    try {
      // Check if it's a JSON array string
      if (tags.trim().startsWith('[') && tags.trim().endsWith(']')) {
        const parsed = JSON.parse(tags);
        if (Array.isArray(parsed)) return parsed.map(t => String(t).trim());
      }
    } catch (e) {
      console.warn("Failed to parse tags as JSON", e);
    }
    
    // Otherwise treat as comma-separated
    return tags.split(',').map(t => t.trim()).filter(Boolean);
  }
  
  return [];
};
