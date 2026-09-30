import crypto from 'crypto'

const ALGO = 'aes-256-gcm'

function getMasterKey(): Buffer {
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

function seal(key: Buffer, plaintext: Buffer): EncryptedPayload {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()])
  return {
    iv: iv.toString('hex'),
    tag: cipher.getAuthTag().toString('hex'),
    data: encrypted.toString('base64'),
  }
}

function open(key: Buffer, payload: EncryptedPayload): Buffer {
  const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(payload.iv, 'hex'))
  decipher.setAuthTag(Buffer.from(payload.tag, 'hex'))
  return Buffer.concat([decipher.update(Buffer.from(payload.data, 'base64')), decipher.final()])
}

// 봉투 암호화: 스토리마다 새 데이터 키로 본문을 잠그고, 데이터 키는 마스터키로 잠가 DB에만 둔다.
// DB의 wrappedKey를 지우면 IPFS에 남은 암호문은 영구히 복호화할 수 없다.
export function encryptStory(plaintext: string): { payload: EncryptedPayload; wrappedKey: string } {
  const dataKey = crypto.randomBytes(32)
  const payload = seal(dataKey, Buffer.from(plaintext, 'utf8'))
  const { iv, tag, data } = seal(getMasterKey(), dataKey)
  return { payload, wrappedKey: `${iv}:${tag}:${data}` }
}

export function decryptStory(payload: EncryptedPayload, wrappedKey: string): string {
  const [iv, tag, data] = wrappedKey.split(':')
  const dataKey = open(getMasterKey(), { iv, tag, data })
  return open(dataKey, payload).toString('utf8')
}
