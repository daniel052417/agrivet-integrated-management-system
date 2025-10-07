interface SyncStatus {
  isOnline: boolean
  lastSyncTime: number | null
  pendingChanges: number
  isSyncing: boolean
}

interface SyncConfig {
  maxRetries: number
  retryDelay: number
  syncInterval: number
  conflictResolution: 'server' | 'client' | 'merge'
}

class SyncService {
  private status: SyncStatus = {
    isOnline: navigator.onLine,
    lastSyncTime: null,
    pendingChanges: 0,
    isSyncing: false
  }

  private config: SyncConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    syncInterval: 30000, // 30 seconds
    conflictResolution: 'server'
  }

  private listeners: Set<(status: SyncStatus) => void> = new Set()
  private syncQueue: Array<() => Promise<void>> = []
  private retryCount = 0

  constructor() {
    this.setupEventListeners()
    this.startPeriodicSync()
  }

  private setupEventListeners() {
    // Online/offline detection
    window.addEventListener('online', () => {
      this.status.isOnline = true
      this.notifyListeners()
      this.processSyncQueue()
    })

    window.addEventListener('offline', () => {
      this.status.isOnline = false
      this.notifyListeners()
    })

    // Page visibility change - sync when page becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.status.isOnline) {
        this.triggerSync()
      }
    })
  }

  private startPeriodicSync() {
    setInterval(() => {
      if (this.status.isOnline && !this.status.isSyncing) {
        this.triggerSync()
      }
    }, this.config.syncInterval)
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.status))
  }

  public subscribe(listener: (status: SyncStatus) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  public getStatus(): SyncStatus {
    return { ...this.status }
  }

  public async triggerSync(): Promise<void> {
    if (!this.status.isOnline || this.status.isSyncing) {
      return
    }

    this.status.isSyncing = true
    this.notifyListeners()

    try {
      console.log('🔄 SyncService: Starting sync...')
      
      // Process sync queue
      await this.processSyncQueue()
      
      this.status.lastSyncTime = Date.now()
      this.retryCount = 0
      
      console.log('✅ SyncService: Sync completed successfully')
    } catch (error) {
      console.error('❌ SyncService: Sync failed:', error)
      this.handleSyncError(error)
    } finally {
      this.status.isSyncing = false
      this.notifyListeners()
    }
  }

  private async processSyncQueue(): Promise<void> {
    const queue = [...this.syncQueue]
    this.syncQueue = []

    for (const syncTask of queue) {
      try {
        await syncTask()
        this.status.pendingChanges = Math.max(0, this.status.pendingChanges - 1)
      } catch (error) {
        console.error('❌ SyncService: Sync task failed:', error)
        // Re-queue failed tasks
        this.syncQueue.push(syncTask)
        this.status.pendingChanges++
      }
    }
  }

  private handleSyncError(error: any) {
    this.retryCount++
    
    if (this.retryCount < this.config.maxRetries) {
      console.log(`🔄 SyncService: Retrying in ${this.config.retryDelay}ms (attempt ${this.retryCount})`)
      setTimeout(() => {
        this.triggerSync()
      }, this.config.retryDelay)
    } else {
      console.error('❌ SyncService: Max retries exceeded, giving up')
      this.retryCount = 0
    }
  }

  public queueSync(syncTask: () => Promise<void>) {
    this.syncQueue.push(syncTask)
    this.status.pendingChanges++
    this.notifyListeners()

    // Trigger immediate sync if online
    if (this.status.isOnline) {
      this.triggerSync()
    }
  }

  public async resolveConflict<T>(
    localData: T,
    serverData: T,
    conflictKey: string
  ): Promise<T> {
    console.log(`🔀 SyncService: Resolving conflict for ${conflictKey}`)

    switch (this.config.conflictResolution) {
      case 'server':
        console.log('🔀 SyncService: Using server data')
        return serverData

      case 'client':
        console.log('🔀 SyncService: Using client data')
        return localData

      case 'merge':
        console.log('🔀 SyncService: Attempting to merge data')
        return this.mergeData(localData, serverData)

      default:
        return serverData
    }
  }

  private mergeData<T>(localData: T, serverData: T): T {
    // Simple merge strategy - in production, you'd want more sophisticated merging
    if (typeof localData === 'object' && typeof serverData === 'object') {
      return { ...serverData, ...localData }
    }
    return serverData
  }

  public setConfig(newConfig: Partial<SyncConfig>) {
    this.config = { ...this.config, ...newConfig }
  }

  public clearCache() {
    console.log('🧹 SyncService: Clearing cache...')
    this.status.lastSyncTime = null
    this.status.pendingChanges = 0
    this.syncQueue = []
    this.notifyListeners()
  }
}

export const syncService = new SyncService()
export type { SyncStatus, SyncConfig }




