Breezy Admin Panel – HubSpot Integration Proof of Concept
=========================================================

This project is a Node.js backend and lightweight frontend demonstrating how Breezy, a smart HVAC technology company, could sync customer data, thermostat purchases, and subscription activity into HubSpot. The proof of concept also includes an AI-powered insights feature using Google Gemini to analyze customer behavior and provide recommendations based on synced CRM data.

A. Setup Instructions
---------------------

### 1\. Install Dependencies

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   npm install express axios cors dotenv @google/genai   `

(If a package.json with these dependencies already exists, npm install alone is sufficient.)

### 2\. Get Your HubSpot Access Token

1.  Sign up for a [free HubSpot account](https://offers.hubspot.com/free-trial)
    
2.  Navigate to **Development** → **Legacy Apps**
    
3.  Click **Create a private app**
    
4.  Give it a name
    
5.  Go to the **Scopes** tab and enable:
    
    *   crm.objects.contacts.read
        
    *   crm.objects.contacts.write
        
    *   crm.objects.deals.read
        
    *   crm.objects.deals.write
        
6.  Click **Create app** and copy your access token
    

3\. Generate a Gemini API key in Google AI Studio.

### 4\. Configure Environment Variables

Create a .env file in the project root:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   HUBSPOT_ACCESS_TOKEN=your_hubspot_private_app_token  GEMINI_API_KEY=your_google_genai_api_key   `

### 4\. Start the Server

From the project root:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   node server.js   `

The application will be available at:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   http://localhost:3001/   `

B. Project Overview
-------------------

This proof of concept demonstrates how Breezy can unify its customer, hardware purchase, and SaaS subscription information inside HubSpot using a simple integration layer.

Testing the Integration Flow

1.  Open http://localhost:3001/ in your browser.
    
2.  Create a contact using the form at the top of the UI.
    
    1.  The contact is created in HubSpot immediately.
        
3.  Create a deal by selecting “Create” next to a contact.
    
    1.  The deal is associated with that contact and created in HubSpot
        
4.  View associated deals by clicking “View”.
    
    1.  A modal displays all deals tied to the selected contact.
        
5.  Generate AI insights by clicking “Generate”.
    
    1.  The backend gathers CRM data for the contact, sends it to Gemini, and displays the resulting analysis in a modal.
        

C. AI Usage Documentation
-------------------------

### AI Tools Used

*   ChatGPT (OpenAI) and Gemini– used throughout development for coding assistance, troubleshooting, architecture planning, and writing documentation.
    
*   Google Gemini (via @google/genai) – used inside the application itself as the AI engine that analyzes customer and subscription data to generate insights.
    

### **What I Used AI for**

*   Helping me get started quickly after not coding for a while
    
*   Reviewing and debugging JavaScript and backend logic
    
*   Troubleshooting API errors and package configuration issues
    
*   Writing and refining copy (README content, prompts)
    
*   Helping me implement my first AI endpoint inside an app using Gemini
    

### **What I Learned**

This was my first time integrating an AI model directly into an application, so I learned:

*   How to use the Gemini API and the @google/genai SDK
    
*   How to structure prompts and pass CRM data to a model
    

### **Challenges**

*   Getting the Gemini integration working, mainly due to package version inconsistencies and incorrect model naming
    
*   Ensuring the AI prompt produced consistent, Breezy-specific insights
    

D. HubSpot Data Architecture
----------------------------

I'm using a Subscription custom object because Breezy Premium is an ongoing service with its own lifecycle (trial, active, canceled, renewal dates, plan/sku, discounts) that needs a single, persistent “source of truth” independent of any one sale. 

Deals alone close and don’t represent a living subscription. Deals are used in two pipelines:

*   Hardware Purchases
    
*   Breezy Premium Subscriptions
    

That way, they can focus on commercial events (hardware orders, new subscription conversions, and yearly renewals) and power revenue and pipeline reporting. 

A Deal can have 0–1 Subscriptions, because hardware deals will never be tied to a subscription, while subscription deals should link to exactly one Subscription record; conversely, a Subscription can have many Deals over time (initial new business + multiple renewal or expansion deals), which is how we track recurring ARR year over year. 

I use Line Items and Products only for hardware, so Breezy can report on thermostat sales and quantities at the product level, but avoid duplicating subscription plan/price/discount data in both line items and the Subscription object. 

Finally, key rollup fields on the Contact (subscription status, latest hardware purchase date, latest subscription start date, trial end date, hardware units owned) summarize what’s happening across Deals and the Subscription object so marketing and sales can easily segment, trigger workflows, and run campaigns directly from the contact record.

E. AI Feature Explanation
-------------------------

### Description

The AI feature takes a contact’s CRM data (contact properties, associated hardware deals, subscription deals, and lifecycle dates) and generates a summary that includes:

*   Customer journey
    
*   Subscription Funnel Status
    
*   Risk / Opportunities
    
*   Recommended Campaigns
    

These insights are displayed to the user in a modal window.

### Why This Feature Was Selected

Breezy needs:

*   Visibility into trial-to-paid conversions
    
*   Awareness of subscription lifecycle health
    
*   Early detection of churn risk
    
*   Actionable suggestions for marketing and customer success
    

AI provides all of these without requiring custom scoring engines or large rule sets.

### How It Enhances the Integration

AI interprets multiple data points together:

*   Deal timelines
    
*   Subscription history
    
*   Purchase patterns
    
*   Contact data
    

This produces more meaningful insights than simple rule-based automation.

### When to Use AI vs. Traditional Logic

**AI is preferred for:**

*   Recommendations
    
*   Behavioral summaries
    
*   Customer health scoring
    
*   Churn prediction
    
*   Pattern recognition
    

**Rules are preferred for:**

*   Billing events
    
*   Deterministic workflow triggers
    
*   Data validation
    
*   Field updates and calculations
    

F. Design Decisions
-------------------

Technical choices made and why

**1.Vanilla JavaScript for Simplicity and Speed**

For this proof-of-concept, I intentionally chose **plain HTML, CSS, and vanilla JavaScript** instead of a framework like React or Vue.Reasons:

*   **Speed & familiarity** — I haven’t coded in a while, and vanilla JS let me move quickly without setup or build tooling.
    
*   **Lightweight POC** — This project is intentionally small and focused on demonstrating the integration, not building a production UI.
    
*   **Transparent logic** — The HubSpot API calls and AI flow are easy to understand without framework abstractions.
    

**2\. Using Modals (“Popups”) for Interaction**

I initially built the Contact and Deal form on the page, and later I switched to modals because:

*   **Cleaner user experience** — Modals reduce scrolling and keep the main UI uncluttered.
    
*   **Better storytelling for a client demo** — It feels more like a polished admin tool, which helps Breezy visualize a real application.
    
*   **Easy to add and maintain** — Vanilla CSS + a small amount of JS is all that’s needed.
    
*   **Consistency** — I used the same modal pattern for:
    
    *   Viewing Deals
        
    *   Creating a Deal
        
    *   Viewing AI Insights
        
    *   This kept the UX predictable and the code easy to maintain.
        

**3\. Choosing Google Gemini for the AI Feature**

Again, this was my first time using an AI model inside a real application, so I chose Gemini because:

*   **The free tier is generous**, great for development/testing
    
*   **The @google/genai SDK is simple** and requires minimal setup
    
*   **The 1.5 Flash model is fast**, which matters for a real-time UI feature
    
*   Google models handle **structured data input** (JSON CRM data) especially well.
    

Assumptions made about Breezy's platform

*   Breezy sells one primary hardware SKU (the thermostat), so no device-level custom object is needed.
    
*   Breezy Premium is a single subscription plan with simple annual pricing.
    
*   Each subscription has **one primary Contact** (subscription owner).
    
*   Hardware purchases and subscription conversions/renewals represent different business motions, justifying separate pipelines.
    
*   Breezy’s backend tracks subscription lifecycle events (trial start/end, renewal dates, cancellations).
    
*   Breezy’s platform will push order and subscription updates into HubSpot.
    

Improvements with more time

*   Provide a more complete demonstration of Deal pipelines and stages, including clear definitions, entry/exit criteria, automation triggers, and lifecycle alignment for both B2C and B2B.
    
*   Integrate these expanded pipelines into the Gemini-powered AI feature, allowing it to make recommendations or generate insights based on pipeline stage, deal type, and revenue motion.
    
*   Enhance the AI prompt to leverage more context from pipelines, subscription lifecycle data, and hardware ownership to generate deeper insights.
    
*   Add workflow examples showing how Breezy could automate notifications, nurturing, or distributor handoffs based on pipeline activity.
    

Questions to ask before building a production version

*   Will the integration be one-way or two-way? Does HubSpot only receive customer, hardware, and subscription data? Or do you expect HubSpot to send data back into Breezy’s platform?
    
*   What is the source of truth for subscription lifecycle events? Which system owns trial start/end, active status, cancellations, renewal dates, and pricing?
    
*   Do you support or expect to support multiple subscription tiers or add-on services now or in the future?
