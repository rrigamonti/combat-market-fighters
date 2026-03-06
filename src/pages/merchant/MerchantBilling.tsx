import { useEffect, useState } from "react";
import { Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MerchantLayout } from "@/components/merchant/MerchantLayout";
import { PageMeta } from "@/components/PageMeta";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

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
    const fetch = async () => {
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
    fetch();
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

  return (
    <MerchantLayout>
      <PageMeta title="Billing & Float | Combat Market" />
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl text-foreground">Billing & Float</h1>
          <p className="mt-1 text-muted-foreground">
            Track your balance and transaction history.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Available Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-emerald-500">
                    ${Number(balance.available).toFixed(2)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Reserved
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-amber-500">
                    ${Number(balance.reserved).toFixed(2)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Deposited
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-foreground">
                    ${Number(balance.total).toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                {ledger.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">No transactions yet.</p>
                ) : (
                  <div className="space-y-3">
                    {ledger.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between rounded-lg border border-border p-3"
                      >
                        <div className="flex items-center gap-3">
                          {isCredit(entry.entry_type) ? (
                            <ArrowDownRight className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <ArrowUpRight className="h-5 w-5 text-red-400" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {typeLabel[entry.entry_type] || entry.entry_type}
                            </p>
                            {entry.description && (
                              <p className="text-xs text-muted-foreground">{entry.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-sm font-semibold ${
                              isCredit(entry.entry_type) ? "text-emerald-500" : "text-red-400"
                            }`}
                          >
                            {isCredit(entry.entry_type) ? "+" : "−"}$
                            {Number(entry.amount).toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(entry.created_at), "MMM d, yyyy")}
                          </p>
                          <Badge
                            variant="outline"
                            className="mt-1 text-[10px]"
                          >
                            {entry.status}
                          </Badge>
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
