import { useState, useEffect, useRef } from "react";

// ── Expense categories ────────────────────────────────────────────────────────
// Each log entry gets a category: "consumable" | "preventative" | "repair" | "fuel"
// Fuel logs are separate from service logs

const CAT_LABELS = {
  consumable:    { label: "Consumable",    color: "#60a5fa", bg: "#0f1f3a" },
  preventative:  { label: "Preventive",    color: "#a78bfa", bg: "#1a1030" },
  repair:        { label: "Repair",        color: "#f87171", bg: "#3a1010" },
  fuel:          { label: "Fuel",          color: "#34d399", bg: "#0a2a1e" },
};

// Auto-classify service labels into categories
function autoCategory(label) {
  const l = label.toLowerCase();
  if (l.includes("fuel") && !l.includes("filter")) return "fuel";
  if (l.includes("oil") || l.includes("filter") || l.includes("rotation") ||
      l.includes("wiper") || l.includes("bulb")) return "consumable";
  if (l.includes("flush") || l.includes("fluid") || l.includes("inspection") ||
      l.includes("alignment") || l.includes("spark") || l.includes("pm ") ||
      l.includes("service") || l.includes("transmission") || l.includes("differential") ||
      l.includes("coolant") || l.includes("battery")) return "preventative";
  return "repair";
}

// ── Manufacturer schedules ────────────────────────────────────────────────────
const SCHEDULES = {
  "VW Golf Alltrack": [
    { id:"vw-oil",   miles:10000, label:"Oil & Filter Change" },
    { id:"vw-tire",  miles:10000, label:"Tire Rotation" },
    { id:"vw-cabin", miles:20000, label:"Cabin Air Filter" },
    { id:"vw-air",   miles:30000, label:"Engine Air Filter" },
    { id:"vw-spark", miles:40000, label:"Spark Plugs" },
    { id:"vw-brake", miles:30000, label:"Brake Fluid Flush" },
    { id:"vw-fuel",  miles:30000, label:"Fuel Filter" },
    { id:"vw-cool",  miles:60000, label:"Cooling System Flush" },
    { id:"vw-dsg",   miles:40000, label:"DSG Transmission Service" },
    { id:"vw-align", miles:30000, label:"Four Wheel Alignment" },
    { id:"vw-batt",  miles:50000, label:"Battery Inspection" },
    { id:"vw-pads",  miles:30000, label:"Brake Pads & Rotors Inspection" },
  ],
  "Jeep Gladiator": [
    { id:"jg-oil",   miles:5000,   label:"Oil & Filter Change" },
    { id:"jg-tire",  miles:10000,  label:"Tire Rotation" },
    { id:"jg-cabin", miles:20000,  label:"Cabin Air Filter" },
    { id:"jg-spark", miles:30000,  label:"Spark Plugs" },
    { id:"jg-brake", miles:30000,  label:"Brake Fluid Flush" },
    { id:"jg-xfer",  miles:45000,  label:"Transfer Case Fluid" },
    { id:"jg-diff",  miles:45000,  label:"Front/Rear Differential Fluid" },
    { id:"jg-trans", miles:60000,  label:"Transmission Fluid" },
    { id:"jg-cool",  miles:60000,  label:"Coolant Flush" },
    { id:"jg-time",  miles:100000, label:"Timing Chain Inspection" },
  ],
  "Dodge Durango": [
    { id:"dd-oil",   miles:5000,   label:"Oil & Filter Change" },
    { id:"dd-tire",  miles:10000,  label:"Tire Rotation" },
    { id:"dd-cabin", miles:20000,  label:"Cabin Air Filter" },
    { id:"dd-spark", miles:30000,  label:"Spark Plugs (V6)" },
    { id:"dd-brake", miles:30000,  label:"Brake Fluid Flush" },
    { id:"dd-xfer",  miles:30000,  label:"Transfer Case Fluid (AWD)" },
    { id:"dd-diff",  miles:45000,  label:"Front/Rear Differential Fluid" },
    { id:"dd-trans", miles:60000,  label:"Transmission Fluid" },
    { id:"dd-cool",  miles:60000,  label:"Coolant Flush" },
    { id:"dd-hemi",  miles:100000, label:"Spark Plugs (HEMI)" },
  ],
  "Chevrolet Blazer EV": [
    { id:"ev-tire",   miles:7500,   label:"Tire Rotation" },
    { id:"ev-cabin",  miles:12000,  label:"Cabin Air Filter" },
    { id:"ev-brkchk", miles:25000,  label:"Brake Fluid Check" },
    { id:"ev-brkfl",  miles:36000,  label:"Brake Fluid Flush" },
    { id:"ev-wiper",  miles:50000,  label:"Wiper Blades" },
    { id:"ev-batcl",  miles:75000,  label:"Battery Coolant Flush" },
    { id:"ev-drive",  miles:150000, label:"Drive Unit Fluid" },
  ],
  "Chevrolet Corvette C5": [
    { id:"c5-oil",   miles:5000,  label:"Oil & Filter Change" },
    { id:"c5-tire",  miles:10000, label:"Tire Rotation" },
    { id:"c5-spark", miles:30000, label:"Spark Plugs" },
    { id:"c5-brake", miles:30000, label:"Brake Fluid Flush" },
    { id:"c5-cool",  miles:50000, label:"Coolant Flush" },
    { id:"c5-trans", miles:30000, label:"Manual Transmission Fluid" },
    { id:"c5-diff",  miles:30000, label:"Rear Differential Fluid" },
    { id:"c5-fuel",  miles:30000, label:"Fuel Filter" },
    { id:"c5-air",   miles:30000, label:"Engine Air Filter" },
  ],
  "RAM 1500/2500": [
    { id:"ram-oil",   miles:5000,  label:"Oil & Filter Change" },
    { id:"ram-tire",  miles:10000, label:"Tire Rotation" },
    { id:"ram-cabin", miles:20000, label:"Cabin Air Filter" },
    { id:"ram-spark", miles:30000, label:"Spark Plugs" },
    { id:"ram-brake", miles:30000, label:"Brake Fluid Flush" },
    { id:"ram-xfer",  miles:30000, label:"Transfer Case Fluid" },
    { id:"ram-diff",  miles:30000, label:"Front/Rear Differential Fluid" },
    { id:"ram-trans", miles:60000, label:"Transmission Fluid" },
    { id:"ram-cool",  miles:60000, label:"Coolant Flush" },
  ],
  "BMW X2 xDrive": [
    { id:"bmw-oil",   miles:10000, label:"Oil & Filter Change" },
    { id:"bmw-tire",  miles:10000, label:"Tire Rotation" },
    { id:"bmw-cabin", miles:20000, label:"Cabin Air Filter" },
    { id:"bmw-air",   miles:30000, label:"Engine Air Filter" },
    { id:"bmw-spark", miles:45000, label:"Spark Plugs" },
    { id:"bmw-brake", miles:30000, label:"Brake Fluid Flush" },
    { id:"bmw-cool",  miles:60000, label:"Coolant Flush" },
    { id:"bmw-trans", miles:50000, label:"Transmission Fluid" },
    { id:"bmw-align", miles:30000, label:"Four Wheel Alignment" },
    { id:"bmw-pads",  miles:30000, label:"Front Brake Pads & Rotors" },
    { id:"bmw-micro", miles:30000, label:"Microfilter (HVAC)" },
  ],
  "Chevrolet Cruze": [
    { id:"cz-oil",   miles:7500,  label:"Oil & Filter Change" },
    { id:"cz-tire",  miles:7500,  label:"Tire Rotation" },
    { id:"cz-cabin", miles:15000, label:"Cabin Air Filter" },
    { id:"cz-air",   miles:30000, label:"Engine Air Filter" },
    { id:"cz-spark", miles:30000, label:"Spark Plugs" },
    { id:"cz-brake", miles:30000, label:"Brake Fluid Flush" },
    { id:"cz-cool",  miles:60000, label:"Coolant Flush" },
    { id:"cz-trans", miles:45000, label:"Transmission Fluid" },
    { id:"cz-pads",  miles:30000, label:"Front Brake Pads & Rotors" },
    { id:"cz-align", miles:30000, label:"Four Wheel Alignment" },
  ],
  "Custom Vehicle": [],
};

// ── Bike maintenance ──────────────────────────────────────────────────────────
const BIKE_MAINT = [
  { id:"bm-chain",    label:"Chain Replacement",    intervalMiles:2000, notes:"Check stretch with chain checker first" },
  { id:"bm-cassette", label:"Cassette Replacement", intervalMiles:6000, notes:"Replace every 3rd chain typically" },
  { id:"bm-pads",     label:"Brake Pad Check",      intervalMiles:2000, notes:"Check thickness; replace if <1mm" },
  { id:"bm-tape",     label:"Bar Tape / Wrap",       intervalMiles:5000, notes:"Replace when worn or after a crash" },
  { id:"bm-tires",    label:"Tire Inspection",       intervalMiles:3000, notes:"Check for cuts, wear; replace if needed" },
  { id:"bm-clean",    label:"Drivetrain Deep Clean", intervalMiles:1000, notes:"Degrease chain, cassette, chainrings, derailleur" },
];

const BIKE_CATS = {
  road:    { label:"Road",    color:"#f97316", bg:"#3a1f0a", icon:"🚴" },
  gravel:  { label:"Gravel",  color:"#22c55e", bg:"#0d2311", icon:"🚵" },
  trainer: { label:"Trainer", color:"#60a5fa", bg:"#0f1f3a", icon:"🏋️" },
  zwift:   { label:"Zwift",   color:"#a78bfa", bg:"#1a1030", icon:"⚡" },
  ebike:   { label:"E-Bike",  color:"#34d399", bg:"#0a2a1e", icon:"⚡" },
};

// ── Strava live config ───────────────────────────────────────────────────────
const SHEETS_API_KEY         = "AIzaSyC4ppUXhaQcGBZhaaQGlQ_NZKwI_o7M7Vs";
const STRAVA_SHEET_RIDE      = "1nFzYrOB4-VtbK532x6IdJond3m2XQ6afCOOix8RfPZU";   // Regular rides
const STRAVA_SHEET_VIRTUAL   = "151t95RUZFvRRW39A6oacWzAnJwWFXuhs39PENxhrD7g";   // Virtual/Zwift
const STRAVA_SHEET_EBIKE     = "1ew9bRXKdIzagiQ7cNVJbNrlA9_Wr2mpuGxXqR4ejHsQ";  // E-bike rides

// Sheet routing by bike subtype — determines which sheet(s) a bike can see
const BIKE_SHEET_MAP = {
  road:    ["ride"],
  gravel:  ["ride"],
  trainer: ["virtual"],
  zwift:   ["virtual"],
  ebike:   ["ebike"],
};

async function fetchStravaSheet(sheetId) {
  const url = "https://sheets.googleapis.com/v4/spreadsheets/" + sheetId +
    "/values/Sheet1?key=" + SHEETS_API_KEY;
  try {
    const res  = await fetch(url);
    const data = await res.json();
    if (data.error) {
      console.error("Sheets API error for", sheetId, ":", data.error.message, data.error.status);
      return [];
    }
    const rows = data.values || [];
    console.log("Sheets fetched", sheetId.slice(0,8), ":", rows.length, "rows");
    if (rows.length > 0) console.log("  First row sample:", rows[0].slice(0,4));
    // Filter: must have a date in col 0 and strava URL somewhere in cols 5-6
    return rows.filter(r => r.length >= 6 && r[0] && (
      (r[5] && r[5].includes("strava.com/activities")) ||
      (r[4] && r[4].includes("strava.com/activities"))
    ));
  } catch(e) {
    console.error("Sheets fetch error:", sheetId.slice(0,8), e.message);
    return [];
  }
}

// Parse any Strava sheet row into a unified ride object keyed by activity ID
// Key format: "{sheetType}-{activityId}"  e.g. "ride-8880651361", "ebike-11184437927"
function parseSheetRows(rows, sheetType) {
  return rows.map(r => {
    const dateStr = r[0] || "";
    const name    = r[1] || "Ride";
    const meters  = parseFloat(r[2]) || 0;
    const dur     = r[3] || "";
    const url     = (r[5] && r[5].includes("strava.com")) ? r[5] : (r[4] && r[4].includes("strava.com")) ? r[4] : "";
    const actMatch = url.match(/activities\/(\d+)/);
    if (!actMatch) return null;
    const actId = actMatch[1];
    try {
      const cleaned = dateStr.replace(" at ", " ").replace(/([AP]M)$/i, " $1");
      const dt = new Date(cleaned);
      if (isNaN(dt.getTime())) return null;
      const iso  = dt.toISOString().split("T")[0];
      const year = dt.getFullYear();
      const mi   = Math.round((meters / 1609.34) * 100) / 100;
      return { key: sheetType + "-" + actId, actId, d: iso, n: name, mi, dur, year, type: sheetType };
    } catch(e) { return null; }
  }).filter(Boolean).sort((a,b) => a.d.localeCompare(b.d));
}


// ── Bike component categories & costs ────────────────────────────────────────
const COMP_CATS = {
  drivetrain: { label:"Drivetrain", color:"#f97316", icon:"⚙️",  items:["bm-chain","bm-cassette","bm-clean"] },
  wheels:     { label:"Wheels",     color:"#60a5fa", icon:"🔵",  items:["bm-tires"] },
  cockpit:    { label:"Cockpit",    color:"#a78bfa", icon:"🎯",  items:["bm-tape"] },
  brakes:     { label:"Brakes",     color:"#ef4444", icon:"🛑",  items:["bm-pads"] },
  other:      { label:"Other",      color:"#9ca3af", icon:"🔧",  items:[] },
};

function bikePct(lastMiles, intervalMiles, currentMiles) {
  if (lastMiles === null) {
    const start = Math.floor(currentMiles / intervalMiles) * intervalMiles;
    return Math.min(100, Math.round(((currentMiles - start) / intervalMiles) * 100));
  }
  return Math.min(100, Math.round(((currentMiles - lastMiles) / intervalMiles) * 100));
}

function bikeMiLeft(lastMiles, intervalMiles, currentMiles) {
  if (lastMiles === null) {
    const next = Math.ceil(currentMiles / intervalMiles) * intervalMiles;
    return Math.max(0, next - currentMiles);
  }
  return Math.max(0, lastMiles + intervalMiles - currentMiles);
}

function bikeAlerts(bike, bikeLogs) {
  const red=[], yellow=[];
  BIKE_MAINT.forEach(item => {
    const key = bike.id+"-"+item.id;
    const logs = (bikeLogs[key]||[]).sort((a,b)=>b.miles-a.miles);
    const lastMiles = logs[0]?.miles ?? null;
    const pct = bikePct(lastMiles, item.intervalMiles, bike.currentMiles);
    if (pct >= 100) red.push(item.label);
    else if (pct >= 80) yellow.push(item.label);
  });
  return { red, yellow };
}

const VW_ID    = "vw-alltrack-2017";
const C5_ID    = "corvette-c5-2001";
const RAM_ID   = "ram-1500-2015";
const BMW_ID   = "bmw-x2-2018";
const CRUZE_ID = "cruze-2013";

// ── Default data (pre-loaded fleet) ──────────────────────────────────────────
// Service log entry shape:
//   { id, serviceLabel, miles, date, notes, cost?, category?, gallons?, pricePerGallon? }
// category: "consumable" | "preventative" | "repair" | "fuel"
// fuel entries also have: gallons, pricePerGallon

const DEFAULT_DATA = {
  vehicles: [
    { id:VW_ID,    name:"Alltrack",      status:"active",       make:"VW Golf Alltrack",     year:"2017", odometer:57350, vin:"3VWH17AU9HM512422", purchasePrice:null, marketValues:{tradeIn:9625,privateParty:10500,source:"KBB Apr 2026",asOf:"2026-04-18"},   photo:"", schedule:SCHEDULES["VW Golf Alltrack"],     updatedAt:new Date().toISOString() },
    { id:C5_ID,    name:"Corvette",       status:"active",       make:"Chevrolet Corvette C5", year:"2001", odometer:23769, vin:"1G1YY22G415129034", purchasePrice:null, marketValues:{tradeIn:10950,privateParty:13850,source:"KBB Apr 2026",asOf:"2026-04-18"},   photo:"", schedule:SCHEDULES["Chevrolet Corvette C5"], updatedAt:new Date().toISOString() },
    { id:RAM_ID,   name:"R/T Sport",      status:"active",      make:"RAM 1500/2500",         year:"2015", odometer:39245, vin:"3C6JR6CTXFG656625", purchasePrice:null, marketValues:{tradeIn:12150,privateParty:14800,source:"KBB Apr 2026",asOf:"2026-04-18"},   photo:"", schedule:SCHEDULES["RAM 1500/2500"],          updatedAt:new Date().toISOString() },
    { id:BMW_ID,   name:"X2 (Lauren)",    status:"active",    make:"BMW X2 xDrive",         year:"2018", odometer:73384, vin:"WBXYJ5C33JEF75559", purchasePrice:null, marketValues:{tradeIn:11150,privateParty:13550,source:"KBB Apr 2026",asOf:"2026-04-18"},   photo:"", schedule:SCHEDULES["BMW X2 xDrive"],          updatedAt:new Date().toISOString() },
    { id:CRUZE_ID, name:"Cruze (Nicole)", status:"active", make:"Chevrolet Cruze",        year:"2013", odometer:79458, vin:"1G1PA5SG2D7276897", purchasePrice:null, marketValues:{tradeIn:1825,privateParty:3900,source:"KBB Apr 2026",asOf:"2026-04-18"},   photo:"", schedule:SCHEDULES["Chevrolet Cruze"],        updatedAt:new Date().toISOString() },
  ],
  logs: {
    [VW_ID]: [
      { id:"l01",  serviceLabel:"Oil & Filter Change",            miles:6180,  date:"2018-11-12", notes:"Stone Mountain VW",                                      category:"consumable",   cost:null },
      { id:"l02",  serviceLabel:"Tire Rotation",                  miles:6180,  date:"2018-11-12", notes:"Stone Mountain VW",                                      category:"consumable",   cost:null },
      { id:"l03",  serviceLabel:"Oil & Filter Change",            miles:14520, date:"2019-10-31", notes:"Stone Mountain VW",                                      category:"consumable",   cost:null },
      { id:"l04",  serviceLabel:"Tire Rotation",                  miles:14520, date:"2019-10-31", notes:"Stone Mountain VW",                                      category:"consumable",   cost:null },
      { id:"l05",  serviceLabel:"Fuel Filter",                    miles:14520, date:"2019-10-31", notes:"Stone Mountain VW",                                      category:"consumable",   cost:null },
      { id:"l06",  serviceLabel:"Brake Pads & Rotors Inspection", miles:14520, date:"2019-10-31", notes:"Front pads & rotors replaced — Stone Mountain VW",       category:"repair",       cost:null },
      { id:"l07",  serviceLabel:"Oil & Filter Change",            miles:21156, date:"2020-10-15", notes:"Stone Mountain VW",                                      category:"consumable",   cost:null },
      { id:"l08",  serviceLabel:"Tire Rotation",                  miles:21156, date:"2020-10-15", notes:"Stone Mountain VW",                                      category:"consumable",   cost:null },
      { id:"l09",  serviceLabel:"Oil & Filter Change",            miles:27985, date:"2021-10-22", notes:"Stone Mountain VW",                                      category:"consumable",   cost:null },
      { id:"l10",  serviceLabel:"Tire Rotation",                  miles:27985, date:"2021-10-22", notes:"Stone Mountain VW",                                      category:"consumable",   cost:null },
      { id:"l11",  serviceLabel:"Engine Air Filter",              miles:27985, date:"2021-10-22", notes:"Stone Mountain VW",                                      category:"consumable",   cost:null },
      { id:"l12",  serviceLabel:"Cabin Air Filter",               miles:27985, date:"2021-10-22", notes:"Stone Mountain VW",                                      category:"consumable",   cost:null },
      { id:"l13",  serviceLabel:"Oil & Filter Change",            miles:34077, date:"2022-11-04", notes:"Stone Mountain VW",                                      category:"consumable",   cost:null },
      { id:"l14",  serviceLabel:"Tire Rotation",                  miles:34077, date:"2022-11-04", notes:"Stone Mountain VW",                                      category:"consumable",   cost:null },
      { id:"l15",  serviceLabel:"Brake Fluid Flush",              miles:34077, date:"2022-11-04", notes:"Stone Mountain VW",                                      category:"preventative", cost:null },
      { id:"l16",  serviceLabel:"Brake Pads & Rotors Inspection", miles:35000, date:"2022-12-21", notes:"4 tires replaced — Buckhead Tire & Auto, Atlanta GA",    category:"repair",       cost:null },
      { id:"l17",  serviceLabel:"Four Wheel Alignment",           miles:35000, date:"2022-12-21", notes:"Buckhead Tire & Auto",                                   category:"preventative", cost:null },
      { id:"l18",  serviceLabel:"Oil & Filter Change",            miles:40937, date:"2023-10-16", notes:"Jim Ellis VW, Atlanta GA",                               category:"consumable",   cost:null },
      { id:"l19",  serviceLabel:"Brake Fluid Flush",              miles:40937, date:"2023-10-16", notes:"Jim Ellis VW",                                           category:"preventative", cost:null },
      { id:"l20",  serviceLabel:"Cooling System Flush",           miles:40937, date:"2023-10-16", notes:"Jim Ellis VW",                                           category:"preventative", cost:null },
      { id:"l21",  serviceLabel:"Spark Plugs",                    miles:40937, date:"2023-10-16", notes:"Jim Ellis VW",                                           category:"consumable",   cost:null },
      { id:"l22",  serviceLabel:"Oil & Filter Change",            miles:46419, date:"2024-09-13", notes:"Audi North Atlanta, Roswell GA",                         category:"consumable",   cost:null },
      { id:"l23",  serviceLabel:"Tire Rotation",                  miles:46419, date:"2024-09-13", notes:"Audi North Atlanta",                                     category:"consumable",   cost:null },
      { id:"l24",  serviceLabel:"Four Wheel Alignment",           miles:46419, date:"2024-09-13", notes:"Audi North Atlanta",                                     category:"preventative", cost:null },
      { id:"l25",  serviceLabel:"Battery Inspection",             miles:46419, date:"2024-09-13", notes:"Battery replaced — Audi North Atlanta",                  category:"repair",       cost:null },
      { id:"l26",  serviceLabel:"Brake Pads & Rotors Inspection", miles:47067, date:"2024-12-16", notes:"4x Continental DWS06 + 18\" wheels + lowering springs",  category:"repair",       cost:3104.60 },
      { id:"l27",  serviceLabel:"Cabin Air Filter",               miles:52657, date:"2025-08-31", notes:"7,500 PM Service",                                       category:"consumable",   cost:null },
      { id:"l28",  serviceLabel:"Oil & Filter Change",            miles:52657, date:"2025-08-31", notes:"7,500 PM Service",                                       category:"consumable",   cost:137.52 },
      { id:"l29",  serviceLabel:"Tire Rotation",                  miles:52657, date:"2025-08-31", notes:"7,500 PM Service",                                       category:"consumable",   cost:null },
      { id:"l30",  serviceLabel:"Brake Fluid Flush",              miles:52657, date:"2025-08-31", notes:"7,500 PM Service",                                       category:"preventative", cost:145.58 },
    ],
    [C5_ID]: [
      { id:"c5-l1", serviceLabel:"Tires (4) + Wheels",  miles:19857, date:"2021-03-16", notes:"Upgrade/replacement wheels + 4 tires", category:"repair",       cost:1151.89 },
      { id:"c5-l2", serviceLabel:"Oil & Filter Change",  miles:22058, date:"2023-03-08", notes:"7,500 PM — John Adams (Gauge Corp)",  category:"consumable",   cost:130.19 },
      { id:"c5-l3", serviceLabel:"Tire Rotation",        miles:22058, date:"2023-03-08", notes:"7,500 PM Service",                    category:"consumable",   cost:null },
      { id:"c5-l4", serviceLabel:"Engine Air Filter",    miles:22058, date:"2023-03-08", notes:"7,500 PM — checked/replaced",         category:"consumable",   cost:null },
    ],
    [RAM_ID]: [
      { id:"r-l01", serviceLabel:"Oil & Filter Change",  miles:7500,  date:"2018-03-01", notes:"7,500 PM Service",                       category:"consumable",   cost:null },
      { id:"r-l02", serviceLabel:"Tire Rotation",        miles:7500,  date:"2018-03-01", notes:"7,500 PM Service",                       category:"consumable",   cost:null },
      { id:"r-l03", serviceLabel:"Engine Air Filter",    miles:7500,  date:"2018-03-01", notes:"7,500 PM Service",                       category:"consumable",   cost:null },
      { id:"r-l04", serviceLabel:"Four Wheel Alignment", miles:12754, date:"2018-04-19", notes:"Lifetime alignment purchased",           category:"preventative", cost:171.97 },
      { id:"r-l05", serviceLabel:"Oil & Filter Change",  miles:15190, date:"2018-05-23", notes:"7,500 PM Service",                       category:"consumable",   cost:58.86 },
      { id:"r-l06", serviceLabel:"Tire Rotation",        miles:15190, date:"2018-05-23", notes:"7,500 PM Service",                       category:"consumable",   cost:null },
      { id:"r-l07", serviceLabel:"Engine Air Filter",    miles:15190, date:"2018-05-23", notes:"7,500 PM Service",                       category:"consumable",   cost:null },
      { id:"r-l08", serviceLabel:"Cabin Air Filter",     miles:15190, date:"2018-05-23", notes:"Replaced",                               category:"consumable",   cost:null },
      { id:"r-l09", serviceLabel:"Oil & Filter Change",  miles:22825, date:"2018-09-17", notes:"7,500 PM Service",                       category:"consumable",   cost:56.86 },
      { id:"r-l10", serviceLabel:"Tire Rotation",        miles:22825, date:"2018-09-17", notes:"7,500 PM Service",                       category:"consumable",   cost:null },
      { id:"r-l11", serviceLabel:"Engine Air Filter",    miles:22825, date:"2018-09-17", notes:"7,500 PM Service",                       category:"consumable",   cost:null },
      { id:"r-l12", serviceLabel:"Tire Rotation",        miles:26005, date:"2018-12-29", notes:"Tire balancing",                         category:"consumable",   cost:40 },
      { id:"r-l13", serviceLabel:"Battery Inspection",   miles:33269, date:"2021-06-23", notes:"Battery replaced",                       category:"repair",       cost:186.18 },
      { id:"r-l14", serviceLabel:"Oil & Filter Change",  miles:36942, date:"2023-04-07", notes:"7,500 PM — John Adams (Gauge Corp)",     category:"consumable",   cost:139.71 },
      { id:"r-l15", serviceLabel:"Tire Rotation",        miles:36942, date:"2023-04-07", notes:"7,500 PM Service",                       category:"consumable",   cost:null },
      { id:"r-l16", serviceLabel:"Engine Air Filter",    miles:36942, date:"2023-04-07", notes:"7,500 PM Service",                       category:"consumable",   cost:null },
      { id:"r-l17", serviceLabel:"Suspension Upgrade",   miles:37857, date:"2024-01-08", notes:"IHC 3/5 kit + Moes adj shocks + alignment", category:"repair",   cost:4435.26 },
    ],
    [BMW_ID]: [
      { id:"bmw-l01", serviceLabel:"Oil & Filter Change",       miles:47521, date:"2023-08-08", notes:"7,500 PM Service",              category:"consumable",   cost:99.99 },
      { id:"bmw-l02", serviceLabel:"Spark Plugs",               miles:47521, date:"2023-08-08", notes:"Replaced",                     category:"consumable",   cost:171.99 },
      { id:"bmw-l03", serviceLabel:"Cabin Air Filter",          miles:47521, date:"2023-08-08", notes:"Replaced",                     category:"consumable",   cost:74.99 },
      { id:"bmw-l04", serviceLabel:"Tires (4)",                 miles:50395, date:"2023-11-29", notes:"4 tire replacement",            category:"repair",       cost:823.13 },
      { id:"bmw-l05", serviceLabel:"Oil & Filter Change",       miles:59665, date:"2024-10-16", notes:"7,500 PM Service",              category:"consumable",   cost:125 },
      { id:"bmw-l06", serviceLabel:"Tire Rotation",             miles:59665, date:"2024-10-16", notes:"7,500 PM Service",              category:"consumable",   cost:null },
      { id:"bmw-l07", serviceLabel:"Engine Air Filter",         miles:59665, date:"2024-10-16", notes:"7,500 PM — check/replace",      category:"consumable",   cost:null },
      { id:"bmw-l08", serviceLabel:"Front Brake Pads & Rotors", miles:65237, date:"2025-06-28", notes:"Pads, rotors & wear sensor",    category:"repair",       cost:348.08 },
      { id:"bmw-l09", serviceLabel:"Oil & Filter Change",       miles:70457, date:"2025-12-31", notes:"7,500 PM Service",              category:"consumable",   cost:null },
      { id:"bmw-l10", serviceLabel:"Tire Rotation",             miles:70457, date:"2025-12-31", notes:"7,500 PM Service",              category:"consumable",   cost:null },
      { id:"bmw-l11", serviceLabel:"Engine Air Filter",         miles:70457, date:"2025-12-31", notes:"7,500 PM — check/replace",      category:"consumable",   cost:null },
    ],
    [CRUZE_ID]: [
      { id:"cz-l01", serviceLabel:"Oil & Filter Change",       miles:23994, date:"2017-01-30", notes:"",                                        category:"consumable",   cost:null },
      { id:"cz-l02", serviceLabel:"Oil & Filter Change",       miles:27889, date:"2017-09-12", notes:"",                                        category:"consumable",   cost:null },
      { id:"cz-l03", serviceLabel:"Tire Rotation",             miles:28788, date:"2017-10-10", notes:"Tire(s) replaced",                        category:"consumable",   cost:null },
      { id:"cz-l04", serviceLabel:"Oil & Filter Change",       miles:32673, date:"2018-06-08", notes:"7,500 PM Service",                        category:"consumable",   cost:null },
      { id:"cz-l05", serviceLabel:"Engine Air Filter",         miles:32673, date:"2018-06-08", notes:"Replaced",                               category:"consumable",   cost:null },
      { id:"cz-l06", serviceLabel:"Cabin Air Filter",          miles:32673, date:"2018-06-08", notes:"Replaced",                               category:"consumable",   cost:null },
      { id:"cz-l07", serviceLabel:"Oil & Filter Change",       miles:36707, date:"2019-04-10", notes:"7,500 PM Service",                        category:"consumable",   cost:null },
      { id:"cz-l08", serviceLabel:"Tire Rotation",             miles:36707, date:"2019-04-10", notes:"7,500 PM Service",                        category:"consumable",   cost:null },
      { id:"cz-l09", serviceLabel:"A/C Compressor",            miles:37158, date:"2019-05-30", notes:"Compressor replaced, refrigerant recharged", category:"repair",  cost:null },
      { id:"cz-l10", serviceLabel:"Coolant Flush",             miles:38025, date:"2019-07-18", notes:"Water pump replaced + coolant flush",     category:"repair",       cost:null },
      { id:"cz-l11", serviceLabel:"Oil & Filter Change",       miles:40524, date:"2020-02-26", notes:"7,500 PM Service",                        category:"consumable",   cost:null },
      { id:"cz-l12", serviceLabel:"Tire Rotation",             miles:40524, date:"2020-02-26", notes:"7,500 PM Service",                        category:"consumable",   cost:null },
      { id:"cz-l13", serviceLabel:"Oil & Filter Change",       miles:42175, date:"2020-10-13", notes:"7,500 PM Service",                        category:"consumable",   cost:null },
      { id:"cz-l14", serviceLabel:"Tire Rotation",             miles:42175, date:"2020-10-13", notes:"7,500 PM Service",                        category:"consumable",   cost:null },
      { id:"cz-l15", serviceLabel:"Oil & Filter Change",       miles:45228, date:"2021-10-13", notes:"7,500 PM Service",                        category:"consumable",   cost:null },
      { id:"cz-l16", serviceLabel:"Tire Rotation",             miles:45228, date:"2021-10-13", notes:"7,500 PM Service",                        category:"consumable",   cost:null },
      { id:"cz-l17", serviceLabel:"Oil & Filter Change",       miles:48352, date:"2022-09-15", notes:"7,500 PM Service",                        category:"consumable",   cost:null },
      { id:"cz-l18", serviceLabel:"Tire Rotation",             miles:48352, date:"2022-09-15", notes:"7,500 PM Service",                        category:"consumable",   cost:null },
      { id:"cz-l19", serviceLabel:"Coolant Flush",             miles:48352, date:"2022-09-15", notes:"Thermostat replaced + coolant flush",     category:"repair",       cost:null },
      { id:"cz-l20", serviceLabel:"Front Brake Pads & Rotors", miles:48352, date:"2022-09-15", notes:"Front pads & rotors, calipers serviced",  category:"repair",       cost:null },
      { id:"cz-l21", serviceLabel:"Oil & Filter Change",       miles:50518, date:"2023-04-17", notes:"7,500 PM Service",                        category:"consumable",   cost:null },
      { id:"cz-l22", serviceLabel:"Cabin Air Filter",          miles:50518, date:"2023-04-17", notes:"Replaced",                               category:"consumable",   cost:null },
      { id:"cz-l23", serviceLabel:"Oil & Filter Change",       miles:53379, date:"2023-09-29", notes:"",                                        category:"consumable",   cost:null },
      { id:"cz-l24", serviceLabel:"Spark Plugs",               miles:54052, date:"2024-02-14", notes:"Spark plugs & ignition coils replaced",  category:"consumable",   cost:null },
      { id:"cz-l25", serviceLabel:"Oil & Filter Change",       miles:54880, date:"2024-03-08", notes:"7,500 PM Service",                        category:"consumable",   cost:null },
      { id:"cz-l26", serviceLabel:"Tire Rotation",             miles:54880, date:"2024-03-08", notes:"7,500 PM Service",                        category:"consumable",   cost:null },
      { id:"cz-l27", serviceLabel:"Oil & Filter Change",       miles:63338, date:"2024-11-27", notes:"7,500 PM Service",                        category:"consumable",   cost:103.34 },
      { id:"cz-l28", serviceLabel:"Tire Rotation",             miles:63338, date:"2024-11-27", notes:"7,500 PM Service",                        category:"consumable",   cost:null },
      { id:"cz-l29", serviceLabel:"Oil & Filter Change",       miles:70925, date:"2025-07-19", notes:"7,500 PM Service",                        category:"consumable",   cost:50.29 },
      { id:"cz-l30", serviceLabel:"Tire Rotation",             miles:70925, date:"2025-07-19", notes:"7,500 PM Service",                        category:"consumable",   cost:null },
      { id:"cz-l31", serviceLabel:"Oil & Filter Change",       miles:78709, date:"2026-03-21", notes:"7,500 PM Service",                        category:"consumable",   cost:82.40 },
      { id:"cz-l32", serviceLabel:"Tire Rotation",             miles:78709, date:"2026-03-21", notes:"7,500 PM Service",                        category:"consumable",   cost:null },
      { id:"cz-l33", serviceLabel:"Cabin Air Filter",          miles:78709, date:"2026-03-21", notes:"Replaced",                               category:"consumable",   cost:null },
    ],
  },

  // ── Home maintenance ─────────────────────────────────────────────────────
  // property shape: { id, name, address }
  // homeItem shape: { id, propertyId, label, category, intervalDays, lastDone, notes }
  // homeLogs shape: { itemId: [ { id, date, cost, notes } ] }
  properties: [
    { id:"home-main", name:"Main Residence", address:"7079 Ridge Run Court" }
  ],
  homeItems: [
    { id:"hi-dryer",   propertyId:"home-main", label:"Dryer Vent Cleaning",         category:"safety",    intervalDays:365, anchorMonth:7,  anchorDay:1,  lastDone:"2026-02-25", notes:"Annual — schedule in early summer" },
    { id:"hi-fridge",  propertyId:"home-main", label:"Refrigerator Coil Cleaning",  category:"appliance", intervalDays:365, anchorMonth:7,  anchorDay:1,  lastDone:"2025-04-06", notes:"Annual — schedule in early summer" },
    { id:"hi-furnace", propertyId:"home-main", label:"Furnace Filter Replacement",  category:"hvac",      intervalDays:120, anchorMonth:null, anchorDay:null, lastDone:"2025-12-12", notes:"Every 120 days — replace with MERV 8+ filter" },
    { id:"hi-smoke",   propertyId:"home-main", label:"Smoke Detector Battery Check",category:"safety",    intervalDays:365, anchorMonth:11, anchorDay:1,  lastDone:null, notes:"Annual — DST Fall weekend (first Sunday of November)" },
    { id:"hi-snow",    propertyId:"home-main", label:"Snowblower Service",          category:"seasonal",  intervalDays:365, anchorMonth:4,  anchorDay:1,  lastDone:"2026-04-07", notes:"Annual — April after snow season ends" },
    { id:"hi-salt",    propertyId:"home-main", label:"Water Softener Salt Refill",  category:"plumbing",  intervalDays:90,  anchorMonth:null, anchorDay:null, lastDone:"2026-03-28", notes:"Every 90 days" },
    { id:"hi-water",   propertyId:"home-main", label:"Water Heater Flush",          category:"plumbing",  intervalDays:365, anchorMonth:null, anchorDay:null, lastDone:"2026-02-25", notes:"Annual — drain and flush sediment" },
    { id:"hi-gutters", propertyId:"home-main", label:"Gutter Inspection & Cleaning",category:"exterior",  intervalDays:180, anchorMonth:null, anchorDay:null, lastDone:"2021-08-23", notes:"Spring and fall — check for debris and damage" },
  ],

  bikes: [
    { id:"bike-cervelo",    name:"Cervelo S3",        status:"active",        make:"Cervelo",     model:"S3d Ultegra 8020",       type:"road",    currentMiles:15287, purchaseYear:"2018", weight:"17.0 lbs", photo:"" },
    { id:"bike-bianchi",    name:"Bianchi Infinito",  status:"active",  make:"Bianchi",     model:"Infinito CV Disc",        type:"road",    currentMiles:8871,  purchaseYear:"2023", weight:"19.0 lbs", photo:"" },
    { id:"bike-canyon",     name:"Canyon Grizl",      status:"active",      make:"Canyon",      model:"Grizl OnFly 9",           type:"gravel",  currentMiles:1954,  purchaseYear:"2025", weight:"34.3 lbs", photo:"" },
    { id:"bike-diverge",    name:"Kickr Diverge",     status:"active",     make:"Specialized", model:"Diverge Elite DSW/Kickr", type:"trainer", currentMiles:23697, purchaseYear:"2016", weight:"20.0 lbs", photo:"" },
    { id:"bike-zwift",      name:"Z-Ride",            status:"active",            make:"Zwift",       model:"Ride",                    type:"zwift",   currentMiles:4665,  purchaseYear:null,   weight:"30.0 lbs", photo:"" },
  ],
  bikeLogs: {},
  bikeComponents: {},
  rideAssignments: {},
  customCategories: [],
  homeLogs: {
        "hi-snow": [
      { id:"hs01", date:"2026-01-31", cost:25.45,  notes:"Ariens 24\" scraper bar replacement" },
      { id:"hs02", date:"2026-01-31", cost:24.16,  notes:"Blaster silicone lubricant 4-pack — cable & chute lube" },
      { id:"hs03", date:"2026-02-14", cost:29.97,  notes:"Thorstone grease gun kit — for auger fittings" },
      { id:"hs04", date:"2026-02-14", cost:24.99,  notes:"Ariens OEM premium hi-temp grease" },
      { id:"hs05", date:"2026-04-07", cost:31.99,  notes:"Ariens SAE 5W-30 engine oil + fuel treatment (2-pack)" },
      { id:"hs06", date:"2026-04-07", cost:12.98,  notes:"NGK BPR6ES spark plugs (2x)" }
    ],
    "hi-dryer": [
      { id:"h01", date:"2019-07-27", cost:null, notes:"" },
      { id:"h02", date:"2020-07-26", cost:null, notes:"" },
      { id:"h03", date:"2021-11-29", cost:null, notes:"" },
      { id:"h04", date:"2022-12-11", cost:null, notes:"" },
      { id:"h05", date:"2024-01-05", cost:null, notes:"" },
      { id:"h06", date:"2025-01-18", cost:null, notes:"" },
      { id:"h07", date:"2026-02-25", cost:null, notes:"" }
    ],
    "hi-furnace": [
      { id:"h08", date:"2019-07-27", cost:35.0, notes:"" },
      { id:"h09", date:"2019-11-29", cost:37.98, notes:"" },
      { id:"h10", date:"2020-03-27", cost:37.98, notes:"" },
      { id:"h11", date:"2020-07-26", cost:38.0, notes:"" },
      { id:"h12", date:"2020-11-20", cost:40.64, notes:"" },
      { id:"h13", date:"2021-03-26", cost:40.64, notes:"" },
      { id:"h14", date:"2021-07-23", cost:40.64, notes:"" },
      { id:"h15", date:"2021-11-22", cost:40.64, notes:"" },
      { id:"h16", date:"2022-03-17", cost:37.98, notes:"" },
      { id:"h17", date:"2022-06-18", cost:35.7, notes:"" },
      { id:"h18", date:"2022-12-13", cost:37.58, notes:"" },
      { id:"h19", date:"2023-07-17", cost:35.12, notes:"" },
      { id:"h20", date:"2024-12-11", cost:37.58, notes:"Inspect and change" },
      { id:"h21", date:"2025-06-08", cost:37.58, notes:"" },
      { id:"h22", date:"2025-12-12", cost:37.58, notes:"" }
    ],
    "hi-fridge": [
      { id:"h23", date:"2019-12-08", cost:null, notes:"" },
      { id:"h24", date:"2020-12-04", cost:null, notes:"" },
      { id:"h25", date:"2021-11-29", cost:null, notes:"" },
      { id:"h26", date:"2022-11-30", cost:null, notes:"" },
      { id:"h27", date:"2024-04-01", cost:null, notes:"Inspect and clean coils" },
      { id:"h28", date:"2025-04-06", cost:null, notes:"Inspect and clean coils" }
    ],
    "hi-water": [
      { id:"h29", date:"2019-12-08", cost:null, notes:"" },
      { id:"h30", date:"2020-12-04", cost:null, notes:"" },
      { id:"h31", date:"2021-11-29", cost:null, notes:"" },
      { id:"h32", date:"2022-11-30", cost:null, notes:"" },
      { id:"h33", date:"2025-01-20", cost:null, notes:"Drain and flush" },
      { id:"h34", date:"2026-02-25", cost:null, notes:"" }
    ],
    "hi-salt": [
      { id:"h35", date:"2021-02-20", cost:16.74, notes:"" },
      { id:"h36", date:"2021-05-01", cost:6.0, notes:"" },
      { id:"h37", date:"2021-07-17", cost:25.0, notes:"" },
      { id:"h38", date:"2021-10-16", cost:20.0, notes:"" },
      { id:"h39", date:"2022-01-29", cost:15.0, notes:"" },
      { id:"h40", date:"2022-04-23", cost:8.0, notes:"" },
      { id:"h41", date:"2022-07-11", cost:null, notes:"" },
      { id:"h42", date:"2022-12-11", cost:null, notes:"" },
      { id:"h43", date:"2023-04-01", cost:18.0, notes:"" },
      { id:"h44", date:"2023-07-09", cost:21.0, notes:"" },
      { id:"h45", date:"2023-09-24", cost:28.86, notes:"3 bags @ $8.99ea" },
      { id:"h46", date:"2024-01-05", cost:26.36, notes:"4 bags pellets @ $6.59ea" },
      { id:"h47", date:"2024-05-04", cost:19.77, notes:"" },
      { id:"h48", date:"2024-08-03", cost:24.0, notes:"3 bags @ $7.80ea" },
      { id:"h49", date:"2024-10-30", cost:19.77, notes:"" },
      { id:"h50", date:"2025-01-19", cost:13.94, notes:"" },
      { id:"h51", date:"2025-06-07", cost:20.0, notes:"" },
      { id:"h52", date:"2025-08-28", cost:25.62, notes:"$7.98/bag" },
      { id:"h53", date:"2025-11-16", cost:25.0, notes:"3 bags @ $8.50ea" },
      { id:"h54", date:"2026-02-25", cost:36.34, notes:"4 bags @ $8.49ea" },
      { id:"h55", date:"2026-03-28", cost:26.0, notes:"3 bags" }
    ],
    "hi-gutters": [
      { id:"h56", date:"2019-07-27", cost:null, notes:"" },
      { id:"h57", date:"2020-07-26", cost:null, notes:"" },
      { id:"h58", date:"2021-08-23", cost:null, notes:"" }
    ]
  },

  // fuel logs: { vehicleId: [ { id, date, miles, gallons, pricePerGallon, cost } ] }
  fuel: {
    [VW_ID]: [

      { id:"vwf01", date:"2024-11-01", miles:46497, gallons:11.79, pricePerGallon:2.899, cost:34.18 },
      { id:"vwf02", date:"2024-11-27", miles:46807, gallons:12.853, pricePerGallon:2.999, cost:38.55 },
      { id:"vwf03", date:"2024-12-18", miles:47139, gallons:13.21, pricePerGallon:2.959, cost:39.09 },
      { id:"vwf04", date:"2024-12-28", miles:47452, gallons:12.481, pricePerGallon:2.899, cost:36.18 },
      { id:"vwf05", date:"2025-01-08", miles:47760, gallons:11.906, pricePerGallon:2.899, cost:34.52 },
      { id:"vwf06", date:"2025-01-17", miles:48108, gallons:13.69, pricePerGallon:2.899, cost:39.69 },
      { id:"vwf07", date:"2025-01-25", miles:48435, gallons:13.144, pricePerGallon:2.989, cost:39.29 },
      { id:"vwf08", date:"2025-02-04", miles:48766, gallons:12.108, pricePerGallon:2.739, cost:33.16 },
      { id:"vwf09", date:"2025-02-14", miles:49110, gallons:13.421, pricePerGallon:2.999, cost:40.25 },
      { id:"vwf10", date:"2025-02-25", miles:49409, gallons:12.877, pricePerGallon:2.719, cost:35.01 },
      { id:"vwf11", date:"2025-03-07", miles:49746, gallons:12.903, pricePerGallon:2.779, cost:35.86 },
      { id:"vwf12", date:"2025-03-24", miles:50096, gallons:13.446, pricePerGallon:3.179, cost:42.74 },
      { id:"vwf13", date:"2025-04-08", miles:50512, gallons:13.783, pricePerGallon:3.279, cost:45.19 },
      { id:"vwf14", date:"2025-04-29", miles:50894, gallons:13.172, pricePerGallon:2.859, cost:37.66 },
      { id:"vwf15", date:"2025-05-22", miles:51196, gallons:13.566, pricePerGallon:3.399, cost:46.11 },
      { id:"vwf16", date:"2025-06-11", miles:51579, gallons:13.614, pricePerGallon:2.859, cost:38.92 },
      { id:"vwf17", date:"2025-07-17", miles:51905, gallons:13.712, pricePerGallon:3.259, cost:44.69 },
      { id:"vwf18", date:"2025-08-11", miles:52280, gallons:13.739, pricePerGallon:2.979, cost:40.93 },
      { id:"vwf19", date:"2025-09-01", miles:52665, gallons:13.593, pricePerGallon:3.059, cost:41.58 },
      { id:"vwf20", date:"2025-09-25", miles:53039, gallons:13.087, pricePerGallon:2.779, cost:36.37 },
      { id:"vwf21", date:"2025-10-21", miles:53425, gallons:13.882, pricePerGallon:2.689, cost:37.33 },
      { id:"vwf22", date:"2025-11-16", miles:53798, gallons:13.769, pricePerGallon:2.759, cost:37.99 },
      { id:"vwf23", date:"2025-12-02", miles:54146, gallons:13.081, pricePerGallon:2.659, cost:34.78 },
      { id:"vwf24", date:"2025-12-14", miles:54488, gallons:12.638, pricePerGallon:2.599, cost:32.85 },
      { id:"vwf25", date:"2025-12-26", miles:54842, gallons:13.183, pricePerGallon:2.499, cost:32.94 },
      { id:"vwf26", date:"2026-01-11", miles:55186, gallons:12.473, pricePerGallon:2.369, cost:29.55 },
      { id:"vwf27", date:"2026-01-23", miles:55514, gallons:12.128, pricePerGallon:2.359, cost:28.61 },
      { id:"vwf28", date:"2026-01-31", miles:55870, gallons:13.38, pricePerGallon:2.359, cost:31.56 },
      { id:"vwf29", date:"2026-02-07", miles:56226, gallons:13.092, pricePerGallon:2.519, cost:32.98 },
      { id:"vwf30", date:"2026-02-10", miles:56352, gallons:4.338, pricePerGallon:2.359, cost:10.23 },
      { id:"vwf31", date:"2026-03-08", miles:56786, gallons:13.723, pricePerGallon:2.99, cost:41.03 },
      { id:"vwf32", date:"2026-04-05", miles:57085, gallons:13.567, pricePerGallon:3.59, cost:48.71 }

    ],
    [C5_ID]: [

      { id:"c5f01", date:"2021-04-14", miles:20093, gallons:null, pricePerGallon:null, cost:null },
      { id:"c5f02", date:"2021-06-23", miles:20417, gallons:null, pricePerGallon:null, cost:null },
      { id:"c5f03", date:"2021-08-07", miles:20748, gallons:null, pricePerGallon:null, cost:null },
      { id:"c5f04", date:"2021-10-26", miles:21050, gallons:null, pricePerGallon:null, cost:null },
      { id:"c5f05", date:"2022-03-12", miles:21338, gallons:null, pricePerGallon:null, cost:null },
      { id:"c5f06", date:"2022-09-23", miles:21618, gallons:null, pricePerGallon:null, cost:null },
      { id:"c5f07", date:"2022-10-06", miles:21938, gallons:null, pricePerGallon:null, cost:null },
      { id:"c5f08", date:"2023-05-20", miles:22237, gallons:null, pricePerGallon:null, cost:null },
      { id:"c5f09", date:"2023-08-13", miles:22556, gallons:null, pricePerGallon:null, cost:null },
      { id:"c5f10", date:"2023-11-15", miles:22863, gallons:15.168, pricePerGallon:3.219, cost:48.83 },
      { id:"c5f11", date:"2024-05-30", miles:23173, gallons:15.806, pricePerGallon:3.399, cost:53.72 },
      { id:"c5f12", date:"2024-10-10", miles:23490, gallons:16.005, pricePerGallon:3.399, cost:54.4 },
      { id:"c5f13", date:"2026-03-15", miles:23769, gallons:14.753, pricePerGallon:3.399, cost:50.15 }

    ],
    [RAM_ID]: [

      { id:"ramf01", date:"2018-12-29", miles:26015, gallons:null, pricePerGallon:null, cost:null },
      { id:"ramf02", date:"2019-03-06", miles:26328, gallons:null, pricePerGallon:null, cost:null },
      { id:"ramf03", date:"2019-05-06", miles:26722, gallons:null, pricePerGallon:null, cost:null },
      { id:"ramf04", date:"2019-06-02", miles:27133, gallons:null, pricePerGallon:null, cost:null },
      { id:"ramf05", date:"2019-06-08", miles:27522, gallons:null, pricePerGallon:null, cost:null },
      { id:"ramf06", date:"2019-07-06", miles:27852, gallons:null, pricePerGallon:null, cost:null },
      { id:"ramf07", date:"2019-08-04", miles:28648, gallons:null, pricePerGallon:null, cost:null },
      { id:"ramf08", date:"2019-08-24", miles:29013, gallons:null, pricePerGallon:null, cost:null },
      { id:"ramf09", date:"2019-09-08", miles:29422, gallons:null, pricePerGallon:null, cost:null },
      { id:"ramf10", date:"2019-09-13", miles:29693, gallons:null, pricePerGallon:null, cost:null },
      { id:"ramf11", date:"2019-11-05", miles:30078, gallons:null, pricePerGallon:null, cost:null },
      { id:"ramf12", date:"2020-03-20", miles:30467, gallons:null, pricePerGallon:null, cost:null },
      { id:"ramf13", date:"2020-05-27", miles:30852, gallons:null, pricePerGallon:null, cost:null },
      { id:"ramf14", date:"2020-06-17", miles:31198, gallons:null, pricePerGallon:null, cost:null },
      { id:"ramf15", date:"2020-09-24", miles:31691, gallons:null, pricePerGallon:null, cost:null },
      { id:"ramf16", date:"2020-12-02", miles:32086, gallons:null, pricePerGallon:null, cost:null },
      { id:"ramf17", date:"2021-05-08", miles:32455, gallons:null, pricePerGallon:null, cost:null },
      { id:"ramf18", date:"2021-06-04", miles:32752, gallons:null, pricePerGallon:null, cost:null },
      { id:"ramf19", date:"2021-06-05", miles:33164, gallons:null, pricePerGallon:null, cost:null },
      { id:"ramf20", date:"2021-07-17", miles:33586, gallons:null, pricePerGallon:null, cost:null },
      { id:"ramf21", date:"2021-07-31", miles:34008, gallons:null, pricePerGallon:null, cost:null },
      { id:"ramf22", date:"2021-08-01", miles:34437, gallons:null, pricePerGallon:null, cost:null },
      { id:"ramf23", date:"2021-11-13", miles:34815, gallons:null, pricePerGallon:null, cost:null },
      { id:"ramf24", date:"2022-06-09", miles:35185, gallons:null, pricePerGallon:null, cost:null },
      { id:"ramf25", date:"2022-07-16", miles:35582, gallons:null, pricePerGallon:null, cost:null },
      { id:"ramf26", date:"2022-08-07", miles:36005, gallons:null, pricePerGallon:null, cost:null },
      { id:"ramf27", date:"2022-10-11", miles:36410, gallons:null, pricePerGallon:null, cost:null },
      { id:"ramf28", date:"2022-12-15", miles:36805, gallons:null, pricePerGallon:null, cost:null },
      { id:"ramf29", date:"2023-06-16", miles:37107, gallons:null, pricePerGallon:null, cost:null },
      { id:"ramf30", date:"2023-07-21", miles:37516, gallons:null, pricePerGallon:null, cost:null },
      { id:"ramf31", date:"2024-02-23", miles:37898, gallons:23.069, pricePerGallon:3.139, cost:72.41 },
      { id:"ramf32", date:"2024-03-28", miles:38320, gallons:24.168, pricePerGallon:3.359, cost:81.18 },
      { id:"ramf33", date:"2025-03-28", miles:38658, gallons:23.559, pricePerGallon:2.969, cost:69.95 },
      { id:"ramf34", date:"2025-09-26", miles:38986, gallons:17.742, pricePerGallon:2.699, cost:47.89 }

    ],
    [BMW_ID]:   [],
    [CRUZE_ID]: [],
  },
};

const DEFAULT_PHOTOS = {
  "vw-alltrack-2017": "",
  "cruze-2013": "",
  "corvette-c5-2001": "",
  "ram-1500-2015": "",
  "home-main": "",
  "bmw-x2-2018": "",
  "bike-zwift": "",
  "bike-diverge": "",
  "bike-canyon": "",
  "bike-bianchi": "",
  "bike-cervelo": "",
};

// ── Supabase client ──────────────────────────────────────────────────────────
const SUPABASE_URL  = "https://riorzxpoxxtmrukvrqsy.supabase.co";
const SUPABASE_ANON = "sb_publishable_2KCCIMn5a5PSGJi6r8L08g_J111WMd2";

async function sbFetch(method, path, body, token) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON,
      "Authorization": `Bearer ${token || SUPABASE_ANON}`,
      "Prefer": method === "POST" ? "return=representation" : method === "PATCH" ? "return=representation" : "",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; }
  catch { return { ok: res.ok, status: res.status, data: text }; }
}

async function sbQ(path, token) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { "apikey": SUPABASE_ANON, "Authorization": `Bearer ${token}` },
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return []; }
}

async function sbSignIn(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

async function sbSignUp(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

async function sbSignOut(token) {
  await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
    method: "POST",
    headers: { "apikey": SUPABASE_ANON, "Authorization": `Bearer ${token}` },
  });
}

async function uploadPhoto(path, dataUrl, token) {
  const [header, b64] = dataUrl.split(",");
  const mime  = header.match(/:(.*?);/)[1];
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  // Try POST (new file), fall back to PUT (replace existing)
  const tryUpload = (method) => fetch(`${SUPABASE_URL}/storage/v1/object/photos/${path}`, {
    method,
    headers: {
      "Authorization": `Bearer ${token}`,
      "apikey": SUPABASE_ANON,
      "Content-Type": mime,
      "x-upsert": "true",
    },
    body: bytes,
  });
  let res = await tryUpload("POST");
  if (!res.ok) res = await tryUpload("PUT");
  if (!res.ok) {
    const err = await res.text();
    console.error("Photo upload failed:", res.status, err);
    return null;
  }
  return `${SUPABASE_URL}/storage/v1/object/public/photos/${path}`;
}

// Restore session from localStorage if available
function loadSession() {
  try {
    const s = localStorage.getItem("maintr-session");
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}
function saveSession(session) {
  try {
    if (session) localStorage.setItem("maintr-session", JSON.stringify(session));
    else localStorage.removeItem("maintr-session");
  } catch {}
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function svcIcon(label) {
  const l = label.toLowerCase();
  if (l.includes("oil")) return "🛢";
  if (l.includes("tire") || l.includes("rotation")) return "🔄";
  if (l.includes("cabin") || (l.includes("air") && l.includes("filter"))) return "🌬";
  if (l.includes("spark")) return "⚡";
  if (l.includes("brake fluid")) return "🔴";
  if (l.includes("brake pad") || l.includes("rotor")) return "🛑";
  if (l.includes("coolant") || l.includes("cooling")) return "❄️";
  if (l.includes("transmission") || l.includes("dsg")) return "⚙️";
  if (l.includes("differential")) return "🔩";
  if (l.includes("transfer")) return "🔀";
  if (l.includes("timing")) return "⏱";
  if (l.includes("battery")) return "🔋";
  if (l.includes("fuel filter")) return "⛽";
  if (l.includes("alignment")) return "📐";
  if (l.includes("wiper")) return "🌧";
  if (l.includes("suspension")) return "🏗";
  return "🔧";
}

function statusColor(pct) {
  if (pct >= 100) return "#ef4444";
  if (pct >= 80) return "#f59e0b";
  return "#22c55e";
}
function calcPct(lastMiles, interval, cur) {
  if (lastMiles === null) { const s = Math.floor(cur/interval)*interval; return Math.min(100,Math.round(((cur-s)/interval)*100)); }
  return Math.min(100, Math.round(((cur-lastMiles)/interval)*100));
}
function calcLeft(lastMiles, interval, cur) {
  if (lastMiles === null) { const n = Math.ceil(cur/interval)*interval; return Math.max(0,n-cur); }
  return Math.max(0, lastMiles+interval-cur);
}
function vAlerts(vehicle, logs) {
  const red=[], yellow=[];
  vehicle.schedule.forEach(svc => {
    const last = (logs||[]).filter(l=>l.serviceLabel===svc.label).sort((a,b)=>b.miles-a.miles)[0];
    const pct = calcPct(last?.miles??null, svc.miles, vehicle.odometer);
    if (pct>=100) red.push(svc.label); else if (pct>=80) yellow.push(svc.label);
  });
  return {red,yellow};
}
const fmt$ = n => n==null ? "—" : `$${n.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const fmtMpg = n => n==null ? "—" : `${n.toFixed(1)} mpg`;

// ── Cost analytics helpers ────────────────────────────────────────────────────
function costByYear(logs, fuelLogs) {
  const map = {};
  (logs||[]).forEach(e => {
    if (!e.cost) return;
    const yr = e.date?.slice(0,4) || "Unknown";
    if (!map[yr]) map[yr] = { consumable:0, preventative:0, repair:0, fuel:0, total:0 };
    const cat = e.category || autoCategory(e.serviceLabel);
    if (map[yr][cat] !== undefined) map[yr][cat] += e.cost;
    map[yr].total += e.cost;
  });
  (fuelLogs||[]).forEach(f => {
    if (!f.cost) return;
    const yr = f.date?.slice(0,4) || "Unknown";
    if (!map[yr]) map[yr] = { consumable:0, preventative:0, repair:0, fuel:0, total:0 };
    map[yr].fuel  += f.cost;
    map[yr].total += f.cost;
  });
  return map;
}

function costTotals(logs, fuelLogs) {
  const out = { consumable:0, preventative:0, repair:0, fuel:0, total:0 };
  (logs||[]).forEach(e => {
    if (!e.cost) return;
    const cat = e.category || autoCategory(e.serviceLabel);
    if (out[cat] !== undefined) out[cat] += e.cost;
    out.total += e.cost;
  });
  (fuelLogs||[]).forEach(f => {
    if (!f.cost) return;
    out.fuel  += f.cost;
    out.total += f.cost;
  });
  return out;
}

function fuelStats(fuelLogs) {
  const sorted = [...(fuelLogs||[])].sort((a,b) => a.miles - b.miles);
  const fills = [];
  for (let i=1; i<sorted.length; i++) {
    const prev = sorted[i-1], cur = sorted[i];
    const driven = cur.miles - prev.miles;
    if (cur.gallons > 0 && driven > 0) {
      fills.push({ date: cur.date, miles: cur.miles, mpg: driven/cur.gallons, cost: cur.cost, gallons: cur.gallons, pricePg: cur.pricePerGallon });
    }
  }
  const avgMpg = fills.length ? fills.reduce((s,f)=>s+f.mpg,0)/fills.length : null;
  const totalFuelCost = sorted.reduce((s,f)=>s+(f.cost||0),0);
  const totalGallons  = sorted.reduce((s,f)=>s+(f.gallons||0),0);
  const avgPpg = totalGallons > 0 ? totalFuelCost / totalGallons : null;

  // Annual breakdown: MPG, PPG, cost, gallons per year
  const byYear = {};
  fills.forEach(f => {
    const yr = f.date?.slice(0,4)||"?";
    if (!byYear[yr]) byYear[yr] = { fills:[], cost:0, gallons:0 };
    byYear[yr].fills.push(f.mpg);
    byYear[yr].cost    += f.cost    || 0;
    byYear[yr].gallons += f.gallons || 0;
  });
  sorted.forEach(f => {
    if (!f.pricePerGallon) return;
    const yr = f.date?.slice(0,4)||"?";
    if (!byYear[yr]) byYear[yr] = { fills:[], cost:0, gallons:0 };
  });
  const annualStats = Object.entries(byYear).sort((a,b)=>b[0].localeCompare(a[0])).map(([yr,d])=>({
    year:     yr,
    avgMpg:   d.fills.length ? d.fills.reduce((s,v)=>s+v,0)/d.fills.length : null,
    avgPpg:   d.gallons > 0 ? d.cost / d.gallons : null,
    cost:     d.cost,
    gallons:  d.gallons,
  }));

  return { fills, avgMpg, avgPpg, totalFuelCost, totalGallons, annualStats };
}

// ── CSS ───────────────────────────────────────────────────────────────────────

// ── Home maintenance helpers ──────────────────────────────────────────────────
const HOME_ASSET_CATS = {
  hvac:       { label:"HVAC",        icon:"🌡️",  color:"#60a5fa" },
  plumbing:   { label:"Plumbing",    icon:"🚿",  color:"#34d399" },
  appliance:  { label:"Appliance",   icon:"⚡",  color:"#a78bfa" },
  mechanical: { label:"Mechanical",  icon:"⚙️",  color:"#f97316" },
  equipment:  { label:"Equipment",   icon:"🔧",  color:"#fbbf24" },
  general:    { label:"General",     icon:"🏠",  color:"#9ca3af" },
};

const HOME_CATS = {
  safety:   { label:"Safety",    color:"#ef4444", bg:"#3a1010", icon:"🔥" },
  hvac:     { label:"HVAC",      color:"#60a5fa", bg:"#0f1f3a", icon:"❄️" },
  appliance:{ label:"Appliance", color:"#a78bfa", bg:"#1a1030", icon:"⚡" },
  seasonal: { label:"Seasonal",  color:"#f59e0b", bg:"#3f2e0a", icon:"🌨" },
  plumbing: { label:"Plumbing",  color:"#34d399", bg:"#0a2a1e", icon:"💧" },
  exterior: { label:"Exterior",  color:"#fb923c", bg:"#3a1f0a", icon:"🏠" },
  general:  { label:"General",   color:"#9ca3af", bg:"#1e1e22", icon:"🔧" },
};

// Compute next due date respecting optional calendar anchor (month/day)
function homeNextDue(item) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (item.anchorMonth != null) {
    // Find next upcoming occurrence of anchor month/day
    const thisYear = new Date(today.getFullYear(), item.anchorMonth - 1, item.anchorDay || 1);
    const nextYear = new Date(today.getFullYear() + 1, item.anchorMonth - 1, item.anchorDay || 1);
    // If already completed this cycle (lastDone within past year near anchor), point to next year
    if (item.lastDone) {
      const last = new Date(item.lastDone + "T00:00:00");
      const daysSince = Math.floor((today - last) / 86400000);
      if (daysSince < item.intervalDays * 0.75) {
        // Done recently — next due is next anchor occurrence
        return thisYear > today ? thisYear : nextYear;
      }
    }
    return thisYear >= today ? thisYear : nextYear;
  }

  // No anchor — just interval-based from last done
  if (!item.lastDone) return today; // never done = overdue now
  const last = new Date(item.lastDone + "T00:00:00");
  const due = new Date(last);
  due.setDate(due.getDate() + item.intervalDays);
  return due;
}

function homeDaysSince(lastDone) {
  if (!lastDone) return null;
  return Math.floor((Date.now() - new Date(lastDone + "T00:00:00").getTime()) / 86400000);
}

function homePct(item) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = homeNextDue(item);
  const daysLeft = Math.floor((due - today) / 86400000);
  if (daysLeft <= 0) return 100;
  // pct used = how far through the interval we are
  const totalWindow = item.intervalDays;
  const used = totalWindow - daysLeft;
  return Math.min(100, Math.max(0, Math.round((used / totalWindow) * 100)));
}

function homeDaysLeft(item) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = homeNextDue(item);
  return Math.max(0, Math.floor((due - today) / 86400000));
}

function homeDueDateStr(item) {
  const due = homeNextDue(item);
  return due.toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
}

function homeAlerts(items) {
  const red=[], yellow=[];
  items.forEach(item => {
    const pct = homePct(item);
    if (pct >= 100) red.push(item.label);
    else if (pct >= 80) yellow.push(item.label);
  });
  return { red, yellow };
}

function intervalLabel(item) {
  const days = item.intervalDays;
  if (item.anchorMonth != null) {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const m = months[item.anchorMonth - 1];
    if (item.anchorMonth === 11) return `Annually — DST Fall (${m})`;
    if (item.anchorMonth === 4)  return `Annually — April (post-season)`;
    if (item.anchorMonth === 7)  return `Annually — Summer (${m})`;
    return `Annually — ${m}`;
  }
  if (days === 365) return "Annually";
  if (days === 180) return "Every 6 months";
  if (days === 120) return "Every 120 days";
  if (days === 90)  return "Every 90 days";
  if (days === 30)  return "Monthly";
  return `Every ${days} days`;
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'DM Sans',sans-serif;background:#0c0c0e;color:#e8e6e1;min-height:100vh}
.app{max-width:960px;margin:0 auto;padding:24px 16px 80px}
.hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:32px;padding-bottom:18px;border-bottom:1px solid #1e1e22}
.logo{font-family:'Bebas Neue',sans-serif;font-size:2rem;letter-spacing:.1em}.logo span{color:#f97316}
.btn{font-family:'DM Sans',sans-serif;font-size:.83rem;font-weight:600;padding:9px 18px;border-radius:7px;border:none;cursor:pointer;transition:all .15s;letter-spacing:.03em}
.btn-p{background:#f97316;color:#fff}.btn-p:hover{background:#ea6c0f}
.btn-g{background:transparent;color:#9ca3af;border:1px solid #2a2a2e}.btn-g:hover{border-color:#555;color:#e8e6e1}
.btn-d{background:transparent;color:#ef4444;border:1px solid #3f1a1a;font-size:.75rem;padding:5px 11px}.btn-d:hover{background:#3f1a1a}
.btn-sm{padding:5px 11px;font-size:.76rem}
.grid{display:flex;flex-direction:column;gap:10px}
.vcard{background:#141416;border:1px solid #222226;border-radius:12px;overflow:hidden;cursor:pointer;transition:all .15s}
.vcard:hover,.vcard.sel{border-color:#f97316;transform:translateY(-2px)}
.vcard-photo{width:140px;height:90px;flex-shrink:0;background:#1a1a1e;display:flex;align-items:center;justify-content:center;color:#444;font-size:2rem;overflow:hidden;border-radius:8px;border:1px solid #222226}
.vcard-photo img{width:140px;height:90px;object-fit:contain;background:#1a1a1e;padding:4px;border-radius:8px}
.vcard-body{padding:14px;display:flex;gap:14px;align-items:center}
.vcard-text{flex:1;min-width:0}
.vc-make{font-family:'Bebas Neue',sans-serif;font-size:1.2rem;letter-spacing:.06em;color:#f97316;margin-bottom:1px}
.vc-name{font-size:.86rem;font-weight:500;margin-bottom:8px}
.vc-odo{font-size:.75rem;color:#6b7280}.vc-odo strong{color:#d1d5db;font-size:.9rem}
.badges{display:flex;gap:6px;margin-top:9px;flex-wrap:wrap}
.badge{font-size:.66rem;font-weight:600;padding:3px 8px;border-radius:99px;letter-spacing:.04em}
.br{background:#3f1a1a;color:#ef4444}.by{background:#3f2e0a;color:#f59e0b}.bg{background:#0d2311;color:#22c55e}
.det-hdr{display:flex;align-items:flex-start;gap:20px;margin-bottom:24px;flex-wrap:wrap}
.det-photo-wrap{flex-shrink:0;position:relative}
.det-photo{width:160px;height:110px;border-radius:10px;object-fit:cover;background:#141416;border:1px solid #222226;display:flex;align-items:center;justify-content:center;color:#333;font-size:2rem;overflow:hidden}
.det-photo img{width:100%;height:100%;object-fit:cover}
.photo-upload-btn{position:absolute;bottom:6px;right:6px;background:rgba(0,0,0,.7);border:1px solid #444;color:#e8e6e1;font-size:.68rem;padding:3px 8px;border-radius:5px;cursor:pointer}
.det-info{flex:1;min-width:200px}
.det-title{font-family:'Bebas Neue',sans-serif;font-size:1.9rem;letter-spacing:.06em}.det-title span{color:#f97316}
.det-sub{font-size:.82rem;color:#6b7280;margin-top:1px}
.odo-row{display:flex;align-items:center;gap:8px;margin-top:10px}
.odo-inp{background:#1c1c1f;border:1px solid #2a2a2e;color:#e8e6e1;font-family:'DM Sans',sans-serif;font-size:.9rem;padding:7px 11px;border-radius:7px;width:130px}
.odo-inp:focus{outline:none;border-color:#f97316}
.sec{font-size:.67rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#6b7280;margin-bottom:9px;margin-top:22px}
.svc-list{display:flex;flex-direction:column;gap:6px}
.svc-row{background:#141416;border:1px solid #222226;border-radius:10px;padding:12px 14px;display:flex;align-items:center;gap:12px}
.svc-row:hover{border-color:#2e2e35}
.svc-icon{font-size:1.1rem;width:24px;text-align:center;flex-shrink:0}
.svc-info{flex:1;min-width:0}
.svc-lbl{font-weight:500;font-size:.84rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.svc-det{font-size:.7rem;color:#6b7280;margin-top:2px}
.bar-wrap{width:90px;flex-shrink:0}
.bar-bg{background:#222226;border-radius:99px;height:4px;overflow:hidden}
.bar-fill{height:100%;border-radius:99px;transition:width .5s}
.bar-pct{font-size:.66rem;margin-top:3px;text-align:right}
.log-item{border-left:2px solid #f97316;padding:7px 0 7px 13px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
.log-lbl{font-size:.83rem;font-weight:500}
.log-meta{font-size:.7rem;color:#6b7280;margin-top:2px}
.log-cost{font-size:.78rem;font-weight:600;color:#e8e6e1;flex-shrink:0}
.cat-dot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:5px;flex-shrink:0}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.82);display:flex;align-items:center;justify-content:center;z-index:200;padding:16px;overflow-y:auto}
.modal{background:#141416;border:1px solid #2a2a2e;border-radius:14px;padding:26px;width:100%;max-width:440px}
.modal-title{font-family:'Bebas Neue',sans-serif;font-size:1.35rem;letter-spacing:.06em;margin-bottom:18px}
.field{margin-bottom:12px}.field label{display:block;font-size:.7rem;color:#9ca3af;margin-bottom:4px;font-weight:600;letter-spacing:.06em;text-transform:uppercase}
.field input,.field select,.field textarea{width:100%;background:#1c1c1f;border:1px solid #2a2a2e;color:#e8e6e1;font-family:'DM Sans',sans-serif;font-size:.86rem;padding:8px 10px;border-radius:7px}
.field input:focus,.field select:focus,.field textarea:focus{outline:none;border-color:#f97316}
.field select option{background:#1c1c1f}
.field-row{display:flex;gap:10px}.field-row .field{flex:1}
.modal-btns{display:flex;gap:10px;margin-top:18px;justify-content:flex-end}
.add-wrap{background:#141416;border:1px solid #222226;border-radius:14px;padding:28px;max-width:480px}
.add-title{font-family:'Bebas Neue',sans-serif;font-size:1.6rem;letter-spacing:.06em;margin-bottom:20px}
.cust-row{background:#1c1c1f;border:1px solid #2a2a2e;border-radius:10px;padding:13px;display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;margin-top:8px}
.cust-row .field{margin:0;flex:1;min-width:110px}
.tabs{display:flex;gap:3px;margin-bottom:18px;background:#141416;border:1px solid #222226;border-radius:9px;padding:4px;flex-wrap:wrap}
.tab{font-size:.76rem;font-weight:600;padding:6px 13px;border-radius:6px;cursor:pointer;color:#6b7280;transition:all .15s;border:none;background:transparent;white-space:nowrap}
.tab.on{background:#f97316;color:#fff}
.empty{text-align:center;padding:60px 20px;color:#4b5563}
.empty-icon{font-size:3rem;margin-bottom:12px}
.empty p{font-size:.9rem;margin-bottom:20px}
/* Cost / analytics */
.stat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-bottom:20px}
.stat-card{background:#141416;border:1px solid #222226;border-radius:10px;padding:14px}
.stat-val{font-family:'Bebas Neue',sans-serif;font-size:1.5rem;letter-spacing:.04em}
.stat-lbl{font-size:.68rem;color:#6b7280;margin-top:2px;letter-spacing:.06em;text-transform:uppercase}
.yr-table{width:100%;border-collapse:collapse}
.yr-table th{font-size:.68rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;padding:6px 10px;text-align:left;border-bottom:1px solid #222226}
.yr-table td{font-size:.82rem;padding:8px 10px;border-bottom:1px solid #1a1a1e}
.yr-table tr:last-child td{border-bottom:none}
/* Fuel */
.fuel-fill-row{background:#141416;border:1px solid #222226;border-radius:9px;padding:11px 14px;display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;margin-bottom:6px;align-items:center}
.fill-val{font-size:.86rem;font-weight:600}
.fill-lbl{font-size:.66rem;color:#6b7280;margin-top:1px;text-transform:uppercase;letter-spacing:.05em}
.mpg-bar-bg{background:#222226;border-radius:99px;height:4px;margin-top:4px}
.mpg-bar-fill{height:4px;border-radius:99px;background:#f97316}

/* ── Bikes ── */
.dash-section-bikes{margin-top:28px}
.bike-card{background:#141416;border:1px solid #222226;border-radius:12px;overflow:hidden;cursor:pointer;transition:all .15s}
.bike-card:hover,.bike-card.sel{border-color:#f97316;transform:translateY(-2px)}
.bike-card-body{padding:14px;display:flex;gap:14px;align-items:center}
.bike-photo{width:140px;height:90px;flex-shrink:0;background:#1a1a1e;display:flex;align-items:center;justify-content:center;font-size:2rem;overflow:hidden;border-radius:8px;border:1px solid #222226}
.bike-photo img{width:140px;height:90px;object-fit:contain;background:#1a1a1e;padding:4px;border-radius:8px}
.bike-text{flex:1;min-width:0}
.bike-make{font-family:'Bebas Neue',sans-serif;font-size:1.2rem;letter-spacing:.06em;color:#f97316;margin-bottom:1px}
.bike-model{font-size:.82rem;font-weight:500;margin-bottom:6px}
.bike-miles{font-size:.75rem;color:#6b7280}
.bike-miles strong{color:#d1d5db;font-size:.9rem}
.bsvc-row{background:#141416;border:1px solid #222226;border-radius:10px;padding:12px 14px;display:flex;align-items:center;gap:12px;margin-bottom:6px}
.bsvc-row:hover{border-color:#2e2e35}

.comp-row{background:#141416;border:1px solid #222226;border-radius:10px;padding:12px 14px;display:flex;align-items:center;gap:12px;margin-bottom:6px}
.comp-row:hover{border-color:#2e2e35}
.comp-cat-badge{font-size:.66rem;font-weight:600;padding:2px 8px;border-radius:99px;letter-spacing:.04em;flex-shrink:0}
.ride-row{border-left:2px solid #2a2a2e;padding:7px 0 7px 13px;margin-bottom:6px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:border-color .15s}
.ride-row:hover{border-left-color:#f97316}
.ride-row.assigned{border-left-color:#22c55e}
.ride-name{font-size:.82rem;font-weight:500;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ride-meta{font-size:.7rem;color:#6b7280;margin-top:1px}
.ride-dist{font-size:.82rem;font-weight:600;color:#e8e6e1;flex-shrink:0}
.stat-row{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:18px}
.stat-pill{background:#141416;border:1px solid #222226;border-radius:10px;padding:12px 16px;flex:1;min-width:120px}
.stat-pill-val{font-family:'Bebas Neue',sans-serif;font-size:1.5rem;letter-spacing:.04em}
.stat-pill-lbl{font-size:.67rem;color:#6b7280;margin-top:2px;text-transform:uppercase;letter-spacing:.07em}
@media(max-width:600px){.bar-wrap{display:none}.det-hdr{flex-direction:column}.fuel-fill-row{grid-template-columns:1fr 1fr}}
/* ── Home maintenance ── */
.dash-section-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;margin-top:28px}
.dash-section-title{font-family:'Bebas Neue',sans-serif;font-size:1.1rem;letter-spacing:.1em;color:#9ca3af}
.home-card{background:#141416;border:1px solid #222226;border-radius:12px;cursor:pointer;transition:all .15s}
.home-card:hover,.home-card.sel{border-color:#f97316;transform:translateY(-2px)}
.home-card-banner{width:140px;height:90px;flex-shrink:0;background:#1a1a1e;display:flex;align-items:center;justify-content:center;font-size:2.8rem;border-radius:8px;border:1px solid #222226}
.home-card-body-inner{flex:1;min-width:0}
.home-card-icon{font-size:1.8rem;margin-bottom:10px}
.home-card-name{font-family:'Bebas Neue',sans-serif;font-size:1.2rem;letter-spacing:.06em;color:#e8e6e1}
.home-card-sub{font-size:.75rem;color:#6b7280;margin-top:2px;margin-bottom:10px}
.hi-row{background:#141416;border:1px solid #222226;border-radius:10px;padding:12px 14px;display:flex;align-items:center;gap:12px;margin-bottom:6px}
.hi-row:hover{border-color:#2e2e35}
.hi-icon{font-size:1.2rem;width:26px;text-align:center;flex-shrink:0}
.hi-info{flex:1;min-width:0}
.hi-lbl{font-weight:500;font-size:.86rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hi-det{font-size:.7rem;color:#6b7280;margin-top:2px}
.hi-cat{font-size:.62rem;font-weight:600;padding:2px 7px;border-radius:99px;letter-spacing:.05em;margin-left:6px;vertical-align:middle}
.add-home-form{background:#1c1c1f;border:1px solid #2a2a2e;border-radius:10px;padding:16px;margin-top:10px}
.add-home-title{font-size:.78rem;font-weight:600;color:#9ca3af;letter-spacing:.08em;text-transform:uppercase;margin-bottom:12px}

`;

// ── Sub-components ────────────────────────────────────────────────────────────
function VinEditor({ vehicle, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(vehicle.vin || "");
  useEffect(() => { setVal(vehicle.vin || ""); }, [vehicle.vin]);
  if (editing) return (
    <div style={{display:"flex",gap:6,alignItems:"center",marginTop:6}}>
      <input value={val} onChange={e=>setVal(e.target.value.toUpperCase())} placeholder="17-character VIN"
        style={{background:"#1c1c1f",border:"1px solid #f97316",color:"#e8e6e1",fontFamily:"monospace",fontSize:".78rem",letterSpacing:".06em",padding:"5px 9px",borderRadius:6,width:185}} />
      <button className="btn btn-p btn-sm" onClick={()=>{onSave(val);setEditing(false);}}>Save</button>
      <button className="btn btn-g btn-sm" onClick={()=>setEditing(false)}>✕</button>
    </div>
  );
  return (
    <div style={{display:"flex",alignItems:"center",gap:7,marginTop:5}}>
      {vehicle.vin
        ? <span style={{fontFamily:"monospace",fontSize:".75rem",color:"#9ca3af",letterSpacing:".06em"}}>{vehicle.vin}</span>
        : <span style={{fontSize:".73rem",color:"#4b5563",fontStyle:"italic"}}>No VIN recorded</span>}
      <button className="btn btn-g btn-sm" style={{fontSize:".66rem",padding:"2px 7px"}} onClick={()=>setEditing(true)}>
        {vehicle.vin?"Edit":"+ VIN"}
      </button>
    </div>
  );
}

function PhotoUploader({ vehicle, onSave }) {
  const fileRef = useRef();
  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onSave(ev.target.result);
    reader.readAsDataURL(file);
  }
  return (
    <>
      <input type="file" accept="image/*" ref={fileRef} style={{display:"none"}} onChange={handleFile} />
      <button className="photo-upload-btn" onClick={()=>fileRef.current.click()}>
        Change Photo
      </button>
    </>
  );
}

function CostBadge({ category }) {
  const c = CAT_LABELS[category] || CAT_LABELS.repair;
  return <span className="cat-dot" style={{background:c.color}} title={c.label} />;
}

// ── Analytics tab ─────────────────────────────────────────────────────────────
function CostsTab({ logs, fuelLogs }) {
  const totals = costTotals(logs, fuelLogs);
  const byYear = costByYear(logs, fuelLogs);
  const years = Object.keys(byYear).sort((a,b)=>b-a);
  const maxTotal = Math.max(...years.map(y=>byYear[y].total), 1);

  return (
    <>
      <div className="sec">All-Time Totals</div>
      <div className="stat-grid">
        {[
          { key:"total",        label:"Total Spent",   color:"#e8e6e1" },
          { key:"consumable",   label:"Consumables",   color:CAT_LABELS.consumable.color },
          { key:"preventative", label:"Preventive",    color:CAT_LABELS.preventative.color },
          { key:"repair",       label:"Repairs",       color:CAT_LABELS.repair.color },
          { key:"fuel",         label:"Fuel",          color:CAT_LABELS.fuel.color },
        ].map(s => (
          <div key={s.key} className="stat-card">
            <div className="stat-val" style={{color:s.color}}>{fmt$(totals[s.key])}</div>
            <div className="stat-lbl">{s.label}</div>
          </div>
        ))}
      </div>

      {years.length > 0 && (
        <>
          <div className="sec">Annual Breakdown</div>
          <table className="yr-table">
            <thead>
              <tr>
                <th>Year</th>
                <th style={{color:CAT_LABELS.consumable.color}}>Consumable</th>
                <th style={{color:CAT_LABELS.preventative.color}}>Preventive</th>
                <th style={{color:CAT_LABELS.repair.color}}>Repair</th>
                <th style={{color:CAT_LABELS.fuel.color}}>Fuel</th>
                <th>Total</th>
                <th style={{width:100}}>Spend</th>
              </tr>
            </thead>
            <tbody>
              {years.map(yr => {
                const row = byYear[yr];
                const barW = Math.round((row.total/maxTotal)*100);
                return (
                  <tr key={yr}>
                    <td style={{fontWeight:600}}>{yr}</td>
                    <td style={{color:CAT_LABELS.consumable.color}}>{fmt$(row.consumable||0)}</td>
                    <td style={{color:CAT_LABELS.preventative.color}}>{fmt$(row.preventative||0)}</td>
                    <td style={{color:CAT_LABELS.repair.color}}>{fmt$(row.repair||0)}</td>
                    <td style={{color:CAT_LABELS.fuel.color}}>{fmt$(row.fuel||0)}</td>
                    <td style={{fontWeight:600}}>{fmt$(row.total)}</td>
                    <td>
                      <div style={{background:"#222226",borderRadius:99,height:5,overflow:"hidden"}}>
                        <div style={{width:`${barW}%`,height:"100%",background:"#f97316",borderRadius:99}} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{fontSize:".7rem",color:"#4b5563",marginTop:10}}>
            * Only entries with costs recorded are included. Add costs when logging service to improve accuracy.
          </div>
        </>
      )}
      {years.length === 0 && <div style={{color:"#4b5563",fontSize:".86rem",padding:"12px 0"}}>No cost data recorded yet. Add costs when logging service entries.</div>}
    </>
  );
}

// ── Fuel tab ──────────────────────────────────────────────────────────────────
function FuelTab({ vehicleId, fuelLogs, onAdd }) {
  const { fills, avgMpg, avgPpg, totalFuelCost, totalGallons, annualStats } = fuelStats(fuelLogs);
  const maxMpg = fills.length ? Math.max(...fills.map(f=>f.mpg)) : 1;
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], miles:"", gallons:"", pricePerGallon:"" });

  function submit() {
    if (!form.miles || !form.gallons) return;
    const cost = form.gallons && form.pricePerGallon ? parseFloat(form.gallons)*parseFloat(form.pricePerGallon) : null;
    onAdd({ id:`f-${Date.now()}`, date:form.date, miles:parseInt(form.miles), gallons:parseFloat(form.gallons), pricePerGallon:form.pricePerGallon?parseFloat(form.pricePerGallon):null, cost });
    setForm({ date:new Date().toISOString().split("T")[0], miles:"", gallons:"", pricePerGallon:"" });
  }

  return (
    <>
      <div className="stat-grid" style={{marginBottom:18}}>
        <div className="stat-card">
          <div className="stat-val" style={{color:"#34d399"}}>{fmtMpg(avgMpg)}</div>
          <div className="stat-lbl">Avg Fuel Economy</div>
        </div>
        <div className="stat-card">
          <div className="stat-val" style={{color:"#60a5fa"}}>{avgPpg?`$${avgPpg.toFixed(3)}`:"—"}</div>
          <div className="stat-lbl">Avg Price / Gal</div>
        </div>
        <div className="stat-card">
          <div className="stat-val">{fills.length}</div>
          <div className="stat-lbl">Fill-Ups Tracked</div>
        </div>
        <div className="stat-card">
          <div className="stat-val" style={{color:"#34d399"}}>{fmt$(totalFuelCost||null)}</div>
          <div className="stat-lbl">Total Fuel Cost</div>
        </div>
        {fills.length > 0 && (
          <div className="stat-card">
            <div className="stat-val" style={{color:"#f97316"}}>{fmtMpg(fills[fills.length-1]?.mpg)}</div>
            <div className="stat-lbl">Last Fill MPG</div>
          </div>
        )}
      </div>

      {annualStats.length > 0 && (
        <>
          <div className="sec">Annual Fuel Summary</div>
          <table className="yr-table" style={{marginBottom:20}}>
            <thead>
              <tr>
                <th>Year</th>
                <th style={{color:"#34d399"}}>Avg MPG</th>
                <th style={{color:"#60a5fa"}}>Avg $/Gal</th>
                <th>Gallons</th>
                <th>Fuel Cost</th>
              </tr>
            </thead>
            <tbody>
              {annualStats.map(row=>(
                <tr key={row.year}>
                  <td style={{fontWeight:600}}>{row.year}</td>
                  <td style={{color:"#34d399"}}>{row.avgMpg?row.avgMpg.toFixed(1)+" mpg":"—"}</td>
                  <td style={{color:"#60a5fa"}}>{row.avgPpg?`$${row.avgPpg.toFixed(3)}`:"—"}</td>
                  <td>{row.gallons>0?row.gallons.toFixed(1):"—"}</td>
                  <td>{row.cost>0?fmt$(row.cost):"—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <div className="sec">Log Fill-Up</div>
      <div className="cust-row" style={{marginBottom:20}}>
        <div className="field"><label>Date</label><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} /></div>
        <div className="field"><label>Odometer</label><input type="number" placeholder="57350" value={form.miles} onChange={e=>setForm({...form,miles:e.target.value})} /></div>
        <div className="field"><label>Gallons</label><input type="number" step="0.001" placeholder="13.5" value={form.gallons} onChange={e=>setForm({...form,gallons:e.target.value})} /></div>
        <div className="field"><label>$/Gal</label><input type="number" step="0.001" placeholder="3.49" value={form.pricePerGallon} onChange={e=>setForm({...form,pricePerGallon:e.target.value})} /></div>
        <button className="btn btn-p btn-sm" style={{alignSelf:"flex-end",height:36}} onClick={submit}>Add</button>
      </div>

      {fills.length === 0 && fuelLogs.length <= 1 && (
        <div style={{color:"#4b5563",fontSize:".86rem",padding:"8px 0"}}>
          Log at least 2 fill-ups to calculate MPG (the first sets your baseline odometer).
        </div>
      )}

      {fills.length > 0 && (
        <>
          <div className="sec">Fill-Up History</div>
          {[...fills].reverse().map((f,i) => (
            <div key={i} className="fuel-fill-row">
              <div>
                <div className="fill-val" style={{color:"#34d399"}}>{f.mpg.toFixed(1)}</div>
                <div className="fill-lbl">mpg</div>
                <div className="mpg-bar-bg"><div className="mpg-bar-fill" style={{width:`${Math.round((f.mpg/maxMpg)*100)}%`}} /></div>
              </div>
              <div>
                <div className="fill-val">{f.gallons.toFixed(3)}</div>
                <div className="fill-lbl">gallons</div>
              </div>
              <div>
                <div className="fill-val">{f.pricePg ? `$${f.pricePg.toFixed(3)}` : "—"}</div>
                <div className="fill-lbl">per gal</div>
              </div>
              <div>
                <div className="fill-val" style={{fontSize:".76rem",color:"#9ca3af"}}>{f.date}</div>
                <div className="fill-lbl">{f.miles.toLocaleString()} mi</div>
                {f.cost && <div style={{fontSize:".72rem",color:"#34d399",marginTop:2}}>{fmt$(f.cost)}</div>}
              </div>
            </div>
          ))}
        </>
      )}

      {fuelLogs.length > 0 && fills.length === 0 && (
        <div style={{color:"#6b7280",fontSize:".82rem",marginTop:8}}>First fill-up recorded as baseline. Add another to see MPG.</div>
      )}
    </>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────


// ── Combine property-level tasks with child home-asset schedules ─────────────
// Property "Tasks" used to only ever look at the property's own homeItems rows,
// completely missing anything logged against a nested Home Asset (Water Heater,
// Water Softener, etc). This merges both into one list so overdue counts and
// the "Done" flow work no matter which page you used to log the work.
function combineHomeTasks(items, childAssets, childSchedules) {
  const direct = (items||[]).map(i => ({ ...i, _source: "item" }));
  const fromAssets = (childAssets||[]).flatMap(asset =>
    (childSchedules||[]).filter(s => s.asset_id === asset.id).map(s => ({
      id: s.id,
      label: s.label,
      category: "general",
      intervalDays: s.interval_days,
      anchorMonth: s.anchor_month,
      anchorDay: s.anchor_day,
      lastDone: s.last_done,
      notes: null,
      _source: "schedule",
      _assetId: asset.id,
      _assetName: asset.name,
    }))
  );
  return [...direct, ...fromAssets];
}

// ── Editable task row (Main Residence Tasks tab) ──────────────────────────────
// Works for both property-direct tasks ("item") and tasks that live on a child
// Home Asset's schedule ("schedule") — edit/delete routes to the right table.
function HomeTaskRow({ task, onLogClick, onSaveItem, onDeleteItem, onSaveSchedule, onDeleteSchedule }) {
  const [editing, setEditing]         = useState(false);
  const [label, setLabel]             = useState(task.label);
  const [intervalDays, setIntervalDays] = useState((task.intervalDays || 90).toString());
  const [category, setCategory]       = useState(task.category || "general");
  const [notes, setNotes]             = useState(task.notes || "");

  const pct    = homePct(task);
  const left   = homeDaysLeft(task);
  const dueStr = homeDueDateStr(task);
  const col    = statusColor(pct);
  const cat    = HOME_CATS[task.category] || HOME_CATS.general;

  if (editing) {
    return (
      <div style={{background:"#1a1a1f",border:"1px solid #f97316",borderRadius:10,padding:"13px 14px",marginBottom:6}}>
        <div className="field-row" style={{marginBottom:8}}>
          <div className="field" style={{margin:0,flex:2}}><label>Task Name</label><input value={label} onChange={e=>setLabel(e.target.value)} autoFocus /></div>
          <div className="field" style={{margin:0,flex:1}}><label>Every (days)</label><input type="number" value={intervalDays} onChange={e=>setIntervalDays(e.target.value)} /></div>
        </div>
        {task._source==="item" && (
          <div className="field-row" style={{marginBottom:8}}>
            <div className="field" style={{margin:0}}>
              <label>Category</label>
              <select value={category} onChange={e=>setCategory(e.target.value)}>
                {Object.entries(HOME_CATS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div className="field" style={{margin:0,flex:2}}><label>Notes</label><input value={notes} onChange={e=>setNotes(e.target.value)} /></div>
          </div>
        )}
        {task._source==="schedule" && (
          <div style={{fontSize:".7rem",color:"#6b7280",marginBottom:8}}>This is a service item on <strong style={{color:"#9ca3af"}}>{task._assetName}</strong>.</div>
        )}
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <button className="btn btn-d btn-sm" onClick={()=>{
            const warn = task._source==="item"
              ? `Delete "${task.label}"? This will also remove its logged history.`
              : `Delete "${task.label}" from ${task._assetName}? Past log entries will be kept but no longer linked to a schedule.`;
            if (confirm(warn)) {
              task._source==="item" ? onDeleteItem(task.id) : onDeleteSchedule(task.id);
            }
          }}>Delete</button>
          <button className="btn btn-g btn-sm" onClick={()=>setEditing(false)}>Cancel</button>
          <button className="btn btn-p btn-sm" onClick={()=>{
            if (task._source==="item") onSaveItem(task.id, { label, intervalDays:parseInt(intervalDays)||90, category, notes });
            else onSaveSchedule(task.id, { label, intervalDays:parseInt(intervalDays)||90 });
            setEditing(false);
          }}>Save</button>
        </div>
      </div>
    );
  }

  return (
    <div className="hi-row">
      <div className="hi-icon">{cat.icon}</div>
      <div className="hi-info">
        <div className="hi-lbl">
          {task.label}{task._source==="schedule" && task._assetName ? ` — ${task._assetName}` : ""}
          <span className="hi-cat" style={{background:cat.bg,color:cat.color}}>{cat.label}</span>
        </div>
        <div className="hi-det">
          {intervalLabel(task)}
          {task.lastDone ? ` · Last: ${new Date(task.lastDone+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}` : " · Never done"}
          {pct < 100 ? ` · Due: ${dueStr}` : ""}
          {task.notes ? ` · ${task.notes}` : ""}
        </div>
      </div>
      <div className="bar-wrap">
        <div className="bar-bg"><div className="bar-fill" style={{width:`${pct}%`,background:col}} /></div>
        <div className="bar-pct" style={{color:col}}>{pct>=100?"OVERDUE":`${left}d left`}</div>
      </div>
      <button className="btn btn-g btn-sm" style={{fontSize:".66rem",padding:"3px 7px"}} onClick={()=>setEditing(true)}>✏️</button>
      <button className="btn btn-g btn-sm" onClick={onLogClick}>Done</button>
    </div>
  );
}

// ── Editable log entry: service_logs row (Home Asset / unified property history) ──
function EditableAssetLogItem({ entry, assetName, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    serviceLabel: entry.service_label,
    date:         entry.date,
    cost:         entry.cost!=null ? entry.cost.toString() : "",
    performedBy:  entry.performed_by || "",
    location:     entry.location || "",
    notes:        entry.notes || "",
  });

  if (!editing) {
    return (
      <div className="log-item">
        <div style={{flex:1}}>
          <div className="log-lbl">🔧 {entry.service_label}{assetName?` — ${assetName}`:""}</div>
          <div className="log-meta">{entry.date}{entry.performed_by?` · ${entry.performed_by}`:""}{entry.location?` · ${entry.location}`:""}{entry.notes?` · ${entry.notes}`:""}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          <div className="log-cost">{entry.cost?`$${parseFloat(entry.cost).toFixed(2)}`:"—"}</div>
          <button className="btn btn-g btn-sm" style={{fontSize:".66rem",padding:"2px 7px"}} onClick={()=>setEditing(true)}>✏️</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{background:"#1a1a1f",border:"1px solid #f97316",borderRadius:10,padding:"13px 14px",marginBottom:8}}>
      <div className="field-row" style={{marginBottom:8}}>
        <div className="field" style={{margin:0}}><label>Service</label><input value={form.serviceLabel} onChange={e=>setForm({...form,serviceLabel:e.target.value})} /></div>
        <div className="field" style={{margin:0}}><label>Date</label><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} /></div>
        <div className="field" style={{margin:0}}><label>Cost ($)</label><input type="number" step="0.01" value={form.cost} onChange={e=>setForm({...form,cost:e.target.value})} /></div>
      </div>
      <div className="field-row" style={{marginBottom:8}}>
        <div className="field" style={{margin:0}}><label>Performed By</label><input value={form.performedBy} onChange={e=>setForm({...form,performedBy:e.target.value})} /></div>
        <div className="field" style={{margin:0}}><label>Location</label><input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} /></div>
      </div>
      <div className="field" style={{margin:"0 0 10px"}}><label>Notes</label><input value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} /></div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <button className="btn btn-d btn-sm" onClick={()=>{if(confirm("Delete this entry?"))onDelete();}}>Delete</button>
        <button className="btn btn-g btn-sm" onClick={()=>setEditing(false)}>Cancel</button>
        <button className="btn btn-p btn-sm" onClick={()=>{
          onSave({
            service_label: form.serviceLabel,
            date:          form.date,
            cost:          form.cost ? parseFloat(form.cost) : null,
            performed_by:  form.performedBy || null,
            location:      form.location || null,
            notes:         form.notes || null,
          });
          setEditing(false);
        }}>Save</button>
      </div>
    </div>
  );
}

// ── Editable log entry: home_logs row (property-direct task history) ────────
function EditableHomeLogItem({ entry, label, icon, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    date:  entry.date,
    cost:  entry.cost!=null ? entry.cost.toString() : "",
    notes: entry.notes || "",
  });

  if (!editing) {
    return (
      <div className="log-item">
        <div style={{flex:1}}>
          <div className="log-lbl">{icon?`${icon} `:""}{label}</div>
          <div className="log-meta">{entry.date}{entry.notes?` · ${entry.notes}`:""}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          <div className="log-cost">{entry.cost?`$${parseFloat(entry.cost).toFixed(2)}`:"—"}</div>
          <button className="btn btn-g btn-sm" style={{fontSize:".66rem",padding:"2px 7px"}} onClick={()=>setEditing(true)}>✏️</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{background:"#1a1a1f",border:"1px solid #f97316",borderRadius:10,padding:"13px 14px",marginBottom:8}}>
      <div className="field-row" style={{marginBottom:8}}>
        <div className="field" style={{margin:0}}><label>Date</label><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} /></div>
        <div className="field" style={{margin:0}}><label>Cost ($)</label><input type="number" step="0.01" value={form.cost} onChange={e=>setForm({...form,cost:e.target.value})} /></div>
      </div>
      <div className="field" style={{margin:"0 0 10px"}}><label>Notes</label><input value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} /></div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <button className="btn btn-d btn-sm" onClick={()=>{if(confirm("Delete this entry?"))onDelete();}}>Delete</button>
        <button className="btn btn-g btn-sm" onClick={()=>setEditing(false)}>Cancel</button>
        <button className="btn btn-p btn-sm" onClick={()=>{
          onSave({ date: form.date, cost: form.cost?parseFloat(form.cost):null, notes: form.notes });
          setEditing(false);
        }}>Save</button>
      </div>
    </div>
  );
}

// ── Editable log entry: bike_logs row ─────────────────────────────────────────
function EditableBikeLogItem({ entry, label, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    date:  entry.date,
    miles: entry.miles.toString(),
    cost:  entry.cost!=null ? entry.cost.toString() : "",
    notes: entry.notes || "",
  });

  if (!editing) {
    return (
      <div className="log-item">
        <div style={{flex:1}}>
          <div className="log-lbl">{label}</div>
          <div className="log-meta">{entry.date} · {entry.miles.toLocaleString()} mi{entry.notes?` · ${entry.notes}`:""}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          <div className="log-cost">{entry.cost?`$${parseFloat(entry.cost).toFixed(2)}`:"—"}</div>
          <button className="btn btn-g btn-sm" style={{fontSize:".66rem",padding:"2px 7px"}} onClick={()=>setEditing(true)}>✏️</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{background:"#1a1a1f",border:"1px solid #f97316",borderRadius:10,padding:"13px 14px",marginBottom:8}}>
      <div className="field-row" style={{marginBottom:8}}>
        <div className="field" style={{margin:0}}><label>Date</label><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} /></div>
        <div className="field" style={{margin:0}}><label>Odometer</label><input type="number" value={form.miles} onChange={e=>setForm({...form,miles:e.target.value})} /></div>
        <div className="field" style={{margin:0}}><label>Cost ($)</label><input type="number" step="0.01" value={form.cost} onChange={e=>setForm({...form,cost:e.target.value})} /></div>
      </div>
      <div className="field" style={{margin:"0 0 10px"}}><label>Notes</label><input value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} /></div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <button className="btn btn-d btn-sm" onClick={()=>{if(confirm("Delete this entry?"))onDelete();}}>Delete</button>
        <button className="btn btn-g btn-sm" onClick={()=>setEditing(false)}>Cancel</button>
        <button className="btn btn-p btn-sm" onClick={()=>{
          onSave({ date: form.date, miles: parseInt(form.miles), cost: form.cost?parseFloat(form.cost):null, notes: form.notes });
          setEditing(false);
        }}>Save</button>
      </div>
    </div>
  );
}

// ── Editable schedule row: vehicle maintenance schedule item ("Service Item") ─
function VehicleScheduleRow({ svc, last, pct, col, left, onLog, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel]     = useState(svc.label);
  const [miles, setMiles]     = useState(svc.miles.toString());

  if (editing) {
    return (
      <div style={{background:"#1a1a1f",border:"1px solid #f97316",borderRadius:10,padding:"12px 14px",marginBottom:6}}>
        <div className="field-row" style={{marginBottom:8}}>
          <div className="field" style={{margin:0,flex:2}}><label>Service Name</label><input value={label} onChange={e=>setLabel(e.target.value)} autoFocus /></div>
          <div className="field" style={{margin:0,flex:1}}><label>Interval (mi)</label><input type="number" value={miles} onChange={e=>setMiles(e.target.value)} /></div>
        </div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <button className="btn btn-d btn-sm" onClick={()=>{if(confirm("Delete this service item? Past log entries for it will be kept."))onDelete();}}>Delete</button>
          <button className="btn btn-g btn-sm" onClick={()=>setEditing(false)}>Cancel</button>
          <button className="btn btn-p btn-sm" onClick={()=>{onSave({label,miles:parseInt(miles)||svc.miles});setEditing(false);}}>Save</button>
        </div>
      </div>
    );
  }

  return (
    <div className="svc-row">
      <div className="svc-icon">{svcIcon(svc.label)}</div>
      <div className="svc-info">
        <div className="svc-lbl">{svc.label}</div>
        <div className="svc-det">Every {svc.miles.toLocaleString()} mi · {last?`Last @ ${last.miles.toLocaleString()} mi`:"No record"}</div>
      </div>
      <div className="bar-wrap">
        <div className="bar-bg"><div className="bar-fill" style={{width:`${pct}%`,background:col}} /></div>
        <div className="bar-pct" style={{color:col}}>{pct>=100?"OVERDUE":`${left.toLocaleString()} mi`}</div>
      </div>
      <button className="btn btn-g btn-sm" style={{fontSize:".66rem",padding:"3px 7px"}} onClick={()=>setEditing(true)}>✏️</button>
      <button className="btn btn-g btn-sm" onClick={onLog}>Log</button>
    </div>
  );
}

// ── Editable schedule row: home asset maintenance schedule item ("Service Item") ─
function HomeAssetScheduleRow({ sched, pct, col, due, onLog, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel]     = useState(sched.label);
  const [days, setDays]       = useState((sched.interval_days||90).toString());

  if (editing) {
    return (
      <div style={{background:"#1a1a1f",border:"1px solid #f97316",borderRadius:10,padding:"12px 14px",marginBottom:6}}>
        <div className="field-row" style={{marginBottom:8}}>
          <div className="field" style={{margin:0,flex:2}}><label>Service Name</label><input value={label} onChange={e=>setLabel(e.target.value)} autoFocus /></div>
          <div className="field" style={{margin:0,flex:1}}><label>Every (days)</label><input type="number" value={days} onChange={e=>setDays(e.target.value)} /></div>
        </div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <button className="btn btn-d btn-sm" onClick={()=>{if(confirm("Delete this service item? Past log entries for it will be kept."))onDelete();}}>Delete</button>
          <button className="btn btn-g btn-sm" onClick={()=>setEditing(false)}>Cancel</button>
          <button className="btn btn-p btn-sm" onClick={()=>{onSave({label,intervalDays:parseInt(days)||90});setEditing(false);}}>Save</button>
        </div>
      </div>
    );
  }

  return (
    <div className="svc-row">
      <div className="svc-icon">🔧</div>
      <div className="svc-info">
        <div className="svc-lbl">{sched.label}</div>
        <div className="svc-det">
          Every {sched.interval_days}d
          {sched.anchor_month ? ` · Anchor: month ${sched.anchor_month}` : ""}
          {sched.last_done ? ` · Last: ${sched.last_done}` : " · No record"}
        </div>
      </div>
      <div className="bar-wrap">
        <div className="bar-bg"><div className="bar-fill" style={{width:`${pct}%`,background:col}} /></div>
        <div className="bar-pct" style={{color:col}}>{pct>=100?"OVERDUE":due}</div>
      </div>
      <button className="btn btn-g btn-sm" style={{fontSize:".66rem",padding:"3px 7px"}} onClick={()=>setEditing(true)}>✏️</button>
      <button className="btn btn-g btn-sm" onClick={onLog}>Log</button>
    </div>
  );
}

// ── Home detail view ──────────────────────────────────────────────────────────
function HomeDetail({ property, items, homeLogs, homeAssets, childSchedules, childLogs, initialTab="assets", onLogItem, onAddItem, onUpdateItem, onDeleteItem, onGoAsset, onAddAsset, onLogSchedule, onUpdateSchedule, onDeleteSchedule, onEditChildLog, onDeleteChildLog, onEditHomeLog, onDeleteHomeLog, onBack }) {
  const [tab, setTab]           = useState(initialTab);
  const [showLogFor, setShowLogFor] = useState(null); // holds the whole task object now
  const [logForm, setLogForm]   = useState({ date:"", cost:"", notes:"" });
  const [addForm, setAddForm]   = useState({ label:"", category:"general", intervalDays:"90", notes:"" });
  const [showAdd, setShowAdd]   = useState(false);
  const [showRetiredHomeAssets, setShowRetiredHomeAssets] = useState(false);

  function submitLog() {
    if (!logForm.date || !showLogFor) return;
    if (showLogFor._source === "schedule") {
      onLogSchedule(showLogFor._assetId, showLogFor.id, showLogFor.label, logForm);
    } else {
      const entry = { id:`hl-${Date.now()}`, date:logForm.date, cost:logForm.cost?parseFloat(logForm.cost):null, notes:logForm.notes };
      onLogItem(showLogFor.id, entry);
      // also update lastDone on the item
      onUpdateItem(showLogFor.id, { lastDone: logForm.date });
    }
    setLogForm({ date:"", cost:"", notes:"" });
    setShowLogFor(null);
  }

  function submitAdd() {
    if (!addForm.label || !addForm.intervalDays) return;
    const newItem = {
      id: `hi-${Date.now()}`,
      propertyId: property.id,
      label: addForm.label,
      category: addForm.category,
      intervalDays: parseInt(addForm.intervalDays),
      lastDone: null,
      notes: addForm.notes,
    };
    onAddItem(newItem);
    setAddForm({ label:"", category:"general", intervalDays:"90", notes:"" });
    setShowAdd(false);
  }

  // Combined task list: property-direct items + every child Home Asset's schedule items.
  // This is what makes the overdue count (and Done flow) correct no matter which
  // page — the property's Tasks tab or an individual appliance's page — was used to log work.
  const activeChildAssets = (homeAssets||[]).filter(a => (a.status||"active")==="active");
  const allTasks = combineHomeTasks(items, activeChildAssets, childSchedules);

  // cost totals — combine home_logs (property-direct items) with service_logs (child Home Assets)
  const directLogs = items.flatMap(i => (homeLogs[i.id]||[]).map(l => ({...l, itemId:i.id, _source:"item"})));
  const childLogsTagged = (childLogs||[]).map(l => ({
    ...l,
    _source: "asset",
    _assetName: (homeAssets||[]).find(a=>a.id===l.asset_id)?.name,
  }));
  const allLogs = [...directLogs, ...childLogsTagged];
  const totalCost = allLogs.reduce((s,l) => s+(Number(l.cost)||0), 0);
  const byYear = {};
  allLogs.forEach(l => {
    const yr = l.date?.slice(0,4)||"?";
    byYear[yr] = (byYear[yr]||0) + (Number(l.cost)||0);
  });

  return (
    <>
      {/* Header */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:22,flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.9rem",letterSpacing:".06em"}}>🏠 <span style={{color:"#f97316"}}>{property.name}</span></div>
          {property.address && <div style={{fontSize:".82rem",color:"#6b7280",marginTop:2}}>{property.address}</div>}
          <div style={{display:"flex",gap:16,marginTop:10,flexWrap:"wrap"}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:".9rem",fontWeight:600}}>{allTasks.length}</div>
              <div style={{fontSize:".62rem",color:"#6b7280",textTransform:"uppercase",letterSpacing:".06em"}}>Tasks</div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:".9rem",fontWeight:600,color:"#ef4444"}}>{allTasks.filter(t=>homePct(t)>=100).length}</div>
              <div style={{fontSize:".62rem",color:"#6b7280",textTransform:"uppercase",letterSpacing:".06em"}}>Overdue</div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:".9rem",fontWeight:600,color:"#34d399"}}>{totalCost>0?`$${totalCost.toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:0})}`:"—"}</div>
              <div style={{fontSize:".62rem",color:"#6b7280",textTransform:"uppercase",letterSpacing:".06em"}}>Total Spent</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {[{key:"assets",label:`🏠 Assets (${(homeAssets||[]).length})`},{key:"tasks",label:"📋 Tasks"},{key:"history",label:`📜 History (${allLogs.length})`},{key:"costs",label:"💰 Costs"}].map(t=>(
          <button key={t.key} className={`tab${tab===t.key?" on":""}`} onClick={()=>setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {/* ASSETS TAB */}
      {tab==="assets" && (
        <>
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}>
            <button className="btn btn-g btn-sm" style={{fontSize:".7rem"}} onClick={()=>setShowRetiredHomeAssets(!showRetiredHomeAssets)}>
              {showRetiredHomeAssets ? "Hide Retired" : "Show Retired"}
            </button>
          </div>
          {(homeAssets||[]).filter(ha => showRetiredHomeAssets ? ha.status==="retired" : (ha.status||"active")==="active").length === 0
            ? <div style={{color:"#4b5563",fontSize:".86rem",padding:"12px 0"}}>{showRetiredHomeAssets ? "No retired assets." : "No home assets yet. Add one below."}</div>
            : <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
                {(homeAssets||[]).filter(ha => showRetiredHomeAssets ? ha.status==="retired" : (ha.status||"active")==="active").map(ha => {
                  const cat = HOME_ASSET_CATS[ha.subtype] || HOME_ASSET_CATS.general;
                  return (
                    <div key={ha.id}
                      onClick={()=>onGoAsset&&onGoAsset(ha.id)}
                      style={{background:"#141416",border:"1px solid #222226",borderRadius:10,padding:"12px 14px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",transition:"all .15s"}}
                      onMouseEnter={e=>e.currentTarget.style.borderColor="#f97316"}
                      onMouseLeave={e=>e.currentTarget.style.borderColor="#222226"}>
                      <div style={{width:36,height:36,borderRadius:8,background:cat.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.1rem",flexShrink:0}}>
                        {cat.icon}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:600,fontSize:".88rem"}}>{ha.name}{ha.status==="retired"?" 🔒":""}</div>
                        <div style={{fontSize:".72rem",color:"#6b7280",marginTop:1}}>
                          {ha.make?`${ha.make}${ha.model?` · ${ha.model}`:""} · `:""}
                          <span style={{color:cat.color}}>{cat.label}</span>
                        </div>
                      </div>
                      <div style={{color:"#4b5563",fontSize:"1rem"}}>›</div>
                    </div>
                  );
                })}
              </div>
          }
          <AddHomeAssetForm onAdd={async (asset) => { if(onAddAsset) await onAddAsset(asset); }} />
        </>
      )}

      {/* TASKS TAB */}
      {tab==="tasks" && (
        <>
          {allTasks.length === 0 && (
            <div style={{color:"#4b5563",fontSize:".86rem",padding:"12px 0"}}>No tasks yet. Add one below, or set up a Home Asset's service schedule.</div>
          )}
          {[...allTasks].sort((a,b)=>homePct(b)-homePct(a)).map(task=>(
            <HomeTaskRow
              key={`${task._source}-${task.id}`}
              task={task}
              onLogClick={()=>{
                setLogForm({date:new Date().toISOString().split("T")[0],cost:"",notes:""});
                setShowLogFor(task);
              }}
              onSaveItem={(id,updates)=>onUpdateItem(id,updates)}
              onDeleteItem={id=>onDeleteItem&&onDeleteItem(id)}
              onSaveSchedule={(id,updates)=>onUpdateSchedule&&onUpdateSchedule(id, { label: updates.label, interval_days: updates.intervalDays })}
              onDeleteSchedule={id=>onDeleteSchedule&&onDeleteSchedule(id)}
            />
          ))}

          {/* Add task */}
          {!showAdd
            ? <button className="btn btn-g btn-sm" style={{marginTop:16}} onClick={()=>setShowAdd(true)}>+ Add Task</button>
            : (
              <div className="add-home-form" style={{marginTop:16}}>
                <div className="add-home-title">New Task</div>
                <div style={{fontSize:".7rem",color:"#6b7280",marginBottom:10}}>
                  For a task tied to a specific appliance (water heater, furnace, etc.), add it as a Service Item on that asset's own page instead — it'll show up here automatically.
                </div>
                <div className="field-row">
                  <div className="field"><label>Task Name</label><input placeholder="e.g. Clean gutters" value={addForm.label} onChange={e=>setAddForm({...addForm,label:e.target.value})} /></div>
                  <div className="field">
                    <label>Category</label>
                    <select value={addForm.category} onChange={e=>setAddForm({...addForm,category:e.target.value})}>
                      {Object.entries(HOME_CATS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="field-row">
                  <div className="field">
                    <label>Interval</label>
                    <select value={addForm.intervalDays} onChange={e=>setAddForm({...addForm,intervalDays:e.target.value})}>
                      <option value="7">Weekly</option>
                      <option value="14">Every 2 weeks</option>
                      <option value="30">Monthly</option>
                      <option value="60">Every 2 months</option>
                      <option value="90">Every 3 months</option>
                      <option value="180">Every 6 months</option>
                      <option value="365">Annually</option>
                    </select>
                  </div>
                  <div className="field"><label>Notes (optional)</label><input placeholder="Details…" value={addForm.notes} onChange={e=>setAddForm({...addForm,notes:e.target.value})} /></div>
                </div>
                <div style={{display:"flex",gap:8,marginTop:4}}>
                  <button className="btn btn-p btn-sm" onClick={submitAdd}>Add Task</button>
                  <button className="btn btn-g btn-sm" onClick={()=>setShowAdd(false)}>Cancel</button>
                </div>
              </div>
            )
          }
        </>
      )}

      {/* HISTORY TAB */}
      {tab==="history" && (
        <>
          {allLogs.length===0
            ? <div style={{color:"#4b5563",fontSize:".86rem",padding:"12px 0"}}>No history yet. Mark tasks as done to build history.</div>
            : [...allLogs].sort((a,b)=>(b.date||"").localeCompare(a.date||"")).map(e=>{
                if (e._source === "asset") {
                  return (
                    <EditableAssetLogItem
                      key={`asset-${e.id}`}
                      entry={e}
                      assetName={e._assetName}
                      onSave={updates=>onEditChildLog&&onEditChildLog(e.id, updates)}
                      onDelete={()=>onDeleteChildLog&&onDeleteChildLog(e.id)}
                    />
                  );
                }
                const item = items.find(i=>i.id===e.itemId);
                const cat  = HOME_CATS[item?.category] || HOME_CATS.general;
                return (
                  <EditableHomeLogItem
                    key={`item-${e.id}`}
                    entry={e}
                    label={item?.label || "Unknown"}
                    icon={cat.icon}
                    onSave={updates=>onEditHomeLog&&onEditHomeLog(e.id, e.itemId, updates)}
                    onDelete={()=>onDeleteHomeLog&&onDeleteHomeLog(e.id, e.itemId)}
                  />
                );
              })
          }
        </>
      )}

      {/* COSTS TAB */}
      {tab==="costs" && (
        <>
          <div className="sec">All-Time Total</div>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-val">{totalCost>0?`$${totalCost.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`:"—"}</div>
              <div className="stat-lbl">Total Home Maintenance</div>
            </div>
          </div>
          {Object.keys(byYear).length > 0 && (
            <>
              <div className="sec">By Year</div>
              <table className="yr-table">
                <thead><tr><th>Year</th><th>Amount</th></tr></thead>
                <tbody>
                  {Object.entries(byYear).sort((a,b)=>b[0].localeCompare(a[0])).map(([yr,amt])=>(
                    <tr key={yr}><td style={{fontWeight:600}}>{yr}</td><td>${amt.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}</td></tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          {Object.keys(byYear).length===0 && <div style={{color:"#4b5563",fontSize:".86rem",padding:"12px 0"}}>No cost data yet. Add costs when marking tasks complete.</div>}
        </>
      )}

      {/* LOG DONE MODAL */}
      {showLogFor && (
        <div className="overlay" onClick={()=>setShowLogFor(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">Mark Complete</div>
            <div style={{fontSize:".84rem",color:"#9ca3af",marginBottom:16}}>
              {showLogFor.label}{showLogFor._source==="schedule" && showLogFor._assetName ? ` — ${showLogFor._assetName}` : ""}
            </div>
            <div className="field-row">
              <div className="field"><label>Date Completed</label><input type="date" value={logForm.date} onChange={e=>setLogForm({...logForm,date:e.target.value})} /></div>
              <div className="field"><label>Cost (optional)</label><input type="number" step="0.01" placeholder="0.00" value={logForm.cost} onChange={e=>setLogForm({...logForm,cost:e.target.value})} /></div>
            </div>
            <div className="field"><label>Notes (optional)</label><input placeholder="Brand, details, who did it…" value={logForm.notes} onChange={e=>setLogForm({...logForm,notes:e.target.value})} /></div>
            <div className="modal-btns">
              <button className="btn btn-g" onClick={()=>setShowLogFor(null)}>Cancel</button>
              <button className="btn btn-p" onClick={submitLog}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


// ── Bike detail view ──────────────────────────────────────────────────────────
function BikeDetail({ bike, bikeLogs, bikePhoto, allPhotos, jwt: bikeJwt, uid: bikeUid, bikeComponents, rideAssignments, stravaRides, stravaEbike, stravaLoading, onRefreshStrava, onLogItem, onUpdateBike, onSavePhoto, onAddComponent, onAssignRide, onRefreshPhotos, onRetire, onRestore, onEditLog, onDeleteLog, onBack }) {
  const [tab, setTab]               = useState("stats");
  const [editingBike, setEditingBike] = useState(false);
  const [showLogFor, setShowLogFor] = useState(null);
  const [logForm, setLogForm]       = useState({ date:"", miles:"", cost:"", notes:"" });
  const [milesEdit, setMilesEdit]   = useState((bike.currentMiles||0).toString());
  const [showAddComp, setShowAddComp] = useState(false);
  const [compForm, setCompForm]     = useState({ date:new Date().toISOString().split("T")[0], name:"", cat:"drivetrain", maintItem:"", cost:"", notes:"" });
  const [rideFilter, setRideFilter] = useState("unassigned"); // "all" | "mine" | "unassigned"
  const [rideSearch, setRideSearch] = useState("");

  function submitLog() {
    if (!logForm.miles) return;
    const key = bike.id + "-" + showLogFor;
    const entry = { id:`bl-${Date.now()}`, date:logForm.date||new Date().toISOString().split("T")[0], miles:parseInt(logForm.miles), cost:logForm.cost?parseFloat(logForm.cost):null, notes:logForm.notes };
    onLogItem(key, entry);
    onUpdateBike(bike.id, { currentMiles: Math.max(bike.currentMiles, parseInt(logForm.miles)) });
    setLogForm({ date:"", miles:"", cost:"", notes:"" });
    setShowLogFor(null);
  }

  function submitComp() {
    if (!compForm.name) return;
    const entry = { id:`bc-${Date.now()}`, date:compForm.date, name:compForm.name, cat:compForm.cat, maintItem:compForm.maintItem||null, cost:compForm.cost?parseFloat(compForm.cost):null, notes:compForm.notes };
    onAddComponent(bike.id, entry);
    setCompForm({ date:new Date().toISOString().split("T")[0], name:"", cat:"drivetrain", maintItem:"", cost:"", notes:"" });
    setShowAddComp(false);
  }

  const cat = BIKE_CATS[bike.type] || BIKE_CATS.road;
  const allSvcLogs = BIKE_MAINT.flatMap(item => (bikeLogs[bike.id+"-"+item.id]||[]).map(l=>({...l,itemId:item.id,itemLabel:item.label})));
  const components = bikeComponents[bike.id] || [];
  // Build rides list from DB ride_assignments using activity-ID keys
  const assignedKeys = Object.keys(rideAssignments||{}).filter(k => rideAssignments[k] === bike.id);
  const myRides = assignedKeys.map(k => {
    if (k.startsWith("ebike-")) {
      const actId = k.replace("ebike-", "");
      const r = (stravaEbike||[]).find(x => x.actId === actId);
      return r ? { key:k, d:r.d, mi:r.mi, n:r.n, dur:r.dur, type:"ebike" } : null;
    } else {
      // key is "ride-{actId}" or "virtual-{actId}"
      const r = (stravaRides||[]).find(x => x.key === k);
      return r ? { key:k, d:r.d, mi:r.mi, n:r.n, dur:r.dur, type:r.type } : null;
    }
  }).filter(Boolean).sort((a,b) => b.d.localeCompare(a.d));

  // Stats
  const allMyRides = myRides;
  const totalMi    = allMyRides.reduce((s,r)=>s+r.mi,0);
  const avgMi      = allMyRides.length ? totalMi/allMyRides.length : 0;
  const maxMi      = allMyRides.length ? Math.max(...allMyRides.map(r=>r.mi)) : 0;
  const compCost   = components.reduce((s,c)=>s+(c.cost||0),0);
  const svcCost    = allSvcLogs.reduce((s,l)=>s+(l.cost||0),0);

  // Ride filtering — uses sheet type routing based on bike subtype
  const filteredRides = (() => {
    const allowedTypes = BIKE_SHEET_MAP[bike.type||"road"] || ["ride"];
    const isEbike = allowedTypes.includes("ebike");
    // Build pool from correct sheet(s)
    const pool = isEbike
      ? (stravaEbike||[]).map(r => ({
          key: "ebike-"+r.actId, d: r.d, mi: r.mi, n: r.n, dur: r.dur, type: "ebike",
          assignedTo: rideAssignments["ebike-"+r.actId] || null,
        }))
      : (stravaRides||[]).filter(r => allowedTypes.includes(r.type)).map(r => ({
          key: r.key, d: r.d, mi: r.mi, n: r.n, dur: r.dur, type: r.type,
          assignedTo: rideAssignments[r.key] || null,
        }));
    return pool.filter(r => {
      if (rideFilter === "mine")       return r.assignedTo === bike.id;
      if (rideFilter === "unassigned") return !r.assignedTo;
      return true;
    }).filter(r => {
      if (!rideSearch) return true;
      return r.n.toLowerCase().includes(rideSearch.toLowerCase()) || r.d.includes(rideSearch);
    }).sort((a,b) => b.d.localeCompare(a.d));
  })();

  // Cost by category
  const costByCat = {};
  Object.keys(COMP_CATS).forEach(k => { costByCat[k] = 0; });
  components.forEach(c => { costByCat[c.cat] = (costByCat[c.cat]||0) + (c.cost||0); });

  return (
    <>
      {/* Header */}
      <div className="det-hdr">
        <div className="det-photo-wrap">
          <div className="det-photo" style={{fontSize:"2rem"}}>
            {bikePhoto ? <img src={bikePhoto} alt={bike.name} /> : <span>{cat.icon}</span>}
          </div>
          <PhotoUploader vehicle={bike} onSave={dataUrl => onSavePhoto(bike.id, dataUrl)} />
        </div>
        <div className="det-info">
          <div className="det-title">{bike.make} <span style={{color:"#f97316"}}>{bike.model}</span></div>
          <div className="det-sub" style={{display:"flex",alignItems:"center",gap:8,marginTop:4,flexWrap:"wrap"}}>
            <span style={{background:cat.bg,color:cat.color,fontSize:".7rem",fontWeight:600,padding:"2px 8px",borderRadius:99,letterSpacing:".05em"}}>{cat.label}</span>
            {bike.weight && <span style={{color:"#6b7280",fontSize:".75rem"}}>{bike.weight}</span>}
            {bike.purchaseYear && <span style={{color:"#6b7280",fontSize:".75rem"}}>Since {bike.purchaseYear}</span>}
          </div>
          <div className="odo-row" style={{marginTop:10}}>
            <input className="odo-inp" type="number" value={milesEdit}
              onChange={e=>setMilesEdit(e.target.value)}
              onBlur={()=>{const m=parseInt(milesEdit);if(!isNaN(m))onUpdateBike(bike.id,{currentMiles:m});}} />
            <span style={{fontSize:".8rem",color:"#6b7280"}}>miles</span>
          </div>
          <div style={{fontSize:".7rem",color:"#4b5563",marginTop:4}}>Strava odometer</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}>
          <button className="btn btn-g btn-sm" onClick={()=>setEditingBike(true)}>✏️ Edit</button>
          {(bike.status||"active")==="active"
            ? <RetireModal type="bike" asset={bike} onRetire={(sd,sp)=>onRetire?onRetire(sd,sp):onUpdateBike(bike.id,{status:"retired",soldDate:sd||null,soldPrice:sp||null})} />
            : <button className="btn btn-g btn-sm" onClick={()=>onRestore?onRestore():onUpdateBike(bike.id,{status:"active",soldDate:null,soldPrice:null})}>↩ Restore</button>
          }
        </div>
          {editingBike && (
            <EditAssetModal
              asset={bike}
              type="bike"
              onSave={updates=>onUpdateBike(bike.id, updates)}
              onClose={()=>setEditingBike(false)}
            />
          )}
      </div>

      {/* Tabs */}
      <div className="tabs">
        {[
          {key:"stats",    label:"📊 Stats"},
          {key:"schedule", label:"📋 Schedule"},
          {key:"rides",    label:`🚴 Rides (${myRides.length})`},
          {key:"history",  label:`📜 Service (${allSvcLogs.length})`},
          {key:"costs",    label:"💰 Components"},
          {key:"gallery",  label:"📸 Photos"},
        ].map(t=>(
          <button key={t.key} className={`tab${tab===t.key?" on":""}`} onClick={()=>setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {/* ── STATS ── */}
      {tab==="stats" && (
        <>
          <div className="stat-row">
            <div className="stat-pill">
              <div className="stat-pill-val">{(bike.currentMiles||0).toLocaleString()}</div>
              <div className="stat-pill-lbl">Total Miles</div>
            </div>
            <div className="stat-pill">
              <div className="stat-pill-val">{allMyRides.length}</div>
              <div className="stat-pill-lbl">Rides Logged</div>
            </div>
            <div className="stat-pill">
              <div className="stat-pill-val">{avgMi>0?avgMi.toFixed(1):"—"}</div>
              <div className="stat-pill-lbl">Avg Ride (mi)</div>
            </div>
            <div className="stat-pill">
              <div className="stat-pill-val">{maxMi>0?maxMi.toFixed(1):"—"}</div>
              <div className="stat-pill-lbl">Longest Ride</div>
            </div>
          </div>
          <div className="stat-row">
            <div className="stat-pill">
              <div className="stat-pill-val" style={{color:"#34d399"}}>{compCost>0?`$${compCost.toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:0})}`:"—"}</div>
              <div className="stat-pill-lbl">Component Cost</div>
            </div>
            <div className="stat-pill">
              <div className="stat-pill-val" style={{color:"#60a5fa"}}>{svcCost>0?`$${svcCost.toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:0})}`:"—"}</div>
              <div className="stat-pill-lbl">Service Cost</div>
            </div>
            <div className="stat-pill">
              <div className="stat-pill-val" style={{color:"#f97316"}}>{(compCost+svcCost)>0?`$${(compCost+svcCost).toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:0})}`:"—"}</div>
              <div className="stat-pill-lbl">Total Spend</div>
            </div>
            {bike.currentMiles>0 && (compCost+svcCost)>0 && (
              <div className="stat-pill">
                <div className="stat-pill-val">${((compCost+svcCost)/bike.currentMiles).toFixed(2)}</div>
                <div className="stat-pill-lbl">Cost / Mile</div>
              </div>
            )}
          </div>
          {allMyRides.length === 0 && (
            <div style={{color:"#4b5563",fontSize:".84rem",padding:"8px 0"}}>
              No rides assigned yet. Go to the Rides tab to assign Strava activities to this bike.
            </div>
          )}
        </>
      )}

      {/* ── SCHEDULE ── */}
      {tab==="schedule" && (
        <div className="svc-list">
          {BIKE_MAINT.map(item=>{
            const key = bike.id+"-"+item.id;
            const logs = (bikeLogs[key]||[]).sort((a,b)=>b.miles-a.miles);
            const lastMiles = logs[0]?.miles ?? null;
            const pct  = bikePct(lastMiles, item.intervalMiles, bike.currentMiles);
            const left = bikeMiLeft(lastMiles, item.intervalMiles, bike.currentMiles);
            const col  = statusColor(pct);
            const catKey = Object.keys(COMP_CATS).find(k=>COMP_CATS[k].items.includes(item.id)) || "other";
            const cc = COMP_CATS[catKey];
            return (
              <div key={item.id} className="bsvc-row">
                <div className="svc-icon">{cc.icon}</div>
                <div className="svc-info">
                  <div className="svc-lbl">
                    {item.label}
                    <span className="comp-cat-badge" style={{background:`${cc.color}22`,color:cc.color,marginLeft:7}}>{cc.label}</span>
                  </div>
                  <div className="svc-det">
                    Every {item.intervalMiles.toLocaleString()} mi
                    {lastMiles ? ` · Last @ ${lastMiles.toLocaleString()} mi` : " · No record"}
                  </div>
                </div>
                <div className="bar-wrap">
                  <div className="bar-bg"><div className="bar-fill" style={{width:`${pct}%`,background:col}} /></div>
                  <div className="bar-pct" style={{color:col}}>{pct>=100?"OVERDUE":`${left.toLocaleString()} mi`}</div>
                </div>
                <button className="btn btn-g btn-sm" onClick={()=>{
                  setLogForm({date:new Date().toISOString().split("T")[0], miles:(bike.currentMiles||0).toString(), cost:"", notes:""});
                  setShowLogFor(item.id);
                }}>Log</button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── RIDES ── */}
      {tab==="rides" && (
        <>
          {stravaLoading && (
            <div style={{fontSize:".78rem",color:"#f97316",marginBottom:8}}>⏳ Loading rides from Strava…</div>
          )}
          {!stravaLoading && (stravaRides||[]).length === 0 && (stravaEbike||[]).length === 0 && (
            <div style={{fontSize:".78rem",color:"#f87171",marginBottom:8,background:"#2a0a0a",padding:"8px 12px",borderRadius:7}}>
              ⚠ Rides not loaded. Check browser console (F12) for errors. Sheets may need to be shared publicly.
              {onRefreshStrava && <button className="btn btn-g btn-sm" style={{marginLeft:8,fontSize:".7rem"}} onClick={onRefreshStrava}>Retry</button>}
            </div>
          )}
          <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
            <div className="tabs" style={{margin:0,flexShrink:0}}>
              {[{k:"unassigned",l:"Unassigned"},{k:"mine",l:"This Bike"},{k:"all",l:"All Rides"}].map(f=>(
                <button key={f.k} className={`tab${rideFilter===f.k?" on":""}`} onClick={()=>setRideFilter(f.k)}>{f.l}</button>
              ))}
            </div>
            <input style={{flex:1,minWidth:120,background:"#1c1c1f",border:"1px solid #2a2a2e",color:"#e8e6e1",fontFamily:"'DM Sans',sans-serif",fontSize:".82rem",padding:"6px 10px",borderRadius:7}}
              placeholder="Search rides…" value={rideSearch} onChange={e=>setRideSearch(e.target.value)} />
          </div>
          <div style={{fontSize:".72rem",color:"#6b7280",marginBottom:10}}>
            {rideFilter==="unassigned" ? "Click a ride to assign it to this bike." : rideFilter==="mine" ? `${myRides.length} rides assigned to this bike.` : `Showing all ${filteredRides.length} Strava activities.`}
          {onRefreshStrava && <button className="btn btn-g btn-sm" style={{fontSize:".7rem",marginLeft:"auto"}} onClick={onRefreshStrava}>↻ Refresh Rides</button>}
          </div>
          <div style={{maxHeight:480,overflowY:"auto"}}>
            {filteredRides.slice(0,300).map((r,i)=>{
              const key = r.key;
              const isMe = r.assignedTo === bike.id;
              const isEbike = r.type === "ebike";
              return (
                <div key={i} className={`ride-row${isMe?" assigned":""}`}
                  onClick={()=>{ if(!isMe) onAssignRide(key, bike.id); else onAssignRide(key, null); }}
                  title={isMe?"Click to unassign":"Click to assign to this bike"}>
                  <div style={{flex:1,minWidth:0}}>
                    <div className="ride-name">{isEbike?"⚡ ":""}{r.n || "Ride"}</div>
                    <div className="ride-meta">{r.d}{r.dur?" · "+r.dur:""}</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                    <div className="ride-dist">{typeof r.mi==="number"?r.mi.toFixed(1):r.mi} mi</div>
                    {isMe && <span style={{fontSize:".65rem",color:"#22c55e",fontWeight:600}}>✓</span>}
                    {r.assignedTo && !isMe && <span style={{fontSize:".65rem",color:"#6b7280"}}>other</span>}
                  </div>
                </div>
              );
            })}
            {filteredRides.length === 0 && <div style={{color:"#4b5563",fontSize:".84rem",padding:"12px 0"}}>No rides match.</div>}
            {filteredRides.length > 200 && <div style={{color:"#6b7280",fontSize:".72rem",padding:"8px 0"}}>Showing first 200 of {filteredRides.length}. Use search to narrow down.</div>}
          </div>
        </>
      )}

      {/* ── SERVICE HISTORY ── */}
      {tab==="history" && (
        <>
          {allSvcLogs.length===0
            ? <div style={{color:"#4b5563",fontSize:".86rem",padding:"12px 0"}}>No service history yet.</div>
            : [...allSvcLogs].sort((a,b)=>b.miles-a.miles).map(e=>(
              <EditableBikeLogItem
                key={e.id}
                entry={e}
                label={e.itemLabel}
                onSave={updates=>onEditLog&&onEditLog(e.id, updates)}
                onDelete={()=>onDeleteLog&&onDeleteLog(e.id)}
              />
            ))
          }
          <div style={{marginTop:14}}>
            <button className="btn btn-p btn-sm" onClick={()=>{
              setLogForm({date:new Date().toISOString().split("T")[0], miles:(bike.currentMiles||0).toString(), cost:"", notes:""});
              setShowLogFor(BIKE_MAINT[0].id);
            }}>+ Log Service</button>
          </div>
        </>
      )}

      {/* ── COMPONENTS & COSTS ── */}
      {tab==="costs" && (
        <>
          {/* Category totals */}
          <div className="stat-row" style={{marginBottom:16}}>
            {Object.entries(COMP_CATS).map(([k,c])=>(
              costByCat[k]>0 && (
                <div key={k} className="stat-pill">
                  <div className="stat-pill-val" style={{color:c.color,fontSize:"1.2rem"}}>{c.icon} ${costByCat[k].toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:0})}</div>
                  <div className="stat-pill-lbl">{c.label}</div>
                </div>
              )
            ))}
            {compCost===0 && <div style={{color:"#4b5563",fontSize:".84rem",padding:"8px 0"}}>No components logged yet.</div>}
          </div>

          {/* Component list */}
          {[...components].sort((a,b)=>b.date.localeCompare(a.date)).map(c=>{
            const cc = COMP_CATS[c.cat]||COMP_CATS.other;
            const linked = c.maintItem ? BIKE_MAINT.find(m=>m.id===c.maintItem) : null;
            return (
              <div key={c.id} className="comp-row">
                <div style={{fontSize:"1.1rem",width:24,textAlign:"center",flexShrink:0}}>{cc.icon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:500,fontSize:".86rem"}}>
                    {c.name}
                    <span className="comp-cat-badge" style={{background:`${cc.color}22`,color:cc.color,marginLeft:7}}>{cc.label}</span>
                    {linked && <span style={{fontSize:".65rem",color:"#6b7280",marginLeft:6}}>→ {linked.label}</span>}
                  </div>
                  <div style={{fontSize:".7rem",color:"#6b7280",marginTop:2}}>{c.date}{c.notes?` · ${c.notes}`:""}</div>
                </div>
                <div style={{fontWeight:600,fontSize:".86rem",flexShrink:0}}>{c.cost?`$${c.cost.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`:"—"}</div>
              </div>
            );
          })}

          {/* Add component form */}
          {!showAddComp
            ? <button className="btn btn-p btn-sm" style={{marginTop:14}} onClick={()=>setShowAddComp(true)}>+ Add Component</button>
            : (
              <div className="add-home-form" style={{marginTop:14}}>
                <div className="add-home-title">Add Component / Part</div>
                <div className="field-row">
                  <div className="field"><label>Component Name</label><input placeholder="e.g. Shimano 105 Chain" value={compForm.name} onChange={e=>setCompForm({...compForm,name:e.target.value})} autoFocus /></div>
                  <div className="field">
                    <label>Category</label>
                    <select value={compForm.cat} onChange={e=>setCompForm({...compForm,cat:e.target.value,maintItem:""})}>
                      {Object.entries(COMP_CATS).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="field-row">
                  <div className="field">
                    <label>Link to Schedule Item (optional)</label>
                    <select value={compForm.maintItem} onChange={e=>setCompForm({...compForm,maintItem:e.target.value})}>
                      <option value="">— none —</option>
                      {(COMP_CATS[compForm.cat]?.items||[]).map(id=>{
                        const m = BIKE_MAINT.find(m=>m.id===id);
                        return m ? <option key={id} value={id}>{m.label}</option> : null;
                      })}
                    </select>
                  </div>
                  <div className="field"><label>Date</label><input type="date" value={compForm.date} onChange={e=>setCompForm({...compForm,date:e.target.value})} /></div>
                </div>
                <div className="field-row">
                  <div className="field"><label>Cost ($)</label><input type="number" step="0.01" placeholder="0.00" value={compForm.cost} onChange={e=>setCompForm({...compForm,cost:e.target.value})} /></div>
                  <div className="field"><label>Notes</label><input placeholder="Brand, shop, details…" value={compForm.notes} onChange={e=>setCompForm({...compForm,notes:e.target.value})} /></div>
                </div>
                <div style={{display:"flex",gap:8,marginTop:6}}>
                  <button className="btn btn-p btn-sm" onClick={submitComp}>Add</button>
                  <button className="btn btn-g btn-sm" onClick={()=>setShowAddComp(false)}>Cancel</button>
                </div>
              </div>
            )
          }
        </>
      )}

      {/* GALLERY */}
      {tab==="gallery" && (
        <PhotoGallery
          assetId={bike.id}
          photos={{[bike.id]: bikePhoto}}
          allPhotos={allPhotos||[]}
          jwt={bikeJwt||""}
          uid={bikeUid||""}
          onPrimaryChange={onRefreshPhotos||(() => {})}
        />
      )}

      {/* LOG SERVICE MODAL */}
      {showLogFor && (
        <div className="overlay" onClick={()=>setShowLogFor(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">Log Service</div>
            <div style={{fontSize:".84rem",color:"#9ca3af",marginBottom:14}}>
              {BIKE_MAINT.find(i=>i.id===showLogFor)?.label} — {bike.name}
            </div>
            <div className="field">
              <label>Service Type</label>
              <select value={showLogFor} onChange={e=>setShowLogFor(e.target.value)}>
                {BIKE_MAINT.map(i=><option key={i.id} value={i.id}>{i.label}</option>)}
              </select>
            </div>
            <div className="field-row">
              <div className="field"><label>Odometer (miles)</label><input type="number" value={logForm.miles} onChange={e=>setLogForm({...logForm,miles:e.target.value})} /></div>
              <div className="field"><label>Date</label><input type="date" value={logForm.date} onChange={e=>setLogForm({...logForm,date:e.target.value})} /></div>
            </div>
            <div className="field"><label>Cost (optional)</label><input type="number" step="0.01" placeholder="0.00" value={logForm.cost} onChange={e=>setLogForm({...logForm,cost:e.target.value})} /></div>
            <div className="field"><label>Notes (optional)</label><input placeholder="Brand, shop, details…" value={logForm.notes} onChange={e=>setLogForm({...logForm,notes:e.target.value})} /></div>
            <div className="modal-btns">
              <button className="btn btn-g" onClick={()=>setShowLogFor(null)}>Cancel</button>
              <button className="btn btn-p" onClick={submitLog}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


// ── Valuation tab ─────────────────────────────────────────────────────────────
function ValuationTab({ vehicle, onUpdate }) {
  const [editPrice,  setEditPrice]  = useState(vehicle.purchasePrice ? vehicle.purchasePrice.toString() : "");
  const [editDate,   setEditDate]   = useState(vehicle.purchaseDate || "");
  const [saving,     setSaving]     = useState(false);
  const [editValues, setEditValues] = useState(false);
  const [mvForm,     setMvForm]     = useState({
    tradeIn:      vehicle.marketValues?.tradeIn?.toString()      || "",
    privateParty: vehicle.marketValues?.privateParty?.toString() || "",
    asOf:         vehicle.marketValues?.asOf || new Date().toISOString().split("T")[0],
    source:       vehicle.marketValues?.source || "KBB",
  });

  const mv  = vehicle.marketValues;
  const pp  = vehicle.purchasePrice;

  // Staleness check — warn after 90 days
  const STALE_DAYS = 90;
  const isStale = (() => {
    if (!mv?.asOf) return true;
    const days = Math.floor((Date.now() - new Date(mv.asOf + "T00:00:00").getTime()) / 86400000);
    return days > STALE_DAYS;
  })();
  const daysSinceUpdate = mv?.asOf
    ? Math.floor((Date.now() - new Date(mv.asOf + "T00:00:00").getTime()) / 86400000)
    : null;
  const fmt = n => n == null ? "—" : `$${Number(n).toLocaleString("en-US", {minimumFractionDigits:0})}`;
  const dep = pp && mv ? pp - mv.privateParty : null;
  const depPct = pp && mv ? Math.round(((pp - mv.privateParty) / pp) * 100) : null;

  function save() {
    const val = editPrice ? parseFloat(editPrice) : null;
    onUpdate({ purchasePrice: val, purchaseDate: editDate || null });
    setSaving(false);
  }

  return (
    <>
      {/* Purchase Price */}
      <div className="sec">Purchase Price</div>
      <div style={{background:"#141416",border:"1px solid #222226",borderRadius:10,padding:"16px 18px",marginBottom:10}}>
        {!saving ? (
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.8rem",letterSpacing:".04em",color: pp?"#e8e6e1":"#4b5563"}}>
                {pp ? fmt(pp) : "Not set"}
              </div>
              <div style={{fontSize:".7rem",color:"#6b7280",marginTop:2,textTransform:"uppercase",letterSpacing:".06em"}}>Purchase price paid</div>
            </div>
            <button className="btn btn-g btn-sm" style={{marginLeft:"auto"}} onClick={()=>setSaving(true)}>
              {pp ? "Edit" : "+ Add Price"}
            </button>
          </div>
        ) : (
          <div style={{display:"flex",gap:8,alignItems:"flex-end",flexWrap:"wrap"}}>
            <div className="field" style={{margin:0,flex:"1 1 120px"}}>
              <label>Purchase Price ($)</label>
              <input type="number" placeholder="25000" value={editPrice} onChange={e=>setEditPrice(e.target.value)} autoFocus />
            </div>
            <div className="field" style={{margin:0,flex:"1 1 130px"}}>
              <label>Purchase Date</label>
              <input type="date" value={editDate} onChange={e=>setEditDate(e.target.value)} />
            </div>
            <button className="btn btn-p btn-sm" style={{height:36,alignSelf:"flex-end"}} onClick={save}>Save</button>
            <button className="btn btn-g btn-sm" style={{height:36,alignSelf:"flex-end"}} onClick={()=>setSaving(false)}>Cancel</button>
          </div>
        )}
      </div>

      {/* Market Values */}
      <div className="sec" style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span>
          Current Market Values
          {mv?.asOf && <span style={{fontWeight:400,color:"#4b5563",fontSize:".65rem",letterSpacing:0,textTransform:"none",marginLeft:6}}>
            · Updated {daysSinceUpdate === 0 ? "today" : `${daysSinceUpdate}d ago`}
          </span>}
        </span>
        <button className="btn btn-g btn-sm" style={{fontSize:".7rem"}} onClick={()=>setEditValues(!editValues)}>
          {editValues ? "Cancel" : mv ? "✏️ Update" : "+ Add Values"}
        </button>
      </div>

      {/* Staleness warning */}
      {isStale && !editValues && (
        <div style={{background:"#3a2a0a",border:"1px solid #f59e0b44",borderRadius:8,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:"1rem"}}>⏰</span>
          <div style={{flex:1}}>
            <div style={{fontSize:".82rem",fontWeight:600,color:"#f59e0b"}}>
              {mv ? `Values are ${daysSinceUpdate} days old` : "No market values on file"}
            </div>
            <div style={{fontSize:".72rem",color:"#9ca3af",marginTop:2}}>
              {mv
                ? `Last updated ${mv.asOf}. KBB recommends checking every 90 days.`
                : "Add trade-in and private party values to track depreciation."}
              {" "}Ask Claude for current KBB values anytime.
            </div>
          </div>
          <button className="btn btn-p btn-sm" style={{fontSize:".72rem",flexShrink:0}} onClick={()=>setEditValues(true)}>
            Update Now
          </button>
        </div>
      )}

      {/* Edit form */}
      {editValues && (
        <div style={{background:"#1a1a1f",border:"1px solid #2a2a2e",borderRadius:10,padding:"16px",marginBottom:14}}>
          <div style={{fontSize:".8rem",color:"#9ca3af",marginBottom:12}}>
            Enter current KBB values for <strong style={{color:"#e8e6e1"}}>{vehicle.name}</strong> ({vehicle.year} · {(vehicle.odometer||0).toLocaleString()} mi)
          </div>
          <div className="field-row">
            <div className="field">
              <label>Trade-In Value ($)</label>
              <input type="number" placeholder="e.g. 12500" value={mvForm.tradeIn}
                onChange={e=>setMvForm({...mvForm,tradeIn:e.target.value})} autoFocus />
              <div style={{fontSize:".68rem",color:"#4b5563",marginTop:3}}>Dealer / CarMax estimate</div>
            </div>
            <div className="field">
              <label>Private Party Value ($)</label>
              <input type="number" placeholder="e.g. 15200" value={mvForm.privateParty}
                onChange={e=>setMvForm({...mvForm,privateParty:e.target.value})} />
              <div style={{fontSize:".68rem",color:"#4b5563",marginTop:3}}>Sell to individual</div>
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Source</label>
              <select value={mvForm.source} onChange={e=>setMvForm({...mvForm,source:e.target.value})}>
                <option value="KBB">KBB (Kelley Blue Book)</option>
                <option value="Edmunds">Edmunds</option>
                <option value="CarMax">CarMax Offer</option>
                <option value="Carvana">Carvana Offer</option>
                <option value="Manual">Manual Estimate</option>
              </select>
            </div>
            <div className="field">
              <label>As Of Date</label>
              <input type="date" value={mvForm.asOf} onChange={e=>setMvForm({...mvForm,asOf:e.target.value})} />
            </div>
          </div>
          <div style={{display:"flex",gap:8,marginTop:4}}>
            <button className="btn btn-p btn-sm" onClick={()=>{
              const updated = {
                tradeIn:      mvForm.tradeIn      ? parseFloat(mvForm.tradeIn)      : null,
                privateParty: mvForm.privateParty ? parseFloat(mvForm.privateParty) : null,
                source:       mvForm.source,
                asOf:         mvForm.asOf,
              };
              onUpdate({ marketValues: updated });
              setEditValues(false);
            }}>Save Values</button>
            <button className="btn btn-g btn-sm" onClick={()=>setEditValues(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Current values display */}
      {mv && !editValues && (
        <>
          <div className="stat-grid" style={{marginBottom:16}}>
            <div className="stat-card">
              <div className="stat-val" style={{color:"#f97316"}}>{fmt(mv.tradeIn)}</div>
              <div className="stat-lbl">Trade-In Value</div>
              <div style={{fontSize:".68rem",color:"#4b5563",marginTop:3}}>{mv.source}</div>
            </div>
            <div className="stat-card">
              <div className="stat-val" style={{color:"#60a5fa"}}>{fmt(mv.privateParty)}</div>
              <div className="stat-lbl">Private Party</div>
              <div style={{fontSize:".68rem",color:"#4b5563",marginTop:3}}>Sell to individual</div>
            </div>
            {pp && dep !== null && (
              <div className="stat-card">
                <div className="stat-val" style={{color: dep > 0 ? "#ef4444" : "#22c55e"}}>
                  {dep > 0 ? `-${fmt(dep)}` : `+${fmt(Math.abs(dep))}`}
                </div>
                <div className="stat-lbl">Depreciation</div>
                <div style={{fontSize:".68rem",color:"#4b5563",marginTop:3}}>{depPct}% from purchase</div>
              </div>
            )}
          </div>

          {/* Depreciation bar */}
          {pp && dep !== null && (
            <div style={{background:"#141416",border:"1px solid #222226",borderRadius:10,padding:"16px 18px",marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:".75rem",color:"#9ca3af",marginBottom:8}}>
                <span>Trade-In {fmt(mv.tradeIn)}</span>
                <span>Purchase {fmt(pp)}</span>
              </div>
              <div style={{background:"#222226",borderRadius:99,height:8,overflow:"hidden",position:"relative"}}>
                <div style={{width:`${Math.max(5,Math.round((mv.tradeIn/pp)*100))}%`,height:"100%",background:"#f97316",borderRadius:99}} />
                <div style={{position:"absolute",top:0,left:0,width:`${Math.max(5,Math.round((mv.privateParty/pp)*100))}%`,height:"100%",background:"rgba(96,165,250,0.4)",borderRadius:99}} />
              </div>
              <div style={{display:"flex",gap:16,marginTop:10,flexWrap:"wrap"}}>
                <div style={{display:"flex",alignItems:"center",gap:5,fontSize:".7rem",color:"#9ca3af"}}>
                  <div style={{width:10,height:10,borderRadius:2,background:"#f97316",flexShrink:0}} />Trade-In
                </div>
                <div style={{display:"flex",alignItems:"center",gap:5,fontSize:".7rem",color:"#9ca3af"}}>
                  <div style={{width:10,height:10,borderRadius:2,background:"rgba(96,165,250,0.6)",flexShrink:0}} />Private Party
                </div>
              </div>
            </div>
          )}
          <div style={{fontSize:".7rem",color:"#4b5563",marginTop:6}}>
            {mv.source} · "Good" condition estimate · <a href="https://www.kbb.com" target="_blank" rel="noopener noreferrer" style={{color:"#f97316"}}>Get precise quote →</a>
          </div>
        </>
      )}

      {!mv && !editValues && (
        <div style={{color:"#4b5563",fontSize:".86rem",padding:"8px 0"}}>No market values on file yet.</div>
      )}
    </>
  );
}



// ── Editable log item (Feature 4) ────────────────────────────────────────────
function EditableLogItem({ entry, color, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    serviceLabel: entry.serviceLabel,
    date:         entry.date,
    miles:        entry.miles.toString(),
    cost:         entry.cost != null ? entry.cost.toString() : "",
    notes:        entry.notes || "",
    category:     entry.category || autoCategory(entry.serviceLabel),
    performedBy:  entry.performedBy || "",
    location:     entry.location || "",
  });

  if (!editing) {
    const cat = entry.category || autoCategory(entry.serviceLabel);
    const c   = CAT_LABELS[cat] || CAT_LABELS.repair;
    return (
      <div className="log-item" style={{borderLeftColor:c.color}}>
        <div style={{flex:1}}>
          <div className="log-lbl"><CostBadge category={cat} />{entry.serviceLabel}</div>
          <div className="log-meta">{entry.date} · {entry.miles.toLocaleString()} mi{entry.performedBy?` · ${entry.performedBy}`:""}{entry.location?` · ${entry.location}`:""}{entry.notes?` · ${entry.notes}`:""}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          <div className="log-cost">{fmt$(entry.cost)}</div>
          <button className="btn btn-g btn-sm" style={{fontSize:".66rem",padding:"2px 7px"}} onClick={()=>setEditing(true)}>✏️</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{background:"#1a1a1f",border:"1px solid #f97316",borderRadius:10,padding:"13px 14px",marginBottom:8}}>
      <div className="field-row" style={{marginBottom:8}}>
        <div className="field" style={{margin:0,flex:2}}>
          <label>Service</label>
          <input value={form.serviceLabel} onChange={e=>setForm({...form,serviceLabel:e.target.value,category:autoCategory(e.target.value)})} />
        </div>
        <div className="field" style={{margin:0,flex:1}}>
          <label>Category</label>
          <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
            {Object.entries(CAT_LABELS).filter(([k])=>k!=="fuel").map(([k,v])=>(
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="field-row" style={{marginBottom:8}}>
        <div className="field" style={{margin:0}}><label>Date</label><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} /></div>
        <div className="field" style={{margin:0}}><label>Odometer</label><input type="number" value={form.miles} onChange={e=>setForm({...form,miles:e.target.value})} /></div>
        <div className="field" style={{margin:0}}><label>Cost ($)</label><input type="number" step="0.01" value={form.cost} onChange={e=>setForm({...form,cost:e.target.value})} /></div>
      </div>
      <div className="field" style={{margin:"0 0 8px"}}>
        <label>Notes</label>
        <input value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} />
      </div>
      <div className="field-row" style={{marginBottom:10}}>
        <div className="field" style={{margin:0}}><label>Performed By</label><input value={form.performedBy} onChange={e=>setForm({...form,performedBy:e.target.value})} placeholder="e.g. John Adams" /></div>
        <div className="field" style={{margin:0}}><label>Location / Shop</label><input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder="e.g. Firestone" /></div>
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <button className="btn btn-d btn-sm" onClick={()=>{if(confirm("Delete this entry?"))onDelete();}}>Delete</button>
        <button className="btn btn-g btn-sm" onClick={()=>setEditing(false)}>Cancel</button>
        <button className="btn btn-p btn-sm" onClick={()=>{
          onSave({
            serviceLabel: form.serviceLabel,
            date:         form.date,
            miles:        parseInt(form.miles),
            cost:         form.cost ? parseFloat(form.cost) : null,
            notes:        form.notes,
            category:     form.category,
            performedBy:  form.performedBy || null,
            location:     form.location || null,
          });
          setEditing(false);
        }}>Save</button>
      </div>
    </div>
  );
}

// ── Custom categories (Feature 5) ────────────────────────────────────────────
// CAT_LABELS is the base set; user can extend via customCategories in data
function buildCatLabels(customCats) {
  const base = {
    consumable:   { label:"Consumable",  color:"#60a5fa", bg:"#0f1f3a" },
    preventative: { label:"Preventive",  color:"#a78bfa", bg:"#1a1030" },
    repair:       { label:"Repair",      color:"#f87171", bg:"#3a1010" },
    fuel:         { label:"Fuel",        color:"#34d399", bg:"#0a2a1e" },
  };
  (customCats||[]).forEach(c => {
    base[c.id] = { label:c.label, color:c.color, bg:c.bg||"#1e1e22" };
  });
  return base;
}

function CategoryManager({ customCats, onSave }) {
  const [open, setOpen] = useState(false);
  const [cats, setCats] = useState(customCats||[]);
  const [form, setForm] = useState({ label:"", color:"#f97316" });

  const PRESET_COLORS = ["#f97316","#60a5fa","#a78bfa","#f87171","#34d399","#fbbf24","#e879f9","#94a3b8"];

  function addCat() {
    if (!form.label) return;
    const id = form.label.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"");
    const hex = form.color;
    // simple bg = color with low opacity approximation
    const bg = hex + "22";
    const newCat = { id, label:form.label, color:hex, bg };
    const updated = [...cats.filter(c=>c.id!==id), newCat];
    setCats(updated);
    onSave(updated);
    setForm({ label:"", color:"#f97316" });
  }

  function removeCat(id) {
    const updated = cats.filter(c=>c.id!==id);
    setCats(updated);
    onSave(updated);
  }

  if (!open) return (
    <button className="btn btn-g btn-sm" style={{marginTop:10,fontSize:".72rem"}} onClick={()=>setOpen(true)}>⚙️ Manage Categories</button>
  );

  return (
    <div style={{background:"#1a1a1f",border:"1px solid #2a2a2e",borderRadius:10,padding:16,marginTop:10}}>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1rem",letterSpacing:".08em",marginBottom:12}}>Categories</div>

      {/* Built-in */}
      <div style={{fontSize:".68rem",color:"#6b7280",marginBottom:6,textTransform:"uppercase",letterSpacing:".08em"}}>Built-in</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
        {Object.entries(CAT_LABELS).filter(([k])=>k!=="fuel").map(([k,v])=>(
          <span key={k} style={{background:v.bg,color:v.color,fontSize:".72rem",fontWeight:600,padding:"3px 10px",borderRadius:99}}>{v.label}</span>
        ))}
      </div>

      {/* Custom */}
      {cats.length>0 && (
        <>
          <div style={{fontSize:".68rem",color:"#6b7280",marginBottom:6,textTransform:"uppercase",letterSpacing:".08em"}}>Custom</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
            {cats.map(c=>(
              <span key={c.id} style={{background:c.bg,color:c.color,fontSize:".72rem",fontWeight:600,padding:"3px 10px",borderRadius:99,display:"flex",alignItems:"center",gap:5}}>
                {c.label}
                <span style={{cursor:"pointer",opacity:.7}} onClick={()=>removeCat(c.id)}>×</span>
              </span>
            ))}
          </div>
        </>
      )}

      {/* Add new */}
      <div style={{display:"flex",gap:8,alignItems:"flex-end",flexWrap:"wrap"}}>
        <div className="field" style={{margin:0,flex:1}}>
          <label>New Category Name</label>
          <input placeholder="e.g. Detailing" value={form.label} onChange={e=>setForm({...form,label:e.target.value})} />
        </div>
        <div className="field" style={{margin:0}}>
          <label>Color</label>
          <div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:4}}>
            {PRESET_COLORS.map(c=>(
              <div key={c} onClick={()=>setForm({...form,color:c})}
                style={{width:20,height:20,borderRadius:4,background:c,cursor:"pointer",border:form.color===c?"2px solid #fff":"2px solid transparent"}} />
            ))}
          </div>
        </div>
        <button className="btn btn-p btn-sm" style={{height:36,alignSelf:"flex-end"}} onClick={addCat}>Add</button>
      </div>
      <button className="btn btn-g btn-sm" style={{marginTop:10}} onClick={()=>setOpen(false)}>Done</button>
    </div>
  );
}



// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ photos, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex||0);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape")     onClose();
      if (e.key === "ArrowRight") setIdx(i => Math.min(i+1, photos.length-1));
      if (e.key === "ArrowLeft")  setIdx(i => Math.max(i-1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [photos.length]);

  if (!photos.length) return null;
  const photo = photos[idx];

  return (
    <div onClick={onClose} style={{
      position:"fixed",inset:0,background:"rgba(0,0,0,.93)",zIndex:9999,
      display:"flex",alignItems:"center",justifyContent:"center",
    }}>
      <button onClick={onClose} style={{
        position:"absolute",top:16,right:20,background:"none",border:"none",
        color:"#e8e6e1",fontSize:"1.8rem",cursor:"pointer",lineHeight:1,zIndex:10000,
      }}>✕</button>
      <div style={{position:"absolute",top:20,left:"50%",transform:"translateX(-50%)",
        color:"#9ca3af",fontSize:".82rem",letterSpacing:".06em"}}>
        {idx+1} / {photos.length}
      </div>
      {idx > 0 && (
        <button onClick={e=>{e.stopPropagation();setIdx(i=>i-1);}} style={{
          position:"absolute",left:16,background:"#ffffff18",border:"1px solid #ffffff22",
          color:"#e8e6e1",fontSize:"1.6rem",width:44,height:44,borderRadius:"50%",
          cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
        }}>‹</button>
      )}
      <img src={photo.url} alt="" onClick={e=>e.stopPropagation()} style={{
        maxWidth:"90vw",maxHeight:"85vh",objectFit:"contain",borderRadius:8,
        boxShadow:"0 8px 40px rgba(0,0,0,.6)",
      }} />
      {idx < photos.length-1 && (
        <button onClick={e=>{e.stopPropagation();setIdx(i=>i+1);}} style={{
          position:"absolute",right:16,background:"#ffffff18",border:"1px solid #ffffff22",
          color:"#e8e6e1",fontSize:"1.6rem",width:44,height:44,borderRadius:"50%",
          cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
        }}>›</button>
      )}
      {photos.length > 1 && (
        <div style={{position:"absolute",bottom:20,display:"flex",gap:6}}>
          {photos.map((_,i) => (
            <div key={i} onClick={e=>{e.stopPropagation();setIdx(i);}} style={{
              width:i===idx?20:8,height:8,borderRadius:99,cursor:"pointer",transition:"all .2s",
              background:i===idx?"#f97316":"#ffffff44",
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Photo Gallery (Feature 1 + 2) ────────────────────────────────────────────
function PhotoGallery({ assetId, photos, allPhotos, jwt, uid, onPrimaryChange }) {
  if (!assetId) return null;
  const [uploading,  setUploading]  = useState(false);
  const [uploadCount,setUploadCount]= useState({done:0,total:0});
  const [deleting,   setDeleting]   = useState(null);
  const [dragging,   setDragging]   = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const fileRef  = useRef(null);
  const dropRef  = useRef(null);

  const assetPhotos = (allPhotos||[]).filter(p => p.asset_id === assetId)
                               .sort((a,b) => b.is_primary - a.is_primary);

  async function uploadFile(file, isPrimary) {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = async ev => {
        const dataUrl = ev.target.result;
        const mime  = file.type || "image/jpeg";
        const ext   = mime === "image/png" ? "png" : "jpg";
        const path  = `${assetId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const [, b64] = dataUrl.split(",");
        const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
        const res = await fetch(`${SUPABASE_URL}/storage/v1/object/photos/${path}`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${jwt}`, "apikey": SUPABASE_ANON, "Content-Type": mime, "x-upsert": "true" },
          body: bytes,
        });
        if (res.ok) {
          const url = `${SUPABASE_URL}/storage/v1/object/public/photos/${path}`;
          await sbFetch("POST", "photos", { asset_id: assetId, user_id: uid, storage_path: path, url, is_primary: isPrimary }, jwt);
        }
        resolve(res.ok);
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleFiles(files) {
    if (!files || files.length === 0) return;
    const fileArr = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (fileArr.length === 0) return;
    setUploading(true);
    setUploadCount({ done: 0, total: fileArr.length });
    const currentCount = assetPhotos.length;
    for (let i = 0; i < fileArr.length; i++) {
      const isPrimary = currentCount === 0 && i === 0;
      await uploadFile(fileArr[i], isPrimary);
      setUploadCount({ done: i + 1, total: fileArr.length });
    }
    setUploading(false);
    setUploadCount({ done: 0, total: 0 });
    if (fileRef.current) fileRef.current.value = "";
    onPrimaryChange();
  }

  function onFileInput(e) { handleFiles(e.target.files); }

  // Guard: if no jwt, can't upload
  if (!jwt) return (
    <div style={{color:"#4b5563",fontSize:".84rem",padding:"16px 0",textAlign:"center"}}>
      Sign out and back in to enable photo uploads.
    </div>
  );

  function onDragOver(e)  { e.preventDefault(); setDragging(true); }
  function onDragLeave(e) { setDragging(false); }
  function onDrop(e)      { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }

  async function setPrimary(photo) {
    await sbFetch("PATCH", `photos?asset_id=eq.${assetId}`, { is_primary: false }, jwt);
    await sbFetch("PATCH", `photos?id=eq.${photo.id}`, { is_primary: true }, jwt);
    onPrimaryChange();
  }

  async function deletePhoto(photo) {
    if (!confirm("Delete this photo?")) return;
    setDeleting(photo.id);
    await fetch(`${SUPABASE_URL}/storage/v1/object/photos/${photo.storage_path}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${jwt}`, "apikey": SUPABASE_ANON },
    });
    await sbFetch("DELETE", `photos?id=eq.${photo.id}`, null, jwt);
    onPrimaryChange();
    setDeleting(null);
  }

  return (
    <div style={{marginTop:16}}>
      {/* Drop zone */}
      <div ref={dropRef}
        onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
        onClick={()=>fileRef.current?.click()}
        style={{
          border:`2px dashed ${dragging?"#f97316":"#2a2a2e"}`,
          borderRadius:10, padding:"20px 16px", textAlign:"center",
          cursor:"pointer", marginBottom:14, transition:"all .15s",
          background: dragging?"#f9731608":"transparent",
        }}>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={onFileInput} />
        {uploading
          ? <div style={{color:"#f97316",fontSize:".85rem",fontWeight:500}}>
              Uploading {uploadCount.done} of {uploadCount.total}…
              <div style={{background:"#1e1e22",borderRadius:99,height:4,marginTop:8,overflow:"hidden"}}>
                <div style={{height:"100%",background:"#f97316",borderRadius:99,width:`${uploadCount.total?Math.round(uploadCount.done/uploadCount.total*100):0}%`,transition:"width .2s"}} />
              </div>
            </div>
          : <div>
              <div style={{fontSize:"1.4rem",marginBottom:6}}>📸</div>
              <div style={{fontSize:".84rem",fontWeight:500,color:"#e8e6e1"}}>Drop photos here or click to browse</div>
              <div style={{fontSize:".72rem",color:"#6b7280",marginTop:3}}>Select multiple files at once · JPG, PNG supported</div>
            </div>
        }
      </div>

      {/* Photo grid */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
        <div style={{fontSize:".72rem",color:"#6b7280",textTransform:"uppercase",letterSpacing:".07em"}}>
          {assetPhotos.length} {assetPhotos.length===1?"Photo":"Photos"}
        </div>
        {assetPhotos.length>0 && <div style={{fontSize:".68rem",color:"#4b5563"}}>Click a photo to view · use Set Primary to change the cover photo</div>}
      </div>

      {assetPhotos.length === 0
        ? <div style={{color:"#4b5563",fontSize:".8rem",padding:"4px 0"}}>No photos yet.</div>
        : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:8}}>
            {assetPhotos.map(p => (
              <div key={p.id}
                style={{position:"relative",borderRadius:8,overflow:"hidden",
                  border:p.is_primary?"2px solid #f97316":"2px solid #222226",
                  cursor:"pointer",transition:"border-color .15s"}}
                onClick={()=>setLightboxIdx(assetPhotos.indexOf(p))}>
                <img src={p.url} alt=""
                  style={{width:"100%",height:90,objectFit:"contain",background:"#1a1a1e",display:"block",padding:4}} />
                <div style={{position:"absolute",top:4,right:4,display:"flex",gap:3}}>
                  {p.is_primary && <span style={{background:"#f97316",color:"#fff",fontSize:".55rem",fontWeight:700,padding:"2px 5px",borderRadius:4,letterSpacing:".04em"}}>PRIMARY</span>}
                  <span style={{background:"#000a",color:"#f87171",fontSize:".7rem",padding:"2px 6px",borderRadius:4,cursor:"pointer",lineHeight:1.4}}
                    onClick={e=>{e.stopPropagation();deletePhoto(p);}}>
                    {deleting===p.id ? "…" : "✕"}
                  </span>
                </div>
                {!p.is_primary && (
                  <div style={{position:"absolute",bottom:0,left:0,right:0,background:"#0009",color:"#d1d5db",fontSize:".62rem",fontWeight:500,textAlign:"center",padding:"4px 0",cursor:"pointer"}}
                    onClick={e=>{e.stopPropagation();setPrimary(p);}}>
                    Set Primary
                  </div>
                )}
              </div>
            ))}
          </div>
      }
      {lightboxIdx !== null && (
        <Lightbox
          photos={assetPhotos}
          startIndex={lightboxIdx}
          onClose={()=>setLightboxIdx(null)}
        />
      )}
    </div>
  );
}




// ── Add Bike Form ─────────────────────────────────────────────────────────────
function AddBikeForm({ onAdd, onCancel }) {
  const [form, setForm] = useState({ name:"", subtype:"road", make:"", model:"", currentMiles:"0", purchaseYear:"", weight:"" });
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!form.name) return;
    setBusy(true);
    await onAdd(form);
    setBusy(false);
  }

  return (
    <div className="add-form">
      <div className="sec">Add Bike</div>
      <div className="field-row">
        <div className="field"><label>Name</label><input placeholder="e.g. Cervelo S3" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} autoFocus /></div>
        <div className="field"><label>Type</label>
          <select value={form.subtype} onChange={e=>setForm({...form,subtype:e.target.value})}>
            {Object.entries(BIKE_CATS).map(([k,v])=>(<option key={k} value={k}>{v.icon} {v.label}</option>))}
          </select>
        </div>
      </div>
      <div className="field-row">
        <div className="field"><label>Make</label><input placeholder="e.g. Cervelo" value={form.make} onChange={e=>setForm({...form,make:e.target.value})} /></div>
        <div className="field"><label>Model</label><input placeholder="e.g. S3d Ultegra" value={form.model} onChange={e=>setForm({...form,model:e.target.value})} /></div>
      </div>
      <div className="field-row">
        <div className="field"><label>Current Miles</label><input type="number" value={form.currentMiles} onChange={e=>setForm({...form,currentMiles:e.target.value})} /></div>
        <div className="field"><label>Purchase Year</label><input type="number" placeholder="2023" value={form.purchaseYear} onChange={e=>setForm({...form,purchaseYear:e.target.value})} /></div>
        <div className="field"><label>Weight (optional)</label><input placeholder="e.g. 18.0 lbs" value={form.weight} onChange={e=>setForm({...form,weight:e.target.value})} /></div>
      </div>
      <div className="btn-row">
        <button className="btn btn-g" onClick={onCancel}>Cancel</button>
        <button className="btn btn-p" onClick={submit} disabled={busy}>{busy?"Adding…":"Add Bike"}</button>
      </div>
    </div>
  );
}

// ── Add Home Asset Form ───────────────────────────────────────────────────────
function AddHomeAssetForm({ onAdd }) {
  const [open, setOpen]   = useState(false);
  const [form, setForm]   = useState({ name:"", subtype:"appliance", make:"", model:"", modelNumber:"", serialNumber:"", purchaseDate:"", warrantyExpires:"" });
  const [busy, setBusy]   = useState(false);

  async function submit() {
    if (!form.name) return;
    setBusy(true);
    await onAdd(form);
    setForm({ name:"", subtype:"appliance", make:"", model:"", modelNumber:"", serialNumber:"", purchaseDate:"", warrantyExpires:"" });
    setOpen(false);
    setBusy(false);
  }

  if (!open) return (
    <button className="btn btn-g btn-sm" style={{marginTop:4}} onClick={()=>setOpen(true)}>+ Add Home Asset</button>
  );

  return (
    <div className="add-home-form">
      <div className="add-home-title">New Home Asset</div>
      <div className="field-row">
        <div className="field" style={{flex:2}}>
          <label>Asset Name</label>
          <input placeholder="e.g. Furnace, Dishwasher" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} autoFocus />
        </div>
        <div className="field">
          <label>Category</label>
          <select value={form.subtype} onChange={e=>setForm({...form,subtype:e.target.value})}>
            {Object.entries(HOME_ASSET_CATS).map(([k,v])=>(
              <option key={k} value={k}>{v.icon} {v.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="field-row">
        <div className="field"><label>Make</label><input placeholder="e.g. Carrier, Whirlpool" value={form.make} onChange={e=>setForm({...form,make:e.target.value})} /></div>
        <div className="field"><label>Model</label><input placeholder="e.g. WTW5000DW" value={form.model} onChange={e=>setForm({...form,model:e.target.value})} /></div>
      </div>
      <div className="field-row">
        <div className="field"><label>Model Number</label><input value={form.modelNumber} onChange={e=>setForm({...form,modelNumber:e.target.value})} /></div>
        <div className="field"><label>Serial Number</label><input value={form.serialNumber} onChange={e=>setForm({...form,serialNumber:e.target.value})} /></div>
      </div>
      <div className="field-row">
        <div className="field"><label>Purchase Date</label><input type="date" value={form.purchaseDate} onChange={e=>setForm({...form,purchaseDate:e.target.value})} /></div>
        <div className="field"><label>Warranty Expires</label><input type="date" value={form.warrantyExpires} onChange={e=>setForm({...form,warrantyExpires:e.target.value})} /></div>
      </div>
      <div style={{display:"flex",gap:8,marginTop:8}}>
        <button className="btn btn-p btn-sm" onClick={submit} disabled={busy}>{busy?"Adding…":"Add Asset"}</button>
        <button className="btn btn-g btn-sm" onClick={()=>setOpen(false)}>Cancel</button>
      </div>
    </div>
  );
}

// ── Home Asset Detail ─────────────────────────────────────────────────────────
function HomeAssetDetail({ asset, schedules, logs, allPhotos, jwt, uid, onLog, onAddSchedule, onUpdateSchedule, onDeleteSchedule, onEditLog, onDeleteLog, onUpdateAsset, onRefreshPhotos, onRetire, onRestore, onBack }) {
  const [tab,      setTab]      = useState("schedule");
  const [showLog,  setShowLog]  = useState(null);
  const [logForm,  setLogForm]  = useState({ date: new Date().toISOString().split("T")[0], cost:"", performedBy:"", location:"", notes:"" });
  const [showSched,setShowSched]= useState(false);
  const [schedForm,setSchedForm]= useState({ label:"", intervalDays:"90", anchorMonth:"", anchorDay:"" });
  const [editing,  setEditing]  = useState(false);
  const [editForm, setEditForm] = useState({
    make: asset.make||"", model: asset.model||"",
    modelNumber: asset.model_number||"", serialNumber: asset.serial_number||"",
    purchaseDate: asset.purchase_date||"", warrantyExpires: asset.warranty_expires||"",
    notes: asset.notes||"",
  });

  const cat      = HOME_ASSET_CATS[asset.subtype] || HOME_ASSET_CATS.general;
  const assetLogs = logs.filter(l => l.asset_id === asset.id).sort((a,b) => b.date?.localeCompare(a.date||""));
  const totalCost = assetLogs.reduce((s,l) => s+(Number(l.cost)||0), 0);

  // Schedule with pct calculation using interval_days
  function schedPct(sched) {
    if (!sched.interval_days) return 0;
    const lastDone = sched.last_done;
    if (!lastDone) return 50; // unknown — show half
    const daysSince = Math.floor((Date.now() - new Date(lastDone+"T00:00:00").getTime()) / 86400000);
    return Math.min(100, Math.round((daysSince / sched.interval_days) * 100));
  }
  function schedLeft(sched) {
    if (!sched.interval_days) return null;
    if (!sched.last_done) return sched.interval_days;
    const daysSince = Math.floor((Date.now() - new Date(sched.last_done+"T00:00:00").getTime()) / 86400000);
    return Math.max(0, sched.interval_days - daysSince);
  }
  function schedDue(sched) {
    const left = schedLeft(sched);
    if (left === null) return "—";
    if (left === 0) return "Overdue";
    if (left <= 7)  return `${left}d`;
    if (left <= 60) return `${left}d`;
    return `${Math.round(left/30)}mo`;
  }

  function submitLog() {
    if (!logForm.date) return;
    onLog(asset.id, { ...logForm, serviceLabel: showLog, scheduleId: schedules.find(s=>s.label===showLog)?.id });
    setLogForm({ date: new Date().toISOString().split("T")[0], cost:"", performedBy:"", location:"", notes:"" });
    setShowLog(null);
  }

  function submitSched() {
    if (!schedForm.label) return;
    onAddSchedule(asset.id, schedForm.label, parseInt(schedForm.intervalDays)||90, schedForm.anchorMonth?parseInt(schedForm.anchorMonth):null, schedForm.anchorDay?parseInt(schedForm.anchorDay):null);
    setSchedForm({ label:"", intervalDays:"90", anchorMonth:"", anchorDay:"" });
    setShowSched(false);
  }

  return (
    <>
      {/* Header */}
      <div className="det-hdr">
        <div style={{width:52,height:52,borderRadius:10,background:cat.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.6rem",flexShrink:0}}>
          {(allPhotos||[]).filter(p=>p.asset_id===asset.id&&p.is_primary)[0]
            ? <img src={(allPhotos||[]).filter(p=>p.asset_id===asset.id&&p.is_primary)[0]?.url||''} style={{width:52,height:52,objectFit:"cover",borderRadius:10}} />
            : <span>{cat.icon}</span>
          }
        </div>
        <div className="det-info">
          <div className="det-title" style={{color:cat.color}}>{asset.name}</div>
          <div className="det-sub" style={{marginTop:3}}>
            <span style={{background:cat.color+"22",color:cat.color,fontSize:".7rem",fontWeight:600,padding:"2px 8px",borderRadius:99}}>{cat.label}</span>
            {asset.make && <span style={{marginLeft:8,color:"#6b7280",fontSize:".75rem"}}>{asset.make}{asset.model?` · ${asset.model}`:""}</span>}
          </div>
          {(asset.serial_number||asset.model_number) && (
            <div style={{fontSize:".72rem",color:"#4b5563",marginTop:4}}>
              {asset.model_number && <span>Model: {asset.model_number}</span>}
              {asset.serial_number && <span style={{marginLeft:8}}>S/N: {asset.serial_number}</span>}
            </div>
          )}
          <div style={{display:"flex",gap:16,marginTop:8,flexWrap:"wrap"}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:".9rem",fontWeight:600}}>{schedules.length}</div>
              <div style={{fontSize:".62rem",color:"#6b7280",textTransform:"uppercase",letterSpacing:".06em"}}>Service Items</div>
            </div>
            {totalCost>0 && <div style={{textAlign:"center"}}>
              <div style={{fontSize:".9rem",fontWeight:600,color:"#34d399"}}>${totalCost.toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:0})}</div>
              <div style={{fontSize:".62rem",color:"#6b7280",textTransform:"uppercase",letterSpacing:".06em"}}>Total Spent</div>
            </div>}
            {asset.warranty_expires && <div style={{textAlign:"center"}}>
              <div style={{fontSize:".9rem",fontWeight:600,color:new Date(asset.warranty_expires)<new Date()?"#f87171":"#a78bfa"}}>{asset.warranty_expires}</div>
              <div style={{fontSize:".62rem",color:"#6b7280",textTransform:"uppercase",letterSpacing:".06em"}}>Warranty</div>
            </div>}
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}>
          {(asset.status||"active")==="active"
            ? <RetireModal type="home_asset" asset={asset} onRetire={(sd,sp)=>onRetire&&onRetire(sd,sp)} />
            : <button className="btn btn-g btn-sm" onClick={()=>onRestore&&onRestore()}>↩ Restore</button>
          }
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {[{k:"schedule",l:"📋 Schedule"},{k:"history",l:`📜 History (${assetLogs.length})`},{k:"info",l:"ℹ️ Info"},{k:"gallery",l:"📸 Photos"}].map(t=>(
          <button key={t.k} className={`tab${tab===t.k?" on":""}`} onClick={()=>setTab(t.k)}>{t.l}</button>
        ))}
      </div>

      {/* SCHEDULE */}
      {tab==="schedule" && (
        <>
          <div className="svc-list">
            {schedules.length===0
              ? <div style={{color:"#4b5563",fontSize:".86rem",padding:"12px 0"}}>No service items yet. Add one below.</div>
              : schedules.map(sched => {
                  const pct = schedPct(sched);
                  const col = statusColor(pct);
                  const due = schedDue(sched);
                  return (
                    <HomeAssetScheduleRow
                      key={sched.id}
                      sched={sched}
                      pct={pct}
                      col={col}
                      due={due}
                      onLog={()=>setShowLog(sched.label)}
                      onSave={updates=>onUpdateSchedule&&onUpdateSchedule(sched.id, { label: updates.label, interval_days: updates.intervalDays })}
                      onDelete={()=>onDeleteSchedule&&onDeleteSchedule(sched.id)}
                    />
                  );
                })
            }
          </div>
          {!showSched
            ? <button className="btn btn-g btn-sm" style={{marginTop:12}} onClick={()=>setShowSched(true)}>+ Add Service Item</button>
            : <div className="add-home-form" style={{marginTop:12}}>
                <div className="add-home-title">New Service Item</div>
                <div className="field-row">
                  <div className="field"><label>Service Label</label><input placeholder="e.g. Filter Replacement" value={schedForm.label} onChange={e=>setSchedForm({...schedForm,label:e.target.value})} autoFocus /></div>
                  <div className="field"><label>Every (days)</label><input type="number" value={schedForm.intervalDays} onChange={e=>setSchedForm({...schedForm,intervalDays:e.target.value})} /></div>
                </div>
                <div className="field-row">
                  <div className="field"><label>Anchor Month (optional)</label><input type="number" placeholder="1-12" value={schedForm.anchorMonth} onChange={e=>setSchedForm({...schedForm,anchorMonth:e.target.value})} /></div>
                  <div className="field"><label>Anchor Day</label><input type="number" placeholder="1-31" value={schedForm.anchorDay} onChange={e=>setSchedForm({...schedForm,anchorDay:e.target.value})} /></div>
                </div>
                <div style={{display:"flex",gap:8,marginTop:6}}>
                  <button className="btn btn-p btn-sm" onClick={submitSched}>Add</button>
                  <button className="btn btn-g btn-sm" onClick={()=>setShowSched(false)}>Cancel</button>
                </div>
              </div>
          }
        </>
      )}

      {/* HISTORY */}
      {tab==="history" && (
        <>
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
            <button className="btn btn-p btn-sm" onClick={()=>setShowLog("General Service")}>+ Log Service</button>
          </div>
          {assetLogs.length===0
            ? <div style={{color:"#4b5563",fontSize:".86rem",padding:"12px 0"}}>No history yet.</div>
            : assetLogs.map(e => (
                <EditableAssetLogItem
                  key={e.id}
                  entry={e}
                  onSave={updates=>onEditLog&&onEditLog(e.id, updates)}
                  onDelete={()=>onDeleteLog&&onDeleteLog(e.id)}
                />
              ))
          }
        </>
      )}

      {/* INFO */}
      {tab==="info" && (
        <>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:4}}>
            {[
              ["Make",            asset.make],
              ["Model",           asset.model],
              ["Model Number",    asset.model_number],
              ["Serial Number",   asset.serial_number],
              ["Purchase Date",   asset.purchase_date],
              ["Warranty Expires",asset.warranty_expires],
              ["Notes",           asset.notes],
            ].filter(([,v])=>v).map(([label,val])=>(
              <div key={label} style={{display:"flex",gap:12,fontSize:".84rem"}}>
                <div style={{color:"#6b7280",width:130,flexShrink:0}}>{label}</div>
                <div style={{color:"#e8e6e1"}}>{val}</div>
              </div>
            ))}
            {![asset.make,asset.model,asset.model_number,asset.serial_number].some(Boolean) && (
              <div style={{color:"#4b5563",fontSize:".84rem"}}>No info recorded. Click ✏️ Edit to add details.</div>
            )}
          </div>
          {editing && (
            <EditAssetModal
              asset={asset}
              type="home_asset"
              onSave={updates=>onUpdateAsset(asset.id, updates)}
              onClose={()=>setEditing(false)}
            />
          )}
        </>
      )}

      {/* GALLERY */}
      {tab==="gallery" && (
        <PhotoGallery
          assetId={asset.id}
          photos={{}}
          allPhotos={allPhotos||[]}
          jwt={jwt||""}
          uid={uid||""}
          onPrimaryChange={onRefreshPhotos||(() => {})}
        />
      )}

      {/* LOG MODAL */}
      {showLog && (
        <div className="overlay" onClick={()=>setShowLog(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">Log Service</div>
            <div style={{fontSize:".84rem",color:"#9ca3af",marginBottom:14}}>{showLog} — {asset.name}</div>
            <div className="field-row">
              <div className="field"><label>Date</label><input type="date" value={logForm.date} onChange={e=>setLogForm({...logForm,date:e.target.value})} /></div>
              <div className="field"><label>Cost ($)</label><input type="number" step="0.01" placeholder="0.00" value={logForm.cost} onChange={e=>setLogForm({...logForm,cost:e.target.value})} /></div>
            </div>
            <div className="field-row">
              <div className="field"><label>Performed By</label><input placeholder="e.g. HVAC Tech" value={logForm.performedBy} onChange={e=>setLogForm({...logForm,performedBy:e.target.value})} /></div>
              <div className="field"><label>Location / Shop</label><input placeholder="e.g. Home, Service Co." value={logForm.location} onChange={e=>setLogForm({...logForm,location:e.target.value})} /></div>
            </div>
            <div className="field"><label>Notes</label><input placeholder="Details, brand, observations…" value={logForm.notes} onChange={e=>setLogForm({...logForm,notes:e.target.value})} /></div>
            <div className="modal-btns">
              <button className="btn btn-g" onClick={()=>setShowLog(null)}>Cancel</button>
              <button className="btn btn-p" onClick={submitLog}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


// ── Edit Asset Modal ──────────────────────────────────────────────────────────
function EditAssetModal({ asset, type, onSave, onClose }) {
  const isVehicle   = type === "vehicle";
  const isBike      = type === "bike";
  const isHomeAsset = type === "home_asset";

  const [form, setForm] = useState({
    // Common
    name:           asset.name || "",
    make:           asset.make || "",
    // Vehicle specific
    year:           asset.year?.toString() || "",
    odometer:       asset.odometer?.toString() || "",
    vin:            asset.vin || "",
    purchaseDate:   asset.purchaseDate || asset.purchase_date || "",
    purchasePrice:  asset.purchasePrice?.toString() || asset.purchase_price?.toString() || "",
    // Bike specific
    model:          asset.model || "",
    subtype:        asset.subtype || asset.type || "road",
    currentMiles:   asset.currentMiles?.toString() || asset.current_miles?.toString() || "0",
    purchaseYear:   asset.purchaseYear || asset.purchase_year || "",
    weight:         asset.weight || "",
    // Home asset specific
    modelNumber:    asset.model_number || "",
    serialNumber:   asset.serial_number || "",
    warrantyExpires:asset.warranty_expires || "",
  });

  function save() {
    const updates = {};
    if (isVehicle) {
      updates.name           = form.name;
      updates.make           = form.make || null;
      updates.year           = form.year ? parseInt(form.year) : null;
      updates.odometer       = form.odometer ? parseInt(form.odometer) : null;
      updates.vin            = form.vin || null;
      updates.purchase_date  = form.purchaseDate || null;
      updates.purchase_price = form.purchasePrice ? parseFloat(form.purchasePrice) : null;
    } else if (isBike) {
      updates.name          = form.name;
      updates.make          = form.make || null;
      updates.model         = form.model || null;
      updates.subtype       = form.subtype;
      updates.current_miles = form.currentMiles ? parseInt(form.currentMiles) : 0;
      updates.purchase_year = form.purchaseYear || null;
      updates.weight        = form.weight || null;
    } else if (isHomeAsset) {
      updates.name             = form.name;
      updates.make             = form.make || null;
      updates.model            = form.model || null;
      updates.subtype          = form.subtype;
      updates.model_number     = form.modelNumber || null;
      updates.serial_number    = form.serialNumber || null;
      updates.purchase_date    = form.purchaseDate || null;
      updates.warranty_expires = form.warrantyExpires || null;
    }
    onSave(updates);
    onClose();
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth:520}} onClick={e=>e.stopPropagation()}>
        <div className="modal-title">Edit {isVehicle?"Vehicle":isBike?"Bike":"Asset"}</div>

        {/* Common fields */}
        <div className="field-row">
          <div className="field" style={{flex:2}}>
            <label>{isVehicle?"Nickname":isBike?"Bike Name":"Asset Name"}</label>
            <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} autoFocus />
          </div>
          <div className="field">
            <label>Make / Brand</label>
            <input value={form.make} onChange={e=>setForm({...form,make:e.target.value})} placeholder={isVehicle?"e.g. BMW":isBike?"e.g. Cervelo":"e.g. Carrier"} />
          </div>
        </div>

        {/* Vehicle fields */}
        {isVehicle && (
          <>
            <div className="field-row">
              <div className="field"><label>Year</label><input type="number" value={form.year} onChange={e=>setForm({...form,year:e.target.value})} /></div>
              <div className="field"><label>Odometer (mi)</label><input type="number" value={form.odometer} onChange={e=>setForm({...form,odometer:e.target.value})} /></div>
              <div className="field"><label>VIN</label><input value={form.vin} onChange={e=>setForm({...form,vin:e.target.value})} placeholder="17 characters" /></div>
            </div>
            <div className="field-row">
              <div className="field"><label>Purchase Date</label><input type="date" value={form.purchaseDate} onChange={e=>setForm({...form,purchaseDate:e.target.value})} /></div>
              <div className="field"><label>Purchase Price ($)</label><input type="number" value={form.purchasePrice} onChange={e=>setForm({...form,purchasePrice:e.target.value})} /></div>
            </div>
          </>
        )}

        {/* Bike fields */}
        {isBike && (
          <>
            <div className="field-row">
              <div className="field"><label>Model</label><input value={form.model} onChange={e=>setForm({...form,model:e.target.value})} placeholder="e.g. S3d Ultegra 8020" /></div>
              <div className="field">
                <label>Type</label>
                <select value={form.subtype} onChange={e=>setForm({...form,subtype:e.target.value})}>
                  {Object.entries(BIKE_CATS).map(([k,v])=>(<option key={k} value={k}>{v.icon} {v.label}</option>))}
                </select>
              </div>
            </div>
            <div className="field-row">
              <div className="field"><label>Current Miles</label><input type="number" value={form.currentMiles} onChange={e=>setForm({...form,currentMiles:e.target.value})} /></div>
              <div className="field"><label>Purchase Year</label><input type="number" value={form.purchaseYear} onChange={e=>setForm({...form,purchaseYear:e.target.value})} placeholder="2023" /></div>
              <div className="field"><label>Weight</label><input value={form.weight} onChange={e=>setForm({...form,weight:e.target.value})} placeholder="e.g. 17.0 lbs" /></div>
            </div>
          </>
        )}

        {/* Home asset fields */}
        {isHomeAsset && (
          <>
            <div className="field-row">
              <div className="field"><label>Model</label><input value={form.model} onChange={e=>setForm({...form,model:e.target.value})} placeholder="e.g. WTW5000DW" /></div>
              <div className="field">
                <label>Category</label>
                <select value={form.subtype} onChange={e=>setForm({...form,subtype:e.target.value})}>
                  {Object.entries(HOME_ASSET_CATS).map(([k,v])=>(<option key={k} value={k}>{v.icon} {v.label}</option>))}
                </select>
              </div>
            </div>
            <div className="field-row">
              <div className="field"><label>Model Number</label><input value={form.modelNumber} onChange={e=>setForm({...form,modelNumber:e.target.value})} /></div>
              <div className="field"><label>Serial Number</label><input value={form.serialNumber} onChange={e=>setForm({...form,serialNumber:e.target.value})} /></div>
            </div>
            <div className="field-row">
              <div className="field"><label>Purchase Date</label><input type="date" value={form.purchaseDate} onChange={e=>setForm({...form,purchaseDate:e.target.value})} /></div>
              <div className="field"><label>Warranty Expires</label><input type="date" value={form.warrantyExpires} onChange={e=>setForm({...form,warrantyExpires:e.target.value})} /></div>
            </div>
          </>
        )}

        <div className="modal-btns">
          <button className="btn btn-g" onClick={onClose}>Cancel</button>
          <button className="btn btn-p" onClick={save}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

// ── Retire Modal ──────────────────────────────────────────────────────────────
function RetireModal({ type, asset, onRetire }) {
  const [open, setOpen]           = useState(false);
  const [soldDate, setSoldDate]   = useState(new Date().toISOString().split("T")[0]);
  const [soldPrice, setSoldPrice] = useState("");

  if (!open) return (
    <button className="btn btn-g btn-sm" style={{color:"#f59e0b",borderColor:"#3f2e0a"}}
      onClick={()=>setOpen(true)}>
      🔒 Retire
    </button>
  );

  return (
    <div className="overlay" onClick={()=>setOpen(false)}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">Retire {type==="vehicle"?"Vehicle":type==="bike"?"Bike":"Asset"}</div>
        <div style={{fontSize:".84rem",color:"#9ca3af",marginBottom:16}}>
          {asset.name || asset.model} will be marked as retired and hidden from the active dashboard.
        </div>
        <div className="field-row">
          <div className="field"><label>Sold / Retired Date</label>
            <input type="date" value={soldDate} onChange={e=>setSoldDate(e.target.value)} />
          </div>
          <div className="field"><label>Sale Price (optional)</label>
            <input type="number" placeholder="0.00" value={soldPrice} onChange={e=>setSoldPrice(e.target.value)} />
          </div>
        </div>
        <div className="modal-btns">
          <button className="btn btn-g" onClick={()=>setOpen(false)}>Cancel</button>
          <button className="btn btn-p" style={{background:"#f59e0b"}} onClick={()=>{
            onRetire(soldDate, soldPrice?parseFloat(soldPrice):null);
            setOpen(false);
          }}>Confirm Retire</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  // ── Auth state ──────────────────────────────────────────────────────────────
  const [session,  setSession]  = useState(() => loadSession());
  const [authView, setAuthView] = useState("signin"); // signin | signup
  const [authForm, setAuthForm] = useState({ email:"", password:"", name:"" });
  const [authErr,  setAuthErr]  = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [resetMode, setResetMode] = useState(() => {
    // Detect if this is a password recovery redirect from Supabase
    const hash = window.location.hash;
    return hash.includes("type=recovery") || hash.includes("type=signup");
  });
  const [newPassword, setNewPassword] = useState("");
  const [resetDone,   setResetDone]   = useState(false);

  // ── App data state ──────────────────────────────────────────────────────────
  const [loading,  setLoading]  = useState(false);
  const [assets,   setAssets]   = useState([]);
  const [svcLogs,  setSvcLogs]  = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [bikeLogs, setBikeLogs] = useState([]);
  const [bikeComps,setBikeComps]= useState([]);
  const [homeItems,setHomeItems]= useState([]);
  const [homeLogs, setHomeLogs] = useState([]);
  const [photos,   setPhotos]   = useState({});
  const [cats,     setCats]     = useState([]);
  const [rideAssignments, setRideAssignments] = useState([]);
  const [schedules, setSchedules] = useState([]);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [view,        setView]        = useState("dashboard");
  const [selId,       setSelId]       = useState(null);
  const [selBikeId,   setSelBikeId]   = useState(null);
  const [homePropId,  setHomePropId]  = useState(null);
  const [showRetired,    setShowRetired]    = useState(false);
  const [selHomeAssetId,  setSelHomeAssetId]  = useState(null);
  const [showRetiredBikes,setShowRetiredBikes] = useState(false);
  const [editingAsset, setEditingAsset]    = useState(null);
  const [tab,         setTab]         = useState("schedule");
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [allPhotos,   setAllPhotos]   = useState([]);
  const [stravaRides, setStravaRides] = useState([]);
  const [stravaEbike, setStravaEbike] = useState([]);
  const [stravaLoading, setStravaLoading] = useState(false);

  // Add vehicle form
  const [addForm,  setAddForm]  = useState({ name:"", make:"Jeep Gladiator", year:"", odometer:"", vin:"", purchasePrice:"", purchaseDate:"" });
  // Log service form
  const [logForm,  setLogForm]  = useState({ serviceLabel:"", miles:"", date:"", notes:"", cost:"", category:"", performedBy:"", location:"" });
  const [showLog,  setShowLog]  = useState(null);
  // Custom schedule item
  const [custom,   setCustom]   = useState({ label:"", interval:"" });
  // Odometer edit
  const [odoEdit,  setOdoEdit]  = useState("");
  // Fuel form
  const [fuelForm, setFuelForm] = useState({ date:"", miles:"", gallons:"", pricePerGallon:"", cost:"" });

  const jwt = session?.access_token;
  const uid = session?.user?.id;

  // ── Derived helpers ─────────────────────────────────────────────────────────
  const CAT_LABELS = buildCatLabels(cats);
  const vehicles   = assets.filter(a => a.type === "vehicle");
  const bikes      = assets.filter(a => a.type === "bike");
  const properties = assets.filter(a => a.type === "property");

  // Photo lookup: asset_id → primary URL
  const photosMap = {};
  [...Object.entries(photos)].forEach(([k,v]) => { photosMap[k] = v; });

  // Group svcLogs by asset_id
  const logsByAsset = {};
  svcLogs.forEach(e => { if (!logsByAsset[e.asset_id]) logsByAsset[e.asset_id] = []; logsByAsset[e.asset_id].push(e); });

  // Group fuelLogs by asset_id
  const fuelByAsset = {};
  fuelLogs.forEach(f => { if (!fuelByAsset[f.asset_id]) fuelByAsset[f.asset_id] = []; fuelByAsset[f.asset_id].push(f); });

  // Group bikeLogs by asset_id-maint_item key
  const bikeLogMap = {};
  bikeLogs.forEach(e => {
    const key = `${e.asset_id}-${e.maint_item}`;
    if (!bikeLogMap[key]) bikeLogMap[key] = [];
    bikeLogMap[key].push(e);
  });

  // Group bikeComps by asset_id
  const bikeCompsByAsset = {};
  bikeComps.forEach(c => { if (!bikeCompsByAsset[c.asset_id]) bikeCompsByAsset[c.asset_id] = []; bikeCompsByAsset[c.asset_id].push(c); });

  // Group homeItems by asset_id
  const homeItemsByAsset = {};
  homeItems.forEach(i => { if (!homeItemsByAsset[i.asset_id]) homeItemsByAsset[i.asset_id] = []; homeItemsByAsset[i.asset_id].push(i); });

  // Group homeLogs by item_id
  const homeLogsByItem = {};
  homeLogs.forEach(l => { if (!homeLogsByItem[l.item_id]) homeLogsByItem[l.item_id] = []; homeLogsByItem[l.item_id].push(l); });

  // Home assets grouped by parent property id
  const homeAssetsByParent = {};
  assets.filter(a => a.type === "home_asset").forEach(a => {
    if (!homeAssetsByParent[a.parent_id]) homeAssetsByParent[a.parent_id] = [];
    homeAssetsByParent[a.parent_id].push(a);
  });

  // Schedules by asset_id
  const schedByAsset = {};
  schedules.forEach(s => { if (!schedByAsset[s.asset_id]) schedByAsset[s.asset_id] = []; schedByAsset[s.asset_id].push(s); });

  // Ride assignments map: ride_key → asset_id
  const rideMap = {};
  (Array.isArray(rideAssignments) ? rideAssignments : []).forEach(r => { rideMap[r.ride_key] = r.asset_id; });
  // Build lookup: asset_id → array of ride keys
  const ridesByAsset = {};
  Object.entries(rideMap).forEach(([key, assetId]) => {
    if (!ridesByAsset[assetId]) ridesByAsset[assetId] = [];
    ridesByAsset[assetId].push(key);
  });

  // ── Load all data from Supabase ─────────────────────────────────────────────
  async function refreshSession() {
    const s = loadSession();
    if (!s?.refresh_token) return null;
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON },
        body: JSON.stringify({ refresh_token: s.refresh_token }),
      });
      const data = await res.json();
      if (data.access_token) {
        const newSession = { ...s, access_token: data.access_token, refresh_token: data.refresh_token || s.refresh_token, user: data.user || s.user };
        saveSession(newSession);
        setSession(newSession);
        return data.access_token;
      }
    } catch(e) { console.error("Token refresh failed:", e); }
    return null;
  }

  async function loadAll() {
    if (!jwt) return;
    setLoading(true);
    try {
      const [
        assetsRes, svcRes, fuelRes, bikeLogRes, bikeCompRes,
        homeItemRes, homeLogRes, photosRes, catsRes, ridesRes, schedRes,
      ] = await Promise.all([
        sbQ("assets?order=created_at", jwt),
        sbQ("service_logs?order=date.desc", jwt),
        sbQ("fuel_logs?order=date.desc", jwt),
        sbQ("bike_logs?order=date.desc", jwt),
        sbQ("bike_components?order=date.desc", jwt),
        sbQ("home_items?order=label", jwt),
        sbQ("home_logs?order=date.desc", jwt),
        sbQ("photos?order=created_at", jwt),
        sbQ("categories?order=label", jwt),
        sbQ("ride_assignments", jwt),
        sbQ("schedules?order=label", jwt),
      ]);

      console.log("loadAll results:", {assets: assetsRes?.length, svcLogs: svcRes?.length, fuel: fuelRes?.length, schedules: schedRes?.length});
      console.log("assets sample:", Array.isArray(assetsRes) ? assetsRes.slice(0,2) : assetsRes);
      if (!Array.isArray(assetsRes)) {
        console.error("assets fetch failed:", assetsRes);
        // Token may be expired — try refresh
        const newJwt = await refreshSession();
        if (newJwt) { setLoading(false); loadAll(); return; }
      }
      setAssets(Array.isArray(assetsRes) ? assetsRes : []);
      setSvcLogs(Array.isArray(svcRes) ? svcRes : []);
      setFuelLogs(Array.isArray(fuelRes) ? fuelRes : []);
      setBikeLogs(Array.isArray(bikeLogRes) ? bikeLogRes : []);
      setBikeComps(Array.isArray(bikeCompRes) ? bikeCompRes : []);
      setHomeItems(Array.isArray(homeItemRes) ? homeItemRes : []);
      setHomeLogs(Array.isArray(homeLogRes) ? homeLogRes : []);
      setSchedules(Array.isArray(schedRes) ? schedRes : []);
      setRideAssignments(Array.isArray(ridesRes) ? ridesRes : []);
      setCats(Array.isArray(catsRes) ? catsRes.map(c => ({ id: c.slug, label: c.label, color: c.color, bg: c.bg })) : []);

      // Build photos map: asset_id → primary URL (fall back to DEFAULT_PHOTOS by matching legacy IDs)
      const pm = { ...DEFAULT_PHOTOS };
      if (Array.isArray(photosRes)) {
        photosRes.forEach(p => {
          if (p.is_primary || !pm[p.asset_id]) pm[p.asset_id] = p.url;
        });
        setAllPhotos(photosRes);
      }
      setPhotos(pm);
    } catch(e) {
      console.error("loadAll error", e);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!jwt) return;
    // Try loading data — if it fails (expired token), refresh and retry
    loadAll().catch(async () => {
      const newJwt = await refreshSession();
      if (newJwt) loadAll();
    });
    loadStrava();
  }, [jwt]);

  // ── Auth functions ──────────────────────────────────────────────────────────
  async function handleAuth() {
    setAuthBusy(true); setAuthErr("");
    const { email, password } = authForm;
    if (!email || !password) { setAuthErr("Please enter email and password."); setAuthBusy(false); return; }
    try {
      const res = authView === "signup"
        ? await sbSignUp(email, password)
        : await sbSignIn(email, password);
      console.log("Auth response:", JSON.stringify(res).slice(0, 300));
      if (res.access_token) {
        const s = { access_token: res.access_token, refresh_token: res.refresh_token, user: res.user };
        saveSession(s);
        setSession(s);
      } else {
        const msg = res.error?.message || res.error_description || res.msg || JSON.stringify(res).slice(0,200);
        setAuthErr("Sign in failed: " + msg);
      }
    } catch(e) {
      console.error("Auth error:", e);
      setAuthErr("Network error: " + e.message + ". Check browser console.");
    }
    setAuthBusy(false);
  }

  async function handlePasswordReset() {
    if (!newPassword || newPassword.length < 6) {
      setAuthErr("Password must be at least 6 characters.");
      return;
    }
    setAuthBusy(true); setAuthErr("");
    try {
      // Extract access token from URL hash
      const hash   = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const token  = params.get("access_token");
      if (!token) { setAuthErr("No reset token found in URL."); setAuthBusy(false); return; }

      const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON,
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setResetDone(true);
        setResetMode(false);
        // Clear the hash from URL
        window.history.replaceState(null, "", window.location.pathname);
      } else {
        setAuthErr(data.message || data.error_description || "Reset failed.");
      }
    } catch(e) {
      setAuthErr("Error: " + e.message);
    }
    setAuthBusy(false);
  }

  async function handleSignOut() {
    await sbSignOut(jwt);
    saveSession(null);
    setSession(null);
    setAssets([]); setSvcLogs([]); setFuelLogs([]); setBikeLogs([]);
    setBikeComps([]); setHomeItems([]); setHomeLogs([]); setPhotos({});
    setCats([]); setRideAssignments([]); setSchedules([]);
  }

  // ── Auth screen ─────────────────────────────────────────────────────────────
  // ── Password reset screen ───────────────────────────────────────────────────
  if (resetMode) {
    return (
      <>
        <style>{CSS}</style>
        <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
          <div style={{width:"100%",maxWidth:400}}>
            <div style={{textAlign:"center",marginBottom:32}}>
              <div className="logo" style={{fontSize:"2.2rem",letterSpacing:".12em"}}>MAIN<span>TR</span></div>
            </div>
            <div style={{background:"#141416",border:"1px solid #222226",borderRadius:14,padding:28}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.1rem",letterSpacing:".08em",marginBottom:6}}>Set New Password</div>
              <div style={{fontSize:".8rem",color:"#6b7280",marginBottom:18}}>Choose a new password for your Maintr account.</div>
              <div className="field">
                <label>New Password</label>
                <input type="password" placeholder="At least 6 characters" value={newPassword}
                  onChange={e=>setNewPassword(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&handlePasswordReset()} autoFocus />
              </div>
              {resetDone && <div style={{color:"#34d399",fontSize:".82rem",marginBottom:12,background:"#0a2a1e",border:"1px solid #34d39944",borderRadius:7,padding:"8px 12px"}}>Password updated! Sign in with your new password.</div>}
              {authErr && <div style={{color:"#f87171",fontSize:".82rem",marginBottom:12,background:"#3a101022",border:"1px solid #f8717144",borderRadius:7,padding:"8px 12px"}}>{authErr}</div>}
              <button className="btn btn-p" style={{width:"100%",padding:"11px 0",fontSize:".95rem"}}
                onClick={handlePasswordReset} disabled={authBusy}>
                {authBusy ? "Saving…" : "Set Password"}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!session) {
    return (
      <>
        <style>{CSS}</style>
        <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
          <div style={{width:"100%",maxWidth:400}}>
            <div style={{textAlign:"center",marginBottom:32}}>
              <div className="logo" style={{fontSize:"2.2rem",letterSpacing:".12em"}}>MAIN<span>TR</span></div>
              <div style={{fontSize:".78rem",color:"#6b7280",marginTop:6,letterSpacing:".06em"}}>What you own says a lot. How you maintain it says more.</div>
            </div>
            <div style={{background:"#141416",border:"1px solid #222226",borderRadius:14,padding:28}}>
              <div style={{display:"flex",gap:0,marginBottom:22,background:"#0e0e10",borderRadius:8,padding:3}}>
                {["signin","signup"].map(v=>(
                  <button key={v} onClick={()=>setAuthView(v)}
                    style={{flex:1,padding:"8px 0",borderRadius:6,border:"none",cursor:"pointer",fontSize:".84rem",fontWeight:600,
                      background:authView===v?"#f97316":"transparent",color:authView===v?"#fff":"#6b7280",transition:"all .15s"}}>
                    {v==="signin"?"Sign In":"Create Account"}
                  </button>
                ))}
              </div>
              {authView==="signup" && (
                <div className="field"><label>Full Name</label>
                  <input placeholder="John Adams" value={authForm.name} onChange={e=>setAuthForm({...authForm,name:e.target.value})} />
                </div>
              )}
              <div className="field"><label>Email</label>
                <input type="email" placeholder="you@example.com" value={authForm.email}
                  onChange={e=>setAuthForm({...authForm,email:e.target.value})}
                  onKeyDown={e=>e.key==="Enter"&&handleAuth()} />
              </div>
              <div className="field"><label>Password</label>
                <input type="password" placeholder="••••••••" value={authForm.password}
                  onChange={e=>setAuthForm({...authForm,password:e.target.value})}
                  onKeyDown={e=>e.key==="Enter"&&handleAuth()} />
              </div>
              {authErr && <div style={{color:"#f87171",fontSize:".82rem",marginBottom:12,background:"#3a101022",border:"1px solid #f8717144",borderRadius:7,padding:"8px 12px"}}>{authErr}</div>}
              <button className="btn btn-p" style={{width:"100%",padding:"11px 0",fontSize:".95rem"}}
                onClick={handleAuth} disabled={authBusy}>
                {authBusy ? "Signing in…" : authView==="signin" ? "Sign In" : "Create Account"}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Loading screen ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <style>{CSS}</style>
        <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
          <div className="logo" style={{fontSize:"2rem"}}>MAIN<span>TR</span></div>
          <div style={{color:"#6b7280",fontSize:".9rem"}}>Loading your fleet…</div>
        </div>
      </>
    );
  }

  // If session exists but no data loaded, likely expired token — show sign out option
  if (session && !loading && assets.length === 0) {
    return (
      <>
        <style>{CSS}</style>
        <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,padding:24}}>
          <div className="logo" style={{fontSize:"2rem"}}>MAIN<span>TR</span></div>
          <div style={{color:"#6b7280",fontSize:".9rem",textAlign:"center"}}>
            Could not load your data. Your session may have expired.
          </div>
          <div style={{display:"flex",gap:10}}>
            <button className="btn btn-p" onClick={()=>loadAll()}>Retry</button>
            <button className="btn btn-g" onClick={handleSignOut}>Sign Out & Back In</button>
          </div>
        </div>
      </>
    );
  }

  // ── CRUD helpers ────────────────────────────────────────────────────────────

  // Assets
  async function addVehicle() {
    if (!addForm.name || !addForm.year || !addForm.odometer) return;
    const sched = (SCHEDULES[addForm.make]||[]);
    const r = await sbFetch("POST", "assets", {
      user_id: uid, type:"vehicle", name:addForm.name, make:addForm.make,
      year:parseInt(addForm.year), odometer:parseInt(addForm.odometer),
      vin:addForm.vin||null, purchase_price:addForm.purchasePrice?parseFloat(addForm.purchasePrice):null,
      purchase_date:addForm.purchaseDate||null, status:"active",
    }, jwt);
    if (r.ok && r.data?.[0]) {
      const newAsset = r.data[0];
      // Add default schedules
      for (const s of sched) {
        await sbFetch("POST", "schedules", { asset_id: newAsset.id, user_id: uid, label: s.label, interval_miles: s.miles }, jwt);
      }
      setAddForm({ name:"", make:"Jeep Gladiator", year:"", odometer:"", vin:"", purchasePrice:"", purchaseDate:"" });
      setView("dashboard");
      await loadAll();
    }
  }

  async function updateAsset(id, updates) {
    await sbFetch("PATCH", `assets?id=eq.${id}`, updates, jwt);
    setAssets(prev => prev.map(a => a.id!==id ? a : {...a,...updates}));
  }

  async function retireAsset(id, soldDate, soldPrice) {
    await updateAsset(id, { status:"retired", sold_date:soldDate||null, sold_price:soldPrice||null });
  }

  async function restoreAsset(id) {
    await updateAsset(id, { status:"active", sold_date:null, sold_price:null });
  }

  // Service logs
  async function logService(assetId) {
    if (!logForm.serviceLabel || !logForm.miles) return;
    const cat = logForm.category || autoCategory(logForm.serviceLabel);
    const r = await sbFetch("POST", "service_logs", {
      asset_id: assetId, user_id: uid,
      service_label: logForm.serviceLabel,
      category: cat,
      date: logForm.date || new Date().toISOString().split("T")[0],
      odometer: parseInt(logForm.miles),
      cost: logForm.cost ? parseFloat(logForm.cost) : null,
      performed_by: logForm.performedBy || null,
      location: logForm.location || null,
      notes: logForm.notes || null,
    }, jwt);
    if (r.ok) {
      await updateAsset(assetId, { odometer: Math.max(assets.find(a=>a.id===assetId)?.odometer||0, parseInt(logForm.miles)) });
      setLogForm({ serviceLabel:"", miles:"", date:"", notes:"", cost:"", category:"", performedBy:"", location:"" });
      setShowLog(null);
      setSvcLogs(prev => [...prev, r.data[0]]);
    }
  }

  async function editServiceLog(logId, updates) {
    await sbFetch("PATCH", `service_logs?id=eq.${logId}`, updates, jwt);
    setSvcLogs(prev => prev.map(e => e.id!==logId ? e : {...e,...updates}));
  }

  async function deleteServiceLog(logId) {
    await sbFetch("DELETE", `service_logs?id=eq.${logId}`, null, jwt);
    setSvcLogs(prev => prev.filter(e => e.id!==logId));
  }

  // Fuel
  async function addFuel(assetId, entry) {
    const r = await sbFetch("POST", "fuel_logs", {
      asset_id: assetId, user_id: uid,
      date: entry.date, odometer: entry.miles ? parseInt(entry.miles) : null,
      gallons: entry.gallons ? parseFloat(entry.gallons) : null,
      price_per_gallon: entry.pricePerGallon ? parseFloat(entry.pricePerGallon) : null,
      cost: entry.cost ? parseFloat(entry.cost) : null,
      notes: entry.notes || null,
    }, jwt);
    if (r.ok) setFuelLogs(prev => [...prev, r.data[0]]);
  }

  // Custom schedule items
  async function addCustomSched(assetId) {
    if (!custom.label || !custom.interval) return;
    const r = await sbFetch("POST", "schedules", { asset_id: assetId, user_id: uid, label: custom.label, interval_miles: parseInt(custom.interval) }, jwt);
    if (r.ok) { setSchedules(prev => [...prev, r.data[0]]); setCustom({ label:"", interval:"" }); }
  }

  // Edit/delete a Service Item (a recurring schedule definition) — used by both
  // vehicle schedules (interval_miles) and Home Asset schedules (interval_days).
  async function updateSchedule(id, updates) {
    await sbFetch("PATCH", `schedules?id=eq.${id}`, updates, jwt);
    setSchedules(prev => prev.map(s => s.id!==id ? s : {...s,...updates}));
  }
  async function deleteSchedule(id) {
    await sbFetch("DELETE", `schedules?id=eq.${id}`, null, jwt);
    setSchedules(prev => prev.filter(s => s.id!==id));
  }

  // Bike functions
  async function logBikeItem(assetId, maintItem, entry) {
    const r = await sbFetch("POST", "bike_logs", {
      asset_id: assetId, user_id: uid, maint_item: maintItem,
      date: entry.date, miles: entry.miles, cost: entry.cost||null, notes: entry.notes||null,
    }, jwt);
    if (r.ok) {
      setBikeLogs(prev => [...prev, r.data[0]]);
      await updateAsset(assetId, { current_miles: Math.max(assets.find(a=>a.id===assetId)?.current_miles||0, entry.miles) });
    }
  }

  async function editBikeLog(logId, updates) {
    await sbFetch("PATCH", `bike_logs?id=eq.${logId}`, updates, jwt);
    setBikeLogs(prev => prev.map(l => l.id!==logId ? l : {...l,...updates}));
  }
  async function deleteBikeLog(logId) {
    await sbFetch("DELETE", `bike_logs?id=eq.${logId}`, null, jwt);
    setBikeLogs(prev => prev.filter(l => l.id!==logId));
  }

  async function addBikeComponent(assetId, entry) {
    const r = await sbFetch("POST", "bike_components", {
      asset_id: assetId, user_id: uid, name: entry.name, category: entry.cat||"other",
      maint_item: entry.maintItem||null, date: entry.date, cost: entry.cost||null, notes: entry.notes||null,
    }, jwt);
    if (r.ok) setBikeComps(prev => [...prev, r.data[0]]);
  }

  async function assignRide(rideKey, assetId) {
    if (!assetId) {
      const existing = rideAssignments.find(r => r.ride_key === rideKey);
      if (existing) {
        await sbFetch("DELETE", `ride_assignments?id=eq.${existing.id}`, null, jwt);
        setRideAssignments(prev => prev.filter(r => r.ride_key !== rideKey));
      }
    } else {
      const existing = rideAssignments.find(r => r.ride_key === rideKey);
      if (existing) {
        await sbFetch("PATCH", `ride_assignments?id=eq.${existing.id}`, { asset_id: assetId }, jwt);
        setRideAssignments(prev => prev.map(r => r.ride_key===rideKey ? {...r, asset_id: assetId} : r));
      } else {
        const r = await sbFetch("POST", "ride_assignments", { user_id: uid, ride_key: rideKey, asset_id: assetId }, jwt);
        if (r.ok) setRideAssignments(prev => [...prev, r.data[0]]);
      }
    }
  }

  // Home
  async function addBike(bikeData) {
    const r = await sbFetch("POST", "assets", {
      user_id: uid, type: "bike",
      subtype: bikeData.subtype || "road",
      name: bikeData.name, make: bikeData.make || null,
      model: bikeData.model || null,
      current_miles: bikeData.currentMiles ? parseInt(bikeData.currentMiles) : 0,
      purchase_year: bikeData.purchaseYear || null,
      weight: bikeData.weight || null,
      status: "active",
    }, jwt);
    if (r.ok && r.data?.[0]) {
      setAssets(prev => [...prev, r.data[0]]);
      setView("dashboard");
    }
  }

  async function addHomeAsset(propId, asset) {
    const r = await sbFetch("POST", "assets", {
      user_id: uid, type: "home_asset", parent_id: propId,
      subtype: asset.subtype||"general", name: asset.name,
      make: asset.make||null, model: asset.model||null,
      model_number: asset.modelNumber||null, serial_number: asset.serialNumber||null,
      purchase_date: asset.purchaseDate||null, warranty_expires: asset.warrantyExpires||null,
      notes: asset.notes||null, status: "active",
    }, jwt);
    if (r.ok && r.data?.[0]) {
      setAssets(prev => [...prev, r.data[0]]);
      return r.data[0];
    }
    return null;
  }

  async function addHomeAssetSchedule(assetId, label, intervalDays, anchorMonth, anchorDay) {
    const r = await sbFetch("POST", "schedules", {
      asset_id: assetId, user_id: uid, label,
      interval_days: intervalDays||null,
      anchor_month: anchorMonth||null,
      anchor_day: anchorDay||null,
    }, jwt);
    if (r.ok) setSchedules(prev => [...prev, r.data[0]]);
  }

  async function logHomeAssetService(assetId, entry) {
    const r = await sbFetch("POST", "service_logs", {
      asset_id: assetId, user_id: uid,
      service_label: entry.serviceLabel||entry.label,
      category: entry.category||"preventative",
      date: entry.date||new Date().toISOString().split("T")[0],
      cost: entry.cost ? parseFloat(entry.cost) : null,
      performed_by: entry.performedBy||null,
      location: entry.location||null,
      notes: entry.notes||null,
    }, jwt);
    if (r.ok) setSvcLogs(prev => [...prev, r.data[0]]);
    // Update last_done on schedule item
    if (entry.scheduleId) {
      await sbFetch("PATCH", `schedules?id=eq.${entry.scheduleId}`, { last_done: entry.date }, jwt);
      setSchedules(prev => prev.map(s => s.id===entry.scheduleId ? {...s, last_done: entry.date} : s));
    }
  }

  async function updateHomeItem(itemId, updates) {
    const mapped = {};
    if (updates.lastDone     !== undefined) mapped.last_done     = updates.lastDone;
    if (updates.label        !== undefined) mapped.label         = updates.label;
    if (updates.notes        !== undefined) mapped.notes         = updates.notes;
    if (updates.intervalDays !== undefined) mapped.interval_days = updates.intervalDays;
    if (updates.category     !== undefined) mapped.category      = updates.category;
    if (Object.keys(mapped).length) {
      await sbFetch("PATCH", `home_items?id=eq.${itemId}`, mapped, jwt);
      setHomeItems(prev => prev.map(i => i.id!==itemId ? i : {...i,...mapped}));
    }
  }

  // Delete a property-level Task. Also removes its logged history (home_logs)
  // so nothing is left pointing at a task that no longer exists.
  async function deleteHomeItem(itemId) {
    await sbFetch("DELETE", `home_logs?item_id=eq.${itemId}`, null, jwt);
    await sbFetch("DELETE", `home_items?id=eq.${itemId}`, null, jwt);
    setHomeLogs(prev => prev.filter(l => l.item_id!==itemId));
    setHomeItems(prev => prev.filter(i => i.id!==itemId));
  }

  async function addHomeItem(propId, item) {
    const r = await sbFetch("POST", "home_items", {
      asset_id: propId, user_id: uid, label: item.label, category: item.category||"general",
      interval_days: item.intervalDays ? parseInt(item.intervalDays) : null,
      anchor_month: item.anchorMonth||null, anchor_day: item.anchorDay||null,
      last_done: null, notes: item.notes||null,
    }, jwt);
    if (r.ok) setHomeItems(prev => [...prev, r.data[0]]);
  }

  async function logHomeItem(itemId, propId, entry) {
    const r = await sbFetch("POST", "home_logs", {
      item_id: itemId, asset_id: propId, user_id: uid,
      date: entry.date||new Date().toISOString().split("T")[0],
      cost: entry.cost ? parseFloat(entry.cost) : null, notes: entry.notes||null,
    }, jwt);
    if (r.ok) {
      setHomeLogs(prev => [...prev, r.data[0]]);
      await sbFetch("PATCH", `home_items?id=eq.${itemId}`, { last_done: entry.date||new Date().toISOString().split("T")[0] }, jwt);
      setHomeItems(prev => prev.map(i => i.id!==itemId ? i : {...i, last_done: entry.date}));
    }
  }

  // Recompute a Task's "last done" date from whatever log entries remain for it
  // (used after editing/deleting a record, so the overdue calculation stays correct).
  async function recomputeHomeItemLastDone(itemId, logsAfterChange) {
    const itemLogs = logsAfterChange.filter(l => l.item_id === itemId);
    const newLast = itemLogs.length
      ? itemLogs.reduce((max,l) => (l.date && l.date>max) ? l.date : max, itemLogs[0].date || null)
      : null;
    await sbFetch("PATCH", `home_items?id=eq.${itemId}`, { last_done: newLast }, jwt);
    setHomeItems(prev => prev.map(i => i.id!==itemId ? i : {...i, last_done:newLast}));
  }

  async function editHomeLog(logId, itemId, updates) {
    await sbFetch("PATCH", `home_logs?id=eq.${logId}`, updates, jwt);
    setHomeLogs(prev => {
      const next = prev.map(l => l.id!==logId ? l : {...l,...updates});
      recomputeHomeItemLastDone(itemId, next);
      return next;
    });
  }
  async function deleteHomeLog(logId, itemId) {
    await sbFetch("DELETE", `home_logs?id=eq.${logId}`, null, jwt);
    setHomeLogs(prev => {
      const next = prev.filter(l => l.id!==logId);
      recomputeHomeItemLastDone(itemId, next);
      return next;
    });
  }

  // Photos
  async function savePhoto(assetId, dataUrl) {
    setSavingPhoto(true);
    try {
      const ext  = dataUrl.startsWith("data:image/png") ? "png" : "jpg";
      const path = `${assetId}/primary.${ext}`;
      const url  = await uploadPhoto(path, dataUrl, jwt);
      if (url) {
        // Delete existing primary photo record then insert new one
        await sbFetch("DELETE", `photos?asset_id=eq.${assetId}&is_primary=eq.true`, null, jwt);
        const pr = await sbFetch("POST", "photos", { asset_id: assetId, user_id: uid, storage_path: path, url, is_primary: true }, jwt);
        setPhotos(prev => ({ ...prev, [assetId]: url }));
        if (pr.ok && pr.data?.[0]) setAllPhotos(prev => [...prev.filter(p => !(p.asset_id===assetId && p.is_primary)), pr.data[0]]);
      } else {
        console.error("Photo upload returned null for", assetId);
      }
    } catch(e) {
      console.error("savePhoto error:", e);
    }
    setSavingPhoto(false);
  }

  // Custom categories
  async function saveCategories(updatedCats) {
    // Sync to Supabase - delete all then re-insert (simple approach for small lists)
    for (const existing of cats) {
      await sbFetch("DELETE", `categories?user_id=eq.${uid}&slug=eq.${existing.id}`, null, jwt);
    }
    for (const c of updatedCats) {
      await sbFetch("POST", "categories", { user_id: uid, slug: c.id, label: c.label, color: c.color, bg: c.bg||c.color+"22" }, jwt);
    }
    setCats(updatedCats);
  }

  // ── Navigation helpers ──────────────────────────────────────────────────────
  async function refreshPhotos() {
    const photosRes = await sbQ("photos?order=created_at", jwt);
    if (Array.isArray(photosRes)) {
      setAllPhotos(photosRes);
      const pm = { ...DEFAULT_PHOTOS };
      photosRes.forEach(p => { if (p.is_primary || !pm[p.asset_id]) pm[p.asset_id] = p.url; });
      setPhotos(pm);
    }
  }

  async function loadStrava() {
    setStravaLoading(true);
    try {
      const [rideRows, virtualRows, ebikeRows] = await Promise.all([
        fetchStravaSheet(STRAVA_SHEET_RIDE),
        fetchStravaSheet(STRAVA_SHEET_VIRTUAL),
        fetchStravaSheet(STRAVA_SHEET_EBIKE),
      ]);
      const rides   = parseSheetRows(rideRows,    "ride");
      const virtual = parseSheetRows(virtualRows, "virtual");
      const ebike   = parseSheetRows(ebikeRows,   "ebike");
      // Combine regular + virtual into stravaRides; ebike separate
      setStravaRides([...rides, ...virtual]);
      setStravaEbike(ebike);
      console.log("Strava loaded:", rides.length, "rides,", virtual.length, "virtual,", ebike.length, "ebike");
    } catch(e) {
      console.error("loadStrava error:", e);
    }
    setStravaLoading(false);
  }

  function goVeh(id)       { setSelId(id);           setTab("schedule"); setView("vehicle");    }
  function goBike(id)      { setSelBikeId(id);       setTab("stats");    setView("bike");       }
  function goHome(id)      { setHomePropId(id);       setTab("tasks");    setView("home");       setSelHomeAssetId(null); }
  function goHomeAsset(id) { setSelHomeAssetId(id);   setTab("schedule"); setView("home_asset"); }
  function goBack()        {
    if (view==="home_asset") { setView("home"); setSelHomeAssetId(null); return; }
    if (view==="add_bike")   { setView("dashboard"); return; }
    setView("dashboard"); setSelId(null); setSelBikeId(null); setHomePropId(null); setSelHomeAssetId(null);
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  const selVeh  = vehicles.find(v  => v.id === selId);
  const selBike = bikes.find(b     => b.id === selBikeId);
  const selProp = properties.find(p => p.id === homePropId);

  // Convert Supabase asset shape → legacy shape expected by existing components
  function asVehicle(a) {
    return {
      id: a.id, name: a.name, make: a.make, year: a.year, odometer: a.odometer,
      vin: a.vin, status: a.status, purchaseDate: a.purchase_date, purchasePrice: a.purchase_price,
      soldDate: a.sold_date, soldPrice: a.sold_price,
      marketValues: a.meta?.marketValues || null,
      schedule: (schedByAsset[a.id]||[]).map(s => ({ id: s.id, label: s.label, miles: s.interval_miles })),
    };
  }
  function asBike(a) {
    return {
      id: a.id, name: a.name, make: a.make, model: a.model, type: a.subtype||"road",
      currentMiles: a.current_miles||0, purchaseYear: a.purchase_year, weight: a.weight,
      status: a.status,
    };
  }
  function asProp(a) {
    return { id: a.id, name: a.name, address: a.address, status: a.status };
  }
  function asHomeAsset(a) {
    return {
      id: a.id, name: a.name, subtype: a.subtype||"general",
      make: a.make, model: a.model, model_number: a.model_number,
      serial_number: a.serial_number, purchase_date: a.purchase_date,
      warranty_expires: a.warranty_expires, status: a.status||"active",
      notes: a.notes,
    };
  }

  function asHomeItem(i) {
    return {
      id: i.id, label: i.label, category: i.category,
      intervalDays: i.interval_days, anchorMonth: i.anchor_month, anchorDay: i.anchor_day,
      lastDone: i.last_done, notes: i.notes,
    };
  }
  function asSvcLog(e) {
    return {
      id: e.id, serviceLabel: e.service_label, category: e.category,
      date: e.date, miles: e.odometer, cost: e.cost,
      performedBy: e.performed_by, location: e.location, notes: e.notes,
    };
  }
  function asFuelLog(f) {
    return { id: f.id, date: f.date, miles: f.odometer, gallons: f.gallons, pricePerGallon: f.price_per_gallon, cost: f.cost, notes: f.notes };
  }
  function asBikeLog(e) {
    return { id: e.id, date: e.date, miles: e.miles, cost: e.cost, notes: e.notes };
  }
  function asBikeComp(c) {
    return { id: c.id, name: c.name, cat: c.category, maintItem: c.maint_item, date: c.date, cost: c.cost, notes: c.notes };
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="app">

        {/* ── Header ── */}
        <div className="hdr">
          <div onClick={goBack} style={{cursor:"pointer"}}>
            <div style={{lineHeight:1}}>
              <div className="logo">MAIN<span>TR</span></div>
              <div style={{fontSize:".55rem",color:"#6b7280",letterSpacing:".08em",textTransform:"uppercase",marginTop:2,fontFamily:"'DM Sans',sans-serif",fontWeight:400}}>
                What you own says a lot. How you maintain it says more.
              </div>
            </div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {view!=="dashboard" && (
              <button className="btn btn-g" onClick={goBack}>← Back</button>
            )}
            <button className="btn btn-g btn-sm" onClick={handleSignOut} style={{fontSize:".72rem",color:"#6b7280"}}>Sign Out</button>
          </div>
        </div>

        <div className="shell">

          {/* ── DASHBOARD ── */}
          {view==="dashboard" && (
            <>
              {/* Vehicles */}
              <div className="dash-section-hdr">
                <div className="dash-section-title">🚗 Vehicles</div>
                <div style={{display:"flex",gap:6}}>
                  <button className="btn btn-g btn-sm" style={{fontSize:".7rem",opacity:showRetired?.7:1}}
                    onClick={()=>setShowRetired(!showRetired)}>
                    {showRetired ? "Hide Retired" : "Show Retired"}
                  </button>
                  <button className="btn btn-p btn-sm" onClick={()=>setView("add")}>+ Add</button>
                </div>
              </div>
              <div className="grid">
                {vehicles.filter(v => showRetired ? v.status==="retired" : (v.status||"active")==="active").map(v => {
                  const vv = asVehicle(v);
                  const logs = logsByAsset[v.id]?.map(asSvcLog) || [];
                  const fuel = fuelByAsset[v.id]?.map(asFuelLog) || [];
                  const { red, yellow } = vAlerts(vv, logs);
                  const { avgMpg } = fuelStats(fuel);
                  return (
                    <div key={v.id} className={`vcard${selId===v.id?" sel":""}`} onClick={()=>goVeh(v.id)}>
                      <div className="vcard-body">
                        <div className="vcard-photo">
                          {photosMap[v.id] ? <img src={photosMap[v.id]} alt={v.name} /> : <span>🚗</span>}
                        </div>
                        <div className="vcard-text">
                          <div className="vc-make">{v.make}</div>
                          <div className="vc-name">{v.year} · {v.name}</div>
                          <div className="vc-odo">
                            <strong>{(v.odometer||0).toLocaleString()} mi</strong>
                            {avgMpg && <span style={{marginLeft:8,color:"#34d399"}}>{avgMpg.toFixed(1)} mpg avg</span>}
                          </div>
                          <div className="badges">
                            {(v.status||"active")==="retired"
                              ? <span className="badge" style={{background:"#1e1e22",color:"#6b7280"}}>🔒 Retired{v.sold_date?` · ${v.sold_date}`:""}</span>
                              : <>
                                {red.length>0    && <span className="badge br">⚠ {red.length} overdue</span>}
                                {yellow.length>0 && <span className="badge by">⚡ {yellow.length} due soon</span>}
                                {red.length===0 && yellow.length===0 && <span className="badge bg">✓ All good</span>}
                              </>
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bikes */}
              <>
                  <div className="dash-section-hdr" style={{marginTop:28}}>
                    <div className="dash-section-title">🚴 Bikes</div>
                    <div style={{display:"flex",gap:6}}>
                      <button className="btn btn-g btn-sm" style={{fontSize:".7rem"}}
                        onClick={()=>setShowRetiredBikes(!showRetiredBikes)}>
                        {showRetiredBikes ? "Hide Retired" : "Show Retired"}
                      </button>
                      <button className="btn btn-p btn-sm" onClick={()=>setView("add_bike")}>+ Add</button>
                    </div>
                  </div>
                  {(showRetiredBikes ? bikes : bikes.filter(b=>(b.status||"active")==="active")).length === 0 && (
                    <div style={{color:"#4b5563",fontSize:".86rem",padding:"12px 0"}}>No bikes yet. Add your first bike.</div>
                  )}
                  <div className="grid">
                    {(showRetiredBikes ? bikes : bikes.filter(b=>(b.status||"active")==="active")).map(bike => {
                      const bb = asBike(bike);
                      const cat = BIKE_CATS[bb.type] || BIKE_CATS.road;
                      // Build bikeLogs in legacy format for bikeAlerts
                      const bLogsLegacy = {};
                      BIKE_MAINT.forEach(item => {
                        const key = `${bike.id}-${item.id}`;
                        bLogsLegacy[key] = (bikeLogMap[key]||[]).map(asBikeLog);
                      });
                      const { red, yellow } = bikeAlerts(bb, bLogsLegacy);
                      return (
                        <div key={bike.id} className={`bike-card${selBikeId===bike.id?" sel":""}`} onClick={()=>goBike(bike.id)}>
                          <div className="bike-card-body">
                            <div className="bike-photo">
                              {photosMap[bike.id] ? <img src={photosMap[bike.id]} alt={bike.name} /> : <span>{cat.icon}</span>}
                            </div>
                            <div className="bike-text">
                              <div className="bike-make">{bike.make}</div>
                              <div className="bike-model">{bike.model}</div>
                              <div className="bike-miles"><strong>{(bb.currentMiles||0).toLocaleString()} mi</strong></div>
                              <div className="badges" style={{marginTop:7}}>
                                {(bike.status||"active")==="retired"
                                  ? <span className="badge" style={{background:"#1e1e22",color:"#6b7280"}}>🔒 Retired</span>
                                  : <>
                                    {red.length>0    && <span className="badge br">⚠ {red.length} overdue</span>}
                                    {yellow.length>0 && <span className="badge by">⚡ {yellow.length} due soon</span>}
                                    {red.length===0 && yellow.length===0 && <span className="badge bg">✓ All good</span>}
                                  </>
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>

              {/* Home */}
              {properties.length>0 && (
                <>
                  <div className="dash-section-hdr" style={{marginTop:28}}>
                    <div className="dash-section-title">🏠 Home</div>
                  </div>
                  <div className="grid">
                    {properties.map(prop => {
                      const items = (homeItemsByAsset[prop.id]||[]).map(asHomeItem);
                      const childAssetsRaw = (homeAssetsByParent[prop.id]||[]).map(asHomeAsset);
                      const childAssetIds  = childAssetsRaw.map(a=>a.id);
                      const childSchedulesFlat = schedules.filter(s => childAssetIds.includes(s.asset_id));
                      const allTasks = combineHomeTasks(items, childAssetsRaw.filter(a=>(a.status||"active")==="active"), childSchedulesFlat);
                      const { red, yellow } = homeAlerts(allTasks);
                      return (
                        <div key={prop.id} className={`home-card${homePropId===prop.id?" sel":""}`} onClick={()=>goHome(prop.id)}>
                          <div style={{display:"flex",gap:14,alignItems:"center",padding:14}}>
                            <div className="home-card-banner">
                              {photosMap[prop.id] ? <img src={photosMap[prop.id]} alt={prop.name} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:8}} /> : <span>🏠</span>}
                            </div>
                            <div className="home-card-body-inner">
                              <div className="home-card-name">{prop.name}</div>
                              {prop.address && <div className="home-card-sub">{prop.address}</div>}
                              <div style={{fontSize:".75rem",color:"#6b7280",marginBottom:8}}>{allTasks.length} tasks tracked</div>
                              <div className="badges">
                                {red.length>0    && <span className="badge br">⚠ {red.length} overdue</span>}
                                {yellow.length>0 && <span className="badge by">⚡ {yellow.length} due soon</span>}
                                {red.length===0 && yellow.length===0 && <span className="badge bg">✓ All good</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}

          {/* ── ADD BIKE ── */}
          {view==="add_bike" && (
            <AddBikeForm onAdd={addBike} onCancel={()=>setView("dashboard")} />
          )}

          {/* ── ADD VEHICLE ── */}
          {view==="add" && (
            <div className="add-form">
              <div className="sec">Add Vehicle</div>
              <div className="field-row">
                <div className="field"><label>Nickname / Name</label><input placeholder="e.g. Alltrack" value={addForm.name} onChange={e=>setAddForm({...addForm,name:e.target.value})} /></div>
                <div className="field">
                  <label>Make</label>
                  <select value={addForm.make} onChange={e=>setAddForm({...addForm,make:e.target.value})}>
                    {Object.keys(SCHEDULES).map(m=><option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="field-row">
                <div className="field"><label>Year</label><input type="number" placeholder="2024" value={addForm.year} onChange={e=>setAddForm({...addForm,year:e.target.value})} /></div>
                <div className="field"><label>Odometer (miles)</label><input type="number" placeholder="25000" value={addForm.odometer} onChange={e=>setAddForm({...addForm,odometer:e.target.value})} /></div>
              </div>
              <div className="field-row">
                <div className="field"><label>VIN (optional)</label><input placeholder="17-char VIN" value={addForm.vin} onChange={e=>setAddForm({...addForm,vin:e.target.value})} /></div>
                <div className="field"><label>Purchase Price (optional)</label><input type="number" placeholder="0.00" value={addForm.purchasePrice} onChange={e=>setAddForm({...addForm,purchasePrice:e.target.value})} /></div>
              </div>
              <div className="field"><label>Purchase Date (optional)</label><input type="date" value={addForm.purchaseDate} onChange={e=>setAddForm({...addForm,purchaseDate:e.target.value})} /></div>
              <div className="btn-row">
                <button className="btn btn-g" onClick={goBack}>Cancel</button>
                <button className="btn btn-p" onClick={addVehicle}>Add Vehicle</button>
              </div>
            </div>
          )}

          {/* ── VEHICLE DETAIL ── */}
          {view==="vehicle" && selVeh && (()=>{
            const v    = asVehicle(selVeh);
            const logs = (logsByAsset[selVeh.id]||[]).map(asSvcLog);
            const fuel = (fuelByAsset[selVeh.id]||[]).map(asFuelLog);
            const { avgMpg } = fuelStats(fuel);
            const fuelL = fuelByAsset[selVeh.id]?.map(asFuelLog) || [];
            const totals = costTotals(logs, fuelL);
            return (
              <>
                {/* Vehicle header */}
                <div className="det-hdr">
                  <div className="det-photo-wrap">
                    <div className="det-photo">
                      {photosMap[selVeh.id] ? <img src={photosMap[selVeh.id]} alt={v.name} /> : <span>🚗</span>}
                    </div>
                    <PhotoUploader vehicle={v} onSave={dataUrl=>savePhoto(selVeh.id, dataUrl)} />
                  </div>
                  <div className="det-info">
                    <div className="det-title">{v.make} <span style={{color:"#f97316"}}>{v.name}</span></div>
                    <div className="det-sub">{v.year}{v.vin ? ` · ${v.vin}` : ""}</div>
                    <VinEditor vehicle={v} onSave={vin=>updateAsset(selVeh.id,{vin})} />
                    <div className="odo-row">
                      <input className="odo-inp" type="number"
                        defaultValue={v.odometer}
                        onBlur={e=>{const m=parseInt(e.target.value);if(!isNaN(m))updateAsset(selVeh.id,{odometer:m});}} />
                      <span style={{fontSize:".8rem",color:"#6b7280"}}>mi</span>
                    </div>
                    <div style={{display:"flex",gap:16,marginTop:10,flexWrap:"wrap"}}>
                      {avgMpg && <div style={{textAlign:"center"}}><div style={{fontSize:".9rem",fontWeight:600,color:"#34d399"}}>{avgMpg.toFixed(1)}</div><div style={{fontSize:".62rem",color:"#6b7280",textTransform:"uppercase",letterSpacing:".06em"}}>Avg MPG</div></div>}
                      {totals.total>0 && <div style={{textAlign:"center"}}><div style={{fontSize:".9rem",fontWeight:600,color:"#f97316"}}>${totals.total.toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:0})}</div><div style={{fontSize:".62rem",color:"#6b7280",textTransform:"uppercase",letterSpacing:".06em"}}>Total Cost</div></div>}
                    </div>
                  </div>
                    <button className="btn btn-g btn-sm" onClick={()=>setEditingAsset("vehicle")}>✏️ Edit</button>
                  <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}>
                    {(selVeh.status||"active")==="active"
                      ? <RetireModal type="vehicle" asset={v} onRetire={(sd,sp)=>retireAsset(selVeh.id,sd,sp)} />
                      : <button className="btn btn-g btn-sm" onClick={()=>restoreAsset(selVeh.id)}>↩ Restore</button>
                    }
                  </div>
                </div>
                {editingAsset==="vehicle" && (
                  <EditAssetModal
                    asset={selVeh}
                    type="vehicle"
                    onSave={updates=>updateAsset(selVeh.id, updates)}
                    onClose={()=>setEditingAsset(null)}
                  />
                )}

                {/* Tabs */}
                <div className="tabs">
                  {[{k:"schedule",l:"📋 Schedule"},{k:"history",l:`📜 History (${logs.length})`},{k:"fuel",l:"⛽ Fuel"},{k:"costs",l:"💰 Costs"},{k:"valuation",l:"📈 Values"},{k:"gallery",l:"📸 Photos"}].map(t=>(
                    <button key={t.k} className={`tab${tab===t.k?" on":""}`} onClick={()=>setTab(t.k)}>{t.l}</button>
                  ))}
                </div>

                {/* Schedule */}
                {tab==="schedule" && (
                  <>
                    <div className="svc-list">
                      {v.schedule.map(svc=>{
                        const last = logs.filter(l=>l.serviceLabel===svc.label).sort((a,b)=>b.miles-a.miles)[0]||null;
                        const pct  = calcPct(last?.miles??null, svc.miles, v.odometer);
                        const left = calcLeft(last?.miles??null, svc.miles, v.odometer);
                        const col  = statusColor(pct);
                        return (
                          <VehicleScheduleRow
                            key={svc.id}
                            svc={svc}
                            last={last}
                            pct={pct}
                            col={col}
                            left={left}
                            onLog={()=>{
                              setLogForm({serviceLabel:svc.label, miles:v.odometer.toString(), date:new Date().toISOString().split("T")[0], notes:"", cost:"", category:autoCategory(svc.label), performedBy:"", location:""});
                              setShowLog(selVeh.id);
                            }}
                            onSave={updates=>updateSchedule(svc.id, { label: updates.label, interval_miles: updates.miles })}
                            onDelete={()=>deleteSchedule(svc.id)}
                          />
                        );
                      })}
                    </div>
                    <div className="sec" style={{marginTop:24}}>Add Custom Service</div>
                    <div className="cust-row">
                      <div className="field"><label>Service Name</label><input placeholder="e.g. Skid Plate Check" value={custom.label} onChange={e=>setCustom({...custom,label:e.target.value})} /></div>
                      <div className="field"><label>Interval (miles)</label><input type="number" placeholder="15000" value={custom.interval} onChange={e=>setCustom({...custom,interval:e.target.value})} /></div>
                      <button className="btn btn-p btn-sm" style={{alignSelf:"flex-end",height:36}} onClick={()=>addCustomSched(selVeh.id)}>Add</button>
                    </div>
                  </>
                )}

                {/* History */}
                {tab==="history" && (
                  <>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        {Object.entries(CAT_LABELS).filter(([k])=>k!=="fuel").map(([k,c])=>(
                          <span key={k} style={{fontSize:".72rem",padding:"3px 10px",borderRadius:99,background:c.bg,color:c.color,fontWeight:600}}>{c.label}</span>
                        ))}
                      </div>
                      <div style={{display:"flex",gap:6,flexShrink:0}}>
                        <CategoryManager customCats={cats} onSave={saveCategories} />
                        <button className="btn btn-p btn-sm" onClick={()=>{
                          setLogForm({serviceLabel:"", miles:v.odometer.toString(), date:new Date().toISOString().split("T")[0], notes:"", cost:"", category:"", performedBy:"", location:""});
                          setShowLog(selVeh.id);
                        }}>+ Log Service</button>
                      </div>
                    </div>
                    {logs.length===0
                      ? <div style={{color:"#4b5563",fontSize:".86rem",padding:"12px 0"}}>No history yet.</div>
                      : [...logs].sort((a,b)=>b.miles-a.miles).map(e=>(
                          <EditableLogItem
                            key={e.id} entry={e}
                            color={(CAT_LABELS[e.category||autoCategory(e.serviceLabel)]||CAT_LABELS.repair).color}
                            onSave={updates=>editServiceLog(e.id, {
                              service_label: updates.serviceLabel, category: updates.category,
                              date: updates.date, odometer: updates.miles, cost: updates.cost,
                              performed_by: updates.performedBy, location: updates.location, notes: updates.notes,
                            })}
                            onDelete={()=>deleteServiceLog(e.id)}
                          />
                        ))
                    }
                  </>
                )}

                {/* Fuel */}
                {tab==="fuel" && (
                  <FuelTab vehicleId={selVeh.id} fuelLogs={fuel} onAdd={entry=>addFuel(selVeh.id,entry)} />
                )}

                {/* Costs */}
                {tab==="costs" && <CostsTab logs={logs} fuelLogs={fuelL} />}

                {/* Valuation */}
                {tab==="valuation" && (
                  <ValuationTab vehicle={v} onUpdate={updates=>{
                    const dbUpdates = {};
                    if (updates.purchasePrice !== undefined) dbUpdates.purchase_price = updates.purchasePrice;
                    if (updates.purchaseDate  !== undefined) dbUpdates.purchase_date  = updates.purchaseDate;
                    if (updates.marketValues  !== undefined) {
                      // Store in meta JSON column
                      const currentMeta = assets.find(a=>a.id===selVeh.id)?.meta || {};
                      dbUpdates.meta = { ...currentMeta, marketValues: updates.marketValues };
                    }
                    updateAsset(selVeh.id, dbUpdates);
                  }} />
                )}

                {/* Gallery */}
                {tab==="gallery" && (
                  <PhotoGallery
                    assetId={selVeh.id}
                    photos={photosMap}
                    allPhotos={allPhotos}
                    jwt={jwt}
                    uid={uid}
                    onPrimaryChange={refreshPhotos}
                  />
                )}
              </>
            );
          })()}

          {/* ── BIKE DETAIL ── */}
          {view==="bike" && selBike && (()=>{
            const bb = asBike(selBike);
            const bLogsLegacy = {};
            BIKE_MAINT.forEach(item => {
              const key = `${selBike.id}-${item.id}`;
              bLogsLegacy[key] = (bikeLogMap[key]||[]).map(asBikeLog);
            });
            return (
              <BikeDetail
                bike={bb}
                bikeLogs={bLogsLegacy}
                bikePhoto={photosMap[selBike.id]}
                allPhotos={allPhotos}
                jwt={jwt}
                uid={uid}
                stravaRides={stravaRides}
                stravaEbike={stravaEbike}
                stravaLoading={stravaLoading}
                onRefreshStrava={loadStrava}
                bikeComponents={(bikeCompsByAsset[selBike.id]||[]).map(asBikeComp)}
                rideAssignments={rideMap}
                onLogItem={(key, entry) => {
                  const maintItem = key.replace(bb.id+"-","");
                  logBikeItem(selBike.id, maintItem, entry);
                }}
                onUpdateBike={(id, updates) => {
                  const mapped = {};
                  if (updates.currentMiles !== undefined) mapped.current_miles = updates.currentMiles;
                  if (updates.status       !== undefined) mapped.status        = updates.status;
                  if (updates.soldDate     !== undefined) mapped.sold_date     = updates.soldDate;
                  if (updates.soldPrice    !== undefined) mapped.sold_price    = updates.soldPrice;
                  if (updates.subtype      !== undefined) mapped.subtype       = updates.subtype;
                  if (updates.name         !== undefined) mapped.name          = updates.name;
                  if (updates.make         !== undefined) mapped.make          = updates.make;
                  if (updates.model        !== undefined) mapped.model         = updates.model;
                  if (updates.weight       !== undefined) mapped.weight        = updates.weight;
                  if (updates.purchase_year!== undefined) mapped.purchase_year = updates.purchase_year;
                  if (updates.photo        !== undefined) { /* handled separately */ }
                  if (Object.keys(mapped).length) updateAsset(selBike.id, mapped);
                }}
                onRetire={(sd,sp) => retireAsset(selBike.id, sd, sp)}
                onRestore={() => restoreAsset(selBike.id)}
                onSavePhoto={dataUrl => savePhoto(selBike.id, dataUrl)}
                onAddComponent={(id, entry) => addBikeComponent(selBike.id, entry)}
                onAssignRide={(key, assetId) => assignRide(key, assetId)}
                onRefreshPhotos={refreshPhotos}
                onEditLog={(logId, updates) => editBikeLog(logId, updates)}
                onDeleteLog={(logId) => deleteBikeLog(logId)}
                onBack={goBack}
              />
            );
          })()}

          {/* ── HOME ASSET DETAIL ── */}
          {view==="home_asset" && selHomeAssetId && (()=>{
            const ha = assets.find(a => a.id === selHomeAssetId);
            if (!ha) return null;
            const haSchedz = schedules.filter(s => s.asset_id === selHomeAssetId);
            const haLogs   = svcLogs.filter(l => l.asset_id === selHomeAssetId);
            return (
              <HomeAssetDetail
                asset={asHomeAsset(ha)}
                schedules={haSchedz}
                logs={haLogs}
                allPhotos={allPhotos}
                jwt={jwt}
                uid={uid}
                onLog={(assetId, entry) => logHomeAssetService(assetId, entry)}
                onAddSchedule={addHomeAssetSchedule}
                onUpdateSchedule={(id, updates) => updateSchedule(id, updates)}
                onDeleteSchedule={(id) => deleteSchedule(id)}
                onEditLog={(logId, updates) => editServiceLog(logId, updates)}
                onDeleteLog={(logId) => deleteServiceLog(logId)}
                onUpdateAsset={updateAsset}
                onRefreshPhotos={refreshPhotos}
                onRetire={(sd,sp) => retireAsset(selHomeAssetId, sd, sp)}
                onRestore={() => restoreAsset(selHomeAssetId)}
                onBack={goBack}
              />
            );
          })()}

          {/* ── HOME DETAIL ── */}
          {view==="home" && selProp && (()=>{
            const p     = asProp(selProp);
            const items = (homeItemsByAsset[selProp.id]||[]).map(asHomeItem);
            const logsForProp = {};
            items.forEach(i => { logsForProp[i.id] = (homeLogsByItem[i.id]||[]).map(l => ({ id:l.id, date:l.date, cost:l.cost, notes:l.notes })); });
            const childAssetsRaw  = homeAssetsByParent[selProp.id]||[];
            const childAssetIds   = childAssetsRaw.map(a=>a.id);
            const childSchedulesFlat = schedules.filter(s => childAssetIds.includes(s.asset_id));
            const childLogsFlat     = svcLogs.filter(l => childAssetIds.includes(l.asset_id));
            return (
              <HomeDetail
                property={p}
                items={items}
                homeLogs={logsForProp}
                homeAssets={childAssetsRaw.map(asHomeAsset)}
                childSchedules={childSchedulesFlat}
                childLogs={childLogsFlat}
                initialTab="tasks"
                onLogItem={(itemId, entry) => logHomeItem(itemId, selProp.id, entry)}
                onAddItem={item => addHomeItem(selProp.id, item)}
                onUpdateItem={(itemId, updates) => updateHomeItem(itemId, updates)}
                onDeleteItem={(itemId) => deleteHomeItem(itemId)}
                onGoAsset={goHomeAsset}
                onAddAsset={async (asset) => { await addHomeAsset(selProp.id, asset); }}
                onLogSchedule={(assetId, scheduleId, label, vals) => logHomeAssetService(assetId, { serviceLabel: label, scheduleId, date: vals.date, cost: vals.cost, notes: vals.notes })}
                onUpdateSchedule={(id, updates) => updateSchedule(id, updates)}
                onDeleteSchedule={(id) => deleteSchedule(id)}
                onEditChildLog={(logId, updates) => editServiceLog(logId, updates)}
                onDeleteChildLog={(logId) => deleteServiceLog(logId)}
                onEditHomeLog={(logId, itemId, updates) => editHomeLog(logId, itemId, updates)}
                onDeleteHomeLog={(logId, itemId) => deleteHomeLog(logId, itemId)}
              />
            );
          })()}

        </div>{/* shell */}
      </div>{/* app */}

      {/* Log Service Modal */}
      {showLog && (
        <div className="overlay" onClick={()=>setShowLog(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">Log Service</div>
            <div className="field-row">
              <div className="field" style={{flex:2}}>
                <label>Service</label>
                <input placeholder="e.g. Oil Change" value={logForm.serviceLabel}
                  onChange={e=>setLogForm({...logForm,serviceLabel:e.target.value,category:autoCategory(e.target.value)})} autoFocus />
              </div>
              <div className="field">
                <label>Category</label>
                <select value={logForm.category} onChange={e=>setLogForm({...logForm,category:e.target.value})}>
                  {Object.entries(CAT_LABELS).filter(([k])=>k!=="fuel").map(([k,v])=>(
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field-row">
              <div className="field"><label>Odometer (miles)</label><input type="number" value={logForm.miles} onChange={e=>setLogForm({...logForm,miles:e.target.value})} /></div>
              <div className="field"><label>Date</label><input type="date" value={logForm.date} onChange={e=>setLogForm({...logForm,date:e.target.value})} /></div>
            </div>
            <div className="field"><label>Cost ($)</label><input type="number" step="0.01" placeholder="0.00" value={logForm.cost} onChange={e=>setLogForm({...logForm,cost:e.target.value})} /></div>
            <div className="field"><label>Notes (optional)</label><input placeholder="Observations, details…" value={logForm.notes} onChange={e=>setLogForm({...logForm,notes:e.target.value})} /></div>
            <div className="field-row">
              <div className="field"><label>Service Performed By</label><input placeholder="e.g. John Adams, Dealer" value={logForm.performedBy} onChange={e=>setLogForm({...logForm,performedBy:e.target.value})} /></div>
              <div className="field"><label>Location / Shop</label><input placeholder="e.g. Firestone, Home" value={logForm.location} onChange={e=>setLogForm({...logForm,location:e.target.value})} /></div>
            </div>
            <div className="modal-btns">
              <button className="btn btn-g" onClick={()=>setShowLog(null)}>Cancel</button>
              <button className="btn btn-p" onClick={()=>logService(showLog)}>Save</button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}