'use client';

import type { ComponentProps } from 'react';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type DialogContentProps = ComponentProps<typeof DialogContent>;

export interface ModalProps {
  children: React.ReactNode;
  className?: DialogContentProps['className'];
  onOpenChange: (open: boolean) => void;
  open: boolean;
  overlayClassName?: string;
  showCloseButton?: boolean;
}

/** App-wide modal shell: Radix Dialog + overlay/content z-[1100] (aligned with checkout). */
export function Modal({
  children,
  className,
  onOpenChange,
  open,
  overlayClassName = 'z-[1100]',
  showCloseButton = true,
}: ModalProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        className={cn(
          'z-[1100] gap-0 rounded-2xl border-gray-100 bg-white shadow-xl',
          className,
        )}
        overlayClassName={overlayClassName}
        showCloseButton={showCloseButton}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}

export {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
