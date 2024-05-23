import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3, PutObjectCommand, ObjectCannedACL } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class MediaService {
  private s3: S3;

  constructor(private configService: ConfigService) {
    this.s3 = new S3({
      endpoint: configService.get('spaces.endpoint'),
      region: configService.get('spaces.region'),
      credentials: {
        accessKeyId: configService.get('spaces.accessKey'),
        secretAccessKey: configService.get('spaces.secretKey'),
      },
    });
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string,
    user?: string,
  ): Promise<string> {
    try {
      const extension = path.parse(file.originalname).ext;
      const key = user
        ? `${user}/${folder}/${uuidv4()}${extension}`
        : `${folder}/${uuidv4()}${extension}`;

      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.configService.get('spaces.bucket'),
          Key: key,
          Body: file.buffer,
          ACL: ObjectCannedACL.public_read,
          ContentType: file.mimetype,
        }),
      );
      return `${this.configService.get('spaces.cdn')}/${key}`;
    } catch (error) {
      throw new InternalServerErrorException('File upload failed');
    }
  }
}
