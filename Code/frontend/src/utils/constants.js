// Application-wide constants

export const APP_NAME = "Ask Docs";
export const APP_SUBTITLE = "AI Document Q&A";

// Roles
export const ROLES = {
  ADMIN: "admin",
  EDITOR: "editor",
  VIEWER: "viewer",
};

// Document statuses
export const DOC_STATUSES = {
  PENDING: "pending",
  PROCESSING: "processing",
  PROCESSED: "processed",
  PUBLISHED: "published",
  FAILED: "failed",
  ARCHIVED: "archived",
};

// Status color mapping for StatusChip
export const STATUS_COLORS = {
  pending: { bg: "#FEF3C7", text: "#92400E" },
  processing: { bg: "#DBEAFE", text: "#1E40AF" },
  processed: { bg: "#E0E7FF", text: "#3730A3" },
  published: { bg: "#F0FDF4", text: "#166534" },
  failed: { bg: "#FEE2E2", text: "#991B1B" },
  archived: { bg: "#F3F4F6", text: "#374151" },
};

// Validation statuses
export const VALIDATION_STATUSES = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE = 1;

// Sidebar width
export const SIDEBAR_WIDTH = 260;
export const TOPBAR_HEIGHT = 64;
