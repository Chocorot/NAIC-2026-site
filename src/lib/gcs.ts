import { Storage, Bucket } from '@google-cloud/storage';
import path from 'path';

/**
 * Interface for GCS upload results
 */
export interface GCSUploadResult {
  fileName: string;
  bucketPath: string;
  publicUrl: string;
}

/**
 * Interface for GCS Credentials
 */
interface GCSConfig {
  bucketName: string;
  keyFilename: string;
  projectId?: string;
}

const config: GCSConfig = {
  bucketName: process.env.GCS_BUCKET_NAME || '',
  keyFilename: path.join(/*turbopackIgnore: true*/ process.cwd(), process.env.GCS_KEY_PATH || 'service-account.json'),
};

let storage: Storage | null = null;
let bucket: Bucket | null = null;

/**
 * Initialize GCS storage and bucket singleton
 */
function getGCSContext(): { storage: Storage; bucket: Bucket } {
  if (!storage || !bucket) {
    if (!config.bucketName) {
      throw new Error('GCS_BUCKET_NAME environment variable is not defined.');
    }

    storage = new Storage({
      keyFilename: config.keyFilename,
    });
    bucket = storage.bucket(config.bucketName);
  }

  return { storage, bucket };
}

/**
 * Uploads a buffer to Google Cloud Storage
 */
export async function uploadToGCS(
  buffer: Buffer,
  destination: string,
  contentType: string
): Promise<GCSUploadResult> {
  const { bucket } = getGCSContext();
  const file = bucket.file(destination);

  await file.save(buffer, {
    metadata: { contentType },
    resumable: false,
  });

  return {
    fileName: path.basename(destination),
    bucketPath: destination,
    publicUrl: `https://storage.googleapis.com/${config.bucketName}/${destination}`,
  };
}

/**
 * Generates a signed URL for a file in GCS
 * Useful for private buckets (recommended for medical data)
 */
export async function getSignedUrl(
  fileName: string,
  expiresInMinutes: number = 60
): Promise<string> {
  const { bucket } = getGCSContext();
  const file = bucket.file(fileName);

  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + expiresInMinutes * 60 * 1000,
  });

  return url;
}

/**
 * Deletes a file from GCS
 */
export async function deleteFromGCS(fileName: string): Promise<void> {
  const { bucket } = getGCSContext();
  const file = bucket.file(fileName);
  await file.delete();
}
