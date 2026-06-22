import { useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ClassroomNotification } from "@/types/classroom.types";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function useClassroomNotifications(
  role: "kid" | "teacher",
  options?: { page?: number; pageSize?: number; limit?: number }
) {
  const page = options?.page;
  const pageSize = options?.pageSize;
  const limit = options?.limit;

  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  const queryKey = useMemo(
    () => ["classroom-notifications", role, page, pageSize, limit],
    [role, page, pageSize, limit]
  );

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from("notifications")
        .select("*", { count: "exact" })
        .eq("recipient_role", role)
        .order("created_at", { ascending: false });

      if (limit !== undefined) {
        query = query.limit(limit);
      } else if (page !== undefined && pageSize !== undefined) {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);
      }

      const { data, count, error } = await query;
      if (error) throw error;

      // Also get the true unread count from the database
      const { count: dbUnreadCount, error: countError } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("recipient_role", role)
        .eq("is_read", false);

      if (countError) {
        console.error("Failed to fetch unread count:", countError);
      }

      return {
        items: (data as ClassroomNotification[]) || [],
        totalCount: count || 0,
        unreadCount: dbUnreadCount || 0,
      };
    },
    staleTime: Infinity, // Match global QueryClient config — rely on explicit invalidation
    refetchOnWindowFocus: false, // Prevent refetch on every browser-window focus event

  });

  const notifications = data?.items || [];
  const totalCount = data?.totalCount || 0;
  const unreadCount = data?.unreadCount || 0;

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
      queryClient.setQueryData(
        queryKey,
        (
          old:
            | { items: ClassroomNotification[]; totalCount: number; unreadCount: number }
            | undefined
        ) => {
          if (!old) return old;
          const nextItems = (old.items || []).map((n) =>
            n.id === id ? { ...n, is_read: true } : n
          );
          const wasUnread = (old.items || []).find((n) => n.id === id && !n.is_read);
          const nextUnread = wasUnread ? Math.max(0, old.unreadCount - 1) : old.unreadCount;
          return {
            ...old,
            items: nextItems,
            unreadCount: nextUnread,
          };
        }
      );
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
      queryClient.setQueryData(
        queryKey,
        (
          old:
            | { items: ClassroomNotification[]; totalCount: number; unreadCount: number }
            | undefined
        ) => {
          if (!old) return old;
          const nextItems = (old.items || []).map((n) => ({ ...n, is_read: true }));
          return {
            ...old,
            items: nextItems,
            unreadCount: 0,
          };
        }
      );
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
        queryClient.setQueryData(
          queryKey,
          (
            old:
              | { items: ClassroomNotification[]; totalCount: number; unreadCount: number }
              | undefined
          ) => {
            if (!old) return old;
            const nextItems = (old.items || []).filter((n) => n.id !== id);
            const wasUnread = (old.items || []).find((n) => n.id === id && !n.is_read);
            const nextUnread = wasUnread ? Math.max(0, old.unreadCount - 1) : old.unreadCount;
            return {
              ...old,
              items: nextItems,
              totalCount: Math.max(0, old.totalCount - 1),
              unreadCount: nextUnread,
            };
          }
        );

        const { error } = await supabase.from("notifications").delete().eq("id", id);
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ["classroom-notifications", role] });
      } catch (err) {
        console.error("Failed to delete notification:", err);
      }
    },
    [supabase, queryClient, queryKey, role]
  );

  const deleteAllNotifications = useCallback(async () => {
    try {
      // Optimistic update
      queryClient.setQueryData(
        queryKey,
        (
          old:
            | { items: ClassroomNotification[]; totalCount: number; unreadCount: number }
            | undefined
        ) => {
          if (!old) return old;
          return {
            items: [],
            totalCount: 0,
            unreadCount: 0,
          };
        }
      );
      const { error } = await supabase.from("notifications").delete().eq("recipient_role", role);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["classroom-notifications", role] });
    } catch (err) {
      console.error("Failed to delete all notifications:", err);
    }
  }, [supabase, role, queryClient, queryKey]);

  const fetchNotifications = useCallback(async () => {
    await queryClient.refetchQueries({ queryKey: queryKey });
  }, [queryClient, queryKey]);

  return {
    notifications,
    totalCount,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    fetchNotifications,
  };
}
