import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePaymentsTable1738900000000 implements MigrationInterface {
  name = 'CreatePaymentsTable1738900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create payment enums
    await queryRunner.query(
      `CREATE TYPE "payment_type_enum" AS ENUM('initial', 'recurring', 'endorsement', 'one_time')`,
    );
    await queryRunner.query(
      `CREATE TYPE "payment_status_enum" AS ENUM('pending', 'succeeded', 'failed', 'refunded')`,
    );
    await queryRunner.query(
      `CREATE TYPE "payment_method_enum" AS ENUM('credit_card', 'ach', 'check')`,
    );

    // Create payments table
    await queryRunner.query(`
      CREATE TABLE "payments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "policy_id" uuid NOT NULL,
        "payment_type" "payment_type_enum" NOT NULL,
        "amount" decimal(15,2) NOT NULL,
        "currency" varchar(3) NOT NULL DEFAULT 'USD',
        "status" "payment_status_enum" NOT NULL DEFAULT 'pending',
        "payment_method" "payment_method_enum" NOT NULL,
        "stripe_payment_intent_id" varchar(100),
        "stripe_charge_id" varchar(100),
        "payment_method_last4" varchar(4),
        "carrier_payment_id" varchar(100),
        "due_date" date,
        "paid_at" timestamp,
        "receipt_url" varchar(500),
        "failure_code" varchar(50),
        "failure_message" text,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_payments_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION,
        CONSTRAINT "FK_payments_policy" FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE NO ACTION
      )
    `);

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_payments_user_id" ON "payments" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payments_policy_id" ON "payments" ("policy_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payments_status" ON "payments" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payments_stripe_payment_intent_id" ON "payments" ("stripe_payment_intent_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payments_created_at" ON "payments" ("created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TYPE "payment_method_enum"`);
    await queryRunner.query(`DROP TYPE "payment_status_enum"`);
    await queryRunner.query(`DROP TYPE "payment_type_enum"`);
  }
}
