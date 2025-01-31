import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AddSubscriptionButtonProps {
  className?: string;
}

/**
 * A button component that navigates to the subscription creation form
 * @param className - Optional CSS class name for styling
 */
export const AddSubscriptionButton: React.FC<AddSubscriptionButtonProps> = ({ 
  className = '' 
}) => {
  const router = useRouter();

  const handleClick = () => {
    router.push('/subscriptions/new');
  };

  return (
    <Button
      onClick={handleClick}
      className={`inline-flex items-center gap-2 ${className}`}
      variant="default"
    >
      <Plus className="h-4 w-4" />
      Add Subscription
    </Button>
  );
};

export default AddSubscriptionButton;