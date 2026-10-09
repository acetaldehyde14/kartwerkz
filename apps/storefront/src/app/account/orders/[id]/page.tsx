'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { formatMoney, money, OrderStatus } from '@kartwerkz/shared';
import {
  useApproveProof,
  useOrder,
  useOrderProofs,
  useRequestProofRevision,
} from '@kartwerkz/api-client';
import { Badge, Button, Card, CardContent, Skeleton, Textarea } from '@kartwerkz/ui';
import { ORDER_STATUS_TIMELINE, orderStatusVariant } from '@/lib/order-status';
import { Check } from 'lucide-react';

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;

  const { data: order, isLoading } = useOrder(orderId);
  const { data: proofs } = useOrderProofs(orderId);
  const approveProof = useApproveProof(orderId);
  const requestRevision = useRequestProofRevision(orderId);

  const [revisionNotes, setRevisionNotes] = React.useState('');

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-16 sm:px-6 lg:px-8">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <h1 className="text-xl font-bold uppercase tracking-wide text-foreground">
          Order not found
        </h1>
      </div>
    );
  }

  // Realistically one ArtworkProof per order (admin auto-creates it on first
  // revision upload); revisions within it are newest-first.
  const proof = proofs?.[0];
  const latestRevision = proof?.revisions?.[0];
  const canActOnProof = order.status === OrderStatus.AWAITING_APPROVAL;
  const currentStepIndex = ORDER_STATUS_TIMELINE.indexOf(order.status);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-display-md font-black uppercase tracking-tight text-foreground">
          Order #{order.id.slice(0, 8)}
        </h1>
        <Badge variant={orderStatusVariant(order.status)}>{order.status.replace(/_/g, ' ')}</Badge>
      </div>

      {/* Status timeline */}
      <div className="mt-10 flex flex-wrap gap-2">
        {ORDER_STATUS_TIMELINE.map((status, index) => (
          <div
            key={status}
            className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ${
              index <= currentStepIndex
                ? 'bg-accent text-accent-foreground'
                : 'bg-surface-raised text-foreground-muted'
            }`}
          >
            {status.replace(/_/g, ' ')}
          </div>
        ))}
      </div>

      {/* Items */}
      <div className="mt-10 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">Items</h2>
        {order.items.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex items-center justify-between gap-4 pt-6">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-foreground">
                  Custom Kart Graphics Kit
                </p>
                <p className="mt-1 text-xs text-foreground-muted">
                  Finish: {item.configurationSnapshot.finish} · Driver #
                  {item.configurationSnapshot.driver.number ?? '—'} · Qty {item.quantity}
                </p>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {formatMoney(money(item.totalPriceMinorUnits, item.currency))}
              </p>
            </CardContent>
          </Card>
        ))}
        <div className="flex justify-end text-sm font-bold text-foreground">
          Total: {formatMoney(money(order.totalMinorUnits, order.currency))}
        </div>
      </div>

      {/* Artwork proof */}
      <div className="mt-10">
        <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">Artwork Proof</h2>
        <Card className="mt-4">
          <CardContent className="space-y-4 pt-6">
            <div className="flex h-56 w-full items-center justify-center rounded border border-dashed border-surface-border bg-surface text-sm text-foreground-muted">
              {latestRevision
                ? `Proof revision #${latestRevision.revisionNumber} (preview placeholder)`
                : 'No proof available yet'}
            </div>

            <p className="text-sm text-foreground-muted">
              Approving this artwork will send it to production.
            </p>

            <div className="space-y-1.5">
              <Textarea
                placeholder="Describe the changes you'd like (required to request a revision)"
                value={revisionNotes}
                onChange={(event) => setRevisionNotes(event.target.value)}
                disabled={!canActOnProof}
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="accent"
                disabled={!canActOnProof || !proof}
                loading={approveProof.isPending}
                onClick={() => proof && approveProof.mutate(proof.id)}
              >
                <Check className="h-4 w-4" />
                APPROVE ARTWORK
              </Button>
              <Button
                variant="outline"
                disabled={!canActOnProof || !proof || revisionNotes.trim().length === 0}
                loading={requestRevision.isPending}
                onClick={() =>
                  proof &&
                  requestRevision.mutate({ proofId: proof.id, input: { comment: revisionNotes } })
                }
              >
                REQUEST CHANGES
              </Button>
            </div>

            {!canActOnProof ? (
              <p className="text-xs text-foreground-muted">
                Proof actions are only available while this order is awaiting your approval.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
