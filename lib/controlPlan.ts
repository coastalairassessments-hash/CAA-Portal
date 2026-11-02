// The Home Environmental Control Plan: 11 short one-page guides, one per part.
// Each part has a "simple version" box, the key points, one next step, and a link to the full PDF.
// PLAN_DRAFT = true keeps the whole series hidden. Only a signed-in admin can open it. Flip to false to release.
import { PLAN_SOURCES } from "./controlPlanSources";

export const PLAN_DRAFT = true;
export const PLAN_SLUG = "home-environmental-control-plan";
export const PLAN_TITLE = "Home Environmental Control Plan";
export const PLAN_SUMMARY = "11 short guides for keeping your home dry, clean and low in dust.";

export type Tone = "low" | "ok" | "watch" | "bad";
export type PlanBlock =
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "table"; head: string[]; rows: string[][] }
  | { kind: "bar"; segments: { label: string; note: string; tone: Tone }[] };

export type PlanPart = {
  n: number;
  layer: string;
  title: string;
  simple: string[];
  blocks: PlanBlock[];
  next: string;
};

const p = (text: string): PlanBlock => ({ kind: "p", text });
const ul = (...items: string[]): PlanBlock => ({ kind: "ul", items });

const START = "Start here";
const L1 = "Layer 1 · Keep the house dry";
const L2 = "Layer 2 · Filter the air";
const L3 = "Layer 3 · Bedrooms first";
const L4 = "Layer 4 · Clean to remove allergens";

export const PLAN_PARTS: PlanPart[] = [
  {
    n: 1,
    layer: START,
    title: "How mold and dust mites work",
    simple: [
      "Mold and dust mites need water to grow.",
      "Every home has food (dust) and warmth, so we take away the water.",
      "If the air stays dry, they cannot grow very much.",
    ],
    blocks: [
      p("The goal is not a spore-free house. Spores are everywhere. The goal is to keep materials dry enough that they never get the moisture they need. Four layers, in order of impact: control moisture, filter the air, remove dust reservoirs (bedrooms first), and clean in a way that removes allergens instead of stirring them up."),
      { kind: "bar", segments: [
        { label: "Under 35%", note: "Rare in Florida", tone: "low" },
        { label: "35 to 50%", note: "Aim here", tone: "ok" },
        { label: "50 to 60%", note: "Mites can live", tone: "watch" },
        { label: "Over 60%", note: "Mold risk climbs", tone: "bad" },
      ] },
      p("Keep a hygrometer in the bedroom and the main living area. Short humid spells still count. Mites can survive if humidity tops 50 percent for even an hour or two a day, so showers, cooking and AC settings matter every day."),
      { kind: "table", head: ["", "If you can only do five things this month"], rows: [
        ["1", "Keep indoor humidity between 35 and 50 percent."],
        ["2", "Fix leaks and condensation. Dry anything wet within 24 to 48 hours."],
        ["3", "Zippered covers on the mattress, box spring and pillows. Wash bedding weekly."],
        ["4", "Thermostat fan on AUTO. MERV 13 filter that fits with no gaps."],
        ["5", "A correctly sized true-HEPA air cleaner in the sensitive person's bedroom."],
      ] },
    ],
    next: "Start with the five actions above. Your assessment report shows which parts of this plan matter most for your home.",
  },
  {
    n: 2,
    layer: L1,
    title: "Humidity and dew point",
    simple: [
      "Water hides in the air. We cannot see it.",
      "When wet air touches something cold, the water comes out as little drops.",
      "We keep the air dry so the drops never show up.",
    ],
    blocks: [
      ul(
        "Put a digital hygrometer in the sensitive person's bedroom and one in the main living area. Check them morning and evening for the first few weeks.",
        "Check that it reads true. Seal it in a zip bag with a cup of damp table salt for 8 to 12 hours. It should read about 75 percent. Note how far off it is and adjust future readings.",
        "Treat readings that stay above 55 percent as a problem to fix, not just a comfort issue.",
        "Dew point tells you how much water is really in the air. Keeping the indoor dew point below about 55°F nearly always keeps cool surfaces from getting damp.",
      ),
      { kind: "table", head: ["Room temp", "Dew point at 40% RH", "At 50% RH", "At 60% RH"], rows: [
        ["72°F", "46°F", "52°F", "57°F"],
        ["75°F", "49°F", "55°F", "60°F"],
        ["78°F", "52°F", "58°F", "63°F"],
      ] },
      p("Any surface colder than the dew point gets wet. A cold AC vent, a closet wall or a window frame can sweat even when the room reading looks fine."),
    ],
    next: "Put a hygrometer in the bedroom and living area and write down the readings for one week. If humidity stays above 50 percent, see Part 3 or contact us.",
  },
  {
    n: 3,
    layer: L1,
    title: "Let the AC do its second job",
    simple: [
      "The air conditioner is also a water catcher.",
      "It pulls water out of the air and sends it down a pipe.",
      "Set the fan to AUTO so the water goes away and does not come back.",
    ],
    blocks: [
      ul(
        "Fan on AUTO, never ON. With the fan on, the blower pushes air across the wet coil and puts the water back into the house. Many systems also keep the blower running 1 to 3 minutes after the compressor stops. Ask your HVAC contractor to shorten that delay.",
        "Bigger is not better. An oversized AC cools fast and shuts off before it removes much water, leaving the air cool but clammy. If yours short-cycles, ask for a Manual J load calculation before replacing equipment.",
        "Avoid very cold setpoints. They make vents and grilles cold enough to sweat.",
        "Add a dehumidifier when the AC alone cannot hold the target, especially in the bedroom and in mild spring and fall weather.",
        "Run bathroom fans during showers and at least 20 minutes after. Vent the kitchen hood and the dryer outdoors. Skip drying laundry indoors.",
        "Keep windows closed on humid days. No humidifiers in the home of a mite-sensitive person, and no houseplants or fish tanks in the bedroom.",
        "Keep the AC drain pan and line clean, and service the system at least yearly.",
      ),
    ],
    next: "Check that the thermostat fan is on AUTO today. At your next service visit, ask your HVAC contractor about the blower-off delay and dehumidification settings.",
  },
  {
    n: 4,
    layer: L1,
    title: "When water gets in",
    simple: [
      "If something gets wet, dry it fast. Do it today.",
      "If it stays wet for two days, mold can start to grow.",
    ],
    blocks: [
      { kind: "bar", segments: [
        { label: "Right away", note: "Stop the source, start drying", tone: "ok" },
        { label: "24 hours", note: "Hurry", tone: "watch" },
        { label: "48 hours", note: "Last good chance", tone: "watch" },
        { label: "72 hours", note: "Assume mold may have started", tone: "bad" },
      ] },
      ul(
        "Treat any water event as urgent. Stop the source, remove standing water, and run fans and dehumidifiers.",
        "Watch for early signs: ceiling stains, bubbling paint, swollen baseboards, damp carpet edges, musty odors, and condensation at windows and AC vents.",
        "Do not paint or caulk over a stain. It does not stop mold, and the paint will peel.",
      ),
      { kind: "table", head: ["Where water gets in", "What to check"], rows: [
        ["Roof, flashing, roof vents", "Stains on ceilings below"],
        ["Windows and frames", "Sills, corners, swollen trim"],
        ["Sliding doors and shutter tracks", "Track drains, damp floor edges"],
        ["Stucco cracks and wall openings", "Cracks, rust or salt stains"],
        ["Plumbing: sinks, toilets, fridge lines", "Under cabinets, behind appliances"],
        ["AC drain pan, line and coil", "Pan, closet floor, drain flow"],
        ["Ground water, sprinklers, slab edge", "Soggy soil, wet lower walls"],
      ] },
      p("Water often travels inside a wall before it shows, so the stain is not always where the leak is."),
    ],
    next: "If you find active water, stop the source if you safely can, take photos, and start drying within 24 hours. Contact us if the wet area is inside a wall or ceiling, or keeps coming back.",
  },
  {
    n: 5,
    layer: L1,
    title: "Check the outside of the house",
    simple: [
      "Rain and sprinkler water should run away from the house, not toward it.",
      "Two times a year, walk around the house with a grown-up.",
      "Look for puddles, cracks and wet spots.",
    ],
    blocks: [
      p("Walk the house twice a year and after big storms. If you can, go during or just after a heavy rain, when you can see where the water really goes. Bring a phone, a flashlight and binoculars. Look at the roof from the ground. Do not climb on it."),
      { kind: "table", head: ["Check", "What good looks like"], rows: [
        ["Gutters", "Clear, not overflowing in heavy rain"],
        ["Downspouts", "Empty at least 5 ft from the house"],
        ["Sprinklers", "Spray away from walls, windows and the AC unit"],
        ["Base of the stucco", "At least 4 in above soil, 2 in above paving. Weep holes open"],
        ["Plants and mulch", "Plants 2 ft out. Mulch under 2 in deep near the wall"],
        ["AC drain line", "Empties away from the house. A dry line on a hot day can mean a clog"],
        ["Windows and sliders", "Weep holes open. Never caulk over them"],
        ["Ground slope", "Falls at least 6 in over the first 10 ft"],
        ["Dryer and bath vents", "Vent outdoors. The dryer flap opens when it runs"],
      ] },
      p("Two quick tests. Water meter: turn off all water, read the meter, read it again two hours later. A change means a likely leak. Window weep test: pour about a cup of water into the inside sill track. It should drain out through the weep holes on the outside."),
      p("Call us if you find stains, bubbling paint or a musty smell inside a wall that faces a sprinkler, downspout or puddle, stucco cracks or rust stains near windows or sliders, or ground that stays soggy against the slab a day or more after rain."),
    ],
    next: "Do the walk-around this month, then again in six months. Send us photos of anything that looks off and we can help decide if it needs a closer look.",
  },
  {
    n: 6,
    layer: L1,
    title: "Away from home and hurricane season",
    simple: [
      "When you go away, leave the air conditioner on.",
      "A house with no AC gets damp, and damp houses grow mold.",
      "Big storms bring rain. We get ready before, and dry fast after.",
    ],
    blocks: [
      p("Never turn the AC off for a long absence, and keep the fan on AUTO. A remote humidity sensor or smart-thermostat alert tells you if humidity rises or the AC fails while you are away. Florida Solar Energy Center tested real vacant homes:"),
      { kind: "table", head: ["Away setting", "Our take"], rows: [
        ["AC off", "Do not use. Humidity could not stay below 65 percent."],
        ["Thermostat at 83 to 85°F", "Not enough on its own in cloudy, humid weather."],
        ["AC about 2 hours a day, early morning", "Good with a programmable thermostat."],
        ["Dehumidifier on a humidistat or timer", "Good. Lowest energy use. Drain it to a sink or drain."],
        ["Humidistat that calls the AC", "Only with a low-temperature limit, about 77°F."],
      ] },
      ul(
        "Before the season: check roof, window, slider and shutter seals and track drains. Flush the AC drain line. Have a dehumidifier and wet/dry vacuum ready.",
        "After a storm: re-enter only when safe. Take photos for insurance. Wear at least an N95, goggles and gloves. Run generators outside, 20 ft from the house.",
        "Dry everything within 24 to 48 hours. If the HVAC took on floodwater, have it cleaned before you turn it on.",
        "Signs a wall or ceiling is wet inside: stains or bubbling paint, swollen baseboards, soft drywall, musty odor that returns, dark spots at AC registers. Take a photo, note the date, and call us.",
      ),
    ],
    next: "Before your next trip or June 1, pick an away setting and test it for a few days while you are home. After any storm, look for the signs above within 24 hours.",
  },
  {
    n: 7,
    layer: L2,
    title: "HVAC and air filtration",
    simple: [
      "Filters are like nets for air. They catch dust.",
      "A good net has to fit tight, or the dust sneaks around it.",
      "A small air cleaner in the bedroom helps while you sleep.",
    ],
    blocks: [
      ul(
        "Use at least MERV 13, or the highest your system can handle. Have your HVAC technician confirm.",
        "It should sit snug with no visible gaps. Change it on schedule. A clogged filter lets air bypass it.",
        "A central filter only cleans while the system runs, usually under 25 percent of the time. We do not run the fan continuously in Florida because of humidity, so a bedroom HEPA unit fills the gap.",
        "A filter that is fully coated every month is a clue. It often means leaky return ducts. Ask your HVAC contractor to test duct leakage instead of only changing filters more often.",
      ),
      p("Portable HEPA air cleaner. Choose true HEPA and size it by CADR (clean air delivery rate), not the box photo. For 8-foot ceilings:"),
      { kind: "table", head: ["Room size (sq ft)", "Minimum CADR (cfm)"], rows: [
        ["100", "65"], ["200", "130"], ["300", "195"], ["400", "260"], ["500", "325"], ["600", "390"],
      ] },
      ul(
        "Run it whenever the room is occupied. Place it near the bed, out of corners and from behind furniture.",
        "It cannot remove everything. Many allergens ride on large particles that settle fast, so cleaning still matters.",
        "Avoid ozone generators and ionizers. Ozone does not effectively remove mold, and it can trigger asthma.",
      ),
    ],
    next: "Check your filter size and MERV rating, and confirm it fits with no gaps. Measure the sensitive person's bedroom so you can match an air cleaner's CADR to the room.",
  },
  {
    n: 8,
    layer: L3,
    title: "Bedrooms as clean zones",
    simple: [
      "We spend a lot of time in bed, so the bed matters most.",
      "Zip covers go on the bed and pillows.",
      "Sheets get washed every week.",
      "Smooth things are easy to wipe. Fuzzy things hold dust.",
    ],
    blocks: [
      { kind: "table", head: ["Item", "Recommendation"], rows: [
        ["Mattress, box spring, pillows", "Fully zippered encasements on all three. Tightly woven fabric, pore size under 10 microns. Skip nonwoven covers."],
        ["Sheets and blankets", "Wash weekly. Warm or even cold water removes most mites. Dry on the hottest setting the fabric allows."],
        ["Comforters", "Wash with bedding, or encase, or run about an hour in a hot dryer."],
        ["Pillows", "Washable synthetic, not feather or wool. Encase them."],
        ["Stuffed animals", "A few favorites. Washable. Wash weekly or store in closed bins."],
        ["Curtains and clutter", "Wipeable blinds or shades. Closed storage instead of open shelves."],
        ["Pets", "Out of the sensitive person's bedroom, always."],
      ] },
      { kind: "table", head: ["Furniture", "Best choice"], rows: [
        ["Sofas and chairs", "Leather, vinyl, wood or metal with washable cushion covers. If you keep fabric, HEPA-vacuum weekly."],
        ["Flooring", "Tile, sealed wood, laminate or vinyl. Low-pile carpet needs vacuuming twice a week in bedrooms."],
        ["Rugs", "Small washable rugs instead of large fixed ones."],
      ] },
      { kind: "table", head: ["When shopping", "Look for / Skip"], rows: [
        ["Mattress and pillow covers", "Zippered, pore size under 10 microns / Nonwoven"],
        ["Air cleaner", "True HEPA, CADR matched to room / Ozone, ionizers"],
        ["HVAC filter", "MERV 13 in the exact slot size / Loose or bent filters"],
        ["Vacuum", "HEPA, or central vacuum vented outside / Leaky bagless units"],
        ["Hygrometer", "Digital, with temperature and ideally dew point / Thermostat reading only"],
        ["Dehumidifier", "Built-in humidistat and drain hose / Humidifiers"],
      ] },
    ],
    next: "Start with the sensitive person's bedroom: covers on the mattress and pillows, weekly washing, and less clutter.",
  },
  {
    n: 9,
    layer: L4,
    title: "Clean to remove allergens",
    simple: [
      "We want to pick dust up, not push it into the air.",
      "Use a wet cloth, not a dry duster.",
      "Clean from the top down. Do the floor last.",
      "If you see a little mold, tell a grown-up.",
    ],
    blocks: [
      ul(
        "Use a sealed HEPA vacuum, or a central vacuum that vents outside. Empty it outdoors.",
        "The sensitive person should not do the vacuuming. Clean while they are away, not in their bedroom at night. Anyone allergic who must clean should wear an N95.",
        "Damp-dust and damp-mop. Do not dry-dust or sweep.",
        "Work top to bottom: fan blades, vents, shelves, furniture, floors last.",
        "Shoes off at the door. Entry mats cut tracked-in dust and pollen.",
        "Wipe and dry hidden damp spots: washer door gaskets, fridge drip pans, under sinks, shower corners, window tracks.",
      ),
      p("Small spots of mold"),
      ul(
        "Fix the water first, then clean. On hard surfaces, scrub with water and detergent and dry completely.",
        "Removing beats killing. Dead mold can still cause reactions. EPA does not recommend bleach as routine mold cleanup. Never mix bleach with ammonia.",
        "People with allergies, asthma, lung disease or weak immune systems should not clean mold. Anyone cleaning wears an N95, gloves and goggles without vent holes.",
        "Moldy carpet and ceiling tiles often cannot be cleaned. If growth covers more than about 10 square feet (3 ft by 3 ft), or there was a lot of water damage, get professional help.",
      ),
    ],
    next: "Switch to damp dusting and a sealed HEPA vacuum this week. If mold covers more than about 10 square feet or keeps coming back, contact us before cleaning.",
  },
  {
    n: 10,
    layer: "Putting it together",
    title: "Your cleaning and maintenance schedule",
    simple: [
      "Some jobs are every day. Some are every week. Some are a few times a year.",
      "Stick this page on the fridge and check things off.",
    ],
    blocks: [
      { kind: "table", head: ["How often", "Tasks"], rows: [
        ["Daily", "Check the bedroom hygrometer. Bath fan during and 20 minutes after showers. Wipe shower walls. Keep kitchen and bath surfaces dry."],
        ["Twice weekly", "HEPA-vacuum bedroom carpets and rugs. Damp-mop hard floors."],
        ["Weekly", "Wash all bedding. Damp-dust. HEPA-vacuum other carpet, upholstery and headboards. Wash throws, pillow covers and washable toys."],
        ["Monthly", "Check the HVAC filter. Vacuum vents and grilles. Clean the dehumidifier filter. Wipe window sills and tracks. Check the AC drain flows."],
        ["Every 3 months", "Replace the HVAC filter at minimum. Check air cleaner pre-filters. Wash curtains. Wipe blinds and fans."],
        ["Every 6 to 12 months", "HVAC service: coil, drain pan, drain line. Confirm fan on AUTO and a short blower-off delay. Check under sinks, toilets, water heater and window frames for leaks."],
        ["Twice a year", "Outside walk-around. Water meter test. Window weep test."],
        ["Yearly", "Salt test on hygrometers. Check roof, window and shutter seals before hurricane season. Make an away-from-home AC plan."],
        ["After any storm or leak", "Look for wet spots within 24 hours. Dry anything wet within 24 to 48 hours."],
      ] },
    ],
    next: "Post this page where the family will see it. Put the twice-a-year and yearly tasks on your calendar now.",
  },
  {
    n: 11,
    layer: "When to call a professional",
    title: "About mold testing, and when to call us",
    simple: [
      "We do not need a test to know mold is there if we can see it.",
      "The most important job is finding where the water comes from.",
    ],
    blocks: [
      p("If mold is visible, sampling is usually unnecessary. There are no EPA or federal limits for mold spores to compare a result against, and CDC does not recommend routine mold testing. It advises removing mold and fixing the moisture problem."),
      p("A professional earns their keep on what a swab cannot answer: where the water comes from, how far it has traveled inside the wall or ceiling, and whether it is still active. We use moisture meters, thermal imaging, humidity and dew point readings and, when needed, small inspection openings. When sampling does help, for example to confirm an area was cleaned, it should be designed and read by experienced professionals."),
      { kind: "table", head: ["Contact us when", ""], rows: [
        ["Humidity", "Stays above 55 percent, or dew point above about 55°F, despite the AC and a dehumidifier."],
        ["Odor or condensation", "Musty smells that keep returning, or condensation at windows, walls or AC vents."],
        ["Water", "Any water intrusion: leaks after rain, shutters or sliders, plumbing, the AC drain."],
        ["Visible mold", "Especially more than about 10 square feet or after significant water damage."],
        ["After remediation", "To confirm the work area shows no remaining water damage, mold or odor."],
        ["Symptoms", "They continue after these controls are in place."],
      ] },
      p("This plan is general household guidance, not medical advice. An allergist can tell you which allergens matter most for your household. Targets here are widely used, not guarantees. Every building and person is different."),
    ],
    next: "If anything above applies to your home, reach out through your client portal and include photos and your recent humidity readings.",
  },
];

export const planPart = (n: number) => PLAN_PARTS.find((x) => x.n === n);
export const planSources = (n: number) => PLAN_SOURCES[n] ?? [];
export const planPdfFile = (n: number) => `part-${String(n).padStart(2, "0")}.pdf`;
