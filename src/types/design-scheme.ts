export interface DesignScheme {
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
  };
  features: Array<
    | "rounded"
    | "sharp"
    | "gradient"
    | "shadow"
    | "glassmorphism"
    | "border"
    | "minimal"
    | "bold"
  >;
  fonts: {
    heading: string;
    body: string;
  };
  mood: string;
}
