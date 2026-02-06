import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeSessionIdNullableAndUpdateRequestType1738713600000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make session_id nullable - sessionId is no longer needed since
    // completed quotes are stored in database and incomplete ones in frontend Zustand store
    await queryRunner.query(`
      ALTER TABLE "quote_requests"
      ALTER COLUMN "session_id" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Make session_id NOT NULL again (this requires updating all null values first)
    await queryRunner.query(`
      UPDATE "quote_requests"
      SET "session_id" = 'legacy-' || id::text
      WHERE "session_id" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "quote_requests"
      ALTER COLUMN "session_id" SET NOT NULL
    `);
  }
}
