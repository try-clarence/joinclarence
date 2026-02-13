const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

// Carrier configurations for different pricing profiles
const carrierProfiles = {
  reliable_insurance: {
    name: 'Reliable Insurance Co.',
    priceMultiplier: 1.0,
    specialties: ['general_liability', 'professional_liability', 'workers_compensation', 'commercial_auto', 'cyber_liability'],
  },
  techshield_underwriters: {
    name: 'TechShield Underwriters',
    priceMultiplier: 0.95,
    specialties: ['professional_liability', 'cyber_liability', 'employment_practices_liability', 'directors_officers'],
  },
  premier_underwriters: {
    name: 'Premier Underwriters Group',
    priceMultiplier: 1.1,
    specialties: ['general_liability', 'professional_liability', 'workers_compensation', 'commercial_auto', 'cyber_liability'],
  },
  fastbind_insurance: {
    name: 'FastBind Insurance',
    priceMultiplier: 0.9,
    specialties: ['general_liability', 'professional_liability', 'business_owners_policy'],
  },
};

// Base premiums by coverage type
const basePremiums = {
  general_liability: 1500,
  professional_liability: 2500,
  cyber_liability: 2000,
  workers_compensation: 3500,
  commercial_auto: 2800,
  employment_practices_liability: 1800,
  directors_officers: 3000,
  business_owners_policy: 2200,
};

// Middleware to validate API key
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== 'test_clarence_key_123') {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
};

// Health check endpoint
app.get('/api/v1/carriers/:carrierCode/health', validateApiKey, (req, res) => {
  const { carrierCode } = req.params;
  const carrier = carrierProfiles[carrierCode];

  if (!carrier) {
    return res.status(404).json({ error: 'Carrier not found' });
  }

  res.json({
    status: 'healthy',
    carrier: carrierCode,
    timestamp: new Date().toISOString(),
  });
});

// Quote endpoint
app.post('/api/v1/carriers/:carrierCode/quote', validateApiKey, (req, res) => {
  const { carrierCode } = req.params;
  const carrier = carrierProfiles[carrierCode];

  if (!carrier) {
    return res.status(404).json({ error: 'Carrier not found' });
  }

  const { business_info, coverage_requests, insurance_type } = req.body;

  if (!coverage_requests || !coverage_requests.length) {
    return res.status(400).json({ error: 'coverage_requests is required' });
  }

  console.log(`[${carrierCode}] Quote request received for ${coverage_requests.length} coverage(s)`);

  // Generate quotes for each coverage request
  const quotes = coverage_requests.map((request) => {
    const coverageType = request.coverage_type;
    const basePremium = basePremiums[coverageType] || 2000;
    
    // Calculate premium based on business info
    let premium = basePremium * carrier.priceMultiplier;
    
    // Adjust based on revenue
    if (business_info?.financial_info?.annual_revenue) {
      const revenue = business_info.financial_info.annual_revenue;
      if (revenue > 1000000) premium *= 1.3;
      else if (revenue > 500000) premium *= 1.15;
    }
    
    // Adjust based on employees
    if (business_info?.financial_info?.full_time_employees) {
      const employees = business_info.financial_info.full_time_employees;
      if (employees > 50) premium *= 1.25;
      else if (employees > 20) premium *= 1.1;
    }

    // Round to nearest dollar
    premium = Math.round(premium);

    const effectiveDate = request.effective_date || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0];
    const expirationDate = new Date(new Date(effectiveDate).getTime() + 365*24*60*60*1000).toISOString().split('T')[0];

    return {
      quote_id: `QT-${carrierCode.toUpperCase().slice(0, 3)}-${uuidv4().slice(0, 8)}`,
      status: 'quoted',
      coverage_type: coverageType,
      premium: {
        annual: premium,
        monthly: Math.round(premium / 12 * 1.05), // 5% fee for monthly
        quarterly: Math.round(premium / 4 * 1.03), // 3% fee for quarterly
        payment_in_full_discount: Math.round(premium * 0.05), // 5% discount
      },
      coverage_limits: request.requested_limits || {
        per_occurrence: 1000000,
        aggregate: 2000000,
      },
      deductible: request.requested_deductible || 1000,
      effective_date: effectiveDate,
      expiration_date: expirationDate,
      policy_form: `${coverageType.toUpperCase()}-2024`,
      highlights: [
        'Broad coverage for business operations',
        'Claims-made coverage with full retroactive date',
        '24/7 claims reporting hotline',
      ],
      exclusions: [
        'Criminal acts',
        'Intentional damage',
        'Nuclear hazards',
      ],
      optional_coverages: [
        {
          name: 'Extended Reporting Period',
          premium: Math.round(premium * 0.1),
        },
      ],
      underwriting_notes: {
        risk_tier: 'standard',
        industry_rating: 'favorable',
      },
    };
  });

  const validUntil = new Date(Date.now() + 30*24*60*60*1000).toISOString();

  console.log(`[${carrierCode}] Returning ${quotes.length} quote(s)`);

  res.json({
    success: true,
    quotes,
    valid_until: validUntil,
    cached: false,
    package_discount: quotes.length > 1 ? {
      percentage: 10,
      amount: Math.round(quotes.reduce((sum, q) => sum + q.premium.annual, 0) * 0.1),
    } : null,
  });
});

// Bind endpoint
app.post('/api/v1/carriers/:carrierCode/bind', validateApiKey, (req, res) => {
  const { carrierCode } = req.params;
  const carrier = carrierProfiles[carrierCode];

  if (!carrier) {
    return res.status(404).json({ error: 'Carrier not found' });
  }

  const { quote_id, effective_date, payment_plan } = req.body;

  if (!quote_id) {
    return res.status(400).json({ error: 'quote_id is required' });
  }

  console.log(`[${carrierCode}] Bind request received for quote ${quote_id}`);

  const policyNumber = `POL-${carrierCode.toUpperCase().slice(0, 3)}-${Date.now().toString(36).toUpperCase()}`;
  const policyId = uuidv4();
  const bindId = uuidv4();

  const effectiveDateStr = effective_date || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0];
  const expirationDateStr = new Date(new Date(effectiveDateStr).getTime() + 365*24*60*60*1000).toISOString().split('T')[0];

  console.log(`[${carrierCode}] Policy bound: ${policyNumber}`);

  res.json({
    success: true,
    bind_id: bindId,
    policy: {
      policy_id: policyId,
      policy_number: policyNumber,
      status: 'bound',
      effective_date: effectiveDateStr,
      expiration_date: expirationDateStr,
      documents: [
        {
          type: 'policy',
          url: `https://carrier-docs.example.com/${policyNumber}/policy.pdf`,
        },
        {
          type: 'declarations',
          url: `https://carrier-docs.example.com/${policyNumber}/declarations.pdf`,
        },
        {
          type: 'certificate',
          url: `https://carrier-docs.example.com/${policyNumber}/certificate.pdf`,
        },
      ],
      carrier_contact: {
        name: carrier.name,
        phone: '+1-800-555-0123',
        email: `support@${carrierCode.replace('_', '')}.com`,
        claims_phone: '+1-800-555-0199',
      },
    },
    payment: {
      plan: payment_plan || 'annual',
      first_payment_due: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
    },
  });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Carrier API Simulator running on http://localhost:${PORT}`);
  console.log(`📋 Available carriers: ${Object.keys(carrierProfiles).join(', ')}`);
});
