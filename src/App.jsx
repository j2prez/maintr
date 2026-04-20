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

// ── Vehicle IDs ───────────────────────────────────────────────────────────────

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
};

const STRAVA_RIDES = [
  {d:"2023-04-12",n:"Afternoon Ride",mi:26.27,dur:"1 hour, 29 minutes, 7 seconds",in:false,bike:null},
  {d:"2023-04-13",n:"Afternoon Ride",mi:27.07,dur:"1 hour, 25 minutes, 6 seconds",in:false,bike:null},
  {d:"2023-04-14",n:"Morning Ride",mi:18.77,dur:"1 hour, 6 minutes, 49 seconds",in:false,bike:null},
  {d:"2023-04-14",n:"Afternoon Ride",mi:20.31,dur:"1 hour, 21 minutes, 15 seconds",in:false,bike:null},
  {d:"2023-04-15",n:"Afternoon Ride",mi:35.07,dur:"1 hour, 59 minutes, 43 seconds",in:false,bike:null},
  {d:"2023-04-15",n:"Evening Ride",mi:6.98,dur:"26 minutes, 20 seconds",in:false,bike:null},
  {d:"2023-04-18",n:"I want to be the reason you look down at your phone and smile. Then walk into a pole.",mi:25.93,dur:"1 hour, 24 minutes, 6 seconds",in:false,bike:null},
  {d:"2023-04-19",n:"Afternoon Ride",mi:27.0,dur:"1 hour, 27 minutes, 39 seconds",in:false,bike:null},
  {d:"2023-04-20",n:"Morning Ride",mi:18.77,dur:"1 hour, 9 minutes, 10 seconds",in:false,bike:null},
  {d:"2023-04-20",n:"Afternoon Ride",mi:19.13,dur:"1 hour, 13 minutes, 51 seconds",in:false,bike:null},
  {d:"2023-04-26",n:"Afternoon Ride",mi:26.48,dur:"1 hour, 23 minutes, 34 seconds",in:false,bike:null},
  {d:"2023-04-27",n:"Afternoon Ride",mi:26.56,dur:"1 hour, 30 minutes, 52 seconds",in:false,bike:null},
  {d:"2023-04-29",n:"Morning Ride",mi:36.1,dur:"2 hours, 44 seconds",in:false,bike:null},
  {d:"2023-05-04",n:"Afternoon Ride",mi:28.19,dur:"1 hour, 33 minutes, 58 seconds",in:false,bike:null},
  {d:"2023-05-05",n:"Afternoon Ride",mi:19.06,dur:"1 hour, 2 minutes, 46 seconds",in:false,bike:null},
  {d:"2023-05-06",n:"Return Ride",mi:1.39,dur:"6 minutes, 9 seconds",in:false,bike:null},
  {d:"2023-05-06",n:"Afternoon Ride",mi:30.21,dur:"1 hour, 42 minutes",in:false,bike:null},
  {d:"2023-05-07",n:"Most people I meet in the workplace try to kill me. So, you're a nice change of pace.",mi:9.98,dur:"29 minutes, 22 seconds",in:false,bike:null},
  {d:"2023-05-07",n:"Lunch Ride",mi:10.05,dur:"29 minutes, 47 seconds",in:false,bike:null},
  {d:"2023-05-07",n:"Lunch Ride",mi:10.05,dur:"29 minutes, 47 seconds",in:false,bike:null},
  {d:"2023-05-07",n:"Afternoon Ride",mi:20.51,dur:"1 hour, 11 minutes, 6 seconds",in:false,bike:null},
  {d:"2023-05-08",n:"Sometimes you have to say something out loud to hear how crazy it sounds.",mi:26.36,dur:"1 hour, 28 minutes, 3 seconds",in:false,bike:null},
  {d:"2023-05-09",n:"Morning Ride",mi:18.77,dur:"1 hour, 7 minutes, 42 seconds",in:false,bike:null},
  {d:"2023-05-09",n:"Afternoon Ride",mi:19.08,dur:"1 hour, 19 minutes, 16 seconds",in:false,bike:null},
  {d:"2023-05-10",n:"Afternoon Ride",mi:26.01,dur:"1 hour, 25 minutes, 49 seconds",in:false,bike:null},
  {d:"2023-05-11",n:"Morning Ride",mi:18.79,dur:"1 hour, 8 minutes, 31 seconds",in:false,bike:null},
  {d:"2023-05-11",n:"Afternoon Ride",mi:19.23,dur:"1 hour, 18 minutes, 2 seconds",in:false,bike:null},
  {d:"2023-05-12",n:"Afternoon Ride",mi:25.15,dur:"1 hour, 22 minutes, 50 seconds",in:false,bike:null},
  {d:"2023-05-13",n:"If we're going to die, let's die looking like a Peruvian folk band.",mi:37.04,dur:"2 hours, 5 minutes, 44 seconds",in:false,bike:null},
  {d:"2023-05-14",n:"How do we get ahead of crazy if we don't know how crazy thinks.",mi:9.99,dur:"29 minutes, 49 seconds",in:false,bike:null},
  {d:"2023-05-15",n:"A pleasurable experience",mi:18.77,dur:"1 hour, 7 minutes, 47 seconds",in:false,bike:null},
  {d:"2023-05-15",n:"Afternoon Ride",mi:19.24,dur:"1 hour, 13 minutes, 31 seconds",in:false,bike:null},
  {d:"2023-05-16",n:"I need your clothes, your boots, and your bicycle.",mi:26.32,dur:"1 hour, 25 minutes, 20 seconds",in:false,bike:null},
  {d:"2023-05-17",n:"Morning Ride",mi:18.78,dur:"1 hour, 9 minutes, 15 seconds",in:false,bike:null},
  {d:"2023-05-17",n:"Afternoon Ride",mi:19.19,dur:"1 hour, 19 minutes, 34 seconds",in:false,bike:null},
  {d:"2023-05-18",n:"Did that blow your mind? Because that just happened!",mi:24.17,dur:"1 hour, 19 minutes, 49 seconds",in:false,bike:null},
  {d:"2023-05-19",n:"Morning Ride",mi:18.77,dur:"1 hour, 9 minutes, 49 seconds",in:false,bike:null},
  {d:"2023-05-19",n:"Afternoon Ride",mi:14.74,dur:"59 minutes, 8 seconds",in:false,bike:null},
  {d:"2023-05-19",n:"Evening Ride",mi:4.66,dur:"15 minutes",in:false,bike:null},
  {d:"2023-05-20",n:"Afternoon Ride",mi:26.16,dur:"1 hour, 31 minutes, 44 seconds",in:false,bike:null},
  {d:"2023-05-21",n:"Morning Ride",mi:15.02,dur:"44 minutes, 37 seconds",in:false,bike:null},
  {d:"2023-05-21",n:"So, what now? Back to your, uh, test tubes, or whatever you guys do?",mi:6.96,dur:"25 minutes, 36 seconds",in:false,bike:null},
  {d:"2023-05-22",n:"Morning Ride",mi:18.81,dur:"1 hour, 11 minutes, 48 seconds",in:false,bike:null},
  {d:"2023-05-22",n:"Afternoon Ride",mi:19.16,dur:"1 hour, 15 minutes, 51 seconds",in:false,bike:null},
  {d:"2023-05-24",n:"Morning Ride",mi:18.77,dur:"1 hour, 8 minutes, 41 seconds",in:false,bike:null},
  {d:"2023-05-24",n:"Afternoon Ride",mi:19.17,dur:"1 hour, 18 minutes, 45 seconds",in:false,bike:null},
  {d:"2023-05-25",n:"Afternoon Ride",mi:25.17,dur:"1 hour, 28 minutes, 10 seconds",in:false,bike:null},
  {d:"2023-05-26",n:"Morning Ride",mi:18.73,dur:"1 hour, 5 minutes, 54 seconds",in:false,bike:null},
  {d:"2023-05-26",n:"Afternoon Ride",mi:19.08,dur:"1 hour, 16 minutes, 18 seconds",in:false,bike:null},
  {d:"2023-05-27",n:"Afternoon Ride",mi:36.05,dur:"2 hours, 1 minute, 42 seconds",in:false,bike:null},
  {d:"2023-05-28",n:"We're all becoming narcissistic attention whores!",mi:28.19,dur:"1 hour, 34 minutes, 1 second",in:false,bike:null},
  {d:"2023-05-29",n:"Lunch Ride",mi:26.08,dur:"1 hour, 33 minutes, 25 seconds",in:false,bike:null},
  {d:"2023-05-30",n:"Morning Commute",mi:18.8,dur:"1 hour, 9 minutes, 49 seconds",in:false,bike:null},
  {d:"2023-05-30",n:"Ugh! How do you smell loud and confusing?",mi:19.16,dur:"1 hour, 16 minutes, 56 seconds",in:false,bike:null},
  {d:"2023-05-31",n:"Evening Ride",mi:16.18,dur:"49 minutes, 22 seconds",in:false,bike:null},
  {d:"2023-06-01",n:"CIA Realizes It's Been Using Black Highlighters All These Years",mi:18.77,dur:"1 hour, 7 minutes, 58 seconds",in:false,bike:null},
  {d:"2023-06-01",n:"Afternoon Ride",mi:19.6,dur:"1 hour, 16 minutes, 21 seconds",in:false,bike:null},
  {d:"2023-06-02",n:"Afternoon Ride",mi:26.21,dur:"1 hour, 28 minutes, 7 seconds",in:false,bike:null},
  {d:"2023-06-03",n:"Afternoon Ride",mi:28.21,dur:"1 hour, 40 minutes, 15 seconds",in:false,bike:null},
  {d:"2023-06-03",n:"Evening Ride",mi:6.96,dur:"26 minutes, 10 seconds",in:false,bike:null},
  {d:"2023-06-04",n:"Morning Ride",mi:37.13,dur:"2 hours, 14 minutes, 28 seconds",in:false,bike:null},
  {d:"2023-06-04",n:"Afternoon Ride",mi:6.65,dur:"23 minutes, 45 seconds",in:false,bike:null},
  {d:"2023-06-05",n:"What's this salty discharge?",mi:18.82,dur:"1 hour, 11 minutes, 42 seconds",in:false,bike:null},
  {d:"2023-06-05",n:"Afternoon Ride",mi:18.96,dur:"1 hour, 13 minutes, 55 seconds",in:false,bike:null},
  {d:"2023-06-06",n:"It's not nice to fool with the dark overlords!",mi:24.3,dur:"1 hour, 23 minutes, 39 seconds",in:false,bike:null},
  {d:"2023-06-07",n:"He would make outrageous claims like he invented the question mark.",mi:18.78,dur:"1 hour, 8 minutes, 43 seconds",in:false,bike:null},
  {d:"2023-06-07",n:"Afternoon Ride",mi:19.33,dur:"1 hour, 21 minutes, 6 seconds",in:false,bike:null},
  {d:"2023-06-09",n:"Come and see the next generation in action. You can be depressed along with me.",mi:18.7,dur:"1 hour, 6 minutes, 34 seconds",in:false,bike:null},
  {d:"2023-06-09",n:"Afternoon Ride",mi:18.65,dur:"1 hour, 5 minutes, 53 seconds",in:false,bike:null},
  {d:"2023-06-10",n:"Morning Ride",mi:9.67,dur:"28 minutes, 48 seconds",in:false,bike:null},
  {d:"2023-06-10",n:"I don't have my inhaler, and all I see around here is pollen!",mi:19.06,dur:"1 hour, 3 minutes, 53 seconds",in:false,bike:null},
  {d:"2023-06-10",n:"Afternoon Ride",mi:6.79,dur:"25 minutes, 51 seconds",in:false,bike:null},
  {d:"2023-06-11",n:"Morning Ride",mi:6.76,dur:"25 minutes, 41 seconds",in:false,bike:null},
  {d:"2023-06-11",n:"If everything you try works, then you are not trying hard enough.",mi:30.2,dur:"1 hour, 42 minutes, 20 seconds",in:false,bike:null},
  {d:"2023-06-12",n:"I See Your Schwartz Is As Big As Mine.",mi:18.76,dur:"1 hour, 10 minutes, 32 seconds",in:false,bike:null},
  {d:"2023-06-12",n:"Afternoon Ride",mi:18.9,dur:"1 hour, 7 minutes, 57 seconds",in:false,bike:null},
  {d:"2023-06-13",n:"You sold a reverberating carbonizer with mutate capacity to an unlicensed cephalopoid?",mi:24.1,dur:"1 hour, 21 minutes, 22 seconds",in:false,bike:null},
  {d:"2023-06-14",n:"Morning Ride",mi:18.79,dur:"1 hour, 9 minutes, 13 seconds",in:false,bike:null},
  {d:"2023-06-14",n:"Can It You Nit!",mi:18.87,dur:"1 hour, 9 minutes, 55 seconds",in:false,bike:null},
  {d:"2023-06-16",n:"Morning Ride",mi:18.72,dur:"1 hour, 8 minutes, 14 seconds",in:false,bike:null},
  {d:"2023-06-16",n:"Afternoon Ride",mi:18.65,dur:"1 hour, 7 minutes, 42 seconds",in:false,bike:null},
  {d:"2023-06-17",n:"Morning Ride",mi:11.03,dur:"32 minutes, 19 seconds",in:false,bike:null},
  {d:"2023-06-17",n:"Morning Ride",mi:11.07,dur:"32 minutes, 34 seconds",in:false,bike:null},
  {d:"2023-06-17",n:"Afternoon Ride",mi:22.24,dur:"1 hour, 14 minutes, 23 seconds",in:false,bike:null},
  {d:"2023-06-17",n:"Evening Ride",mi:6.75,dur:"38 minutes, 41 seconds",in:false,bike:null},
  {d:"2023-06-18",n:"Ah, yes. A meeting place where people attempt to achieve advanced states of mental incompetence by the repeated consumption of fermented vegetable drinks.",mi:34.2,dur:"1 hour, 56 minutes, 48 seconds",in:false,bike:null},
  {d:"2023-06-19",n:"I'll tell you who you are, you're a moron. 'Translucent' doesn't even mean 'invisible,' it means 'semi-transparent.'",mi:18.81,dur:"1 hour, 6 minutes, 59 seconds",in:false,bike:null},
  {d:"2023-06-19",n:"Afternoon Commute",mi:18.57,dur:"1 hour, 14 minutes, 14 seconds",in:false,bike:null},
  {d:"2023-06-20",n:"Afternoon Ride",mi:26.05,dur:"1 hour, 30 minutes, 12 seconds",in:false,bike:null},
  {d:"2023-06-22",n:"Morning Commute",mi:18.75,dur:"1 hour, 11 minutes, 3 seconds",in:false,bike:null},
  {d:"2023-06-22",n:"Afternoon Ride",mi:18.59,dur:"1 hour, 16 minutes, 34 seconds",in:false,bike:null},
  {d:"2023-06-23",n:"Morning Ride",mi:18.7,dur:"1 hour, 6 minutes, 37 seconds",in:false,bike:null},
  {d:"2023-06-23",n:"Afternoon Ride",mi:18.63,dur:"1 hour, 6 minutes, 37 seconds",in:false,bike:null},
  {d:"2023-06-24",n:"It was my bad. I was never a very good practical joker.",mi:30.05,dur:"1 hour, 46 minutes, 10 seconds",in:false,bike:null},
  {d:"2023-06-24",n:"Afternoon Ride",mi:2.83,dur:"26 minutes, 19 seconds",in:false,bike:null},
  {d:"2023-06-24",n:"Night Ride",mi:2.76,dur:"17 minutes, 22 seconds",in:false,bike:null},
  {d:"2023-06-25",n:"Afternoon Ride",mi:39.09,dur:"2 hours, 25 minutes, 31 seconds",in:false,bike:null},
  {d:"2023-06-26",n:"Morning Ride",mi:18.8,dur:"1 hour, 11 minutes, 3 seconds",in:false,bike:null},
  {d:"2023-06-26",n:"Afternoon Ride",mi:18.63,dur:"1 hour, 6 minutes, 46 seconds",in:false,bike:null},
  {d:"2023-06-28",n:"Morning Ride",mi:18.78,dur:"1 hour, 8 minutes, 52 seconds",in:false,bike:null},
  {d:"2023-06-28",n:"Afternoon Ride",mi:18.69,dur:"1 hour, 12 minutes, 56 seconds",in:false,bike:null},
  {d:"2023-06-30",n:"Morning Ride",mi:18.75,dur:"1 hour, 4 minutes, 9 seconds",in:false,bike:null},
  {d:"2023-06-30",n:"Afternoon Ride",mi:18.58,dur:"1 hour, 1 minute, 56 seconds",in:false,bike:null},
  {d:"2023-07-01",n:"Afternoon Ride",mi:30.54,dur:"1 hour, 45 minutes, 14 seconds",in:false,bike:null},
  {d:"2023-07-01",n:"Afternoon Ride",mi:6.67,dur:"26 minutes, 35 seconds",in:false,bike:null},
  {d:"2023-07-02",n:"A donut with no hole, is a Danish.",mi:42.05,dur:"2 hours, 28 minutes, 40 seconds",in:false,bike:null},
  {d:"2023-07-02",n:"We're all becoming narcissistic attention whores!",mi:3.78,dur:"15 minutes, 39 seconds",in:false,bike:null},
  {d:"2023-07-02",n:"Afternoon Ride",mi:3.56,dur:"13 minutes, 57 seconds",in:false,bike:null},
  {d:"2023-07-03",n:"Morning Ride",mi:18.71,dur:"1 hour, 7 minutes, 42 seconds",in:false,bike:null},
  {d:"2023-07-03",n:"Afternoon Ride",mi:18.65,dur:"1 hour, 4 minutes, 33 seconds",in:false,bike:null},
  {d:"2023-07-04",n:"Afternoon Ride",mi:32.05,dur:"1 hour, 46 minutes, 9 seconds",in:false,bike:null},
  {d:"2023-07-05",n:"Why would you say that? My ears are still developing!",mi:18.79,dur:"1 hour, 9 minutes, 30 seconds",in:false,bike:null},
  {d:"2023-07-05",n:"Afternoon Ride",mi:18.61,dur:"1 hour, 11 minutes, 14 seconds",in:false,bike:null},
  {d:"2023-07-07",n:"Buzz, my back end's goin' to Baton Rouge!",mi:18.78,dur:"1 hour, 7 minutes, 59 seconds",in:false,bike:null},
  {d:"2023-07-07",n:"Afternoon Ride",mi:18.57,dur:"1 hour, 8 minutes, 43 seconds",in:false,bike:null},
  {d:"2023-07-08",n:"Afternoon Ride",mi:25.97,dur:"1 hour, 27 minutes, 2 seconds",in:false,bike:null},
  {d:"2023-07-09",n:"Morning Ride",mi:43.96,dur:"3 hours, 46 minutes, 15 seconds",in:false,bike:null},
  {d:"2023-07-10",n:"Morning Commute",mi:18.89,dur:"1 hour, 9 minutes, 49 seconds",in:false,bike:null},
  {d:"2023-07-10",n:"Afternoon Ride",mi:18.59,dur:"1 hour, 9 minutes, 23 seconds",in:false,bike:null},
  {d:"2023-07-11",n:"Afternoon Ride",mi:28.07,dur:"1 hour, 37 minutes",in:false,bike:null},
  {d:"2023-07-12",n:"And they call ME \"Punchy\".",mi:18.77,dur:"1 hour, 8 minutes",in:false,bike:null},
  {d:"2023-07-12",n:"Afternoon Ride",mi:18.58,dur:"1 hour, 10 minutes, 21 seconds",in:false,bike:null},
  {d:"2023-07-14",n:"Morning Ride",mi:18.67,dur:"1 hour, 7 minutes, 53 seconds",in:false,bike:null},
  {d:"2023-07-14",n:"Afternoon Ride",mi:18.83,dur:"1 hour, 9 minutes, 21 seconds",in:false,bike:null},
  {d:"2023-07-15",n:"I got a backpack on! You don't get in the water with a backpack, everybody knows that.",mi:30.05,dur:"1 hour, 41 minutes, 4 seconds",in:false,bike:null},
  {d:"2023-07-15",n:"Evening Ride",mi:6.72,dur:"27 minutes, 15 seconds",in:false,bike:null},
  {d:"2023-07-16",n:"What, so everyone's supposed to sleep every single night now? You realize that nighttime makes up half of all time?",mi:11.2,dur:"32 minutes, 39 seconds",in:false,bike:null},
  {d:"2023-07-16",n:"Morning Ride",mi:11.21,dur:"32 minutes, 36 seconds",in:false,bike:null},
  {d:"2023-07-16",n:"Morning Ride",mi:11.2,dur:"32 minutes, 39 seconds",in:false,bike:null},
  {d:"2023-07-16",n:"I'm the BoogeyMan and I'm Coming to Get You!",mi:26.23,dur:"1 hour, 28 minutes, 32 seconds",in:false,bike:null},
  {d:"2023-07-17",n:"Morning Ride",mi:18.77,dur:"1 hour, 7 minutes, 52 seconds",in:false,bike:null},
  {d:"2023-07-17",n:"Evening Ride",mi:1.23,dur:"4 minutes, 46 seconds",in:false,bike:null},
  {d:"2023-07-18",n:"Afternoon Ride",mi:25.26,dur:"1 hour, 23 minutes, 24 seconds",in:false,bike:null},
  {d:"2023-07-19",n:"Morning Ride",mi:18.72,dur:"1 hour, 5 minutes, 19 seconds",in:false,bike:null},
  {d:"2023-07-19",n:"Afternoon Ride",mi:18.61,dur:"1 hour, 4 minutes, 36 seconds",in:false,bike:null},
  {d:"2023-07-20",n:"Afternoon Ride",mi:25.62,dur:"1 hour, 25 minutes, 14 seconds",in:false,bike:null},
  {d:"2023-07-21",n:"Look, we're not trying to be mean. We just don't want you to be yourself  in any way.",mi:18.68,dur:"1 hour, 19 minutes, 10 seconds",in:false,bike:null},
  {d:"2023-07-21",n:"Afternoon Ride",mi:18.57,dur:"1 hour, 7 minutes, 57 seconds",in:false,bike:null},
  {d:"2023-07-22",n:"Afternoon Ride",mi:34.06,dur:"2 hours, 8 minutes, 48 seconds",in:false,bike:null},
  {d:"2023-07-23",n:"Morning Ride",mi:48.12,dur:"2 hours, 45 minutes, 14 seconds",in:false,bike:null},
  {d:"2023-07-23",n:"Evening Ride",mi:6.81,dur:"31 minutes",in:false,bike:null},
  {d:"2023-07-24",n:"Now for the Benefit of Those with Flash Photography",mi:18.71,dur:"1 hour, 6 minutes, 37 seconds",in:false,bike:null},
  {d:"2023-07-24",n:"Afternoon Ride",mi:18.69,dur:"1 hour, 10 minutes",in:false,bike:null},
  {d:"2023-07-25",n:"Afternoon Ride",mi:25.98,dur:"1 hour, 26 minutes, 32 seconds",in:false,bike:null},
  {d:"2023-07-26",n:"Morning Ride",mi:18.7,dur:"1 hour, 7 minutes, 52 seconds",in:false,bike:null},
  {d:"2023-07-26",n:"Afternoon Ride",mi:18.88,dur:"1 hour, 6 minutes, 39 seconds",in:false,bike:null},
  {d:"2023-07-27",n:"Afternoon Ride",mi:25.26,dur:"1 hour, 24 minutes, 21 seconds",in:false,bike:null},
  {d:"2023-07-28",n:"Morning Ride",mi:18.82,dur:"1 hour, 11 minutes, 33 seconds",in:false,bike:null},
  {d:"2023-07-28",n:"Afternoon Ride",mi:18.62,dur:"1 hour, 7 minutes, 36 seconds",in:false,bike:null},
  {d:"2023-07-29",n:"Morning Ride",mi:30.06,dur:"1 hour, 47 minutes, 42 seconds",in:false,bike:null},
  {d:"2023-07-29",n:"Afternoon Ride",mi:2.79,dur:"17 minutes, 59 seconds",in:false,bike:null},
  {d:"2023-07-29",n:"Evening Ride",mi:2.75,dur:"16 minutes, 58 seconds",in:false,bike:null},
  {d:"2023-07-30",n:"Don't Feed Me Any More Lines From Monsters, Inc.",mi:12.7,dur:"38 minutes, 21 seconds",in:false,bike:null},
  {d:"2023-07-31",n:"How many licks does it take to get to the center of a snowball?",mi:18.78,dur:"1 hour, 10 minutes, 10 seconds",in:false,bike:null},
  {d:"2023-07-31",n:"Afternoon Ride",mi:18.62,dur:"1 hour, 13 minutes, 34 seconds",in:false,bike:null},
  {d:"2023-08-01",n:"I never finish anythi",mi:26.01,dur:"1 hour, 24 minutes, 2 seconds",in:false,bike:null},
  {d:"2023-08-02",n:"Would it help if I got out and pushed?!!",mi:18.77,dur:"1 hour, 9 minutes, 8 seconds",in:false,bike:null},
  {d:"2023-08-02",n:"Afternoon Ride",mi:18.63,dur:"1 hour, 9 minutes, 44 seconds",in:false,bike:null},
  {d:"2023-08-04",n:"That's what I do: I drink and I know things.",mi:18.78,dur:"1 hour, 8 minutes, 52 seconds",in:false,bike:null},
  {d:"2023-08-04",n:"Afternoon Ride",mi:18.63,dur:"1 hour, 13 minutes, 20 seconds",in:false,bike:null},
  {d:"2023-08-05",n:"It's a metaphor. But that actually happened.",mi:25.93,dur:"1 hour, 27 minutes, 57 seconds",in:false,bike:null},
  {d:"2023-08-06",n:"Like wrestling a greased pig",mi:55.05,dur:"3 hours, 13 minutes, 54 seconds",in:false,bike:null},
  {d:"2023-08-07",n:"I have failed over and over and over again in my life, and that is why I succeed.",mi:18.77,dur:"1 hour, 10 minutes, 21 seconds",in:false,bike:null},
  {d:"2023-08-07",n:"Afternoon Ride",mi:18.62,dur:"1 hour, 8 minutes, 45 seconds",in:false,bike:null},
  {d:"2023-08-08",n:"If life was easy where would all the adventures be?",mi:26.18,dur:"1 hour, 22 minutes, 11 seconds",in:false,bike:null},
  {d:"2023-08-09",n:"Morning Ride",mi:19.0,dur:"1 hour, 8 minutes, 50 seconds",in:false,bike:null},
  {d:"2023-08-09",n:"Afternoon Ride",mi:18.64,dur:"1 hour, 9 minutes, 30 seconds",in:false,bike:null},
  {d:"2023-08-10",n:"Afternoon Ride",mi:26.28,dur:"1 hour, 25 minutes, 43 seconds",in:false,bike:null},
  {d:"2023-08-11",n:"The easiest time to add insult to injury is when you're signing somebody's cast.",mi:18.75,dur:"1 hour, 7 minutes, 48 seconds",in:false,bike:null},
  {d:"2023-08-11",n:"Afternoon Ride",mi:18.94,dur:"1 hour, 6 minutes, 59 seconds",in:false,bike:null},
  {d:"2023-08-12",n:"Afternoon Ride",mi:30.08,dur:"1 hour, 48 minutes, 45 seconds",in:false,bike:null},
  {d:"2023-08-13",n:"We were on a break!",mi:22.21,dur:"1 hour, 11 minutes, 49 seconds",in:false,bike:null},
  {d:"2023-08-14",n:"Morning Ride",mi:18.79,dur:"1 hour, 8 minutes, 42 seconds",in:false,bike:null},
  {d:"2023-08-14",n:"Afternoon Ride",mi:18.64,dur:"1 hour, 8 minutes, 36 seconds",in:false,bike:null},
  {d:"2023-08-15",n:"Afternoon Ride",mi:18.69,dur:"1 hour, 4 minutes, 12 seconds",in:false,bike:null},
  {d:"2023-08-16",n:"I don't get history. If I wanted to know what happened in Europe a long time ago, I'd watch Game of Thrones.",mi:18.79,dur:"1 hour, 8 minutes, 49 seconds",in:false,bike:null},
  {d:"2023-08-16",n:"Afternoon Ride",mi:18.63,dur:"1 hour, 7 minutes, 5 seconds",in:false,bike:null},
  {d:"2023-08-17",n:"Afternoon Ride",mi:25.33,dur:"1 hour, 25 minutes, 44 seconds",in:false,bike:null},
  {d:"2023-08-18",n:"Morning Ride",mi:18.78,dur:"1 hour, 8 minutes, 28 seconds",in:false,bike:null},
  {d:"2023-08-18",n:"Afternoon Ride",mi:18.65,dur:"1 hour, 7 minutes, 48 seconds",in:false,bike:null},
  {d:"2023-08-19",n:"Morning Ride",mi:36.07,dur:"2 hours, 10 minutes, 51 seconds",in:false,bike:null},
  {d:"2023-08-20",n:"Lunch Ride",mi:32.06,dur:"1 hour, 51 minutes, 7 seconds",in:false,bike:null},
  {d:"2023-08-21",n:"I'm gonna climb over that anger wall of yours one of these days and it's gonna be glorious.",mi:18.79,dur:"1 hour, 9 minutes, 39 seconds",in:false,bike:null},
  {d:"2023-08-21",n:"Afternoon Ride",mi:2.25,dur:"6 minutes, 20 seconds",in:false,bike:null},
  {d:"2023-08-21",n:"Afternoon Ride",mi:15.08,dur:"57 minutes, 47 seconds",in:false,bike:null},
  {d:"2023-08-22",n:"Afternoon Ride",mi:26.18,dur:"1 hour, 25 minutes, 31 seconds",in:false,bike:null},
  {d:"2023-08-23",n:"Morning Ride",mi:18.81,dur:"1 hour, 7 minutes, 50 seconds",in:false,bike:null},
  {d:"2023-08-23",n:"Get In My Belly!",mi:18.64,dur:"1 hour, 9 minutes, 33 seconds",in:false,bike:null},
  {d:"2023-08-24",n:"Morning Ride",mi:18.78,dur:"1 hour, 8 minutes, 4 seconds",in:false,bike:null},
  {d:"2023-08-24",n:"Afternoon Ride",mi:18.71,dur:"1 hour, 7 minutes, 36 seconds",in:false,bike:null},
  {d:"2023-08-26",n:"Existence is pain to a meeseeks Jerry, and we will do anything to alleviate that pain.",mi:11.37,dur:"41 minutes, 54 seconds",in:false,bike:null},
  {d:"2023-08-26",n:"Morning Ride",mi:25.23,dur:"1 hour, 9 minutes, 27 seconds",in:false,bike:null},
  {d:"2023-08-26",n:"Morning Ride",mi:13.04,dur:"48 minutes, 52 seconds",in:false,bike:null},
  {d:"2023-08-26",n:"Afternoon Ride",mi:3.29,dur:"25 minutes, 58 seconds",in:false,bike:null},
  {d:"2023-08-26",n:"Evening Ride",mi:2.82,dur:"18 minutes, 11 seconds",in:false,bike:null},
  {d:"2023-08-27",n:"Son of a bench!",mi:22.49,dur:"1 hour, 17 minutes, 54 seconds",in:false,bike:null},
  {d:"2023-08-28",n:"Morning Ride",mi:18.79,dur:"1 hour, 8 minutes, 34 seconds",in:false,bike:null},
  {d:"2023-08-28",n:"Afternoon Ride",mi:18.67,dur:"1 hour, 13 minutes, 31 seconds",in:false,bike:null},
  {d:"2023-08-29",n:"Afternoon Ride",mi:26.15,dur:"1 hour, 27 minutes, 42 seconds",in:false,bike:null},
  {d:"2023-08-30",n:"Morning Ride",mi:18.8,dur:"1 hour, 9 minutes, 32 seconds",in:false,bike:null},
  {d:"2023-08-30",n:"Afternoon Ride",mi:18.64,dur:"1 hour, 14 minutes, 18 seconds",in:false,bike:null},
  {d:"2023-09-01",n:"If prisoners could take their own mug shots, would they be called cell-fies?",mi:18.71,dur:"1 hour, 6 minutes, 33 seconds",in:false,bike:null},
  {d:"2023-09-01",n:"Afternoon Ride",mi:18.68,dur:"1 hour, 22 minutes, 16 seconds",in:false,bike:null},
  {d:"2023-09-02",n:"Morning Ride",mi:25.95,dur:"1 hour, 24 minutes, 30 seconds",in:false,bike:null},
  {d:"2023-09-02",n:"Afternoon Ride",mi:0.2,dur:"1 minute, 10 seconds",in:false,bike:null},
  {d:"2023-09-02",n:"You still got it! And to think I was worried last night, when you were trying to turn on your phone flashlight, and ended up taking like 30 pictures of your angry face.",mi:6.56,dur:"25 minutes, 57 seconds",in:false,bike:null},
  {d:"2023-09-03",n:"Morning Ride",mi:62.71,dur:"3 hours, 42 minutes, 30 seconds",in:false,bike:null},
  {d:"2023-09-04",n:"Morning Ride",mi:38.0,dur:"2 hours, 5 minutes, 41 seconds",in:false,bike:null},
  {d:"2023-09-05",n:"Afternoon Ride",mi:26.3,dur:"1 hour, 28 minutes, 38 seconds",in:false,bike:null},
  {d:"2023-09-06",n:"I've always enjoyed the camaraderie of good friends competing in games of chance and skill.",mi:18.82,dur:"1 hour, 12 minutes, 44 seconds",in:false,bike:null},
  {d:"2023-09-06",n:"Afternoon Ride",mi:18.66,dur:"1 hour, 9 minutes, 15 seconds",in:false,bike:null},
  {d:"2023-09-08",n:"You can't escape destiny. She comes for us all.",mi:18.78,dur:"1 hour, 8 minutes, 6 seconds",in:false,bike:null},
  {d:"2023-09-08",n:"Afternoon Ride",mi:18.65,dur:"1 hour, 6 minutes, 50 seconds",in:false,bike:null},
  {d:"2023-09-09",n:"Afternoon Ride",mi:25.98,dur:"1 hour, 26 minutes, 20 seconds",in:false,bike:null},
  {d:"2023-09-10",n:"Morning Ride",mi:7.98,dur:"1 hour, 34 minutes, 17 seconds",in:false,bike:null},
  {d:"2023-09-10",n:"If you try to escape, or play any sort of games with me, I will taze you and watch Supernanny while you drool into the carpet.",mi:39.1,dur:"2 hours, 13 minutes, 27 seconds",in:false,bike:null},
  {d:"2023-09-10",n:"Why do they call it a 'building'? It looks like they're finished. Shy isn't it a 'built'?",mi:6.99,dur:"26 minutes, 38 seconds",in:false,bike:null},
  {d:"2023-09-11",n:"I only wanna make a drink a coal miner would want. Straight forward. Honest. Something that says, 'I work in a hole.'",mi:18.8,dur:"1 hour, 9 minutes, 5 seconds",in:false,bike:null},
  {d:"2023-09-11",n:"Afternoon Ride",mi:18.65,dur:"1 hour, 10 minutes, 46 seconds",in:false,bike:null},
  {d:"2023-09-12",n:"Afternoon Ride",mi:25.3,dur:"1 hour, 26 minutes, 40 seconds",in:false,bike:null},
  {d:"2023-09-13",n:"Afternoon Ride",mi:25.99,dur:"1 hour, 30 minutes, 6 seconds",in:false,bike:null},
  {d:"2023-09-14",n:"Afternoon Ride",mi:26.13,dur:"1 hour, 31 minutes, 5 seconds",in:false,bike:null},
  {d:"2023-09-15",n:"Afternoon Ride",mi:26.23,dur:"1 hour, 28 minutes, 33 seconds",in:false,bike:null},
  {d:"2023-09-16",n:"Lunch Ride",mi:7.05,dur:"21 minutes, 36 seconds",in:false,bike:null},
  {d:"2023-09-16",n:"Here's Johnny!",mi:27.99,dur:"1 hour, 35 minutes, 43 seconds",in:false,bike:null},
  {d:"2023-09-17",n:"Afternoon Ride",mi:32.0,dur:"1 hour, 49 minutes, 24 seconds",in:false,bike:null},
  {d:"2023-09-18",n:"Afternoon Ride",mi:29.3,dur:"1 hour, 38 minutes, 18 seconds",in:false,bike:null},
  {d:"2023-09-19",n:"Afternoon Ride",mi:27.0,dur:"1 hour, 30 minutes, 58 seconds",in:false,bike:null},
  {d:"2023-09-20",n:"Afternoon Ride",mi:26.02,dur:"1 hour, 27 minutes, 31 seconds",in:false,bike:null},
  {d:"2023-09-22",n:"Morning Ride",mi:18.77,dur:"1 hour, 9 minutes, 6 seconds",in:false,bike:null},
  {d:"2023-09-22",n:"Afternoon Ride",mi:18.61,dur:"1 hour, 11 minutes, 15 seconds",in:false,bike:null},
  {d:"2023-09-23",n:"Afternoon Ride",mi:40.03,dur:"2 hours, 16 minutes, 17 seconds",in:false,bike:null},
  {d:"2023-09-24",n:"Morning Ride",mi:12.95,dur:"38 minutes, 14 seconds",in:false,bike:null},
  {d:"2023-09-24",n:"Kip, stand by to take the blame.",mi:12.93,dur:"38 minutes, 5 seconds",in:false,bike:null},
  {d:"2023-09-24",n:"Afternoon Ride",mi:28.0,dur:"1 hour, 33 minutes, 11 seconds",in:false,bike:null},
  {d:"2023-09-25",n:"Morning Ride",mi:18.77,dur:"1 hour, 9 minutes, 33 seconds",in:false,bike:null},
  {d:"2023-09-25",n:"Afternoon Ride",mi:18.62,dur:"1 hour, 10 minutes, 43 seconds",in:false,bike:null},
  {d:"2023-09-26",n:"Afternoon Ride",mi:27.1,dur:"1 hour, 29 minutes, 12 seconds",in:false,bike:null},
  {d:"2023-09-27",n:"Afternoon Ride",mi:25.99,dur:"1 hour, 26 minutes, 49 seconds",in:false,bike:null},
  {d:"2023-09-28",n:"That was a ride? I thought I was flying!",mi:18.79,dur:"1 hour, 10 minutes, 14 seconds",in:false,bike:null},
  {d:"2023-09-28",n:"Afternoon Ride",mi:18.63,dur:"1 hour, 10 minutes, 8 seconds",in:false,bike:null},
  {d:"2023-09-29",n:"Afternoon Ride",mi:25.97,dur:"1 hour, 27 minutes, 17 seconds",in:false,bike:null},
  {d:"2023-09-30",n:"Afternoon Ride",mi:20.04,dur:"1 hour, 9 minutes, 38 seconds",in:false,bike:null},
  {d:"2023-09-30",n:"Afternoon Ride",mi:2.89,dur:"17 minutes, 1 second",in:false,bike:null},
  {d:"2023-09-30",n:"Night Ride",mi:2.94,dur:"19 minutes, 41 seconds",in:false,bike:null},
  {d:"2023-10-01",n:"It makes me want to knit you a sweater.",mi:37.33,dur:"2 hours, 14 minutes, 24 seconds",in:false,bike:null},
  {d:"2023-10-02",n:"Morning Ride",mi:18.79,dur:"1 hour, 9 minutes, 34 seconds",in:false,bike:null},
  {d:"2023-10-02",n:"Afternoon Ride",mi:18.65,dur:"1 hour, 9 minutes, 40 seconds",in:false,bike:null},
  {d:"2023-10-03",n:"Afternoon Ride",mi:30.01,dur:"1 hour, 40 minutes, 45 seconds",in:false,bike:null},
  {d:"2023-10-04",n:"Morning Ride",mi:18.76,dur:"1 hour, 7 minutes, 58 seconds",in:false,bike:null},
  {d:"2023-10-04",n:"Afternoon Ride",mi:18.65,dur:"1 hour, 7 minutes, 30 seconds",in:false,bike:null},
  {d:"2023-10-09",n:"Afternoon Ride",mi:30.16,dur:"1 hour, 39 minutes, 21 seconds",in:false,bike:null},
  {d:"2023-10-10",n:"Afternoon Ride",mi:30.09,dur:"1 hour, 40 minutes, 18 seconds",in:false,bike:null},
  {d:"2023-10-11",n:"Afternoon Ride",mi:30.0,dur:"1 hour, 37 minutes, 15 seconds",in:false,bike:null},
  {d:"2023-10-12",n:"Afternoon Ride",mi:30.02,dur:"1 hour, 36 minutes, 19 seconds",in:false,bike:null},
  {d:"2023-10-17",n:"Afternoon Ride",mi:28.13,dur:"1 hour, 28 minutes, 6 seconds",in:false,bike:null},
  {d:"2023-10-18",n:"Afternoon Ride",mi:27.96,dur:"1 hour, 32 minutes, 14 seconds",in:false,bike:null},
  {d:"2023-10-21",n:"The gang's all here.  Where were you?",mi:36.04,dur:"2 hours, 1 minute",in:false,bike:null},
  {d:"2023-10-21",n:"Afternoon Ride",mi:3.44,dur:"1 hour, 19 minutes, 11 seconds",in:false,bike:null},
  {d:"2023-10-22",n:"Afternoon Ride",mi:30.14,dur:"1 hour, 43 minutes, 1 second",in:false,bike:null},
  {d:"2023-10-23",n:"Afternoon Ride",mi:30.01,dur:"1 hour, 38 minutes, 51 seconds",in:false,bike:null},
  {d:"2023-10-24",n:"Afternoon Ride",mi:30.16,dur:"1 hour, 38 minutes, 34 seconds",in:false,bike:null},
  {d:"2023-10-25",n:"Afternoon Ride",mi:31.14,dur:"1 hour, 42 minutes, 40 seconds",in:false,bike:null},
  {d:"2023-10-26",n:"Afternoon Ride",mi:30.04,dur:"1 hour, 41 minutes, 21 seconds",in:false,bike:null},
  {d:"2023-10-27",n:"The reports of my death are greatly exaggerated.",mi:18.75,dur:"1 hour, 9 minutes, 4 seconds",in:false,bike:null},
  {d:"2023-10-27",n:"Cake, isn't that your weakness?",mi:21.02,dur:"1 hour, 34 minutes, 51 seconds",in:false,bike:null},
  {d:"2023-11-04",n:"Afternoon Ride",mi:31.21,dur:"1 hour, 49 minutes, 15 seconds",in:false,bike:null},
  {d:"2023-11-04",n:"Afternoon Ride",mi:6.99,dur:"27 minutes, 3 seconds",in:false,bike:null},
  {d:"2023-11-05",n:"Afternoon Ride",mi:26.34,dur:"1 hour, 30 minutes, 47 seconds",in:false,bike:null},
  {d:"2023-11-05",n:"Afternoon Ride",mi:6.98,dur:"25 minutes, 50 seconds",in:false,bike:null},
  {d:"2023-11-11",n:"Wahoo SYSTM: Recovery Spin",mi:7.64,dur:"29 minutes, 59 seconds",in:true,bike:null},
  {d:"2023-11-12",n:"Wahoo SYSTM: Blender",mi:30.75,dur:"1 hour, 41 minutes, 49 seconds",in:true,bike:null},
  {d:"2023-11-13",n:"Wahoo SYSTM: The Chores",mi:17.27,dur:"57 minutes, 27 seconds",in:true,bike:null},
  {d:"2023-11-14",n:"Wahoo SYSTM: Running With Wolves",mi:17.63,dur:"59 minutes, 35 seconds",in:true,bike:null},
  {d:"2023-11-16",n:"Wahoo SYSTM: Cadence Builds",mi:10.08,dur:"35 minutes, 46 seconds",in:true,bike:null},
  {d:"2023-11-17",n:"Wahoo SYSTM: Open: 60",mi:17.93,dur:"1 hour, 17 seconds",in:true,bike:null},
  {d:"2023-11-18",n:"Wahoo SYSTM: Recovery Spin",mi:7.67,dur:"29 minutes, 59 seconds",in:true,bike:null},
  {d:"2023-11-19",n:"Wahoo SYSTM: The Bat",mi:18.65,dur:"59 minutes, 39 seconds",in:true,bike:null},
  {d:"2023-11-20",n:"Wahoo SYSTM: The Way Out",mi:18.72,dur:"59 minutes, 3 seconds",in:true,bike:null},
  {d:"2023-11-21",n:"Wahoo SYSTM: Found in America",mi:16.56,dur:"57 minutes, 3 seconds",in:true,bike:null},
  {d:"2023-11-23",n:"Wahoo SYSTM: Defender",mi:19.23,dur:"58 minutes, 58 seconds",in:true,bike:null},
  {d:"2023-11-24",n:"Wahoo SYSTM: The Other French Race",mi:9.18,dur:"31 minutes, 47 seconds",in:true,bike:null},
  {d:"2023-11-25",n:"Wahoo SYSTM: A Sunday In Hell",mi:31.19,dur:"1 hour, 45 minutes, 58 seconds",in:true,bike:null},
  {d:"2023-11-27",n:"Wahoo SYSTM: From the Ground Up S2 Pt 2",mi:11.3,dur:"39 minutes, 23 seconds",in:true,bike:null},
  {d:"2023-11-30",n:"Wahoo SYSTM: Cadence Builds and Holds",mi:12.55,dur:"44 minutes, 59 seconds",in:true,bike:null},
  {d:"2023-12-01",n:"Wahoo SYSTM: Getting Away With It",mi:13.74,dur:"44 minutes, 26 seconds",in:true,bike:null},
  {d:"2023-12-02",n:"Wahoo SYSTM: Half the Road",mi:31.97,dur:"1 hour, 47 minutes, 9 seconds",in:true,bike:null},
  {d:"2023-12-03",n:"Wahoo SYSTM: A Very Dark Place",mi:15.27,dur:"49 minutes",in:true,bike:null},
  {d:"2023-12-04",n:"Wahoo SYSTM: Recharger",mi:8.56,dur:"30 minutes, 34 seconds",in:true,bike:null},
  {d:"2023-12-05",n:"Wahoo SYSTM: Fight Club",mi:17.37,dur:"55 minutes, 41 seconds",in:true,bike:null},
  {d:"2023-12-06",n:"Wahoo SYSTM: Across the Mountains",mi:9.73,dur:"38 minutes, 7 seconds",in:true,bike:null},
  {d:"2023-12-07",n:"Wahoo SYSTM: The Model",mi:18.29,dur:"59 minutes, 6 seconds",in:true,bike:null},
  {d:"2023-12-08",n:"Wahoo SYSTM: Full Circle",mi:5.78,dur:"22 minutes, 6 seconds",in:true,bike:null},
  {d:"2023-12-09",n:"Wahoo SYSTM: Half the Road",mi:31.98,dur:"1 hour, 47 minutes, 12 seconds",in:true,bike:null},
  {d:"2023-12-10",n:"Wahoo SYSTM: On Location - Tasmania: Cygnet Coast Road",mi:15.3,dur:"49 minutes, 51 seconds",in:true,bike:null},
  {d:"2023-12-11",n:"Wahoo SYSTM: Who Dares",mi:16.69,dur:"53 minutes",in:true,bike:null},
  {d:"2023-12-12",n:"Wahoo SYSTM: Into the Rift",mi:11.49,dur:"40 minutes, 35 seconds",in:true,bike:null},
  {d:"2023-12-14",n:"Wahoo SYSTM: Ultimate Triathlon",mi:29.37,dur:"1 hour, 37 minutes, 58 seconds",in:true,bike:null},
  {d:"2023-12-15",n:"Wahoo SYSTM: Recovery Spin",mi:7.67,dur:"30 minutes",in:true,bike:null},
  {d:"2023-12-16",n:"Wahoo SYSTM: Cobbler",mi:33.57,dur:"1 hour, 46 minutes, 19 seconds",in:true,bike:null},
  {d:"2023-12-18",n:"Wahoo SYSTM: Cadence Drills (Builds/Holds/Single Leg)",mi:14.92,dur:"55 minutes",in:true,bike:null},
  {d:"2023-12-20",n:"Wahoo SYSTM: Primers",mi:13.2,dur:"45 minutes, 11 seconds",in:true,bike:null},
  {d:"2023-12-23",n:"Wahoo SYSTM: Veni Bici Sushi: Episode 1",mi:6.61,dur:"25 minutes, 37 seconds",in:true,bike:null},
  {d:"2023-12-25",n:"Wahoo SYSTM: On Location - Catalunya: Costa Brava Coastline",mi:15.12,dur:"48 minutes, 45 seconds",in:true,bike:null},
  {d:"2023-12-25",n:"Flanders Monday Blues Ride: Part 2",mi:3.5,dur:"10 minutes",in:false,bike:null},
  {d:"2023-12-26",n:"Wahoo SYSTM: Attacker",mi:16.7,dur:"53 minutes, 2 seconds",in:true,bike:null},
  {d:"2023-12-28",n:"Wahoo SYSTM: To Get To The Other Side",mi:26.44,dur:"1 hour, 27 minutes, 50 seconds",in:true,bike:null},
  {d:"2023-12-29",n:"Wahoo SYSTM: On Location - French Pyrenees: Lac de Cap de Long",mi:26.28,dur:"1 hour, 25 minutes, 45 seconds",in:true,bike:null},
  {d:"2023-12-31",n:"Wahoo SYSTM: Nine Hammers",mi:17.91,dur:"58 minutes, 15 seconds",in:true,bike:null},
  {d:"2024-01-01",n:"Wahoo SYSTM: Recovery Spin",mi:7.67,dur:"29 minutes, 59 seconds",in:true,bike:null},
  {d:"2024-01-02",n:"Wahoo SYSTM: AWWUCI: BMX",mi:12.49,dur:"45 minutes, 37 seconds",in:true,bike:null},
  {d:"2024-01-04",n:"Wahoo SYSTM: Heart Flatline to Finish Line",mi:28.87,dur:"1 hour, 38 minutes, 44 seconds",in:true,bike:null},
  {d:"2024-01-06",n:"Wahoo SYSTM: It Seemed Like a Good Idea at the Time (ISLAGIATT)",mi:35.67,dur:"1 hour, 51 minutes, 2 seconds",in:true,bike:null},
  {d:"2024-01-07",n:"Wahoo SYSTM: Serbia Upside Down Ep. 2",mi:6.37,dur:"24 minutes, 27 seconds",in:true,bike:null},
  {d:"2024-01-09",n:"Wahoo SYSTM: Wahoo Frontiers 2020",mi:18.74,dur:"1 hour, 4 minutes, 44 seconds",in:true,bike:null},
  {d:"2024-01-10",n:"Wahoo SYSTM: Ultimate Triathlon",mi:29.4,dur:"1 hour, 38 minutes, 1 second",in:true,bike:null},
  {d:"2024-01-12",n:"Wahoo SYSTM: Serbia Upside Down Ep. 1",mi:6.72,dur:"25 minutes, 31 seconds",in:true,bike:null},
  {d:"2024-01-14",n:"Wahoo SYSTM: The Omnium",mi:14.35,dur:"47 minutes, 23 seconds",in:true,bike:null},
  {d:"2024-01-15",n:"Wahoo SYSTM: Why Do We Bike?",mi:16.44,dur:"55 minutes, 30 seconds",in:true,bike:null},
  {d:"2024-01-16",n:"Wahoo SYSTM: On Location - Provence: Luberon",mi:16.6,dur:"55 minutes, 3 seconds",in:true,bike:null},
  {d:"2024-01-20",n:"Wahoo SYSTM: Endurance 2",mi:34.76,dur:"1 hour, 59 minutes, 59 seconds",in:true,bike:null},
  {d:"2024-01-21",n:"Wahoo SYSTM: ProRides: Strade Bianche 1",mi:34.69,dur:"1 hour, 49 minutes, 6 seconds",in:true,bike:null},
  {d:"2024-01-23",n:"Wahoo SYSTM: The Bat",mi:18.71,dur:"59 minutes, 44 seconds",in:true,bike:null},
  {d:"2024-01-24",n:"Wahoo SYSTM: Crescendo",mi:18.11,dur:"58 minutes, 10 seconds",in:true,bike:null},
  {d:"2024-01-25",n:"Wahoo SYSTM: Cadence Builds",mi:10.15,dur:"35 minutes, 48 seconds",in:true,bike:null},
  {d:"2024-01-26",n:"Wahoo SYSTM: 14 Vise Grips",mi:16.86,dur:"55 minutes, 11 seconds",in:true,bike:null},
  {d:"2024-01-27",n:"Wahoo SYSTM: Endurance 1.5",mi:26.11,dur:"1 hour, 32 minutes, 19 seconds",in:true,bike:null},
  {d:"2024-01-29",n:"Wahoo SYSTM: Tapers",mi:13.73,dur:"46 minutes, 52 seconds",in:true,bike:null},
  {d:"2024-01-30",n:"Wahoo SYSTM: Recharger",mi:8.57,dur:"30 minutes, 34 seconds",in:true,bike:null},
  {d:"2024-03-03",n:"Afternoon Ride",mi:18.03,dur:"1 hour, 2 minutes, 42 seconds",in:false,bike:null},
  {d:"2024-03-03",n:"New Bike Shakedown Ride",mi:22.05,dur:"1 hour, 20 minutes, 23 seconds",in:false,bike:null},
  {d:"2024-03-04",n:"You've gotta cross over the anger bridge and come back to the friendship shore.",mi:27.14,dur:"1 hour, 29 minutes, 25 seconds",in:false,bike:null},
  {d:"2024-03-05",n:"Afternoon Ride",mi:26.9,dur:"1 hour, 26 minutes, 8 seconds",in:false,bike:null},
  {d:"2024-03-12",n:"Afternoon Ride",mi:26.42,dur:"1 hour, 33 minutes, 14 seconds",in:false,bike:null},
  {d:"2024-03-13",n:"Afternoon Ride",mi:30.37,dur:"1 hour, 40 minutes, 35 seconds",in:false,bike:null},
  {d:"2024-03-14",n:"Afternoon Ride",mi:30.33,dur:"1 hour, 42 minutes, 20 seconds",in:false,bike:null},
  {d:"2024-03-15",n:"Afternoon Ride",mi:26.21,dur:"1 hour, 27 minutes, 22 seconds",in:false,bike:null},
  {d:"2024-03-16",n:"Afternoon Ride",mi:23.78,dur:"1 hour, 32 minutes, 18 seconds",in:false,bike:null},
  {d:"2024-03-22",n:"Wahoo SYSTM: ALL Access EF 1: Tempo: Blocks",mi:20.23,dur:"1 hour, 9 minutes, 9 seconds",in:true,bike:null},
  {d:"2024-03-29",n:"Oh the humanity!",mi:28.07,dur:"1 hour, 32 minutes, 51 seconds",in:false,bike:null},
  {d:"2024-03-30",n:"Afternoon Ride",mi:17.08,dur:"1 hour, 26 minutes",in:false,bike:null},
  {d:"2024-03-30",n:"Afternoon Ride",mi:17.72,dur:"1 hour, 5 minutes, 4 seconds",in:false,bike:null},
  {d:"2024-03-31",n:"Afternoon Ride",mi:1.64,dur:"6 minutes, 51 seconds",in:false,bike:null},
  {d:"2024-03-31",n:"Allow myself to introduce...myself.",mi:1.59,dur:"6 minutes, 25 seconds",in:false,bike:null},
  {d:"2024-03-31",n:"Evening Ride",mi:22.02,dur:"1 hour, 11 minutes, 15 seconds",in:false,bike:null},
  {d:"2024-04-01",n:"Afternoon Ride",mi:26.39,dur:"1 hour, 27 minutes, 16 seconds",in:false,bike:null},
  {d:"2024-04-08",n:"Afternoon Ride",mi:30.22,dur:"1 hour, 38 minutes, 46 seconds",in:false,bike:null},
  {d:"2024-04-08",n:"Yes, destiny has her hand on my back, and she's pushing.",mi:3.38,dur:"19 minutes, 11 seconds",in:false,bike:null},
  {d:"2024-04-08",n:"Evening Ride",mi:3.38,dur:"17 minutes, 48 seconds",in:false,bike:null},
  {d:"2024-04-09",n:"Well, no - unless round is funny",mi:27.81,dur:"1 hour, 33 minutes, 20 seconds",in:false,bike:null},
  {d:"2024-04-13",n:"Come Mr. DJ song pon de replay",mi:30.37,dur:"1 hour, 44 minutes, 50 seconds",in:false,bike:null},
  {d:"2024-04-14",n:"I am and always will be the optimist. The hoper of far-flung hopes and the dreamer of improbable dreams.",mi:26.05,dur:"1 hour, 34 minutes, 8 seconds",in:false,bike:null},
  {d:"2024-04-15",n:"Afternoon Ride",mi:30.04,dur:"1 hour, 40 minutes",in:false,bike:null},
  {d:"2024-04-16",n:"Afternoon Ride",mi:26.36,dur:"1 hour, 31 minutes, 6 seconds",in:false,bike:null},
  {d:"2024-04-22",n:"I've always wanted to spend time in the city so nice, they named it Jacksonville.",mi:26.04,dur:"1 hour, 27 minutes, 57 seconds",in:false,bike:null},
  {d:"2024-04-25",n:"Afternoon Ride",mi:26.36,dur:"1 hour, 29 minutes, 10 seconds",in:false,bike:null}
];


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
  "vw-alltrack-2017": "data:image/jpeg;base64,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",
  "cruze-2013": "data:image/jpeg;base64,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",
  "corvette-c5-2001": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBAUEBAYFBQUGBgYHCQ4JCQgICRINDQoOFRIWFhUSFBQXGiEcFxgfGRQUHScdHyIjJSUlFhwpLCgkKyEkJST/2wBDAQYGBgkICREJCREkGBQYJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCT/wAARCAEsAZADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwB/nLYGJgmrpbk7ym5ZI+D0IxjpRFe293HM9sLFoSymSOWAxOOTt5Tjue9SpDFFPbyafGLlQAWFpdjIYdRjk1CkVyYJpGvLhNu3dFd24fcD0+b2IrhsdhbglELK0EU7fKcraziTqCOVP9azpmuILYLNPbFfMJCXELR/Nt5wV749TVy1SGe5ha2hgmdVUjynaNmYDJwp6jPoKJ1kgsvmn1C3TeymNkEyjgduOO3ej0Akgc2xlhto5yrqo/0ecSFOmTtPJ/E0r3MVu0S3tzFKGQqpngaJ1AyACV7Z96icwvcSiFLCZ9p8wTRmJtoxkgjGOR61dhgJWGeAz7SGZ13LPGvBGMH8D1oASCVvIgWPzUV5Sd1vOsyAnH8P5HHWqtytq+4P9mNwH27mRoCQM91OPTrSPbCOJY7lLLyTJhmMbRMrEdcr3wD+VS20xiWWKCG4niYgkRypOFxkDgjvnPamBPJcajNJdCQ3MbqQzxLIk6Ek/wB3/PFM8yKR52sRbKm0FwrtbyKMj1yv3j+tQanZ2FxJO7fZTPnId1eBiT1ORx6cGm3EN9ctM5+1xBY1yhK3EbfdGMnn3oBF67RQZ5rgXEiGFNjzWwcKeM/OvJ4yKCz3KOHnSMpBGUW3mDeYMKBmN++MH8Kgga1ijlWN1hd41DNG7RNkEZODkdfT+tF4vmtL9oLzt5UZiea3WQIcf3k5xjI/CgBJxHEt3OkcVrHH5RaKWBoGZs7evTkknj1rGubyOLXJ3nkuhAA/KyK6tw3AbqD6c+xGK2ppL2KO43s6nbGfJt7jiQYH8D+3NQObSQyTy28dojzplJYGgbJzwWQ4Pfr607CuOkkmktIoIb60RpJwjXTZBRTF5m5R0344PPbgjkhl+4DOCyzL5DMkskhwQVx5gZeQSPvL+I6ZqvHolpIpt7eGaJWuXZbpJVlAyNu3jBGR9etU7bTgkqJb6gTOjCSSORSh+RSo4bAOFPrTWgbl6yaSe0Ehy8Y8ssABcK/XO0jDDGOp9aVZQ8S+XMIYg0m1UlwT6gpJ+A/GnWcaWCxrcrJNInliO4MDYJzyCyk+w59KuzzpK5BR79d0vmwoyTBDjrtbDHn09KAZnrdFsnJtyNnmbgYG+oIypqCWNhmSJcbQ2ZZI94Yezx9/rVt2s1ihErPbOUj2oC0Q2k9CGyv4Uk1tHbXAlZ/3P7zBihZdrdstGT3x2osBAV+2xbYZ0nycAuROMFeRzhx371nvAAAkG+EoUYvv5iYZ6JJgjn0ParVzDMGEj/vIDIu+IKswHy8HIw44Oaes8pgSKdQ8ICbYkfcHGTwVkHB/GmhNHovhjXf+Ek0orOxOoWoCXGF2+aOzj2PfHQ59a1rjT7bxLpE2h3+Q23dBIp+ZMcqQf7ynBHt+NeN6Vq114d1GC9g8oMgxHCymMSKz/MjEZXnn8cV67BeQ6lbW+padNmOQ70ZSCVcHBB9wQQR/jXVTndXOWcLOx4VeLrPhfXrmyvLudb6J9mUdl3r1VlA/hI5/P0rsdP1vxPbaY15d7JbUP5WLpPvH0yBj866v4h+Gx4n0ca5psAOrWMbrsQDc4xkp7kH5l/Ed686034hajaJHBcWtlqMMmGO8PGZM5+baDgNkdQo+lZ1IuL3Lg+ZbHQjxPpWoIqalpTJjgNHiRR9O4/AU0aDoGqJjTNRELckIGxg/7rZ/Lis+fxB4Zvyon0y50+Rjgun7yLt1K4IHP901p3Wk6Przo+kX+nIQoAtmkUtn1B4J/WoUn6j5bGfdeC9Ss13wrFOo7qSp/wAP1pmlavrfhS58+3aa1fOGV1/dyD0YdD+f5VoWeja/YzSrDdy24hQuVL78j2U/0pieL7yI7L6xhuAOpwY3/WqU/kKzPSPC3xE03xDstrzbYXzfKEZv3cp/2GPf/ZPP1rrDFivDjdeGdRUGeCSxaTnLptB99w4/nXY+GNfv9MVYl1BdY08DCh2BljH+y46j2I/GumFa+kjGVO2x33l0bBUVrqunXpCxXcYc/wDLNzsb8jV3ysdq1uZpEGyl2VOIval8vFK5SRAEpRGan2UoWobKSIgmKeop4TNSpED3qGyrEYFKFyasCAVIsI9Km4yBYuamSLPapVt81MkG3qaQDI4c1OEA7UoGOlFABRRRQAUUUUAfJ9jJp3m2ckQsXu3bcGCOm5txxkcD0q1GDzMs1zCy/Nst5w6nJ9P6Uxi1vDbKXd51YsJriBdw54yeelQy6ba5lXy4vM4AMcpUsc8+3r2riudti6NSUXlm8JjjdscSQBSZMlSTjpn1pLO8aKIHy7V5BJtCwz4JGOuDzxj9aiRrmNooYReRgKsayL+8A5wD+Hr7U1ljiiljuTbySxtjfJDtOMHuO+aW4bGlcajHEktxPBKqBdzB4g+AcDr196q2N7o1xcLJa/ZjKVJCCRoiScjGG9vSq6QK7NIW2StFhGt7nGeBjCn2xSRqPPtkeCZXViBJPaq24scD5gM8VQiee3ksraIre6hNBvwy7EuAMAZ6H+lNidL0XLWKabNHkblKtbyAAnbz0piaVDbE3BS3W4jlBCwTtEGTrznpyMfjV2WSd7m5kWW9gbdkrxMrZb7v4ZoAlmt5tPgKW6alPGVYMIylwkZyDkA4yOcVHJfQxORJLZ5MIePejW75IGM449aiOr2xnnex+zRqqfNHIrRPxjOSOCN2f8KvSamLmEKEaQNEF4Kzqrc84NDBFRhd3m7H2iNBGDnCXEbAY6f57UwTSW8cn2ZLXLQDzhuaA5yrEjt2H60iRhU3t9mYvEfL+RoCMZ4OOPWrIa6mhAD3EaiLAKSrMrgHpg/54pgV7m4cffjuZleNW8x0WZYiewI5x2zUL30Mdw7+ZGZi6ErHM0OeM5KuCOuPzqws8W6R44II5QiqzujQt1HccdcUEpIGWFJrqEbdrpIk2CeoIPP/AOqgCZl81TJcWrxQCdt4MIPGByGT2OKZavNK4VGKBIpNrJMrgnqcpIOvbrUUiw207DbGLgyAliHgLE47jI5NP8+4Cx+St1cKQ6suY7gR/gOcd/zpitoTW8k0LSiMx5ZIsmSNoDjOM/LkHvipGY3V3GqWwBLyL5zokoYbTnJGGGR/OqM0S/fmk8p/KXy/LLw5GehByOlStD5jFpd0sYkbMLIsmDjqCpB9vwphYihkTyzBaR7lCKXXzjG0eG5IWQYI6d6a8UdtKx8mVZMSq05iZBImOSGjJHYnpSPcyxhYvtCwMYk2pHP98Bu6yDr179sUt0ksbFi0axBpCirE0ZXngZQkY6flQIgjZrm4UQ5uTuDLIdkwU7enZx+vSoVm326RGUwPuXcdxXaef4ZBj9asLGl85W42ZUqTESkwbjrnhgf8aiYfYzHbu33dgSISsisuT2cEd/WgZnShLdfN2/Z4yAJH2tGcbuo25U9q3/A/ib+yb5rS5ZzpV11kbaypIWwJMr2PAbI7Z7GswoJBG9pGEkBAUlTt+9/EYzj9KzivnMfK2XAUgHa6SLExY/7rc81cW4u6Ikk1Y9vinfTLsyMCYj8sqj+76j3H+etebfEfwlHoeqHUbaNf7K1NsuyA/upiCQBjI2v1HHXI7itvwJ4jOq2Y0e9k3X9qm6JnUgyRjtz1K/qMehrqVtrbV9PuNA1JC9vcqVjJ4IPXA9CDyD6iumymrHNdwdzw9kjeU9mLA7I8HYflxnHIBB9Ka9tvb5yjgFs7h0ODxjg/pWje6Tc6PqNxpGoBWe2bO8gnzozja/IPBxzzwwNDi2njKxMskaDhAwYL14wc81yONnqdad1oUrPUdW0zH2G9uIF3eZsOHC444Dg46dBWm3ji/lUR6jYWV6ARlgnlSfhj5SfwFI+kOdM/tKORPLfIYHIbduI6cj9KqKA0jK4QMhICIwxHnPXHX24o1QtGbU3iLw5ru17v7dp0yrtDeUDGR6kKTg+vFRSaXbNYmbSZ5tQvZpRHbJYqxZ/U/Lzkc5B/SsRrGIhiqsBjAJABI557Y9+K1NJ+Imp/D+0urbRoLFLi/K+ZdTRl2QICAFHAPXqfypx1dmRJWV0d94Y8DeLYbYXvibV7bSdMQbpEvSssgH1yAn4sT7Vo6x8a/C2hqljoUM2rmPCB4v3cCgdfnYfMfoMe9eD634o1bxLcedrOo3WoSdV858on+6owq/gKoi4MxyWwMcY9K6V7uxg1fc9L1r40eJNZn22kyaZbg5CWv3jj+855/LFdl4O+Lhkhih18NMjnAvIk+ZT6OoHP1HPsa8FSUt90DOc5P8q9F8I+BNY1rRxqAkgto5j+4imVj5ij+LI6D04OcZqW5dCkl1PoWzmttRtkurK4iuIH+7JG2Qf8+lTCHHavB4LPxb4Junu7JLiJf4mgPmxuPRlGcj6iu/8ADHxf0zUdtvrSLYXGP9cmTC317ofrke9HP0YONtUd35Zpyx1ND5dxEssLpLG4yrowIYeoIqdYR3p3EQLGSanjix1qQKB0FLSAMYooooAKKKKACiiigAooooA+XgJ3gUEXkDR5+cjcrDPTII6VC7LFNNDcS28ssalVMkBXL9uQKsyxwTwxrB5Sxxsyq0M+OTgkcnPoaaUe1nuIwJ512MgdsPjphh2zx+tcR22KTW9xKkbm0ifaNqvBNsOAT2Oe5qwZ5LZZYGa9VcjDyIJF4z0PHXNJJeyxxW/nyW7RvkosiFduD82doGO1PR3VbxbKNZLQyAO8NyQVXJ2HnkZoSERS28MiI9zPZSrJFuXfGyHGDgZA9RjrUVnHdmG3gjgEcW/AmtLoHAO3Oec8DBq0RJbPHJ/pl1HLHuZNiyhWwRjHsfbpVG0jvZYfNaWzlRJdjRywmJycA/wjpjjNMZcvS9lHcRzz3UoDALLLAsi4BOeQc4PFV5Ybeae4e5a2a4CB8xSNESTjnkY+6c1oCwmEMkVukgguGVFKTlWIByNobnNV1gMM8kVxeG4DxyeWbjymDMi/Pzkn5cHP0p2bFewGK+udhV762i8gAbSs6ugHX8cVFHax7x9nFp9pEZ3PIjQljgluntSTXmlwRiW4u7NoYbdJgYUfKRMdqkYGCNxwfTmrN3qdtp00emDULnzknFoTCodFaRd65LY4IOKfKxXRDaFUKmB5pi6PujiuA479m/A/jVxJpYQhkkABU4EluFweepHrWRH4msorMXTWskrpbm5ZmiiRnTzfLkHA+8uT9R6VFH4pt4ZpYRpbrKrXUB23DBXKx7k4xxuU5PpjihRY7mwubu43PdpCDCQDFP1A4GVfvx+lWJ7Bo0Z1gtyjKgcvCVDYHXcvvz+NY9j4kgnnEUmnmZTJBGollJ+SaMsCPl67uKkXxFpj28L/ANl3NuZbaHBgucbWaUxt1HRSM+9PlYrmhcR+TEixyvDHHKAskV10JHT5vzxQlhcrIk1pLaSNtYGSW3GHznqyH0Jrc8Aa3p+paxdWeyZlkhdzBc4kC+XJ5ZIPqcZpPG7aTY6xawRvZaejRh3CkxsWdtob5Rjrgc0+Vi5le1jBgm+zqERQzeWrSeXc4EZyMna4/D8anKxS3LNLar5qtnzTb89D/Ehpk0d59gaR7eZ4ViZWZWjuEl55HHOfb29qYL+yspZP3ZtYRKqybYpIvmA7Yz2/nS2HoU3eNg/2XzbqMQhnC3Kv5fzdQsmDjoPxoDPbzHO/LvIvmm3ZFYBeTuTI6ZqS8aO7t3kt7xiDGF2qyMHw2ejAd/5UyKGTLFIlggDMAmx4mBK8crkelILEf2h7qTarRvyuJ90blTtPBDAH/wDVTRJ9njyxEUeUDsA8eDzyAdy0OxlfbcqH2lQ0IdJNwx6Ng5x/OnRTPZRpGWUKyjYNrIOvQ4JFAFRIrTy3dbYYYAeZFtJcZ65Ug/pUb3CZQPIvzEEJIwyyhuh3j+tTIUupEYgXO0DO0IxQ577cH/8AXUdxIWkdA2xAwyXLIynd1wwI9KYmQQtd213b3Fs5iuIWV4WXcqhgx4bBK9OMV6npGsw+JNKTUIAIpgQlxGhyYZR2B9O4PpXmCDMOVhVkbBMiKCX+YjIKH+lXfD+tXXh7UVnCSXEcwWGW1jclpUyfmAYZ3L1HPPIranK2jMqkep3/AIv0I+MNHF7aqq61p4PA481T95Po2OPRhXjesTmG1MwbZblMu7AhkUEjn6chhnv6ivU7Hx1pP9pRS6bfRznBDQlSjOncYIHPeuV+N/hmG30W98RaYnm2F/CWl2dIpCOHx2DdD6MPc1rUjfXqZU5WdjktM8f2LeGl0eOeZLoXO8SyJ8jJnPXPr2IrWt7yPUIyyDzAow8TZ2qcE7W6gkD0HXI7V43o3zWslxw7LwE7HnHOOf5V6ppkwk0232JuzbjGwjYOGz6jIPOKwa7m6ZfklSVXTLRqx/77xkZ9h2IK1zniicQzQIGXA3LsUcLz0HTP1xW1cNvLBZAwJ5OMFuvOBn5cdeK5zxWQ9zbRqFTbvG1TwnPSnDRkzehRimZ8Y5Pv0q1GxbvjHPFU4gFGAMkeldD4T8MXnivWoNLtPlLDfLKRkQoOrn+QHc4FamR0vw38GN4s1J7m5Rk0y1IM7E48xuvlg/qT2H1FdbrXjDRta1VrZriW3sbHMcAUFY2bp5i7c5A6Y446VP4v1Wz8M6VF4R0FTHHGuy5dOW55Kk/3m6se2cVxaxqYN0iKx45K/hjPPPrz2rGpPojWEOrOv03WdetpUSy1+0vYfV33hR7g/MKtX3iG2uJ2g1/w3HNIDtFxApRj7jv/AOPVws1rC7ebC0sLgkb4ySVOOmQT+PPepo9W1WBo0tr+SeFWA2THen65I/AjFZ87RXIj0rwvq0Gi3Qh8P6zdWxkOTpmoxlo3J9D1U+4P5167omqx61pcF9GuwyLh4ycmNwcMp+hBFfPmlzNqNouoOQLonExU87h0br3AH5V6l4B1tRdmFziPUAXA7JcKPnH/AAJQG/A1tF33MpI7+iiirJCiiigAooooAKKKKACiiigD5YVwbKR4pdPePzgCDCU+faewHp6VY802t4/9kaYtydh2JBcncFKc8dcg/wAulVrg6i1gZ57xgiSBWSa15LEHB9+lQave3Ftcf2fH9ntZVjQzLFIoLkrhleI8sh/2Dkc9a5VHqdbfRGrDKsiIl7fNbXJiadbVyszSoAPmUDqTgjHtWb/b+mLfxSWil7bUUdFRokRRIpyIWI5BLBeRxyK5t/DOqW9xBDaRSOATcafMmW8mQHLRE/3Seme+D3NaqeEbiWO7DyW1olwFuYokbdJbXC/f2qOcfeHHt/dppWFvuyG38Sm4ezn0+0tbV7iKSISEFjHdL/DycYZcDBH8XtTJdf1XV4IreK6dE1G3McSoQghu4hkoMYwHA/8AHh6Vq2/hrTn+2XVzPOIJTHcs0OxF+0D+4OWDH5iQOOR2waW4jtvNW6i02CHzbj7RGk4LtMw6uvYH8O/GaL2Awb++vNfie9hkP2ma2i1C2APIuYMLIFHqQCSO+BVuDSdTec3NhYzMFuY9TtYiu0EygCaDnAB9j2BrdubxpLCE25itLIE77qGJY5ZHyMqirjkcc/iT2pzoIrly6MYpIy8iKDvuI9vVe4k/rnjqC+YDKj0CR1+zyJG1vbNcWsv70FvsknK8DPzK5Jx1/Cqs2hywxQRyXqS3N3aRDfACwWSF/lkJOAAFGCSeOc4ro7WTdYFLhBawqyyRpER5tuCMB5M4LZGOvP0yAW3ljiCG3mUETuStvbHL3PIwwYZwhwO3bpnorgUF8O2Uk7wi4kIElyXYR4VVlTlGyeFzyGx1PSlk8P6cj284N1JJ5iSsQ6qzGNNm5VxyMfe//Xi46SR35ijSORo28mFY8YjYDJgk7YGDz0ODz1xXnlF1BK4aSd4JQZJ4hxG2M/uT/EFxyO4Axgc0rsYw6Bp9lMiRSXZykYt18wFpfLbdGcheByRk/T3ER0axezd42udzt5MMSOuc7/NIYEfKVP6H6mraSxzSKWaFvtKYeRcbr7j7kf8AdBOB9Rj/AGaksyk1lJh5HDyKrBM+ZKcHCOP4Sv6+9FwQ3QvJ0LxFDe2800zQCdZVkQKv7w7z8wJ4z0bHP5VS8bSS+IdQGtgpDbKsKiNidxWN9zMOORnv2/Orc2G1DaVWQqgTaowsYxwpP8Ufv2PfuXyBJYFyzbwxdZB1xjG6Ne6joR3H5B8z2C3U4zT4NT0qcMTcW0hjiUtE3/PS43k5Xtt5z71f/wCEnvJbuKWaKO5kLBy7AqxMkrJuJXGcIOCQegrqljtbWeeGJiZLsebmNv3k3feD/CuOVUmqU2lW13cRSNHHIBtdpF+QAZOCG6lzzheRnP4O4LzKmn6np19CAs88TSY2xz7WALOwXBxjJ2k84q+kimUCJiXBZvOMbBJF28MGQkcjpWIvhwi1VbKdmmciO1Q5/ehUZVII6YLc5HBFUUg1PQ0Aj8wQbWGPvRuEjWNAccfeYn8KVgOlWUlmCyRXCAriRnDFWx0wwB7fpVZkS1UzJbSQo23zMLIp6/eBXIx/hVaPXYZ7hVkaeNwwCAMGidVcRjIIJyxDe2KvWwuJI45kkjkjZcxMIyoHzHglTj1pNWArJdhp9yghiOCGjYyDd7gH/wDVTXnzMGmeRCF6FXT+LHbIpbi8EsLI0as+MuWYZjww5G8c5/rTkmjePZIGLLkllTHmLxgDYeuaACeJXQKuzKkYICOAcnr0NRaLlNc07A2gToSDvBzkjvkY5psssbEozoBn5QzkFufRx1/GksxDa6la3bRO6xTI5RQcMoPK5BP61cXZkyWh3cnwy8O+I/NuRqH2K8aQ5SN0xn+9t4IP0NdLoHg270zSb3R9W1BNY0u4UgLLFh1zwwJzggj8c1w0mt+C7k7pbfUbHcRyEDAZ57HP6VAkeoxzajfafe38eiQ27PbXSlo/MfaMLz1+bjgVv7VJ3sc7ptq1zz3xp8IL7wJpt5fQTQT6KbjbDIz4kXL8IVIOSMdRn8KtaOwOlQIysx8oHY64B4POSO31qbUpLvWPOW+vppxv8x4Z38xd4GMkZwT+FQxILSAwxtsVQdo2Bf04wBUSkm9DWKaWo+/uobWK4uJJkEKLvZuuevPU8H/CuClv7zXb03xc28BO2GJVBIQV0PiDR9W8QSwWtvAz2xG+WThVcg8AE9vpWnp3gE26LJf38UCL1WMdPbJ/wq4qyM5PWxi6bY3N/cRWkEbzzzOI4415Z2PAHFe72lra/CXwotrCY59f1Dl3HOWHcZ/gToB3OT61Q+GWk+E9Ku2vbW9X+0ljaIfa3G1CTwyZx1HBwfyzUuufDfWr28vNYXW7a+MgaSTdujwAM4UqSAABgCiV7e6JNX1OJkdmd5Z9zSljvk5O4nJ4J9fXNSJPKpEau+NoyScjHHTr+PNRIsgPmdDnljjAHoCR3+tLNu8zc+4MBwcZ7dB1/GuQ6i4xieUnAbdwwLdOO3Uj0NVpOCsZO4ED5S2Aw+nPHrxUgUSEBiqnuC3X/wCsO/FKVRumUT05x9e306UAXdBv10/UPLlk/wBHnAR93GP7rc9MH+tdzo88tvdm2RxHI7h4W7JOvKn8eh+tedPEfLID7gexH/6ua6bRr86lpyuzH7RbkRu2eePut/nuK1pvoY1I9T6F0jUo9W02C8jG3zF+ZO6MOGU/Qgj8KuVwfgDXBJOYWICXoLgdknUYcf8AAhhvwNd5WxkFFFFABRRRQAUUUUAFFFFAHynZ3d7Lb6gY59Vt/stxHH5JBJZXXdntyDkdO4rO8Talbi9jN49rJ5kSSZuNLEucjnc4OQcjp2qrAuqrptvfXXhy0jivixjnt7po5CVwTnII79+tGsXc2+0Ec3iCLEChTa4kBwT97pk9s+gFYLqje97M6XwRp2meKYb9Y4bKcWYjdILZ54tqsxBJUsB2GCK6JvBVosiSpb6nDKuCrx3jMVI6Y3Z6VX+CV0bzVdYge4vZD9jD+Xc2Yi2kOOjA/N9K9Ua0TPI71ahdETnys8oPg4QSSPDqGrRmQ7mEsMcysfUgqKiu9BvJ4pY31S1n83BzcWboysO6lX4/KvWWs0/uion06Nhyop+yZPtjySTS9ZZ1lkk0e7niULFIJmj8sdchCm3Pv+PXmofsOuW1w0sOlblf5zsuYpfLl7yJkj8jn+VetSaLbyfehQ/gKryeGrNv+WCD6Cp9mylVR5YkF1aJMzabqy3MozJdS25lMp7q23d8p/H39kj1O0jtUjl82y4YyLLG4dc4ykZZRhT7n657+mN4Xt/4N6/7rkUxvDsij5Lu5Uem/NTyPsUqqPMEu7GW/ec39vHvQhxC4b7THj7jjPD+jfn7xSfaJLY+dGYY0ZXijhOTZD++T/ET/Fjnp3wK9IuPCzzD940U3H/LWBG/mKzZ/AtuxydO01vpBsP/AI7ik4saqI5CKzSWUTC2ia5aECaSFh5ccZBAWIYGGYc8d/bNMjRlt7hJJJMSssf2pf8AWXSdoz6OOMnHIx14z07eCUj2+XZPHsOV8m7kXafUAnANV5fC0q7yG1RC/LESRyZPryuc9eetDRSkjAJSO4it2t9qQqqqkfWEn+Fj3Rs8nnBNSCPMDmcvI4ky4Q48gj/nng84747Y+taB8NzwyRSx3NwrRKUXzLMH5T1UlSMioZNIu0jVI5rICMfu/wB3LEUbOdwPzcnv/wDWFRYfMiKS1E13KrfMlxHuJT794wGQyn+FR1HuMdc4rMZZ5baIYuGjBcvkrEiE/wCsI7zHGAozyKtz2V/N9+O2YuNsjRXQDEdgu5RtwRn/AOtSLFflo2u9MmlMbbisLIys3/PTAb72McdMj3qhXRnW6SXUbNuZ1klBbyxt+0+y/wBw8DePUA1PPmJLhg6q2d3mD/Vrzgtt7uM429DkH3qK4WaNJd1rfwGRiZSLd/3o9VwCEZujdj+lNlv4JBIfMRZ2IIEnyqv+1g9XUce+c0aj0KN1pME8rPCvkOFG04GMKCAzDou0sSwGMHHGKyriG80tI/IfMUxRUYHcjKcIufoqu3PQmtxWiuJ54o8yLIinyww/0g8YdiD8pB+8O4/OrsyIwlWQtIfLyRGoPmMcAmMYxtbAUjt19qdwMO01uK6sl3b7aQKNsZlOxwTv5LA44x19atyQKwYNapFKrN1CNsG7rlTzUNzpFrIzyIY7cqitIseWQsSvC9znaFBHoRiqWbzSG+zzIu3hWEnzRtnknPbqzHp0GaT1GjUaMQklnZgeGI3Dv1AwaajRO6bsOpxlcx7pOeozgg1JbxJe2wltoSmcMFKkbGODgkEZOCM46Zppm2BhJKImVss+XGMNjI3KaQyT7DcCIMgyxBIUbwANuMHBIzTPGlzdvq5sRcStbw21vsgJwkYMKE4BwM5J96hd1cRlnSVcBmTCEt8p+YHg1T+IV+ln4j2fJsFpaklzwP3EfHPA4yPxFVHYhrUgi0u6ewa7iTfAvUmTO3p1Bz6iqk29EKhlJYE5JwWx+IqK18UWK+GL20F7A1y8i7I8feHy5xxjsabDdvMi5Yso4b5jnHPI9RjBI9GFUIonWdUtZVt0nC2+/B6gDJ5II7V0+k67oxt59Gu72Qx3jA/aVjY+W4xtPPXp29a5e9tWEitn5TwHABB74HA47596bpsUf9oWamMhTNEemAfnX6c0K5Mkj0S0ksbBrixv9DS4MDgCWK5OXUqCGHy9COeemaj1TULJpoToq3VjGIyksbTZZmJ7Yb0/rU/iSOKPxDeTsmCscIDcDH7ke3fp1rMR3GSTwDyOSQM9OCRmpnGzaKhqkxQj+VuZSMjGAuOPTPvUI+dsBizqpCq7bsew6n61JJKkSGWeMKqjA2DGSR0GQOvfnil06z1jXgTpdhJ5QPDjkf8AfbfyFJRKbJYLS5uFfbsUxJlg52gDH4ZA/WqxYRL8pBLAHcucfWtmLw74i0r7RNPY3MwMJCeXIshDduM1zg1Qqzx3itHIp+Y7NrqfVlIpuNhKVzSiZpYcHBPOQTz9Ceat6Ibo3dyLGaOKYRZ2SjesgyODzwPQ9jWfGAxUhlwenPB49z0HeruiSxWFzO09zJapImFeOHzNrZHUY9qUdHdhLVaHW+EdU1W0vFtb6ynsp5istvMUJiMy8qQ3oeVOfWve9Lv01PT4LyMbRMgbb/dPcfgcj8K8j8JWniXVrGX+z9Wgu44oVkhSaHakmWxtLYyvAPrXq2jaSNJt2j855Gdt5z0B9AK0py5tTGasaFFFFakBRRRQAUUUUAFFFFAHyD/wlc15pkOjXIn8u1QIkThcIxBGCVORxjrWVq9nGiWmLOSRRGVAjvVi2NvOQCc5659q11sbKylvlmmt/tJIzI0TEbh3OBzxWfrMdrNb2+/+yZOHVWnEqgtkdNvQ+v4VzXuzpSsdp8Et2m+Ib6V7bVBD/Z0zlTOLgNtwcKoGS3BwO9emL8QNAcZlGq2vf/SdLuUx9f3Zryv4JLDbeObbYmkhpbaePdbXDs+NuR8rH2r3xy65w7DHvXRS2MK25z6eN/C8ykrrlkhHP71zGf8Ax4CtSzubbUbSK8s5o7i2nUSRSxtuV1PQg+lWHLMCGZmHoeaYkKRoEREVFACqq4AHoAOldKRzths+vSgoMGlKYPBPTPelww70WFcYIgfQ80eSCKkG/wBaU59iPpRyhcgMHy9PWmG3B6irOD/d/Sjpxt/nRyoOYqG1H92o3sl7qKvnjqMfQ1V1HVNP0qETajfW9lF2eeVUB+mTzScEUpMrnT0IPyjrUbaZGSflBrCv/jF4E0/cH16KcjtbxtJn8QMfrXPXf7Rng2EkQw6hP77UT+bVPs0xqTO2k0O3kzmJD9RVaXwxZvz9nj/KuBl/aW8P7iIdHunwM5a4jX/GnQftEabdECLQpG9hex5/lUukuxXO+52MnhS2H3VdP91iKgk8K5GBPPj0L5/nWEvxwsSN0vhzUVA6lJo2qe1+N/he5O17fUoW6EGJWx+TUnRj1HzyJbnwTHL99YZP+ukCN/Ss6XwDACWW2tQfVUZD/wCOkV0lr8Q/C1+QI9QeM+ksDr/Q1pxalpd2B5F/avnt5gB/I0lRi+oe0kuh55L4MMW3YsqbRhfLuXG36ZzVDUfB8kekXsqXE0SxW7nbJsdWCgnBG0cdfzr1Ca3DLuUhh6g5rL1m3/4p7UAOCbeYZ6Y+Q1X1cSru9jxjT9Wkvr6Y7InBiCiKFo2wAw4HQj6f1q8uqtNe/ZlXyn4K7lJCnqVIB6Djmud0+8a1aZhNlktyQDKG5BH95Qa0PCR1LxE8l4dKt5YkDlnaUDj5SQAF5PTuOtcvLfU7G7aGrMvkRKzSFYz1f5uG2k4AIPFeb/HC4lfxndwGQmKOxsWUdOTbx8/WvUAkqQr5bASY2qdhwoweDhuvWvL/AI2RH/hNr9v+odYZ/wC/EfrVUyKjOBsL54JVWRsxnjnt/wDWrtNPvGjC/M3ljBGD90+xPb9AcHtiuAC+tdf4eP2mwQMzZXKZHt0/pVSXVExZ1kUhZUUN5a4DLlT69OecZyRnnHbFP0rC6pZjLYM8Z6YByy/rVTSl3Ak4AX5gcZJzgEdPpzknirOl7RqFljaAJ0PzdvmXkcd8etJLVDfU9E8SeWPEt6zL8wih+bOP+WQ96y98aEfNPwMABie/TqcmtDxJOX128eOQFWjgKlccgwqfWslCXIYhic5AwWI+vX5qmp8bKp/CiR0MlzpsJGVluljdCgwVYqCPu9817lHp8lmghhhjSKP5FRVACjsBivDLYH+19G3Rkf6bHkBcBPnXvgV7+byTccsTlucgGhVXDYzqRuUWEjFlMQJXr1Fcz4t8IWOv2zNNCYLiMEx3Kgbk+vqPY8V16XJW4lfg5A6j2qHVJg+l3oIQD7NJzz/dNautfRoyUWtUeC6alxaXUtjckNLC7KVGdo24+YH0OelXtgBzmMMCR8x5/P8AmapXRQeJ9S+6xEr9duR93p3qfe/ljZtJbj2rnqK0mjrg7q59N/DpEXwXpRSNE3QAkL65P510dc58Os/8ITo+Rg/Zx/M10dbx2RzS3CiiiqEFFFFABRRVXUtVs9JtzPe3CQoP7x5P0HegC1VeXUbOCXypbuCOT+60gBrzPxL8VpZi9vpCmFOhlP3z/wDE/wA64I6ndtcNcGdzI33iTnd9c9aVxlApNa3EyS3dzKHiIWRkHynggjtkcj8awtenNlBZzi72lZGyz2ocnGMAgdPXNbK2cVjdMLfzZAyMARIDnKY6Y9/zrN1lLuGwh8hdUZkdsLbsN/QZyfTNc6udGhc+EN6p+IGlBryzlZpJEAWzETtmNuhA4r6Gk+nYV89fDG4vz490X7THrqqZwP8ASFBjHyt9419CSN7H0roomOI3Q09T+FGOT+FIMt0DH6DNIXC/fO368V1I5GOP9DR61GbiLI/fR/8AfQ/xpRMhPEin6GmIkx1o7GgHjrx9K5zxX8QNA8HwltRvUM5Hy20RDSsfp2+poem4JXOk6kDvk1zfij4h+GvB6MNT1KMTgcW0P7yU/gPu/iRXiPin40eJvFjm10UHS7GRigMLfOw77n6/ULiuWi8OLG/2m9maZs52P/EfUj/HNTDmqO1NFSUYK82elan8ctW1tZP7Ds00mz+6LqYCWZ/90H5R9cGvLPEmtTXt980st/qk55ubtzKyD154H0Ax+lWNU1AQQM5+6owqjuewrD0mF5Fkv5TukuPun0T/AOuefoBXdHDxVk9Wc/tm7taIlW0giQKY1kbu7qCzH1NNfaOAiAeyipZATUJjcngE1u4pGPMyCVUcYeONh15UGoZUibBMa59QMVZkjYHBGD6GonTipcUylIrJLJbMGQJKoOfLlAP5Guk0bxS0QDRYG37yYAZf8RXOSJg1H5L7hLGSrr0YVk422NVLue0aD4gj1KNfMNtID2kUN/SujXQLe/AktNQuNOk9beRin/fBP8iK8C03W7mwuRLGFWZeWjYfLIPUf5/+v6h4Y8dR3kQMbbWX78Z6r/8AW96XLCekkTKc4axZ0t5YeN9DQzWV0urW68nylRnA90Zc/kTVG2+JMkdtNY6lY25SYMrHfJC4yMHacuo+mB9K6fS/EyShfnwfrWpeWGj+IonW+to2eQYMygB/xPf8a5qmEtrTNKeLb0mePXWhm1ne8thfNp8sZG6SbeFJ6AkZGPcgVB4bgm0bzbWO4VId7EB3DEKwAOSVGeg4/wAa7fxZ4G8SMYbnSrpL+K1VliS3XyZo1bGRhSNw4HGSPbk1wC6/4h0uUpJL5Uy/IQyeUWwejDGM/QA+1cEqUo6S0O+FZS1N6MweUAYIgueVQxfvDg/NwR/k1538Zo1fxXfSLgg6XYH/AMgpXap4qkuLRk1GSZyJQ4dAC0a7SCMAZYZweM/SuP8Airc2uoard3NlPHcQf2XZLvQ5AIjUEH3yDx14pRjYqUrnlqpXXeDog1sxJBHmkbc89Bz16VywX/OK63wZIUtXXr+/zjv069RxTEbVhGqTTbAVxge/3unapLUoLu28yQKPNQbyMBcsOc4/rUVg6LLMCwRSAMk/7X1qSE+XMrKcuHyG6YOeoOODQ9Ctzv8AWLhDfySQNH80cJ9VA8pcY56VQZfMDM3mEA5AUZI5+nWr+vFTq8nX/VW/y4O3/UJ14qp5I3E42lscLjt3+71rOfxMuHwoIBJ/bWjSMo3LdRnGM4+Zf9mvcY7mKU5GOvPJrwTUne3ubWfG6SGTepcAjIwR/DyPyrUi+JOrxurG10tjtLf8e+PX0ajk5luRN2Z7QroJJD0XA5z7UzUJIm02/wDnB/0aTjIz9015fJ43uo/CVvqxsrdpTqRh8sSSqmPLzn736dPasq4+Klxe28kE2lLGsrFWNvdvGT2PODxzVyou61IU1Z6GZdhz4l1TarNmR8AEjP3enbNWY2AbYR8yjODjNVrwAeLNVUqCvnSdBk449v61JExL4w3UjJz/AICs6vxM1p/Cj6h+HMgbwPo7ZHMHr7mt95whk3fLtXdz3FeI+HPiXqui+HLS2fTbd7S1UIpUt5ki5OT1wvf60/VPjk5UpBpLhH5jd7jOR+X6dqTq8qskR7NtntiTK3QimzXKRg4ILYPGea8Hn+O2ptIqW+l2kS5yfMkd8/yqUfGK6jjE09labuvyswz6Ac9KiVefRDVLuezy6nsJwcsQFVcfxEjH8z+VWpr6GzjBupUTC5ZicAV49B8VLp2jup9JhtI1CsFec7pNuSuFxkDnv2x1rmvEXjbVfFDk3M/7o42RRj5V56479O9VTc/tEtLoem+JPivaWSmDSlE8uP8AWsPlH0Hf+VeYarr9/rM7T3lxJIx9W6f4fhWNBJPcSlYoZJF6khST+PvVr7Hdnpaz/jGRXSotmTdg3+mKTfSNbXC/eQL/AL7qv8zURManD3dih9Guo/8AGq5WK5D5UElwBYwWkg8svt8/DfdO7v0FUNRtY30VFEFqUEzHaLwKDkDktng8dO9aEc8KzW/2OXT4p2XYSLc4LHI9OAQazr6a3fSp43n0zKTKT5luwUAA9cLyc9OP51zR3Otlj4cxG18baHLHZRoDdRhnTUlcAHIHy55PtXc/Gj4xt4Lul0LRih1N4/MnuCgcWoI+VQDxvYc88AY4Oa8z8MX+k6T4o0u+aTRPKtbhJpCsEithTk7OAAcA15lq2oz+LPFF5rWqTvCl/dNcTzAFjCrHI4xztGBgf3a1p+RlW1ep6pLqus65YQ3N14n1m6aRAzGK8Kx5PYKowPSsWaxUbvMa5nJ7yzMx/nVvSfBmhhhP4e8TvIMf8spkbd/vJ/TArTfRruOLFyUlcfxxxlMj3GTz9K9unShJaxX5nkTqyT0kclJBAhP7gf8Afbf41AZ1hOURl+krj+tbOo28Vv8A66SOI+kjhT+tYk6xnLRyI6+qsGH6U5Uaa6IFWqPqyeHxDqFo2be91CEj/nndyD+tN1LxJeavGI9Surm8VeF+0FZCv0Yjd+tUlXdnIUH/AHqbMioRkDBGeCDWbpU+xqqlQdZ3wsH3WtxJF22suQB1x145qf8At+7LlZJ7e4U9BtKMo+vSqEsRC7vKbpx/SqdyBbQs+yR9vJ2Lkn14oSUPhdhu8viVy3q89zfKqLbv5fcxsGIzwTx6DOPetFNQsyioCYQoChXXGBXIf2/ZBseZLGfR4iP5VpW1zJcQiSOZtp6Zzz+dOFTXR3FOmrbWOgSSCRsLIh5/vDmpZJo4mCrg54wPWue3zd1jb6oKBMw6wLn/AGSR/WtHJshQRt3pjkjSYyRqcbTubaGYdAPw/lVD7WIW8u60yYejJIcH9Kz7t1u4DDIJlHYh84P0IrMXT7lP9XelQOgKkY/WspymtEaRhHqdZHHpd0vIv7dj3O1wPwwD+tW4bW3tIVJZJVY43joT6Y7GuMQazDzHqyD2O6pbPxTfWlw1vqSJKjDBxj5h65rN1H9pF8i6Glq1oLeZyn3YzvX/AHT/APW/lUMU01rMs8EhjlXow7/Wp/tvnKryeXLGRhGRudvowPcVVWQRoEMbOBwDkcjtWmj1RFmtGdx4b8ZC5ZYZSIrkcFM8N7j/AAr0DTPEpSLJfoK8DwJJAAsiEcq5IyD+BrpNI8a3OnwfZ7vTre9xkea8jhiPwYD9KfPbcylQ1vE+hNG8RLPj94AO5PatLVdJ0PxXD5eqWiTtjC3C/JKv0br+ByK8D03x75L7ltJVA/hEmQK6jT/ihqJiBsfDWoXT8dW2r+YBqJcrWo4wmnobN/8ABj7PLKYLq5urN0PlzRKGktn7GSLrInY7DuHUKeleTeJNF1fwtqxt9XswiSDMc0fzxzL/AHlJ4dfY8j0HSvXdO+KPitY3M3gqONtuUMl9tAbHGenFRap8Xo7qBtN8WeEdNurd/neKG/3lBj7wYj7w5zgg9OetcVSnDY64Op1PnvUvCUqD7VZyRzxSEsMH9M9j7HBq54URoIJYpFMbCflT8rD5evUceteh+f4Q03WkvdHnuZLFpQJ7G9tyQYz12yIfmx2JUHpUWqXPhSVnk+0RookO1kjlVtueCcR4B9Rz9awtbY6E290cvpzCOabbKMFehYH+L/eqfT4wdUs+BIpmjzntlxzVuHTbN/Nn0nUTqWW8tI4beTJHXqT19sU+w0LUlvbe6ntpIIopVZjOpjxhgSfm69DxSXQt9Tq9bGNVnJUlRFBxsyDiFe+01QUFsEqOeQ2OnvyvX2p2rzw3eoyzRMkkRSIclcMVjVe4zwQaytbnNvp0n2eNvOcHayoSQfXgcfWoq25m0OnpBXKUniKO91dbNDH5GdizA9H9R7Z4q7IbtGAZZAfLIII781wtrFcrMpFvL5gO5MKc8V6RF4Z1rV4YruzsnniaELvUquWxg8E8VlRcudxIk7q7Ldw83/Cu7c7WLf2wcjbn/ll9K5PfM2NyY+c/8swO49q7ebw1q58ERad9kK3UWp+e0ZkUHZ5eN2c4rmz4P12IEvZPgEscSKfQ46+xrulujJbGjeOo8U6uCQCZpMcj/Z685x+FOAQ8FRycEsQefz/Oo7gs/iTVJRkxmZyGAJAPy98YNT7G5ZF79Tnj9Oa5avxM6YP3UbcWsadYabbxTN5UrIV2gvnqecKelYmt6pbXciJZGVYWw0isuwOyg/NjnHA/xrNunEd0y5tFkPJWVWLAY9c81MHlNjIJI4l2TD5oU2CQbGxlj2HX3rD2lN3s9RrmuSrEzICiB0PR1JwffNaenxLaQS3hgUSQLuUhC4J+pPy/UCqMWrW1lDLDaSQskjjLE9BjkYxj2q7a6rBeaFerHt3PH1AOMjJPP0rKGJp8yiVJOwy31LVLyN5hqJiUSEKBGpIPXr171SutX1SKVlbUrolcfMHK9ee1N0tz9iG0LuMx+8SOir71Qv3LX0meMheBzj5R712yVopmKd5NEE1/fMzD7Zdc9f3zf41XeRn+/I7n/aYn+dRXJYNx/KqplYHJI/GquM07KKKa6VZEG3DscdThS39KsSpaG1mZINkiR7gwY8HKj1/2jVLRGL36EHefLlwAM5/dt25z+VX7pLhLO581JY4/LGCYdoJ3J/sitoRTi2Yyk1JI6831/LcW0g3xqLQ2zIoPMpBHmnjrnB9eOtRR6lqljcW1u4mnNm0izts/15JIBOeuM9/SiQ3cltEktq3lxgplp8ZBOcfz6U+OOWO6ujDE0oKsGb7QMbBj5sZ4xXHdnVZGP4rtNRPhlJPtkhKW0xkIjzuOf4vTivLII7UWkQRCLh4ZGYsTuOFya9f1axW70SeGJYBPLFMMG7BwdvykDPJJ7e1eGeG7wtq0bXcrFSpjJc9AwINbUmY1dS4dCvPs6XREO4jIKttYfiKqzeI9V0pDDHqN4sh4CrcNtA9eDU1vqSWsNxYSM3mRsyxggkVzoja+vCoOB1J/uqO9aq6Jm4P4V94f6ZqlwT++uZm5PVj+NWI7HUbBhMPPtiP41zx+VdDb2lrpsKRXZmi3rvW2iGJGX++5PQfXipg+iTXUlpHez2NwrbUN3hoX9PnXlc+pGK0UV1M7voT+GvFdtHiHVo4nyflu4kyfoy/1H5V2EMmhamR9mvrCduoCTBWH4GvNtX0Oa2eVhGYriE4li9fQ+hB7EVmRxC5j8zCHHDApkg/hVyqygvIz9mpM9U1S0gtrXzEfzUD5ZA6ncACTyD7e1ZMUT6gA1rB5EJ5DScsPx9K4ZVeLG2RkPsSK0IdSnjth5V2iSIeQWxuHtjGKyeJbZpGirbnZR6RFGTvELt1Ln/8AXSmzDYMahz2xHXKQ+KL9OHkDgdCrg/zBq1B4suInZmt4ps8nemCfyNbLFRXQh4dvqby6fIMgxnP+7Q2nyf3P6VSt/Hlt/wAttNRT6o5B/UVr2njDR5x+8trhM9xGGH6GtY4qn1Zm6E+xR/s9z1UCk/sw91FdHBqPh+5HF/BCT/DMGQ/qKtx2mmznMF7Zyf7syn+tbxqwezMpRmt0cReaZMIJfIUebtOzJwM9q5JPDOsibmAjJyXLgj69a9mk0LdygDf7pzVeTQZF/gP5UTpwnq2KNWUdDhYtJaCMDHzEckDrQbSQHjNdtJoj7RhTVWTRJB/AcfSqUVsg9ozkRFKp/wDrU4zOGzFHt2gKwPOWA5P4+ldI+kMP4aqx6US8429JMf8Ajq0nEamULbxBfWhBRIuPWMGtRfiHqggaCS2s5I2GGBgHI+o5qJ9II6rUR0n/AGaLD5iRfGZVdv8AZVrx3BfP86ZL4uScqZdKt22jA+Zun51GdJP900w6O392o9muxftGPbxLZOfn0eL8JpBn8mp48SaVjDaHFj/rvL/8VUB0Vz/DTG0R/wC7SdKPYPaPuXLfXtAhzt0IRZ4Pl3Diug034iWFgmyJNTh4x8t8zY+gIIriLqxitP8AXyxxf77AfpWVPqGmxHAui59EQn+eKzlyR3NE5M9iT4jaRdrtuZbpu37+CCcfqoP61ag1nw1ejar6WCfWOe2P5xuR+leFNrNmPu/aPyH+NPXWrdSP3sqf7yf4Vk5UmWudbH0nYxWM8Kx2d1IV7JFcwXC/98yqGqydMNvz/wAS1c9ftumNDu/4Ep2187WWuS5zb3QY+itg/l1rqNH+JOt6QwEN9OgHbccflS5IvZj5pdT2L+zpp1Lf8I7pN4vdrO7wPywP51APC+nagvl3HhzWIQuT/os4lC568Av/ACrmNL+McVwVGrabZXZH/LQxBX/76GD+td1ovj3wrqhUSXN1bk/wSuJlH03gsPwaonT8rlRn5lKy+FWkag0iQ3usQcfcmtCCD7/dz+VVtV+DmrWiFrB7bUM8+WrNDKR7K5AJ+hr1TSzpt5Gv9n69IjkZCLJkHH+yxIrXVdYgTDS2t9F6ONp/qP5VxzstEbJs+StU0XUdL1aaK7t5LOZSMRXEBjY8dAW69O1Sald3FtYiOFnWKNjuDHq5GPx719W3cWn6jbG11bTMQt/DNGJYh9M5A/DFcZr/AMDtD1iLzdEuTYOpLKkf72En3QncPwNedVw0nLmNFI+Y4pGcDamWzgKo711GmQtamRHuY/M8ogxlhjBHp75H+FWvFfwi8XeHrh2NiLm2DH99Zkugz6j7yfiKxLLwrrRuI3axnUIQ28jAHuc1jWp6b2KgrsljvZ7YMsV1LECckI7KM/hUSCSad5XMjsykl23Ek+vI5rYfRNYuLhs6RKC5J6j+pp6eGtYZlU2Myg8fNKmP/Qq6vrcbe9JfeR7Od9jm7rKttbzF/wCAH/CqkqblIbeeePlrsp/BupSR7xCMkZ5YZ/nVGXwTq8aZeCQD/ZGf61pHGQa0aI5J9jl9vlgALIe5xgfrSmRicCI5z/FJkn9K3H8J6iCD5YK4zy2DTW8MX6YG2P3xIvH/AI9VqvfZkuMux1UhmjtIy0mniISMVwzHLYGc4/Crwnj+1Tx2lxaoBC5K+WzZTblhyPY11w8L2WAC82zOQuUGPyWpv+Ees9xKvcLnI+Wcrx6cAVt7Mp1Dgba8sFNsQqmZZtxdbXggbSO/bn8686+IPgUeFvGWq6dGHiijumkj+Xh42+dCPTKsK+iYdLtECrtmITkZnc/1rm/iL4Tu/EDf2rYo0t6i4lT+KZexGerD09PpVJcqJcuY+ftc0qD+z31NVKz7drdgcnGaxvD0SRxy3MoG1d0jfReg/M/pXVeJy40y6hkBR0xuQjBBBHBFYWjxmPw/dymCOddiqySA4IMuDyMEfUVdN3V2TJWdi0Nuv2raJczKNUWPzbSYthZFY7/s5z0Hdc9Dn1rMtNHj1PV7S3vZzZh4B5oYfMWj+Rl9m+WrGtWmkL4gu4zf3ml3dvOU3TJ5qZU4BDLhlPGeQfrXXS6E19KnmoIbqIEzXQXAbgKxC5GMggc9SR0rV6kbGVZ3UWraRLMsolurMyyeUF+5a79uwnvjIYe2R2rnb22Ol6oUB/dzjIweD3FXNAvrCx1y2trKKWSJpfs891P95kc7CFUcKOe+SfUdKo6rMBaRwtkyQScHPpxT5rqwra3JPMOP5ZpDMx6pCR7xj+mKh356UbsngU1dCJS0LfftIW/3SR/PNASzP/LCaP8A3WB/wqILK7bUQsx7LzSPDPH9+GVf95CKe4E3k2h6XMyf76H/AOvTltIyf3V7Ax9CQD+uKp7yOpxTt2evNHJHsHM+5qxrqUSYikZ1/wBliR+hNKby8jP72FD/ALyD+q1kBVB4UA+o4qeOedSBHczr9JDj9an2NPsUqku5rjVpVA228an1Q4/rU0fiS/iOVaZR6Bm/oayxeXJU/vw4Xj541bJ/KonvHkGHhgPuhZD+hqfYQ6Maqye51tr43vo1BMkwAPOct+hFJeeM5L1t0knkvjBaN2TP4dK5i0njyyslyMj+GVW/mKla4tD1kuI/96PP8jUOj05hqp1sa3/CR6kGHk6sx4GFaVHyfxqUeKNbsjKWjt5gz7mYx99o9PwrBd7U/wDL1E3sY2z/ACpYrVnUtGqMCcgI4Bx9Aa0jGotmJuD3RvJ4/nBBuLGNh32HFWU8d2EpG6NoD/tLuH6VyptPIJYwyKe+ckGq0iwPwQua1Uprcz5Is9DXWxcWz3FmIrpY+XWHG5R6kHtWbceJrzOI4YlHq0qg/wAq42yMtldiW2crhSGBPBB7f59KSS1mmkaR5VDMSeM1jOdRvRmkYwS1R13/AAkuodWSDaOT+97Vkax42u9nlW7tExHJU5P59v51hyk2cbFn3MeFHas0BpnwMszGpTn1Y2o9EOmuJrly0js7MfXOakhsZZTwD9FG4/p0/GtWz0qOBQZhuc9V7D29/wCVdLa+Fr65hV5VisoSCVM5254zwv0HpVqPcRxy6Vj70Ux+rqv+NPewj6vDdKPXIbFdemiaSVz/AG0jf7UVs5X86ePDAuQPsGp2lw3ZGzGx+mf8afKuwHD/ANnq5PkzBmH8LDDCpoL+6smCzAyJ/dbt9DW1qGlzWkgh1C1aNjypYdfcHvVG4t2RPnzND/e/iX/Gpa6ofqaVo0d7D51s5YD7ynqp96njubi3b5WYVzkUk+lXKXFs/HUHqrD0PtXU22rabfwiR1aEkfNxuVT6ZrWNVbSIlB7o1tK8X31i6Ms8ilDkFWIIPqD2r0/wv8c9SsiiXbC7j6ZyFkH9D+leQnT0lTzLeRZF9VOag8qWFu4qmlLclSaPsDw38UtH10BUmVJiPmRvkcfh3/WusglsLshlCBz/ABL8h/Mdfyr4is9WuLZlO9vl5HPT6eleh+Evi1f6e6RTzmaIcYk5/I//AK65J4dfZdjeNTufUptFuF2yESr0HmcN+DCuD8VfCu5upJL3RbgCZuWtpyFDH/ZdR/6F+dReGvifZ6kqrGZS56xsFIP0OcV2tnrj3UsIULBGTtkWRweMHlSM4OcdTiuKdBP3aiNVJrWJ8/6naX2k3L2l5aS21xGMmKcMrEeqsuQw+lFtcF5RGtq8gJ+/5v6ANya+iNY8J6N4itvJ1K1F0uPlZ3Ysnupzx+FeW+K/gr9kR5tOW4vIFywZWBnT/ZKnh19wQ3PeuCrlrteGxtHE33OYkl7C4XDL/EvAx69OaqJPGJDGZkDHOHXK/r0zWFfWkulyuhuFjlUAHlnA4zjrjPPI7Vni8vHlY+ZbXcwJKpLCgJHtgZ/OvPWH7mnttTrJTeKwaO8Plt33KT046j0qMXFyqAyurHGcvlM/gAf8K5M3l8yMLzRbJlJ5yNiqM8e9QQX+mWLTJ5WkxM7gDFzJkDHAIbP6UpYa3/A/4cPao+kfsNmp/wBSv1OTThDaKMiKP/vmqEurWqn5rmHA7eYKqya9YKebuH88173LN9zG8UbKtCv3VjBHHKin/aIWBBQDt8oNc1J4i08Zxcrn2U/4VA3iPT163JH1BAo9nPsxqce43xr8OPDHjiKQaja/Z7x12R31v8sintv7Ov1/MV4Lf/D2fwTqN54Vv2a8N7ZSPA8a7C2HLDbu4J4/pXuz+KdKi+Y36E+mT/IV598XNYtNW0uy1TTZjJqWjz+fGVVvmiPDqT+AP4Gt8M5xklJOxjWUXFtPU8q8R+INStPEVnqGlaBpEF7rcUN7bziMXcknmfKAPMG1WDAqQFGGB5rtdT8UWOoWlrZ3U1reX/mpavLbWyxi4vMbnc4ABUDCnHbZ3Jxymo6rGujQyafBFK7zyf2VMX2mw88HzomzxjdymTwWauO1A6joNlpcbrcWd9BNcTHepV0csq8g/wC5Xp39m3bVHHbnSuW4rW1m8QiWCP7HNDeYmt5P9UxD5JRux4J2n04J6Vi6lL5s7Y/jbd+ddRq95t87WVIii1SFJo4ccicqUlPTouGI/wB9a49T5sxY9Bz/AIVk1Zmidywsp2r9KXzfWoFzjb6cUuDWiJaJd5Uj5j7YNWYNY1CHiG8nAH+2SP1qiM+uR6dqkBH938jTRLNZPEeof8tPJmH+3GP6VOuuwSD/AEjSrV/UqoB/lWJuHvTg3HX86d2I3VvtBl/1lg0R9s/0b+lSpb+H5j8k7Rn3mx/6Ev8AWud/EGlTIPQ0790FjqYvDtlOhFvdzkHn5Qkn8mqCXwsU6XyL/wBdYnX/ABrnYSFJx2JHFXI9QvLc/urudPYSHFF432ElLuaUXhu6RwY7mzk+k2P5gUTeHNUUnbamQf8ATN1b+RqsniHUFPzvFMP+mkSn9cZq6niLcoMllAfUozIf5mpag9dRpzM6XStQhBMllcqB1JiOKqiDAO+HnJ5K10H/AAksKKzIl3EwBI2ygjP6VYh1y3CBY9Vmj9pI2A/TNHJB7SDnkt0curtHxHJIn+65H9abNdTBfmmkkzwFYBiT+Iror3UDIAVvtOlHfzI8n/0Gsi5uBJwBCT3ZIQn5d6mUeXZlp33RBaxeVGFJyerH1NTluKhzgUhbg81BRnX8peYjPC/zq/odvHEjXcqlmPyxL7+tZMhMkp9Waux8OWsb3qGQ4hs4jM34dP15/CpQzZitk8MadFqF1CHuZs7JXGYrbABOcfxYPC8EnpjBJ5abxhqF1rNvdxeZM0cqlQw3SSgH7vHQHptXA571rTeItR0/WIbOKOCf7agkvrW4XdFMHGVRh2CptwRyCTWing6GS4Gq+GZ3tJIyGktJmzLan1Rv40ycZ/DrxTtfYZh3/hO5t9alVpUWw+2rCgkcghJBvQkdhtOM+oNdGfCB8KW0+rFrcm1jcx+TI3zSsu1AQQOhJP4VDrs2o3+mw3bWrR3agQ3UYTlwj5jkUHngswJ/yJPEGvahc+GrW3vw8k0shkkIiCCMYGwNjvjJ/wCBCs3CV7lKSOf0bxfNYRppmuRG7sWxxJnKD+8p6/iK0tV0tdNSO7tJDc6XcH5JO6H0Pof0Ndbd+HNK1/w7aR3Uc9pAIVFvJJFidSOoVerDrnPHvXM6PrFlFqsvhM6e9lppDRETPvneTs7N0GMAgLgD3pxk3pLcTS6HM3dqsQyv+oc9uAjHofoap2lzJpt0Rx5b/KwIyPyraurc2F3PYXeMIxic4/Ij8OR9axNQiYL8/wB9CUbnqR3/ACpSs0OLaZrJcfZJFkQvESc4DYLfT2rcttVtruAGYhJD69D+NcpZ+fJAkmTLDnDR9cepHpVjyWT5RKUB6LIMY+lZxqOLHKmpHSRW6XYaRWBjU4wOcn3P9KeIWToCKwLWW8ssmLdtP9xuD+FbFlrwZWS5hO7Hy44ya09unuT7J9DVsNUubKRWjkZSPQ16Z4R+KtxalIL1jJH0yTyK8hXWbVxl4JEPsQRVyC5t5Arx3CjJwATg5p88ZaBZo+vfDXi+K+gSS2nEkZ6qT0rsrO8jvI9yHkdR6V8k+C/EN3pN0hWRimcEdq+g/CXiFZUWY52stc9R+y97oaR9/TqJ8SvA9nq2nzarbQBL+EAttAxMuRnd7gc5614Br3h+WC5MjiIpI37uUOwXjqMjgn1wfTjmvoP4k+LIdM8LzvFOqu5EZVurKeoHqfpXhf2248RpYaCgQyiaWaPKk7Q4BJYjoBtGT7159epCpO9M2jBxj7y1OTk0byyxBjKZ4JBbAPWq76fewDfbF9ykjdEgTgd89fyrpLj4feKYJt0dvBOoJ2lJg3H5g1Rn8NeI1x5+mX1uVzyFLpj3OKyamtw5UzuHJAPH0qJnbuM/jV17dR3JzULwn0P4mvqXE8i5SkVj0C/jVaSFj0K++AK1TBgHioxZg5+bP1NHKFzAltXk43jPpmqk2myMCApYeldQbNPQDFIbULijlDmPFtX8O6l4euZ59Oh32U2fNtJU3J9CO4/UVj3HiVN0R/s0CWGMRRh7h2RFBJAAPQAngZ4r6ANspGNufXNZ194X0nUFZbrSrWbcMMXiGSPr1/Wnyvox+07nzbqmp3Gp3LSzy+bI3GegUeg9qjhjfbthjeRj1Kqa+hrbwHoFkyxPp1rgnbFOUH/fLn19G79OvW+fB9ggwlqi44xtwah0ZMv2yPnS20e9Mgka2bg5ANav2HUJgPMTIHYjpXuZ8KWuOIB9ajfwhAwyIsCo9gx+3PD/AOyJj96FfxFNOjesX5V7W/gmIjIUCqkngtB02/Sj2Muge2ieNtpBI4VhUX9kyAHPFewSeDMfwr+VUJ/BrDOEJpck0Pnizyp9LmHQg/XiozZTofufka9Kn8JSD+A1Rm8MOucIam80VeLOAMc6HlWxnI4p7E4zgV2Unh6Zf+WbVA+hyFeY/wAxRzPqgsu5yW4eh/OpI2BUjP5it6XQ17xr+FVW0ZVOQHH0oc0x2MmToeR09aYXrSm0hx91m/EVVk06ZRwAaE0DRAGJ+tKHpGt5ozzGw+lIcjqCPrVWAkD0O4A4qImmlqLCRTh/1qZ/vCu58PxLLpetZmiiYwogeUkKAd2ckA4rhlBRt391q7jwSEvbm90t32/bbZkQ+jDOP0Yn8KzSuaFu30m4/wCE4l1U3ejuRKSLf7fGsiYAAG18dMDtVi08J+I1uUubOWzimjbeLiW+idcdwQjMWBHUY5FZPipZNM8WaTrwjLR6lDFMVA/5ar+6lTHqHU8e9dPZaFpPhHVYta8Uak1oA5nttOjQvdTKcn50BG1MHHzEZHFVy9BXNC9tftd4h0mOe/lvHLp5R+UlVCllON23HGCduBn3qpFaXFu9z9niWW5UuzQsQ5eYKNq+Z6cE7euQcHmuthj0S98IT3FhpviGEW9yLfE7BpVRo1IcMm4+SqbQV+YgLxUN7pHhfRo9GsrrVxpl3eZuxb30OGkjOUw0jDZG/B25Ax1yCa19k1rcy503Y868P+MZbPXLmfX7q5d5ozHMHQ71YH5QE42jrwAOtY/jDVLG58Q2urabIx+VDJuQqdynHf8A2cV2Gtan4m8ParMNXVdQ00M3yiCMmJSeCAyk4Axx05HPQnmtf1221HVorfT9I0i7hZY1Eklrtbex6AoV6ZH61yyilLXc6E7oseNYw19bXIHNxbruPqynH8ttcxcDcJg3orf0rqvGRCf2ZCFjUpC5wmcYL4HUk/wmubSD7TdmHgeYUTPplutTLRgg0Pm2fkjD+vtWmGzweR6GrmvaVp2h3FvZ6azOggDSSOctI5ZuT26Y6VnK2D1zWCkpLmRq04uzJPJjJJUFD6rxWho2j3+tXos7SIXD43HsEHqT0ArPU1s6Hr0uilmgjRmfG7cWGQPoQRUVIycWoNJ9L7F03FSXOrryNeb4XX8bL5+oWFuX5Cku38lqxB8Jr5FMh1G0YYyRsarln8S3UAT20n/AZd3/AKEB/Otey+ImkOSLhLpFYYO1f8M14ssPmt1yzj/Xy/U9aNbLbO8Zf18ytB8KdcgkSSDXIRtA24R8D/GpdZTxj4U0n7Nc67PLYXEgRzEdpQkjGWPIH0NdJpvj3Q9wWG8uYwTnYYSwH09KteK9O1Px3Z2mm6LY3cwmlVmme3aONAOcsx4AruVHExl78rx9DGVTBun7kWpW79TzhfFob5JZL7VJUHliR34AHTazZIH0Fbfw+1RrzxNEBALQqrltsjMZFOBg598HjFdJ4W/Z5uYSk/ia8stOjAyU85Wk/Tj9a7mHw/4Y0Z7a10S082eDcXv3PzMrDBH0qnyp3aOSzkhmxCfvZP0qZC6H92+3HPGafLEC2V2jPYHJqL5ApLBic+1bNisYBVT9abtAJDEDsOKlCgZOCaXBYZ24HoT1r3jxCsyr65HpTBGp6DgVdYKDjCmhUkY/IABjsKpCbKbQkcgL9M1H5LkZ4H0q+bWctkq/P+zjFOSxc4yF/FxmnYkzxCQf9Zx6ZzTvs4PVjz2xWiLHaTuZceoyf50oit1IBbOD34osBlPaJhlYh1bhlcZBH0pisLNMTuWtgCBKT80Q9H9V9+o7561skW6NwMj15z/Sk3RDkZB9AAOKpMVik0Hy5BBBAYFWyCOxB7ioTGM/MjD15zT5k/s0CW2Mz2BYmSBRzF6svHT1X8RVgpbSKsgYeWwyGU7gR7UwRT8pR2H4mmtAD90r+eau+SvVBlfUjGaDCCOoNFwsZz26nln4+lM+xw/3WNavkBhyOnvSi2x02D270gMaSwiPAQD8KgfSlIHyZHptNdJ9nb+JgB2pjWRb+Pp60WC5yc+hRsOY6qSeG4iM+SK7P7GDyWGfWoWtVHGDipcUNSOFm8Mx9AlUZfCjN92MHPSvRngjUHoOPpUIhjBzs/CodNFqbPMrjwjKvWL9KzLjwyyn7hH4V6/JarIeelVZNNjbOVH5UnSiNVGeNTeHnHRf0qjJoj8jYD9RXs8ugwOp+Tms+48MI6naoJqHR7F+2PHJtCH/ADzH4DFUpdEx0yv416/ceFFwTtxWTc+FtnG0nnsKl05IpVUeWDSAhIcsyk5wOKmtbiXSL+C7gXa0TBlBPBx2J9CMj8a7q58Olc/J+GKyb/w6JImQgg44I7Go5Wnc0U0zqY7n7bFBcaLcQWc195j2l/d4kW1u3Cjy1B4gMhXBkOfnH8Oc15PPdX+l6xcRa1bSzXUcxF1DdswkL9wx65rb0XWp/DtzNp+oQefZz/LNA3IcHjcueM47d/YgEdjd6ZpvjC0tluy2owDbDDqcUgW8tF/55zbuJUA6bsOo6EitXFVFvqTdxfkN8XeLLkeFNE0ixnnsZtST7bcYk2siOVCAsMcbUU/Q0fEhZdftNGv1na5nj08wqSwcvJBJ8+fUskit9c+tc3r3h/VvFutT6lp01jJuby47P7UkU9vGnyohjcg9AOmavyeFdZsPCM1vrNvNCtvex3cTEqMIw8uUA5x0MZ/4DWcoTttoWpRv5m+/ijTrjToNP1qRrWPy1aOaNh5tmwHAVRksM/wkYx9cHF0rw5b6bfp5qNc3BBmtryNt0FwCcB0x0xnJDcg4HvVex8EwCSKUul2PMUtBb3GRs53ZlCldw44XcfpUvi7xgi2Z0fTJYxGFEchgAWKIDI2oB/EQSCwJ6nkkkifZtK9TpsVzraBheINUTUdWllibdBEBDER3VeM/icn8azFYoBIDh2bcCDggDgVDERI+OiKOcdh/jUzMZpNxHsB6D0rnmXEfHKSWycnip0f3qH7K4OflGexNKqSqQNpb/dINRbQbepbV6lRgO1Voyw42sD7qanjikYjABJ96l7FonD8d6QnFW7Lw9rd4Glg0+4ljBwSgBH86st4V14YzpF5n/rnWPNG9rlcr7FCGaRT8kjrj+6xFa9j4u1HTv3a6jqOB1VLhgP50yHwlrudp0q6U+6Yrr/DnhjUY44jc2OnMv8LzWsc8id8YwT+YNJzXcai+xL4G1TV9f1GMQhvs7Kxd2DHkf7R4PJr2OyRLK3WIBz/ec/xGsXSZrSGNYTMZZiArEkBvps42qPQACtkPGMbVYMeRv4rB2bukdEU0tWTsyckg+3HWo8KCMugGeee9Ds7Y2kN/u9TSeQ5YblAJPFWQURHaov8AHnpyf8BQzQfwpkehGaPJABO4emDTvLQDHUdOAa+h5jw7EbXO0/JFjtgKM0w3MrjG3Geuc1KyxnOM+3pTCiDOOT3p3YWI98vUDsew5pgeQg/M34GpAHGGQjjoCKdiQr7jjHei4WIhG3JbI9QacEGSBin+WxGTjPvSrb7QDyKLhYYAh78fSjKkcDn3FSiPDH5sDsAcGlCoAO59aAGRMIzuWMMM8g55qtJFJp7tdWFu01q5zNa4GUP99B6+q9+1aIdBkkDcvHWms4OXiIjdepA6j0NWnYlohjEV1Cs9qQ0LDqDimmPPPJP16UskMsMjX2mqGJOZ7Y8CX3Ho36GrFnc2eowF4nZWBIKkcq3cEU2IrKg9xUgRj82Bj3q6LZDgZX+VBhA4/lRcLFZE4GB9OKDESCec+1WvLUdAc5+lL5JzwpPHc0XCxRMA6EAdqYYDgbQB74rS8onG5ttJ5KKcruJx2NMRktZNyT+tIlowPQKPUitUBFP3CfXmnsinBC/UCiwGL9jHcZprwEADA/EVry8rjGOarvsXq/HagDKeFmxuHQ4qH7P2xWo4ByRu6VHgj+Hgnr6VKGZL2wbPHtUEtgn9365raljGNxzj9ahe2HPGPc0wOem0iGRjgDn0rNuPDIlztCn3rrzAAOin6immMHohYHnA60rJjuzyzXPADX0RVotxH3WHBH0rh7vQ9e8MzmWFLnYBjzY8hseh9R7HIr6Ikg3gkAhe5NVZrMFclA2R36VEqaLjVaPBU8azTgJqFrY3hH/PeHDfpx/47UqeNYrQN9l0bToWZSpIDHIPbAUfz7V6/qHhTR74FrrTrWXPXKDNY83wx8NS8rp5Qn+6xAH61LjPuaKrHseR6r4s1PVVaKe42QtwYol8tCPQ4JLfQms6KwuLoghGVB3I/kK9l/4VrpMJzDEE9zilPgqBMhBnFZOnJ7lqrE8qi0pwoULhR2qZdLcY+WvTD4VjX+DBpP8AhGo/7oxWbospVTzf+z5hwqEj2qSHw/qlyhkgsZ5UBwSq5r0T/hG0PRcV1ul6BFZ2sSKuMD5lx+tc1bmgtEdFJKb1PGbfwrrUjYGm3A/3htx+ddHo/gS7M0cl7IkKg/6tQWY+2eg/WvThpca42Z5wSOD09qd9gCHJDYzzgY/OuKc5s6owgjLtbQW0axJCFRBhQufz/GrsEhODgnnknmrsWlLuDquHJ64wf061JFYdD5YBHG7Pb+dc/sjbnIYm3FgAqg5YH/8AXV+G0EjDEayAcdOc0kFmFLYUbh0Bbk1ehilCkDjP3tvH+cVShYTkMTTEYBZFkCYxg/OM/RsirENikPyxzvGoGQFJQH3x93/x2preOVTzux1PPWriQ7lAccf7QIxVpNENpme63MR+WYOPVov6qR/6DThc3kTYMBde/lPkn3w20/oavGIK27aVPscU3YuA204+lbIzKWHB6cdflPWkw2DnIz68U9pCTsyQOwVe1R8EngE9Ote0eRYdhWI5BA4PP60oRME7eRx0ppPGACM/3R0oBztzx2zincVgkVFHKgnrx2pokQDJUAeuM1JnA3ZJH971pCFGeR059c0XFYQORyMDHGfSlMg7imrtPy8A46cYpy/LgBPrk07gM27TgEqwGPU04RORg85HXHWlUPwRuAOe36U7a2M7ge+fSncBrRcEEgdhz2xjHFDIg43EHpkj/GlwMAnqPwp+MDAjAxz60XAjQtGwZMhlHBPemXem+e51DTpY4r7A3oTgTAfwt6H0NWAWyflJB6E8UojMb79i59T3qlKwmhmm3qXqFgrRTRnEkUnDIw7Edvr3q6hLZ4wfT+lUL3TzqUkV5YsLfUIRtEnO1x/df1HoeoqXTtRXUmktJY2gvbfiWI4GPfPfPYiqJLZjyR2PXimfKpAH608qyEqWwe3oaUwKeH4I6HGaVwsRFwQOAccjApN/T5fzqfyFX5STj1zxS7Iwufl+tFwsVRHIx4bg+1KbVmHJzj1qyHUgrkY9KkWYOduDincLFKS22A+uKrtCFJ3LzmtFoVweTg85x2qBoickMAOxz/SgRTKYPIIz2AxUZjAI/hHvVqQBDtPfI+lRFlI+UY696VxpFcoWwec56UwxA5wWGenNWHcA85OT370B15Lfe5xkUXCxVNsSMk4NRNHs7HA5DGreW5z07elRkkr82cHpgfzouFiqU9Qo75/z1phiBJwhz+dWykeAWLZ78UnmEf6tCMjqxp3CxRaEbshcAc1GYgC2cYHfpmrcskjN8zAewAAqDZ2Uc9M1NxpFWRFO4LuOe+agdCeqj0z6VfCF1PfoCelAtsHkYAz37UmyrGUIBwAuOaDbsQQAPx4rRaAMNpUsDz17U0oQ21QRg8etS2UkVLSzBkXzE4z7V0a2bkDC5GBg+nvWZBC0kwAGST+VdJDbNHGCxKjGSO1cWIOygUGsSMNIEwTgADv2pfJTpxwec9/p3rYNuW424wOcc0xrJcsQuTnPpXI0dJlfYyoK7SBngr39qVLQYLAjbnb3HWtNbWRBlJGjB655p5iBGGwSOM4qWhmelud+SMrzyDwKsLAoxlguBn5T/nrVoW527s9v4hyPwpv2fZnOFI444FS0O4yNUU5BY9DyAf8APep0bacqTlvU+maEgdlK5JB4wQefTp+NCW5Bzgn264osA9wZM7SrYw2c4P1ph85GbJyM8gNU/kBlHzBBnI4AJpgh2DGeAMBuDz/SmthGXtQY+8fw6UgIOflyfrVgw5OQwXuQeTSbgFAz0/u17J5JCATtwuD0A9KJIn5PIHoKl2NIvA6HoBS+W6uOgHQgHpQBAsW1m+ZT7etBjG7IUHucirJhOepPSnCEBflGemSTTAqDG37pH0609kyPlBweRz0qwYiDuJ/L+VBQL0PJ/OkFiv5ZU7WGCBnJpuwE8sPSrGUAAOQD0yOtIVO3POOuM0ARiLcxJxx15zT02ggEjj0BNKXXkHHTp0xTn2ljtGRwDQFiMqu48E4689acWBHCgAdAOppxXt1J9Ox+nagwklfmOOnPWmFiMmRZBIoAI9eh9uKJ7FNaRZYs217Ev7uYHlT6MO61IbZgd3Xjr05phRw+9D8wGMrzmmpWE1cqadq8nmvYamnkXkZyydmH95D3FbDqvl78nZwCfQ1QvrGDWIUjmfZcRnKyqfmiPcj9PY1QsdVutOuF0/Vgpkb7kig7JB6j/CrINlVJHB4+vSlxhcEA89PShEJUSQuAp7EdBUbM2SHfPrn1+lTcqw7cmeVwD0B6U5TliwJHHaoN2G25HHYmnbiOcqRnn0ouFiQOMHIyPzxUbgHkfdPSkEoH3Ux3OetO3ZU5B4PXFFwK0iHs3HeotoQeuParJeMZJc7uuCMCo5FRRxxxnGc/jQ2BBkgZPGOg9aYyMzdzzkA1OCqgkKCecE8ZqJmwpyCM/kaVwsRFR0LYFRhgz43ZOamKgLkjqe55qNk4JO7GcZI4NFx2GbsnhSCOMDnP40nzb8cgHjPpTkChip4OcnHcd6ABnOGI6nnNK47ELDnGCPQimPEA3ByPb6VY8rGDgL7t0FNTay8qdxPAPTFFxpEQU/xANyBilBX3yexFTFGIXAyDnjpUZh+U5x0xgVNxqJE0a78gHOecdqcIWb5QAQxwuOKlSFmKBRvOeh7fStqwsfIUvIqs/GMnJWs6lRRRpCncisNNFuu91JdsEEY4FX1tTg8AY4znAP8A+qlyy7W2gMucgHIx/kVI0wU5ztGc885rhlJt3Z2RSSsJ5R/h6dSQfx5oIVTkjDL6fShWBf74XPT5eT6/pTl8yXdhl2g4yBUsq5DICWwuSCfbNKqmLcQgBHBAPIqyY2TpgH3UY9jTCHIKuA2ByfTr1NSO4PJgbmBTABwRn8KYQ3GxFIHZf89KA0ioQEJH+10qaKcYJK7tvHy8YFSMYqLhnYEEnnA604KyqOcg5x82DUzPHKmEAQ+np71FtKkhTkdOORjqRQAiuDG26NW5549ff1qu+RJggoc8bef0/wA9anRpedozgAEDgEUquHcO4BHAJGfShAyo3ls7EZxjsKjIC5ZDzTtpcEhmOexPH5UoQHqGbnheleyeS0QswByW5zxS7gMkqCuf7ucmptqlgNvXrnmgBtmSrgj8qBWGFl5PlE9h2ppkwyjOVHTNTkAgDaCSPT+tL5TSJ8mGbPUjgVYio8hVuVyuRgg4JFOLk8YJUc/T3pHhMUpU7CBxkc4pxQK3cDtuqShCNvQIMHgk85prAjkjI7Y6VOsTFedqBuhxzQQoUZLFjnIIyaQXIQAnXvjOT1pwCuowH59Djmn4ReQEUY43NyPwoCAdNxK8gqcCgBFjG3KAKwGSTzj2p6eUB98g9TjioDJuYqAyqrDJz0qVVO4jIGBngYJoCwvmEjIA56Z4J/Ok80vkhFJ6B+xppVQSELHHJJGM/jUixlQCqAY5Hr+lAWIJo2Lb1BVgOAODior+xj1aD7JPGxOAcj5WQ9mB7GrXlkgso5B5U9B9PWkkhZSGCscDgn3p3Cxz9vqV94fuorDUm3wy/LBc4wJMDofRvauhG25hDxmNuOTjrTZ7Wz1iyktNQhDxOBlTwwI6EEcg9wR0rl7efUPB999lv5XuNPfi3uduMc/db0bH59qq9yTqHGSpK5xTDhG4wAw4DcU87LuFZoGLFQCCOVwf6VBG2SVfjHY5Oagoe8uRlCOOwpjZK9Rt7880pjIyACwUZ6ZxTuB2wRgc8nNAWK7B5CCWJ+vIpPuBtzDIH8Jp8m1MsScn8M1G29sqFP5dTRcdhDuC9CM55Yg4qHdluVx+PerSxNLw21cGkkiQhd2Tt43NSuOxU3puIwV9/f3pu3cCA3yseQauG1D/ACcLgZIzz+tD2J55IIGCSM0rjKojRmOegOBxSCNhlVwOeg7VYMS4Ge3UdKVoWweoBBOeCDilcaRXdMMuXHJ65yaaULrhQcj3xVgL5mAxBxjpnNIyMjAKucdh1ouVYjCMo7IvBP8An8qeluWYrGMtnp7/ANKt2+mSyFWfeiN7cmteCCKBFCIMN1PJPHf61jOslsaRptlGy082oJcfveOT0+tW2RYgu5ht3Eb+eKkKvI6gspUjGSMn8/zo2mIbPm6DI3VySk27s6FFIYWjDqGC5wSD/nrTiiMpILneVO0dc0wjdt2HD4+XPBz7etIGwgGXdeo4z+n61IwMihgygAEbeF61ZggRzmVwQf7pwe3aqqncSh8xQOduM+1SwDyyQrsrDnB+bt1ouBI6qDhd/POCOn1qKOUKAWGQM4wTkVaWUlWIXb7EZz+FRMA3CCTIxkrjjNA7kZklkX5GHI4bPP59qA+QwwS/AJAHHoP8aZucZVncnntjPPX0q1FHvVXkJG/vjr/9ekwIViBB4YjqcnGfoaVYGWPC5TcMEkA5/D1qdmAQKAwUjqec/T1FQ4kWY7iTH0wqZP8AOkO4iu3HylgON+MdKjfKdVdMj5geCf8A61SmEso2ht/IYdAR+XH09qFR2HKYGOTs/Lp0/wDr0kgZnMuRwVU55PXFCpOy8yYYnqe30xUiQhVO9lY8dO9SFtmFKlmPI7CvXTPOkiMRGMEbs+4X9KDKSuwkk55PU/pRuZiOCcdSKi8xxkE8D+Enn8qq5AgUp8zAdemc/lUsUzYxnJzwoqB48kkcnPBVfanR5wNx46kZ6ZouKxNLKoLMwB5zuzTPNOGYN179MUrblOSF54UH0/Ckjb5GwMjOMgdqAsIrM2GUDP3hgYOPx6U8yMq/e4HJI5FMZFG0sxJB6Hn60/yyeNoX2xkflQApManGA27r7/8A1qQoFwMYz0G6nkA4BxjIwAelOSM8EBsds9hQMa8QU7lIBA4yM80ixEsASWz7YHXuakXqSCrLnGMdvoKcpVYwHI3duORQALncCMhCOnWl8tnDOSYy3AyOv4UMVU53jn+8cZ+uKA7HlSy54GBjNMByIuzIKHJyQOKH2hQM/KeuOmPrTVTL7mxj25xShApC4yev3qBEEiHcWiIyOAOufrUUn2fUbSexvY1kjkUrJGec1bwH5G4cHtiqc8BdcxNtkwfY49/akM5ORNQ8F3exme60eU/u7gHmE/3H9/Ruh+tdXFcJqEUcglIx8y4PQkdh60qILqKSG4kUqRteGXDZBHP1HXtXJ6hpt54KnXULVJJdIkPzK2Sbbn9V569u/rTvcLHTjzEO2T5ckZweox1A/p2qRoFODu4POQMCksdQttYtVmDhmABHr7cjoadukBeNwPm5Bx97/wCvUvQaI2iQ843nPemM2FAO0gHsMfyqbIKjKjJ9BkkZ600Jg5GSp65HIpFkULrgYQA4OPY0iHLNH+8DY7H9Kn8rbIueARnHXH4U/bkgDkHuc8UmFiviRh2DD2pyqSGUMx9cnOfpUro2Qc857cYp4ibdwijnr61Nx2KbB04K7iBnpSqC7mMYwep9K1obCSXDHIBPU8/pV2PT4I8YwZB7cj0rKVVIuMGzDg0qS4LbhsAI6nJJ7VoW+nQ20m5EDOuclv8APFXwqvkSBEA+ZWJ756f59qY8bAN85Yr2Zcr+VYSqSZvGCRXbL5ViSh5IwDx7/hTIt8QBWTarYALHdxVofJuG8D+IYHTHv3/+tTQonBbEeGIznjJ/z/KsyxhQugYABhyCef8AIqI5UkjGRzwOf/r1Y2GRBwCDyu1v8/lioXTylweSR8vHHXpj8RyKQELlf9YykKCeFzx06elROExuAOQwPB5Hbp/nrVligBb/AFeCAePu8ZP8v880MUYsVyWI52kY7H8Of5UgIFC7cJ8yAnIRhk8/0p6/OUdcy/xMAeR9aYq5BYgIOQpOeexFGCAp8kqcbWdB0A4wPTjtQBOjkKDgE/eIbg45p6zxpuHkn0APGPxHBqJZnA/dhGO3JDcEjmntgSBnwkmche1K5ViMzjfthJ3EADPf+uacN5lU4wF+f5fmH1pzsgToF3EfMD0Ht+nWmLiEjc7x5IIxhgfpzxxTBEqyhB5Y2rg5BHKj1wKWI5PCqGTuDgH/ACaiYK2XPzfNlsgZx6/4HPelil83gEqAcfcwR/nFIZcheNiRKWVyM4bofbI61WaEx7irMwHBCn69T19OKXc8cGWy6uQRk4OKgkKpwWZDyOwyfWkhMhdcY+Utnv0FNdQgJAG7Hy/T3q9tCnaowME1BPmCGMg7izHO76V6uxwFIRzOy4jJwf4uKd5ZVmZyqYGcquc/jUlyzKAwZuTjGcD/ADzSTQRxRxvjcePvHp/nNWjNjQBkuHIXtQFy2ckD0z1NMnzEBtJOSDzz3pwYqjEdVIHPPemIcsSydY1wvBAzgmpzEMbcAdgB1NKigOffJ/pTg+FJAAwT2oAjEahVAIB+vcU8RgjkhABjk0KTJb7mPbOOgoRVYjIGRjmgBqqqIF35B6f5NSCN8gcKSegXOaVfmkweeBTlmbbkYGD2+tACGE5O87ieuT0/CmSKCNpGR7DAqRCWj3k8n8uppWTMYckkn15/z0oAhSQADahKnjIHNPCqWOMAE5zntUjoCA3rg47CmECNBgDBycGgBjlIQC7Kg3YGcANntUcc0vnNhEePacOp+YNnpjvx3qe4RQqAqHDEZ3c/56CoZ5n2wuG25lCkAdR6c0ATADg4CgdSW6H3qFo8kH5mzwPQCp7iQowIA7n6cZqCRyqSMOCpG3HagEQvArjzFYKw4HfHsfalhmiwFeHqDlWOR6H+tSCEPMIyz465zz24o2BAxXqpYA9+KRZzGqeG7rwzM2p6ErPYfels1XPl46sg7r6r1HbjitrR9Xs/EFiuxkLsOR2rQgdpLgFmJIIIPTHauF8Tovh/xRZSaePJF6sjyoPu7lcDIHbOeapa6Mh3WqOweM2oCSK5iGByNxA/w96VY2bndxwQVzgensamtZ3uLRXkwWBAz+FMT5rhYeiuCeP4eB0qHo7Fp3VxDAOCRjJzzzSEc7STzx0/lT4/3jmMkgIDgjqee9bENpDGisFyWOTnsaynOyuaRjczIbF2HzAICMAt3rRghto9xjAk2naxyPkPoR61ZY+UwjHIOOTyear7FS4MSgBQSf0zXLKo5HRGCRKZFDk8kdDt/kaXG9S6hR6ADNRO/lKuwAbsZ96cIVVt2W4AOM8H2rMuwhG7Py9Bgdf8im8koXdQckLs5JFLH88jYG0DJwvTqR/SnBFXBxn5S2D+WP0oAY0ZGQGT5uevT+lRCPAVUwGbqpGc/wCFSQjzYg7dRnHtzin7so77VDY5I7/WgCnJEyFgzADcOV+p/XmmCR1XjJU9ieAfwq9BErEkkkg8ZPTFU5erFflITcME9elAyM+aV2tgqAByDg89D7YpQzcMgVgFPTGAOP8APOaS1lM8ZkcKTubt/tYpJHMUakAHKM3pgj6UhDmhKurBGjYjkDtx1/LIpTFBKxyT8wz6dfXnn61HHKzI7E8rGsgOe5GT+tTodxgU8+YpyT15FAxvlKCU2Lkkggc5/wA+tRyhwoBc4A4+br/nmpc7VIA6s3OTnIXINQrIRbPPwXIDHI4zgUgFWEzuQADt4J6Z/wA8frRiSNgrA7M5Bzyf8/0p4bdK6kL90nOPRhio3AlOxsgNhjgkcmgLio2xwrbWToMkqR1z/jTpAZQrB2xnIc8Advpn68VGAAwQDA4zg9evX8qZcL9ntzMhJbIXBAx0HakUTSkgDzMDBHzeuf5HrURLrGDtOCcjA6n1Pvg0yCZpYmzgEkrkD6/4VLOux5CrEMoKg+23NMln/9k=",
  "ram-1500-2015": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBAUEBAYFBQUGBgYHCQ4JCQgICRINDQoOFRIWFhUSFBQXGiEcFxgfGRQUHScdHyIjJSUlFhwpLCgkKyEkJST/2wBDAQYGBgkICREJCREkGBQYJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCT/wAARCAEsAZADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDsvFi3uoeHb+6W4iDWdu8sCW5LNHIoJ3GTucAjgAcnrXmPh/VzqP8AwlrGB53Njc3MKL8wh3II3cscZ+VAM+p9a7j/AIR2Dw5bXJhmtIb2S0l8qKEstvJIvymMxBuSVPX6ntXlmh61Lpb6wHs777Le2DWzT+SZQoCjknHIBbk9uK9KvP34t6Hn0IWhJLX8D3Xw7e2t14es5X82UQCO0jBQFC6ooygHocjdzyp6VzNzqx12W+Qxb42h8soVwDEDjcT64JPvgVg6N8RdB0bwlZaNIv2O4hgW3E5gkRJFYZYgkZJ5bpwd2eOlJP4gsb2eJrCW3mVoxEJYiPvjAxjqcj9e9OtVjKCSZWHpOMm2ibT79odXkhuZifsCAtuJUzBfuk9tpG0dunvWpbaNH5dxpNxKkUssU2VkJZZGx84U/wAWM4wPp2rmLy9Iv4Z2j2mXZbsVfncWJUDsQcbfbvXYzxyW5gjaWSZfMcsxjwY5GTDsCDkYfH5iueFuV+R0TvzW7nGfDm8f/hHZ4Y5GSa2cKoIyV6gjPcZP4ZPrWtrt0+oMJpLd82OISD8u47t2D7kDHPUZNc94ZSOK8uUvBDFafaXa48r5WUHhcDHAJXp2wavyXU0Vv5M777mbEpkc8B8YA28YAHQnpk9BzWHN7pslrqaUFnbm5jm+0Tm1tUUIoYlXZmAYhv4Rk4B5wcelWb63iutGF68heGBGbY5DhVI2nOACMZA6nHrUb3txpFhFIlgqtOq5kkmGHQjP3R1Y5znnGO1aVtexvpiwt5UiSyzRvHIwXOc9uucHggdx9K6I8mqb6GMubdHmGv3tzftperGdjfixO1lzujkt35PJOCFBP410Gg61JcaVDaXVuy2sE0IvXZA5Mp3k8H7xfcR+I9BWFr1u8KXExlQTWU/mypnl3xskUfUckf7Rqy0Yl0ua4sXWdL5WRwh4tyMGLc3rgEHuPyrHnd2XyrQn8bWMcNjatYw3EVpdySPApPmGPamMBuTg9dp+6RxkVNqfhi013UW+wXAsLa5sbe8DKSUd2CsfMXjhiCTjHPTOMVHqkt9qn9gWS21uyz2zv5cYOWdcAh8Hj1zx39KzdA12WxjksYWjW8tVeFLkHB8sNuUqDxlcuOeuADRW3uKC0LPhvUhN4qkkeyI8u3OLfhleTORtx/yz3EtntjB9D2uveJ3sUh0qKOO+vr8NFukby2LEnbOrEcKACOPubRivPNR0y00/Wp4ftk8TxRSm0uACGdlkJ+U4+8wJ+XoSw57VvSy3UNs9pq3lrf6c4v7VXjDQ3kQz5hQg/e2HG3nBrSlNwvEicU9S3ame11e7bdGV0+G1OwZVAyxFMhc5yQxPBp174jFr/wAJFLbNAss9mkMUEKMdqnduztO1eWJ5z1xzWddSNL4muGi3Np97axXEgjfGI0yNqt2PA9e4zVuezt/Lk0yK7Wxie88plJVNsaorYPGGOBkewzznlKco3t3/AEG4p2ua9roeoR2O3VNau7+5eTdFp0DlIUcAMWcgAsBnJJwOgAOa4bxjYov2e3J222o2wuYiFCgMjlWI+o+bnHXpXrC2eoyaZbatZRvc3UTNPJGG2m6jaPaVUn+IHayqeMrj3rzX4gaxZXdvoK2ksTi2uL22IA+4rBGQc88b8fVa6K0VyXe9jnpTbnZbXKWg300dvfaRfwMs2nCS3dyoIjUIwXA9c5GT1yKh8HaJ/b+l+F4psBZdXkh3k8EYQsoH5dfWqOsajKLg+INNDL/aFsLW+jLZBlKbSSPRiP8Avr61L4K1f7K3h3TlWVpLbUJbpcpkDcqgHA6jKZP0rlhO+51Tj2PUfileJZeG7jTbmNXu5Xg+WAY3RmQZ9j0xz+XFcd4zuG1vw5NK8s0MOlLDaRKCAjXDuA4AHXZGAOe7Gus+J9in/CMRMbuby5b23NxPMQZJSWI3ED3x6AAYrlfHNr/wiXw9htCqeffXm+5jkADSPh2dsryuPlwMkDjuK7q8nzNPscNBLlXe/wDw5m6R4jbwv4B1O9t1Ed/qLx6bb7TnGxPmde/Cnj3YV2/h63t/hV4MszerjV5pRO1qvL3DyKVCA+iqRk9iDntXkmiXrX+v6Lb2en3OsW9gMwWMKnc8mdxzx03Bcn0Wvf8Awx8O72a+fxB41EF7rEhDpBu3xWkY52hehbPJJyM9KnDNuPu7r+mLFuMX73X8TgBLftZ+Jm1G20u4muL/AE57y8QNhzJIjCIA4yigYxgdCSSSK9N0LS7SLXdau54JpzDdCCJ5sAJmNGkwgwFySO3RRXCeK7OKPx9eaKszxQ3uqaaWSViY2CxFwzNyfvqBj0J9K73S9VIt9Sl1BltpDfXUs6LlgoUhTggcjCjketb0fit/XU5q3vRTXX/gGJrS/bNfuzEUNppEIuFjZdwF1LwigEgFtuDnPHmGtO18M27WZSa7uTcxI0WcqVOV+bcF65ORyenvzWd4SuF1XR47qTyc6jdPqtw0RyEj34iRgO/yoMdhGa21uXSS4tVumimI8xQYWK5Ocr2yeh6+uK0jaXvPqKTa91O1jnNGsQ8a2cq4lsQlpeIkjZJQsVzz90qYz+Oe1dLYjUr5vPkuJDaJH5o4VGyx9cfMAMc4HSuF1K4vLDxsyXDmWDULuG2kuLQbUZdgwrAk8kkAk8cYHLYrofE3im50KK2WPJtWuDbTXCMWOzAJYL2VQASx4GOnFEJpL0HUg5WS6kt1plhrUq3U8r6fdqyxw3QOfuHOHHRkyB1/SvD9L86PRdTvJmZDEk1xZ4b91NIZCjuR7Asq9wSD6V7o92sPhLV9QguBCLO0ndQ/zNtUMQCO2eOpzXknjvS7PR/DXh7R47zdqksEAliVMNCsgViHx2ZsEA8nHHFZYm1+ZdEa4Z6uL7nReFBD4O+HcN1eSfZ5ruJ7kBjtMjtH5car3IC4/Oq/hvTdbh0xLi10/wAqGNvNiuJZgN46HEYyzDKr252kD1rD1ptIaSws9MFzdXcKIl1dTzGVnK8Ki84XnsoA6CvZdA0OTRfDsdneYkZHRJQwx5LAA8EckZ5z07dqKfvySWyQVZezi292zz/WPDcgudOk1G7ad3vVtrxRgwRJcgqHjAxxuB689MnIrY8QeFbeze9tbKwiaOygN40RjJRVG0bkPJAwy8DkfMRjHNr4iD7BpKSt+5/s+W2njLcLdxrKGZBjG4qeQD2zx1q74rv7m91u/sLRQ00tvbwrIjkbUZ95JC8ngY2+/PSqnFaozhUl7rW3/DHCaBfwSeOrzyC135VokcWwFSyjB9eD7njjPWtFZZNS16+80W4s1ML3CjIBYDiHpl8/L1xnpjmsfwvPHDrms6nKotVnsftkYMZO+MTt0+gB6/XtXReEY72N7iZngWa4kEq4cmVpJBxx/ewQOowBjI5JzpO6Sfds6KvutvyOgvCjQSB7CWNmIEFv5uJUixhnZAdqgHouRjjNcT4oK2ujXviG0eaP9zHHDDNHyXIwJmbgZ3HgdcAE5wAOvjEOsXD29vFaS23nlri6ZtqXTA/6tGIO5M/ePVjwOM5xfi4st3ZaPoxSOS61a/iEcdtAygIh5wc4JG4cYH6VtWd4tmFHSaRB4e0WbQ/+EWW9KKEhkhjVAPMjkkjclzn+Ld9a2/Gs+nXlppCXLTzw3epRRlDKQVPzgsMccDJyBwQKyddvZNMnuLdZoHSOa3vrRmzkJ5qhk6nIXODyeCK5/wCKGo3dnqVg0UK7Z7tLiIlh5jNDuUH2U7sfQVk5KEGv67G3JzzT/ruYvxBhu9R8c2uk37rLK5htFvFXabiHftWUjoGIOGxxuBr2jXdam0y5h8I6Nb+Ub6HyI5t+FtYQdjyZ6/KvAU85I614j4i8XPq/jvR/E1zbmx0pmgFqhxuW2jk2liBnncHNeo22r2ytN8QJ57aUXdw0ccdy/wA1vZh9sLjsrblDE9cSH0qKT96Vuv5CrRdo3Wy/E5fxh4ks9B+J95LFYpJJp+ni2hjuVzGp2DAIHOMMT6k4GBmrvhlR4PYSarBJda1doCkandJ+8JbbEOQEUkkscDJ6nFchp0N78RviPqOpR3SRbpftQljhLbghVVIU8DoDluOPwr1SLRh4YM8ME7TS3FqZJbidRuLRsDu3nnjccKeCBgAVdC7bn5jq2SUXvY1fDlhqKwS32qTW5nM26REyyw7OFjGeMjqSe5/Ad54XvVkMm5wAQowQOT7fWuThtzLpcETykh83FwfuZySW7dTu9OPWt3TtQaM+VaQrG+3awRO5449T/npXTNc0HE8+avqea6hePdf2q8l4/wBqtITchxjYrEAgrgcKUdxgn+IZrmtJuYr3wB4gZri1hhtoZoLdUTc0mTu6noPu/l7VTuZZNP0uOGKRo3ulRXCykh4XVXYH2GzqOeKp+HriCPw5q5dl2o6qys2QqvsIOR7kg8dK8dVbyTPfdOyPRbfRkSHSWv1uLtLW1DTKEyYcIqghWyBuJHzdcqenArn77w1ot+okjtDZzKsrvdriFgVIwMgkOfmI6Dt7Vrx+ILm+8R3d6rG6aNvKxt2gks2B2wvzA59cUavqYne3t47eO2eCG4kIc5UhlGMAdRkHgcc1tKSnC5lGDhI8+vZ75P8AiUX10ZNzr9muXTb93ICHAwSe3OfxArrtTvt3hzTNQW6lluXjzIyttyxPKkg9myOn8uMvXdLGp2dhdJbG8+1lVkjZcbyQeuDngjj+dc1az3OiTS2twA9nchSrTLvMQJB69weASOeM+tct3FO/VHQ0m00a1ncxtY6hZTTG3uWlk3KYwBjnAz3wfTj6ZpY3bVLyKWaIgyREIiP8keUwH7ZII5FVLPUQ39oW6zvJBNMQzuV7Z6EdenatiyP2OCX7O0gSyYsyTICvGMDk9TgY7Cs5OzsWldD7OPyIRLPGHBRY1EnHXALA9h1wPXtV5bgJZR7oA1qsZbfGy5DHjJzyDgkZ5/oIpHtbqNoLYsvlopAZRjJA4IPQc+p4ODS2Ey/ZZLcukaM8gSKReJCDuOGwcjGR09qTk1sOyOVeAyadqTXpdZkVZR5gALK42sGyeoOOnQgVreC/sU3gn7HLpq/aI7ieN5zlgzhSQpA6jAU89cH6VQ8UWTjTVuknkEroybDtUlC4JC9ucng9eMdaZ4curtdLjaO+SKRJJLg7k++QIxkjGev/AKFVxlZozkrkPh6+ddf09r1J47XT1lWSIJvMQLhS2OOBu79lArO1bT9QGvSXlsY5CbkQrtfOSyb056dMD6/WtbTn/tDxHrH2LyriW7RgFyc/Pjd1468+nFVZJpZriRbZpYZP7RBlXbt5CiMkFTgjJ7HuOlOUvd0Eo6nQahPbw+JLGyvmMsBt54ftBYKrqUjXryAN0bEH/wDXVW4t7XXEudOmULPaMYYrhnKOGBwspz0Vlx36ZqFZPP8AEPhyFzb3IXT5Jo1dF+Q+UpJcgYPKscdsDvUniFbvRLNdURSkrxv9oOOd+coCo6KQQAexAzVSlf3hJWXKYvhe8neG5sreL7XIkexldSRbQKSzMvOcDkYrcsytwIEgWN4zORmRcgzLbqo3djmSQDI/kKyPA0n2dNcuJI7omWARMkHRmYHarY/hJbJA9OmK07bV/P8AEaW8a2UEMMs08aKuNgByQecEny+/TcMdKiCtr5jk29D1a5f+yrT7BakRLErRsjP91vTjpwT06jB714Z4/ks7rVpEgyrRIQx2+Xzvbbn1baQCfcV6zp+pQXOtXcDXXmOVh8oXA3BuMFR/tA4yf9n8K8g1iGPVrzXbj5fMfbMMDjC47nPBHOc9AM104id7GNCNtCLSZzLYLa+WI1ntpiRs+V5lYspx0DcfrU/gF2uPEHh2Mu0rC6mhMTHYoUqCfmHJ6nP0qDwlJEL2CNJWjRGaDzmHB3qR9cbsYwM1U0K5Gl63bq8kq/Zb1ssuN33SmBnjrj8K546NM2eqPQ/iX4hxeWHhu3VfKupY7iaOMjPyn5Fx2JPP4Drmud+MepPe3WlwDzWLRBxG2Cc8KGyOpbb+lQWCnVvFN3f3kyRvKgeMlfnjjJ2jYM44jHXPU1leKvNvPGMqtnZalYlDYG7yxjHv82ea1nVcrszjDlsj3L4Q6LB4X8HWciQolzeAXFxLwS2SeC3oBgAfj3r0CLVY7pWkLeXGx2kE4wD3PfHpXHaAWtdItt9ubjFsqiFpNxQAAAddvPXjnvWlYawZboW1xC0bpuYNIVOUzgE7TjOeMZr1KbSikeTWp88nI4P4twxprvnOiBNRtrLyHbjM8E5R1z2ykufpW7rs0UPw6eeSCJNT1idmTBHBuZjgAk4+VG5+maxfjPqmmHwtItxfebcLfFrQkh33DBJXnpscdf7o9q5DStO8S/EfUtI8OarFNovh3ynv7W3Cbm8lBgMC3zH72ATgYJwDxXLJ8s2l1N4QTpRctLfoax+JGh+G9GTTtOWe91WNUhk+yD93M6Hbt3A8pjoVHAPr1li8WfE7UbSCS28J2tlH8sX2i8QoHbO5SQzDnn05yfWu20iy0bw9axaV4O0+1ub+Ha0t4rBEJPJWWY5+bp8gyenTNV/EMniPfLbXOlxRwXC+YI42S43BSCSDlQMgAng8A4xzVrmS3+4XNGT2+/8AyPKdX8S+PtSW/jvtOFtaykrM9pa+bHlAMkN8xGMAgqRz9amtPibc3ejXVrqthdyXiRSwg7SDIJEZAxBwScsSx9h9K7C2l1MzXiGK30+GKd43Vju8kgjjkDI+VeMk8D3rOk1Br9tXv7VrmUWKkyzXKYMsgJ3ANnp8p4zg8ntXP717ps7Fy21Qup+KfHvjTw4PDuleA50S4t44JLyaMr5ijGSN2AFOOpJ4JrO8VabNbjS9Hto7lNUTWEiuLh5fMxIqgDJHLNudn9l2+1egN4mvP7Dl1G0iMYjgBkuJ/wByGkwABGg+ZiX4HCj3rnr3SHtfHXhTRpXVriJ7m/unmw6s+ASxxgnJz1PpXROOm97nJCVnta1zn/Ddm+heNJo9VjsjPbSgeZAwWFCSoVwT9Qc88kE969Sv9XL219cXU+29ghCTW5IAOegPJO4Nnn+hrirq4t9G+KV297bNLYNGRdQQDCGExrvJUjJXABI711unwWWr6ZNFYpFeSolxpaTrNned7eUQ+egjwSecg81VCSjeK7kYhc3LJ9kJ4xvG8TeGtZCy4jVDEoUg5OMAkHoA27kenBA5rzzSzPPZWNjZyyCfUd8k9yQC9vGIzHLgnliiiQjHAJX059Q03TbO48FTX9xIjwppjIAibQWWIll7k4OOTyWJPavJm1a88Fa3d6RZRrqF1ZW01ppflJuYNOY5nbk8ooVj/PrUVpaplYdXTiv6/rQl1eST7fPp1pbieC106KOdzLhY4EuGk3EE88FRx6n1rc8JiPW7+8neSZdMjxHK6sfMnUKPkVhgIhB+Zs5KnAP3jXIWcAGo6ktzbyG6t4IJWiEgjNyGlEgMmdu8YbsMDgdK7Dwxb3mtXN64tULvcLISkjLHDIYg2FU8ZOSORxjjsainL31c3mkoNHpdjqFnBaIlrFC1smUWK2tidoHA27eAPcHsK80+KHiaeHxj4TulS4MlnczG2ikjJZiQoUH1JbA+h5710ttcvpVq4vf3rQu80qLIyhcA/wAXPGCvf61zXxEmhvNa8DM0jMzXXmOIwW2cITgDkY69c10VmnD7jlowtP7yr450LUNRsbOXUGgGoTQmBYy52RyFhhVAAHXgk5zkHjiuD8XXEfiC68NQeeRK9okDq7M7QZcghjySRn9BXpOoavd6rcanHbQNdyW0CpHsVm2KJTI8vA+78qgEeq1wcFvan4w2Utsplhluku9loPKOdm4hd2NvIJ68Z61zVrN6dTrotpa9DS+NWk2GnWHh/wDs4IsUEctoBuw52hCMr1Uc8cDr+Nb0dpJ8R203SrWWWDwlo9vDHLKox9snVAGCDuqkkE/XuRjF+ON/b6rcaK0UzcQzyOjEblBcYLL1UnkAEk8CvVPDNpY6P4cgsFR7eOOBVdto3xoEMjNkdM85PqTWkY3qS7aGMpctOL66nn/w2lk/4S3XbqytEjiEohdEkVSqmSQ7duR0CjjIxjvXoGualY2/hq8utQsruN1jklgCsHzyAv8AETk8hh6E5rzX4PPcTQ6rObaVpL2V9swXEbSbc4JJ5b94TgdBzXaJPB4xubLT4jH9ndPtU6hsEwoBhevG6RQSe+OOOaulL92kgrRvUu+hvabcLc23m3jmKaaHzXaZPLRBkfIgbhmGRkZwP0rqLK6s9OtkKMwluBkov3wQRnPp2Ppya5jQ411O6jmv5YIrbTXZYYk+ZW+YrwCMg5DHHTn15rotXaIpdJC6peu0coRVLCNW6g44Ubc/XPTvWvNfQ5ZLU+dXebCwTK0C6VYTQSkqGLqsjL8v1U/Uc4qO6tpLC31e2R0Ic22zCAq3QcdgduP1rptWhUad4rv7GKK3W3uB+6YH7skY4z3yN5+vNYOo2tzBqtrZyOVhu7e1klUHcoljAywHt0x7/jXhtWZ761RvaT5FjGIrtB5LrlpGQtkt1LDrjpyPxqxqcUF/NBLZ3FuuLaVCAcM2Av45xwMEj3qDU98aqXkm4xNmFC67AMAkgfL3H171mTX8UepkWy6gCFbOEKlScb/lOAPX0J+taqTS5SWr6lowvbwQslzdkGaM4RwuFAOTz97Of5/WqWvRyyaewDwS2yTPH5bJgmN8HcRkjAJ4Pse1V5NQnWGB41n8tpYmEksW1jkEDG3pnntTrgxk36xRLayzW5iS12l5cZBGwHBK4yemePxqLuxTtcytFs4fKuYXZrd43CjyeQpOV6E/dyOevBrqNukPM1zBN5yvaGTZIdgc4O5YwQfmABGe+PY1zmh3lvBc3huAY5Nu5HJPDA/jnOc/hVue/WW/DxsqwOJVjjbAVWY7vlPuT0x2x3pSWoR2J4LuV/8AiZ6czxzpFFtCMACAgUr833skEYoTV7yOF5V8w3G/9wyknbgNu4xwvzL+dNluHitYoJLcmVJSoQKFG8puBXqQMsTjHUdqVLZktooZDtEcMxJQ4+cZPQ8gjbj8KjoUO8Unb4Sl33SNK0keUiAO5sEHLDoAuRjPWs74bXz2lzeXh81GgiR/OaMyLCD1LqATtOACRjGc1oa3bpd6VI0iySXIiaSXynGGyeWccZKnHP1o+F93Z6TqWsJdX6afHLaiPdIRkMCMKDyOT3/DHNbQabRlPZlS+uDpuv6pM9uIS7pMPs7bk2lN20MvOCvGf9oZ5qCeCWy0KS9kbe4KXMbJIpCFn38468CMZz/FUevTJN4m1w2FlE1ikTDyrQskDkpt81ccYDAHHqcU/WYrWwgaGyvEMrxKHQA5kVkXAYHgEY5I6GonvYcdtS7emOPV9Lu41WJZZrm3C4+6pVhjA9PMA/lVbxzr76grwW0d2YtwLsw+VCDgRknqAcYNWYNQsL5NOt54HhuPtLGSayf5lV4Rgg8lvlU8cYJIqzqMa2Wix2c8Kifz/LK7S4ijwR69M47Dcee1KGsQluZWkRXdvoFyLe3lR7qeFInQYJbvtPruKjsOKl0qLyYYtajsJvszXRSKQxAq5VVQoRnOMEnODziqWhazqVrZz28UW6OY7TshUtviYFl4BxnKsfcdutbcWtsnhaHRjIiMJZFW18oh/MbPI9cggjjrnOOtEWuo2n0LN34ple5Y6fDaJdSq8RlXPmBiiq2d4+XHOffNYWm6ha2Wr3Rdbf5bYRszkyRo+BgbkO0g9OeOnJ6VdsrSW+ubmc6QJJjCYwYwu2HaAMkE5zgHk9TWXHIRrN/LZRDLrHIkTkhUjUKWZv72Qp4H949Kqb0FBamXYWiaZr0sLywPA0qxNGjklwcEFGAxgHHz/jg9KvXrwnxF9jEC2DTOQZlR8TOdylmJJOM/3cDOeM9MzUL2aO9gv2igaObEg2w+WmQccYP0zj8ead4gvZri5triQFHthvGDuYqzbwSe/Jxke2RnNT1H0O0tY7FU1G7E7QRiSWFBMpKOsaYQ4GCOSfYd84OeK8PWc+ra/bxA755X6tja2Sck+neuqvNZWDwE6LJG9tcTb90rb5Mk7tgX2AIPbkVgeFbZri7upbWSASCMiIFSCu4hcHH3Tj3x7jNVdWFZ3Pd21CG+sLaOwIjgRQ1vIVzJPtXHyheFXI79TjiuF8a+K10K4Nw73NwZMlFmZQZhnIDAHjB7Y6H8KuWVhqun2skX2e2u0jHkkQ3xDjbkggBSBg4GBzyPrXmJ3eJPEk11NCXsrNzLKjS7gEB5BbvnuR712VKzaOWnRSZFqMWoaoW8SavKRLcM7QoU4ymzC4PG35lH6mu6sdP1nxv4p1WC11qSa0kggS/1KFiURNu5oowOMZbGxflG3knvx2sRf25Hd6pGqrZ27xokZb7wc7fMwcEKSBzj3r2v4XMkHhq7uLC2UwXF/MwiBULGi/u1ZR1xhcn61nSV5Wew6z5YXW50Gj6Jp2keG4bDTGAtIfuBW3FGB+c9cEk5zwf0rI1kPBsntZp1ljchomhXaAQVY/L1GHP06H23J7i2vNOuYQAGkGd8iHIDAbiMDruBHbqaxdSv7a5is1uGEDpvjmkB2EKSg3YGOcklQfQn1Nds6iSt0OGnTlK76mYl7Lpvhi6lbMltLFdTCWJGCBQzneeSRxtHrtI9K4rw3a2w+Hl99ruW+0JC14kaqQA5bcUc45wCuTyOR6V1Vrql5feBI9GS2kumnhysjFQjBoxv+XHQkt7YJ9MVxd5qc0nguIPdB7gWUiYVRwHwCOec5wue2MCuOU9rdjvhDe/c7y/vFl1fRtLM9g0FtGbubezRKzof3QbIOPmBbHTI/CubfxDBcfES21q+RVa0tWVlfcFQs5Abp83HP5VLod1czmHWLmc3NzcTxMkPXCgMqDJ4VBlsep3NyMVl6RHca1481WwDhHlaO2EUbAkLt3M25uNoIGSeueBzWsptpNdzKMFG9+x0kPiC2u/ihbahEgnLwspRCBvbysck+pArftSdNvLrWfDcNiibik9hKyxx3bfdaWI5+WT7owBhgOcHmvPNR0zVNI8TJbWsFv8AabeKWWNgm7cixFt3OP4ASARWz8Pv+JhZ6o19eXTQWN62I5XVNiiMnex65HoMdKIVPe5XuTOkuXmW1kTXPxGtdP8Ah/Hpmkxfa9QvJJLAWb5DJI7ksWAzwMgAA9SOuK5q0kWw8da9pEl4s2oXpjs/tcdvyhJXzhGoOFUAlRnPCgdTVG2tv7NstJ8WXMHnLFeEpZouwtbRlmZ2c5w+eQPStnTrW0jt/DGuhvLvr/VZ2upxdGLyxLnaCeq7cKcn+RFTzttXLUIxvYhvmF5401yFfNuJEubCMTeXs2oAFbgjvuAxx69q7PwNLBb6bNJPOI7g6iqhCgWQIlsGbYPTKnnvXC/aov7f8RTrcNOjahbLG43SBsMvJbnuoGc9+M992xtkNpBp8zPPdXFy8WVVnQbt6/dAznvnvj2ojO0/67hKF42OqkvzBpt1am5kuLq9MUU06cKhkYFkb+FflyB0HesDx3rqTfEDwdDbRRxLBG2Db/ODKx2gD1ZTgEgDkn0rqtVWGxn0zTrBVDCMxQ5VVMMoBRMnAHHmscsMkr3zXF+LhFpnjnQbqyQQ26adci2ZHHzspbLLnhdxJ56nJPXFa1ZaX9DCkry+83jqZs59SishHaJNaQW7SMwDRwAuqklcks+WIAH938fK9P1KKDxvFfXQk2Wtk5ZXVZDlUK7VB4wP6E9a7dV8/V/MHyW0cZaSRJCOYiqgFc85Z9oz1BPauP8A+Ec0zxL8So9It7iZknuYFlk2/M7Fd0xUDjHDYrKo9mu5vTildPsYviC11G+v7a/ktTCupR/aYIuoSLcVQH+f4/l7P4m1W3tdFu2hklM1np8lvuYnaxaP5sk4yOnTPWuG+M1nHpPifTEt0m2xQMqxMmPLwwyAD065xVvWfOl8FXN9rEt491cI08KqrpDGXYfMcDDNz95jjpgU4Plcglaaix3hfUl0/wCF8FlNF5MRupbjzE5eVOEfPIxheMDkkjsDXVeAriSz0291a7hli+0MTtjTy1jjCZjiLEZ9OADnd78cZ4T0hZ9N03Sks3mk1WRJzdJEzOLeNvnCjsCwA45OTnsK73xSk13dG1QXkc9xcfY0jA2q8rsqZYnGUVAQTxndj+E4um/dTM6u7iupS8FvqkyW8RubW3N6hvHMqHcn/PM5IPcjAAyeT05rsLxNMsra7F7cuYSB5YuU4uHGckuAM/NkYI7enS8mihb7VIdJt5WvoraOFT56uks20s25ewAMYG3GCQBzxTNUtH16xg0KG7jWxmtt9/5KnBgwAEyxwCzHBHB+V+c1pGfRGEtXc8m1Cd00vXJLVWaK+hikKSMGdWE08ajdjkgIMj04qpc6vb3PijSpYoStmgklZXXerySkuwJzhuSoIHHFV9WAtnGnSqwSytkQ5Y4kfzGO8c5wST0HrWbdvZvq3h6IwMm2CNpmZidwz7d/5CvKesj2uh3F7qaJC0W+AMF/flztVsgsMAcjBxwc1hXV1JbXD3AnCrBEzF3jyR93jGeeT+XNP1HUrRoPsipm48sF1UDJGcHOOo4GPxrBv5ZZ7i1SWO6nR4wxjHJAYkcAdB8uOeacnd3ElbQuWtnPc2FheTuRHcB4YoxwVVcjk+owR+RrSg01JLiIraxpHDJbo/kxfMxJB6fxMM46+9ZUMxv5LaC+Mg0uCWRRHBLh8Mmeo6AkkfmPas5ZJpbYeXdRok9wp2DjyicYIPYZHPPofWpaGmKZhbatJ5HmZRsoAAGbOOCvTjJ9PrV/WLnc6297CI9uWM3ksNrADaG4yuNp/Os+R30/xDHAR5IMaKzRvuY5QA9PU5/WtDUNRvdQMJaBYkjU20r7dpkfjdnHU5xk9cH8KGCYyF21O/jkikZ87phGr9HAzkjqV5ODWpaNN5tld3kglxc7ZUBIJUyYZTn18ztWMUtdN1rSLi0kSBJ9hVURuG27WA3cEHPqec/SrMl+Luw1C3gmYSITKrRxc7AcnqQMfKpPfIFTaw7j9bka3i1WBBiO6tjblFBxE4IYKMnnOBn6/Wsz4bG6Gt3yQztFK8bRybQBuBYZU+gyDnHPHFdPqNrG2ganGphd0Vpzh8bV2oMdMk455/CuV8GTw6X40ha4LrE8wRivHJyAcfVgauMrWZEo6k2q2Pl+K/EqsAP9GmuVSJyvlHru9SoB/IUzV7LT7Oe2i06Rle4sY5JS2W+dkbcOex+XODxUOo3k8XifWb9JFIktbmMbOQ6sNpx+GT7da1W09pNDiuTIsm6VAkqMN0TLGTtxySCp7H29KGCRzcMc9hpfh/WYpEjLTyBWXgrJEQQT24D5H410Ut+1+YkIh1CZk8+do32qXUAlu3IB6dBxWBd20xhn0eC5861GpoII2yojZ1IJ2kZ6BR6cV2HhvTNOh1fV41hdobOJYgS+0rumUZGTycDOCfeno9ETscy+qGTTo4zLJmLUmk+zRfKNpVcAgdeAw/xzXYeCtLguFlvLRA9xHDcbXdMvEiuwXapHU7hyPXPauO0WCG71jULpdxha5MEUWzJYyMwBwO4UMfqQa7f4fpfW/hpyVnmbUFks4IgclpQwDEdScbyePTJ4FFNLnsFR+5cpaNcy6Nf6pKWjmkWR47e3dSVkkc/IuSRwd/XPQE+lcJrEt3pWpqq7JXurYkqvzKysCMjn2ODXe6bd6ZrPim7v5DcyafYqsswiBLzOsKxlt2BhQysCR03AetcvfSwX2v2gVVWS3gWBpFU5LIScr75x1qpfCKO5H4os9mhWKuAhtMRd+cgZx+X6Vh31v52jR364+TZETnBPLdvTpXW6tCLzTb9Egd5JEMoM2MptbPAzznByeetchBdKdCubYnEkUqyqPVTwfyJH51mmaMrQLLJaIkcmB5+WHYHaOcdOgI+grf8AAxlY6i6SiHcqfOW2DAYEjj1x09hXN2NzcmD7NbRJJJO6AbjgqwJ5H5kfjXZfDvw7c6jdStaRQSzwyERiduwVlfbwcnDdPoe1UrvQm9tTrfFPiU6D4elkikImlTyrZljAIkIHzhicg4LEnv0rkfBXg+W5tre8vXeS1mPnx2RHySlTgO/PI68en1qn4qu7jWNU07SSBK9uoTBPQnHBIPYZr0vULYxamsOlxBZIPKjDJhFI2qNu3nAJwc9ehpP3dSl72hzviue3s7Z3ZGdtRiubdQmPnYSI0RC44w5P4NivQvAusrp/gzT4YHtXS2j8v7Ra4LpJksVI4yec4zyK4J477U9euJmMNvJYDc7CIvund8cDoecHPbGad8J7+50sXiT28t3bx3Hz26uoZwBxhTgj1bBJIGMd62o1ryuc9aj7tmeg2XjKztr9p2ugtpNEXB7hgxwTkcYz0/GuD8Uavdazqd3fyPxND5TNEmI34JK8/gcmtrVfJvZdQk02GaILJFJE021VgUA8OPZj09B+NQ+HUiutIvlmvbttSvIpplZJCm0qzc8jDADv7AelXK8/dbJhaHvJamAL+W80aC3WbCxQbVAlC+X8pJJAwSPw6n2rC02W1fT9My5f7QFQqh6bWBOc9FJyPwNdVBBDc6JaLdMt1potY0aQjIVyqscD8Bn0zWL4FtopoVS3CwSW8P2mB2+U3EiSkD7wxnAHv2Arllqzri1Y045bnzINJtY5IobGSQuYQoVIfmkQgk/ORGw5OMDAPs/wRdWtt4v1TWLFk1BzMBA0hw7Fl+XnOB0x+NJ4tE2mXl5rNpYwr9shNvPt5YSsrkyBeCNysV6DPBOOlY3w10uEaybMzOS53hVJUjblRn1OTnAPQHmulS95JHLKPuu51+q69a2njrQrxt37i4jgvZto2O77t2fUBHH5Y7VhxWLXfibXtOsD9psLa+W8uCGWLMQidWO49FyRkDk8DHpD4y1hbrUUtxK3nXdxLdrIATuQbVQnPXKrxj39RVrQ9X0uLXDJ50dvb6zbot+sS5VJODIpJPVjjgf3sYFRN3lcqCtCyL2noraHY2txbeW/9m3kjPMBt3Ss4D49kjk4OMHiqOm+Gri08BeGvFssqzywXsDyW8mDHLbCTYoYHqR64Ix1zSeJb17vw3c67Zkxz212NHjUIACjCYygY95Bz7ZrtPFumy6J4EGg6a7TyWmmrNJIzFVtYY2Uv8vZmc7QOuMmtnbXyRhe1vN/1+Zzr6TEg+IWs2NzBZRWU4RYkJCy7FU8KOxZe/TI6VZ8I3Fpq2p2UeqtMjwoXd40xuZyQqhjzjLucj9Kr6KkEdt43YRzvHPM8EaTDaFcxn77HOe/JPXHXrVfwtZznR4b3LSSXiOYoEk2sxU4VfY52k4/hycjoZXxJr+tSmvdaf8AWh1Gr2U/iTxNaaRb3rTrFZiS4LAAxISxILADceg6d8jtXB+K9akn8a6AkwtriPRbg20cMTj94sbBwWPoeFyeyGtDRfEs1prF7No0D3F3fWsNsskrgrHNK5+8OpwSAFGcBcnFYuvpptn4o0bTbRVNtpcCee9t87TOXy7biPmY/TjOMcVU5XQoQs7M6jwbZXOp+Ir+61CMyJFZS3ex4zGu/wAzDqPUrvyPqOhrkfhdPFZfF/SzI6xtDeyjcW4Jw64yfWvVbWz1DQLO0aeVD9o0u/uZ0jkDMAzxuOSOcEjP49a8f+H2kx6j8U0tdXiSVY57h542B2uRuyMD37Up/ZCFpc3ax3X7SiLJ4t0a+Rl3XVkAVzzuWQr19MH9K1PiXY2s3w6vp44AqQC28mNVJWJncfMW6Z24UZHc+vHn3xSvJLrW4bsSs1vDE9lbhgTiON9oYEgZyS4/4DXWfEC8jHwutY7m7kku7lYZUgAGIVVwpLkdZPUngdAB1LTtzInldoE/w11O7XT7TU7WzijnW0TRrJXC4lKkNJIeMnDsCf8AZQ810k2saXpXiPTkujc3NjY/ary5kkBke8ujGSrhf4iAxIHQBxxgVxPhC8ksNFh1GeS5iSwtc2YiXLB5Dh2Xj+I4UZPf3qaP+z9Q8VWWmXeoqFnzHeSJN+7ijeRGZUk42MBGyEnJwo/vDGkWuRETh77PYPCM0sFrKjzW8d3eDz7m4IyIGdi4ijA+8VDAHnAIPXpR4Ojs/sN5rCIXfWb2S6t1WNgRAG2x/L0BYAyfVyepNUPFt9Z6PoWoS2lvNCws/wDRGW5JCbz5S4xju2c9eea3fDcT2lhbx2qPAkEcUMUpO9gqLt2gYwCQD6delVtqYPVHgfi7UY59fu/spSRvsYhmcja2S33h053H9K5DUr2S5uNIuhNGWgQZyxG4FgeQe2P61e12W3fWJZYWy6rGCeocjr+Y/lVK70wqmlmYKnmQjbyfm+bnH6cV50n7zZ7SXupGxboCgngMqEOm4tkspJ5OejL+vTrUsDLZvDsuZsqSzEff+90xjOec8f3qcbaRpXt5J3UYZWXOCpXjbxnB/wABTbuxAujLDMpkQZYM+CG479eQc/WpbGJdtNeQ3UMbSW8EUSXGBhQ5JxuI/pVW5Jt4YYgqyB51/eHBATuCT1HXgfrWhcTztYTst5Iq3EYiZgFCnkkbjgY/iI7etV9aMhksrhvKkivBHsIjPy4A465HTPH4UCKkUosfEZkubZHtmjO1nOTsUdFI4JB7nJPFbNjDfMF01UEnP76CQsF3sScZPI4469iewxzl7b30OtLIIY8b94QKAiuclcYJyfYentXVPNPMbKJ/tdrbfKC42zFhnazlAM5GemDjI+tKSGjF16WC+03TrWO1jjntrVoXZXLO7qQR2+UgL265zVnwxqWyHzJ0Dm/ttm7AxE28DcSfug4Vc9M/XIh1axI8OWGow20JzJPCLpjuaUqThWXPGFX0HJNYeiXjNBLazMUdi8ZY8qQyHGAO+QMfSraIR2vhm0trrwzey3IRJntZA0pf5I2AYEkk9TsGc5JJrg9PI1WcA+ZDeM6YOR5bOyhhgdQSQfYe1dNocktpot/dy3HkRea/lpsHzK2MnBIG0t3xwQOwNYjS/ZnubiO3JuI0iZJo0VtpUKAwww56jI9eKT2sPqSeJitprxSAQujaYFZo8DZuU7iR0LDP48d63obmG90dleYlfKecQo4i2y4VQ+3IJ+XHt29aw76e3i1S+KjMn2Pyg6pnblQGHXJPUZ+tdHEYNP8AA6rawL5t2FMkjAb3bfnaM8leOg45/MTugscwbWaHxCbKVATG8c/mKvy5VMAjjOOQc/jW1e313pelaq8KojSQqHJIOcyfKQOx+9zz/Kq13FK/iu4nWR/MeMvgq2IwQOCSPp2x6VQubqTUpoNPy/kvKgJYg5I7E4z/ABce1T1Ktoa/hCxuI4LT7IImmFtc6hIZOdu7MKk884G9vxrS8J6hd2GjWuk6a0iahqTsgukJLwW7lQwT0JKvnHPc9BWfJLPpvia8tbZZAUsI7Ly1k2gK20H6Dqc+pBrQ8Ea7LHbWZYyS3CWzLaxQgswdmPzHB4AAzn/9dEJPRkyimmmaN99i0tdI0jSkjgeKO8tZT99mC3AbJ+oH4iuMjuYbzxPqMqKJftDsyuAAMnliAMYIIz+FdbfafcWup2FxrOJIprua1mhjG8xsxAz6E5ZD6cd6421sreDxFdI85g8ky4ZlHDgnIboM+wq5u6dyYqw/xXd22lXlncRSj51aJzuBwpAPT2JP8q4iQgsxR2UDg/T+orpPFNkZLLz9iDa+UdFI35HPc/rWPo0YuNRt47hMpK4jK8d+O31ojtcbKOms0F0A4OY5lbHfhun6V7V4EtVt/DZuHxCGuJZ5icKShJQjdnjA3H6LXk2sW6WviK8gjIIjdVyBwSFAJ/MZ/GvRNYvxpfgF2guHQXMUcMYwMu7cuB3GFJ596cXrclrSxheC4vtviC91mS0juLdJBCqOxCqHbaDu9lHQ9c1015qzLJez6hdSLGunyTRBF5kdVVUfpxzwP9zPeqPhuxii8AwReUszXV/HLIufunJC5+gNL4qgCalDZxPJIJb6K0RCVyUA4A2gcBsflTbsFiPwrqt1HaXU0/7y4e8UeSJBuDquQfqM498HrV74d62ul6tPOrs0ct06yyxxBmJ2544OPpzV6x0KTwzb20DXNvIkkBnFwke4ypzu3c43cjk+o/HF8KWD/wBsa1YoLeSKCQzEvGRjGSM9Co6AntnIqIpp3WhUpKSs9j0rVbW2vLuVYbeeW5v5UuWiWYqLqJGkDZUYBHyqA3qfTIrkJJY7kR2wN3Z2tml1CsrkZcpISQR2IJwVHUL6VT8Oatq9ikV5I0biSGOGJFH72RAWbAbkA5yxGc4w3sLGjbtX1bVDa5S6UzyeXJKR5TMidUA+Zzgg54yM9q0cuZmagoxKOizM3gpjJOIGijRx+8KvISRtOSegJwMcZz6VT8L3X2fw+gkeFxGZkIZQ/BJycZ4PPfHY0TyTtpehad5UXl3LwvsByPLSJXZC/Byc4IHrjORTdskGn6g8Ihj+x6hKFiX3wCuPQcdSc49qykrrQ2hKz1R0HiW+spPDTp9l8ie41JJoJGfcxj3YKEdcYz97qSPTnmPDurxabD4j1aSFjK10sNqDgOzuz/Kv0ABOOmPerfiy4GraHZ3UjC0W3mEQBLbACCznB65LKeemMAc10HgL4d2l3p2o+Iv7TjVIree1hjliB2TFSzuATgDoF6n5s8Grp6tIyqtRTOO1TR7jTtf0qyuHV9WEknnFTkRhYl2IOcbR09c5qHwfYLdePtMiEdxPB54zChJLttLAegB243HoBntUtzcNB4zvbi4MbNBas6mMHAZkX5sNznJJOe/tXZfCq8trTxVBcl18wXcTyJGu4uBBMMJjPsKpbtCfw3KHiHT7GDw1YI72g1DUPEU/mMByIkmKcMecA+3TntXquqaNpuq6H4gd4khuNTsjJa7x92LDLAm31IUPn1fFeSeJLeTWIvAtlFDaRx31xezyZK5nke5ILNjnhcAc9uK9suLK9u9W02FLm0tLjZKpVE3RfLjDOCTv9OeQSOlbJ6s5pJ2XzPHvB3m3+hXIkknEN/qOJQr7HYOkb5PTcuM4GRjk1Z8Caxb6RHpN5IweWWGQYf8A5YDzNuUXGedozj5jn2p2m6vF4d+H2rWi3tsLq11eWEIrZY/ejBxjkANxXOaVrltpvhKeCUiS6jg2xOMZgQSOwK8g7ySBn+EA98ZhStY2lG97mr4W0o+IvFGo2qpM1lbXfnyG3xFI7iVwkaNxjO4scYPH5WW09rL4sLbwKkEenWMboZUjaSMIODgMBvGeACTwMAmq/wAKYrO73RamkU/nSRTK1yzNDGHDb2Kg5Llhjpn3GSa6D4dahYz/ABp8RXwuYFsoojBFJtEUZIKqAMcD7rYHt61SeiIndN+g15Si3Wnvf21809lNDZzRvvdi9xCCgQZ27VUYHH3iD0NeaeH4b7Vvic/9k31zZySXs0n2uJNzRJvJJIHbseCOehr1DxqwtfijpuoWUqxxSTXBmiiwyvLCA4P1YLGCeM4B7V5R8NtYs9O8UNcanfNaW0ltL5kp5y2MqMd8tiib1QU1o7Gl8X7u3h8QxaVpUzSWmnRi2RwSWLDLNlmzk5Y/jV34iaj5EEfnQif7UsCpN5Plo6xoM7c99+QcHk8+lY3jdBBoGgPiY3Vys9/KzIRuaR1IwT1wqgemQRUnxC12z1LTtE061mW5NhCUmlT7hlbBOOx6Ek88n2qG9zSK2RqPrbWGnJCjSxbTCHklyEiQRq2UHVsZP0JHeremtaaT4xEt5avaTsy3FvEUZ9kRjwoKDO8nqTyffrnA+ztPpMWq619sktJonFkufkaQkoCAD8oO3AyCSV54Artvh/fWOk+JrO5jETytaPAjRufMVkkIDSEn+7+YHQcVcJXaRM1o2b2o3GreJn027SeG2sJNTtbVkcgSoPvZaHGPvLwGz1HGcgd/fagsCu90xvLe2ieWS5u3VljVeqqiqME9+O34VT8VeFY/EHhK6UrI9+LVWsbgxsDbzA71LOQMkkZPbk1i/wDCRXPifw7ELa1guFu7eB5iZRvht8/dbHAZmU9Oo3HjvspX1Obl0PG7uzjs7+Vb2WOQxJh3WT5dxbg8gfKTnGBUl/BB5mgfZY4I5J1Viy87iZDt3YPJ7Z4IqKeSXULm+X9xPGYE+crnfsIZR9c5/wAmm3eo28VrorkeWtv5Zd4lLNG4Lkkg8Z9v/r15rbvoeqkbkWiyalM5trqRZLiQiNZZcxghC/JOcjjHf0607T7C5i1RPOs0huVVAsjIGjIyMMSB0PY4zx7GnW146ywzNIcyTmURHO5TsZj092zx2PtSX09xf391DbyXUU9laZg5wI1Mo4bB5XDHjnHUVN9B9SxPpR0rV7SS+iZre7nTz1dchnjc+YOwBG4cd8+4zi61qEUulWPlAIbaCKFieT5gkYHBz0xjp0rWsPEk8/lwauxAtoZyEJO4SsyElj2HyggjgnnIrlL+0EelWswkOyScnYCRgLIwbOeP/wBdUn0JsO1DUSfEOmXEuxNjviJBwhB4PpkYH1xW9e2V9c+H7G9urJhbzLt+1mb5xuBVeMAABiDgZPv0rjNUcrrsYkl8zyrgjOMKw+Xp3/xruNU8SSa9osNhcFt9tcMIYI/k2guSQc53deuTjHAzk1Wlha3MezsorzwdNdS3DpqIv2iIbKnGBn2YkknJ57d8ViWuLS71CW4lWKMch+QzOeiqPXg89BzzXVadoCz6VdSXlxEqRTFol3ALnjqcjsD+WK5TWYZbm+vEiYt5oR4HZ8FFznA7fl7VKld2G421OjtNQaz0XXdLixLEgDxTSYJCOqkFQeoAGMntn1rHuNVikstStVMU++3jmYNGVIcEcZHUDI9uKRrzZHcP9lR0vIkVxJIyLHgDcfU/M3QdeTXPaqEOpbWdPKkEYLAbfl3HnA6cVa13J2Nm0snZbuedS80Nqc7lJK5UMpyenB/T3rdsdOhi0KzurdGnnJXf5hDHP9wenfjgmqWmRpf2XiXUEKqkdv5iwbz8gZ9qdepx39+1X7JUudF06QMxkyiEYA4Hc4zuP1qb9x2MPxJeLH4kuZrMvDbMdioE2FPlAIUDpgjOPwqjNfXcV887XQDWsqiFVb5VOd2QCSetT+KnhkkKgp+6JQ7W5znJ4PPYVUluGmEoDqfPmDksCSmAQMk9etUlcV2jqdRvY9Z1C+1Rp52Y20bgogBeQblCn2xnJ7+lX/BmorYaXBdlVieNo9mcbed+Tx1PTj3rlprh7drqGHzsJGo8wp8zAMV3Z444wOtTaTeCz8tPs+2Z4VKSSjAb5ugB4Pr+FSlbYb13Oo1jUJLnU7mM7nuY1mcTSkuxcrvUDPH8Oa5HRb46l4mkuLhwJLmSe5fGFVNyMTgZHr0+lb95f3t7fyzyyCaeYurNGu1izR+WQABxx0GO9dD4a+F3Mdxqokt1YZW1iOZpfqf4R/niuqjhp1VotDCpWjDfcoW/hC88Q2M1rbvawssjhS0it8hXC/KuSOfWpdF+CEVqyHVtdmMqtkRWkQB/qa3/ABJ498L/AA9t20+NUe6Ucadp5AZT/wBNZO38/rXkuvfGjxTrBaKyuE0i1PSGwG0495DyT9MV2qnQoqz1ZyOdWo77I9lf4aeD4Lua+uNFnleVt7G7uyiZ+m4VNcr4JijSK5svC+yLhUubxX2duhJr5gury+v3Ml1dSzuerTSM5P5moVgdskEceiil7aK2giuSXWR9UL4t8IWkYijufB0aLjCh1IGOnbtTP+Ez8IPLHJ9r8FtJGdyMVTKn1BxxXy79mmH8RH4CgRzIrESMB0OMUvb/AN1C9n/eZ9e2Wq22p2yS2dp4evbZAUU24VlA4JXhcDoOKmgh0O6muZbjw1pMksp2XIaAK79DhmB54wQa8A+BWrS2PjE6e0p8m+t5FK9i6jcp+vDD8a9+2bL8MP8AltFg/VTkfox/KuukoVI3cTCo5QlZMu+Ivhh4dn0L/hINAhbTygZ5IgxZVLDG5cnKlT6dMkgV474jg1TTNYdn80S3GnvDCxWNS6A4KttwN21jyB26YyK+lfAzfbtKvtOLlSQQGHVQw6/ga+avG1nqKavBY6ou6+jleJzv2/MoJ3EA8Z7AV4+Ij7OTgj0qDc4qTLfhLSbDWYprzbNcRWemtOySOuTvQZUAdcfe/H1rJ8Lq8/hnXzduzGGR2MyHA3MmOeOCQAB9CPeoPB+uarodrdjTbYMLsRxFGCngAbsA+ykE56VlSa9draaoQkaxyXCSNGMDe7AgJsHG3IJP0xWCjZaGrbk9Stc3U2r2qRW6TR29uqR/M2V3SNgsBjqTgevX1rttHR/7DCREypH9o863HGxzuG4nvwo7cY7CuQh8yLTrSyaWULNPG0ipjBO7qCMZOOOtdLHf3MWkJYpdSpbrG3y7sBiR06c5OefaqjuKS0Mmx01rvxrpcAkP+nCWNWX7pIDDGT1HAHtXQeApkS78Rb7uGzlSNIVllUEKGLKzcnAbHGemWHtWPbGaPxV4ekuJHhRZ7sRSsxB3EkdV6Hdj8/SptJs7iK88YRWqr56Wk6xySf8ALNfNxJkH/ZJ6jriknb8BOLf4kmoafcaZF4E1ae4TdPNiGKVABDCpUjdj5sHczH2PrXpEMuqeK72z1iG2GkreQyFPs0m2S6RCnzbsDbGedvRmU8kZFeZf2zcan408G6TeSzvDpsscdu9yDxG4QquMdAwK7h1GK9Qtb+4vb+GKC7mjL2drbLE5HyMrSGQ8jnDLk/VTzxWiepk4to81029hfwbMf9HSSTXLhlLjLhFhyqhsdMn15ODUegalp934Xm0KS6t49SbWRJCTCGlMZwuckH5fvEgdcDPFYGn620GgSafCoa1jvJpQT8wO9VVfxwvH41Fo1jdaL49aOKUpLakskq9Iw0ZO7noADn144qU7s0a0PUr+9fwP4g8VDS47R4rTS7e6kkmJ+0TQkqilXU7QVLIQAoDAkZFZnwa8jSItS1zUGmjs7y6FosyErnAD854wc8nnHNcj47121ubwPbbJUfT4LZmjIwP3UZ2kgkZDKxx1rvre1l8PfDfTWlm8srCrzZTcyu5JCrxnG1kzjrgDrVJ2ehDg2rGTrXizSY9c0zV9Vt5oXaLUZNyqWJmkbETOAACvDdOxweBXF/C+DRpNSvbnWRYPHBaMY47uJpgzfxFI1+8wUMRn5RjJwBVzVIbrWdBvLy5WJprawWV0PSBftCoqoPU7iT16npWV4E0a51OSZnSVrSIolw8Y+ZkY4MIPq/p6D3ocrgoDvFOpTavaafFBBJHaRh4rO6uSBJcR7vl3E/3RgZ6HGBms7WbnzJAUieNMCOKNlGQFAAAwPUt+GK1PG+pRXkNgsaxrJHGYtiLtCKfmwB25bHHpxWXcSCfV7YR4/dlB83d+GbPv0/Woe5cT1PwZ4Ze38Nw6rqdjHc3QSMQSSMGkgRTwiRg8DjOcZOaXwNObX4mSyXWnyS3duJnijYgOkrMDnPsCeT0ql/aD6UsDRSLblCHYkgoMDqQeMjPp1rH0HxOX8Xz6uxWRpBho1lxIykBflxyzYAyF9TWvMtCOR6n0Xd+Kru+Edvfq5keRQkQCnYOfmYkY2gD7x4PQZrx/RtQu9F+Hl/NDL5MkVzdRSLb7c+YZSCG4yeoAP932qxaXerajfmDRrNbWATo/mzl1dpOuMMScjHcZxwOK4qS+utQ8Y3Wh210sdhe3ST31uu4QicffPQkcryemfpTc10IVN9SJbe1tJpo1BIeAodhJ43EgE9uMD8agvniittGllUS2syiSePcQCQ7Lk++B2q9KS5E0MKiGWEqy4JDgL1POfX15NYmoXgl0SEqm2K3nIiA/jB5Of16dM1xx1O6Wh099NNDJskn2mJ0ROoAO3YWPHuPzp1lAZ9Re7uVlRbgOm0HJG1UI3Ae/OPfrVCK5mnkgWVjszFlGBySG559M1ZS8mF07TI0aSTSDc+Rj90uefU4PT0qWgG6qkNncRSRJH5G9beUH5kYSRkbm9wOfTrWdPC+oaZJbW1s0YgmZkXJCsyud2c+zZ9flz3q1c3Eb2LRSIkjyTDYDmRUjUqN2fXn9RmqNqbm6vEinuZHty1whaQ4A2heMDjOCDjvzVLuJlfxNp93PqAukhD7SD+6wwAA7bSeAMdelacCItncMsimFGgmMSff3HaGJxgYyOOe59ao+ILNLK1int3xJFOrLg4dQEH59Oo4PUVuR6rClhHL50xnuLW3KpGoiAwx3MzDtyOnJ9cUNuyElrqK0l09kNNkzIs0TyNESAEAf5GUHnqzdfQVz10tnZDS7p4opo4JvLcYK+cncn0rd1HVZZNavLlr+Q20Ksyoq5WUEINmevILfTFc9dvNqdkjyoUtIZgqgEFY1I5Oep+poitQkytfedcxxP5aAIjwhUXq4ccemcbT9KqTQC7urWMNGFaNUJGSB82CSfqe3qKmIn/4R9pI7kOzzMsijqDtxnn1GelN8PwRb4Z7o8pON0YGCQnzY/PFXexG5tW8ck+patah0s1mhaAQ4DbyqDClsYVenQ/jTxJO2nWlyIBFDHMsSojfNx0P44zn1prSxySzxTLHbTLJLPCWBVJAeMbj0b5QRng5xTtLM15o1rZJLcrtd5PKCD5sAkknuc8YzxjrUXLMHxMn2PUDbEBnEKo3zZDnkkn3zSaLHD/aem/aDHHC10m9i3AAYZJ9v8DTPE0inUd0RmKTRLJvlGGOeRx27fnWnovhmW5kS4uY0igT5isijDDJOGH0OPet4QlNKMd2Yzmoas1rrS1N7rtuJGmnlt4jGz/xuzs2fYAYx7VsaJ4VutRkgtEUzSRRLGyg/Ig65Y9sn8T6Vu+G/DMuqp9qZmtrActdPw8oHHyZ7dtx/Cu/0/SFhs1gs7TyLIH7gOGkPcsevP5nv6V6uHy+MLOpqzzq2MlPSGiMCw0XRfCVpLqU01tEIV/e6hMMRxe0Y7n88nueleT+OvjXdal52neF/OsbN+JL1uLm5+h/gX9fp0rvPjB4HbVfD1xq15q96v2ABobVQv2eMFgD8gAJPP3if04r58jgUrvXgHu3Wqr1J35FogpQilzPcrGIux3nJPJ5/n6mlCAA4HSp1QAZBzTVH3voa5LWN7kWKmhYIhJIHNM20+KIMdzAkCnYBNxYg4IGeKeoJQjHBJp1yoWQ7TuVuVPf/APXSsjRgKwI9qLAanw+u/wCz/G2h3BOALyNT9GO0/wDoVfUs67Wgf+7KAfocr/UV8jafKbXULWccGKdHB+jg/wBK+u735raZ17DePwOf6V2YbZo5626Oq8A3Hk60Ys4E0RH4jn/GvEP2gLSXR/iFeNGjlZNl6jZ4AYDd+oYfpXr/AIdm+z67ZSA8GUL+B4/rXI/tVQT2y6fdxSEfa7d7Xbj7xEinr9HP5Vw4+P7xNHXg37rTPDtLkkbQ1uWkYNAnlRggDBJ2gr68EZotoLSW5vMoJsAeS4+5lXwW+uDx9T61CzO2i2dpHGUcs2126OQzE4PTPI/GtW1ntYRfWptx5sFrCkjpnhtwZmUD1yQT7CuF6HWiqsUcc2mfvYghvQmXU/KMjg47HPb1q7dJAAroxR2JURIoKhgeAOfunng46d6rWLyTato8SK8gVnnCsfvjkjP/AHx+lPtSbmFvlLsdzL5YLNGM9T+eTVKxLbHWai51zRrfzQjzSyRrISD5bFioIJPBzzVrRpPNj8SGS5kCvp1wzOoy0m1wR3zzxn2J9Kxp7z7HqOm3RK/uZQ42DnBPXnvnmo9CnfOsRkkv/ZswJHB+8uf61PmM2te0iaLxh4bH2lnS9iSZXDFmiXcwIz7Adq1Jba5t9Le3W/fzFs5ZXj3bWhRVyRnd0PHHGfwrE8VyQ3es6A9qstvJJb7ZU5Uhgx5X0G3H61b8Uu1nBcW+npJ5c1tlY8cfdw3/AOrrzTbuJHNxIbLSfKQAxskM5HXDmNuMdM+9ad/bGTxRO8sz3Es9qZPMwcsfJGcZ5OACPfHFU7cm9gkPlpnyYAoPBwEYZz2HH6VKLKSXxDDCUZSkDS+Z5mwlFTJ4wR0GKLgRa9ZzLomn3EkjSPdSj5VTgFIwCgH+zvCj6V6NcaTrGo2V3cDVJprXS95Tc2UaSNeSOeAgCqD6k+lee315dXeoaNZwQSTzuimOEfPlnKjp/eOz8K1bzXrrSdEmsGmnB8kpKu5iquzgngHGeP1PWqimJ6GFdahdPp98kfmsjxQJOyglUjyMbj0yWAAFbXh67e0+H7S2909tLJqEsTKjYaclEVFHv8x57Vys0rpp08bSupnMcjqGO1mDnqPYGtMJ/wAUvo0alkWS4undkwWBBQZAPsBUvoPuUfFtkNOuI45JlnlVysm0YAICjaPpjH4UzTbdftttDLIwZZQ0jDnax7j17VHqLwMbNHjlZo1eaQs/3skYBPsB196nt4/I123bdIFByCuOVxkg+n1705aaAjurTwzM2opbQ3El7MyZhkKFvOdSNyhScfLnkk4HOa0PCng7U9Y1vXrY3CxS27rHP8gK5yxwxAB4IxwPrxUfgzWk0q/e6FzcwGOLarxk4XkN8o69/Q880vgnxVepqurXVrM6XF043eYrt5vqWI9z+JPSmtr3F5Ghpd1rup6jqGgWt9PbRxMkl6Hj2CJ1GFXeo4J2/eGOBx1rziweSLxrqZSGMyR3EmSOIFUEr82AflyRgAdeK7aTUbiDWtY1Wy1Gf7TG1swt4om23Mary5DdArKcH1yO9ed6TdzXs99Oyp588JZpd3d5dxP1OcYobXQF5nXyQLAtusq5KWtwQrZByAOAQecZz7HGO9YV61vf6LaWsVr5d093I25JN27IUdOwzn65q1rqQ3OoQlXfY0cu8Y4DsF5GD225/Gqklt5ei2Bt5Stwt27AjIcbWyG9uvFc8ejN5djT+1tcI81pI6FIz5jgjPmKCWA9fuk5962baxghlPn7pInv51DMcsoCFQSTyec5rnLC+h0TV7m1vUl+zzpI6Dywf3jKQAMYwCT7Y4raW+miit7SSJJXjnkE0iqd0jkc7fUZz+YqZXvZDjbqV/7Lkk0ss0sIDqVkODlACMAHGOT2qugt7TU9StZ7YQq6SSQr97D7QCCfQDuMGu90bwTfalp4jvXSyR5Fk67mKAY24PA/HpXW6X4D8NWFx9qeJJrkrhpGUyE8YPB+UZ+ld9DL61RXeiOStjKUHaOrPDLjTtW1S2uLWy055XZxKht1Z1AXbtxjIOQxJ9ce1XLvwpqFrpljNrskOmJGGiBvpVjyvUAAEsee2OK+jIY9JgjEaW1y6gYCghF/IVk6h4U8Japfi/vPC9reXIAUPdSu+AO2M4x7V3LLYqNtW/kjkeObd9vxPI/D3gSHxP8AapbHxTpZjk2rMYUkkKcEbQ20DGDyK6y0+BOjNZvZv4imELsDiG2Oe3BJOD09BXpNreJYRLDZabp1pEgwqRwgBR7CpW1+/wC1xHH/ALiKKtZfDt+P/AIeMl3OMt/gF4SkgET3utODIJGaNFTccAY+70wOlbEnwM8I3UwlmGsPhzJhpMDcQAT077RmtWTW71+G1CX8Gx/Kq76jI33ruVvq5qv7Pj2J+uS7lO/+E/w/sdt5d6fqMxhULlpnK4DEgEZCnk1wfinwok92Z/C9vBZ2wQKIpnO9jjBcyYJBxjj2616C91HJwztJ7feqMKJWDSJhQcqnv6n1+n861hgaKXvxuRLF1W/ddjx6z+GWrtfG9fT7FdyptiWf5EYDBK5GQDxxyR6mux0vwDFFi61ySOdIwWFtGCIl+vdv0/Gu1Mqjsaq3swZIo8H95Kin6Zyf/Qa2hTjTXuIynN1HeTOH8e/Eaz8GJFbuq3WqOA0FmOFt17SSY7+g/LHWuw8DeJ0vPBumTFpLmS8iaVpCNzliTuHHAAPbsBXGeIfhLo/iHWrrV7u5vjPdOHZQUwMAAAZGcYFTaR8OodGhW2s9W1mKBTkRrcKAD7fLxXLP2jeq0OiLhZWZp/ErxLpjeCtcsZ/Nine2YRq6feb5cYxn2r5Z5xhemetfUd/4E0/WIBBqU2pXkIOfLlvH2k+4GM1Ui+D/AIMT/mCRt/vTSH/2aoVGbdyvaRSsfNUannIpUBw4PGRX194K+DHgG8upHufDthIYgNsLhmDZ7nJ6Cu+T4QfD9F2jwdoePe1U/wA65q0lTlys1gudXPgDbjqRUyvGqgeYnHvX3Xd/BHwPIC1p4f0y1b2tUdfyIz+tczqvw80bQ51ibSNFO4ZXy7WPOPcbeKuly1NE9SZtw1aPjlp0+75ibc9MikMqbjiRT+Oa+vBoWmR/c0ywX6WyD+lSLp1on3bS2X6QqP6V0/VvMx9sux8hWVpLf3UNtbrvllkCLjpkn+VfX4j3QiNucptPvxinJCsfKIiH1VQP5U8KcitadLk6kSqcwlhKY1tp+6hH/EYqX9pnSRqPg7S7+Nd7Wl+rD5gPleNh368gVWtkP2cL/dLL+TEUnxb8QpqOmeHdLaFJrNr20+1LIAVkyQCMegzXNi6Lm428zfD1VC9z5w/tFdFFkNXgkkjjDeQqhfu5yeM+p698e1VYPEVjb3U8iWc5inC7vlG9CpyNp6YPTmvcZvhJ4OnbMuklyCcAzyYH054pF+Efg1Omj/ncSf8AxVYrL31/U0+uI8CHiK6tNT+2ae8lt5TFoMw7mXgj5vXrV2DxRHCrN9nuvMdFRxjKngBsZ5GcfrXuY+FPg8f8wWM/WWQ/+zU4fCzwcP8AmA25+ryf/FVX9n37C+uHzrfa3fXchVIlWFSfLBiBZQT64zn3qxpmsi0unuZ4ZnMsLRSIq4Dbup/TOK+hB8L/AAeP+ZftfxZ//iqcPhp4PX/mXbE/Xcf/AGaq+oNq2gvrivfU8K1XxXFqWoaZeC0uo3sSSxIBaXLbuv50/VfGEGqD/jwnQ7SCcDv3GMY/+vXuo+HXhAf8y1px+qsf608eAPCQ6eGtM/79H/Gksu9PxD66fP8AY+JbezklkazuZWkg8knIHcEn36VV1DXmuryG6gFzbyJEYWIAJcHOeSeM5r6M/wCEF8Jj/mWtK/780o8EeFB08NaT/wCA4qll9tdBPGX01PnTRvEA0nWYNVljuLqW3JMYbauOCByPTOelXtX8bJqy2iS2JjS2IIVSMPjPUfU/pX0APBvhYdPDWkf+Ay05fCnhpenhzSR/26p/hQ8Bd30D65pY+ZdT1hL1JBFb+SzuXzkEDkHH6VBDrN/HHFBLcvJbRkkREjHPX86+pR4c8PL08P6SP+3RP8KcND0JRxoWlj/t0j/wp/UPQPraPl281n7ZczTtGR5ihANwO1e4znvU8XiLyZ4ZPs8bCPAKHZ8+Bjk4z/8Aqr6c/sfRh00bTR9LWP8Awpf7M0sdNK08f9u0f+FH1D0F9cPnm2+JN1Y3Zube3SJ3G1ys2Cy+nTgcVe8D63PcC9SznktZwFkQLlmnbP3QB3H3vw+le8DT9OB402xH/bun+FaugrbWt/G0VnbKc8FIVB/QVEsvXK7FxxrueGXmoXlrOh+0SmZtPNvul+ZYRuYnI7jBPHq1ef6Sk0ausafNLGj4cYGAxP45wK9S+Nxh07x1rMNmohhKLJ5eOAXjUsBjpyT+def6LGbcESMH8y3UnntuyB9RXlLQ9B6mu4WSHKR/vkz5inqwKjjk/Nz0wOnWqg8qPT7SQY3C7mVhs2rgbCBjP159qvNpISVJC8kZV8tkkAEA8e31qtdJvtEju1SOSGeRi7EZwwU4P5fWsU0atNEWpQSCWTcQu+J3BLZKqVyVI9MgY9PwzXr/AMMPCsAsW1aWP5gFgh3HONqjew9yf615FNcx/wCkxmUE7GXegB+UAjP417d8K5DrPw1t7e21KOymjmcJLIoYMSqcEkHGDu5NdWDnGFVSnsjnxUXKm4x6nVFbaDrgn86hfUEXiOPP1ry/xV4l8WeFIra7kuLa7srqRo4rhYkdSy/eUgBSCM10HgHxhN4jna01S0hglIHlSwkhHOcYIPQ5IxzjnHHGfplWptczdzwXTneyR1hvJ3+6qj8KTNy/WQj6cVsrpQX+7Txpwzjj8qbxEOgewn1MMW8h+9Ix/GlFpnsTW+NPA7n8qX7Eg6sfzqHikV9XZhraAfw/pTxb4/h/Stn7HHj7x/Ok+xJ/eP51P1kpUDJ8ojtSeUfStc2Sf3j+dIbFP75/Sp+sIPYsyfJPpVe4hzc2i4/jdvyQ/wCNbhsfRxVWeyP2yzywwTJ/6BQ6yGqbRTMA9KUQj0rTaxPZx+VN+wP2Zan2iGoMoeUvpSeWPSr5sZB6Uw2UvoDRzruPlZWhZoZFkQkFTkEHFbtp4nv7cD96J09JOT+fWsk2ko/hpBbyrzsNTOMJ/EEXKOx19r4wtZMC4jeFvX7y/wCNM1HSrHxA32m3ugJsAZU7gfqOorlTE+PuN+VNCujbl3KR3HBrD6uovmg7M19s2rSVyxqmgX+mxtK8XmQqfmeMg8fQ81hNO5PFtdY99orbmv72eDyJbmWSPOdrHNVCntW0ee3vMyfL0RmG5uFZdlncMM/Nkr0/OrKByg3jDY5qzso2Vav1Yn5Iq2y/LIPSV/55/rXJfFEtFo1pMhwYry3fP0lWu0t4z+94/wCWrf0rj/iwv/FNMB1EkR/8iLSk/dY4r3kde6/vHH+0f50bTV2SykEjnjG4/wA6FsXIyCuPrRzoXIylsNL5Zq99iYfxCq2yWSV0Q7VjOGIGSTjOBT9og5WRGM0mznFTD5GCuwYHocYOfSmtgOCCMGjnFykZiFJ5Q96n+X1FIdo7inzBYhMQ96Tyl9KlJX1pePWjn8w5SAxCk8oVY2g007V6kUc4cpXMQ9KTyR6VPuT1/Sk8yP1/SjnDl8iAwr6GkMIqfzI/X9KTfH6/pRzj5fIg8oV5/wCMfiheeG9e/sjRLSGa7hVWlnmJKxlsEKFHU4I6nvXou+PP3uK+a5dcttR8Sanqk0hPn3ZfIBPy7+B+QFcuLxDhDRnp5TglicQoSWhf8Va/qHirUrrUNUliku5GVZQihV+RQBjHTissH/SIdhyqw7eOPoCKjmM0s1xOqPtaTecA4HH0qza232u8Nv5ZRtvyuR0PbOfy/wD1V4ildXPUx9BUcTUpQ2TaX3nvD2PhhmU/2PdFl6FsHPrnCVG+j+FSQ0WiSKeoDW5cD81r0YQaaR0nbHcw26/zqNxpK5+ZfUhpLUf0pezp9jlu+551JpulqAINBA+XaCNPPA/l+lSXsSjwtdQxW5ttkiEhYjCGJHXH4fSu7eDRpW6xf+BduP5IazPENhavp0tpazQRNOMZd1mXj1CKvvzzXRh6MXK0I6mFWfLG7eh4x4psNegsrSSDS7g2RnLSXOFkiViAAMAcE7e9aXgu7i1TxTdwGFYYfssY8qRkQ91cg8ZALDpz09K7F4vF1qlvDpUnh94oIUiw5kHmEdWOVBBPp7VYhfxi9zE8+geFJSr53CVwcZB9P1rWrhq7hy2aJpV6MZ810zofD2tG7MtlcPvubXA3nH75MDD/AF5wffnvV+e++by4zucnHHQVkWOlyrcveXnk/b5Mf6niOIAYwvAzkYBOK8w+LHxuh8I3EmjeHkim1hRtnmcbo7U+mP4n/Qd/SuuEnGCdTc5ZrmlaGx63q2t2ejQ+fqN/b2cKjmSeQIpP1JrgtT+OvgSycqdd+0sO1tC8g/PGK+VtZ17VPEV417q9/cX1wxyXmctj6DoB7CoIbOWbnG0eprN4h/ZRr7FJas+mX/aK8EhsB9VPv9k/+yq3Z/HvwLdMAdVubUnvPbSKPzGa+YzZQxj945zjoKQ2kbD93HIeOtCrVBOnA+0dG8X6drsPnaTqtpfxjr5Mocr9R1H41qpqLNivhi3kvdJuUu7Ke5tZ4zlZY2Ksv4ivaPhp8d3nnh0jxbIgZyEi1LAUE9hKBx/wIfj61cKybtJWIlSaV4s+gvtzf5FVbq7b7RaNk8SMPzRqiWTIHNQ3km0W7E9LhP1yv9a6LGNzTN6wPU/lR9sZv48fhVQvxSBwD2osFyyZ5T0n/SkEsw6TiovMX2ppdaALYupu7IfocVWkmnQ5Mrc+jUzevpRuQ9qdgFSdxICWc+uDWhHcKOrMR6MorP8Al9KXcKTVwRotdJg4Bz9KYLpVXlCT+FUd4o3gUrDuXTcg/wDLIfpVZy7MTkDPao94pCwpi3FgZjFIm4DEz5Pr0rjfieN2ieWTkvPCv1zItdbasDEzf3pHP/jxrkfH/wC/Ol23/PbUbdMf9tV/wo6MOqPQJ7nLuMAfMep96YblyAA4UDsBVYuCSeOTRuFKw7k/nv8A89DVfzHhkl4dkkO4lRkg45BFLuFG8UWFcaAJHVtrqinPzcZP0/xpW2DsfxprPXknxb+MR8MvJoWgOj6rjE9zgMLXP8IHQv8AXhfr0UpKKuyoxcnZHoHiTxp4f8Jxh9Z1OC0LDKxZ3SP9EHJ/KvOtT/aR0GB2XT9H1G8x0eRkhU/hya8EuZbnULiS7vriWaeU7nkkYs7n3J5pUg4yIgPdq5XWk9tDdUorc9if9pict+78MRbf9q8Of0SrFp+0xAWAvPDUyL3MF2GP5Mo/nXi3lDoTF+QpjWoI4A+qmo9pPuPkj2Pp/wAO/Gnwf4ikSAX76fcvwIr5fLyfQPkqfzruFKnBIBBGQQa+IZYmQcjK+uK9B+Gfxe1DwdPFp2pySXmisQCjHL2w/vIfT1Xp6YrSFd7SJlS/lPp/dGOwoLRn+EflVa1uYL22iuraVJoJkDxyIchlPQipcD1rquYDiY/7o/KkzH/d/SkxRt96AMrxbqKaR4Y1W+GFaG1kKnHcjA/UivnXwlpV34klTR9MiXz7os6ljgYUEn8+K+gvGvh248U+Gb3SLa6jtZbgKBJIpK8MCQcc84rz/wAM/B/xd4b1G3u9N8R6PbzIpiDGB3+VuuQRXFi6UqjSS0PayfGwwjnNv3mml6/1cqab4f8AGPh62+z6YqyxM7tKFnQYk3FWXDduBzVyTVfiFaLvfTLqc46rHDN+fWvRZNEn0h2sb6/hvZ4SRJPHGIw7HknbnjrTo7KyDBigLevAxXGl05fwIrtTqSm5atnKHwr4gf8A12v2qn0ypp0fhPUM/P4ij/4CF/wrXn1qxjjLEKRjqGNZk/ivT1R3SLdt5PzHJ+lU5yI5UX9I8GTS3CvLrFzcRxtlo1ZV3e3TpXXrZk4ATCjgAdBXNeD/ABFHqD3K2kMauiLKFdiNwzjr2ro7PVFubiaBv3M8QVnjznAbO0g9wcH8q9XB1uWGi1PNxUOaer0LkNqE6gCrO9YhhOv941UeYnocVGZTnnk1vKo5bmMYKOxx3xi+IR8B+GGezkA1S+Jhte5Tj5pP+Ajp7kV8jyyvNI0srs8jsWZ2OSxPJJPrXffHDxK3iHx5dxrJuttOAtIgDxkcufxYn8q4azh8+cAjIHJFebWlzSsd9KPLG5ZsbINiWQfQVYkm/hjIVRwWx/KppcIm1Tg98dqrRRCUl2B8lTjA/iPpU7aA9dWMWNny0eFQdZH4H/16e5hjA867k56bRgGo5/tM0o82BhH91FUfKPTpRqFqqiEBv3hOzYBkj/69K4ydEDqGhu3wenmLwfy/wqje2zxP88exiM8cqw9RUt/E1uYbaMMXTqAOc/5zW1Y6ddXOmSf2jAbeNcFXmwhbP8Sg8kj26j9C1wvbU9Z+A/xEk1a1PhfU5i91ax7rORzzJEOqH1K9vb6V6vqTEWMrDJMe2T/vlg39K+ONO1C88K6/b39sdl1YzhwAeCQeR9CMj6GvrnRfEFl4q0Rb3TLnzLa5Rk+Un5WIwVPuM4rroT5lyvoYVoWd0bJJyeGI/wB00mT/AHW/75NVbO9kns4JTI+XjUn5j1xz+tS+e/8Afb8zW5gTfN/cf/vk0mX/ALj/APfJ/wAKh85/77fnTDc46yY/GgCz8/8Adf8A75NISV+8rj6qaqm7Uf8ALT8s037Yn940AWxJn+9/3yaftkPIjk/75NUftaep/KlF2nqfyoGXtkv/ADzk/wC+TQBJjPlvj/dNUhdp70v2tPekBcxJ/wA83/KkywPKtx14qr9qX3qK6ux9ndVzucbF+p4/rQBbsy4tYsq2Su7p68/1rlfEJN54u8OWYVji6MxGOyIzf0FdP9ojRcAHCjA47Vx8E4vfiLETytlZSSH2ZyFH8zSewLc7rbIuMo1BD/3Gqr9qT3/KlF1H6n8qLhYs4f8Aut+VJhx/CaYs0bDGafuVRRcLHJfE/wAajwP4VmvYmX7fOfIs1P8Az0I+99FHP5etfKqiS4le4mdpZZGLMzHJZickk+tegfHXxK2veN202J82ulL5AAPBkPMh/PA/4DXGxosMG8jJPCg1x1Zc0vQ6qcbISxsZr24WC2i82ZufQKO5PoB61auW0jSXMcxfU7lfvBWKRKfQY5P5j6VtRaxF4MaDTjpiXs92gN4r8Fg33UU+3uOtTXHgPR9ZkL6Hd/ZXDK09ndNloUPUqRncPTr9awb1NVGxnaze2ek2Om/8SfTzPdQ+e6+UDtU9ByTTo9P0i/0WPUriJ9NeaUxxGD5g+OpKE/Xoe1aPjnR7vUtUS3stHuZM+XFBcKhKsoGNuRwMH1qv4/0W/gudL0DTrG7nhsLYY8mFn3Ox5IwOenX3qVfQo5/UdOn010SfZJFKu6KeM5SVfUH+YPI71j3cHksCPuN0r1Hwx4B8Ua3pU1hfaBqEFu65jknhZPLlCkrIM/Taw7hh3Fee3MD+XNbSrtliJBHcEHBFXe+hFrO56/8As9eNnlWbwpeSFtimezJPb+NB/MfjXtuM9q+JLO7uLC5jubS4lt54zlZYnKsp9iOlfXvgfXD4j8JaVqbNulnt180/9NF+Vv1B/OuqhO65WY1YWdze/Cl2/wCc0godljQu5wqgsx9AK3uY2Mxru+vr+5tdPNvHHaFUllmUtlyM7QAR0GMn3q3HHqsMJdbmye4X5kBhKqSOgLEnH12nHpVDwerS6P8AbnGHv5pLo59GPy/+OgVubT7UtGtQ1TMrQtB17xFezvrI020uZA0u+C4MvmP1ORtG0demadJ4emH+rvbQ/wDbXGa3rK5GnQ3l6Q7eTbvgIMsWPygAeuTXI/bYSPnttT/79DFcVduMrRZ2UbSjeRdHg3TpD8k7EdP9WTTovh5bz9GnP+7FxW/Z6vNZD5wrqDjJQDH4gdK1bbxparhZrUj1KSAj9RXHz9jp5TmLfwHHoKyai07x7VKAMuA+e3XrnpWHeSPZeL7R2Uql9YyRZI6vE4cf+OyP+Vd9r2saZr1vCkGowWssRLqtwrBWyPUd/fnvXnuu+ILvwzO8t34bv7+2jztvdOUXURHrx8y/iBXpYSdPk96VmcGJhPm92Ohvxz5GOtR6lfLp9hc3jnC28Tyn/gIJ/pXCR/HPwZKxWQz28o6pLGykfUAUzUviB4f8Z6fL4e0rWLVb/VcWUAYPw0jBc9Peuh1ILqYqEnpY+Z7u5e9uprmUlpJnaRj6ljk/zq1pSgGRj7DAr6y8IfsyeBtBVZdZW78RXa4yJyYoAfaNTkj6sa4n9pnw1p2g3HhyTSNKtNNszBPAY7WBY13BlbnHU4PU15caicrHoSg1E8Lu5gFK4ANNubeZ2tbWJZNiANIyDnJ5J/AVWnfMrA5PWusk8E+Kryzn1zStIurrTYkMkk8aqyIFXcxIzkYHPTpWl11M7PoV/D9lPretG1sLsWyIm5nJII7cY78jrXqWnfC/7B4T1a7vNIK6hZlJba4kWMrtyN7Bs88cryOa4m2l0rQ/DcEutXV0mo3jhvs8S5WOPqpYH1HJ6nnHrTL3T/FJ0QX00t6dIXBUPK3lmPsQehHStYNLR6mc03rF2MvxXa3HhfUBYreHa6b/ADFYYLHqAR6d6wdEg1PV9RhEcN1cIZAsjRxsyqDwSSBXrmgzaZqngjWbnwtbwXesaYFnbT7yEMwQ8M6L/FgemOnqRXL+CPFOu+MfFNrY6hqbW+mQpJdXKWyCNfJiQuwGOmcbR7sKmTdkXGzbRyPjCwlsNQiWeLypWgjZ1PUMBtP8hXq/wMvNQ0BJ9G1a2mtUvoE1Sx84Y82MnaWX1BwPyrhPivYtbeMG0dGaa5tLeC1lOdxM+wbxn/fYivX/AIx2974TtvA2p2tu92ulRtZTmFMsE8tBtJA6HDYz3FZwq8s0ypQ5otHWWepW0KyW7TKpilcAH+6TuH6NVk39o3W9hH4Mf6VwHhfxFrHiK+mS38N6xbqYlfdNHtU4OMgnA6EflXTmw8SZ/wCQVc+n31/xruVeHc5HRl2Nj7VYH71+v4Rt/hSi40vvdufpGf8ACsRrLxGn3tPnH/bRarX0usabYz395bvBawIZJZGlXCKO5xzT+sQ8ifYz8zphc6P3mkP/AAFv8KX7Xo/ZpP8Avlv8K4DSPGMWvXv2HS7uO6udhfy45Odo6nkVsqmtMdv2ds/9dB/hT+sQXYXsZPudN9s0j1lP/AGpwvtIHaX/AL4asBNJ8SSAbLJjnp++Uf0qQaH4m/59Mf8Abdf8KX1qHkP6vPzNz7fpP9yb/v21L/aGl/8APKY/9smrDOg+KOn2Qf8Af4f4U4aB4nJx9mi/7/j/AAo+tQ8g+rz8zb/tDTf+eE//AH6ami60+WZHaJ0SPJAK8s3TOM8ADP5+1YU+k+JrfltOaQY/5ZSBs/hio47TXXmWH7AyO0Qm/eEqFBYrgnGA2R0645pfWoeQ/q8/M6WfUdMjhdij4A9P/r1xvgTULK+1/wAR6kyMYy8NtGcZ+6GZv/QlqbWNC8VXWlzJaWdt9pPyiM3Kgj3JOBXN+GvD3jrw1pX2FPDEV1I0ryySpqcI3sx9M+gA/CplioXWxSw8tdz1L7dp3/PNvy/+vSG900/8s3/Af/Xrz+N/HjXCJN4NuYoT1liuUmx7YXmsW/8AiLDpchjvYb63cMyYls5E+ZTggZxnB61SxUHtYn6vJdz1c3tgOnnD8BVTU/EVnpVhc3sm/wAu2iaZs46KM/0ry22+Jcd+wWytNRu2PQQ2bN/I03xDB428WaRdafZ6CLW2nUK815dRW7kA5KhGbvgVEsREuNCTPGDdS6jqM95Mxaad2mcnuzHJ/nW1oUI1LW9NtCMq8yqQO/Oax5bKfTNQks7yF4J0yro/UH8OD+FX/DV8una3YXcjMiQXMbuw6qoYbiPwzXHe50pHUalr3h7VNbkN/pn2HULdyovYXwjhfly6kdfr+ddl4D8LaXo2qPrXiSZr2xu4ysMlqnzRKVyXxnnAxwM5A4qhL8HIP+E51u91meaHwppswlmuFBMl2WAIhiA+8zZ6jswxyauX3xJ1jUPHelaDBYLpekF4YYNK+y4e1j42u2RuLAYPpgEe9W6bWnVmaqxd2tkdxeWKaVpMulXPijT2t/OWbcsTrvXOCCAAV7H6j3rzzxf408TaL4ng02y1S5ttKkCvbTw4VpY2BywfHUNx7Yrc8XaVa+Ex9tuXbU5Lu4K+THKVDbTu8zJ/1fYY55HAr0/wt4yfxBpfh8aLBH4e09STcWtzarNO4A+6rNhRuOW37TuHStKqm5WnBJpbbaE0ZQUbxldN7njnjn+1NK8X2trofiTxBd2lzbmQ+dfNM0cmHGCUwByFIyO9eceOLeWy8T3olQxySbJZFIwVZ0DEEfUmvd7P4m65r3xDv/D3hXVng0CyC2luRBFK0907hFO9lJ2bi5x/cjPrXkHxTvIfFPxQ1ptO2vDc6gba3KDCsARGpHscZ/GuaKaSbW50OzbSOUufB+vW8AuX0fUFgYBw/wBnfaVIyDnGMYr3X9n/AFEzeCprViT9lvHUewZVb+ea9ngSxsrO3tFIIto0iB3KQQqhf6V55D8FvBttPcyrLeS/aZnmMbXjRomTnaAhXgZ4zzSp1nF3HOkmrHVG6hjGXkRP95gP51na/dJdaJcQ2txFuuB5IkVwQgJwzZz2Gay5PhN4SiG5NBs7jb1Mly0n/oT1f0vRdL8PwyQWGhWlrFOuJVitlIkHPDc89T+davEt9CFQRLH4g0bT4YrWO7j2QoEVUBbAAwOlOPiqwP3Hdv8AgB/wqES6dGfls4IcD7ogVce3SkTULdSSjKhHTCrwPwrJ15lewidhosYe0EtyAjS/Ns9F7Zz3q8FswOiVwL6rJ2uSPds/41E+qzhxmf8A8iEVjKMpO7ZtFqKskY9x8XPDqk7bu4c+1qcZ/H8aoz/F3w+5ba96Q/X/AEUAj/x6vFmkI601pK7fq0Dl9vI9iX4t6BDjFpqMpHdkQf8As1RP8atNRt8enXwfswdQR+teNtJnJFQvKwo9hAPbSPUNd+JXhvxCrf2r4aN+SPvz+WXz/v43D8DXmNrJFo/ii21jSgY4LS8S6hhlbLKFcMFJ79MZqpJKc9TUTMfWlyRWwOcmfQU37UpUP5Phlctnl7wn+S1wnxH+McvxD0qDTrjRrSzEE4njmSV3YHBBHPGCD+grzQlj1pjZ+tQqcVqkVzyelyG7BiuM84POTXsvwo1Aa1o09teai0Ok2EIl1W1jH7y5iiB8oL3w3yo2Ou0D+KvHpQLmMI3Dj7rHp9Km8PeIL7wzqcd7aMqyICjJIgeOVDwyOp4ZSOCKuLSd2iZJuNkzpJG1T4reMrO0aJTdXcoiBA5SMd39dijr7V6hffE/TdX1e5+GxcL4Ya2Gk290Cd/nIAFcnONu4ADjqAehqj4S8W+Bru31W+s5D4d8RX9p9kT7U/7iIH7xinCkgn1kGRhQSetcpL8J7VW81NatngHIkGq2YH/fW/P/AI7XXTTSTjZ9ziqWk7T0tt69zl7K51r4beN0aPzBqFjNsdBnE6nt7qw6fUdxXqNxpuh+Gp7vxrAkUGm3OyaW03je1wp3LaqBxgyAM/oIyMYqh4s1nwfNb21zq92uoanBGInTSpA5lQdFe4ZQFyeSUBPJxwa8z8R+KbrxLPEnlRWtlbKUtbO3GIbdT1wOpJ7seSfyq5ShQvGLvfbyHGMqzUmrd/Mk07xJMvi+LxHfwJqM6Xf22WOViFlk3bhkjnG7B/CvVz+0xqzMzHw/p2W65nlrxKMbRjr3zUyDPU4rzXTjLc71NrY9rH7Tusjp4e0nn1llP9aa37TeuZJXw/owz7yH+teOLBvHBBqYWJwDg0ewj2D2r7nrP/DS2v5yNC0Yf9/P/iqif9o/XpEaNtC0Jlc5IaOQ5/8AHq8tFi2M4NH2Ig9KPYR7B7V9z0WL47arAxaHQPD8TEbcpbsCPxDZpW+PWvuSTpujknuYXJH/AI9Xnf2I46Ups2Haj2Mewe1fc9APx48SAfLZ6Wo9Fjcf+zVHH8dvFUTbkWyB/wBxz/7NXBi1YdqX7G2MkYFP2K7C9q+53zfH3xc3exHGMeWx/m1Rt8dfFrHIaxB9oT/8VXB/Yz1pRaH8aPZLsHtPM7qT46eMJF2+dZr7iDP8zVCX4xeMpTkaqE9khQD+Vcr9jbOMGg2TelP2S7C9o+50cnxX8ZSrhteugPRQo/kKqy/ETxVKCG17UueuJyP5VifY3HVDR9mPQ5Bo5PIOfzNGTxt4hlOZNa1Jj6m6f/Gqd5rd7qSKt5d3FyE5UTSM+36ZPFQm1YDp0pn2duoXIp2Yrod9tmC7VlcL6AkCoHbf1IP1qQxOo+ZOPrTSg6kfjTaY9CLYuQQBx04qKRjDLu6q/NTkqOxqOQq6lSDg0gPZPC3jfUvF3g218P2msXNlrmkofspRsm6iA4wP4mUfKVHO3DLkgg1tT1rWfCOjwap4gu5L3xNeRtHZiYBvsER+8SccseOPw9c+ORTz2EqyxOwKsGVlJBUjoQRyDXbW3xSmvYlh1+2Go4UL54fypiP9o4Kv/wACXPvXXQqU95aS6M5KlKa0jrHqjV8La3d6roN3pZk87ULRjeWj3A8zdk/Mp3deT/4/7Vc8PePdW1q/W31WLdZzxm2nuHkKAZHy9TwQeOD/ABGsa18WeFrK4W7trfVYZQCNqpb8gjBG7jg/SqV98Q7eGZptJ0yG2uCSRczt58qe6AjYh9wCa3vSjyVJSvKP4r+tPQi02pQUdH+D/rU6pJ7f4UadcNDMv9sSo62CA5eAONrXUno+zKRr25PqTyHgaxe61ZdSeKYw2pymwZ/eY4Gfbr+Vc5JNd6tcPPPJI7SNueSRizOfUk8k13fgrWbgPbaKpt4Y3bbFI5CgMexPqT3rz8RN1HzRVl09Dsox5FZu7O2/tO5PT7eD705Ly6kYYF3z1Bat6LwP4pY4ZFGRnmp08E+JVI8xokA4zjpXGqljp5DBVL0jPl3Bz6yf/XqZI770uAcc/vTzXQr4G1xlw10GB9EzUi/DzVJcZuuc8Y7GtFWJdMwkF2Ry03TOTITStYPL94gn/e5roY/h9fxcy3jKp4PNXIvAZOPM1FhkcHdz/KrVWIuRnHtoBfJ86RcjHEhqA+HGbP8AxMZ0YerZxXosXgyKM7mvyw7/ADVZi0CxiX95I5Ps+ce1P2iFyM+UGAPy4pjR5PHOKulSeo5HpShQByoH4122OS5nmE45qM25PAyK118ogksACeASKiCKzZVMD2OaTiFzIayOcU02Dt2HrW0Ld2JHlSMT0AGak/s26LFVtLhz2HlMf6VDih3ZgGxOOMVG2nPiuoTw/qkqlhpd830gbj9Km/4RHWyoYaNf8gf8sG/wpNIq7OO/s6Q9qa2kSzDBAGOhz0rtl8EeJGJ2aHqB9T5JFKPBXiHAP9jXmPdP/r1No9xpz7HCroN4jZjmRfxNSDSLw/euEJ9lya7xfA3iJuTot0vHdQMfrTm8A+I1yx0iYD3ZR/WhKHcLz7HDf2Dkg3E8j+wGKsQ6NbqCoifPu3/1q7aPwJ4kKgnSmYY+UmVBx+dPj8B+Ix+8XSgpXnJlTPX3an7ncXv9jiRpaggKBgnHSp002JMiSM/UMM/lXYSeBfEDcyWcaHrzKn+NOfwJr0Kbpbe2wRu+a4Tgfn7VScO4rT7HKJZ2i5xhT7g8VOtgpI2uCD6cV1CeCNW3eWBYsy84+0Jgn65xTx4J1FTuZLEk/wARulAFUpR7kuMjmPsqoCpTp3LVE8LZyoO3twK61/h9qjIHMloR2AuAfyqvN4H1aMgEQM+eVD8j26cmhyiCjI5gRkDjLf7wFIQQMMqk+1dUvgnUHXeY4lGecynj68Ug8EX752y2a+xlOT9MCk5x7jUJdjmEt1kwXRhxyRzxTDZQx5YSupz0K5FdhD4A1QnCXNiDnoHJP06Uq/D/AFKQvuu7IY5PLf4UvaQ7j5JHJIIwCP3P4qy1L5KccQk9Rtb/ABrrF+G2pMAWubUZ4UBXJPt0oX4aamWwLi19QCrc/pR7WPcPZS7HLRxQ7fnZFP8AvZqYW9vgHcuD711bfDHVFA3SwAA4+VCc/T1pqfC+9PP2mPqBzEf8aPbQ7i9jM5j7Nb/89I/++hTTbWw43xn6HNdePhVejO69jA7fu/8A69TQfC5z/q9RTsOIAPw5NH1imP2MziPstsMkoo/ChrW1IyMEdAQOK9CX4SIoPm3szHIztjC59vWrafCK0VN5vLvGewUgfpUvEUx+wmeWvplo3zBl468VE2jI5XazY/2lP+Fe0WvwosQUE32s7iR9/APucCt6w+E2hqBIbQzJnkPMxb+frU/WaZSoVD5wm0JgcKjt67RVZ9JUE7o3GOuT0r64sPhp4VhJH9iWjHjKlScfmck/WteHwT4ci3RJoNnGyjOTaKQfpkVDxFPoi1Ql1Z8VHR436Ix+hoPhZpPmS1umHqqNj+VfbQ8L6DEVEWmW6kEZVVCH+VWE8MaYcskLqO6uSfryKyeIXRGiovufEMfge7lPyafqDd8CJv8ACrkPw51ViNmjaiSem6Ij+dfZj+H7RHzb+QST/Fu5/A9etV206GFgohVgpxlQM8+1S6/kP2PmfJsHw18RycLpc6gcfO6r/M1q2Xwq8SPtLW9vGPSSbP8AIV9HT2HluSszk5Aw4HA/KmyyIPlDwuSOeACaX1iXRD9hHqed+HfBk1naKNWF9dTDJ3W9/OiAdhjd2/Cuzt9RvLS2SC1tZmSJMBS5Y4/3jkn8TV6S8LYChFBzgHHUeoqOXVGG7LquCFxjoB6+vT9aylKUtzRRS2HQ/bJwpeR4d5xjd0NWk0q6kP8Ax9Ae5b9OapLqyEtsOD37CkOslSFLtk5HXoaSb7DsjQHh+5Vv3szjng1K/hV84Ewb0BOayxrIJGJjnbnJpyeI7mFOJgCx4LdCfxquaQrI1IvD3lSFSGKgDLZyPxHWr6aNAnMgAGOSprDXxVdp8zCNiMnlR/OiXxbHsIktQrH0OaLyCyOR/wCEb8NQhSmi6ejBgWVoVJx6dKsiz8Kx5/4kdgZACQBboM+wFVW0eSQBPMVUPdhknHrn8eab/YpDFjI+DxlR71evcnTsWvO0aPCwaXp8JAxxbpxj8KuW+t2EW5RZ2mcDAVAo/QfrWGNKQsriViQSrOeCf8/1pVsktnLfu0CkMWY//W4osgudGmurLuCfY0VTjAXLZ47Y/wA4qhc+IZ4izRypIN24iMkFR6j096o3EtqFCsDtJONo5PfPbpimQpZwN50U+RITlygIH1H9O1OyFdlt9avpkO5UUbAc4yWzntWVDqt67hBEwz8pycYX2FaC6tYpKZZCiSYwAuSCR39OaWLXtMwM4D7jj93lfcd/aml5BcovcT7GIO4sxILvnnscY7c1VYXgCs8ylXyMqen+Fa8sljloo5vmAzkLu/D2qrPcxszbpgV5UpGoIHPr2p28hXM7bK+GW7AHTgkfjjvURe9AUrNKAykAsQM1buprm3I3WwCsVP7xATj86ry2t5cOWKMTjpjgfShAUXhuRja+4nJPB4wfWmq16h3YYnIwVOQMetaMVjPKWc+Ycg9j8nqelW3sdiMse4MRj7vX1HvTuKxjGecgHI7ZG0fNjp1pJIZJpT50kqt/dDYA/TpW5Bp2452ZyCVAJABHr6cVdXSTGsYAffgEOfmyT0O7tR7QOU5yzgP8MJ2qpHLZ+narcun27lHieQEnL7oyB0457V1CaHJJblo5IoY2DNlnPUdc+hxVsaepiXdIuBxsifP0J6AUe1YKBxS6Qs37w3B8s8fKu78s1cXQrhIQ8cswLHAD56f3s/0ru7e20fG24gy+ACw798//AKqntxpyMywkqvIDHGF989u1J1WUoHn50m7VkMjDfnsmQfpnrxT49HmdxIYt6nI4Tr9a9Fe/tFIXZHNGnzjcwITnrz04/Kmy67FDmNIoI0PzBlAP+I79e/FZuox8iOFGg3Oxc2wjYjHpjuOvXvVm10W5FsW2jcQGVSM5Htn867RNbsJFVpELlOrOMA/QZ5qOfXNMnbJlMHP3wcnHUnp/nmp5mOyMWLQppOVBYn+IgHjuPXGal/sKRxguinBzkcA4P68Vbn1+zstyxS+cZDgblHJHvmoX8W2TwjMhBX5TxuB7nI/x9KXvD0In8OlHGJcZGVVcjj2qSPw6fNQr5xAPOGGDz7+9RS+LLM/6uVE4BGDzzz27VS/4SgIw/eqqnsOx29c0WkPQ2hoNvGpaRFfAJKj+L0OKd/Y8JkUxqqjrnJBzx04/SubbxZJGFUFpTjgDnjHf/HtUU3jqQhDsAU/xdzj2PajkkHMkdabMbVVNrZPRjnmp4raIx53qCOnPA/xriT4zQIuwBSW4bJGR3wfyqs/iyUEyBgrHkbDnp6ml7OQc6PQJIgg37o9pBB570sCoPmilCnngHk+9edSeNpjuB3HHIP8AhUcnjO4JyCxGNoLgdD15pqkxe0R6cJTDLuMrA5ySG4P/AOurCan8jGW8dWHBRsfhg15BJ4tunb/WM2736f8A1u9QnxRf/wB+QndjkY5+lUqUhc6PYWu3aVtmoGLbkYLZBP60i6rPAjI8qS4XP+r5I9Qc5rxtvGOoxARiRgBj3qNvFl+WyJiSDwRx60/ZMXOj2CS+gQgEeW/TcMnGO2c+9RPq9uAxN22QM5bjPPqO/FeRf8JLeFCDNM2euTTD4hvQgYscbepHH60/ZMOc9ek1O3dQftLZHXc3JP1qP7ZYyAhnDDqOmV9a8jXWrsjI4UcjPanJqd5HjbKynkK2cUeyYuc9OebS+csQRliT2Jqi1xpfzDB+XrkjjrziuCN9qMxO6Z229CW+90z9anWTUJW/eEsMY9/rzT9kHOdbcXWnBSTISgBHHQ8eoqlPd2ykpEjEjqQc8Y+v+c1gpFcYQENtfjOMjipkgkG5Wl3f8BP+fxp8lhczNQ6hgIFCgKeM+nNVzqcgO7Gc8kDkdKZFau+VaXLYGQRk49varUdkGiDCVgMdc4OfXFKyAo/2rLFlQmF5IGM8emaryatIQB5uR14BPSt220+EuEkcnIO4ADt/SnjQbKYkLK69MFkx39vr+VUrAY7eJpQm3y9zldo3dBz3xUL67ctuQoVJXGC3DAfz/wDr1HNpExAkZGywB4AX8R71BcaW5y3msRxjbkE9+w4quWIrsV9TupIy3mMyY67vujuMfjVSa6vZ0JFzsI5Kg9ParQ0OLfv89CqLuKK2SR3zz1qGa2gWclVeRB/EMkE4qrIV2UiZ1ky8wznA54GRSB5nJUv8oPAPH5e1XEdYlCbQdx4OB+Xt/SmMyPIQVTJPQD3oERxAF127mcjn5sAc9SP89KfGo+bCMNxwSi45pjq0a7QCFboSOeOh+tRFblo/MG9cknCnPH4UwLkdsUlw0jrGuQRncR+XapYLgWsx2MTjAIODn8+KoK0+4LKHbAySc8elTrCM+crRgleM55HrjvStcZux6vZzjdPaBipIJB+Uc+gNaS63p0MQEcTgkKwJzkfh6e1YC6RcPCmWWMbCRiJsjjIGantdGvJpWZxM5IOApJIP/wCr1osFzbifeHluMBCN/wA0efl/3ff61KZYnUbbXKrwpcYx9Pf2qrZW8ocI90A6jOwruI4A5ODjp9RmtNLSRmQMwZyT8itgkcY69eaVkPUore3GkTqfLSRJQd5jjyfoQefxq1HfTvITHbeWgAbyzGR16AnA+vfrWnFbBm8uSRVkU8rjOPQ+wqSTQnkBYM6nnLeYdwP4VLjEd2Y7nWJZ5CyrEsnUhjg46cYqIzXEWFaVlZuCChAb2Hqf51fvNKZBGkd44ErFZC7Anjtg/wD6+lRJZJmeJ72OTaQMYbcmRnv3xj3qbIepRN8yRq7XXJziMjHHXFQre3BIxPGcHkSOePbIok0a0luAbeRYUOQN7gb256H8aSzsoLeHymZHIPGV3Bhz0/H0pAK17K4U5JJG3IHXqelNW+mliKxyRuCSMnqOn+cdKQtEybSrFVAJ44z/AEqSE2s742scZAEcW44/Dt3oAhlNxtZsFj8uCozg+/P0ppjeVd5mdvmwMHlu2P8APrVkvawMsUYmJP7suy4UH8f8806J7HY2MFhk/d4J7dP5UAZ3kON22VvmJJJHG0/qTmonidAUCEt1dyOcD61ox30LEzKN6gjMnQ/5/wAKa17G7eX5KsAd/wAuCD/s8d/yoAy3gVY1w7ZJyNvAHb8e1SfYDIyMPkYDjsQc+/8AnpxVkakPM8sQjIyfXknv2/CpIpZ5/ljRmB+XlOB7ZPTnrTuIo/2WY2Hz4BXIPHBFQtprB1cMU2nktzxzmtR4JwgLx/NnGB64/Wog90xZIzIYyct9Pcn0oAzm010X51VkGT8o6fj1pHs1+UnJBGcZwD9SRV9Y7ppE8+RcHnKcMSByffjn8BRHpyTBZJLkAu3XBO0j/wCtRcLGWLMOMMIgR0XPzce/4U17OKNAWJ3Y7DsK3W0WPbuLANjOSeBxx1qJtGtSNrI7MQHB6Dnv/n8KfMFjF/dEA/eO3Hy//W+lRO8bRgBcY4APf+laMulpECq7gGbaM9AevftQdIHCxuG3KckKf/1fjT5gsZoiVoywBJAzg/xetMa3gaXhfpgH8q1BYSYCxKhJ5xu7e5HQ8UeVIitiPIAwR33YGR9DmnzoXKZn2ZUKjZvxuHTrTkjyQFjbnGAPXvk1dZDGxdozxgbGYk5/lT0hMqM0g2sORxwPelzBYpxoirkgLlcnC5BFOCq4wob5iOD1PbGO1WTZYAO1i2OCpP6+1H2OTzRgkMOQSeQfYfWhyCw1SIGKqMsOT82cD/E9KtxX9vy7EKehB/nioo9JklfdtKg9l/vH2p40aZiMFcg4A67iDj8qQy1HeDG3epUEE4+7j2qwNViYBtxiYYUnbnP41SXR7r7jAqxO4jGcdD0NSJplxHtZ9y/KW2pwzexHSkMvpqK5O4Dc4x92mi+KofKCKPUrzjn/ABqA2kmC6sA3fecgZFa0elFojIF2qDgbwB0xwMfiaWgFFrsOuY0AB5wy8D8D71LFeyNHvQsqMnOFHUdq0bXRY3ZW4GRk5BxnGSfap49Ng8pFMpVMn5scKfp60rjsc64vCBJIQnJKlWJA7fX1qlJZm4byo7wOQAfmUjcfbk9P1NbMcUVzIVPkx/Lyd5AjOMcDp37Vdhsng3Ojbwx5GzO4gdyOtO4rGJB4dd7YSCRgCwxKi7k9cZ69vpTm8MmNWk3MXLkCMED8ev8AnFdHayzRACRZWViQqRjBGenTjIJ6Hp3qxBp8MpK3VudxIJ82U5YEdx06/wBKakKxxLeHC7SDzo2eM7trjdvB9B2pyeGbWBVZmzt6oh5x6j1Ge1egxaVb2s4uJESHcCkashyc++eR+VWG0Ty3Vwo2g527AAR2z7+mKfMwschpEWnXOyKaCGJU/wBWzZZ29MZXH+fetdtG0+5DuFjyUG5sZZFzz+Hbn0rVawaeYsFMcqjKuqKcnjgZz/KpW0qJ5fnhRpGJDP3cn1HQ/X2o5mFkY8ek2CL5v9nwSnHzOmDge68cfSs7VNOWCLaI7Taf+ee0svUjgDpn09q0L8zWV3K8FnF8uEXYnzdgFJ9PpVe6+03Uciz2UVswxlJCC3A45/EfhS5gsYwugiA3UZIXDJGvynPr361ZXXbRI2hQ+WUO5WYDG73x1P8AnFR3ujR3KOqD5n+bKnPPTHHQfrWbPonkPtZC2B/ASSp6ZHp/9elcdi3NqAc+dmXnr8uAD26c5+tJHrE8bsyiS5GCSoG3bjnccYqqLWa58wtEGKYUmQgAZOFORwfx96lgsZnBSWP5OcOB8u4cAf59am47E/8AbLvKzJH5Mjsr/KSQx5x16fSpYvEF7BIGKs20qWkXJI/Dp2PWnx2WwKrkFmwoydwYZx1/z1q5FbW8sqgOiKWI+T7vuBjrxjjmjmCwo16K+QuY2UL86sVJxj26/jVdYheXLTTI6qSdrO+N2PVQB6fp3xT7nT4bbe/my+VyANreYp46+n4fnS20Jkdv3coeN8ZX5WHGRzkUcwWLlzFKvlxMbeEAbBg7tx6gYPOP85rHaGK4nMUrPKVc4wAFXPH3VPT+taluLd4FaRJW/eHDmTv34I47e9WoZVVWSVhGuQFMIBK5OPX9KOYLGA3hy7tz5kYcf3ScAP04HOcnmkGn31oVjLZ2rjYMEDvjkV3v2xSgV3/eRnOZMDgd/m+nb1qO60eJ0MtveTwSr3D71A6k45/WnzBY4WG0nkcO0WEUAiNlI6k55xx07GmDR45Mj7QsJZwQobbk5x1+tdnHp88khMzG5cNvQO2VGR0Gen9KzrjTnIYKoiR3OFcAcjrz079e9K4WMmLRLZUkeaSIlW42NnGeQenrjk1HJpFlcyIk8Suy8SFdpJ47+nH41vJpkhRVzIFGcEHkck4Ptj9KjysKiNYvMU/exHuB7Yz6/Wi4WMo20LuYIyIwRyrcYPbHv+Qpj2RkICxSNg/MMDceOpxye/tWlKd0DiCRCUAPMYJJPcAdf50+bzrdY3EDMygvgKCCfXHbv37etK4zJdruFHiBEjMMdAWBGMEfmOaUs7IcGI7jhgBhgfp3/l61dEgO1SM7hkqFxhaYIQGC43b/AJSVOFHoPbigRVa0dl3gjaVZhlgeR2/+sM1ELQvtkLKc5Ku3Q49v85qdo5sMhlMagDYhX1OeuP608RyNGwQEopzlfr19xk9KLgUZYLx8odrMgIyuTtOMAcdPYVIqSQKRI0jFsDHBxgdjn/D+Rq6yM87HzW27gygchuOvr+fQA9KfAY9mZUfCgNxhgSeM8jH5UXApW9lbzKcbQyfMxXjjp/8AWx71e+wx7dyxHYB86jsM8n07n8qbL9m27S4LM4w6j7p7YP1pBIIU2tIUdMEHdgHH+e9F2VYFsQZHWO2wSny7V6nGSTjt7/4UjQI8xTYsjAh2IAyBn0H0pYNWto7Qh3coEYqRIDk+hP8AnFP/ALYQsssAQPGCMuM4HbjH/wBfigWwCxbfJsgjdnXneBuIHUflSDRlVv3ttuOSNpxwe2MdOOOtRQ69bogmKyx7SVZQR8xxjGQe/X07VIviWIxhXJCqG4K7cnp1/DOKVmO6H/2YgcYRUcE4Dcgdufp7VYTQgCzL5T5cZ2dAM+n0HrR/akM1uHVisifd3kMpHQY7jniqMl5PZxl5kYsrAllQYH17kf40tQ0LYspPNZZYT8rhm44x1zx70sdvBGvmIV3Ekhck4rPOszDe7kK6th/mOEGB3xn16VG8/nyK2F3AbN5ckgnv9eev0piNMPbmUsJ0l4AZ+5PXGfxyKiN7BDiPy9ow3Geg9efw/wAaozwyIC5uePuqqtwSOmeP89KrMs5VWLiNHJ8zzByefbp+FOwXNF9UjdGEXlxMpGWxnOOPpnpn68UkWroRlJAFyP4Mjcc5HvWJgQjLRvw2SSchRnPH88VFLJgquDvAztccnk859DjtTsFzdOsKzB85zx8mTjH/AOrpSPqkTPgSlFQArsbqc9ePWsB4ZboLwirICSBxj6HPb1+tQ/ZJckAr65Jzgev196pJCud0un28QRYVVsY80t94/wBcYPetHS9NeOOWWRpcFgiKJADjpz69ahhuLaQ5gmhk3Yw4QN1x3z/nNWYdQNusvzTls/LuIEfToBWVyy+9gzTQQHoCWYFuvHXPGPx/GiO0XYJYpy2fmD+WGC/5OazVvJmeNlYiQZ3IrhSy/QjnJx+daT6tMAyvlOBhTgkfgB14NFxWL9yqysk0U7ptHGB8pyMe2aW2sYQGCF3cjcGY55xx7Y9unNZ9kzzAI8ah2UkZDZUZzjdjA+lMeSexcIwfyWO1FD4Ug98AdP8AOKq7FYvlEZVSO3mlOeONwBzyCenb8qW50+OZHa4R0zxhWJI9+KpadePMrrHdONuR5RAB/DOMfjUsdxdXSSLcCOOIHBUYZuccEg49fyNMRVTTdJjIDWrbw+EZg2T35I/Qmm3dn+4j867uNo4McaBfmJ4Jb09qW8kgmaOCXziJcLsSRto9iR0HBHrT4r5VZkt7WZyv3lJABBPqetIaKX2e1trfc9u4w2BIxzvPoMY5/A9KRtPs1kj2XDJJgbAVLfN1ySOMdf1rUu71TbFWEbSFi3lk7TgHnsQT1p1tHHfpHK0Sk4+7g8DHAz64osM5xoGgmkRYZE8vJB287jjGDj1zx6fnVd7e9aOQpEJrhcAlhkKB398+ntXUWsN7KkhuYE2kkKki7do9T68cdaJtGjkm8w28K4+ZFR2+YdyR3PTpSsM4hd6y7Hj2lVwh6n0yPTg9KBdSqzIfkkccjkL17EdBkE/TNdNeQGNfJhR4WbOZGwV7dOTjt7/nWcNIkdJGiPmp0wADxjqAeOvPH1pWArwyAOwYK6LxzgttA5I56YzTbrYViUyoYj/CG53Y6gU+PTFjnjgdRIzE7nVuEJHU57Y9PWteXwmIY5JftX2rawIUDnGO3rk/zNAHMyYRxgZcZyM55HsevPTjviiWVwGxH5rSN99mAIzwOvJAwBnpx7VoyWr28jQlMqQArGMKenc8cYPbpj61Fe2SO0fyCbzGKBgM+/QjnkdqBWGx3McsTW1yiMGUqr7T24BGBzye3HtVyzvLoFQ3kRLzhFXtn1zVeS1CbCCYwwG1ETksOoHPTvwPSkidBMT5LyBpO5BLcemODjH1phY6OK7uQWdohMhbgxScj5eeCOMexq2DBcx/cV0fd99scjr9eRXLJP8AuQnlrETJ/wAslPmKgxjK+vv7c1ZGpHdC80sTZIbzBIXDj/ZB78Y/DpTQjVGn288uY7gCRf4DyCCOmOPX3pX0lRsUABVGGzlScdcD0+lNstWS5/ebw5AwWRcPx0Jx35HHXpV3fFLypZoN3L7enXiq5RGRFpcMMiK8bJHuJLIAdp69vw5NQm3tQCqFrzr8qgIOeOMYyc+h/lWpcRl41RgGBILAnggjg8VQtraFGW3ZIgRnasfG3tnnueR9R70+UVzHK20821IHW4U5WOQnoeOG9P8A69WEs5hLviRplJ3MUZcnH8IDcD1x7VYms4niFyIw8yhiG5BPTgHoenU1UsreO1gkiEpDOdpLuwzgdTk+/XNPkC4t1Y7EWVXt2JHmOGba6dvUDHasp3IlKNCxDZKhBjAAxkD7x4656ZxVjFmspiumlDv91lm8xCQPm5wMDvj8qiN5EoVhGEeMnDsAzEYwMHk7SOopWQXZUmnuICsrRGHb8oLLtYngenPPY+tV/tk0pwjSIJMjaWyCM5HTP4VoyNNeAwTB5VYbVJdQxGOSDjFIEsoolg2mOQY3NM+CR9cdcfrSsgMsyzsvlDcIkGWRsFucYycc9M/hTHlfzYkBzukzxxyB/F7cfzreSKOSJ4wFRg2F8zByedp4HIGB19femroCzWqyPHFbhiceYCDnHcDqSfrTAyltnE0jGQjKEOoXdj8uO/H86iEf2eMKYywZThuNxP8AP8K2RpkgVAlmQZF4AkB5A4+XqR0x0qxFpUuHd7e48sgYbAx1x1P1/n2pDsY0EUpXcjRvlQv3sY69Mfn0yalMLREygI6BiSvUDp07HjucVotpsYuG3sI2yc7TsLgZ7D2x3qKTStrQvNCkybAM5z+fYdvrmgLFVoQ10siERRMcPsGcdM8de9ONgZZkeKaJpScdxg9V/rWzADMCk1k27YqnB2b2PB59f8at2+mPMSPKkIYbUkDZcAH1I5/OkFjCj0tn3+aFLhCCOpzjr27+lIlgZJMurBVALsUzxgkD3yRit4wWsERRTLEEALPgqMjk8D9celWtNigjjTapLEEsQCCM9yPU+g9TSuOzOblhWUGUlwCQwDLgL34J4IqI6YsgeWGMJwGGxuTjoCc8jnof612V0CrDyLMzF15WTu3bBP8Ak1E2m/bWjcgRlht8rBYD64xzxRqFjlEtZLO23MJ5SxJJ+UZP55GM9cZ7Uq6b9ri/49JfNb5lIf7pAOAB/wDW966yfQEabdDkfKoLDv8A8C7Ug8OIsrCMurZGA6fdIzg+ueT/AD6UahZHLpoaBV2iNt3zHaTkN29e9RS6PINjpbMxZFG7gmQ+wJGD09a6eHT3jaR0hDDYAGSPaAvQjPQHJ61G95OsoUgbY2KAyYLZwDngdfYZyD9KeoWRhRuZrUMDEywkxg49eMkDrj8+RUVzdzqFVEVogwZgeVORgYI6dKlSyglneKRNyDjAO3gZPbHetN9OiS8UK8nAdh044z0xipGUI71pCtvOgVNvlqwUbiQcEEjr2/OpYkMRAcEv1+Z+mTx24B9/Ue1XTKUSdgF/dmELx0yRVhIlht5ZwSzxk4LHPVsc0XCwpIEMi/Z3h4JkiSbJIP1wM57082cSxhlvHtmkTa8AK/Me3rjHqP6U1ZdwMpRN21e3AyelWjBHHGVVQBgkjHXnPNLmGkOs5JLe1EzyGWVXYMpGBj/axnOMdPaiQPeCXzpEKt9+NOh4J4GASOvWo1IijSdFAZ5QrDnBHH+NXo4UuY3ZlC5jZvkGOeDnPXvS5gsZr6YsZdvPAYKRsJJZl+nTr+FXYrGcW6mSePdGQ22QnC/hSuz2pdIXaPaFwy9eRn+dQW93cXah3mZSFRiRj5snBBznIp3G1Y17GyWC2YyyRoWJkOxCGYD+Lnt0z7CiQ7J1tyE2k4GGPOD8vfucj8aoNI1vDviOxg4Oc56tgjnt9KYd5DzNIzMFKnIGDhgMnjrRcVjZjEUX7rzEJYnaCSTj19wTUdwiouIkMm7ORnhuf61DpuZYZJGd+JMBdxwozjA9uK00O7aCBgZx7Y//AF0IDKmuYI9rRL5rvhTsXBB9SSMk/wCc1UOlxuU+yIEuFwGaZuvqcZ+97VeubmWItsbhATgjIP1qN3JG/jJAJ9+KqwrlVNOa1gLxxQqWY7Rt+U8AYPYfifrWPe3C2d4Ckyxx/LukVm27ieADnA6nnOKfd307X6qjCIlWlLIBkkYHOe1U78tI0uXcCNdwCtgfdz0p8ork11rrlRFJdI2QFBOQ6kHkbgMn6eme3NMF9CxMnmSgKM4wASMY49/1rAt4lmuI0bOFUtwepGcEjoavX1hBHpsF2qnfcq0jqWJXOQOB+NFguNnu5PKndcF/4mVQpznGAAcfrx6VRvZVkG3hyuRsAyQvXBzxjqfbFbD6XD9iE4klDq2wYbjHXPTryeaz5LKJoBO25mdjkdB0HpTsIaYfMgidfOEpkyF8zgnpnpnJ5GPXmq0MU/2gx26RygYVnORntj/vrr0zjtV+0ZV1W1tTGjxPGMh8k/M+Dg9R07VZub50E8aRxIsAcLtGPuLuH6imIWJUhn8uW4ERKlh9mYpGp46jseRwferFxqSKIxalASMMCD+8I4IJ79a5mG4kvC5ZtmZV3CPjdnOcnrTdUuJLQl42JKodu4524449PXPXNO47G/Jrd0VASQQ7lywm/iB5AB7H6jnPNP07W5nmkjuTFv3KFMhGQ3U4I74xwKwbTfdXi21xK8yLFu+cAk5Zsg8cg1PpxY3bQK7LGsCyYHUk9ck/Wi4rHXQXAvIGcQ4Vd3ylsjABzjGOuP50qNHcALJFIMYRhJhgc9CD9T+tcda6xdtdxhnDK6jepXhuQMfqeldJYWUVmFaPcS7N94528Z4FPmCwsem2ys0i2jEEHa2TgYzx1/zxVOPTZsELCqo5DbM/PIBg4IJH49q6raqR79qls4GQOOO1LYyF4mmKqH8woCB0AqQOaGiylMqC0u7ARl25GeoyP0/Snx6TIZFhaMlwON6ZXGc4IHTv0rpEt4lunjKK3kBSjEDcMsQeRWi1sjyRnc6YTd8hxk4NJjscavhydnYqtvKinKbJeV9cjgde30rRbSbmO2Kxi3WRY25mJ5bOPw64zWza26qVcFgzt1HGOD0qOPMkTW8hMkZO0h/m6DPfr0pJjsUobCFmSG4SNZRjKRSYI54Pqf8A9dPtbK2C7YWkFvGSMeW2MkkHk9D168Hiq94w0+ArbIsaqpbHXkA/jj2rVZPssC7WZyDuBc7iMr0+lJsaRnTaHDFGpCxSIh3KADuY+vPAx09OvrTjZLcXCCNSmA3zKpPzDrlun51bSUz4RlQLMrFsKOuCf6VI0KW8LoBuQyKAG7DBOARz2oAzZNPETyyAqqpgMRgbcDgjPHr+dNGmm6WIxvJGi9f3RGeM4yOCPY+tR2tzIbqdvlyrRjOM5VnwVOe36+9aRbzI4w4Uh3cFcDAAOMAf56UhmO4jJESIZY1BJEx+YficEHIxzTmLyNBFDbsXh537/u/T16gfhWjb3BlkETpGyrzyo+YjgE/Ssj7Q6X5hTCASNhlJ3ckg8+ntSAtTlrIB5QHjRS7ASbSAD9047VcbUrNpUUPsOMHDAAE84BFZz/cUv+8U7jsflevTHp7VDI6BpUNvCwWRFHy44YZPSqRLNi4lthGTDJ58qoFwp6Dn9O1V/tO23GS0YlKqSZQ3zYxtHt0HSqIghuZoi0MaNJIoZkXaehAP1GBUrTyW7pDEVVPJLY2jqAT/AEqkIVp8TrCb2QMFaQbZMYXP908c/wBKSZzMjNFLCHYZBbKN9eOOmcZ6VWc/2jYXRuFVjjd90ce309qwru5Lskflxqq46Z5yB159zTsB/9k=",
  "home-main": "data:image/jpeg;base64,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",
  "bmw-x2-2018": "data:image/jpeg;base64,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",
  "bike-zwift": "data:image/jpeg;base64,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",
  "bike-diverge": "data:image/jpeg;base64,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",
  "bike-canyon": "data:image/jpeg;base64,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",
  "bike-bianchi": "data:image/jpeg;base64,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",
  "bike-cervelo": "data:image/jpeg;base64,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",
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


// ── Home detail view ──────────────────────────────────────────────────────────
function HomeDetail({ property, items, homeLogs, onLogItem, onAddItem, onUpdateItem, onBack }) {
  const [tab, setTab]           = useState("tasks");
  const [showLogFor, setShowLogFor] = useState(null);
  const [logForm, setLogForm]   = useState({ date:"", cost:"", notes:"" });
  const [addForm, setAddForm]   = useState({ label:"", category:"general", intervalDays:"90", notes:"" });
  const [showAdd, setShowAdd]   = useState(false);

  function submitLog() {
    if (!logForm.date) return;
    const entry = { id:`hl-${Date.now()}`, date:logForm.date, cost:logForm.cost?parseFloat(logForm.cost):null, notes:logForm.notes };
    onLogItem(showLogFor, entry);
    // also update lastDone on the item
    onUpdateItem(showLogFor, { lastDone: logForm.date });
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

  // cost totals
  const allLogs = items.flatMap(i => (homeLogs[i.id]||[]).map(l => ({...l, itemId:i.id})));
  const totalCost = allLogs.reduce((s,l) => s+(l.cost||0), 0);
  const byYear = {};
  allLogs.forEach(l => {
    const yr = l.date?.slice(0,4)||"?";
    byYear[yr] = (byYear[yr]||0) + (l.cost||0);
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
              <div style={{fontSize:".9rem",fontWeight:600}}>{items.length}</div>
              <div style={{fontSize:".62rem",color:"#6b7280",textTransform:"uppercase",letterSpacing:".06em"}}>Tasks</div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:".9rem",fontWeight:600,color:"#ef4444"}}>{items.filter(i=>homePct(i)>=100).length}</div>
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
        {[{key:"tasks",label:"📋 Tasks"},{key:"history",label:`📜 History (${allLogs.length})`},{key:"costs",label:"💰 Costs"}].map(t=>(
          <button key={t.key} className={`tab${tab===t.key?" on":""}`} onClick={()=>setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {/* TASKS TAB */}
      {tab==="tasks" && (
        <>
          {items.sort((a,b)=>homePct(b)-homePct(a)).map(item=>{
            const pct  = homePct(item);
            const left = homeDaysLeft(item);
            const dueStr = homeDueDateStr(item);
            const col  = statusColor(pct);
            const cat  = HOME_CATS[item.category] || HOME_CATS.general;
            return (
              <div key={item.id} className="hi-row">
                <div className="hi-icon">{cat.icon}</div>
                <div className="hi-info">
                  <div className="hi-lbl">
                    {item.label}
                    <span className="hi-cat" style={{background:cat.bg,color:cat.color}}>{cat.label}</span>
                  </div>
                  <div className="hi-det">
                    {intervalLabel(item)}
                    {item.lastDone ? ` · Last: ${new Date(item.lastDone+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}` : " · Never done"}
                    {pct < 100 ? ` · Due: ${dueStr}` : ""}
                    {item.notes ? ` · ${item.notes}` : ""}
                  </div>
                </div>
                <div className="bar-wrap">
                  <div className="bar-bg"><div className="bar-fill" style={{width:`${pct}%`,background:col}} /></div>
                  <div className="bar-pct" style={{color:col}}>{pct>=100?"OVERDUE":`${left}d left`}</div>
                </div>
                <button className="btn btn-g btn-sm" onClick={()=>{
                  setLogForm({date:new Date().toISOString().split("T")[0],cost:"",notes:""});
                  setShowLogFor(item.id);
                }}>Done</button>
              </div>
            );
          })}

          {/* Add task */}
          {!showAdd
            ? <button className="btn btn-g btn-sm" style={{marginTop:16}} onClick={()=>setShowAdd(true)}>+ Add Task</button>
            : (
              <div className="add-home-form" style={{marginTop:16}}>
                <div className="add-home-title">New Task</div>
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
            : [...allLogs].sort((a,b)=>b.date.localeCompare(a.date)).map(e=>{
                const item = items.find(i=>i.id===e.itemId);
                const cat  = HOME_CATS[item?.category] || HOME_CATS.general;
                return (
                  <div key={e.id} className="log-item" style={{borderLeftColor:cat.color}}>
                    <div style={{flex:1}}>
                      <div className="log-lbl"><span style={{marginRight:5}}>{cat.icon}</span>{item?.label || "Unknown"}</div>
                      <div className="log-meta">{e.date}{e.notes?` · ${e.notes}`:""}</div>
                    </div>
                    <div className="log-cost">{e.cost?`$${e.cost.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`:"—"}</div>
                  </div>
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
              {items.find(i=>i.id===showLogFor)?.label}
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
function BikeDetail({ bike, bikeLogs, bikePhoto, allPhotos, jwt: bikeJwt, uid: bikeUid, bikeComponents, rideAssignments, onLogItem, onUpdateBike, onSavePhoto, onAddComponent, onAssignRide, onRefreshPhotos, onBack }) {
  const [tab, setTab]               = useState("stats");
  const [showLogFor, setShowLogFor] = useState(null);
  const [logForm, setLogForm]       = useState({ date:"", miles:"", cost:"", notes:"" });
  const [milesEdit, setMilesEdit]   = useState(bike.currentMiles.toString());
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
  const myRides    = STRAVA_RIDES.filter(r => rideAssignments[r.d+"_"+r.n] === bike.id || r.bike === bike.id);

  // Stats
  const allMyRides = myRides;
  const totalMi    = allMyRides.reduce((s,r)=>s+r.mi,0);
  const avgMi      = allMyRides.length ? totalMi/allMyRides.length : 0;
  const maxMi      = allMyRides.length ? Math.max(...allMyRides.map(r=>r.mi)) : 0;
  const compCost   = components.reduce((s,c)=>s+(c.cost||0),0);
  const svcCost    = allSvcLogs.reduce((s,l)=>s+(l.cost||0),0);

  // Ride filtering
  const filteredRides = STRAVA_RIDES.filter(r => {
    const key = r.d+"_"+r.n;
    const assignedTo = rideAssignments[key];
    if (rideFilter === "mine")       return assignedTo === bike.id;
    if (rideFilter === "unassigned") return !assignedTo;
    return true; // all
  }).filter(r => {
    if (!rideSearch) return true;
    return r.n.toLowerCase().includes(rideSearch.toLowerCase()) || r.d.includes(rideSearch);
  });

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
          {(bike.status||"active")==="active"
            ? <RetireModal type="bike" asset={bike} onRetire={(sd,sp)=>onUpdateBike(bike.id,{status:"retired",soldDate:sd||null,soldPrice:sp||null})} />
            : <button className="btn btn-g btn-sm" onClick={()=>onUpdateBike(bike.id,{status:"active",soldDate:null,soldPrice:null})}>↩ Restore</button>
          }
        </div>
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
              <div className="stat-pill-val">{bike.currentMiles.toLocaleString()}</div>
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
                  setLogForm({date:new Date().toISOString().split("T")[0], miles:bike.currentMiles.toString(), cost:"", notes:""});
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
            {rideFilter==="unassigned" ? "Click a ride to assign it to this bike." : rideFilter==="mine" ? `${myRides.length} rides assigned to this bike.` : `Showing all ${STRAVA_RIDES.length} Strava activities.`}
          </div>
          <div style={{maxHeight:480,overflowY:"auto"}}>
            {filteredRides.slice(0,200).map((r,i)=>{
              const key = r.d+"_"+r.n;
              const assignedTo = rideAssignments[key];
              const isMe = assignedTo === bike.id;
              return (
                <div key={i} className={`ride-row${isMe?" assigned":""}`}
                  onClick={()=>{ if(!isMe) onAssignRide(key, bike.id); else onAssignRide(key, null); }}
                  title={isMe?"Click to unassign":"Click to assign to this bike"}>
                  <div style={{flex:1,minWidth:0}}>
                    <div className="ride-name">{r.n || "Ride"}</div>
                    <div className="ride-meta">{r.d} · {r.dur}{r.in?" · 🏋️ Indoor":""}</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                    <div className="ride-dist">{r.mi} mi</div>
                    {isMe && <span style={{fontSize:".65rem",color:"#22c55e",fontWeight:600}}>✓</span>}
                    {assignedTo && !isMe && <span style={{fontSize:".65rem",color:"#6b7280"}}>other</span>}
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
              <div key={e.id} className="log-item">
                <div style={{flex:1}}>
                  <div className="log-lbl">{e.itemLabel}</div>
                  <div className="log-meta">{e.date} · {e.miles.toLocaleString()} mi{e.notes?` · ${e.notes}`:""}</div>
                </div>
                <div className="log-cost">{e.cost?`$${e.cost.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`:"—"}</div>
              </div>
            ))
          }
          <div style={{marginTop:14}}>
            <button className="btn btn-p btn-sm" onClick={()=>{
              setLogForm({date:new Date().toISOString().split("T")[0], miles:bike.currentMiles.toString(), cost:"", notes:""});
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
  const [editPrice, setEditPrice] = useState(vehicle.purchasePrice ? vehicle.purchasePrice.toString() : "");
  const [editDate,  setEditDate]  = useState(vehicle.purchaseDate || "");
  const [saving, setSaving]       = useState(false);

  const mv  = vehicle.marketValues;
  const pp  = vehicle.purchasePrice;
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
      <div className="sec">Current Market Values <span style={{fontWeight:400,color:"#4b5563",fontSize:".65rem",letterSpacing:0,textTransform:"none"}}>(KBB "Good" condition · {mv?.asOf || "n/a"})</span></div>
      {mv ? (
        <>
          <div className="stat-grid" style={{marginBottom:16}}>
            <div className="stat-card">
              <div className="stat-val" style={{color:"#f97316"}}>{fmt(mv.tradeIn)}</div>
              <div className="stat-lbl">Trade-In Value</div>
              <div style={{fontSize:".68rem",color:"#4b5563",marginTop:3}}>Dealer estimate</div>
            </div>
            <div className="stat-card">
              <div className="stat-val" style={{color:"#60a5fa"}}>{fmt(mv.privateParty)}</div>
              <div className="stat-lbl">Private Party</div>
              <div style={{fontSize:".68rem",color:"#4b5563",marginTop:3}}>Sell to individual</div>
            </div>
            {pp && (
              <div className="stat-card">
                <div className="stat-val" style={{color: dep > 0 ? "#ef4444" : "#22c55e"}}>
                  {dep > 0 ? `-${fmt(dep)}` : `+${fmt(Math.abs(dep))}`}
                </div>
                <div className="stat-lbl">Depreciation</div>
                <div style={{fontSize:".68rem",color:"#4b5563",marginTop:3}}>{depPct}% from purchase</div>
              </div>
            )}
            {pp && (
              <div className="stat-card">
                <div className="stat-val" style={{color:"#a78bfa"}}>{fmt(mv.privateParty)}</div>
                <div className="stat-lbl">Current Value</div>
                <div style={{fontSize:".68rem",color:"#4b5563",marginTop:3}}>vs {fmt(pp)} paid</div>
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
            Source: {mv.source}. Values are estimates for "Good" condition and will vary by mileage, location, and options. 
            <a href="https://www.kbb.com" target="_blank" rel="noopener noreferrer" style={{color:"#f97316",marginLeft:4}}>Get precise quote →</a>
          </div>
        </>
      ) : (
        <div style={{color:"#4b5563",fontSize:".86rem",padding:"12px 0"}}>No market value data on file. Values can be added manually.</div>
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


// ── Photo Gallery (Feature 1 + 2) ────────────────────────────────────────────
function PhotoGallery({ assetId, photos, allPhotos, jwt, uid, onPrimaryChange }) {
  const [uploading,  setUploading]  = useState(false);
  const [uploadCount,setUploadCount]= useState({done:0,total:0});
  const [deleting,   setDeleting]   = useState(null);
  const [dragging,   setDragging]   = useState(false);
  const fileRef  = useRef(null);
  const dropRef  = useRef(null);

  const assetPhotos = allPhotos.filter(p => p.asset_id === assetId)
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
        {assetPhotos.length>0 && <div style={{fontSize:".68rem",color:"#4b5563"}}>Click photo to set as primary</div>}
      </div>

      {assetPhotos.length === 0
        ? <div style={{color:"#4b5563",fontSize:".8rem",padding:"4px 0"}}>No photos yet.</div>
        : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:8}}>
            {assetPhotos.map(p => (
              <div key={p.id}
                style={{position:"relative",borderRadius:8,overflow:"hidden",
                  border:p.is_primary?"2px solid #f97316":"2px solid #222226",
                  cursor:p.is_primary?"default":"pointer",transition:"border-color .15s"}}
                onClick={()=>!p.is_primary && setPrimary(p)}>
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
                  <div style={{position:"absolute",bottom:0,left:0,right:0,background:"#0009",color:"#d1d5db",fontSize:".62rem",textAlign:"center",padding:"4px 0"}}>
                    Set Primary
                  </div>
                )}
              </div>
            ))}
          </div>
      }
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
        <div className="modal-title">Retire {type==="vehicle"?"Vehicle":"Bike"}</div>
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
  const [showRetired, setShowRetired] = useState(false);
  const [tab,         setTab]         = useState("schedule");
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [allPhotos,   setAllPhotos]   = useState([]);

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

  // Schedules by asset_id
  const schedByAsset = {};
  schedules.forEach(s => { if (!schedByAsset[s.asset_id]) schedByAsset[s.asset_id] = []; schedByAsset[s.asset_id].push(s); });

  // Ride assignments map: ride_key → asset_id
  const rideMap = {};
  (Array.isArray(rideAssignments) ? rideAssignments : []).forEach(r => { rideMap[r.ride_key] = r.asset_id; });

  // ── Load all data from Supabase ─────────────────────────────────────────────
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

  useEffect(() => { if (jwt) loadAll(); }, [jwt]);

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
        const s = { access_token: res.access_token, user: res.user };
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
  async function updateHomeItem(itemId, updates) {
    const mapped = {};
    if (updates.lastDone !== undefined) mapped.last_done = updates.lastDone;
    if (updates.label    !== undefined) mapped.label     = updates.label;
    if (updates.notes    !== undefined) mapped.notes     = updates.notes;
    if (Object.keys(mapped).length) {
      await sbFetch("PATCH", `home_items?id=eq.${itemId}`, mapped, jwt);
      setHomeItems(prev => prev.map(i => i.id!==itemId ? i : {...i,...mapped}));
    }
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

  function goVeh(id)  { setSelId(id);      setTab("schedule"); setView("vehicle"); }
  function goBike(id) { setSelBikeId(id);  setTab("stats");    setView("bike");    }
  function goHome(id) { setHomePropId(id); setTab("tasks");    setView("home");    }
  function goBack()   { setView("dashboard"); setSelId(null); setSelBikeId(null); setHomePropId(null); }

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
              {bikes.length>0 && (
                <>
                  <div className="dash-section-hdr" style={{marginTop:28}}>
                    <div className="dash-section-title">🚴 Bikes</div>
                  </div>
                  <div className="grid">
                    {bikes.filter(b => (b.status||"active")==="active").map(bike => {
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

              {/* Home */}
              {properties.length>0 && (
                <>
                  <div className="dash-section-hdr" style={{marginTop:28}}>
                    <div className="dash-section-title">🏠 Home</div>
                  </div>
                  <div className="grid">
                    {properties.map(prop => {
                      const items = (homeItemsByAsset[prop.id]||[]).map(asHomeItem);
                      const { red, yellow } = homeAlerts(items);
                      return (
                        <div key={prop.id} className={`home-card${homePropId===prop.id?" sel":""}`} onClick={()=>goHome(prop.id)}>
                          <div style={{display:"flex",gap:14,alignItems:"center",padding:14}}>
                            <div className="home-card-banner">
                              {photosMap[prop.id] ? <img src={photosMap[prop.id]} alt={prop.name} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:8}} /> : <span>🏠</span>}
                            </div>
                            <div className="home-card-body-inner">
                              <div className="home-card-name">{prop.name}</div>
                              {prop.address && <div className="home-card-sub">{prop.address}</div>}
                              <div style={{fontSize:".75rem",color:"#6b7280",marginBottom:8}}>{items.length} tasks tracked</div>
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
                  <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}>
                    {(selVeh.status||"active")==="active"
                      ? <RetireModal type="vehicle" asset={v} onRetire={(sd,sp)=>retireAsset(selVeh.id,sd,sp)} />
                      : <button className="btn btn-g btn-sm" onClick={()=>restoreAsset(selVeh.id)}>↩ Restore</button>
                    }
                  </div>
                </div>

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
                          <div key={svc.id} className="svc-row">
                            <div className="svc-icon">{svcIcon(svc.label)}</div>
                            <div className="svc-info">
                              <div className="svc-lbl">{svc.label}</div>
                              <div className="svc-det">Every {svc.miles.toLocaleString()} mi · {last?`Last @ ${last.miles.toLocaleString()} mi`:"No record"}</div>
                            </div>
                            <div className="bar-wrap">
                              <div className="bar-bg"><div className="bar-fill" style={{width:`${pct}%`,background:col}} /></div>
                              <div className="bar-pct" style={{color:col}}>{pct>=100?"OVERDUE":`${left.toLocaleString()} mi`}</div>
                            </div>
                            <button className="btn btn-g btn-sm" onClick={()=>{
                              setLogForm({serviceLabel:svc.label, miles:v.odometer.toString(), date:new Date().toISOString().split("T")[0], notes:"", cost:"", category:autoCategory(svc.label), performedBy:"", location:""});
                              setShowLog(selVeh.id);
                            }}>Log</button>
                          </div>
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
                  <ValuationTab vehicle={v} onUpdate={updates=>updateAsset(selVeh.id, {
                    purchase_price: updates.purchasePrice,
                    purchase_date:  updates.purchaseDate,
                  })} />
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
                  if (updates.photo        !== undefined) { /* handled separately */ }
                  if (Object.keys(mapped).length) updateAsset(selBike.id, mapped);
                }}
                onSavePhoto={dataUrl => savePhoto(selBike.id, dataUrl)}
                onAddComponent={(id, entry) => addBikeComponent(selBike.id, entry)}
                onAssignRide={(key, assetId) => assignRide(key, assetId)}
                onRefreshPhotos={refreshPhotos}
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
            return (
              <HomeDetail
                property={p}
                items={items}
                homeLogs={logsForProp}
                onLogItem={(itemId, entry) => logHomeItem(itemId, selProp.id, entry)}
                onAddItem={item => addHomeItem(selProp.id, item)}
                onUpdateItem={(itemId, updates) => updateHomeItem(itemId, updates)}
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
