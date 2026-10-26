// The Mold Assessment and Sampling Terms, exactly as clients agree to them.
// DO NOT edit this text in place. A change means a new version: add TERMS_V2, bump
// TERMS_VERSION, and update the fingerprint in terms.test.ts. Old agreements stay tied
// to the version the client actually saw.
export const TERMS_VERSION = "v1-2026-10";
export const TERMS_TITLE = "Mold Assessment and Sampling Terms";

export type Block =
  | { kind: "p"; text: string }
  | { kind: "caps"; lead: string; text?: string }
  | { kind: "ul"; items: string[] };
export type Section = { n: number; title: string; blocks: Block[] };

export const TERMS_PREAMBLE: string[] = [
  "These Mold Assessment and Sampling Terms (the 'Terms') are incorporated into and form part of the Estimate/Quote issued by Coastal Air Assessments (the 'Consultant') for mold assessment and related services at the property address shown on the Estimate/Quote (the 'Property'). By signing the Estimate/Quote (including by electronic signature), by checking the agreement box on Consultant's online request form, or by proceeding with the services after receiving these Terms, the undersigned client ('Client') acknowledges that Client received these Terms before signing, had the opportunity to review them, and agrees to be bound by them. If Client signs on behalf of an owner, tenant, or other entity, Client represents that Client has authority to bind that party to these Terms.",
  "The 'Estimate/Quote' means the written price and description of services provided to Client by Consultant, including through Consultant's online request form, confirmation email, or invoice.",
];

export const TERMS_SECTIONS: Section[] = [
  {
    n: 1,
    title: "Purpose",
    blocks: [
      {
        kind: "p",
        text: "The purpose of the mold assessment is to identify visible mold growth and/or moisture-related conditions that may support fungal growth and, when requested/authorized, to collect samples for laboratory analysis to help inform next steps, which may include remediation planning.",
      },
    ],
  },
  {
    n: 2,
    title: "Scope of Services",
    blocks: [
      {
        kind: "p",
        text: "Unless the Estimate/Quote states otherwise, the services may include the following, performed in readily accessible areas only:",
      },
      {
        kind: "ul",
        items: [
          "Visual assessment for visible mold and moisture indicators (for example: staining, musty odors, elevated moisture readings, and evidence of water intrusion).",
          "Non-destructive moisture screening using industry-standard instruments (as applicable).",
          "Sampling, when included or later authorized, which may include air, surface (tape lift/swab), bulk, dust/carpet, and/or wall cavity sampling.",
          "Coordination with an independent environmental laboratory for analysis of collected samples.",
          "Preparation of a written report summarizing observed conditions, sample locations (if any), lab results (if any), and general recommendations.",
        ],
      },
    ],
  },
  {
    n: 3,
    title: "Authorization, Property Access, and Documentation",
    blocks: [
      {
        kind: "p",
        text: "Client authorizes Consultant to enter the Property at the scheduled time(s) to perform the services described in the Estimate/Quote, including use of standard inspection and sampling tools. Client authorizes Consultant to take photographs, notes, and related documentation reasonably necessary to support the findings and report. Client represents and warrants that Client is the owner of the Property or is otherwise authorized by the owner to grant access and authorize the services.",
      },
    ],
  },
  {
    n: 4,
    title: "Limitations, Exclusions, and No Warranty",
    blocks: [
      {
        kind: "caps",
        lead: "THIS IS A LIMITED, NON-DESTRUCTIVE ASSESSMENT AND IS NOT A GUARANTEE OR WARRANTY THAT MOLD IS OR IS NOT PRESENT.",
        text: " Results reflect conditions and samples from the specific areas assessed and/or sampled at the time of service. Mold conditions can change rapidly due to moisture, ventilation, occupancy, cleaning, and construction activities.",
      },
      {
        kind: "p",
        text: "Unless specifically authorized in writing, Consultant will not open walls, remove finishes, move heavy furniture, or perform demolition. Inaccessible or concealed areas (inside wall cavities, under floor coverings, behind built-ins, inside HVAC ductwork, etc.) may contain mold and may not be evaluated.",
      },
      {
        kind: "p",
        text: "There are no broadly accepted health-based exposure limits (TLVs) for most indoor bioaerosols; interpretations are based on professional judgment and widely used guidance.",
      },
    ],
  },
  {
    n: 5,
    title: "Sampling and Laboratory Analysis",
    blocks: [
      {
        kind: "p",
        text: "If sampling is included in the Estimate/Quote or later authorized by Client, samples will be collected using reasonable professional care and submitted under chain-of-custody to an independent, appropriately accredited laboratory (for example, an EMPAT/EMLAP-accredited lab or equivalent). Laboratory turnaround times vary and are not controlled by consultant.",
      },
      {
        kind: "p",
        text: "Client acknowledges that laboratory results depend on sampling strategy, environmental conditions, and inherent analytical limitations. Consultant does not manufacture laboratory reagents or instruments and does not guarantee laboratory outcomes.",
      },
    ],
  },
  {
    n: 6,
    title: "Additional Sampling / Change Orders",
    blocks: [
      {
        kind: "p",
        text: "If conditions observed during the assessment suggest that additional sampling would materially improve the usefulness of the results, Consultant may recommend additional samples. Additional sampling is not included unless listed on the Estimate/Quote or later authorized by Client in writing (including by email or text message).",
      },
    ],
  },
  {
    n: 7,
    title: "Client Responsibilities and Safety / Stop-Work",
    blocks: [
      {
        kind: "p",
        text: "Client agrees to provide safe, timely access to the Property and to disclose known or suspected hazards that could affect the assessment.",
      },
      {
        kind: "ul",
        items: [
          "Provide access to all areas requested for the assessment and maintain utilities needed for normal building operation (as applicable).",
          "Secure pets, ensure the work area is safe, and disclose known safety hazards (for example: electrical hazards, structural concerns, aggressive animals, or unsanitary conditions).",
          "Disclose known or suspected regulated materials (for example: asbestos-containing materials, lead-based paint) before any intrusive activities are requested.",
          "Do not perform remediation, cleaning, or major disturbance of the assessed areas before Consultant completes the assessment/sampling unless necessary for safety.",
        ],
      },
      {
        kind: "p",
        text: "If Consultant encounters unsafe conditions, denied access, hostility, or undisclosed hazards, Consultant may stop work. Client remains responsible for any fees incurred and any applicable trip/standby charges shown on the Estimate/Quote or otherwise permitted by law.",
      },
    ],
  },
  {
    n: 8,
    title: "Report Use, Insurance, and Third-Party Reliance",
    blocks: [
      {
        kind: "p",
        text: "The report is prepared solely for Client's use. Client may provide the report to Client's insurer, adjusters, and claim representatives solely for evaluating an insurance claim related to the Property. Except as stated in this section, no other third party may rely on the report without Consultant's prior written consent.",
      },
      {
        kind: "caps",
        lead: "NO THIRD PARTY (INCLUDING AN INSURER) IS AN INTENDED BENEFICIARY OF THESE TERMS OR THE REPORT.",
        text: " Consultant assumes no duty or liability to third parties who obtain the report. If a third party requires reliance, Consultant may offer a separate written reliance letter and/or engagement, at Consultant's discretion.",
      },
    ],
  },
  {
    n: 9,
    title: "Health and Medical Disclaimer",
    blocks: [
      {
        kind: "p",
        text: "Consultant does not provide medical advice and does not diagnose health conditions. If Client or occupants have health concerns, they should consult a qualified healthcare professional. If conditions are observed that may pose an immediate safety or health concern, Consultant may recommend prompt corrective action and may notify appropriate parties as needed to protect occupants.",
      },
    ],
  },
  {
    n: 10,
    title: "Fees, Payment, and Collections",
    blocks: [
      {
        kind: "p",
        text: "Client agrees to pay the fees shown on the Estimate/Quote and any authorized change orders. Laboratory fees, if applicable, are included only if expressly listed on the Estimate/Quote. Unpaid balances may delay delivery of the report to the extent permitted by law.",
      },
      {
        kind: "p",
        text: "Past-due amounts may accrue a late charge at the lesser of 1.5% per month or the maximum rate permitted by applicable law. Client agrees to pay reasonable costs of collection, including attorney's fees and court costs where permitted by law.",
      },
    ],
  },
  {
    n: 11,
    title: "Notice of Claims and Opportunity to Re-Inspect",
    blocks: [
      {
        kind: "p",
        text: "Any claim or complaint arising out of or related to the services must be reported to Consultant in writing within ten (10) business days of discovery. Unless there is an emergency condition, Client agrees to allow Consultant a reasonable opportunity to re-inspect and investigate before repairs, removal, replacement, or alteration of the condition at issue. Failure to provide timely notice and an opportunity to investigate may bar the claim to the extent permitted by law.",
      },
    ],
  },
  {
    n: 12,
    title: "Limitation of Liability",
    blocks: [
      {
        kind: "caps",
        lead: "CONSULTANT AND THE LABORATORY ARE NOT INSURERS AND DO NOT GUARANTEE THE CONDITION OF THE PROPERTY.",
        text: " To the fullest extent permitted by law, Consultant's total cumulative liability for any and all claims (including contract, negligence, or other theories) arising out of the services or report is limited to the amount actually paid by Client to Consultant for the services described on the applicable Estimate/Quote.",
      },
      {
        kind: "caps",
        lead: "IN NO EVENT SHALL CONSULTANT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES",
        text: " (including loss of use, loss of profits, relocation costs, or diminution in value), even if advised of the possibility of such damages, to the extent permitted by law.",
      },
      {
        kind: "p",
        text: "Nothing in these Terms is intended to limit liability that cannot be limited under applicable law (for example, liability for gross negligence or willful misconduct where such limitation is prohibited).",
      },
    ],
  },
  {
    n: 13,
    title: "Dispute Resolution; Governing Law; Venue; Attorneys' Fees; Severability",
    blocks: [
      {
        kind: "p",
        text: "Before filing a lawsuit (except for injunctive relief or collection of undisputed amounts), the parties agree to attempt to resolve disputes in good faith, including through non-binding mediation upon written request by either party.",
      },
      {
        kind: "p",
        text: "These Terms are governed by the laws of the State of Florida, without regard to conflict-of-laws principles. Any legal action arising from these Terms or the services shall be brought in a court of competent jurisdiction in the county where the Property is located, unless otherwise required by law.",
      },
      {
        kind: "p",
        text: "To the extent permitted by law, the prevailing party in any action to enforce these Terms is entitled to recover reasonable attorneys' fees and costs. If any provision is found unenforceable, the remaining provisions shall remain in full force and effect.",
      },
    ],
  },
  {
    n: 14,
    title: "Entire Agreement; Electronic Signatures",
    blocks: [
      {
        kind: "p",
        text: "These Terms, together with the Estimate/Quote (and any written change orders), constitute the entire agreement between Client and Consultant for the described services and supersede prior discussions on the same subject. Electronic signatures and electronic records shall be treated as originals and shall be fully binding permitted by law.",
      },
      {
        kind: "caps",
        lead: "NOTICE:",
        text: " This document is intended to be attached to and incorporated into an Estimate/Quote. It is not a remediation contract.",
      },
    ],
  },
];
