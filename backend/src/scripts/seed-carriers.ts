import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import {
  Carrier,
  CarrierHealthStatus,
} from '../modules/carriers/entities/carrier.entity';

config();

const carriers = [
  {
    carrierCode: 'reliable_insurance',
    carrierName: 'Reliable Insurance Co.',
    specialization: 'General Liability, Professional Liability',
    isActive: true,
    apiBaseUrl:
      process.env.CARRIER_API_BASE_URL || 'http://localhost:3001/api/v1',
    apiKeyEncrypted: process.env.CARRIER_API_KEY || 'test_clarence_key_123',
    supportsPersonal: true,
    supportsCommercial: true,
    supportedCoverages: [
      'general_liability',
      'professional_liability',
      'workers_compensation',
      'commercial_auto',
      'cyber_liability',
      'employment_practices_liability',
    ],
    healthStatus: CarrierHealthStatus.OPERATIONAL,
  },
  {
    carrierCode: 'techshield_underwriters',
    carrierName: 'TechShield Underwriters',
    specialization: 'Technology E&O, Cyber Liability',
    isActive: true,
    apiBaseUrl:
      process.env.CARRIER_API_BASE_URL || 'http://localhost:3001/api/v1',
    apiKeyEncrypted: process.env.CARRIER_API_KEY || 'test_clarence_key_123',
    supportsPersonal: true,
    supportsCommercial: true,
    supportedCoverages: [
      'professional_liability',
      'cyber_liability',
      'employment_practices_liability',
      'directors_officers',
    ],
    healthStatus: CarrierHealthStatus.OPERATIONAL,
  },
  {
    carrierCode: 'premier_underwriters',
    carrierName: 'Premier Underwriters Group',
    specialization: 'Full Commercial Lines',
    isActive: true,
    apiBaseUrl:
      process.env.CARRIER_API_BASE_URL || 'http://localhost:3001/api/v1',
    apiKeyEncrypted: process.env.CARRIER_API_KEY || 'test_clarence_key_123',
    supportsPersonal: true,
    supportsCommercial: true,
    supportedCoverages: [
      'general_liability',
      'professional_liability',
      'workers_compensation',
      'commercial_auto',
      'cyber_liability',
      'employment_practices_liability',
      'directors_officers',
      'business_owners_policy',
    ],
    healthStatus: CarrierHealthStatus.OPERATIONAL,
  },
  {
    carrierCode: 'fastbind_insurance',
    carrierName: 'FastBind Insurance',
    specialization: 'Quick-bind small business policies',
    isActive: true,
    apiBaseUrl:
      process.env.CARRIER_API_BASE_URL || 'http://localhost:3001/api/v1',
    apiKeyEncrypted: process.env.CARRIER_API_KEY || 'test_clarence_key_123',
    supportsPersonal: true,
    supportsCommercial: true,
    supportedCoverages: [
      'general_liability',
      'professional_liability',
      'business_owners_policy',
    ],
    healthStatus: CarrierHealthStatus.OPERATIONAL,
  },
];

async function seedCarriers() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT) || 5432,
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'clarence_db',
    entities: [Carrier],
    synchronize: false,
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log('Connected to database');

    const carrierRepository = dataSource.getRepository(Carrier);

    // Check if carriers already exist
    const existingCount = await carrierRepository.count();
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing carriers. Skipping seed.`);
      console.log('To re-seed, delete existing carriers first.');
      return;
    }

    console.log('Seeding carriers...');

    for (const carrierData of carriers) {
      const carrier = carrierRepository.create(carrierData);
      await carrierRepository.save(carrier);
      console.log(
        `✓ Created carrier: ${carrierData.carrierName} (${carrierData.carrierCode})`,
      );
    }

    console.log(`\n✅ Successfully seeded ${carriers.length} carriers!`);

    // Display summary
    const allCarriers = await carrierRepository.find();
    console.log('\n📋 Carriers Summary:');
    allCarriers.forEach((c) => {
      console.log(`  - ${c.carrierName} (${c.carrierCode})`);
      console.log(`    Specialization: ${c.specialization}`);
      console.log(`    Coverages: ${c.supportedCoverages.length} types`);
      console.log(`    Status: ${c.isActive ? 'Active' : 'Inactive'}\n`);
    });
  } catch (error) {
    console.error('Error seeding carriers:', error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

seedCarriers()
  .then(() => {
    console.log('Seed complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
