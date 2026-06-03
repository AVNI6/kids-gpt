import { useDashboard } from "@/context/parent-dashboard/DashboardContext";

export function useNotifications() {
  const { notifications, unreadCount, isLoadingNotifications, markAsRead, markAllAsRead } =
    useDashboard();

  return {
    notifications,
    unreadCount,
    isLoadingNotifications,
    markAsRead,
    markAllAsRead,
  };
}
