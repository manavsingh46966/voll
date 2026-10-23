/**
 * A static grouped collection of common time zones categorized by geographical region.
 * * Each region contains a label and a shortcode identifier (e.g. "CET", "IST").
 * Used to populate selectors/sheets during event timezone setup.
 */
export const ZONES = [
  {
    region: "Europe",
    items: [
      { label: "Central European Time", code: "CET" },
      { label: "Eastern European Time", code: "EET" },
      { label: "Western European Time", code: "WET" },
    ],
  },
  {
    region: "Asia",
    items: [
      { label: "Iran Standard Time", code: "IRST" },
      { label: "Indian Standard Time", code: "IST" },
      { label: "Japan Standard Time", code: "JST" },
    ],
  },
  {
    region: "Pacific",
    items: [
      { label: "Pacific Time", code: "PT" },
      { label: "Australian Eastern Time", code: "AET" },
    ],
  },
];
