import { db } from './db';

export class SyncService {
  private isOnlineSimulated: boolean = true;
  private listeners: ((online: boolean, pendingCount: number) => void)[] = [];

  constructor() {
    this.isOnlineSimulated = typeof navigator !== 'undefined' ? navigator.onLine : true;

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
    }
  }

  isOnline(): boolean {
    return this.isOnlineSimulated;
  }

  setSimulatedNetworkStatus(online: boolean) {
    this.isOnlineSimulated = online;
    this.notifyListeners();
  }

  async getPendingSyncCount(): Promise<number> {
    const unsyncedSessions = await db.gameSessions.filter((s) => !s.synced).count();
    const unsyncedReminders = await db.reminders.filter((r) => !r.synced).count();
    const unsyncedAsha = await db.ashaScreenings.filter((a) => !a.synced).count();
    const unsyncedHydration = await db.hydrationLogs.filter((h) => !h.synced).count();

    return unsyncedSessions + unsyncedReminders + unsyncedAsha + unsyncedHydration;
  }

  async performSync(): Promise<{ success: boolean; syncedItemsCount: number }> {
    // No remote backend is configured in this prototype. Records intentionally
    // remain marked as local/pending instead of simulating a successful upload.
    return { success: false, syncedItemsCount: 0 };
  }

  subscribe(listener: (online: boolean, pendingCount: number) => void): () => void {
    this.listeners.push(listener);
    this.notifyListeners();
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private async notifyListeners() {
    const pending = await this.getPendingSyncCount();
    this.listeners.forEach((l) => l(this.isOnlineSimulated, pending));
  }

  private handleNetworkChange(online: boolean) {
    this.isOnlineSimulated = online;
    this.notifyListeners();
  }
}

export const syncService = new SyncService();
