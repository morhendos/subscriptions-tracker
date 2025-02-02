import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { SubscriptionForm } from "./SubscriptionForm";
import { SubscriptionFormData } from "@/types/subscriptions";

interface AddSubscriptionSheetProps {
  onSubmit: (data: SubscriptionFormData) => void;
}

export function AddSubscriptionSheet({ onSubmit }: AddSubscriptionSheetProps) {
  const [open, setOpen] = React.useState(false);

  const handleSubmit = (data: SubscriptionFormData) => {
    onSubmit(data);
    setOpen(false);
  };

  return (
    <>
      <Button 
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2"
      >
        <PlusCircle className="w-5 h-5" />
        Add New Subscription
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Add New Subscription</SheetTitle>
            <SheetDescription>
              Add details about your new subscription below.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-8">
            <SubscriptionForm
              onSubmit={handleSubmit}
              onCancel={() => setOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}