// The group classes on the gym's weekly timetable (from the owner's own
// timetable image), offered as suggestions when adding a class, with the
// colour each one is drawn in on the generated timetable image.
export const CLASS_COLORS: [RegExp, string][] = [
  [/yoga/i, "#1BA6A8"],
  [/muscle|pump/i, "#F26A21"],
  [/boxing/i, "#111111"],
  [/zumba/i, "#2EAD4B"],
  [/dance/i, "#D6336C"],
  [/hyrox/i, "#111111"],
  [/cardio/i, "#8B1A1A"],
  [/circuit/i, "#1B2A6B"],
  [/functional/i, "#B5651D"],
  [/core/i, "#111111"],
];

export const CLASS_NAMES = [
  "Yoga",
  "Power Flow Yoga",
  "Muscle Pump",
  "Functional Training",
  "Circuit Training",
  "Max Cardio",
  "Hyrox S365",
  "Boxing S365",
  "Aero Boxing",
  "Core AB",
  "Dance Variety",
  "90 Dance",
  "Easy Dance",
  "Zumba",
];

export function classColor(name: string): string {
  return CLASS_COLORS.find(([pattern]) => pattern.test(name))?.[1] ?? "#222222";
}
