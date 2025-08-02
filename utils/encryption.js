const crypto = require("crypto");

const ENCRYPTION_KEY = crypto.createHash("sha256").update("bookish_secret_key").digest(); 
const IV = Buffer.alloc(16, 0); 

const encrypt = (text) => {
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, IV);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
};

const decrypt = (encrypted) => {
  try {
    if (!/^[0-9a-f]+$/i.test(encrypted) || encrypted.length % 2 !== 0) {
      throw new Error("Invalid encrypted string");
    }
    const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, IV);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("Decryption failed:", error.message);
    return null;
  }
};

module.exports = { encrypt, decrypt };
// sdsdsasadsadadssdsdadsadadsa