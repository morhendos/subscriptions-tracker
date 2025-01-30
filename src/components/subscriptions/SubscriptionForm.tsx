'use client';

import { useState, useEffect } from 'react';
import { Plus, Save } from 'lucide-react';
import { Subscription, SubscriptionFormData } from '@/types/subscriptions';
import { getLocalISOString } from '@/utils/dates';

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
    billingPeriod: 'monthly',
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
        billingPeriod: 'monthly',
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
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="PLN">PLN</option>
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
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
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
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-foreground hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-accent focus:ring-offset-2"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="flex-1 bg-accent/10 text-accent hover:bg-accent/15 py-3 px-6 rounded-md transition-all duration-200 flex items-center justify-center gap-2 group journal-text journal-button"
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
        </button>
      </div>
    </form>
  );
}