import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import type { ProductListItem } from '@/api/products';

export function ProductCard({ p }: { p: ProductListItem }) {
  return (
    <Link to={`/products/${p.id}`} className="block">
      <Card className="overflow-hidden hover:shadow-md transition-shadow py-0 gap-0">
        <div className="relative aspect-square w-full bg-muted overflow-hidden">
          <img src={p.imageUrl} alt={p.name} className="absolute inset-0 w-full h-full object-cover" />
        </div>
        <CardContent className="p-3">
          <div className="font-medium line-clamp-1">{p.name}</div>
          <div className="text-xs text-muted-foreground line-clamp-1">{p.category.name}</div>
          <div className="text-sm mt-1 line-clamp-1">
            {p.minPricePerKg != null ? <>desde <strong>{p.minPricePerKg.toFixed(2)} €/kg</strong></> : <span className="text-muted-foreground">Sin ofertas</span>}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
