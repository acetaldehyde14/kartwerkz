'use client';

import { formatMoney, money } from '@kartwerkz/shared';
import { useAdminDashboardStats } from '@kartwerkz/api-client';
import { Card, CardContent } from '@kartwerkz/ui';

export default function AdminDashboardPage() {
  // Falls back to zeroed placeholder stats if /admin/dashboard 404s or
  // the API isn't up yet — this route may not exist on the server side
  // for a while.
  const { data: stats } = useAdminDashboardStats();

  const tiles = [
    { label: 'Total Orders', value: stats?.totalOrders ?? '—' },
    { label: 'Pending Payment', value: stats?.pendingPayment ?? '—' },
    { label: 'Awaiting Artwork', value: stats?.awaitingArtwork ?? '—' },
    { label: 'Awaiting Approval', value: stats?.awaitingApproval ?? '—' },
    { label: 'Approved', value: stats?.approved ?? '—' },
    { label: 'In Production', value: stats?.inProduction ?? '—' },
    { label: 'Shipped', value: stats?.shipped ?? '—' },
    {
      label: 'Sales (paid+)',
      value: stats
        ? formatMoney(money(stats.salesSummaryMinorUnits, stats.currency))
        : formatMoney(money(0)),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-display-md font-black uppercase tracking-tight text-foreground">
        Admin Dashboard
      </h1>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Card key={tile.label}>
            <CardContent className="pt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                {tile.label}
              </p>
              <p className="mt-2 text-3xl font-black text-foreground">{tile.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {!stats ? (
        <p className="mt-6 text-sm text-foreground-muted">
          Dashboard stats are unavailable — the `/admin/dashboard` endpoint may not exist yet.
        </p>
      ) : null}
    </div>
  );
}
