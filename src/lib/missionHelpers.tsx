import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

// ── Shared types ──────────────────────────────────────────────

type Mission = Database["public"]["Tables"]["missions"]["Row"];

export interface MissionWithMerchant extends Mission {
  merchants: { name: string; logo_url: string | null } | null;
}

// ── Badge helpers ─────────────────────────────────────────────

/** Participation / generic status badge (joined, submitted, approved, paid, rejected, pending) */
export function getParticipationStatusBadge(status: string) {
  switch (status) {
    case "joined":
    case "started":
      return (
        <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
          <Clock className="mr-1 h-3 w-3" /> In Progress
        </Badge>
      );
    case "submitted":
      return (
        <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
          <Clock className="mr-1 h-3 w-3" /> Submitted
        </Badge>
      );
    case "approved":
    case "paid":
      return (
        <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
          <CheckCircle className="mr-1 h-3 w-3" /> {status === "paid" ? "Paid" : "Approved"}
        </Badge>
      );
    case "rejected":
      return (
        <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
          <XCircle className="mr-1 h-3 w-3" /> Rejected
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
          <Clock className="mr-1 h-3 w-3" /> Pending
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

/** Mission type badge with consistent colours */
export function getMissionTypeBadge(type: string) {
  const colors: Record<string, string> = {
    purchase: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    review: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    social: "bg-pink-500/10 text-pink-500 border-pink-500/20",
    event: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    referral: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    custom: "bg-muted text-muted-foreground border-border",
  };
  return (
    <Badge className={colors[type] || colors.custom}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </Badge>
  );
}

/** Submission status badge */
export function getSubmissionStatusBadge(status: string) {
  switch (status) {
    case "pending":
      return (
        <Badge variant="outline" className="border-yellow-500/20 text-yellow-500">
          <Clock className="mr-1 h-3 w-3" /> Pending Review
        </Badge>
      );
    case "approved":
      return (
        <Badge variant="outline" className="border-green-500/20 text-green-500">
          <CheckCircle className="mr-1 h-3 w-3" /> Approved
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="outline" className="border-red-500/20 text-red-500">
          <XCircle className="mr-1 h-3 w-3" /> Rejected
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

// ── Mission-level status helpers ──────────────────────────────

/** Badge variant for mission/participation statuses (admin pages) */
export function getMissionStatusVariant(s: string): "default" | "secondary" | "outline" | "destructive" {
  switch (s) {
    case "active": case "approved": case "paid": return "default";
    case "draft": case "joined": case "started": return "secondary";
    case "closed": case "submitted": return "outline";
    case "paused": case "rejected": return "destructive";
    default: return "secondary";
  }
}

/** Tailwind colour classes for mission statuses (merchant pages) */
export function getMissionStatusColor(s: string): string {
  const map: Record<string, string> = {
    active: "bg-green-500/10 text-green-500",
    draft: "bg-muted text-muted-foreground",
    scheduled: "bg-blue-500/10 text-blue-500",
    paused: "bg-amber-500/10 text-amber-500",
    closed: "bg-red-500/10 text-red-500",
  };
  return map[s] || "bg-muted text-muted-foreground";
}

/** Tailwind colour classes for submission statuses (merchant pages) */
export function getSubmissionStatusColor(s: string): string {
  const map: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-500",
    approved: "bg-green-500/10 text-green-500",
    rejected: "bg-red-500/10 text-red-500",
  };
  return map[s] || "bg-muted text-muted-foreground";
}
