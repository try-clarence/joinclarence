import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCarrierIntegrationEntities1700000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create carriers table
    await queryRunner.query(`
      CREATE TABLE carriers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        carrier_code VARCHAR(50) UNIQUE NOT NULL,
        carrier_name VARCHAR(255) NOT NULL,
        specialization VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        api_base_url VARCHAR(500),
        api_key_encrypted TEXT,
        supports_personal BOOLEAN DEFAULT true,
        supports_commercial BOOLEAN DEFAULT true,
        supported_coverages JSONB,
        last_health_check TIMESTAMP,
        health_status VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create quote_requests table
    await queryRunner.query(`
      CREATE TABLE quote_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        session_id VARCHAR(100) NOT NULL,
        insurance_type VARCHAR(20) NOT NULL,
        request_type VARCHAR(20) NOT NULL,
        status VARCHAR(50) DEFAULT 'draft',
        legal_business_name VARCHAR(255),
        dba_name VARCHAR(255),
        legal_structure VARCHAR(50),
        business_website VARCHAR(255),
        industry VARCHAR(255),
        industry_code VARCHAR(20),
        business_description TEXT,
        fein VARCHAR(20),
        year_started INT,
        years_current_ownership INT,
        address_type VARCHAR(20),
        street_address VARCHAR(255),
        address_unit VARCHAR(50),
        city VARCHAR(100),
        state VARCHAR(2),
        zip_code VARCHAR(10),
        has_subsidiaries BOOLEAN,
        has_foreign_subsidiaries BOOLEAN,
        multiple_entities BOOLEAN,
        contact_first_name VARCHAR(100),
        contact_last_name VARCHAR(100),
        contact_email VARCHAR(255),
        contact_phone VARCHAR(15),
        revenue_2024 DECIMAL(15,2),
        expenses_2024 DECIMAL(15,2),
        revenue_2025_estimate DECIMAL(15,2),
        expenses_2025_estimate DECIMAL(15,2),
        full_time_employees INT,
        part_time_employees INT,
        total_payroll DECIMAL(15,2),
        contractor_percentage DECIMAL(5,2),
        additional_comments TEXT,
        consent_marketing BOOLEAN DEFAULT false,
        consent_privacy_policy BOOLEAN DEFAULT false,
        uploaded_document_id UUID,
        submitted_at TIMESTAMP,
        quotes_ready_at TIMESTAMP,
        estimated_completion_time TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for quote_requests
    await queryRunner.query(`
      CREATE INDEX idx_quote_requests_user_id ON quote_requests(user_id);
      CREATE INDEX idx_quote_requests_session_id ON quote_requests(session_id);
      CREATE INDEX idx_quote_requests_status ON quote_requests(status);
      CREATE INDEX idx_quote_requests_insurance_type_status ON quote_requests(insurance_type, status);
    `);

    // Create quote_request_coverages table
    await queryRunner.query(`
      CREATE TABLE quote_request_coverages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        quote_request_id UUID NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
        coverage_type VARCHAR(50) NOT NULL,
        is_selected BOOLEAN DEFAULT false,
        is_recommended BOOLEAN DEFAULT false,
        recommendation_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create index for quote_request_coverages
    await queryRunner.query(`
      CREATE INDEX idx_quote_request_coverages_quote_request_id ON quote_request_coverages(quote_request_id);
    `);

    // Create carrier_quotes table
    await queryRunner.query(`
      CREATE TABLE carrier_quotes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        quote_request_id UUID NOT NULL REFERENCES quote_requests(id),
        carrier_id UUID NOT NULL REFERENCES carriers(id),
        carrier_quote_id VARCHAR(100) NOT NULL,
        carrier_response JSONB NOT NULL,
        status VARCHAR(20) NOT NULL,
        coverage_type VARCHAR(50) NOT NULL,
        annual_premium DECIMAL(15,2),
        monthly_premium DECIMAL(15,2),
        quarterly_premium DECIMAL(15,2),
        payment_in_full_discount DECIMAL(15,2),
        coverage_limits JSONB,
        deductible DECIMAL(15,2),
        effective_date DATE,
        expiration_date DATE,
        policy_form VARCHAR(100),
        highlights JSONB,
        exclusions JSONB,
        optional_coverages JSONB,
        underwriting_notes JSONB,
        decline_reason TEXT,
        decline_code VARCHAR(50),
        package_discount_percentage DECIMAL(5,2),
        package_discount_amount DECIMAL(15,2),
        valid_until TIMESTAMP NOT NULL,
        generated_via_llm BOOLEAN DEFAULT false,
        cached BOOLEAN DEFAULT false,
        response_time_ms INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for carrier_quotes
    await queryRunner.query(`
      CREATE INDEX idx_carrier_quotes_quote_request_id ON carrier_quotes(quote_request_id);
      CREATE INDEX idx_carrier_quotes_carrier_id ON carrier_quotes(carrier_id);
      CREATE INDEX idx_carrier_quotes_status ON carrier_quotes(status);
    `);

    // Create policies table
    await queryRunner.query(`
      CREATE TABLE policies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        quote_request_id UUID NOT NULL REFERENCES quote_requests(id),
        carrier_quote_id UUID NOT NULL REFERENCES carrier_quotes(id),
        carrier_id UUID NOT NULL REFERENCES carriers(id),
        policy_number VARCHAR(100) UNIQUE NOT NULL,
        carrier_policy_id VARCHAR(100) NOT NULL,
        carrier_bind_id VARCHAR(100),
        insurance_type VARCHAR(20) NOT NULL,
        coverage_type VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'bound',
        coverage_limits JSONB NOT NULL,
        deductible DECIMAL(15,2) NOT NULL,
        annual_premium DECIMAL(15,2) NOT NULL,
        payment_plan VARCHAR(20) NOT NULL,
        monthly_amount DECIMAL(15,2),
        effective_date DATE NOT NULL,
        expiration_date DATE NOT NULL,
        bound_at TIMESTAMP NOT NULL,
        cancelled_at TIMESTAMP,
        insured_name VARCHAR(255) NOT NULL,
        insured_address TEXT NOT NULL,
        first_payment_due DATE,
        next_payment_date DATE,
        payments_remaining INT,
        auto_renewal BOOLEAN DEFAULT true,
        policy_document_url VARCHAR(500),
        declarations_url VARCHAR(500),
        certificate_url VARCHAR(500),
        carrier_contact_info JSONB,
        carrier_policy_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for policies
    await queryRunner.query(`
      CREATE INDEX idx_policies_user_id ON policies(user_id);
      CREATE INDEX idx_policies_carrier_id ON policies(carrier_id);
      CREATE INDEX idx_policies_policy_number ON policies(policy_number);
      CREATE INDEX idx_policies_status ON policies(status);
      CREATE INDEX idx_policies_expiration_date ON policies(expiration_date);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE IF EXISTS policies CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS carrier_quotes CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS quote_request_coverages CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS quote_requests CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS carriers CASCADE;`);
  }
}
