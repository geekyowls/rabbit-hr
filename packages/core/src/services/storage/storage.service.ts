import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  PutObjectCommandOutput,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Storage } from '@google-cloud/storage';
import { Readable } from 'stream';
import { URL } from 'url';
import * as path from 'path';
import * as fs from 'fs';
import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';

import { NonExistingFileError } from './non-existing-file.error';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/heic',
  'image/heif',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/csv',
  'text/plain',
]);

function validateContentType(contentType: string): void {
  if (!contentType) {
    throw new BadRequestException('Content type is required');
  }

  const normalizedType = contentType.toLowerCase().split(';')[0].trim();

  if (!ALLOWED_MIME_TYPES.has(normalizedType)) {
    throw new BadRequestException(
      `Content type "${contentType}" is not allowed. Allowed types: images (jpeg, png, gif, webp, svg), documents (pdf, xlsx, xls, docx, doc, csv, txt)`,
    );
  }
}

export interface IFilePath {
  path: string;
  name: string;
}

export abstract class StorageService {
  abstract getSignedUrl(
    key: string,
    contentType: string,
  ): Promise<{
    signedUrl: string;
    path: string;
    additionalHeaders?: Record<string, string>;
  }>;
  abstract getReadSignedUrl(key: string): Promise<{
    signedUrl: string;
    path: string;
  }>;
  abstract uploadFile(
    key: string,
    file: Buffer,
    contentType: string,
  ): Promise<PutObjectCommandOutput>;
  abstract uploadStream(
    key: string,
    stream: Readable,
    contentType: string,
  ): Promise<PutObjectCommandOutput>;
  abstract getFile(key: string): Promise<Buffer>;
  abstract deleteFile(key: string): Promise<void>;
  abstract fileExists(key: string): Promise<boolean>;
  abstract headObject(key: string): Promise<{
    contentType: string;
    contentLength: number;
  }>;
}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  return await new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}
export class S3StorageService implements StorageService {
  private s3 = new S3Client({
    region: process.env.S3_REGION as string,
    endpoint: process.env.S3_ENDPOINT as string,
    forcePathStyle: true,
  });

  async uploadFile(
    key: string,
    file: Buffer,
    contentType: string,
  ): Promise<PutObjectCommandOutput> {
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
    });

    return await this.s3.send(command);
  }

  async uploadStream(
    key: string,
    stream: Readable,
    contentType: string,
  ): Promise<PutObjectCommandOutput> {
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: stream,
      ContentType: contentType,
    });

    return await this.s3.send(command);
  }

  async getFile(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
      });
      const data = await this.s3.send(command);
      const bodyContents = await streamToBuffer(data.Body as Readable);

      return bodyContents as unknown as Buffer;
    } catch (error: any) {
      if (
        error.code === 'NoSuchKey' ||
        error.message === 'The specified key does not exist.'
      ) {
        throw new NonExistingFileError();
      }

      throw error;
    }
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
    });
    await this.s3.send(command);
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
      });
      await this.s3.send(command);
      return true;
    } catch (error: any) {
      if (
        error.code === 'NoSuchKey' ||
        error.message === 'The specified key does not exist.'
      ) {
        return false;
      }
      throw error;
    }
  }

  async headObject(
    key: string,
  ): Promise<{ contentType: string; contentLength: number }> {
    try {
      const command = new HeadObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
      });
      const response = await this.s3.send(command);
      return {
        contentType: response.ContentType || '',
        contentLength: response.ContentLength || 0,
      };
    } catch (error: any) {
      if (
        error.code === 'NoSuchKey' ||
        error.name === 'NotFound' ||
        error.$metadata?.httpStatusCode === 404
      ) {
        throw new NonExistingFileError();
      }
      throw error;
    }
  }

  async getSignedUrl(key: string, contentType: string) {
    validateContentType(contentType);

    const command = new PutObjectCommand({
      Key: key,
      Bucket: process.env.S3_BUCKET_NAME,
      ACL: 'public-read',
      ContentType: contentType,
    });

    const signedUrl = await getSignedUrl(this.s3, command, { expiresIn: 3600 });
    const parsedUrl = new URL(signedUrl);
    const path = process.env.CDN_URL
      ? `${process.env.CDN_URL}/${key}`
      : `${parsedUrl.origin}${parsedUrl.pathname}`;

    return { signedUrl, path };
  }

  async getReadSignedUrl(key: string) {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await getSignedUrl(this.s3, command, { expiresIn: 3600 });
    const parsedUrl = new URL(signedUrl);
    const path = process.env.CDN_URL
      ? `${process.env.CDN_URL}/${key}`
      : `${parsedUrl.origin}${parsedUrl.pathname}`;

    return { signedUrl, path };
  }
}

export class GCSStorageService implements StorageService {
  private gcs: Storage;

  constructor() {
    // Initialize GCS Storage client with explicit credentials if provided
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (credentialsPath) {
      // Resolve the path - handle both relative and absolute paths
      const resolvedPath = path.isAbsolute(credentialsPath)
        ? credentialsPath
        : path.resolve(process.cwd(), credentialsPath);

      // Check if file exists
      if (!fs.existsSync(resolvedPath)) {
        throw new BadRequestException(
          `GCS credentials file not found at: ${resolvedPath} (resolved from: ${credentialsPath})`,
        );
      }

      this.gcs = new Storage({
        keyFilename: resolvedPath,
      });
    } else {
      this.gcs = new Storage();
    }
  }

  async uploadFile(
    key: string,
    file: Buffer,
    contentType: string,
  ): Promise<PutObjectCommandOutput> {
    if (!process.env.GCS_BUCKET_NAME) {
      throw new BadRequestException(
        'GCS_BUCKET_NAME is not defined as env variable',
      );
    }

    const bucket = this.gcs.bucket(process.env.GCS_BUCKET_NAME);
    const fileObject = bucket.file(key);

    try {
      const result = await fileObject.save(file, {
        contentType,
        metadata: {
          cacheControl: 'public, max-age=31536000',
        },
      });
      return result as unknown as PutObjectCommandOutput;
    } catch (error: any) {
      if (error.code === 404) {
        throw new BadRequestException(
          `GCS bucket does not exist or is not accessible`,
        );
      }
      if (error.code === 403) {
        throw new ForbiddenException(`Permission denied accessing GCS bucket`);
      }
      throw new InternalServerErrorException(
        `GCS upload failed: ${error.message || 'Unknown error'}`,
      );
    }
  }

  async uploadStream(
    key: string,
    stream: Readable,
    contentType: string,
  ): Promise<PutObjectCommandOutput> {
    if (!process.env.GCS_BUCKET_NAME) {
      throw new BadRequestException(
        'GCS_BUCKET_NAME is not defined as env variable',
      );
    }

    const bucket = this.gcs.bucket(process.env.GCS_BUCKET_NAME);
    const fileObject = bucket.file(key);

    const writeStream = fileObject.createWriteStream({
      contentType,
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });

    return new Promise((resolve, reject) => {
      stream
        .pipe(writeStream)
        .on('error', (error: any) => {
          if (error.code === 404) {
            reject(
              new BadRequestException(
                `GCS bucket does not exist or is not accessible`,
              ),
            );
          } else if (error.code === 403) {
            reject(
              new ForbiddenException(`Permission denied accessing GCS bucket`),
            );
          } else {
            reject(
              new InternalServerErrorException(
                `GCS stream upload failed: ${error.message || 'Unknown error'}`,
              ),
            );
          }
        })
        .on('finish', () => {
          resolve({} as PutObjectCommandOutput);
        });
    });
  }

  async getFile(key: string): Promise<Buffer> {
    if (!process.env.GCS_BUCKET_NAME) {
      throw new BadRequestException(
        'GCS_BUCKET_NAME is not defined as env variable',
      );
    }

    try {
      const bucket = this.gcs.bucket(process.env.GCS_BUCKET_NAME);
      const fileObject = bucket.file(key);
      const [file] = await fileObject.download();

      return file;
    } catch (error: any) {
      if (error.code === 404) {
        throw new NonExistingFileError();
      }
      throw error;
    }
  }

  async deleteFile(key: string): Promise<void> {
    if (!process.env.GCS_BUCKET_NAME) {
      throw new BadRequestException(
        'GCS_BUCKET_NAME is not defined as env variable',
      );
    }

    const bucket = this.gcs.bucket(process.env.GCS_BUCKET_NAME);
    const fileObject = bucket.file(key);
    fileObject.delete();
  }

  async fileExists(key: string): Promise<boolean> {
    if (!process.env.GCS_BUCKET_NAME) {
      throw new BadRequestException(
        'GCS_BUCKET_NAME is not defined as env variable',
      );
    }

    try {
      const bucket = this.gcs.bucket(process.env.GCS_BUCKET_NAME);
      const fileObject = bucket.file(key);
      const [exists] = await fileObject.exists();
      return exists;
    } catch (error: any) {
      if (error.code === 404) {
        return false;
      }
      throw error;
    }
  }

  async headObject(
    key: string,
  ): Promise<{ contentType: string; contentLength: number }> {
    if (!process.env.GCS_BUCKET_NAME) {
      throw new BadRequestException(
        'GCS_BUCKET_NAME is not defined as env variable',
      );
    }

    try {
      const bucket = this.gcs.bucket(process.env.GCS_BUCKET_NAME);
      const fileObject = bucket.file(key);
      const [metadata] = await fileObject.getMetadata();
      const sizeRaw = metadata.size;
      const contentLength =
        typeof sizeRaw === 'string'
          ? parseInt(sizeRaw, 10)
          : Number(sizeRaw || 0);
      return {
        contentType: metadata.contentType || '',
        contentLength: Number.isFinite(contentLength) ? contentLength : 0,
      };
    } catch (error: any) {
      if (error.code === 404) {
        throw new NonExistingFileError();
      }
      throw error;
    }
  }

  async getSignedUrl(key: string, contentType: string) {
    validateContentType(contentType);

    if (!process.env.GCS_BUCKET_NAME) {
      throw new BadRequestException(
        'GCS_BUCKET_NAME is not defined as env variable',
      );
    }

    const [signedUrl] = await this.gcs
      .bucket(process.env.GCS_BUCKET_NAME)
      .file(key)
      .getSignedUrl({
        version: 'v4',
        action: 'write',
        expires: Date.now() + 60 * 60 * 1000, // 60 minutes
        contentType: contentType,
      });

    const parsedUrl = new URL(signedUrl);
    const path = process.env.CDN_URL
      ? `${process.env.CDN_URL}/${key}`
      : `${process.env.GCS_DOMAIN}${parsedUrl.pathname}`;

    return { signedUrl, path };
  }

  async getReadSignedUrl(key: string) {
    if (!process.env.GCS_BUCKET_NAME) {
      throw new BadRequestException(
        'GCS_BUCKET_NAME is not defined as env variable',
      );
    }

    const [signedUrl] = await this.gcs
      .bucket(process.env.GCS_BUCKET_NAME)
      .file(key)
      .getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 60 * 60 * 1000, // 60 minutes
      });

    const parsedUrl = new URL(signedUrl);
    const path = process.env.CDN_URL
      ? `${process.env.CDN_URL}/${key}`
      : `${process.env.GCS_DOMAIN}${parsedUrl.pathname}`;

    return { signedUrl, path };
  }
}
