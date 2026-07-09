const SHEET_ID = "1g2-5y9fO-Fp191g7AF61fI9my9-omGvq0Va7Ha0WFXc";
const SHEET_GID = "123456789";
const METRICS = ["Total Assets", "Total Liabilities", "Net Worth", "Investible Net Worth", "FIRE"];

const fallbackRows = [
  ["Metric", "2019", "", "", "", "", "", "", "", "", "", "", "", "2020", "", "", "", "", "", "", "", "", "", "", "", "2021", "", "", "", "", "", "", "", "", "", "", "", "2022", "", "", "", "", "", "", "", "", "", "", "", "2023", "", "", "", "", "", "", "", "", "", "", "", "2024"],
  ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
  ["Total Assets", 674300,673876,688157,693570,699300,704205,708663,722732,719195,733133,753204,749286,839940,853132,878998,890976,897207,903433,910577,911990,922717,935638,937073,943057,943237,952564,949669,962589,953613,961457,946107,1017345,1058266,1172593,1203956,1217061,1256150,1351842,1364118,1359878,1434359,1463441,1479043,1505646,1507022,1542969,1724550,1693435,1783849,1809430,1837074,1864714,1884902,1870390,1877418,1853902,1888849,1845733,1867030,1753689,1847389,1858872,1883805],
  ["Total Liabilities", 521005,525233,523344,518455,516188,513054,510340,509057,503461,504475,501603,504194,502276,500260,501082,501082,498164,491035,475903,502440,492100,482269,481000,472691,466385,459928,446175,431178,431800,425800,425800,417453,392239,425993,405235,397459,388211,384638,359736,349737,338524,335848,332252,330376,328748,325450,322481,317703,316167,269770,267699,264170,263548,261468,255961,255961,254141,251025,251025,249373,246062,244399,207693],
  ["Net Worth", 153295,148643,164813,175115,183112,191151,198323,213675,215734,228658,251601,245092,337664,352872,377916,389894,399043,412398,434674,409550,430617,453369,456073,470366,476852,492636,503494,531411,521813,535657,520307,599892,666027,746600,798721,819602,867939,967204,1004382,1010141,1095835,1127593,1146791,1175270,1178274,1217519,1402069,1375732,1467682,1539660,1569375,1600544,1621354,1608922,1621457,1597941,1634708,1594708,1616005,1504316,1601327,1614473,1676112],
  ["Investible Net Worth", 208795,208904,223185,229905,236177,242174,247227,246804,243822,258535,264733,261382,342605,356371,347170,359148,365965,372778,380512,382519,393940,407606,409644,416234,417024,426962,424928,438467,429961,437805,422455,449165,493151,562961,601048,621929,633829,681677,714392,720151,785460,814711,830484,857087,858634,894924,936505,905735,996149,1021903,1049721,1077536,1097899,1083563,1090943,1067427,1102729,1059791,1081088,967926,1061985,1073649,1133805],
  ["FIRE", -181705,-186357,-170187,-159885,-151888,-143849,-136677,-136325,-134266,-121342,-113399,-119908,-37336,-22128,-34084,-22106,-12957,398,22674,-2450,18617,41369,44073,58366,64852,80636,91494,119411,109813,123657,108307,129892,196027,226600,278721,299602,317939,367204,404382,410141,485835,517593,536791,565270,568274,607519,652069,625732,717682,789660,819375,850544,871354,858922,871457,847941,884708,844708,866005,754316,851327,864473,926112]
];

let dashboardData = null;

function currency(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0);
}

function parseNumber(value) {
  if (typeof value === "number") return value;
  if (!value) return 0;
  return Number(String(value).replace(/[^0-9.-]/g, "")) || 0;
}

function normalizeRows(rows) {
  const yearRow = rows[0] || [];
  const monthRow = rows[1] || [];
  const labels = [];
  let currentYear = "";
  for (let i = 1; i < Math.max(yearRow.length, monthRow.length); i++) {
    if (yearRow[i]) currentYear = String(yearRow[i]);
    labels.push(`${monthRow[i] || ""} ${currentYear}`.trim());
  }

  const series = {};
  rows.slice(2).forEach(row => {
    const name = row[0];
    if (!METRICS.includes(name)) return;
    series[name] = row.slice(1).map(parseNumber);
  });

  const maxLength = Math.max(...Object.values(series).map(values => values.length));
  let latestIndex = maxLength - 1;
  while (latestIndex > 0 && Object.values(series).every(values => !values[latestIndex])) latestIndex--;

  return { labels, series, latestIndex };
}

function rowsFromGoogleResponse(response) {
  return response.table.rows.map(row =>
    (row.c || []).map(cell => cell ? (cell.f ?? cell.v ?? "") : "")
  );
}

function init(data, source = "Google Sheet") {
  dashboardData = normalizeRows(data);
  document.getElementById("dataStatus").textContent = `Loaded from ${source}`;
  buildMetricSelect();
  renderCards();
  renderTable();
  renderChart("Net Worth");
}

function buildMetricSelect() {
  const select = document.getElementById("metricSelect");
  select.innerHTML = METRICS.map(metric => `<option value="${metric}">${metric}</option>`).join("");
  select.value = "Net Worth";
  select.addEventListener("change", event => renderChart(event.target.value));
}

function getLatest(metric) {
  const values = dashboardData.series[metric] || [];
  const i = dashboardData.latestIndex;
  return { current: values[i] || 0, previous: values[i - 1] || 0, change: (values[i] || 0) - (values[i - 1] || 0) };
}

function renderCards() {
  const cards = document.getElementById("cards");
  cards.innerHTML = METRICS.map(metric => {
    const { current, change } = getLatest(metric);
    const changeClass = change > 0 ? "positive" : change < 0 ? "negative" : "neutral";
    const sign = change > 0 ? "+" : "";
    return `<article class="card">
      <p class="card-title">${metric}</p>
      <p class="card-value">${currency(current)}</p>
      <p class="card-change ${changeClass}">${sign}${currency(change)} vs prior month</p>
    </article>`;
  }).join("");
}

function renderTable() {
  const latestLabel = dashboardData.labels[dashboardData.latestIndex] || "Latest";
  document.getElementById("latestLabel").textContent = latestLabel;
  document.getElementById("summaryTable").innerHTML = METRICS.map(metric => {
    const { current, previous, change } = getLatest(metric);
    const changeClass = change > 0 ? "positive" : change < 0 ? "negative" : "neutral";
    const sign = change > 0 ? "+" : "";
    return `<tr>
      <td>${metric}</td>
      <td>${currency(current)}</td>
      <td>${currency(previous)}</td>
      <td class="${changeClass}">${sign}${currency(change)}</td>
    </tr>`;
  }).join("");
}

function renderChart(metric) {
  document.getElementById("chartTitle").textContent = `${metric} Over Time`;
  const svg = document.getElementById("trendChart");
  const values = (dashboardData.series[metric] || []).slice(0, dashboardData.latestIndex + 1);
  const labels = dashboardData.labels.slice(0, dashboardData.latestIndex + 1);
  const width = 900, height = 320, pad = 46;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const points = values.map((value, i) => {
    const x = pad + (i / Math.max(values.length - 1, 1)) * (width - pad * 2);
    const y = height - pad - ((value - min) / range) * (height - pad * 2);
    return [x, y, value, labels[i]];
  });
  const path = points.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const first = points[0], last = points[points.length - 1];
  svg.innerHTML = `
    <line class="axis" x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}" />
    <line class="axis" x1="${pad}" y1="${pad}" x2="${pad}" y2="${height - pad}" />
    <text class="value-label" x="${pad}" y="24">${currency(max)}</text>
    <text class="label" x="${pad}" y="${height - 12}">${first?.[3] || ""}</text>
    <text class="label" text-anchor="end" x="${width - pad}" y="${height - 12}">${last?.[3] || ""}</text>
    <path class="line" d="${path}" />
    ${points.map((p, i) => i === 0 || i === points.length - 1 ? `<circle class="dot" cx="${p[0]}" cy="${p[1]}" r="6"><title>${p[3]}: ${currency(p[2])}</title></circle>` : "").join("")}
    <text class="value-label" text-anchor="end" x="${width - pad}" y="${Math.max(pad + 16, (last?.[1] || pad) - 14)}">${currency(last?.[2] || 0)}</text>
  `;
}

window.googleSheetCallback = function(response) {
  try {
    init(rowsFromGoogleResponse(response), "Google Sheet");
  } catch (error) {
    console.warn("Could not parse Google Sheet response. Using fallback data.", error);
    init(fallbackRows, "fallback data");
  }
};

function loadGoogleSheet() {
  const script = document.createElement("script");
  script.src = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?gid=${SHEET_GID}&tqx=responseHandler:googleSheetCallback`;
  script.onerror = () => init(fallbackRows, "fallback data");
  document.body.appendChild(script);
  setTimeout(() => {
    if (!dashboardData) init(fallbackRows, "fallback data");
  }, 5000);
}

loadGoogleSheet();
