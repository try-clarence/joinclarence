import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSoftDeleteColumns1738800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add deleted_at column to quote_requests table
    await queryRunner.query(`
      ALTER TABLE "quote_requests"
      ADD COLUMN "deleted_at" TIMESTAMP NULL
    `);

    // Add deleted_at column to policies table
    await queryRunner.query(`
      ALTER TABLE "policies"
      ADD COLUMN "deleted_at" TIMESTAMP NULL
    `);

    // Create indexes for faster filtering of non-deleted records
    await queryRunner.query(`
      CREATE INDEX "IDX_quote_requests_deleted_at" ON "quote_requests" ("deleted_at")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_policies_deleted_at" ON "policies" ("deleted_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_policies_deleted_at"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_quote_requests_deleted_at"
    `);

    // Drop deleted_at columns
    await queryRunner.query(`
      ALTER TABLE "policies"
      DROP COLUMN IF EXISTS "deleted_at"
    `);

    await queryRunner.query(`
      ALTER TABLE "quote_requests"
      DROP COLUMN IF EXISTS "deleted_at"
    `);
  }
}
