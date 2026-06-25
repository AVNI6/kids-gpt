"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type {
  DashboardUserProfile,
  LinkedChildProfile,
  CacheData,
  NotificationItem,
} from "@/types/parent";
import { getChildComprehensiveData } from "@/lib/services/parent/parent-dashboard.actions";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface DashboardContextType {
  profile: DashboardUserProfile;
  linkedChildren: LinkedChildProfile[];
  activeChildId: string;
  setActiveChildId: (childId: string, subTab?: string) => void;
  activeChild: LinkedChildProfile | undefined;
  cache: Record<string, CacheData>;
  isLoadingChildData: boolean;
  fetchChildData: (childId: string, force?: boolean) => Promise<void>;
  prefetchChildData: (childId: string) => void;

  // Unified Notifications
  notifications: NotificationItem[];
  unreadCount: number;
  isLoadingNotifications: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
}

export const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

const fetchNotifications = async (parentUserId: string, limit?: number) => {
  if (!parentUserId) return { items: [], unreadCount: 0 };
  const supabase = createClient();
  let query = supabase
    .from("parent_notifications")
    .select("*")
    .eq("parent_id", parentUserId)
    .order("created_at", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Failed to fetch notifications:", error);
    return { items: [], unreadCount: 0 };
  }

  const { count: unreadCount, error: countError } = await supabase
    .from("parent_notifications")
    .select("*", { count: "exact", head: true })
    .eq("parent_id", parentUserId)
    .eq("is_read", false);

  if (countError) {
    console.error("Failed to fetch unread count:", countError);
  }

  return {
    items: data || [],
    unreadCount: unreadCount || 0,
  };
};

export function DashboardProvider({
  children,
  initialProfile,
  initialLinkedChildren,
  initialCache,
}: {
  children: React.ReactNode;
  initialProfile: DashboardUserProfile;
  initialLinkedChildren: LinkedChildProfile[];
  initialCache?: Record<string, CacheData>;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlChildId = searchParams?.get("childId") || "";
  const activeChildId = useMemo(() => {
    const isChildrenOrNotifications =
      pathname.includes("/parent/children") || pathname.includes("/parent/notifications");
    if (isChildrenOrNotifications) {
      return urlChildId;
    }
    return urlChildId || initialLinkedChildren[0]?.user_id || "";
  }, [pathname, urlChildId, initialLinkedChildren]);

  const queryClient = useQueryClient();
  const isInitialRenderRef = useRef(true);

  // Mark initial render complete on first effect
  useEffect(() => {
    isInitialRenderRef.current = false;
  }, []);

  // 2. Optimized single React Query for all active child data (exactly 1 HTTP network request!)
  const { data: activeChildData } = useQuery<CacheData | null>({
    queryKey: ["parent-dashboard", activeChildId, "comprehensive"],
    queryFn: () => (activeChildId ? getChildComprehensiveData(activeChildId) : null),
    enabled: !!activeChildId,
    staleTime: Infinity,
    initialData:
      initialCache && activeChildId && initialCache[activeChildId]
        ? initialCache[activeChildId]
        : undefined,
  });

  const { data: notificationsQueryData, isLoading: isLoadingNotificationsQuery } = useQuery({
    queryKey: ["parent-dashboard", "notifications"],
    queryFn: () => fetchNotifications(initialProfile.user_id, 10),
    enabled: !!initialProfile.user_id,
    staleTime: Infinity,
  });

  // Derived loading states
  const isLoadingChildData = !!activeChildId && !activeChildData;
  const isLoadingNotifications = isLoadingNotificationsQuery;

  // 3. Dynamic cache compilation matching legacy shape perfectly
  const cache = useMemo(() => {
    const mergedCache: Record<string, CacheData> = { ...(initialCache ?? {}) };

    if (activeChildId) {
      const activeChildComp = queryClient.getQueryData<CacheData>([
        "parent-dashboard",
        activeChildId,
        "comprehensive",
      ]);

      if (activeChildComp) {
        mergedCache[activeChildId] = activeChildComp;
      }
    }

    initialLinkedChildren.forEach((child) => {
      const childId = child.user_id;
      if (childId === activeChildId) return;

      const comp = queryClient.getQueryData<CacheData>([
        "parent-dashboard",
        childId,
        "comprehensive",
      ]);

      if (comp) {
        mergedCache[childId] = comp;
      }
    });

    return mergedCache;
  }, [activeChildId, initialCache, queryClient, initialLinkedChildren]);

  // Notifications State & Realtime
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationsRef = useRef<NotificationItem[]>([]);

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  // Sync notifications query data to state for realtime mutations
  useEffect(() => {
    if (notificationsQueryData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNotifications(notificationsQueryData.items);
      setUnreadCount(notificationsQueryData.unreadCount);
    }
  }, [notificationsQueryData]);

  const activeChild =
    initialLinkedChildren.find((c) => c.user_id === activeChildId) || initialLinkedChildren[0];

  const setActiveChildId = useCallback(
    (childId: string, subTab?: string) => {
      const params = new URLSearchParams(window.location.search);
      if (childId) {
        params.set("childId", childId);
        if (subTab) {
          params.set("subTab", subTab);
        } else {
          params.delete("subTab");
        }
      } else {
        params.delete("childId");
        params.delete("subTab");
      }

      const newUrl = `${window.location.pathname}?${params.toString()}`;
      router.push(newUrl);
    },
    [router]
  );

  const fetchChildData = useCallback(
    async (childId: string, force = false) => {
      if (!childId) return;
      if (force) {
        queryClient.invalidateQueries({ queryKey: ["parent-dashboard", childId] });
      }
    },
    [queryClient]
  );

  const prefetchChildData = useCallback(
    (childId: string) => {
      if (!childId) return;
      queryClient.prefetchQuery({
        queryKey: ["parent-dashboard", childId, "comprehensive"],
        queryFn: () => getChildComprehensiveData(childId),
        staleTime: Infinity,
      });
    },
    [queryClient]
  );

  // 3. Unified Notifications Service (Realtime only)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normalizeNotification = useCallback((record: any): NotificationItem | null => {
    if (!record || !record.id) return null;
    return {
      id: String(record.id ?? ""),
      parent_id: String(record.parent_id ?? ""),
      child_id: String(record.child_id ?? ""),
      type: String(record.type ?? ""),
      title: String(record.title ?? ""),
      message: String(record.message ?? ""),
      is_read: Boolean(record.is_read ?? false),
      metadata: (record.metadata ?? {}) as Record<string, unknown> | null,
      created_at: record.created_at ? String(record.created_at) : null,
    };
  }, []);

  const sortNotifications = useCallback((items: NotificationItem[]) => {
    return [...items].sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });
  }, []);

  const updateNotifications = useCallback(
    (next: NotificationItem[]) => {
      const sorted = sortNotifications(next);
      const prevUnreadCountInPreview = notificationsRef.current.filter((n) => !n.is_read).length;
      const nextUnreadCountInPreview = sorted.filter((n) => !n.is_read).length;
      const diff = nextUnreadCountInPreview - prevUnreadCountInPreview;

      setNotifications(sorted);
      setUnreadCount((prev) => Math.max(0, prev + diff));
    },
    [sortNotifications]
  );

  // Stabilize callback references to prevent useEffect re-runs
  const normalizeNotificationRef = useRef(normalizeNotification);
  const updateNotificationsRef = useRef(updateNotifications);

  useEffect(() => {
    normalizeNotificationRef.current = normalizeNotification;
  }, [normalizeNotification]);

  useEffect(() => {
    updateNotificationsRef.current = updateNotifications;
  }, [updateNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    const previous = notificationsRef.current;
    // Check if this item was unread in the preview so we can decrement the real total count
    const wasUnread = previous.find((n) => n.id === id)?.is_read === false;

    // Optimistic update: mark item read in preview list
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    // Decrement the real unread count by 1 (the true DB total, not just preview)
    if (wasUnread) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("parent_notifications")
        .update({ is_read: true })
        .eq("id", id);

      if (error) throw error;
    } catch (err) {
      console.error("Failed to mark notification read:", err);
      // Rollback
      setNotifications(previous);
      if (wasUnread) setUnreadCount((prev) => prev + 1);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!initialProfile.user_id) return;
    const previous = notificationsRef.current;

    // Optimistic update: mark all preview items read and zero out the REAL total badge count
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("parent_notifications")
        .update({ is_read: true })
        .eq("parent_id", initialProfile.user_id)
        .eq("is_read", false);

      if (error) throw error;
    } catch (err) {
      console.error("Failed to mark all read:", err);
      // Rollback
      setNotifications(previous);
      setUnreadCount(previous.filter((n) => !n.is_read).length);
    }
  }, [initialProfile.user_id]);

  const deleteNotification = useCallback(async (id: string) => {
    const previous = notificationsRef.current;
    const wasUnread = previous.find((n) => n.id === id)?.is_read === false;

    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      const supabase = createClient();
      const { error } = await supabase.from("parent_notifications").delete().eq("id", id);

      if (error) throw error;
    } catch (err) {
      console.error("Failed to delete notification:", err);
      // Rollback
      setNotifications(previous);
      if (wasUnread) setUnreadCount((prev) => prev + 1);
    }
  }, []);

  const deleteAllNotifications = useCallback(async () => {
    if (!initialProfile.user_id) return;
    const previous = notificationsRef.current;

    // Optimistic update: clear everything including real badge count
    setNotifications([]);
    setUnreadCount(0);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("parent_notifications")
        .delete()
        .eq("parent_id", initialProfile.user_id);

      if (error) throw error;
    } catch (err) {
      console.error("Failed to delete all notifications:", err);
      // Rollback
      setNotifications(previous);
      setUnreadCount(previous.filter((n) => !n.is_read).length);
    }
  }, [initialProfile.user_id]);

  // Notifications Realtime Subscription (Only connect on user interaction, not on initial load)
  useEffect(() => {
    // Skip on initial render to prevent auto-connecting
    if (isInitialRenderRef.current) return;
    if (!initialProfile.user_id) return;

    const supabase = createClient();
    const channel = supabase
      .channel("parent-dashboard-unified-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "parent_notifications",
          filter: `parent_id=eq.${initialProfile.user_id}`,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const eventType = payload.eventType;
          const newRecord = normalizeNotificationRef.current(payload.new);
          const oldRecord = normalizeNotificationRef.current(payload.old);

          if (eventType === "INSERT" && newRecord) {
            updateNotificationsRef.current([newRecord, ...notificationsRef.current]);
            return;
          }

          if (eventType === "UPDATE" && newRecord) {
            const updated = notificationsRef.current.map((n) =>
              n.id === newRecord.id ? { ...n, ...newRecord } : n
            );
            updateNotificationsRef.current(updated);
            return;
          }

          if (eventType === "DELETE" && oldRecord) {
            const filtered = notificationsRef.current.filter((n) => n.id !== oldRecord.id);
            updateNotificationsRef.current(filtered);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialProfile.user_id]);

  // Auto-purge read parent notifications older than 7 days
  useEffect(() => {
    if (!initialProfile.user_id) return;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const supabase = createClient();
    supabase
      .from("parent_notifications")
      .delete()
      .eq("parent_id", initialProfile.user_id)
      .eq("is_read", true)
      .lt("created_at", sevenDaysAgo.toISOString())
      .then((res: { error: unknown }) => {
        if (res.error) {
          console.error("Failed to auto-purge old parent notifications:", res.error);
        }
      });
  }, [initialProfile.user_id]);

  const value = useMemo(
    () => ({
      profile: initialProfile,
      linkedChildren: initialLinkedChildren,
      activeChildId,
      setActiveChildId,
      activeChild,
      cache,
      isLoadingChildData,
      fetchChildData,
      prefetchChildData,

      // Notifications
      notifications,
      unreadCount,
      isLoadingNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      deleteAllNotifications,
    }),
    [
      initialProfile,
      initialLinkedChildren,
      activeChildId,
      setActiveChildId,
      activeChild,
      cache,
      isLoadingChildData,
      fetchChildData,
      prefetchChildData,
      notifications,
      unreadCount,
      isLoadingNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      deleteAllNotifications,
    ]
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
