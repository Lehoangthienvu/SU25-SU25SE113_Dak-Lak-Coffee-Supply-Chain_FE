import React from 'react';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FilterBadgeProps {
  label: string;
  value: string;
  onRemove: () => void;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export default function FilterBadge({ 
  label, 
  value, 
  onRemove, 
  variant = 'secondary' 
}: FilterBadgeProps) {
  const { t } = useTranslation();

  return (
    <Badge variant={variant} className="flex items-center gap-1 px-2 py-1 text-xs">
      <span className="font-medium">{label}:</span>
      <span>{value}</span>
      <button
        onClick={onRemove}
        className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
        aria-label={t('filterBadge.removeFilter')}
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
}
