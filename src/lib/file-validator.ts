export const FILE_CONFIG = {
  MAX_SIZE: 2 * 1024 * 1024, // Maksimal 2MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'application/pdf'],
};

export function validateFile(file: File) {
  if (file.size > FILE_CONFIG.MAX_SIZE) {
    return { valid: false, error: "Ukuran file maksimal 2MB" };
  }
  if (!FILE_CONFIG.ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: "Format file harus JPG, PNG, atau PDF" };
  }
  return { valid: true };
}