import crypto from 'crypto'

const ALGO = 'aes-256-gcm'

function getKey(): Buffer {
  const hex = process.env.STORY_ENCRYPTION_KEY
  if (!hex || hex.length !== 64) {
    throw new Error('STORY_ENCRYPTION_KEY must be a 32-byte hex string (64 chars)')
  }
  return Buffer.from(hex, 'hex')
}

export interface EncryptedPayload {
  iv: string    // hex
  tag: string   // hex (GCM auth tag)
  data: string  // base64 ciphertext
}

export function encryptStory(plaintext: string): EncryptedPayload {
  const key = getKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGO, key, iv)

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()

  return {
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    data: encrypted.toString('base64'),
  }
}

export function decryptStory(payload: EncryptedPayload): string {
  const key = getKey()
  const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(payload.iv, 'hex'))
  decipher.setAuthTag(Buffer.from(payload.tag, 'hex'))

  return Buffer.concat([
    decipher.update(Buffer.from(payload.data, 'base64')),
    decipher.final(),
  ]).toString('utf8')
}
