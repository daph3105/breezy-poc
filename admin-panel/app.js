document.addEventListener("DOMContentLoaded", () => {
  const statusDiv = document.getElementById("status");
  const table = document.getElementById("contacts-table");
  const tbody = document.getElementById("contacts-body");

  const form = document.getElementById("contact-form");
  const formStatus = document.getElementById("form-status");

  const modal = document.getElementById("deals-modal");
  const modalClose = document.getElementById("close-modal");
  const modalDealsBody = document.getElementById("modal-deals-body");

  const createDealModal = document.getElementById("create-deal-modal");
  const closeCreateDeal = document.getElementById("close-create-deal");
  const createDealForm = document.getElementById("create-deal-form");
  const createDealStatus = document.getElementById("create-deal-status");

  const aiModal = document.getElementById("ai-modal");
  const closeAiModal = document.getElementById("close-ai-modal");
  const aiModalBody = document.getElementById("ai-modal-body");

  // Global array to store contacts
  let contactsArray = [];

  // Render contacts table
  function renderContacts(array) {
    if (!array || array.length === 0) {
      statusDiv.textContent = "No contacts found";
      table.style.display = "none";
      return;
    }

    statusDiv.style.display = "none";
    table.style.display = "table";
    tbody.innerHTML = "";

    array.forEach((c) => {
      const row = document.createElement("tr");
      const props = c.properties || {};

      row.innerHTML = `
        <td>${props.firstname || ""}</td>
        <td>${props.lastname || ""}</td>
        <td>${props.email || ""}</td>
        <td>${props.jobtitle || ""}</td>
        <td>${props.company || ""}</td>
        <td>
          <button class="create-deal-btn" data-contact-id="${c.id}">Create</button>
          <button class="view-deals-btn" data-contact-id="${c.id}">View</button>
        </td>
        <td>
          <button class="ai-insights-btn" data-contact-id="${c.id}">Generate</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  // Fetch contacts from backend
  async function fetchContacts() {
    statusDiv.textContent = "Loading contacts...";
    statusDiv.style.color = "black";
    table.style.display = "none";
    tbody.innerHTML = "";

    try {
      const res = await fetch("http://localhost:3001/api/contacts");
      if (!res.ok) throw new Error("Failed to fetch contacts");

      const data = await res.json();
      console.log("Fetched contacts data:", data);

      const rawResults = Array.isArray(data.results)
        ? data.results
        : Array.isArray(data)
        ? data
        : [];

      contactsArray = rawResults;

      // Sort by ID descending (newest first)
      contactsArray.sort((a, b) => parseInt(b.id, 10) - parseInt(a.id, 10));

      // Show newest 50
      const newest50 = contactsArray.slice(0, 50);
      renderContacts(newest50);
    } catch (err) {
      console.error("Error fetching contacts:", err);
      statusDiv.textContent = `Error: ${err.message}`;
      statusDiv.style.color = "red";
    }
  }

  // Deals modal handlers
  // Close deals modal on X click
  modalClose.addEventListener("click", () => {
    modal.style.display = "none";
    modalDealsBody.innerHTML = "";
  });

  // Close deals modal on outside click
  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
      modalDealsBody.innerHTML = "";
    }
  });

  // Handle "View" button clicks 
  document.addEventListener("click", async (e) => {
    if (!e.target.classList.contains("view-deals-btn")) return;

    const contactId = e.target.dataset.contactId;
    modal.style.display = "flex";
    modalDealsBody.innerHTML = "<tr><td colspan='3'>Loading...</td></tr>";

    try {
      const res = await fetch(
        `http://localhost:3001/api/contacts/${contactId}/deals`
      );
      if (!res.ok) throw new Error("Failed to fetch deals");

      const data = await res.json();
      const deals = data.results || [];

      if (deals.length === 0) {
        modalDealsBody.innerHTML =
          "<tr><td colspan='3'>No deals found</td></tr>";
        return;
      }

      modalDealsBody.innerHTML = "";
      deals.forEach((deal) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${deal.properties.dealname || ""}</td>
          <td>${deal.properties.amount || ""}</td>
          <td>${deal.properties.dealstage || ""}</td>
        `;
        modalDealsBody.appendChild(row);
      });
    } catch (err) {
      console.error(err);
      modalDealsBody.innerHTML = `<tr><td colspan="3" style="color:red">Error: ${err.message}</td></tr>`;
    }
  });

  // Create deal modal handlers
  // Close create-deal modal on X
  closeCreateDeal.addEventListener("click", () => {
    createDealModal.style.display = "none";
    createDealForm.reset();
    createDealStatus.textContent = "";
  });

  // Close create-deal modal on outside click
  window.addEventListener("click", (e) => {
    if (e.target === createDealModal) {
      createDealModal.style.display = "none";
      createDealForm.reset();
      createDealStatus.textContent = "";
    }
  });

  // Open create-deal modal when "Create" button is clicked 
  document.addEventListener("click", (e) => {
    if (!e.target.classList.contains("create-deal-btn")) return;

    const contactId = e.target.dataset.contactId;
    createDealModal.style.display = "flex";
    document.getElementById("create-contact-id").value = contactId;
  });

  // Handle create-deal form submission
  createDealForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(createDealForm);
    const dealProperties = {};
    formData.forEach((value, key) => {
      if (key !== "contactId") dealProperties[key] = value;
    });
    const contactId = formData.get("contactId");

    try {
      createDealStatus.textContent = "Creating deal...";
      createDealStatus.style.color = "black";

      const response = await fetch("http://localhost:3001/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealProperties, contactId }),
      });

      if (!response.ok) throw new Error("Failed to create deal");

      await response.json();
      createDealStatus.textContent = "✅ Deal created successfully!";
      createDealStatus.style.color = "green";
      createDealForm.reset();

      // Close modal after short delay
      setTimeout(() => {
        createDealModal.style.display = "none";
        createDealStatus.textContent = "";
      }, 1000);
    } catch (err) {
      console.error("Error creating deal:", err);
      createDealStatus.textContent = `❌ Error: ${err.message}`;
      createDealStatus.style.color = "red";
    }
  });


  // AI modal handlers
  // Close AI modal on X
  closeAiModal.addEventListener("click", () => {
    aiModal.style.display = "none";
    aiModalBody.textContent = "";
  });

  // Close AI modal on outside click
  window.addEventListener("click", (e) => {
    if (e.target === aiModal) {
      aiModal.style.display = "none";
      aiModalBody.textContent = "";
    }
  });

  
  // AI Insights handler
  // Click handler for AI button 
  document.addEventListener("click", async (e) => {
    if (!e.target.classList.contains("ai-insights-btn")) return;

    const contactId = e.target.dataset.contactId;
    await generateInsightsForContact(contactId);
  });

  async function generateInsightsForContact(contactId) {
    // Open the modal and show a loading message
    aiModal.style.display = "flex";
    aiModalBody.textContent = "Analyzing customer journey...";

    try {
      // 1) Find contact in global array
      const contact = contactsArray.find(
        (c) => String(c.id) === String(contactId)
      );
      if (!contact) {
        aiModalBody.textContent = "Contact not found.";
        return;
      }

      // 2) Fetch deals for this contact
      const dealsRes = await fetch(
        `http://localhost:3001/api/contacts/${contactId}/deals`
      );
      if (!dealsRes.ok) {
        const body = await dealsRes.json().catch(() => ({}));
        aiModalBody.textContent = `Error loading deals: ${
          body.error || dealsRes.status
        }`;
        return;
      }

      const dealsData = await dealsRes.json();
      const deals = dealsData.results || [];

      // 3) Call AI backend
      const aiRes = await fetch("http://localhost:3001/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact, deals }),
      });

      const aiData = await aiRes.json();

      if (!aiRes.ok) {
        aiModalBody.textContent = `AI error: ${aiData.error || aiRes.status}`;
        return;
      }

      // 4) Show insight text inside the modal
      aiModalBody.textContent = aiData.insight || "No insights generated.";
    } catch (err) {
      console.error("Error generating insights:", err);
      aiModalBody.textContent = "Unexpected error generating insights.";
    }
  }

  // Handle new contact creation

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const properties = {};
    formData.forEach((value, key) => {
      if (value) properties[key] = value;
    });

    try {
      formStatus.textContent = "Syncing contact...";
      formStatus.style.color = "black";

      const response = await fetch("http://localhost:3001/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ properties }),
      });

      if (!response.ok) throw new Error("Failed to create contact");

      const newContact = await response.json();
      console.log("Contact created:", newContact);

      formStatus.textContent = "✅ Contact synced successfully!";
      formStatus.style.color = "green";
      form.reset();

      // Prepend new contact to global array and render newest 50
      contactsArray.unshift(newContact);
      renderContacts(contactsArray.slice(0, 50));
    } catch (err) {
      console.error("Error syncing contact:", err);
      formStatus.textContent = `❌ Error: ${err.message}`;
      formStatus.style.color = "red";
    }
  });

  // Initial load
  fetchContacts();
});
