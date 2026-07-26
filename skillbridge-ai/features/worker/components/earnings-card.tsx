import { Wallet, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface EarningsCardProps {
  thisMonth: number;
  lastMonth: number;
  pending: number;
}

export function EarningsCard({ thisMonth, lastMonth, pending }: EarningsCardProps) {
  const change = Math.round(((thisMonth - lastMonth) / lastMonth) * 100);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-0">
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-success" />
          Earnings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-display text-3xl font-bold">{formatCurrency(thisMonth)}</p>
        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-success">
          <TrendingUp className="h-3.5 w-3.5" /> {change >= 0 ? "+" : ""}{change}% vs last month
        </p>
        <div className="mt-4 flex items-center justify-between rounded-lg bg-secondary px-3 py-2">
          <span className="text-xs text-muted-foreground">Pending payout</span>
          <span className="text-sm font-semibold">{formatCurrency(pending)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
