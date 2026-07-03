// Form validation utilities

export const validateRequired = (value, fieldName = "This field") => {
  if (!value || (typeof value === "string" && value.trim() === "")) {
    return `${fieldName} is required`;
  }
  return "";
};

export const validateEmail = (email) => {
  if (!email) return "Email is required";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Please enter a valid email";
  return "";
};

export const validatePassword = (password) => {
  if (!password) return "Password is required";
  if (password.length < 6) return "Password must be at least 6 characters";
  return "";
};

export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return "Please confirm your password";
  if (password !== confirmPassword) return "Passwords do not match";
  return "";
};

export const validateMinLength = (value, minLength, fieldName = "This field") => {
  if (!value) return `${fieldName} is required`;
  if (value.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters`;
  }
  return "";
};

/**
 * Validate a file for upload
 */
export const validateFile = (file) => {
  if (!file) return "";
  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];
  if (!allowedTypes.includes(file.type)) {
    return "Only PDF, DOCX, and TXT files are allowed";
  }
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    return "File size must be less than 50MB";
  }
  return "";
};
