require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory (for easy frontend development)
app.use(express.static(path.join(__dirname, 'public')));

// HubSpot API configuration
const HUBSPOT_API_BASE = 'https://api.hubapi.com';
const HUBSPOT_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;

// Validate token on startup
if (!HUBSPOT_TOKEN) {
  console.error('❌ ERROR: HUBSPOT_ACCESS_TOKEN not found in .env file');
  console.error('Please create a .env file and add your HubSpot Private App token');
  process.exit(1);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'Server is running', 
    timestamp: new Date().toISOString() 
  });
});

// GET endpoint - Fetch contacts from HubSpot
app.get('/api/contacts', async (req, res) => {
  try {
    const response = await axios.get(
      `${HUBSPOT_API_BASE}/crm/v3/objects/contacts`,
      {
        headers: {
          'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        params: {
          limit: 50,
          properties: 'firstname,lastname,email,jobtitle,company,createdate'
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching contacts:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch contacts',
      details: error.response?.data || error.message
    });
  }
});

// POST endpoint - Create new contact in HubSpot
app.post('/api/contacts', async (req, res) => {
  try {
    const response = await axios.post(
      `${HUBSPOT_API_BASE}/crm/v3/objects/contacts`,
      {
        properties: req.body.properties
      },
      {
        headers: {
          'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error creating contact:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to create contact',
      details: error.response?.data || error.message
    });
  }
});

// GET endpoint - Fetch all deals from HubSpot
app.get('/api/deals', async (req, res) => {
  try {
    const response = await axios.get(
      `${HUBSPOT_API_BASE}/crm/v3/objects/deals`,
      {
        headers: {
          'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        params: {
          limit: 50,
          properties: 'dealname,amount,dealstage,closedate,pipeline'
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching deals:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch deals',
      details: error.response?.data || error.message
    });
  }
});

// POST endpoint - Create new deal and associate to contact
app.post('/api/deals', async (req, res) => {
  try {
    const { dealProperties, contactId } = req.body;
    
    // Create the deal with association to contact
    const dealResponse = await axios.post(
      `${HUBSPOT_API_BASE}/crm/v3/objects/deals`,
      {
        properties: dealProperties,
        associations: contactId ? [{
          to: { id: contactId },
          types: [{
            associationCategory: "HUBSPOT_DEFINED",
            associationTypeId: 3 // Deal to Contact association
          }]
        }] : []
      },
      {
        headers: {
          'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    res.json(dealResponse.data);
  } catch (error) {
    console.error('Error creating deal:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to create deal',
      details: error.response?.data || error.message
    });
  }
});

// GET endpoint - Fetch deals associated with a specific contact
app.get('/api/contacts/:contactId/deals', async (req, res) => {
  try {
    const { contactId } = req.params;
    
    // First, get the deal associations for this contact
    const associationsResponse = await axios.get(
      `${HUBSPOT_API_BASE}/crm/v3/objects/contacts/${contactId}/associations/deals`,
      {
        headers: {
          'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // If there are associated deals, fetch their full details
    if (associationsResponse.data.results && associationsResponse.data.results.length > 0) {
      const dealIds = associationsResponse.data.results.map(r => r.id);
      
      const dealsResponse = await axios.post(
        `${HUBSPOT_API_BASE}/crm/v3/objects/deals/batch/read`,
        {
          inputs: dealIds.map(id => ({ id })),
          properties: ['dealname', 'amount', 'dealstage', 'closedate', 'pipeline']
        },
        {
          headers: {
            'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      res.json(dealsResponse.data);
    } else {
      res.json({ results: [] });
    }
  } catch (error) {
    console.error('Error fetching deals for contact:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch deals for contact',
      details: error.response?.data || error.message
    });
  }
});

// AI Insight Route (Breezy-specific) 
app.post('/api/insights', async (req, res) => {
  const { contact, deals } = req.body;

  // Basic validation
  if (!contact) {
    return res.status(400).json({ error: "Missing 'contact' in request body." });
  }
  if (!Array.isArray(deals)) {
    return res.status(400).json({ error: "Missing or invalid 'deals' array in request body." });
  }
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "AI is not configured. Please set GEMINI_API_KEY in .env." });
  }

  try {
    const { GoogleGenAI } = await import('@google/genai');

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const safeDeals = deals.slice(0, 50);

    const prompt = `
You are an AI assistant for Breezy, a smart home technology company that sells:

- Smart thermostats (hardware) via e-commerce
- A companion SaaS subscription “Breezy Premium” that includes:
  - AI climate optimization
  - Energy analytics
  - Remote access & scheduling
  - Smart home integrations

Pricing:
- Hardware: $299 per thermostat
- Subscription: $9.99 monthly or $99 annually
- Each hardware purchase includes a 30-day free trial of Breezy Premium.

---------------------------------------------------
DATA MODEL FOR THIS PROOF OF CONCEPT
---------------------------------------------------

In HubSpot, Breezy represents customer activity as DEALS in two separate pipelines:

1. Hardware pipeline
   - Represents thermostat purchases
   - A closed-won deal = completed thermostat sale
   - Multiple closed-won hardware deals = multiple thermostats owned
   - Deal names may include pack/quantity (e.g. "1 pack", "3 pack").

2. Subscriptions pipeline
   - Represents the Breezy Premium subscription lifecycle
   - Stages typically include:
       - Trial Started
       - Trial Active
       - Trial Ending Soon
       - Converted – Monthly
       - Converted – Annual
       - At Risk / Payment Issue
       - Cancelled / Churned
   - Deals here represent:
       - free trials,
       - subscription activations,
       - renewals,
       - cancellations or churn.

Each deal you receive has:
- dealname
- dealstage
- amount
- pipeline (indicating which pipeline it belongs to)
- createdate
- closedate

Interpretation guidance:
- Treat deals in the hardware pipeline as thermostat purchases.
- Treat deals in the subscriptions pipeline as Breezy Premium subscription events.
- If a customer has hardware but no subscription deals → likely used free trial only and never converted.
- Use closedate and createdate to infer timing (e.g., mid trial, post trial, renewal, churn).

---------------------------------------------------
YOUR TASK
---------------------------------------------------

Using ONLY the contact and deals data provided, analyze this specific customer and produce:

1. Customer Journey Summary:
   - 2–3 sentences describing:
     - where they are in their Breezy journey,
     - approximately how many thermostats they own,
     - whether they appear to be on trial, converted, renewed, or churned.

2. Subscription Funnel Status:
   - Status: choose exactly ONE of:
     - On free trial
     - Converted to paid monthly
     - Converted to paid annual
     - Renewal in progress
     - Cancelled subscription
     - Trial expired — not converted
     - No subscription started
   - Reason: briefly explain which deals (pipelines/stages) led you to that conclusion.

3. Risk / Opportunity:
   - Risk Level: Low / Medium / High
   - Explanation: 1–2 sentences
   - Mention any obvious expansion/upsell opportunities:
     - more thermostats,
     - upgrade to annual,
     - reactivation campaigns, etc.

4. Recommended Campaigns:
   - Propose 3 targeted campaign ideas. For each:
     - Campaign Title
     - 1–2 sentence Focus
     - Example subject line

---------------------------------------------------
Contact (JSON):
${JSON.stringify(contact, null, 2)}

Deals (JSON):
${JSON.stringify(safeDeals, null, 2)}
    `.trim();
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const text = response.text || "No insights generated.";
    res.json({ insight: text });
  } catch (error) {
    console.error('Error generating AI insight:', error);
    res.status(500).json({ error: 'AI insight generation failed' });
  }
});

// Start server
const server = app.listen(PORT, () => {
  console.log('\n✅ Server running successfully!');
  console.log(`🌐 API available at: http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`📁 Static files served from: /public`);
  console.log('\n💡 Using hot-reload? Run: npm run dev');
  console.log('🛑 To stop server: Press Ctrl+C\n');
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n⚠️  Received ${signal}, closing server gracefully...`);
  
  server.close(() => {
    console.log('✅ Server closed successfully');
    console.log('👋 Goodbye!\n');
    process.exit(0);
  });

  // Force close after 10 seconds if graceful shutdown fails
  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});
