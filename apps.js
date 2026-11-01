"use strict";

const appName = document.body.dataset.app;

const cityCoordinates = {
  abuja: { name: "Abuja", latitude: 9.0765, longitude: 7.3986 },
  abeokuta: { name: "Abeokuta", latitude: 7.1475, longitude: 3.3619 },
  akure: { name: "Akure", latitude: 7.2571, longitude: 5.2058 },
  awka: { name: "Awka", latitude: 6.2101, longitude: 7.0741 },
  bauchi: { name: "Bauchi", latitude: 10.3103, longitude: 9.8439 },
  "benin city": { name: "Benin City", latitude: 6.335, longitude: 5.6037 },
  calabar: { name: "Calabar", latitude: 4.9757, longitude: 8.3417 },
  enugu: { name: "Enugu", latitude: 6.4584, longitude: 7.5464 },
  ibadan: { name: "Ibadan", latitude: 7.3775, longitude: 3.947 },
  ilorin: { name: "Ilorin", latitude: 8.4799, longitude: 4.5418 },
  jos: { name: "Jos", latitude: 9.8965, longitude: 8.8583 },
  kaduna: { name: "Kaduna", latitude: 10.5105, longitude: 7.4165 },
  kano: { name: "Kano", latitude: 12.0022, longitude: 8.5919 },
  lagos: { name: "Lagos", latitude: 6.5244, longitude: 3.3792 },
  maiduguri: { name: "Maiduguri", latitude: 11.8311, longitude: 13.151 },
  minna: { name: "Minna", latitude: 9.6139, longitude: 6.5569 },
  onitsha: { name: "Onitsha", latitude: 6.1667, longitude: 6.7833 },
  owerri: { name: "Owerri", latitude: 5.4836, longitude: 7.0333 },
  "port harcourt": { name: "Port Harcourt", latitude: 4.8156, longitude: 7.0498 },
  sokoto: { name: "Sokoto", latitude: 13.0059, longitude: 5.2476 },
  uyo: { name: "Uyo", latitude: 5.0377, longitude: 7.9128 },
  warri: { name: "Warri", latitude: 5.5167, longitude: 5.75 },
  yola: { name: "Yola", latitude: 9.2035, longitude: 12.4954 },
  zaria: { name: "Zaria", latitude: 11.1113, longitude: 7.7227 }
};

const weatherDescriptions = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail"
};

function initWeatherReport() {
  const cityInput = document.querySelector("#weather-city");
  const searchButton = document.querySelector("#weather-search");
  const status = document.querySelector("#weather-status");
  const dataPanel = document.querySelector("#weather-data");

  async function loadCityWeather() {
    const city = cityCoordinates[cityInput.value.trim().toLocaleLowerCase()];
    if (!city) {
      status.textContent = "Choose a Nigerian city from the suggestions to view its weather.";
      status.dataset.state = "error";
      dataPanel.hidden = true;
      cityInput.focus();
      return;
    }

    searchButton.disabled = true;
    status.hidden = false;
    status.dataset.state = "loading";
    status.textContent = `Loading current conditions for ${city.name}…`;
    dataPanel.hidden = true;

    const query = new URLSearchParams({
      latitude: String(city.latitude),
      longitude: String(city.longitude),
      current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
      temperature_unit: "celsius",
      wind_speed_unit: "kmh",
      timezone: "auto"
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`, {
        signal: controller.signal
      });
      if (!response.ok) {
        throw new Error(`Weather service returned ${response.status}.`);
      }

      const result = await response.json();
      if (!result.current || !Number.isFinite(result.current.temperature_2m)) {
        throw new Error("The weather service returned incomplete current conditions.");
      }

      renderWeather(city, result);
      status.hidden = true;
      dataPanel.hidden = false;
    } catch (error) {
      status.dataset.state = "error";
      status.textContent = error.name === "AbortError"
        ? "The weather service took too long to respond. Please try again."
        : error instanceof TypeError
          ? "Weather data could not be reached. Check your connection and try again."
          : `We could not load ${city.name}'s weather. ${error.message} Please try again.`;
      dataPanel.hidden = true;
    } finally {
      clearTimeout(timeout);
      searchButton.disabled = false;
    }
  }

  searchButton.addEventListener("click", loadCityWeather);
  cityInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      loadCityWeather();
    }
  });
  loadCityWeather();
}

function renderWeather(city, result) {
  const current = result.current;
  const temperature = current.temperature_2m;
  const risk = temperature >= 40 ? "extreme" : temperature >= 32 ? "high" : "normal";
  const riskLabels = { normal: "Normal", high: "High Heat", extreme: "Extreme Heat" };
  const riskMessages = {
    normal: "Conditions are below the high-heat range.",
    high: "Take breaks, seek shade, and drink water regularly.",
    extreme: "Extreme heat alert: temperature is at or above 40°C. Limit strenuous outdoor activity and seek a cool place."
  };
  const riskPanel = document.querySelector("#heat-risk");
  riskPanel.dataset.risk = risk;
  document.querySelector("#heat-risk-label").textContent = riskLabels[risk];
  document.querySelector("#heat-risk-message").textContent = riskMessages[risk];
  document.querySelector("#weather-location").textContent = `${city.name.toLocaleUpperCase()}, NIGERIA`;
  document.querySelector("#weather-temperature").textContent = Number(temperature).toFixed(1);
  document.querySelector("#weather-condition").textContent =
    weatherDescriptions[current.weather_code] || "Conditions unavailable";
  document.querySelector("#weather-feels").textContent = `${Number(current.apparent_temperature).toFixed(1)}°C`;
  document.querySelector("#weather-humidity").textContent = `${current.relative_humidity_2m}%`;
  document.querySelector("#weather-wind").textContent = `${Math.round(current.wind_speed_10m)} km/h`;

  const updatedAt = document.querySelector("#weather-time");
  const date = new Date(`${current.time}Z`);
  if (Number.isNaN(date.getTime())) {
    updatedAt.textContent = `${current.time} (${result.timezone || "local time"})`;
    updatedAt.dateTime = "";
    return;
  }

  const timeZone = result.timezone || "Africa/Lagos";
  updatedAt.dateTime = date.toISOString();
  updatedAt.textContent = new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC"
  }).format(date) + ` (${timeZone})`;
}

function initGoalQuestionnaire() {
  const form = document.querySelector("#goal-form");
  const steps = [...form.querySelectorAll(".goal-step")];
  const backButton = document.querySelector("#goal-back");
  const nextButton = document.querySelector("#goal-next");
  const submitButton = document.querySelector("#goal-submit");
  const error = document.querySelector("#goal-error");
  const results = document.querySelector("#goal-results");
  let stepIndex = 0;

  function showStep(index) {
    stepIndex = index;
    steps.forEach((step, currentIndex) => { step.hidden = currentIndex !== stepIndex; });
    document.querySelector("#goal-step-count").textContent =
      `${String(stepIndex + 1).padStart(2, "0")} / ${String(steps.length).padStart(2, "0")}`;
    document.querySelector("#goal-progress-bar").style.width = `${((stepIndex + 1) / steps.length) * 100}%`;
    document.querySelector("#goal-progress").setAttribute("aria-valuenow", String(stepIndex + 1));
    backButton.disabled = stepIndex === 0;
    nextButton.hidden = stepIndex === steps.length - 1;
    submitButton.hidden = stepIndex !== steps.length - 1;
    error.hidden = true;
  }

  function validateCurrentStep() {
    const fields = [...steps[stepIndex].querySelectorAll("input, textarea, select")];
    const field = fields.find((candidate) => candidate.required && !candidate.checkValidity());
    if (!field) return true;
    error.textContent = "Please answer this question before continuing.";
    error.hidden = false;
    field.focus();
    field.reportValidity();
    return false;
  }

  nextButton.addEventListener("click", () => {
    if (validateCurrentStep()) showStep(Math.min(stepIndex + 1, steps.length - 1));
  });
  backButton.addEventListener("click", () => showStep(Math.max(stepIndex - 1, 0)));
  document.querySelector("#goal-restart").addEventListener("click", () => {
    form.reset();
    document.querySelector("#happiness-value").value = "5";
    document.querySelector("#discipline-value").value = "5";
    results.hidden = true;
    form.hidden = false;
    document.querySelector("#goal-actions").hidden = false;
    showStep(0);
  });

  document.querySelector("#life-happiness").addEventListener("input", (event) => {
    document.querySelector("#happiness-value").value = event.target.value;
  });
  document.querySelector("#self-discipline").addEventListener("input", (event) => {
    document.querySelector("#discipline-value").value = event.target.value;
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (stepIndex < steps.length - 1) {
      if (validateCurrentStep()) showStep(stepIndex + 1);
      return;
    }
    if (!validateCurrentStep()) return;
    try {
      const answers = Object.fromEntries(new FormData(form));
      renderGoalReport(answers);
      form.hidden = true;
      document.querySelector("#goal-actions").hidden = true;
      results.hidden = false;
      results.querySelector("h2").focus();
    } catch (reportError) {
      error.textContent = `The report could not be created. ${reportError.message}`;
      error.hidden = false;
    }
  });

  showStep(0);
}

function renderGoalReport(answers) {
  const goals = String(answers.goals)
    .split(/\n|;/)
    .map((goal) => goal.replace(/^\s*(?:\d+[.)-]\s*|[-*]\s*)/, "").trim())
    .filter(Boolean)
    .slice(0, 3);
  if (goals.length === 0) throw new Error("Add at least one goal to your reflection.");

  const obstacles = new Set();
  const blockerText = `${answers.obstacles} ${answers.identityBarrier} ${answers.desiredChange}`.toLocaleLowerCase();
  if (/\btime|busy|schedule\b/.test(blockerText)) obstacles.add("Time or competing commitments may make consistent progress harder.");
  if (/\bmoney|financial|cost|funds|resource\b/.test(blockerText)) obstacles.add("Limited resources may call for a smaller first step or a longer timeline.");
  if (/\bfear|afraid|confidence|doubt|anxious\b/.test(blockerText)) obstacles.add("Uncertainty or low confidence may be making it harder to begin.");
  if (/\bsupport|alone|network|people\b/.test(blockerText)) obstacles.add("A lack of support or accountability may make the work feel heavier.");
  if (/\bdiscipline|procrastinat|consisten|habit|focus\b/.test(blockerText)) obstacles.add("Building a repeatable routine may be more useful than relying on motivation.");
  if (Number(answers.happiness) <= 4) obstacles.add("Your happiness rating suggests it may help to keep the first changes small and seek support from someone you trust.");
  if (Number(answers.discipline) <= 4) obstacles.add("Your self-rating points to routines as a possible area to strengthen, one manageable habit at a time.");
  if (obstacles.size === 0) obstacles.add("Your answers do not point to one obvious barrier yet; review which part of the first goal feels hardest to start.");

  const actions = [
    `Turn “${goals[0]}” into one specific action you can take within the next seven days.`,
    `Set aside a short, repeatable time block for ${answers.lifeArea.toLocaleLowerCase()} and review how it felt after one week.`
  ];
  if (Number(answers.discipline) <= 5) actions.push("Make the first version of the habit very small, then attach it to a routine you already have.");
  else actions.push("Use your existing sense of follow-through to schedule a brief weekly progress check.");
  if (answers.obstacles.trim()) actions.push("Choose one barrier you named and write down a person, resource, or adjustment that could help with it.");

  const goalList = document.querySelector("#report-goals");
  const obstacleList = document.querySelector("#report-obstacles");
  const actionList = document.querySelector("#report-actions");
  goalList.replaceChildren(...goals.map((goal) => createTextElement("li", goal)));
  obstacleList.replaceChildren(...[...obstacles].map((item) => createTextElement("li", item)));
  actionList.replaceChildren(...actions.map((item) => createTextElement("li", item)));
  document.querySelector("#report-direction").textContent = String(answers.fiveYears).trim();
}

function createTextElement(tagName, text) {
  const element = document.createElement(tagName);
  element.textContent = text;
  return element;
}

const companyGroups = {
  "Telecommunications": ["MTN Nigeria", "Airtel Nigeria", "Globacom (Glo)", "9mobile"],
  "Banking": ["Access Bank", "Zenith Bank", "GTBank", "UBA (United Bank for Africa)", "First Bank", "Fidelity Bank"],
  "Digital payments": ["Moniepoint", "OPay", "PalmPay"],
  "Consumer goods and manufacturing": ["Dangote Group", "BUA Group", "Nigerian Breweries", "Coca-Cola Nigeria", "Nestlé Nigeria", "Nigerian Bottling Company"],
  "Retail and ecommerce": ["Jumia Nigeria", "Konga", "Shoprite Nigeria"],
  "Hospitality": ["Eko Hotels"],
  "Aviation": ["Air Peace", "Ibom Air", "Arik Air"],
  "Mobility": ["Uber Nigeria", "Bolt Nigeria"],
  "Media": ["DSTV Nigeria", "GOtv Nigeria"]
};

const supabaseUrl = "https://ehdrmtpcrgijxymkzryz.supabase.co";
const supabasePublishableKey = "sb_publishable_mb4Wof77Y38eNGXYlThMGg_fo2xeJZY";
const feedbackColumns = "id,company,category,rating,title,description,is_anonymous,display_name,created_at";
const feedbackPageSize = 500;

async function initFeedbackPlatform() {
  const form = document.querySelector("#feedback-form");
  const companySelect = document.querySelector("#company-select");
  const companySearch = document.querySelector("#company-search");
  const filter = document.querySelector("#feedback-filter");
  const dashboardSearch = document.querySelector("#dashboard-search");
  const ratingFilter = document.querySelector("#rating-filter");
  const sortSelect = document.querySelector("#review-sort");
  const anonymousCheckbox = document.querySelector("#anonymous-feedback");
  const optionalDetails = document.querySelector("#optional-details");
  const reviewerName = document.querySelector("#reviewer-name");
  const customCompanyField = document.querySelector("#custom-company-field");
  const customCompany = document.querySelector("#custom-company");
  const error = document.querySelector("#feedback-error");
  const success = document.querySelector("#feedback-message");
  const loading = document.querySelector("#feedback-loading");
  const submitButton = form.querySelector('button[type="submit"]');
  let entries = [];
  let isSubmitting = false;
  const feedbackClient = window.supabase?.createClient(supabaseUrl, supabasePublishableKey);

  function renderDashboard() {
    renderFeedbackDashboard(entries, {
      company: filter.value,
      search: dashboardSearch.value,
      rating: ratingFilter.value,
      sort: sortSelect.value
    });
  }

  async function loadFeedback() {
    loading.hidden = false;
    try {
      const allReviews = [];
      for (let offset = 0; ; ) {
        const { data, error: queryError, count } = await feedbackClient
          .from("company_reviews")
          .select(feedbackColumns, { count: "exact" })
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .range(offset, offset + feedbackPageSize - 1);
        if (queryError) throw queryError;
        allReviews.push(...data);
        if (count !== null && offset + data.length >= count) break;
        if (!data.length) throw new Error("The review list could not be fully retrieved. Please reload and try again.");
        offset += data.length;
      }
      entries = allReviews.map(normalizeFeedbackEntry);
      populateCompanyOptions(companySelect, companySearch.value, entries);
      renderDashboard();
    } finally {
      loading.hidden = true;
    }
  }

  function showFeedbackError(message) {
    error.textContent = message;
    error.hidden = false;
  }

  populateCompanyOptions(companySelect, "", entries);

  companySearch.addEventListener("input", () => {
    const previousValue = companySelect.value;
    populateCompanyOptions(companySelect, companySearch.value, entries);
    if ([...companySelect.options].some((option) => option.value === previousValue)) {
      companySelect.value = previousValue;
    }
  });

  companySelect.addEventListener("change", () => {
    const isCustomCompany = companySelect.value === "__other__";
    customCompanyField.hidden = !isCustomCompany;
    customCompany.required = isCustomCompany;
    if (!isCustomCompany) customCompany.value = "";
  });

  anonymousCheckbox.addEventListener("change", () => {
    optionalDetails.hidden = anonymousCheckbox.checked;
    reviewerName.disabled = anonymousCheckbox.checked;
    reviewerName.required = !anonymousCheckbox.checked;
  });
  reviewerName.disabled = anonymousCheckbox.checked;
  reviewerName.required = !anonymousCheckbox.checked;

  filter.addEventListener("change", () => {
    dashboardSearch.value = "";
    renderDashboard();
  });
  [ratingFilter, sortSelect].forEach((control) => {
    control.addEventListener("change", renderDashboard);
  });
  dashboardSearch.addEventListener("input", () => {
    filter.value = "";
    renderDashboard();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    success.hidden = true;
    error.hidden = true;
    if (isSubmitting) return;
    if (!feedbackClient) {
      showFeedbackError("Reviews are temporarily unavailable because the Supabase library did not load. Reload the page and try again.");
      return;
    }
    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    const selectedCompany = String(formData.get("company") || "");
    const company = (selectedCompany === "__other__"
      ? String(formData.get("customCompany") || "")
      : selectedCompany).trim();
    const rating = Number(formData.get("rating"));
    const category = String(formData.get("category") || "").trim();
    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const isAnonymous = anonymousCheckbox.checked;
    const displayName = isAnonymous ? null : String(formData.get("name") || "").trim();
    if (!company || company.length > 120 || !category || !Number.isInteger(rating) || rating < 1 || rating > 5
      || !title || title.length > 100 || !description || description.length > 2000
      || (!isAnonymous && (!displayName || displayName.length > 80))) {
      error.textContent = "Please provide a company, category, 1–5 star rating, review title and description. Non-anonymous reviews also need a display name.";
      error.hidden = false;
      return;
    }

    const review = {
      company,
      category,
      rating,
      title,
      description,
      is_anonymous: isAnonymous,
      display_name: displayName
    };

    isSubmitting = true;
    submitButton.disabled = true;
    submitButton.textContent = "Submitting review…";
    try {
      const { error: insertError } = await feedbackClient
        .from("company_reviews")
        .insert(review);
      if (insertError) throw insertError;

      form.reset();
      anonymousCheckbox.checked = true;
      optionalDetails.hidden = true;
      reviewerName.disabled = true;
      reviewerName.required = false;
      customCompanyField.hidden = true;
      customCompany.required = false;
      companySearch.value = "";
      populateCompanyOptions(companySelect, "", entries);
      dashboardSearch.value = company;
      ratingFilter.value = "";
      try {
        await loadFeedback();
        filter.value = company;
        dashboardSearch.value = company;
        renderDashboard();
        success.textContent = `Your review for ${company} was submitted successfully.`;
      } catch (refreshError) {
        success.textContent = `Your review for ${company} was submitted, but the dashboard could not refresh. ${formatFeedbackError(refreshError, "load")}`;
      }
      success.hidden = false;
      success.focus();
    } catch (submitError) {
      showFeedbackError(formatFeedbackError(submitError, "submit"));
    } finally {
      isSubmitting = false;
      submitButton.disabled = false;
      submitButton.textContent = "Submit review ↗";
    }
  });

  if (!feedbackClient) {
    showFeedbackError("The Supabase library could not be loaded. Check your connection and reload the page.");
    document.querySelector("#dashboard-notice").textContent = "Company reviews could not be loaded.";
    return;
  }
  try {
    await loadFeedback();
  } catch (loadError) {
    showFeedbackError(formatFeedbackError(loadError, "load"));
    document.querySelector("#dashboard-notice").textContent = "Company reviews could not be loaded. Please try again.";
  }
}

function populateCompanyOptions(select, searchTerm = "", entries = []) {
  const selected = select.value;
  const normalizedSearch = searchTerm.trim().toLocaleLowerCase();
  const options = [new Option("Choose a company", "")];
  const allKnownCompanies = new Set(Object.values(companyGroups).flat());

  Object.entries(companyGroups).forEach(([industry, companies]) => {
    const matches = companies.filter((company) => company.toLocaleLowerCase().includes(normalizedSearch));
    if (!matches.length) return;
    const group = document.createElement("optgroup");
    group.label = industry;
    matches.forEach((company) => group.append(new Option(company, company)));
    options.push(group);
  });

  const communityCompanies = [...new Set(entries.map((entry) => entry.company))]
    .filter((company) => !allKnownCompanies.has(company) && company.toLocaleLowerCase().includes(normalizedSearch))
    .sort((a, b) => a.localeCompare(b));
  if (communityCompanies.length) {
    const group = document.createElement("optgroup");
    group.label = "Companies with community reviews";
    communityCompanies.forEach((company) => group.append(new Option(company, company)));
    options.push(group);
  }
  options.push(new Option("Other company or institution…", "__other__"));

  select.replaceChildren(...options);
  if (selected && [...select.options].some((option) => option.value === selected)) select.value = selected;
}

function normalizeFeedbackEntry(row) {
  const rating = Number(row.rating);
  return {
    id: row.id,
    company: String(row.company || ""),
    category: String(row.category || ""),
    rating: Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : 0,
    title: String(row.title || ""),
    description: String(row.description || ""),
    anonymous: Boolean(row.is_anonymous),
    name: row.is_anonymous ? "" : String(row.display_name || ""),
    createdAt: String(row.created_at || "")
  };
}

function renderFeedbackDashboard(entries, filters) {
  const list = document.querySelector("#feedback-list");
  const normalizedSearch = filters.search.trim().toLocaleLowerCase();
  const searchMatches = entries.filter((entry) => !normalizedSearch
    || entry.company.toLocaleLowerCase().includes(normalizedSearch));
  const companyCounts = new Map();
  searchMatches.forEach((entry) => {
    const summary = companyCounts.get(entry.company) || { count: 0, total: 0 };
    summary.count += 1;
    summary.total += entry.rating;
    companyCounts.set(entry.company, summary);
  });
  renderCompanyCards(companyCounts, entries, filters);

  const matching = searchMatches
    .filter((entry) => !filters.company || entry.company === filters.company)
    .filter((entry) => !filters.rating || entry.rating === Number(filters.rating))
    .sort((a, b) => {
      const order = Date.parse(a.createdAt) - Date.parse(b.createdAt);
      return filters.sort === "oldest" ? order : -order;
    });
  const average = matching.length
    ? (matching.reduce((total, entry) => total + Number(entry.rating), 0) / matching.length).toFixed(1)
    : "—";

  document.querySelector("#feedback-count").textContent = String(matching.length);
  document.querySelector("#feedback-average").textContent = matching.length ? `${average} / 5` : "—";
  document.querySelector("#dashboard-notice").textContent = matching.length
    ? `Showing ${matching.length} ${matching.length === 1 ? "review" : "reviews"} from the community.`
    : entries.length
      ? "No reviews match these filters. Try changing your search or filters."
      : "No company reviews yet. Be the first to share an experience.";

  const filter = document.querySelector("#feedback-filter");
  const currentFilter = filter.value;
  filter.replaceChildren(new Option("All companies", ""));
  [...new Set(entries.map((entry) => entry.company))]
    .sort((a, b) => a.localeCompare(b))
    .forEach((company) => filter.add(new Option(company, company)));
  if ([...filter.options].some((option) => option.value === currentFilter)) filter.value = currentFilter;

  if (!matching.length) {
    list.replaceChildren(createTextElement("p", entries.length
      ? "Try another company or rating to find reviews."
      : "Reviews will appear here as customers share their experiences."));
    list.firstElementChild.className = "feedback-empty";
    return;
  }

  list.replaceChildren(...matching.map((entry) => {
    const card = document.createElement("article");
    card.className = "feedback-entry";
    const top = document.createElement("div");
    top.className = "feedback-entry-top";
    top.append(createTextElement("span", `${entry.company} · ${entry.category}`));
    const rating = createTextElement("span", `${"★".repeat(entry.rating)}${"☆".repeat(5 - entry.rating)} ${entry.rating}/5`);
    rating.className = "feedback-entry-rating";
    rating.setAttribute("aria-label", `${entry.rating} out of 5 stars`);
    top.append(rating);
    card.append(top, createTextElement("h3", entry.title), createTextElement("p", entry.description));
    const meta = document.createElement("div");
    meta.className = "feedback-entry-meta";
    const author = entry.anonymous ? "Anonymous" : entry.name || "Community member";
    const dateText = Number.isNaN(Date.parse(entry.createdAt))
      ? "Date unavailable"
      : new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(new Date(entry.createdAt));
    meta.append(createTextElement("span", author), createTextElement("time", dateText));
    card.append(meta);
    return card;
  }));
}

function renderCompanyCards(companyCounts, entries, filters) {
  const container = document.querySelector("#company-cards");
  const selectedCompany = document.querySelector("#feedback-filter").value;
  const companies = [...companyCounts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  if (!companies.length) {
    container.replaceChildren();
    return;
  }

  container.replaceChildren(...companies.map(([company, summary]) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "company-review-card";
    card.setAttribute("aria-pressed", String(company === selectedCompany));
    const name = createTextElement("strong", company);
    const rating = createTextElement("span", `${(summary.total / summary.count).toFixed(1)} ★`);
    rating.className = "company-review-rating";
    const count = createTextElement("span", `${summary.count} ${summary.count === 1 ? "review" : "reviews"}`);
    card.append(name, rating, count);
    card.addEventListener("click", () => {
      document.querySelector("#feedback-filter").value = company;
      document.querySelector("#dashboard-search").value = company;
      renderFeedbackDashboard(entries, {
        company,
        search: company,
        rating: document.querySelector("#rating-filter").value,
        sort: document.querySelector("#review-sort").value || filters.sort
      });
    });
    return card;
  }));
}

function formatFeedbackError(error, operation) {
  const code = error?.code;
  const message = String(error?.message || "");
  if (code === "42501" || /row-level security|permission denied|not allowed/i.test(message)) {
    return operation === "submit"
      ? "Supabase rejected the review under the current Row Level Security policies. Allow public inserts for valid reviews, without enabling update or delete."
      : "Supabase denied public access to company reviews. Check that the table has a public SELECT policy.";
  }
  if (error instanceof TypeError || /fetch|network|timeout/i.test(message)) {
    return "A network error prevented access to company reviews. Check your connection and try again.";
  }
  return operation === "submit"
    ? `Your review could not be submitted. ${message || "Please check your connection and try again."}`
    : `Company reviews could not be loaded. ${message || "Please try again."}`;
}

if (appName === "weather") initWeatherReport();
if (appName === "goals") initGoalQuestionnaire();
if (appName === "feedback") initFeedbackPlatform();
