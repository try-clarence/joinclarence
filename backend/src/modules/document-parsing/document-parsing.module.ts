import { Module } from '@nestjs/common';
import { DocumentParsingController } from './document-parsing.controller';
import { DocumentParsingService } from './document-parsing.service';
import { FileStorageModule } from '../file-storage/file-storage.module';

@Module({
  imports: [FileStorageModule],
  controllers: [DocumentParsingController],
  providers: [DocumentParsingService],
})
export class DocumentParsingModule {}

