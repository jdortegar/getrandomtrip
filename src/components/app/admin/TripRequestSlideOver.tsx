'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FormField, FormSelectField } from '@/components/ui/FormField';
import type { AdminTripRequest, TripRequestStatus } from '@/lib/admin/types';
import { StatusBadge } from './StatusBadge';
import { TripRequestDetails } from './TripRequestDetails';
import { TripStatusTimeline } from './TripStatusTimeline';

const STATUS_OPTIONS: TripRequestStatus[] = [
  'DRAFT',
  'SAVED',
  'PENDING_PAYMENT',
  'CONFIRMED',
  'REVEALED',
  'COMPLETED',
  'CANCELLED',
];

interface Draft {
  actualDestination: string;
  status: TripRequestStatus;
}

interface TripRequestSlideOverProps {
  onClose: () => void;
  onSaved: () => void;
  trip: AdminTripRequest;
}

export function TripRequestSlideOver({
  onClose,
  onSaved,
  trip,
}: TripRequestSlideOverProps) {
  const [draft, setDraft] = useState<Draft>({
    actualDestination: trip.actualDestination ?? '',
    status: trip.status,
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/admin/trip-requests/${trip.id}`, {
      body: JSON.stringify({
        actualDestination: draft.actualDestination,
        status: draft.status,
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'PATCH',
    });
    setSaving(false);
    if (res.ok) {
      onSaved();
      onClose();
    }
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-l border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-gray-100 px-4 py-3.5">
        <div>
          <p className="font-barlow-condensed text-sm font-extrabold uppercase tracking-wide text-gray-900">
            {trip.user.name}
          </p>
          <p className="mt-0.5 text-xs text-gray-400">{trip.user.email}</p>
        </div>
        <button
          aria-label="Close panel"
          className="rounded bg-gray-100 p-1 text-gray-400 hover:text-gray-700"
          onClick={onClose}
          type="button"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 border-b border-gray-100 px-4 py-2.5">
        <span className="inline-block rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-700">
          {trip.type}
        </span>
        <StatusBadge status={trip.status} variant="trip" />
        <span className="inline-block rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-700">
          {trip.level}
        </span>
        {trip.payment && (
          <StatusBadge status={trip.payment.status} variant="payment" />
        )}
      </div>

      {/* Read-only details */}
      <TripRequestDetails trip={trip} />

      {/* Edit fields */}
      <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3">
        <FormField
          id="slide-destination"
          label="Set Destination"
          onChange={(e) =>
            setDraft((d) => ({ ...d, actualDestination: e.target.value }))
          }
          placeholder="e.g. Lisbon, Portugal"
          type="text"
          value={draft.actualDestination}
        />
        <FormSelectField
          id="slide-status"
          label="Trip Status"
          onChange={(e) =>
            setDraft((d) => ({ ...d, status: e.target.value as TripRequestStatus }))
          }
          value={draft.status}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </FormSelectField>
      </div>

      {/* Timeline */}
      <TripStatusTimeline currentStatus={draft.status} trip={trip} />

      {/* Actions */}
      <div className="mt-auto flex flex-col gap-2 border-t border-gray-100 px-4 py-3">
        <Button
          disabled={saving}
          onClick={() => void handleSave()}
          size="sm"
          type="button"
          variant="default"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button onClick={onClose} size="sm" type="button" variant="secondary">
          Cancel
        </Button>
      </div>
    </aside>
  );
}
