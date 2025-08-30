"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Bell, Check, CheckCheck, X } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

const NotificationBell: React.FC = () => {
  const { t } = useTranslation();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  // Fallback calculation for unreadCount if API doesn't work
  const calculatedUnreadCount = notifications.filter(n => {
    // Handle cases where isRead might be undefined, null, or not boolean
    if (n.isRead === undefined || n.isRead === null) {
      return true; // Treat as unread if status is unknown
    }
    return n.isRead === false; // Only count as unread if explicitly false
  }).length;

  const finalUnreadCount = unreadCount > 0 ? unreadCount : calculatedUnreadCount;

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "FarmerReport":
        return "🚨";
      case "ExpertAdvice":
        return "💡";
      default:
        return "📢";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: vi
      });
    } catch {
      return t('notifications.justNow');
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {finalUnreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
          >
            {finalUnreadCount > 99 ? "99+" : finalUnreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{t('notifications.title')}</h3>
              <div className="flex items-center gap-2">
                {finalUnreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    <CheckCheck className="h-3 w-3 mr-1" />
                    {t('notifications.markAllAsRead')}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-80">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {t('notifications.noNotifications')}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.notificationId}
                    className={`p-4 hover:bg-gray-50 transition-colors ${!notification.isRead ? "bg-blue-50" : ""
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.notificationId)}
                              className="text-xs text-blue-600 hover:text-blue-700 p-1 h-6 w-6"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {formatDate(notification.createdAt)}
                          </span>
                          {notification.isRead && (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <Check className="h-3 w-3" />
                              {t('notifications.read')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Always show the "View all notifications" button - regardless of notifications */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-sm"
              onClick={() => {
                setIsOpen(false);
                // Navigate to notifications page
                window.location.href = "/dashboard/notifications";
              }}
            >
              {t('notifications.viewAll')}
            </Button>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default NotificationBell;

