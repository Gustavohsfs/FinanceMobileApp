/**
 * Wrapper de ícones lucide. Mapa curado (kebab-case → componente) para evitar
 * importar a biblioteca inteira. Cor/tamanho vêm por prop (className não pinta
 * SVG nativo). Todo ícone acionável recebe accessibilityLabel no chamador.
 */
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Banknote,
  Bus,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Ellipsis,
  Fingerprint,
  GraduationCap,
  Heart,
  HeartPulse,
  House,
  Laptop,
  LogOut,
  Menu,
  MoreVertical,
  PartyPopper,
  Pencil,
  Plus,
  Repeat,
  Settings,
  ShoppingCart,
  Smartphone,
  Tags,
  Target,
  TrendingUp,
  Trash2,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react-native";
import { colors } from "@core/theme";

const REGISTRY: Record<string, LucideIcon> = {
  "arrow-down-left": ArrowDownLeft,
  "arrow-left-right": ArrowLeftRight,
  "arrow-up-right": ArrowUpRight,
  banknote: Banknote,
  bus: Bus,
  calendar: Calendar,
  check: Check,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  "credit-card": CreditCard,
  ellipsis: Ellipsis,
  fingerprint: Fingerprint,
  "graduation-cap": GraduationCap,
  heart: Heart,
  "heart-pulse": HeartPulse,
  house: House,
  laptop: Laptop,
  "log-out": LogOut,
  menu: Menu,
  "more-vertical": MoreVertical,
  "party-popper": PartyPopper,
  pencil: Pencil,
  plus: Plus,
  repeat: Repeat,
  settings: Settings,
  "shopping-cart": ShoppingCart,
  smartphone: Smartphone,
  tags: Tags,
  target: Target,
  "trending-up": TrendingUp,
  trash: Trash2,
  wallet: Wallet,
  x: X,
};

export type IconName = keyof typeof REGISTRY | string;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({
  name,
  size = 22,
  color = colors.bone,
  strokeWidth = 2,
}: IconProps) {
  const Cmp = REGISTRY[name] ?? Ellipsis;
  return <Cmp size={size} color={color} strokeWidth={strokeWidth} />;
}

export function hasIcon(name: string): boolean {
  return name in REGISTRY;
}

export const ICON_NAMES = Object.keys(REGISTRY);
