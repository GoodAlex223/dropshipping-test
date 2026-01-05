import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || "";
const CDN_URL = process.env.AWS_CLOUDFRONT_URL || `https://${BUCKET_NAME}.s3.amazonaws.com`;

export interface PresignedUploadResult {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

export async function getPresignedUploadUrl(
  filename: string,
  contentType: string,
  folder: string = "products"
): Promise<PresignedUploadResult> {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const key = `${folder}/${timestamp}-${sanitizedFilename}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 minutes

  const publicUrl = `${CDN_URL}/${key}`;

  return { uploadUrl, publicUrl, key };
}

export async function deleteFromS3(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

export function getKeyFromUrl(url: string): string | null {
  try {
    const cdnUrl = CDN_URL.replace(/\/$/, "");
    if (url.startsWith(cdnUrl)) {
      return url.replace(`${cdnUrl}/`, "");
    }

    // Handle S3 URLs
    const s3Pattern = new RegExp(`https?://${BUCKET_NAME}\\.s3[^/]*\\.amazonaws\\.com/(.+)`);
    const match = url.match(s3Pattern);
    if (match) {
      return match[1];
    }

    return null;
  } catch {
    return null;
  }
}

export { s3Client, BUCKET_NAME };
