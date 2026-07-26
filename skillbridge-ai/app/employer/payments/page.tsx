"use client";

import { Wallet, ArrowDownRight, ArrowUpRight, Download } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

const TRANSACTIONS = [
  { id: "t1", label: "Payout — Site Electrician (Arjun Mehta)", amount: -25000, date: "2026-07-24", status: "completed" as const },
  { id: "t2", label: "Payout — AC Repair gig (Ramesh Yadav)", amount: -650, date: "2026-07-23", status: "completed" as const },
  { id: "t3", label: "Wallet top-up", amount: 50000, date: "2026-07-20", status: "completed" as const },
  { id: "t4", label: "Payout — Wiring Inspection gig (Kavita Joshi)", amount: -900, date: "2026-07-19", status: "pending" as const },
];

export default function PaymentsPage() {
  return (
    <div>
      <PageHeader
        title="Payments"
        description="Manage payouts to workers and track your hiring spend."
        action={
          <Button variant="outline">
            <Download className="h-4 w-4" /> Export statement
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Wallet Balance" value={formatCurrency(184500)} icon={Wallet} accent="bridge" />
        <StatCard label="Paid Out (30d)" value={formatCurrency(62400)} icon={ArrowDownRight} accent="signal" />
        <StatCard label="Pending Payouts" value={formatCurrency(900)} icon={ArrowUpRight} accent="success" />
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {TRANSACTIONS.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{t.label}</p>
                  <p className="text-xs text-muted-foreground">{t.date}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className={`text-sm font-semibold ${t.amount < 0 ? "text-foreground" : "text-success"}`}>
                    {t.amount < 0 ? "-" : "+"}
                    {formatCurrency(Math.abs(t.amount))}
                  </span>
                  <Badge variant={t.status === "completed" ? "success" : "signal"}>{t.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
