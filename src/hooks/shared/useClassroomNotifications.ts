import { useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ClassroomNotification } from "@/types/classroom.types";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function useClassroomNotifications(role: "kid" | "teacher", limit?: number) {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  const queryKey = useMemo(() => ["classroom-notifications", role, limit], [role, limit]);

  const { data: notifications = [], isLoading } = useQuery<ClassroomNotification[]>({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from("notifications")
        .select("*")
        .eq("recipient_role", role)
        .order("created_at", { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data } = await query;
      return (data as ClassroomNotification[]) || [];
    },
    staleTime: 5000, // deduplicate and cache for 5 seconds
  });

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.is_read).length;
  }, [notifications]);

  // Purge old read notifications in the background
  useEffect(() => {
    if (notifications.length === 0) return;
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
  }, [role, supabase, notifications.length]);

  const markAsRead = async (id: string) => {
    try {
      // Optimistic update
      queryClient.setQueryData<ClassroomNotification[]>(queryKey, (old) => {
        return (old || []).map((n) => (n.id === id ? { ...n, is_read: true } : n));
      });
      await supabase.from("notifications").update({ is_read: true }).eq("id", id);
      queryClient.invalidateQueries({ queryKey: ["classroom-notifications", role] });
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
      if (unreadIds.length === 0) return;

      // Optimistic update
      queryClient.setQueryData<ClassroomNotification[]>(queryKey, (old) => {
        return (old || []).map((n) => ({ ...n, is_read: true }));
      });
      await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
      queryClient.invalidateQueries({ queryKey: ["classroom-notifications", role] });
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const deleteNotification = useCallback(
    async (id: string) => {
      try {
        // Optimistic update
        queryClient.setQueryData<ClassroomNotification[]>(queryKey, (old) => {
          return (old || []).filter((n) => n.id !== id);
        });

        const { error } = await supabase.from("notifications").delete().eq("id", id);
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ["classroom-notifications", role] });
      } catch (err) {
        console.error("Failed to delete notification:", err);
        queryClient.invalidateQueries({ queryKey: queryKey });
      }
    },
    [supabase, queryClient, queryKey, role]
  );

  const deleteAllNotifications = useCallback(async () => {
    try {
      // Optimistic update
      queryClient.setQueryData<ClassroomNotification[]>(queryKey, []);
      const { error } = await supabase.from("notifications").delete().eq("recipient_role", role);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["classroom-notifications", role] });
    } catch (err) {
      console.error("Failed to delete all notifications:", err);
      queryClient.invalidateQueries({ queryKey: queryKey });
    }
  }, [supabase, role, queryClient, queryKey]);

  const fetchNotifications = useCallback(async () => {
    await queryClient.refetchQueries({ queryKey: queryKey });
  }, [queryClient, queryKey]);

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
