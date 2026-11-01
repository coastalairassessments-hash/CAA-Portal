// The Resources guides. Each is plain data, so editing a guide means editing text here.
// draft: true keeps a guide hidden from the public. Only a signed-in admin can open it until it is released.
import { PLANTS } from "./plantsData";

export type Block =
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "table"; head: string[]; rows: string[][] };
export type Section = { heading: string; blocks: Block[] };
export type Guide = {
  slug: string;
  title: string;
  summary: string;
  draft: boolean;
  pdf?: string;
  sections: Section[];
  references?: { n: number; text: string; url: string }[];
};

const p = (text: string): Block => ({ kind: "p", text });
const ul = (...items: string[]): Block => ({ kind: "ul", items });

const CONTROL_PLAN: Guide = {
  slug: "home-environmental-control-plan",
  title: "Home Environmental Control Plan",
  summary: "Keeping the house dry, clean and low in dust for people with mold and dust sensitivities.",
  draft: true,
  // PDF copy waits in content/guides until the guide is released, then moves to public/guides.
  sections: [
    {
      heading: "The goal",
      blocks: [
        p("When someone in the home has sensitivities, we want to take the house out of the equation, so that if symptoms continue, the building can be ruled out as a driver instead of guessed at. This plan does that in four layers, in order of impact: control moisture, remove dust reservoirs, clean in a way that removes allergens instead of stirring them up, and filter what remains."),
        p("Bedrooms deserve particular attention because of the long periods spent sleeping. Apply the same dust-control practices to family rooms and other frequently used spaces."),
      ],
    },
    {
      heading: "Where to start",
      blocks: [
        p("If you can only do a few things this month, do these. They give the largest return for the effort."),
        {
          kind: "table",
          head: ["Priority", "Action", "Why it matters"],
          rows: [
            ["1", "Hold indoor humidity between 30 and 50 percent, measured with a hygrometer in the bedroom and main living area.", "Mold and dust mites both depend on moisture. EPA recommends 30 to 50 percent [1], and the allergy practice parameter calls keeping humidity below 50 percent the most effective way to limit mites [2]."],
            ["2", "Encase the sensitive person's mattress, box spring and pillows in zippered allergen-barrier covers, and wash bedding weekly.", "The bed is the largest single dust-mite reservoir a person has contact with. AAFA notes encasing mattresses works better than air cleaners for reducing allergy symptoms [8]."],
            ["3", "Upgrade the HVAC filter to MERV 13, or the highest rating the system can handle, and confirm it fits with no gaps.", "EPA recommends at least MERV 13 or as high as the system fan and filter slot can accommodate [5]."],
            ["4", "Run a properly sized true-HEPA portable air cleaner in the sensitive person's bedroom.", "ACAAI recommends a HEPA air cleaner in the allergic person's bedroom [4]."],
            ["5", "Correct leaks, water intrusion and condensation, and complete any moisture-control repairs recommended for the home.", "Cleaning cannot keep up with an active moisture source. EPA's first rule of mold control is moisture control [12]."],
          ],
        },
      ],
    },
    {
      heading: "Layer 1: Keep the house dry",
      blocks: [
        p("In South Florida, the air conditioner is the main dehumidifier in the house, so how it runs matters as much as how cold it gets. Place an inexpensive digital hygrometer in the sensitive person's bedroom and one in the main living area, and check them morning and evening for the first few weeks."),
        ul(
          "Target 30 to 50 percent relative humidity, and treat readings that stay above 55 percent as a problem to correct, not just a comfort issue. ACAAI advises keeping humidity below 55 percent and using a dehumidifier in humid climates [4].",
          "Watch the thermostat fan setting. In our humid climate, running the fan in the continuous ON position can let moisture on the cooling coil re-evaporate back into the house between cooling cycles. If humidity climbs with the fan on, return it to AUTO.",
          "Add a dehumidifier if the AC alone cannot hold the target, particularly in the sensitive person's bedroom. Empty and clean the bucket and filter on the manufacturer's schedule, or route it to a drain.",
          "Exhaust moisture at the source. Run bathroom fans during showers and for at least 20 minutes after; use a kitchen hood vented outdoors when cooking; confirm the clothes dryer vents outside; avoid drying laundry indoors.",
          "Keep windows closed on humid days and let the AC do the work. Opening the house to humid outdoor air raises indoor humidity and brings in outdoor mold spores and pollen [10].",
          "Do not use humidifiers or vaporizers where indoor humidity is elevated [15]. Keep houseplants and fish tanks out of the bedroom, as they add moisture [10].",
          "Treat any water event as urgent. EPA advises drying wet, non-moldy materials within 48 hours to prevent mold growth [14]. Report leaks, wet carpet, ceiling stains or condensation at registers right away.",
          "Keep the AC drain line and pan clear, and have the system serviced at least yearly, including the coil and drain pan.",
        ),
      ],
    },
    {
      heading: "Layer 2: HVAC and air filtration",
      blocks: [
        p("The HVAC system moves the entire volume of the house through the filter many times a day, which makes it the best whole-house dust control tool you have, if it is set up correctly."),
        ul(
          "Filter rating. Use MERV 13, or the highest rating your system can handle. Most systems can accommodate MERV 13 if the filter is changed frequently, but have your HVAC technician confirm it for your equipment [5].",
          "Filter fit. A high-rated filter does little if air bypasses it. The filter should sit snugly in its slot or grille with no visible gaps around the edges.",
          "The monthly filter loading is a clue. A filter that is fully covered every month suggests the system is pulling in more dust than a typical home, often from leaky return ductwork or a return plenum drawing attic air. Ask your HVAC contractor to evaluate duct leakage and return sealing rather than only replacing filters more often.",
          "Portable HEPA air cleaner in the bedroom. Choose a true-HEPA unit with a clean air delivery rate (CADR) sized for the room [5]. Run it continuously while the room is occupied, keep it off the floor corner and out from behind furniture, and replace filters on schedule.",
          "Know its limits. EPA notes that most portable air cleaners do not effectively remove larger particles such as dust-mite allergen and some mold spores, because those settle quickly [7]. That is why bedding and cleaning routines matter more than the air cleaner.",
          "Avoid ozone generators and ionizer-type cleaners. EPA advises against using ozone-generating air cleaners in occupied spaces, and notes that ozone at safe levels does not effectively remove mold or other biological pollutants [6].",
        ),
      ],
    },
    {
      heading: "Layer 3: Bedrooms as clean zones",
      blocks: [
        p("Give bedrooms particular attention because people spend long, continuous periods there sleeping. Use the practices below to reduce dust reservoirs around beds and bedding, and apply the same approach to other frequently used rooms."),
        {
          kind: "table",
          head: ["Item", "Recommendation"],
          rows: [
            ["Mattress, box spring, pillows", "Fully zippered, six-sided allergen-barrier encasements on all three. Clinical studies show encasings significantly reduce mite allergen exposure in mite-allergic asthma [16]. Wipe or wash encasements per the manufacturer."],
            ["Sheets, pillowcases, blankets", "Wash weekly. Many sources recommend 130°F water [3], but the allergy practice parameter notes weekly washing removes most mites even at lower temperatures and recommends home water heaters stay at or below 120°F to prevent scalding [2]. Dry on the hottest setting the fabric allows."],
            ["Comforters and duvets", "Wash with bedding if possible. If not, encase them, or run them through a hot dryer; comforters need about an hour in the dryer to kill all mites [2]."],
            ["Pillows", "Choose washable synthetic pillows over feather or wool, and encase them [9]."],
            ["Stuffed animals and decorative pillows", "Keep to a minimum. Choose washable items and wash them weekly, or store them in closed bins."],
            ["Window coverings", "Replace heavy fabric drapes with wipeable blinds or roller shades. If curtains stay, use washable fabric and wash them seasonally [3]."],
            ["Clutter", "Remove knickknacks, open shelving, and stacks of books or papers that collect dust; store items in closed containers [3]."],
            ["Pets", "Keep pets out of the bedroom at all times [4]."],
            ["Bed placement", "Leave enough space around the bed to clean and inspect the adjacent walls and floor."],
          ],
        },
      ],
    },
    {
      heading: "Furniture and furnishings",
      blocks: [
        p("The best furniture for a sensitive household is anything with a smooth, wipeable surface and nothing inside it that can trap dust or hold moisture. Health guidance recommends wood, plastic, leather or vinyl furniture that can be wiped clean, and avoiding fabric-covered furniture, wall-to-wall carpet and heavy drapes [10]. When replacing something is not realistic, the right column shows how to manage what you already have."),
        {
          kind: "table",
          head: ["Item", "Best choice", "If you can't change it"],
          rows: [
            ["Sofas and chairs", "Leather, faux leather, vinyl, wood or metal frames with removable, washable cushion covers.", "HEPA-vacuum upholstery weekly with the brush attachment, including seams and under cushions. Wash removable covers with bedding. Consider zippered dust-proof covers [4]."],
            ["Flooring", "Tile, sealed wood, laminate or vinyl, especially in the bedroom [11].", "Low-pile carpet, HEPA-vacuumed at least twice a week [11]. Periodic hot-water extraction or steam cleaning, with the carpet dried fully the same day."],
            ["Rugs", "Small, washable area rugs instead of large fixed rugs [10].", "Vacuum both sides; shake or wash outdoors when possible."],
            ["Headboard and bed frame", "Wood, metal or wipeable surfaces.", "HEPA-vacuum upholstered headboards weekly; avoid tufted fabric in new purchases."],
            ["Storage", "Closed cabinets and drawers, lidded bins.", "Clear open shelving of decorative items; damp-wipe shelves weekly."],
            ["Window treatments", "Blinds, shutters or roller shades that wipe clean.", "Washable curtains, washed seasonally [3]."],
            ["Throw blankets and decorative pillows", "Washable throws and pillows with removable, washable covers.", "Wash throws and removable covers weekly according to care labels. HEPA-vacuum non-washable cushions and pillows according to manufacturer instructions [3, 4]."],
          ],
        },
      ],
    },
    {
      heading: "Layer 4: A cleaning routine that removes allergens",
      blocks: [
        p("How you clean matters as much as how often. Dry dusting, sweeping and older vacuums can throw fine dust and allergen back into the air, where it can take more than two hours to settle [4]. The aim is to capture and remove dust, not move it around."),
        ul(
          "Use a sealed HEPA vacuum. A vacuum with a HEPA filter, or a double-thickness bag, holds onto fine allergen; standard bags can let it escape back into the room [10]. Empty canisters or change bags outdoors.",
          "Damp-dust, don't dry-dust. Wipe hard surfaces with a damp cloth and damp-mop floors rather than sweeping, so dust is picked up instead of launched into the air [11].",
          "Work top to bottom: ceiling fan blades, vents and grilles, shelves, furniture, then floors last.",
          "Keep the sensitive person away during and after cleaning. ACAAI recommends cleaning when the allergic person is away, avoiding cleaning their bedroom at night, and wearing an N95 mask while dusting or vacuuming [4].",
          "Leave shoes at the door and use entry mats to reduce tracked-in dust, pollen and outdoor mold [15].",
          "Clean, don't spray. For small spots of mold on hard surfaces, scrub with detergent and water and dry completely. Do not paint or caulk over mold [12]. Avoid fogging or spraying products as a substitute for cleaning, and avoid heavily scented cleaners and air fresheners.",
        ),
      ],
    },
    {
      heading: "Your cleaning and maintenance schedule",
      blocks: [
        {
          kind: "table",
          head: ["Frequency", "Tasks"],
          rows: [
            ["Daily", "Check bedroom hygrometer; wipe shower walls and run the bath fan; empty dehumidifier if not drained; keep kitchen and bathroom surfaces dry."],
            ["Twice weekly", "HEPA-vacuum carpets and rugs, especially the bedroom [11]. Damp-mop hard floors."],
            ["Weekly", "Wash all bedding [2]. Damp-dust all surfaces. HEPA-vacuum upholstered furniture and headboards. Wash family-room throw blankets, removable pillow covers, pet bedding and washable toys."],
            ["Monthly", "Inspect the HVAC filter and replace when loaded. Vacuum supply and return grilles. Clean the dehumidifier filter. Wipe window sills and tracks, and check for condensation or staining."],
            ["Every 3 months", "Replace the HVAC filter at minimum, sooner if loaded [4]. Replace or check portable air cleaner pre-filters. Wash curtains. Wipe blinds and ceiling fans thoroughly."],
            ["Every 6 to 12 months", "HVAC service including coil, drain pan and drain line; ACAAI suggests inspection every six months [4]. Deep clean or extract carpets. Check under sinks, around toilets, and at window and door frames for leaks."],
          ],
        },
      ],
    },
    {
      heading: "When to contact us",
      blocks: [
        ul(
          "Humidity stays above 55 percent despite the AC and a dehumidifier.",
          "Persistent or recurring musty odors, or condensation at windows, surfaces or HVAC supply registers.",
          "Any water intrusion, including leaks after rain or from plumbing.",
          "Visible mold growth. EPA recommends professional guidance when growth covers more than about 10 square feet or there has been significant water damage [13].",
          "Symptoms continue after these controls are in place. Contact us to discuss whether further building evaluation is appropriate.",
        ),
      ],
    },
    {
      heading: "A note on scope",
      blocks: [
        p("This plan is designed to reduce the ways a home can contribute to dust, moisture and mold exposure. It is not medical advice. Sensitivities differ from person to person, and an allergist can identify which specific allergens matter most for this household so the effort can be focused. These measures work best together: research has shown that single measures used alone can reduce allergen levels without a clear improvement in symptoms, while combined control of humidity, bedding, cleaning and filtration is the most effective approach [2]."),
      ],
    },
  ],
  references: [
    { n: 1, text: "EPA, Care for Your Air: A Guide to Indoor Air Quality.", url: "https://www.epa.gov/indoor-air-quality-iaq/care-your-air-guide-indoor-air-quality" },
    { n: 2, text: "AAAAI/ACAAI Practice Parameter, Environmental Assessment and Exposure Control of Dust Mites (2013).", url: "https://www.aaaai.org/Aaaai/media/Media-Library-PDFs/Allergist%20Resources/Statements%20and%20Practice%20Parameters/Dustmite-2013.pdf" },
    { n: 3, text: "AAAAI, Cleaning Tips for Allergy and Asthma Sufferers.", url: "https://www.aaaai.org/tools-for-the-public/conditions-library/allergies/cleaning-tips-for-allergy-and-asthma-sufferers" },
    { n: 4, text: "ACAAI, Dust Allergies.", url: "https://acaai.org/allergies/allergic-conditions/dust-allergies/" },
    { n: 5, text: "EPA, Guide to Air Cleaners in the Home.", url: "https://www.epa.gov/indoor-air-quality-iaq/guide-air-cleaners-home" },
    { n: 6, text: "EPA, Air Cleaners, HVAC Filters, and Coronavirus.", url: "https://www.epa.gov/indoor-air-quality-iaq/air-cleaners-hvac-filters-and-coronavirus-covid-19" },
    { n: 7, text: "EPA, Residential Air Cleaners (2nd Ed.) Summary.", url: "https://19january2017snapshot.epa.gov/indoor-air-quality-iaq/residential-air-cleaners-second-edition-summary-available-information_.html" },
    { n: 8, text: "Asthma and Allergy Foundation of America, Control Indoor Allergens.", url: "https://aafa.org/allergies/prevent-allergies/control-indoor-allergens/" },
    { n: 9, text: "Mayo Clinic, Dust Mite Allergy: Diagnosis and Treatment.", url: "https://www.mayoclinic.org/diseases-conditions/dust-mites/diagnosis-treatment/drc-20352178" },
    { n: 10, text: "Alberta Health, Controlling Dust, Dust Mites, and Other Allergens in Your Home.", url: "https://myhealth.alberta.ca/Health/pages/conditions.aspx?hwid=rt1233" },
    { n: 11, text: "Cleveland Clinic, Dust Mite Allergy.", url: "https://my.clevelandclinic.org/health/diseases/17712-dust-mite-allergy" },
    { n: 12, text: "EPA, What Are the Basic Mold Cleanup Steps?", url: "https://www.epa.gov/mold/what-are-basic-mold-cleanup-steps" },
    { n: 13, text: "EPA, Mold Cleanup in Your Home.", url: "https://www.epa.gov/mold/mold-cleanup-your-home" },
    { n: 14, text: "EPA, Mold Remediation Guide, Ch. 6 Checklist.", url: "https://www.epa.gov/mold/mold-remediation-schools-and-commercial-buildings-guide-chapter-6" },
    { n: 15, text: "ACAAI, Air Filters.", url: "https://acaai.org/allergies/management-treatment/living-with-allergies/air-filters/" },
    { n: 16, text: "Allergo Journal International, Avoidance Measures for Mite Allergy: An Update (2022).", url: "https://link.springer.com/article/10.1007/s40629-022-00242-5" },
  ],
};

// Starting point only. The benefits and care text from the original guide is held back for Cory's rewrite.
const PLANTS_GUIDE: Guide = {
  slug: "indoor-plants-and-a-dry-home",
  title: "Indoor plants and a dry, mold-free home",
  summary: "Enjoy houseplants without adding moisture where it causes trouble.",
  draft: true,
  sections: [
    {
      heading: "Plants are nice. Dry air is what protects your home.",
      blocks: [
        p("Houseplants bring color, calm and something to care for. They also bring wet soil, watering and humidity, and in a humid climate that matters. [DRAFT: Cory to write what plants do and do not do for air quality, based on current research.]"),
      ],
    },
    {
      heading: "Keeping plants without inviting mold",
      blocks: [
        ul(
          "Keep plants out of bedrooms, and away from anyone with mold or dust sensitivities.",
          "Water the soil, not the leaves. Skip misting.",
          "Empty any saucer within an hour so no water stands.",
          "Use pots with drainage holes and let the top of the soil dry between waterings.",
          "If you see white or gray growth on the soil, remove the plant from the room and repot it.",
          "Keep indoor humidity between 30 and 50 percent. If your plants need more than that to thrive, they are the wrong plants for your home.",
        ),
      ],
    },
    {
      heading: "Safe around pets and children?",
      blocks: [
        p("Many popular plants are toxic if eaten. Safety notes from the original guide:"),
        { kind: "table", head: ["Plant", "Safety"], rows: PLANTS.map((x) => [`${x.name} (${x.latin})`, x.safety]) },
        p("[DRAFT: benefits and care for each plant to be written with Cory.]"),
      ],
    },
  ],
};

export const GUIDES: Guide[] = [CONTROL_PLAN, PLANTS_GUIDE];
export const guideBySlug = (slug: string) => GUIDES.find((g) => g.slug === slug);
export const publicGuides = () => GUIDES.filter((g) => !g.draft);
