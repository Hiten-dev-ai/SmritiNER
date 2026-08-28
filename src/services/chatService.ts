// Client-Side Chat Service: Handles REST API calls, local Dexie caching,
// and idempotent offline outbox synchronization for Supervised Patient Messaging.

import { api } from './api';
import { db } from './db';
import type {
  ChatMessage,
  ChatOutboxItem,
  ConversationAuditEvent,
  ConversationSummary,
  ModerationFlag,
  PatientConnection,
} from '../types';

export const chatService = {
  // -----------------------------------------------------------------
  // CONNECTIONS & INVITES
  // -----------------------------------------------------------------
  async listConnections(patientId: string): Promise<PatientConnection[]> {
    try {
      const res = await api.get<{ connections: PatientConnection[] }>(
        `/api/patients/${patientId}/chat/connections`
      );
      return res.connections || [];
    } catch {
      return [];
    }
  },

  async createInvite(patientId: string) {
    return api.post<{ invite: { id: string; tokenCode: string; expiresAt: string; createdAt: string } }>(
      `/api/patients/${patientId}/chat/invites`,
      {}
    );
  },

  async revokeInvite(patientId: string, inviteId: string) {
    return api.delete<{ success: boolean }>(
      `/api/patients/${patientId}/chat/invites/${inviteId}`
    );
  },

  async redeemInvite(patientId: string, code: string) {
    return api.post<{ connection: PatientConnection }>(
      `/api/patients/${patientId}/chat/invites/redeem`,
      { code }
    );
  },

  async acknowledgeConnection(patientId: string, connectionId: string) {
    return api.post<{ connection: PatientConnection }>(
      `/api/patients/${patientId}/chat/connections/${connectionId}/acknowledge`,
      {}
    );
  },

  async muteConnection(patientId: string, connectionId: string) {
    return api.post<{ success: boolean }>(
      `/api/patients/${patientId}/chat/connections/${connectionId}/mute`,
      {}
    );
  },

  async unmuteConnection(patientId: string, connectionId: string) {
    return api.post<{ success: boolean }>(
      `/api/patients/${patientId}/chat/connections/${connectionId}/unmute`,
      {}
    );
  },

  async blockConnection(patientId: string, connectionId: string, reason?: string) {
    return api.post<{ success: boolean }>(
      `/api/patients/${patientId}/chat/connections/${connectionId}/block`,
      { reason: reason || 'Caregiver safety block' }
    );
  },

  // -----------------------------------------------------------------
  // CONVERSATIONS & MESSAGES
  // -----------------------------------------------------------------
  async listConversations(patientId: string): Promise<ConversationSummary[]> {
    try {
      const res = await api.get<{ conversations: ConversationSummary[] }>(
        `/api/patients/${patientId}/chat/conversations`
      );
      const conversations = res.conversations || [];
      // Cache in Dexie for offline lookup
      for (const conv of conversations) {
        await db.chatConversations.put(conv).catch(() => undefined);
      }
      return conversations;
    } catch {
      // Offline fallback from Dexie
      const cached = await db.chatConversations.toArray().catch(() => []);
      return cached.filter((c: any) => c.connection?.myPatientId === patientId);
    }
  },

  async getMessages(
    patientId: string,
    conversationId: string,
    options?: { cursor?: any; limit?: number }
  ): Promise<{ messages: ChatMessage[]; nextCursor: any }> {
    try {
      const params = new URLSearchParams();
      if (options?.cursor) params.set('cursor', JSON.stringify(options.cursor));
      if (options?.limit) params.set('limit', String(options.limit));

      const query = params.toString() ? `?${params.toString()}` : '';
      const res = await api.get<{ messages: ChatMessage[]; nextCursor: any }>(
        `/api/patients/${patientId}/chat/conversations/${conversationId}/messages${query}`
      );
      const serverMessages = res.messages || [];

      // Cache server messages in Dexie
      for (const msg of serverMessages) {
        await db.chatMessages.put(msg).catch(() => undefined);
      }

      // Fetch any local pending outbox messages for this conversation
      const pendingOutbox = await db.chatOutbox
        .where('conversationId')
        .equals(conversationId)
        .toArray()
        .catch(() => []);

      const pendingMessages: ChatMessage[] = pendingOutbox.map((item) => ({
        id: item.id,
        conversationId: item.conversationId,
        senderPatientId: item.patientId,
        recipientPatientId: '',
        messageType: item.payload.messageType,
        templateKey: item.payload.templateKey,
        catalogVersion: item.payload.catalogVersion,
        reactionCode: item.payload.reactionCode,
        compositionMethod: item.payload.compositionMethod,
        clientEventId: item.id,
        clientCreatedAt: item.payload.clientCreatedAt,
        recipientVisibility: 'visible',
        createdAt: item.createdAt,
        status: item.status === 'rejected' ? 'rejected' : 'pending-local',
        rejectionReason: item.lastError || undefined,
      }));

      // Combine server messages with pending local ones
      const combined = [...serverMessages, ...pendingMessages];
      return { messages: combined, nextCursor: res.nextCursor };
    } catch {
      // Offline fallback: load from Dexie cache + outbox
      const cached = await db.chatMessages
        .where('conversationId')
        .equals(conversationId)
        .toArray()
        .catch(() => []);

      const pendingOutbox = await db.chatOutbox
        .where('conversationId')
        .equals(conversationId)
        .toArray()
        .catch(() => []);

      const pendingMessages: ChatMessage[] = pendingOutbox.map((item) => ({
        id: item.id,
        conversationId: item.conversationId,
        senderPatientId: item.patientId,
        recipientPatientId: '',
        messageType: item.payload.messageType,
        templateKey: item.payload.templateKey,
        catalogVersion: item.payload.catalogVersion,
        reactionCode: item.payload.reactionCode,
        compositionMethod: item.payload.compositionMethod,
        clientEventId: item.id,
        clientCreatedAt: item.payload.clientCreatedAt,
        recipientVisibility: 'visible',
        createdAt: item.createdAt,
        status: 'pending-local',
      }));

      return { messages: [...cached, ...pendingMessages], nextCursor: null };
    }
  },

  async queueOrSendMessage(
    patientId: string,
    conversationId: string,
    expectedConnectionRevision: number,
    payload: {
      messageType: 'template' | 'reaction';
      templateKey?: string;
      catalogVersion?: number;
      reactionCode?: string;
      compositionMethod: 'touch' | 'voice-selection';
    }
  ): Promise<{ message: ChatMessage; sentOnline: boolean }> {
    const clientEventId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    const outboxItem: ChatOutboxItem = {
      id: clientEventId,
      patientId,
      conversationId,
      expectedConnectionRevision,
      payload: {
        ...payload,
        clientCreatedAt: now,
      },
      priority: 'normal',
      status: 'pending',
      attempts: 0,
      nextRetryAt: now,
      createdAt: now,
    };

    // Store in outbox first (offline-first invariant)
    await db.chatOutbox.put(outboxItem).catch(() => undefined);

    try {
      const res = await api.post<{ message: ChatMessage }>(
        `/api/patients/${patientId}/chat/conversations/${conversationId}/messages`,
        {
          ...payload,
          clientEventId,
          clientCreatedAt: now,
          expectedConnectionRevision,
        }
      );

      // Successfully accepted on server: remove from outbox and cache accepted message
      await db.chatOutbox.delete(clientEventId).catch(() => undefined);
      await db.chatMessages.put(res.message).catch(() => undefined);
      return { message: res.message, sentOnline: true };
    } catch (err: any) {
      const message = err instanceof Error ? err.message : 'Network failure';
      const isPermanent = /Invalid|blocked|not active|changed|participant/i.test(message);

      if (isPermanent) {
        await db.chatOutbox.update(clientEventId, { status: 'rejected', lastError: message });
      } else {
        await db.chatOutbox.update(clientEventId, { attempts: 1, lastError: message });
      }

      const localPending: ChatMessage = {
        id: clientEventId,
        conversationId,
        senderPatientId: patientId,
        recipientPatientId: '',
        messageType: payload.messageType,
        templateKey: payload.templateKey,
        catalogVersion: payload.catalogVersion || 1,
        reactionCode: payload.reactionCode,
        compositionMethod: payload.compositionMethod,
        clientEventId,
        clientCreatedAt: now,
        recipientVisibility: 'visible',
        createdAt: now,
        status: isPermanent ? 'rejected' : 'pending-local',
        rejectionReason: isPermanent ? message : undefined,
      };

      return { message: localPending, sentOnline: false };
    }
  },

  async syncOutbox(patientId: string): Promise<number> {
    const pending = await db.chatOutbox
      .where('patientId')
      .equals(patientId)
      .and((item) => item.status === 'pending' || item.status === 'failed')
      .toArray()
      .catch(() => []);

    if (pending.length === 0) return 0;

    const operations = pending.map((item) => ({
      conversationId: item.conversationId,
      clientEventId: item.id,
      payload: {
        ...item.payload,
        expectedConnectionRevision: item.expectedConnectionRevision,
      },
    }));

    try {
      const res = await api.post<{
        results: Array<{ clientEventId: string; status: 'accepted' | 'rejected' | 'failed'; message?: ChatMessage; error?: string }>;
      }>(`/api/patients/${patientId}/chat/sync`, { operations });

      let acceptedCount = 0;
      for (const r of res.results || []) {
        if (r.status === 'accepted' && r.message) {
          await db.chatOutbox.delete(r.clientEventId).catch(() => undefined);
          await db.chatMessages.put(r.message).catch(() => undefined);
          acceptedCount += 1;
        } else if (r.status === 'rejected') {
          await db.chatOutbox.update(r.clientEventId, { status: 'rejected', lastError: r.error });
        } else {
          await db.chatOutbox.update(r.clientEventId, { status: 'failed', lastError: r.error });
        }
      }
      return acceptedCount;
    } catch {
      return 0;
    }
  },

  async cancelPendingMessage(clientEventId: string) {
    await db.chatOutbox.delete(clientEventId).catch(() => undefined);
  },

  async clearChatCache() {
    await Promise.all([
      db.chatConversations.clear().catch(() => undefined),
      db.chatMessages.clear().catch(() => undefined),
      db.chatOutbox.clear().catch(() => undefined),
    ]);
  },

  // -----------------------------------------------------------------
  // MODERATION & AUDIT
  // -----------------------------------------------------------------
  async raiseFlag(
    patientId: string,
    conversationId: string,
    payload: { messageId?: string; category: string; notes?: string }
  ) {
    return api.post<{ flag: ModerationFlag }>(
      `/api/patients/${patientId}/chat/conversations/${conversationId}/flags`,
      payload
    );
  },

  async listFlags(patientId: string, status?: string): Promise<ModerationFlag[]> {
    const query = status ? `?status=${status}` : '';
    const res = await api.get<{ flags: ModerationFlag[] }>(
      `/api/patients/${patientId}/chat/moderation-flags${query}`
    );
    return res.flags || [];
  },

  async updateFlag(
    patientId: string,
    flagId: string,
    payload: { status: string; resolutionNotes?: string }
  ) {
    return api.patch<{ flag: ModerationFlag }>(
      `/api/patients/${patientId}/chat/moderation-flags/${flagId}`,
      payload
    );
  },

  async hideMessage(patientId: string, conversationId: string, messageId: string, reason?: string) {
    return api.post<{ success: boolean }>(
      `/api/patients/${patientId}/chat/conversations/${conversationId}/messages/${messageId}/hide`,
      { reason: reason || 'Caregiver hidden' }
    );
  },

  async releaseHeldMessage(patientId: string, conversationId: string, messageId: string) {
    return api.post<{ success: boolean }>(
      `/api/patients/${patientId}/chat/conversations/${conversationId}/messages/${messageId}/release`,
      {}
    );
  },

  async getAuditEvents(patientId: string, conversationId: string): Promise<ConversationAuditEvent[]> {
    const res = await api.get<{ events: ConversationAuditEvent[] }>(
      `/api/patients/${patientId}/chat/conversations/${conversationId}/audit`
    );
    return res.events || [];
  },
};
