import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.AWS_REGION || "us-east-1";
const bucket = process.env.S3_BUCKET_RESOURCES;

const s3 =
  process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? new S3Client({
        region,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      })
    : null;

export function isS3Configured(): boolean {
  return Boolean(bucket && s3);
}

export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600
): Promise<string | null> {
  if (!s3 || !bucket) return null;
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, command, { expiresIn });
}

export async function getPresignedDownloadUrl(
  key: string,
  expiresIn = 600,
  filename?: string
): Promise<string | null> {
  if (!s3 || !bucket) return null;
  const name = (filename ?? key.split("/").pop() ?? "download").replace(/"/g, "");
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${name}"`,
  });
  return getSignedUrl(s3, command, { expiresIn });
}

/** Presigned URL for preview (inline, opens in browser). */
export async function getPresignedPreviewUrl(
  key: string,
  expiresIn = 600
): Promise<string | null> {
  if (!s3 || !bucket) return null;
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ResponseContentDisposition: "inline",
  });
  return getSignedUrl(s3, command, { expiresIn });
}
