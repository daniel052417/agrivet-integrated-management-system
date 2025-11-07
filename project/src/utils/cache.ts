/**
 * Advanced Caching Utilities
 * 
 * Provides in-memory and persistent caching strategies
 */

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
  storage?: 'memory' | 'localStorage' | 'sessionStorage';
}

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  expiresAt: number;
}

class CacheManager {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  private defaultMaxSize = 100;

  /**
   * Set a value in cache
   */
  set<T>(key: string, value: T, options: CacheOptions = {}): void {
    const {
      ttl = this.defaultTTL,
      maxSize = this.defaultMaxSize,
      storage = 'memory',
    } = options;

    const timestamp = Date.now();
    const expiresAt = timestamp + ttl;

    const entry: CacheEntry<T> = {
      value,
      timestamp,
      expiresAt,
    };

    // Store in memory
    if (storage === 'memory') {
      // Check if we need to evict old entries
      if (this.memoryCache.size >= maxSize) {
        this.evictOldest();
      }
      this.memoryCache.set(key, entry);
    } else {
      // Store in browser storage
      try {
        const storageObj = storage === 'localStorage' ? localStorage : sessionStorage;
        storageObj.setItem(
          `cache_${key}`,
          JSON.stringify({
            ...entry,
            value: JSON.stringify(value),
          })
        );
      } catch (error) {
        // Storage might be full or unavailable
        console.warn('Failed to store in browser storage:', error);
        // Fallback to memory
        this.memoryCache.set(key, entry);
      }
    }
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string, storage: 'memory' | 'localStorage' | 'sessionStorage' = 'memory'): T | null {
    if (storage === 'memory') {
      const entry = this.memoryCache.get(key) as CacheEntry<T> | undefined;
      
      if (!entry) {
        return null;
      }

      // Check if expired
      if (Date.now() > entry.expiresAt) {
        this.memoryCache.delete(key);
        return null;
      }

      return entry.value;
    } else {
      try {
        const storageObj = storage === 'localStorage' ? localStorage : sessionStorage;
        const stored = storageObj.getItem(`cache_${key}`);
        
        if (!stored) {
          return null;
        }

        const entry = JSON.parse(stored) as CacheEntry<string>;
        
        // Check if expired
        if (Date.now() > entry.expiresAt) {
          storageObj.removeItem(`cache_${key}`);
          return null;
        }

        return JSON.parse(entry.value as any) as T;
      } catch (error) {
        console.warn('Failed to read from browser storage:', error);
        return null;
      }
    }
  }

  /**
   * Check if a key exists in cache
   */
  has(key: string, storage: 'memory' | 'localStorage' | 'sessionStorage' = 'memory'): boolean {
    if (storage === 'memory') {
      const entry = this.memoryCache.get(key);
      if (!entry) return false;
      
      // Check if expired
      if (Date.now() > entry.expiresAt) {
        this.memoryCache.delete(key);
        return false;
      }
      
      return true;
    } else {
      return this.get(key, storage) !== null;
    }
  }

  /**
   * Delete a value from cache
   */
  delete(key: string, storage?: 'memory' | 'localStorage' | 'sessionStorage'): void {
    if (!storage || storage === 'memory') {
      this.memoryCache.delete(key);
    }
    
    if (!storage || storage === 'localStorage') {
      try {
        localStorage.removeItem(`cache_${key}`);
      } catch (error) {
        // Ignore errors
      }
    }
    
    if (!storage || storage === 'sessionStorage') {
      try {
        sessionStorage.removeItem(`cache_${key}`);
      } catch (error) {
        // Ignore errors
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(storage?: 'memory' | 'localStorage' | 'sessionStorage'): void {
    if (!storage || storage === 'memory') {
      this.memoryCache.clear();
    }
    
    if (!storage || storage === 'localStorage') {
      try {
        Object.keys(localStorage)
          .filter(key => key.startsWith('cache_'))
          .forEach(key => localStorage.removeItem(key));
      } catch (error) {
        // Ignore errors
      }
    }
    
    if (!storage || storage === 'sessionStorage') {
      try {
        Object.keys(sessionStorage)
          .filter(key => key.startsWith('cache_'))
          .forEach(key => sessionStorage.removeItem(key));
      } catch (error) {
        // Ignore errors
      }
    }
  }

  /**
   * Clean expired entries
   */
  cleanExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.memoryCache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.memoryCache.delete(key));

    // Also clean browser storage
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith('cache_'))
        .forEach(key => {
          try {
            const stored = localStorage.getItem(key);
            if (stored) {
              const entry = JSON.parse(stored) as CacheEntry<any>;
              if (now > entry.expiresAt) {
                localStorage.removeItem(key);
              }
            }
          } catch {
            // Invalid entry, remove it
            localStorage.removeItem(key);
          }
        });
    } catch (error) {
      // Ignore errors
    }
  }

  /**
   * Evict oldest entry
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    this.memoryCache.forEach((entry, key) => {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    keys: string[];
  } {
    return {
      size: this.memoryCache.size,
      maxSize: this.defaultMaxSize,
      keys: Array.from(this.memoryCache.keys()),
    };
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();

// Clean expired entries periodically
if (typeof window !== 'undefined') {
  setInterval(() => {
    cacheManager.cleanExpired();
  }, 60 * 1000); // Every minute
}

/**
 * Create a cached function
 */
export function createCachedFunction<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  options: CacheOptions = {}
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator(...args);
    const cached = cacheManager.get<ReturnType<T>>(key, options.storage || 'memory');
    
    if (cached !== null) {
      return cached;
    }

    const result = fn(...args);
    
    // Handle promises
    if (result instanceof Promise) {
      return result.then((value) => {
        cacheManager.set(key, value, options);
        return value;
      }) as ReturnType<T>;
    }

    cacheManager.set(key, result, options);
    return result;
  }) as T;
}

