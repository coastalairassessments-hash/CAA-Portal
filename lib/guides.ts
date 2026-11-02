// The Resources guides. Each is plain data, so editing a guide means editing text here.
// draft: true keeps a guide hidden from the public. Only a signed-in admin can open it until it is released.
import { PLANTS } from "./plantsData";
import { PLAN_DRAFT, PLAN_SLUG, PLAN_SUMMARY, PLAN_TITLE } from "./controlPlan";

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

export const GUIDES: Guide[] = [PLANTS_GUIDE];
export const guideBySlug = (slug: string) => GUIDES.find((g) => g.slug === slug);
export const publicGuides = () => GUIDES.filter((g) => !g.draft);

// Everything the public can open from Resources: single guides plus the 11-part plan once it is released.
export const publicResources = (): { href: string; title: string; summary: string }[] => [
  ...(PLAN_DRAFT ? [] : [{ href: `/resources/${PLAN_SLUG}`, title: PLAN_TITLE, summary: PLAN_SUMMARY }]),
  ...publicGuides().map((g) => ({ href: `/resources/${g.slug}`, title: g.title, summary: g.summary })),
];
