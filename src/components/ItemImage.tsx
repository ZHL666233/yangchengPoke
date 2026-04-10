import { ITEMS, type ItemId } from '@/types';

export default function ItemImage({
  itemId,
  className,
}: {
  itemId: ItemId;
  className?: string;
}) {
  const src = ITEMS[itemId]?.image;
  return (
    <img
      src={src}
      alt={ITEMS[itemId]?.name || itemId}
      className={className}
      loading="lazy"
      draggable={false}
    />
  );
}

