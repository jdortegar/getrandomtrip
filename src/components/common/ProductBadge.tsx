import { Badge } from "@/components/ui/Badge";
import { formatProductLabel } from "@/lib/helpers/formatProductLabel";

interface ProductBadgeProps {
  value: string;
}

/** For existing category badges only, never navigation or plain product text. */
export function ProductBadge({ value }: ProductBadgeProps) {
  return (
    <Badge kind="product" label={formatProductLabel(value)} value={value} />
  );
}
