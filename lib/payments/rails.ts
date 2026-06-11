/**
 * Payment rail registry — one entry per checkout/payout channel.
 *
 * To add a rail (e.g. Zelle):
 * 1. Add id to PaymentRail in paymentTypes.ts
 * 2. Register here with settingsPanel when the admin UI is ready
 * 3. Set `rail` on intents at create time in the Lambda handler
 * 4. Add gateway config to site settings / DynamoDB as needed
 */

import type { PaymentRail } from '../paymentTypes';

export type RailAvailability = 'live' | 'coming_soon';

export interface PaymentRailMeta {
  id: PaymentRail;
  label: string;
  description: string;
  availability: RailAvailability;
  /** When live, which admin settings sub-panel renders (Gateways tab). */
  settingsPanel?: 'crypto';
}

export const PAYMENT_RAILS: PaymentRailMeta[] = [
  {
    id: 'crypto',
    label: 'Crypto',
    description: 'On-chain invoices with automatic watcher confirmation.',
    availability: 'live',
    settingsPanel: 'crypto',
  },
  {
    id: 'zelle',
    label: 'Zelle',
    description: 'Self-hosted bank transfer — manual confirmation.',
    availability: 'coming_soon',
  },
  {
    id: 'cashapp',
    label: 'Cash App',
    description: 'Self-hosted Cash App — manual confirmation.',
    availability: 'coming_soon',
  },
];

export const PAYMENT_RAIL_MAP = Object.fromEntries(
  PAYMENT_RAILS.map((r) => [r.id, r])
) as Record<PaymentRail, PaymentRailMeta>;
