import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ClassroomNotification } from "@/types/classroom.types";

export function useClassroomNotifications(role: "kid" | "teacher", limit?: number) {
  const [notifications, setNotifications] = useState<ClassroomNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  const fetchNotifications = useCallback(async () => {
    try {
      let query = supabase
        .from("notifications")
        .select("*")
        .eq("recipient_role", role)
        .order("created_at", { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data } = await query;

      if (data) {
        const typed = data as ClassroomNotification[];
        setNotifications(typed);
        setUnreadCount(typed.filter((n) => !n.is_read).length);
      }

      // Auto-purge read notifications older than 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      supabase
        .from("notifications")
        .delete()
        .eq("recipient_role", role)
        .eq("is_read", true)
        .lt("created_at", sevenDaysAgo.toISOString())
        .then((res: { error: unknown }) => {
          if (res.error) {
            console.error("Failed to auto-purge old read classroom notifications:", res.error);
          }
        });
    } catch (err) {
      console.error(`Failed to fetch notifications for ${role}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, role, limit]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await supabase.from("notifications").update({ is_read: true }).eq("id", id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
      if (unreadIds.length === 0) return;
      await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const deleteNotification = useCallback(
    async (id: string) => {
      try {
        setNotifications((prev) => {
          const deletedNotif = prev.find((n) => n.id === id);
          if (deletedNotif && !deletedNotif.is_read) {
            setUnreadCount((count) => Math.max(0, count - 1));
          }
          return prev.filter((n) => n.id !== id);
        });

        const { error } = await supabase.from("notifications").delete().eq("id", id);
        if (error) throw error;
      } catch (err) {
        console.error("Failed to delete notification:", err);
        fetchNotifications();
      }
    },
    [supabase, fetchNotifications]
  );

  const deleteAllNotifications = useCallback(async () => {
    try {
      setNotifications([]);
      setUnreadCount(0);
      const { error } = await supabase.from("notifications").delete().eq("recipient_role", role);
      if (error) throw error;
    } catch (err) {
      console.error("Failed to delete all notifications:", err);
      fetchNotifications();
    }
  }, [supabase, role, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    fetchNotifications,
  };
}
