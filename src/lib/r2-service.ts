import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Config, validateR2Config, generateFileKey, getPublicUrl } from './r2-config';
import { log, trackError, PerformanceMonitor } from './logger';

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

export interface MediaFile {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

class R2Service {
  private client: S3Client | null = null;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    if (!validateR2Config()) {
      console.error('R2 configuration is incomplete');
      return;
    }

    this.client = new S3Client({
      region: r2Config.region,
      endpoint: r2Config.endpoint,
      credentials: {
        accessKeyId: r2Config.accessKeyId,
        secretAccessKey: r2Config.secretAccessKey,
      },
      forcePathStyle: true, // Required for R2
    });
  }

  async uploadFile(file: MediaFile, prefix: string = 'media'): Promise<UploadResult> {
    if (!this.client) {
      log.error('R2 client not initialized', 'R2Service');
      return { success: false, error: 'R2 client not initialized' };
    }

    log.info(`Starting file upload: ${file.name}`, 'R2Service', {
      size: file.size,
      type: file.type
    });

    try {
      return await PerformanceMonitor.measureAsync('r2-upload', async () => {
        // Generate unique key for the file
        const key = generateFileKey(file.name, prefix);
        log.debug(`Generated file key: ${key}`, 'R2Service');

      // Read file content - use different approach for React Native
      const response = await fetch(file.uri);

      // For React Native, we need to handle the response differently
      let body: Uint8Array;

      try {
        // Try web approach first
        const buffer = await response.arrayBuffer();
        body = new Uint8Array(buffer);
      } catch (error) {
        // Fallback for React Native - use blob and convert to base64
        try {
          const blob = await response.blob();

          // Use a different approach for React Native
          const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              // Remove data URL prefix (data:image/jpeg;base64,)
              const base64 = result.split(',')[1];
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          // Convert base64 to Uint8Array
          const binaryString = atob(base64Data);
          body = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            body[i] = binaryString.charCodeAt(i);
          }
        } catch (blobError) {
          // Final fallback - read as text and convert
          const text = await response.text();
          body = new TextEncoder().encode(text);
        }
      }

      // Upload to R2
      const command = new PutObjectCommand({
        Bucket: r2Config.bucketName,
        Key: key,
        Body: body,
        ContentType: file.type,
        ContentLength: body.byteLength,
      });

        await this.client.send(command);

        // Return success with public URL
        const url = getPublicUrl(key);
        log.info(`File uploaded successfully: ${key}`, 'R2Service', { url });
        return { success: true, url, key };
      });

    } catch (error) {
      trackError(error as Error, 'R2Service', {
        fileName: file.name,
        fileSize: file.size
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  async deleteFile(key: string): Promise<boolean> {
    if (!this.client) {
      log.error('R2 client not initialized', 'R2Service');
      return false;
    }

    log.info(`Deleting file: ${key}`, 'R2Service');

    try {
      const command = new DeleteObjectCommand({
        Bucket: r2Config.bucketName,
        Key: key,
      });

      await this.client.send(command);
      log.info(`File deleted successfully: ${key}`, 'R2Service');
      return true;

    } catch (error) {
      console.error('Delete failed:', error);
      return false;
    }
  }

  async fileExists(key: string): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      const command = new HeadObjectCommand({
        Bucket: r2Config.bucketName,
        Key: key,
      });

      await this.client.send(command);
      return true;

    } catch (error) {
      return false;
    }
  }

  // Upload multiple files
  async uploadFiles(files: MediaFile[], prefix: string = 'media'): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    
    for (const file of files) {
      const result = await this.uploadFile(file, prefix);
      results.push(result);
    }

    return results;
  }

  // Extract key from URL
  extractKeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.substring(1); // Remove leading slash
    } catch {
      return null;
    }
  }

  // Generate signed URL for reading files (for private buckets)
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string | null> {
    if (!this.client) {
      console.error('R2 client not initialized');
      return null;
    }

    try {
      const command = new GetObjectCommand({
        Bucket: r2Config.bucketName,
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.client, command, { expiresIn });
      return signedUrl;
    } catch (error) {
      console.error('Failed to generate signed URL:', error);
      return null;
    }
  }

  // Get accessible URL (signed URL for private buckets, public URL for public buckets)
  async getAccessibleUrl(key: string): Promise<string | null> {
    // For now, always use signed URLs since the bucket appears to be private
    return this.getSignedUrl(key);
  }
}

// Export singleton instance
export const r2Service = new R2Service();
export default r2Service;
