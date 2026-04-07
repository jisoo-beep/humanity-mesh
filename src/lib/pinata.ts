import { PinataSDK } from 'pinata'

export const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.PINATA_GATEWAY!,
})

/**
 * 파일을 IPFS에 업로드하고 public gateway URL을 반환합니다.
 */
export async function uploadFileToIPFS(file: File): Promise<string> {
  const result = await pinata.upload.public.file(file)
  const url = await pinata.gateways.public.convert(result.cid)
  return url
}

/**
 * JSON 데이터를 IPFS에 업로드하고 CID를 반환합니다.
 */
export async function uploadJSONToIPFS(data: object): Promise<string> {
  const result = await pinata.upload.public.json(data)
  return result.cid
}

/**
 * CID로 public gateway URL을 조회합니다.
 */
export async function getIPFSUrl(cid: string): Promise<string> {
  return pinata.gateways.public.convert(cid)
}
