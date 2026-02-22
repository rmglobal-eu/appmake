import type { DesignScheme } from "@/types/design-scheme";

// ─── Pre-defined Palettes ─────────────────────────────────────────

const PRESETS: Record<string, DesignScheme> = {
  "tech-blue": {
    palette: {
      primary: "#3B82F6",
      secondary: "#6366F1",
      accent: "#06B6D4",
      background: "#0F172A",
      surface: "#1E293B",
      text: "#F8FAFC",
      textMuted: "#94A3B8",
      border: "#334155",
    },
    features: ["rounded", "gradient", "shadow", "glassmorphism"],
    fonts: { heading: "Space Grotesk", body: "Inter" },
    gradients: {
      hero: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)",
      surface: "linear-gradient(180deg, rgba(59,130,246,0.05) 0%, transparent 100%)",
      accent: "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
    },
    mood: "tech",
  },
  "warm-orange": {
    palette: {
      primary: "#F97316",
      secondary: "#EF4444",
      accent: "#FBBF24",
      background: "#FFFBEB",
      surface: "#FFFFFF",
      text: "#1C1917",
      textMuted: "#78716C",
      border: "#E7E5E4",
    },
    features: ["rounded", "shadow", "bold"],
    fonts: { heading: "Playfair Display", body: "DM Sans" },
    gradients: {
      hero: "linear-gradient(135deg, #FFFBEB 0%, #FFF7ED 50%, #FFFBEB 100%)",
      surface: "linear-gradient(180deg, rgba(249,115,22,0.06) 0%, transparent 100%)",
      accent: "linear-gradient(135deg, #F97316 0%, #EF4444 100%)",
    },
    mood: "warm",
  },
  "luxury-gold": {
    palette: {
      primary: "#D4AF37",
      secondary: "#B8860B",
      accent: "#FFD700",
      background: "#0A0A0A",
      surface: "#1A1A1A",
      text: "#FAFAFA",
      textMuted: "#A3A3A3",
      border: "#2A2A2A",
    },
    features: ["sharp", "border", "gradient"],
    fonts: { heading: "Playfair Display", body: "Inter" },
    gradients: {
      hero: "linear-gradient(160deg, #0A0A0A 0%, #1A1A1A 40%, #0A0A0A 100%)",
      surface: "linear-gradient(180deg, rgba(212,175,55,0.04) 0%, transparent 100%)",
      accent: "linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)",
    },
    mood: "luxury",
  },
  "nature-green": {
    palette: {
      primary: "#16A34A",
      secondary: "#15803D",
      accent: "#84CC16",
      background: "#F0FDF4",
      surface: "#FFFFFF",
      text: "#14532D",
      textMuted: "#6B7280",
      border: "#D1D5DB",
    },
    features: ["rounded", "shadow", "minimal"],
    fonts: { heading: "Lora", body: "Inter" },
    gradients: {
      hero: "linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 50%, #F0FDF4 100%)",
      surface: "linear-gradient(180deg, rgba(22,163,74,0.04) 0%, transparent 100%)",
      accent: "linear-gradient(135deg, #16A34A 0%, #84CC16 100%)",
    },
    mood: "natural",
  },
  "modern-purple": {
    palette: {
      primary: "#8B5CF6",
      secondary: "#A78BFA",
      accent: "#EC4899",
      background: "#FAFAFA",
      surface: "#FFFFFF",
      text: "#18181B",
      textMuted: "#71717A",
      border: "#E4E4E7",
    },
    features: ["rounded", "gradient", "shadow", "glassmorphism"],
    fonts: { heading: "Outfit", body: "Inter" },
    gradients: {
      hero: "linear-gradient(135deg, #FAFAFA 0%, #F5F3FF 50%, #FAFAFA 100%)",
      surface: "linear-gradient(180deg, rgba(139,92,246,0.04) 0%, transparent 100%)",
      accent: "linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)",
    },
    mood: "modern",
  },
  "ocean-teal": {
    palette: {
      primary: "#0D9488",
      secondary: "#0E7490",
      accent: "#F59E0B",
      background: "#F0FDFA",
      surface: "#FFFFFF",
      text: "#134E4A",
      textMuted: "#6B7280",
      border: "#D1D5DB",
    },
    features: ["rounded", "shadow", "minimal"],
    fonts: { heading: "Space Grotesk", body: "DM Sans" },
    gradients: {
      hero: "linear-gradient(135deg, #F0FDFA 0%, #ECFEFF 50%, #F0FDFA 100%)",
      surface: "linear-gradient(180deg, rgba(13,148,136,0.04) 0%, transparent 100%)",
      accent: "linear-gradient(135deg, #0D9488 0%, #0E7490 100%)",
    },
    mood: "calm",
  },
  "dark-minimal": {
    palette: {
      primary: "#FFFFFF",
      secondary: "#A1A1AA",
      accent: "#F43F5E",
      background: "#09090B",
      surface: "#18181B",
      text: "#FAFAFA",
      textMuted: "#71717A",
      border: "#27272A",
    },
    features: ["sharp", "border", "minimal"],
    fonts: { heading: "Geist", body: "Geist" },
    gradients: {
      hero: "linear-gradient(160deg, #09090B 0%, #18181B 40%, #09090B 100%)",
      surface: "linear-gradient(180deg, rgba(244,63,94,0.03) 0%, transparent 100%)",
      accent: "linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)",
    },
    mood: "minimal",
  },
  "startup-coral": {
    palette: {
      primary: "#FF6B6B",
      secondary: "#FFA07A",
      accent: "#4ECDC4",
      background: "#FFFFFF",
      surface: "#F8F9FA",
      text: "#2D3436",
      textMuted: "#636E72",
      border: "#DFE6E9",
    },
    features: ["rounded", "shadow", "bold", "gradient"],
    fonts: { heading: "Plus Jakarta Sans", body: "Inter" },
    gradients: {
      hero: "linear-gradient(135deg, #FFFFFF 0%, #FFF5F5 50%, #FFFFFF 100%)",
      surface: "linear-gradient(180deg, rgba(255,107,107,0.04) 0%, transparent 100%)",
      accent: "linear-gradient(135deg, #FF6B6B 0%, #FFA07A 100%)",
    },
    mood: "playful",
  },
  "corporate-slate": {
    palette: {
      primary: "#1E40AF",
      secondary: "#3B82F6",
      accent: "#10B981",
      background: "#FFFFFF",
      surface: "#F8FAFC",
      text: "#0F172A",
      textMuted: "#64748B",
      border: "#E2E8F0",
    },
    features: ["rounded", "shadow", "border"],
    fonts: { heading: "Sora", body: "Inter" },
    gradients: {
      hero: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 50%, #FFFFFF 100%)",
      surface: "linear-gradient(180deg, rgba(30,64,175,0.03) 0%, transparent 100%)",
      accent: "linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)",
    },
    mood: "professional",
  },
  "creative-pink": {
    palette: {
      primary: "#EC4899",
      secondary: "#F472B6",
      accent: "#8B5CF6",
      background: "#FDF2F8",
      surface: "#FFFFFF",
      text: "#1F2937",
      textMuted: "#6B7280",
      border: "#E5E7EB",
    },
    features: ["rounded", "gradient", "bold"],
    fonts: { heading: "Outfit", body: "DM Sans" },
    gradients: {
      hero: "linear-gradient(135deg, #FDF2F8 0%, #FAE8FF 50%, #FDF2F8 100%)",
      surface: "linear-gradient(180deg, rgba(236,72,153,0.04) 0%, transparent 100%)",
      accent: "linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)",
    },
    mood: "creative",
  },
};

// ─── Keyword → Preset Mapping ─────────────────────────────────────

const KEYWORD_MAP: Array<{ keywords: RegExp; preset: string }> = [
  { keywords: /\b(coffee|café|cafe|bakery|restaurant|food|warm|cozy|rustic)\b/i, preset: "warm-orange" },
  { keywords: /\b(luxury|premium|gold|elegant|high.?end|boutique|jewel|fashion)\b/i, preset: "luxury-gold" },
  { keywords: /\b(tech|startup|saas|ai|software|app|dashboard|data|analytics)\b/i, preset: "tech-blue" },
  { keywords: /\b(nature|green|eco|organic|sustain|plant|garden|health|wellness)\b/i, preset: "nature-green" },
  { keywords: /\b(creative|design|art|portfolio|agency|studio|brand)\b/i, preset: "creative-pink" },
  { keywords: /\b(modern|clean|minimal|simple|sleek)\b/i, preset: "modern-purple" },
  { keywords: /\b(ocean|sea|travel|calm|relax|spa|yoga|meditation)\b/i, preset: "ocean-teal" },
  { keywords: /\b(dark|night|gaming|music|entertainment|movie|stream)\b/i, preset: "dark-minimal" },
  { keywords: /\b(corporate|business|finance|banking|insurance|consult)\b/i, preset: "corporate-slate" },
  { keywords: /\b(fun|playful|kids|education|learn|school|toy)\b/i, preset: "startup-coral" },
];

// ─── Generator ────────────────────────────────────────────────────

export function generateDesignScheme(
  prompt: string,
  interviewAnswers?: Record<string, string>
): DesignScheme {
  // 1. Check interview answers for style preference
  if (interviewAnswers) {
    const styleAnswer = interviewAnswers["q1"] ?? interviewAnswers["style"];
    if (styleAnswer) {
      const styleMap: Record<string, string> = {
        modern: "modern-purple",
        bold: "startup-coral",
        elegant: "luxury-gold",
        playful: "creative-pink",
        minimal: "dark-minimal",
        professional: "corporate-slate",
        warm: "warm-orange",
        tech: "tech-blue",
      };
      const preset = styleMap[styleAnswer];
      if (preset && PRESETS[preset]) {
        return { ...PRESETS[preset] };
      }
    }
  }

  // 2. Match keywords in prompt
  for (const { keywords, preset } of KEYWORD_MAP) {
    if (keywords.test(prompt)) {
      return { ...PRESETS[preset] };
    }
  }

  // 3. Random selection from a curated subset for variety
  const variedPresets = [
    "tech-blue",
    "modern-purple",
    "ocean-teal",
    "startup-coral",
    "corporate-slate",
    "creative-pink",
  ];
  const randomIndex = Math.floor(Math.random() * variedPresets.length);
  const key = variedPresets[randomIndex];
  return { ...PRESETS[key] };
}

export { PRESETS as DESIGN_PRESETS };
