import { X, Lock } from 'lucide-react';

type Item = {
  key: string;
  label: string;
  value: string | string[];
  locked?: boolean;
  onRemove?: () => void;
};

type ColorVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger';

type SizeVariant = 'sm' | 'md' | 'lg';

export default function Chip({
  item,
  color = 'default',
  size = 'sm',
}: {
  item: Item;
  color?: ColorVariant;
  size?: SizeVariant;
}) {
  const getColorClasses = (color: ColorVariant, locked: boolean) => {
    if (locked) {
      return 'bg-neutral-200 text-neutral-700';
    }

    switch (color) {
      case 'primary':
        return 'bg-primary-50 text-primary-800 border border-primary-200 hover:bg-primary-100';
      case 'secondary':
        return 'bg-gray-50 text-gray-800 border border-gray-200 hover:bg-gray-100';
      case 'success':
        return 'bg-green-50 text-green-800 border border-green-200 hover:bg-green-100';
      case 'warning':
        return 'bg-yellow-50 text-yellow-800 border border-yellow-200 hover:bg-yellow-100';
      case 'danger':
        return 'bg-red-50 text-red-800 border border-red-200 hover:bg-red-100';
      case 'default':
      default:
        return 'bg-violet-50 text-violet-800 border border-violet-200 hover:bg-violet-100';
    }
  };

  const getHoverColor = (color: ColorVariant) => {
    switch (color) {
      case 'primary':
        return 'hover:bg-primary-200';
      case 'secondary':
        return 'hover:bg-gray-200';
      case 'success':
        return 'hover:bg-green-200';
      case 'warning':
        return 'hover:bg-yellow-200';
      case 'danger':
        return 'hover:bg-red-200';
      case 'default':
      default:
        return 'hover:bg-violet-200';
    }
  };

  const getSizeClasses = (size: SizeVariant) => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1 text-xs';
      case 'md':
        return 'px-4 py-1.5 text-sm';
      case 'lg':
        return 'px-5 py-2 text-base';
      default:
        return 'px-3 py-1 text-xs';
    }
  };

  const base = getColorClasses(color, item.locked || false);
  const sizeClasses = getSizeClasses(size);

  if (item.key === 'indistinto' || item.key === 'sin-limite') return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full ${sizeClasses} ${base}`}
    >
      {item.label === 'Evitar'
        ? `${item.label}: ${item.value}`
        : `${item.label}: ${item.value}`}
      {item.locked ? (
        <Lock size={14} className="opacity-60" />
      ) : item.onRemove ? (
        <button
          type="button"
          aria-label={`Quitar ${item.label}`}
          onClick={item.onRemove}
          className={`ml-1 -mr-1 rounded p-0.5 ${getHoverColor(color)}`}
        >
          <X size={14} />
        </button>
      ) : null}
    </span>
  );
}
