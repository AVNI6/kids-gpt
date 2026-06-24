import * as actions from "@/lib/services/parent/parent-dashboard.actions";
import { getDailyScreenTime } from "@/lib/services/shared/screentime.actions";

export class DashboardService {
  static async getProfile() {
    return actions.getCurrentDashboardProfile();
  }

  static async getLinkedChildren() {
    return actions.getLinkedChildren();
  }

  static async getChildDetails(childId: string) {
    return actions.getChildDetails(childId);
  }

  static async getChildSafety(childId: string) {
    return actions.getChildSafetyAndUsage(childId);
  }

  static async getSearchHistory(childId: string) {
    return actions.getParentSearchHistory(childId);
  }

  static async getActivities(childId: string) {
    return actions.getParentActivities(childId);
  }

  static async getScreenTime(childId: string) {
    return getDailyScreenTime(childId);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async getAiInsights(childId: string, preloadedDetails?: any) {
    return actions.getChildAiInsights(childId, preloadedDetails);
  }

  static async getNotifications() {
    return actions.getParentNotifications();
  }

  static async markNotificationRead(id: string) {
    return actions.markNotificationAsRead(id);
  }

  static async markAllNotificationsRead() {
    return actions.markAllNotificationsAsRead();
  }

  static async linkChild(email: string) {
    return actions.linkByEmail(email);
  }

  static async getSentPendingInvitations() {
    return actions.getSentPendingInvitations();
  }

  static async cancelChildInvitation(inviteId: string) {
    return actions.cancelChildInvitation(inviteId);
  }

  static async updateProfile(formData: FormData) {
    return actions.updateParentProfile(formData);
  }
}
