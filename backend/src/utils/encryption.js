import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';

// Helper to get 32-byte key from JWT_SECRET
const getSecretKey = () => {
    const secret = process.env.JWT_SECRET || 'mano_attendance_system_default_key_string_32_bytes';
    // Hashing it guarantees a 32-byte buffer
    return crypto.createHash('sha256').update(secret).digest();
};

/**
 * Encrypts cleartext using AES-256-CBC.
 * Returns a string format of `ivHex:encryptedHex`.
 */
export const encryptText = (text) => {
    if (text === null || text === undefined) return text;
    
    const key = getSecretKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(String(text), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
};

/**
 * Decrypts text. If the text is not in the format `ivHex:encryptedHex` 
 * or decryption fails, it returns the input text as-is to preserve backward compatibility.
 */
export const decryptText = (encryptedText) => {
    if (!encryptedText) return encryptedText;
    
    try {
        const parts = String(encryptedText).split(':');
        
        // IV of 16 bytes is exactly 32 hex chars.
        if (parts.length === 2 && parts[0].length === 32 && /^[0-9a-fA-F]+$/.test(parts[0]) && /^[0-9a-fA-F]+$/.test(parts[1])) {
            const key = getSecretKey();
            const iv = Buffer.from(parts[0], 'hex');
            const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
            
            let decrypted = decipher.update(parts[1], 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        }
        return encryptedText; // Fallback for legacy plain text
    } catch (e) {
        // Fallback for legacy plain text or failed decryption
        return encryptedText;
    }
};
