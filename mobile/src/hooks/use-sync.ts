import { useEffect, useRef, useState } from 'react'
import NetInfo, { NetInfoState } from '@react-native-community/netinfo'
import { database } from '@/db/database'
import { api, syncApi } from '@/api/client'
import { useAuthStore } from '@/store/auth-store'
import { SyncChange, SyncResponse } from '@/types'
import { getDeviceId } from '@/lib/utils'

export function useSync() {
  const { user, isAuthenticated } = useAuthStore()
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Monitor network state
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const online = state.isConnected ?? false
      const wasOffline = !isOnline
      setIsOnline(online)

      // Trigger sync when coming back online
      if (wasOffline && online && isAuthenticated) {
        triggerSync()
      }
    })

    return () => unsubscribe()
  }, [isOnline, isAuthenticated])

  // Periodic sync every 5 minutes when online
  useEffect(() => {
    if (isOnline && isAuthenticated) {
      syncIntervalRef.current = setInterval(() => {
        triggerSync()
      }, 5 * 60 * 1000)
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
      }
    }
  }, [isOnline, isAuthenticated])

  const triggerSync = async () => {
    if (!isAuthenticated || !user || !isOnline) return

    setIsSyncing(true)
    setSyncError(null)

    try {
      // Step 1: Push local pending changes to server
      const pendingChanges = await getPendingChanges()

      if (pendingChanges.length > 0) {
        const pushResponse: SyncResponse = await syncApi.push({
          changes: pendingChanges,
          deviceId: getDeviceId(),
          schoolId: user.schoolId,
        })

        // Step 2: Apply server response (confirmations, conflicts)
        await applySyncResponse(pushResponse)
      }

      // Step 3: Pull latest changes from server
      await pullChanges()

      setLastSyncTime(new Date())
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Sync failed'
      console.error('Sync error:', message)
      setSyncError(message)
    } finally {
      setIsSyncing(false)
    }
  }

  return {
    triggerSync,
    isOnline,
    isSyncing,
    lastSyncTime,
    syncError,
    clearError: () => setSyncError(null),
  }
}

// ─── Sync Helpers ──────────────────────────────────────────────────────────

async function getPendingChanges(): Promise<SyncChange[]> {
  const changes: SyncChange[] = []
  const tables = [
    'students',
    'teachers',
    'assessments',
    'assessment_scores',
    'attendance',
  ]

  for (const table of tables) {
    try {
      const collection = database.collections.get(table)
      const records = await collection
        .query(
          // We need to import Q from watermelondb for queries
          // For now, we fetch all and filter in memory
        )
        .fetch()

      for (const record of records) {
        const raw = record._raw as Record<string, unknown>
        const syncStatus = raw.sync_status as string

        if (syncStatus === 'synced') continue

        changes.push({
          table,
          recordId: record.id,
          action:
            syncStatus === 'created'
              ? 'CREATE'
              : syncStatus === 'deleted'
                ? 'DELETE'
                : 'UPDATE',
          data: raw,
          timestamp:
            typeof raw.updated_at === 'number'
              ? raw.updated_at
              : Date.now(),
        })
      }
    } catch {
      // Table might not exist yet
      console.warn(`Failed to query table: ${table}`)
    }
  }

  return changes
}

async function applySyncResponse(response: SyncResponse): Promise<void> {
  // Mark confirmed records as synced
  for (const confirmed of response.confirmed) {
    try {
      const collection = database.collections.get(confirmed.table)
      const record = await collection.find(confirmed.recordId)
      await record.update((r: Record<string, unknown>) => {
        r.sync_status = 'synced'
      })
    } catch {
      // Record might have been deleted locally
    }
  }

  // Handle conflicts
  for (const conflict of response.conflicts) {
    try {
      const collection = database.collections.get(conflict.table)
      const record = await collection.find(conflict.recordId)

      // Last-Write-Wins strategy: keep the server version
      await record.update((r: Record<string, unknown>) => {
        // Apply server data, but keep local sync_status
        Object.assign(r, conflict.serverData)
        r.sync_status = 'synced'
      })
    } catch {
      // Record not found locally - create it with server data
      const collection = database.collections.get(conflict.table)
      await collection.create((r: Record<string, unknown>) => {
        Object.assign(r, conflict.serverData)
        r.sync_status = 'synced'
      })
    }
  }

  // Apply server changes
  for (const change of response.changes) {
    try {
      const collection = database.collections.get(change.table)

      if (change.action === 'DELETE') {
        const record = await collection.find(change.recordId)
        await record.destroyPermanently()
      } else {
        // Check if record exists locally
        const existing = await collection.find(change.recordId).catch(() => null)

        if (existing) {
          await existing.update((r: Record<string, unknown>) => {
            Object.assign(r, change.data)
            r.sync_status = 'synced'
          })
        } else {
          await collection.create((r: Record<string, unknown>) => {
            Object.assign(r, change.data)
            r.sync_status = 'synced'
          })
        }
      }
    } catch {
      console.warn(`Failed to apply change: ${change.table}/${change.recordId}`)
    }
  }
}

async function pullChanges(): Promise<void> {
  // Get the last sync timestamp from storage or use a default
  // In a real app, store this in AsyncStorage/SecureStore
  const since = Date.now() - 24 * 60 * 60 * 1000 // Last 24 hours

  try {
    const response: SyncResponse = await syncApi.pull(since)
    await applySyncResponse(response)
  } catch {
    // Pull might fail if server doesn't have sync endpoints yet
    console.warn('Pull sync failed - server may not support sync endpoints yet')
  }
}