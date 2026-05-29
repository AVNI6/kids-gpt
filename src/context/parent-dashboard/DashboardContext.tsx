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
  ChildDetailsResult,
  ParentActivityItem,
  ChildSafetyAndUsageResult,
  SearchHistoryItem,
  AiInsightsResult,
} from "@/types/parent-dashboard/dashboard.types";
import {
  getChildDetails,
  getChildAiInsights,
  getParentActivities,
  getChildSafetyAndUsage,
  getParentSearchHistory,
} from "@/actions/parent-dashboard.actions";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface DashboardContextType {
  profile: DashboardUserProfile;
  linkedChildren: LinkedChildProfile[];
  activeChildId: string;
  setActiveChildId: (childId: string) => void;
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

const fetchProgress = async (childId: string) => {
  const [details, aiInsights] = await Promise.all([
    getChildDetails(childId),
    getChildAiInsights(childId),
  ]);
  return { details, aiInsights: aiInsights as AiInsightsResult | null };
};

const fetchActivities = async (childId: string) => {
  const [details, activities] = await Promise.all([
    getChildDetails(childId),
    getParentActivities(childId),
  ]);
  return { details, activities };
};

const fetchMonitoring = async (childId: string) => {
  const [safety, searchHistory] = await Promise.all([
    getChildSafetyAndUsage(childId),
    getParentSearchHistory(childId),
  ]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedHistory: SearchHistoryItem[] = (searchHistory || []).map((h: any) => ({
    id: String(h.id ?? ""),
    title: h.title ? String(h.title) : null,
    created_at: h.created_at ? String(h.created_at) : null,
  }));
  return { safety, searchHistory: formattedHistory };
};

const fetchNotifications = async () => {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.id) return [];

  const { data, error } = await supabase
    .from("parent_notifications")
    .select("*")
    .eq("parent_id", session.user.id)
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

  // 2. React Query definitions with synchronous initialData mapping and staleTime: Infinity
  const { data: progressData } = useQuery<{
    details: ChildDetailsResult | null;
    aiInsights: AiInsightsResult | null;
  } | null>({
    queryKey: ["parent-dashboard", activeChildId, "progress"],
    queryFn: () => (activeChildId ? fetchProgress(activeChildId) : null),
    enabled:
      !!activeChildId &&
      (pathname.includes("/parent/progress") ||
        pathname === "/dashboard/parent" ||
        pathname.includes("/parent/children")),
    staleTime: Infinity,
    initialData:
      initialCache && activeChildId && initialCache[activeChildId]
        ? {
            details: initialCache[activeChildId].details,
            aiInsights: initialCache[activeChildId].aiInsights,
          }
        : undefined,
  });

  const { data: activitiesData } = useQuery<{
    details: ChildDetailsResult | null;
    activities: ParentActivityItem[];
  } | null>({
    queryKey: ["parent-dashboard", activeChildId, "activities"],
    queryFn: () => (activeChildId ? fetchActivities(activeChildId) : null),
    enabled:
      !!activeChildId &&
      (pathname.includes("/parent/activities") ||
        pathname === "/dashboard/parent" ||
        pathname.includes("/parent/children")),
    staleTime: Infinity,
    initialData:
      initialCache && activeChildId && initialCache[activeChildId]
        ? {
            details: initialCache[activeChildId].details,
            activities: initialCache[activeChildId].activities,
          }
        : undefined,
  });

  const { data: monitoringData } = useQuery<{
    safety: ChildSafetyAndUsageResult | null;
    searchHistory: SearchHistoryItem[];
  } | null>({
    queryKey: ["parent-dashboard", activeChildId, "monitoring"],
    queryFn: () => (activeChildId ? fetchMonitoring(activeChildId) : null),
    enabled:
      !!activeChildId &&
      (pathname.includes("/parent/monitoring") || pathname.includes("/parent/children")),
    staleTime: Infinity,
    initialData:
      initialCache && activeChildId && initialCache[activeChildId]
        ? {
            safety: initialCache[activeChildId].safety,
            searchHistory: initialCache[activeChildId].history,
          }
        : undefined,
  });

  const { data: notificationsQueryData, isLoading: isLoadingNotificationsQuery } = useQuery({
    queryKey: ["parent-dashboard", "notifications"],
    queryFn: fetchNotifications,
    enabled: true, // Always fetch for the top nav bell icon popover
    staleTime: Infinity,
  });

  // Derived loading states
  const isProgressLoading =
    (pathname.includes("/parent/progress") || pathname.includes("/parent/children")) &&
    !progressData;
  const isActivitiesLoading =
    (pathname.includes("/parent/activities") || pathname.includes("/parent/children")) &&
    !activitiesData;
  const isMonitoringLoading =
    (pathname.includes("/parent/monitoring") || pathname.includes("/parent/children")) &&
    !monitoringData;
  const isChildrenDetailLoading =
    pathname.includes("/parent/children") &&
    !!activeChildId &&
    (!progressData || !activitiesData || !monitoringData);
  const isLoadingChildData =
    isProgressLoading || isActivitiesLoading || isMonitoringLoading || isChildrenDetailLoading;

  const isLoadingNotifications = isLoadingNotificationsQuery;

  // 3. Dynamic cache compilation matching legcy shape perfectly
  const cache = useMemo(() => {
    const mergedCache: Record<string, CacheData> = { ...(initialCache ?? {}) };

    if (activeChildId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const activeChildProgress = queryClient.getQueryData<any>([
        "parent-dashboard",
        activeChildId,
        "progress",
      ]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const activeChildActivities = queryClient.getQueryData<any>([
        "parent-dashboard",
        activeChildId,
        "activities",
      ]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const activeChildMonitoring = queryClient.getQueryData<any>([
        "parent-dashboard",
        activeChildId,
        "monitoring",
      ]);

      const currentEntry = mergedCache[activeChildId] || {
        details: null,
        safety: null,
        history: [],
        activities: [],
        screenTime: null,
        aiInsights: null,
      };

      mergedCache[activeChildId] = {
        details: activeChildProgress?.details ?? currentEntry.details,
        aiInsights: activeChildProgress?.aiInsights ?? currentEntry.aiInsights,
        activities: activeChildActivities?.activities ?? currentEntry.activities,
        safety: activeChildMonitoring?.safety ?? currentEntry.safety,
        history: activeChildMonitoring?.searchHistory ?? currentEntry.history,
        screenTime: activeChildProgress?.details?.screenTime ?? currentEntry.screenTime,
      };
    }

    initialLinkedChildren.forEach((child) => {
      const childId = child.user_id;
      if (childId === activeChildId) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const progress = queryClient.getQueryData<any>(["parent-dashboard", childId, "progress"]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const activities = queryClient.getQueryData<any>(["parent-dashboard", childId, "activities"]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const monitoring = queryClient.getQueryData<any>(["parent-dashboard", childId, "monitoring"]);

      if (progress || activities || monitoring) {
        const currentEntry = mergedCache[childId] || {
          details: null,
          safety: null,
          history: [],
          activities: [],
          screenTime: null,
          aiInsights: null,
        };

        mergedCache[childId] = {
          details: progress?.details ?? currentEntry.details,
          aiInsights: progress?.aiInsights ?? currentEntry.aiInsights,
          activities: activities?.activities ?? currentEntry.activities,
          safety: monitoring?.safety ?? currentEntry.safety,
          history: monitoring?.searchHistory ?? currentEntry.history,
          screenTime: progress?.details?.screenTime ?? currentEntry.screenTime,
        };
      }
    });

    return mergedCache;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeChildId,
    progressData,
    activitiesData,
    monitoringData,
    initialCache,
    queryClient,
    initialLinkedChildren,
  ]);

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
    (childId: string) => {
      const params = new URLSearchParams(window.location.search);
      if (childId) {
        params.set("childId", childId);
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
        queryKey: ["parent-dashboard", childId, "progress"],
        queryFn: () => fetchProgress(childId),
        staleTime: Infinity,
      });
      queryClient.prefetchQuery({
        queryKey: ["parent-dashboard", childId, "activities"],
        queryFn: () => fetchActivities(childId),
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
    const previous = notificationsRef.current;
    // Optimistic Update
    updateNotifications(previous.map((n) => ({ ...n, is_read: true })));

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      const { error } = await supabase
        .from("parent_notifications")
        .update({ is_read: true })
        .eq("parent_id", session.user.id)
        .eq("is_read", false);

      if (error) {
        throw error;
      }
    } catch (err) {
      console.error("Failed to mark all read:", err);
      updateNotifications(previous);
    }
  }, [updateNotifications]);

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
