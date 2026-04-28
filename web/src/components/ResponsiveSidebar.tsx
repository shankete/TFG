import { useState, type ReactNode } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';

type Props = {
  mobileLabel: string;
  children: ReactNode | ((close: () => void) => ReactNode);
};

export function ResponsiveSidebar({ mobileLabel, children }: Props) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const content = typeof children === 'function' ? children(close) : children;

  return (
    <>
      <aside className="hidden md:flex md:flex-col md:gap-2">
        {content}
      </aside>
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              {mobileLabel}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle className="text-lg">{mobileLabel}</SheetTitle>
            </SheetHeader>
            <div className="px-4 pb-4 flex flex-col gap-2">
              {content}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
