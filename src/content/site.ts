// Fixed parts of the public website. Everything the owner can edit from the
// back office (texts, contact details, opening hours) lives in site-texts.ts;
// interface wording in both languages lives in ui-strings.ts.
export const SITE_NAME = "S365 Fitness";

// Sections of the home page linked from the header. (Community has no header link, to leave room for Clips and Tools.)
export const navAnchors = ["gym", "trainers", "results", "location", "contact"] as const;
