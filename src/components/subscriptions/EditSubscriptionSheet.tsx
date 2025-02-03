'use client';

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Subscription, SubscriptionFormData } from "@/types/subscriptions";
import { SubscriptionForm } from "./SubscriptionForm";

interface EditSubscriptionSheetProps {
  subscription: Subscription | null;
  onSubmit: (data: SubscriptionFormData) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function EditSubscriptionSheet({ 
  subscription,
  onSubmit, 
  onOpenChange,
  open
}: EditSubscriptionSheetProps) {
  const handleSubmit = (data: SubscriptionFormData) => {
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Edit Subscription</SheetTitle>
          <SheetDescription>
            Update your subscription details below.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-8">
          {subscription && (
            <SubscriptionForm
              onSubmit={handleSubmit}
              onCancel={() => onOpenChange(false)}
              initialData={subscription}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}