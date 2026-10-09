import { useState, useRef, useEffect } from "react";
import { Bell, X, Check, AlertCircle, FileText, Users, Calendar, Briefcase, CheckCheck } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "alert";
  title: string;
  message: string;
  time: string;
  read: boolean;
  category: "system" | "client" | "ofw" | "report" | "assistance";
}

export function NotificationDropdown({ dark }: { dark?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "alert",
      title: "New OFW Assistance Request",
      message: "Maria dela Cruz submitted a repatriation request from Saudi Arabia",
      time: "5 minutes ago",
      read: false,
      category: "ofw"
    },
    {
      id: "2",
      type: "info",
      title: "Beneficiary Profile Updated",
      message: "Juan Dela Cruz's profile has been successfully updated",
      time: "1 hour ago",
      read: false,
      category: "client"
    },
    {
      id: "3",
      type: "success",
      title: "Report Generated",
      message: "Monthly OFW Services Report is now available for download",
      time: "2 hours ago",
      read: false,
      category: "report"
    },
    {
      id: "4",
      type: "warning",
      title: "Pending OWWA Membership Renewal",
      message: "3 OFW memberships expiring within 30 days",
      time: "3 hours ago",
      read: true,
      category: "ofw"
    },
    {
      id: "5",
      type: "info",
      title: "Emergency Assistance Approved",
      message: "Cash assistance for Ana Reyes has been approved",
      time: "5 hours ago",
      read: true,
      category: "assistance"
    },
    {
      id: "6",
      type: "info",
      title: "New Beneficiary Registration",
      message: "Pedro Santos registered as a new PWD client",
      time: "1 day ago",
      read: true,
      category: "client"
    },
    {
      id: "7",
      type: "success",
      title: "System Backup Completed",
      message: "Daily system backup completed successfully at 2:00 AM",
      time: "1 day ago",
      read: true,
      category: "system"
    },
    {
      id: "8",
      type: "info",
      title: "Livelihood Program Update",
      message: "New TUPAD batch scheduled for next week",
      time: "2 days ago",
      read: true,
      category: "assistance"
    }
  ]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const clearNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const getNotificationIcon = (category: string) => {
    switch (category) {
      case "ofw":
        return <Briefcase className="size-4" />;
      case "client":
        return <Users className="size-4" />;
      case "report":
        return <FileText className="size-4" />;
      case "assistance":
        return <AlertCircle className="size-4" />;
      case "system":
        return <Calendar className="size-4" />;
      default:
        return <Bell className="size-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "alert":
        return "bg-red-50 border-red-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "success":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "alert":
        return "text-red-600";
      default:
        return "text-blue-600";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <Button
        variant="ghost"
        size="sm"
        className={`relative ${dark ? "text-white hover:bg-white/10" : "hover:bg-gray-100"}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 size-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center" style={{ fontWeight: 600 }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[380px] sm:w-[420px] bg-white rounded-xl border border-gray-200 shadow-xl z-50 max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg text-gray-900" style={{ fontWeight: 600 }}>Notifications</h3>
              <p className="text-xs text-gray-500" style={{ fontWeight: 400 }}>
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
            {notifications.length > 0 && (
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={markAllAsRead}
                    className="text-xs gap-1.5 hover:bg-gray-100"
                  >
                    <CheckCheck className="size-3.5" />
                    Mark all read
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <Bell className="size-12 text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm" style={{ fontWeight: 400 }}>No notifications</p>
                <p className="text-gray-400 text-xs mt-1" style={{ fontWeight: 400 }}>You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.read ? "bg-blue-50/30" : ""
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      {/* Icon */}
                      <div className={`size-10 rounded-lg ${getNotificationColor(notification.type)} flex items-center justify-center flex-shrink-0`}>
                        <div className={getIconColor(notification.type)}>
                          {getNotificationIcon(notification.category)}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className={`text-sm ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`} style={{ fontWeight: notification.read ? 400 : 600 }}>
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="size-2 bg-blue-600 rounded-full flex-shrink-0 mt-1.5"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2" style={{ fontWeight: 400 }}>
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500" style={{ fontWeight: 400 }}>
                            {notification.time}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              clearNotification(notification.id);
                            }}
                            className="h-6 px-2 hover:bg-gray-200/50"
                          >
                            <X className="size-3.5 text-gray-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50 rounded-b-xl">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAllNotifications}
                className="text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                Clear all
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-xs text-blue-600 hover:bg-blue-50 hover:text-blue-700"
              >
                View all notifications
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
