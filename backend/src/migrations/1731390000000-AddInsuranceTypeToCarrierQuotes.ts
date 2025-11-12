import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInsuranceTypeToCarrierQuotes1731390000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add insurance_type column to carrier_quotes table
    await queryRunner.query(`
      ALTER TABLE carrier_quotes 
      ADD COLUMN IF NOT EXISTS insurance_type VARCHAR(20);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove insurance_type column from carrier_quotes table
    await queryRunner.query(`
      ALTER TABLE carrier_quotes 
      DROP COLUMN IF EXISTS insurance_type;
    `);
  }
}

