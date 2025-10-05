/**
 * Generates a cryptographically secure 6-character pairing code
 * Format: Alphanumeric (excluding similar-looking characters like 0/O, 1/I/L)
 * Character set: 2-9, A-H, J-N, P-Z (32 characters)
 * Entropy: 32^6 = ~1 billion combinations
 */
export const generatePairingCode = (): string => {
  // Exclude visually similar characters to avoid confusion
  const charset = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const codeLength = 6;
  
  const randomValues = new Uint8Array(codeLength);
  crypto.getRandomValues(randomValues);
  
  let code = '';
  for (let i = 0; i < codeLength; i++) {
    code += charset[randomValues[i] % charset.length];
  }
  
  return code;
};

/**
 * Validates a pairing code format
 */
export const isValidPairingCode = (code: string): boolean => {
  const pattern = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/;
  return pattern.test(code.toUpperCase());
};

/**
 * Formats a pairing code for display (adds spaces)
 * Example: "K7X9M2" -> "K7X 9M2"
 */
export const formatPairingCode = (code: string): string => {
  if (code.length !== 6) return code;
  return `${code.slice(0, 3)} ${code.slice(3)}`;
};
