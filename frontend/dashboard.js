/* Sales and partner dashboard, backed by the local FastAPI dashboard endpoints. */

(() => {
  "use strict";

  const configuredApiBase = document
    .querySelector('meta[name="api-base-url"]')
    ?.content.trim();
  const API_BASE = configuredApiBase
    ? configuredApiBase.replace(/\/+$/, "")
    : ["localhost", "127.0.0.1"].includes(window.location.hostname)
      ? "http://127.0.0.1:8000"
      : window.location.origin;
  const PAGE_SIZE = 50;
  const STAGES = [
    "Lead",
    "Contacted",
    "Needs assessed",
    "Quote accepted",
    "KYC complete",
    "Activated"
  ];
  const state = {
    analytics: null,
    leads: [],
    filteredLeads: [],
    currentPage: 0,
    selectedLead: null,
    toastTimer: null
  };
  const $ = (selector, root = document) => root.querySelector(selector);
  const currency = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  });
  const integer = new Intl.NumberFormat("en-IN");

  async function fetchJson(path) {
    let response;
    try {
      response = await fetch(`${API_BASE}${path}`);
    } catch (error) {
      setApiStatus(false);
      throw new Error(
        "Cannot reach the API at http://127.0.0.1:8000. Start FastAPI and verify CORS settings.",
        { cause: error }
      );
    }
    if (!response.ok) {
      let detail = "";
      try {
        const body = await response.json();
        detail = typeof body.detail === "string" ? body.detail : "";
      } catch {
        detail = "";
      }
      throw new Error(detail || `Dashboard request failed (${response.status}).`);
    }
    setApiStatus(true);
    return response.json();
  }

  function setApiStatus(connected) {
    const dot = $("#dashboard-api-dot");
    const label = $("#dashboard-api-status");
    dot.classList.toggle("bg-emerald-500", connected);
    dot.classList.toggle("bg-rose-500", !connected);
    dot.classList.toggle("bg-slate-400", connected === null);
    label.textContent = connected === null
      ? "Connecting…"
      : connected
        ? "Connected"
        : "API unavailable";
    $("#dashboard-api-indicator").classList.toggle("bg-rose-50", connected === false);
    $("#dashboard-api-indicator").classList.toggle("text-rose-700", connected === false);
    $("#dashboard-api-indicator").classList.toggle("bg-slate-100", connected === null);
  }

  function showError(message) {
    const errorBanner = $("#dashboard-error");
    errorBanner.textContent = message;
    errorBanner.classList.remove("hidden");
  }

  function clearError() {
    const errorBanner = $("#dashboard-error");
    errorBanner.textContent = "";
    errorBanner.classList.add("hidden");
  }

  function formatCurrency(amount) {
    return currency.format(Number(amount) || 0);
  }

  function renderAnalytics(analytics) {
    $("#kpi-total-leads").textContent = integer.format(analytics.total_leads);
    $("#kpi-activation-rate").textContent = `${Number(analytics.activation_rate_percent).toFixed(2)}%`;
    $("#kpi-activated-count").textContent = integer.format(analytics.activated_count);
    $("#kpi-cac").textContent = formatCurrency(analytics.blended_acquisition_cost_inr);
    $("#kpi-activation-days").textContent = `${Number(analytics.average_days_to_activate).toFixed(1)}`;
    $("#funnel-total").textContent = `${integer.format(analytics.total_leads)} leads`;

    const stageCounts = analytics.funnel_stage_breakdown || {};
    const maximum = Math.max(...STAGES.map((stage) => Number(stageCounts[stage]) || 0), 1);
    const chart = $("#funnel-chart");
    chart.replaceChildren();
    STAGES.forEach((stage) => {
      const count = Number(stageCounts[stage]) || 0;
      const row = document.createElement("div");
      row.className = "funnel-row";
      const stageName = document.createElement("span");
      stageName.className = "funnel-stage";
      stageName.textContent = stage;
      const track = document.createElement("div");
      track.className = "funnel-track";
      track.setAttribute("role", "img");
      track.setAttribute("aria-label", `${stage}: ${integer.format(count)} leads`);
      const fill = document.createElement("div");
      fill.className = "funnel-fill";
      fill.style.width = `${Math.max((count / maximum) * 100, count ? 2 : 0)}%`;
      track.append(fill);
      const number = document.createElement("span");
      number.className = "funnel-count";
      number.textContent = integer.format(count);
      row.append(stageName, track, number);
      chart.append(row);
    });
  }

  function populateReasons(leads) {
    const select = $("#drop-reason-filter");
    const currentValue = select.value;
    const reasons = [...new Set(leads.map((lead) => lead.drop_reason).filter(Boolean))]
      .sort((left, right) => left.localeCompare(right));
    select.replaceChildren();
    const allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = "All drop reasons";
    select.append(allOption);
    reasons.forEach((reason) => {
      const option = document.createElement("option");
      option.value = reason;
      option.textContent = reason;
      select.append(option);
    });
    if (reasons.includes(currentValue)) select.value = currentValue;
  }

  function maskIdentifier(identifier) {
    if (!identifier) return "Not provided";
    return `${identifier.slice(0, 2)}•••••••••••••${identifier.slice(-2)}`;
  }

  function createCell(content, className = "") {
    const cell = document.createElement("td");
    if (className) cell.className = className;
    cell.append(content);
    return cell;
  }

  function renderLeadRow(lead) {
    const row = document.createElement("tr");

    const propensityCell = document.createElement("div");
    propensityCell.className = "propensity-cell";
    const propensityTopline = document.createElement("div");
    propensityTopline.className = "propensity-topline";
    const score = document.createElement("span");
    score.textContent = `${Number(lead.propensity_score).toFixed(1)}%`;
    const scoreLabel = document.createElement("span");
    scoreLabel.className = "text-[8px] font-semibold text-slate-400";
    scoreLabel.textContent = "LIKELIHOOD";
    propensityTopline.append(score, scoreLabel);
    const meter = document.createElement("div");
    meter.className = "propensity-meter";
    const fill = document.createElement("span");
    fill.style.width = `${Math.min(Math.max(Number(lead.propensity_score), 0), 100)}%`;
    meter.append(fill);
    propensityCell.append(propensityTopline, meter);
    row.append(createCell(propensityCell));

    const business = document.createElement("div");
    const businessName = document.createElement("p");
    businessName.className = "lead-business";
    businessName.textContent = lead.business_name || "Business";
    const contact = document.createElement("p");
    contact.className = "lead-contact";
    contact.textContent = `${lead.contact_name || "Contact not listed"} · ${lead.lead_id}`;
    business.append(businessName, contact);
    row.append(createCell(business));

    const segment = document.createElement("div");
    const segmentName = document.createElement("p");
    segmentName.className = "lead-segment";
    segmentName.textContent = lead.segment || "—";
    const city = document.createElement("p");
    city.className = "lead-city";
    city.textContent = lead.city || "—";
    segment.append(segmentName, city);
    row.append(createCell(segment));

    const stage = document.createElement("span");
    stage.className = "stage-pill";
    stage.textContent = lead.stage_reached || "—";
    row.append(createCell(stage));

    const reason = document.createElement("span");
    reason.className = "reason-text";
    reason.textContent = lead.drop_reason || "Reason not provided";
    row.append(createCell(reason));

    const gstin = document.createElement("span");
    gstin.className = "gstin-mask";
    gstin.textContent = maskIdentifier(lead.gstin);
    gstin.title = "GSTIN masked for privacy";
    row.append(createCell(gstin));

    const action = document.createElement("button");
    action.className = "outreach-button";
    action.type = "button";
    action.textContent = "Re-engage via WhatsApp / Direct Call";
    action.setAttribute(
      "aria-label",
      `Re-engage ${lead.business_name || lead.lead_id} via WhatsApp or direct call`
    );
    action.addEventListener("click", () => openOutreachDialog(lead));
    row.append(createCell(action));
    return row;
  }

  function updatePagination() {
    const pageCount = Math.max(1, Math.ceil(state.filteredLeads.length / PAGE_SIZE));
    state.currentPage = Math.min(state.currentPage, pageCount - 1);
    const from = state.filteredLeads.length ? state.currentPage * PAGE_SIZE + 1 : 0;
    const to = Math.min((state.currentPage + 1) * PAGE_SIZE, state.filteredLeads.length);
    $("#lead-results-count").textContent =
      `Showing ${integer.format(from)}–${integer.format(to)} of ${integer.format(state.filteredLeads.length)} leads`;
    $("#page-indicator").textContent = `Page ${state.currentPage + 1} of ${pageCount}`;
    $("#previous-page").disabled = state.currentPage <= 0;
    $("#next-page").disabled = state.currentPage >= pageCount - 1;
    $("#table-empty-state").classList.toggle("hidden", state.filteredLeads.length > 0);
    $("#lead-table").classList.toggle("hidden", state.filteredLeads.length === 0);
  }

  function renderLeads() {
    const reason = $("#drop-reason-filter").value.trim().toLocaleLowerCase();
    const searchTerm = $("#lead-search").value.trim().toLocaleLowerCase();
    state.filteredLeads = state.leads.filter((lead) => {
      const matchesReason = !reason || lead.drop_reason.toLocaleLowerCase() === reason;
      const searchableText = [
        lead.business_name,
        lead.contact_name,
        lead.city,
        lead.segment,
        lead.lead_id
      ].join(" ").toLocaleLowerCase();
      return matchesReason && (!searchTerm || searchableText.includes(searchTerm));
    });
    state.currentPage = 0;
    renderLeadPage();
    $("#recovery-lead-count").textContent = integer.format(state.leads.length);
    const topScore = state.leads.length ? Number(state.leads[0].propensity_score) : 0;
    $("#top-propensity-score").textContent = `${topScore.toFixed(1)}%`;
  }

  function renderLeadPage() {
    const tableBody = $("#lead-table-body");
    tableBody.replaceChildren();
    const start = state.currentPage * PAGE_SIZE;
    state.filteredLeads
      .slice(start, start + PAGE_SIZE)
      .forEach((lead) => tableBody.append(renderLeadRow(lead)));
    if (state.filteredLeads.length === 0) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.className = "table-placeholder";
      cell.colSpan = 7;
      cell.textContent = "No leads match the selected filters.";
      row.append(cell);
      tableBody.append(row);
    }
    updatePagination();
  }

  function setPageOffset(offset) {
    const pageCount = Math.max(1, Math.ceil(state.filteredLeads.length / PAGE_SIZE));
    state.currentPage = Math.min(Math.max(state.currentPage + offset, 0), pageCount - 1);
    renderLeadPage();
  }

  function openOutreachDialog(lead) {
    state.selectedLead = lead;
    $("#outreach-business").textContent = lead.business_name || lead.lead_id;
    $("#outreach-reason").textContent =
      `${lead.contact_name || "Contact"} · ${lead.city || "Location not listed"} · ${lead.drop_reason || "No drop reason listed"}`;
    $("#outreach-message").value =
      `Hello, I'm reaching out from Airtel SYNC about your business connectivity enquiry for ${lead.business_name || "your business"}. We understand your earlier concern was: ${lead.drop_reason || "your onboarding enquiry"}. Would you be open to a short conversation about options that may suit your needs?`;
    $("#outreach-phone").value = "";
    $("#outreach-error").classList.add("hidden");
    $("#outreach-error").textContent = "";
    $("#outreach-dialog").showModal();
    $("#outreach-phone").focus();
  }

  function getNormalizedPhone(requireCountryCode = true) {
    const input = $("#outreach-phone").value.trim();
    const digits = input.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) {
      throw new Error("Enter a valid phone number between 10 and 15 digits.");
    }
    if (requireCountryCode && !input.startsWith("+")) {
      throw new Error("Add the country code, including +, for WhatsApp.");
    }
    return digits;
  }

  function getOutreachMessage() {
    const message = $("#outreach-message").value.trim();
    if (!message) throw new Error("Enter a recovery message before continuing.");
    return message;
  }

  function showOutreachError(message) {
    const errorElement = $("#outreach-error");
    errorElement.textContent = message;
    errorElement.classList.remove("hidden");
  }

  function openWhatsApp() {
    try {
      const phone = getNormalizedPhone(true);
      const message = getOutreachMessage();
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(url, "_blank", "noopener,noreferrer");
      $("#outreach-dialog").close();
    } catch (error) {
      showOutreachError(error.message);
    }
  }

  function startDirectCall() {
    try {
      const phone = getNormalizedPhone(false);
      window.location.href = `tel:${phone}`;
    } catch (error) {
      showOutreachError(error.message);
    }
  }

  function showToast(message) {
    const toast = $("#dashboard-toast");
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(
      () => toast.classList.remove("is-visible"),
      3200
    );
  }

  async function loadDashboard() {
    const refreshButton = $("#refresh-dashboard");
    refreshButton.disabled = true;
    refreshButton.classList.add("is-loading");
    clearError();
    try {
      const [analytics, leads] = await Promise.all([
        fetchJson("/api/dashboard/analytics"),
        fetchJson("/api/dashboard/leads")
      ]);
      state.analytics = analytics;
      state.leads = leads;
      renderAnalytics(analytics);
      populateReasons(leads);
      renderLeads();
    } catch (error) {
      showError(error.message || "Unable to load dashboard data.");
      $("#lead-table-body").replaceChildren();
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.className = "table-placeholder";
      cell.colSpan = 7;
      cell.textContent = "Dashboard data could not be loaded. Check the API and refresh.";
      row.append(cell);
      $("#lead-table-body").append(row);
      $("#funnel-chart").textContent = "Analytics could not be loaded.";
    } finally {
      refreshButton.disabled = false;
      refreshButton.classList.remove("is-loading");
    }
  }

  function bindEvents() {
    $("#refresh-dashboard").addEventListener("click", loadDashboard);
    $("#drop-reason-filter").addEventListener("change", renderLeads);
    $("#lead-search").addEventListener("input", renderLeads);
    $("#previous-page").addEventListener("click", () => setPageOffset(-1));
    $("#next-page").addEventListener("click", () => setPageOffset(1));
    $("#close-outreach").addEventListener("click", () => $("#outreach-dialog").close());
    $("#whatsapp-action").addEventListener("click", openWhatsApp);
    $("#call-action").addEventListener("click", startDirectCall);
    $("#outreach-dialog").addEventListener("click", (event) => {
      if (event.target === $("#outreach-dialog")) $("#outreach-dialog").close();
    });
    $("#outreach-form").addEventListener("submit", (event) => event.preventDefault());
  }

  setApiStatus(null);
  bindEvents();
  loadDashboard();
})();
