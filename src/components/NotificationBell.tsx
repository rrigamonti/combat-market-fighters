import { useState } from "react";
import { Bell, Check, CheckCheck, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";

function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: (id: string) => void;
}) {
  const typeIcon: Record<string, string> = {
    mission_assigned: "🎯",
    submission_approved: "✅",
    submission_rejected: "❌",
    mission_status: "📢",
    submission_received: "📥",
    fighter_joined: "🤝",
    info: "ℹ️",
  };

  const content = (
    <div
      className={`flex items-start gap-3 rounded-md p-3 transition-colors hover:bg-muted/50 ${
        !notification.read ? "bg-primary/5" : ""
      }`}
    >
      <span className="mt-0.5 text-base">{typeIcon[notification.type] || "🔔"}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground leading-tight">
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </p>
      </div>
      {!notification.read && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRead(notification.id);
          }}
          className="mt-1 shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Mark as read"
        >
          <Check className="h-3 w-3" />
        </button>
      )}
    </div>
  );

  if (notification.link) {
    return (
      <Link to={notification.link} onClick={() => !notification.read && onRead(notification.id)}>
        {content}
      </Link>
    );
  }

  return content;
}

export function NotificationBell() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } =
    useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-white hover:text-primary"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 border-border bg-card"
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-[360px] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} onRead={markAsRead} />
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
