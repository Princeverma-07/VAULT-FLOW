import React from 'react';
import {
  Home,
  ShoppingCart,
  Utensils,
  Car,
  Zap,
  ShoppingBag,
  HeartPulse,
  Film,
  Plane,
  Briefcase,
  Laptop,
  TrendingUp,
  Gift,
  ShieldCheck,
  Wifi,
  Music,
  Dumbbell,
  Cloud,
  Coffee,
  HelpCircle,
  CreditCard,
  PiggyBank,
  Smartphone,
  BookOpen,
  DollarSign,
  LucideProps,
} from 'lucide-react';

const ICON_MAP: Record<string, React.FC<LucideProps>> = {
  Home,
  ShoppingCart,
  Utensils,
  Car,
  Zap,
  ShoppingBag,
  HeartPulse,
  Film,
  Plane,
  Briefcase,
  Laptop,
  TrendingUp,
  Gift,
  ShieldCheck,
  Wifi,
  Music,
  Dumbbell,
  Cloud,
  Coffee,
  HelpCircle,
  CreditCard,
  PiggyBank,
  Smartphone,
  BookOpen,
  DollarSign,
};

interface CategoryIconProps {
  iconName: string;
  color?: string;
  size?: number;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  iconName,
  color,
  size = 18,
  className = '',
}) => {
  const IconComponent = ICON_MAP[iconName] || HelpCircle;

  return (
    <div
      className={`inline-flex items-center justify-center rounded-xl p-2 shrink-0 ${className}`}
      style={{
        backgroundColor: color ? `${color}18` : 'rgba(100, 116, 139, 0.1)',
        color: color || '#64748b',
      }}
    >
      <IconComponent size={size} strokeWidth={2.2} />
    </div>
  );
};
