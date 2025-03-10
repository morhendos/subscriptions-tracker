'use client';

import { useState, useEffect } from 'react';
import { Plus, Save } from 'lucide-react';
import { Subscription, SubscriptionFormData } from '@/types/subscriptions';
import { getLocalISOString } from '@/utils/dates';
import { CURRENCIES, CURRENCY_ORDER } from '@/lib/subscriptions/config/currencies';
import { Button } from '@/components/ui/button';

export function SubscriptionForm({ 
  onSubmit,
  onCancel,
  initialData 
}: { 
  onSubmit: (data: SubscriptionFormData) => void;
  onCancel?: () => void;
  initialData?: Subscription;
}) {
  const [form, setForm] = useState<SubscriptionFormData>({
    name: '',
    price: 0,
    currency: 'EUR',
    billingPeriod: 'MONTHLY',
    startDate: getLocalISOString(new Date()),
    description: ''
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name,
        price: initialData.price,
        currency: initialData.currency,
        billingPeriod: initialData.billingPeriod,
        startDate: initialData.startDate,
        description: initialData.description || ''
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
    
    if (!initialData) {
      setForm({
        name: '',
        price: 0,
        currency: 'EUR',
        billingPeriod: 'MONTHLY',
        startDate: getLocalISOString(new Date()),
        description: ''
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) : value
    }));
  };

  const inputClasses = "mt-1 block w-full rounded-md border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-foreground focus:border-accent dark:focus:border-accent focus:ring-accent dark:focus:ring-accent";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-foreground">
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Netflix, Spotify, etc."
          required
          className={inputClasses}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-foreground">
            Price
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={form.price}
            onChange={handleChange}
            min="0"
            step="0.01"
            required
            className={inputClasses}
          />
        </div>

        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-foreground">
            Currency
          </label>
          <select
            id="currency"
            name="currency"
            value={form.currency}
            onChange={handleChange}
            className={inputClasses}
          >
            {CURRENCY_ORDER.map(code => (
              <option key={code} value={code}>
                {code} - {CURRENCIES[code].label} ({CURRENCIES[code].symbol})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="billingPeriod" className="block text-sm font-medium text-foreground">
            Billing Period
          </label>
          <select
            id="billingPeriod"
            name="billingPeriod"
            value={form.billingPeriod}
            onChange={handleChange}
            className={inputClasses}
          >
            <option value="MONTHLY">Monthly</option>
            <option value="YEARLY">Yearly</option>
          </select>
        </div>

        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-foreground">
            Start Date
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={form.startDate}
            onChange={handleChange}
            required
            className={inputClasses}
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-foreground">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={2}
          className={inputClasses}
          placeholder="Optional notes about this subscription"
        />
      </div>

      <div className="flex justify-end space-x-4 p-1">
        {onCancel && (
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            className="border-gray-700 hover:bg-gray-800"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="golden"
          className="flex-1 flex items-center justify-center gap-2 group"
        >
          {initialData ? (
            <>
              <Save size={18} className="group-hover:scale-105 transition-transform" strokeWidth={1.5} />
              <span>Save Changes</span>
            </>
          ) : (
            <>
              <Plus size={18} className="group-hover:scale-105 transition-transform" strokeWidth={1.5} />
              <span>Add Subscription</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}