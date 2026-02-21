/**
 * Maps CSS property values to Tailwind CSS classes.
 * Handles standard Tailwind values + arbitrary value fallbacks.
 */

const FONT_SIZE_MAP: Record<string, string> = {
  "12px": "text-xs",
  "14px": "text-sm",
  "16px": "text-base",
  "18px": "text-lg",
  "20px": "text-xl",
  "24px": "text-2xl",
  "30px": "text-3xl",
  "36px": "text-4xl",
  "48px": "text-5xl",
  "60px": "text-6xl",
  "72px": "text-7xl",
  "96px": "text-8xl",
  "128px": "text-9xl",
};

const FONT_WEIGHT_MAP: Record<string, string> = {
  "100": "font-thin",
  "200": "font-extralight",
  "300": "font-light",
  "400": "font-normal",
  "500": "font-medium",
  "600": "font-semibold",
  "700": "font-bold",
  "800": "font-extrabold",
  "900": "font-black",
};

const SPACING_MAP: Record<string, string> = {
  "0px": "0",
  "1px": "px",
  "2px": "0.5",
  "4px": "1",
  "6px": "1.5",
  "8px": "2",
  "10px": "2.5",
  "12px": "3",
  "14px": "3.5",
  "16px": "4",
  "20px": "5",
  "24px": "6",
  "28px": "7",
  "32px": "8",
  "36px": "9",
  "40px": "10",
  "44px": "11",
  "48px": "12",
  "56px": "14",
  "64px": "16",
  "80px": "20",
  "96px": "24",
  "112px": "28",
  "128px": "32",
  "144px": "36",
  "160px": "40",
  "176px": "44",
  "192px": "48",
  "208px": "52",
  "224px": "56",
  "240px": "60",
  "256px": "64",
  "288px": "72",
  "320px": "80",
  "384px": "96",
};

const BORDER_RADIUS_MAP: Record<string, string> = {
  "0px": "rounded-none",
  "2px": "rounded-sm",
  "4px": "rounded",
  "6px": "rounded-md",
  "8px": "rounded-lg",
  "12px": "rounded-xl",
  "16px": "rounded-2xl",
  "24px": "rounded-3xl",
  "9999px": "rounded-full",
};

const TEXT_ALIGN_MAP: Record<string, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
  justify: "text-justify",
};

/** Prefix groups: when adding a class, remove conflicting classes with same prefix */
const PREFIX_GROUPS = [
  /^text-(xs|sm|base|lg|xl|[2-9]xl|\[.*?\])$/,
  /^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/,
  /^text-(left|center|right|justify)$/,
  /^rounded(-none|-sm|-md|-lg|-xl|-2xl|-3xl|-full|\[.*?\])?$/,
  /^p[trbl]?-/,
  /^m[trbl]?-/,
  /^text-\[?#/,
  /^bg-\[?#/,
  /^leading-/,
  /^tracking-/,
];

/**
 * Convert a hex color (#rrggbb) to a Tailwind class.
 * Uses standard Tailwind colors when possible, otherwise arbitrary.
 */
function colorToTailwind(hex: string, prefix: "text" | "bg"): string {
  return `${prefix}-[${hex}]`;
}

/**
 * Convert a CSS property+value to a Tailwind class.
 * Returns null if the property isn't supported.
 */
export function cssToTailwind(
  property: string,
  value: string
): string | null {
  if (!value || value === "normal" || value === "none") return null;

  switch (property) {
    case "color":
      return colorToTailwind(value, "text");
    case "backgroundColor":
      return colorToTailwind(value, "bg");
    case "fontSize":
      return FONT_SIZE_MAP[value] ?? `text-[${value}]`;
    case "fontWeight":
      return FONT_WEIGHT_MAP[value] ?? `font-[${value}]`;
    case "textAlign":
      return TEXT_ALIGN_MAP[value] ?? null;
    case "borderRadius":
      return BORDER_RADIUS_MAP[value] ?? `rounded-[${value}]`;
    case "lineHeight":
      return `leading-[${value}]`;
    case "letterSpacing":
      return `tracking-[${value}]`;
    case "paddingTop":
      return `pt-${SPACING_MAP[value] ?? `[${value}]`}`;
    case "paddingRight":
      return `pr-${SPACING_MAP[value] ?? `[${value}]`}`;
    case "paddingBottom":
      return `pb-${SPACING_MAP[value] ?? `[${value}]`}`;
    case "paddingLeft":
      return `pl-${SPACING_MAP[value] ?? `[${value}]`}`;
    case "marginTop":
      return `mt-${SPACING_MAP[value] ?? `[${value}]`}`;
    case "marginRight":
      return `mr-${SPACING_MAP[value] ?? `[${value}]`}`;
    case "marginBottom":
      return `mb-${SPACING_MAP[value] ?? `[${value}]`}`;
    case "marginLeft":
      return `ml-${SPACING_MAP[value] ?? `[${value}]`}`;
    default:
      return null;
  }
}

/**
 * Remove conflicting Tailwind classes when adding new ones.
 * e.g., adding "text-xl" should remove existing "text-lg".
 */
export function removeConflictingClasses(
  existingClasses: string[],
  newClass: string
): string[] {
  const conflictGroup = PREFIX_GROUPS.find((re) => re.test(newClass));
  if (!conflictGroup) return existingClasses;

  return existingClasses.filter((cls) => !conflictGroup.test(cls));
}

/**
 * Merge new Tailwind classes into an existing className string.
 * Handles deduplication and conflict resolution.
 */
export function mergeClassNames(
  existingClassName: string,
  newClasses: string[]
): string {
  let classes = existingClassName
    .split(/\s+/)
    .filter((c) => c.length > 0);

  for (const newClass of newClasses) {
    classes = removeConflictingClasses(classes, newClass);
    classes.push(newClass);
  }

  return classes.join(" ");
}
