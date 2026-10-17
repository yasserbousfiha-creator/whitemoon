import { Award, Sparkles, Smile, Flower2, Toothbrush, Droplet, Zap, Venus, Baby, Stethoscope, LucideIcon } from "lucide-react";

export const badgeIconMap: Record<string, LucideIcon> = {
  award: Award,
  sparkle: Sparkles,
  smile: Smile,
  spa: Flower2,
};

export const serviceIconMap: Record<string, LucideIcon> = {
  dentistry: Toothbrush,
  derma: Droplet,
  laser: Zap,
  gynecology: Venus,
  pediatrics: Baby,
  general: Stethoscope,
};
