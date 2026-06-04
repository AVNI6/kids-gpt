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
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

const fetchNotifications = async (parentUserId: string) => {
  if (!parentUserId) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("parent_notifications")
    .select("*")
    .eq("parent_id", parentUserId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch notifications:", error);
    return [];
  }
  return data || [];
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
    queryFn: () => fetchNotifications(initialProfile.user_id),
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
      setNotifications(notificationsQueryData);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setUnreadCount(notificationsQueryData.filter((n: any) => !n.is_read).length);
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
      setNotifications(sorted);
      setUnreadCount(sorted.filter((n) => !n.is_read).length);
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

  const markAsRead = useCallback(
    async (id: string) => {
      const previous = notificationsRef.current;
      // Optimistic Update for instant UI feel!
      updateNotifications(previous.map((n) => (n.id === id ? { ...n, is_read: true } : n)));

      try {
        const supabase = createClient();
        const { error } = await supabase
          .from("parent_notifications")
          .update({ is_read: true })
          .eq("id", id);

        if (error) {
          throw error;
        }
      } catch (err) {
        console.error("Failed to mark notification read:", err);
        updateNotifications(previous);
      }
    },
    [updateNotifications]
  );

  const markAllAsRead = useCallback(async () => {
    if (!initialProfile.user_id) return;
    const previous = notificationsRef.current;
    // Optimistic Update
    updateNotifications(previous.map((n) => ({ ...n, is_read: true })));

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("parent_notifications")
        .update({ is_read: true })
        .eq("parent_id", initialProfile.user_id)
        .eq("is_read", false);

      if (error) {
        throw error;
      }
    } catch (err) {
      console.error("Failed to mark all read:", err);
      updateNotifications(previous);
    }
  }, [initialProfile.user_id, updateNotifications]);

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

  return (
    <DashboardContext.Provider
      value={{
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
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
