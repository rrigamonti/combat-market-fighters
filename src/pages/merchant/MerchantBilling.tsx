import { useEffect, useState } from "react";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  CreditCard,
  TrendingUp,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MerchantLayout } from "@/components/merchant/MerchantLayout";
import { PageMeta } from "@/components/PageMeta";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";

interface LedgerEntry {
  id: string;
  entry_type: string;
  amount: number;
  status: string;
  description: string | null;
  created_at: string;
}

export default function MerchantBilling() {
  const { merchantId } = useAuth();
  const [balance, setBalance] = useState({ available: 0, reserved: 0, total: 0 });
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!merchantId) return;
    const load = async () => {
      const [balanceRes, ledgerRes] = await Promise.all([
        supabase.rpc("get_merchant_balance", { _merchant_id: merchantId }),
        supabase
          .from("float_ledger")
          .select("*")
          .eq("merchant_id", merchantId)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      const b = balanceRes.data?.[0];
      setBalance({
        available: b?.available_balance || 0,
        reserved: b?.reserved_balance || 0,
        total: b?.total_balance || 0,
      });
      setLedger((ledgerRes.data as LedgerEntry[]) || []);
      setLoading(false);
    };
    load();
  }, [merchantId]);

  const isCredit = (type: string) => ["topup", "release", "adjustment"].includes(type);

  const typeLabel: Record<string, string> = {
    topup: "Top-up",
    reserve: "Budget Reserved",
    release: "Budget Released",
    payout: "Fighter Payout",
    adjustment: "Adjustment",
    fee: "Platform Fee",
  };

  const typeIcon = (type: string) => {
    if (type === "topup") return <PlusCircle className="h-4 w-4" />;
    if (type === "reserve") return <Clock className="h-4 w-4" />;
    if (type === "payout") return <ArrowUpRight className="h-4 w-4" />;
    return <TrendingUp className="h-4 w-4" />;
  };

  const statusColor = (status: string) => {
    if (status === "posted") return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    if (status === "pending") return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    return "text-red-400 bg-red-400/10 border-red-400/20";
  };

  const handleRequestTopUp = () => {
    toast.info("To add funds, please contact the Combat Market team. Stripe payments coming soon!");
  };

  return (
    <MerchantLayout>
      <PageMeta title="Wallet | Combat Market" />
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl text-foreground flex items-center gap-3">
              <Wallet className="h-8 w-8 text-primary" />
              Wallet
            </h1>
            <p className="mt-1 text-muted-foreground">
              Manage your funds and track all transactions.
            </p>
          </div>
          <Button onClick={handleRequestTopUp} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Add Funds
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Balance Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="border-border bg-card relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
                <CardHeader className="pb-2 relative">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <div className="rounded-full bg-emerald-500/10 p-1.5">
                      <Wallet className="h-3.5 w-3.5 text-emerald-500" />
                    </div>
                    Available Balance
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <p className="text-3xl font-bold text-emerald-500">
                    ${Number(balance.available).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Ready to use for missions</p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent" />
                <CardHeader className="pb-2 relative">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <div className="rounded-full bg-amber-500/10 p-1.5">
                      <Clock className="h-3.5 w-3.5 text-amber-500" />
                    </div>
                    Reserved
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <p className="text-3xl font-bold text-amber-500">
                    ${Number(balance.reserved).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Locked in active missions</p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                <CardHeader className="pb-2 relative">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <div className="rounded-full bg-primary/10 p-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-primary" />
                    </div>
                    Total Deposited
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <p className="text-3xl font-bold text-foreground">
                    ${Number(balance.total).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">All-time deposits</p>
                </CardContent>
              </Card>
            </div>

            {/* Transaction History */}
            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-foreground">Transaction History</CardTitle>
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  Last 50
                </Badge>
              </CardHeader>
              <CardContent>
                {ledger.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <div className="rounded-full bg-muted p-4 mb-4">
                      <Wallet className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground font-medium">No transactions yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add funds to get started with missions.
                    </p>
                    <Button variant="outline" className="mt-4 gap-2" onClick={handleRequestTopUp}>
                      <PlusCircle className="h-4 w-4" />
                      Add Funds
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {ledger.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/30"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-full ${
                              isCredit(entry.entry_type)
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-red-400/10 text-red-400"
                            }`}
                          >
                            {isCredit(entry.entry_type) ? (
                              <ArrowDownRight className="h-4 w-4" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-foreground">
                                {typeLabel[entry.entry_type] || entry.entry_type}
                              </p>
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 ${statusColor(entry.status)}`}
                              >
                                {entry.status}
                              </Badge>
                            </div>
                            {entry.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 max-w-md truncate">
                                {entry.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-sm font-semibold tabular-nums ${
                              isCredit(entry.entry_type) ? "text-emerald-500" : "text-red-400"
                            }`}
                          >
                            {isCredit(entry.entry_type) ? "+" : "−"}$
                            {Number(entry.amount).toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {format(new Date(entry.created_at), "MMM d, yyyy · h:mm a")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </MerchantLayout>
  );
}
