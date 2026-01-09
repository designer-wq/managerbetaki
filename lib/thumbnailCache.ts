// Thumbnail Cache Manager using IndexedDB
// Stores thumbnails for 7 days to prevent Google Drive rate limits (429 errors)

const DB_NAME = 'FilesPageCache';
const STORE_NAME = 'thumbnails';
const DB_VERSION = 1;
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

interface CachedThumbnail {
    fileId: string;
    blob: Blob;
    timestamp: number;
}

class ThumbnailCache {
    private db: IDBDatabase | null = null;

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'fileId' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }

    async get(fileId: string): Promise<string | null> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(fileId);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const result = request.result as CachedThumbnail | undefined;

                if (!result) {
                    resolve(null);
                    return;
                }

                // Check if cache is still valid (within 7 days)
                const now = Date.now();
                if (now - result.timestamp > CACHE_DURATION) {
                    // Cache expired, delete it
                    this.delete(fileId);
                    resolve(null);
                    return;
                }

                // Convert blob to data URL
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = () => reject(reader.error);
                reader.readAsDataURL(result.blob);
            };
        });
    }

    async set(fileId: string, blob: Blob): Promise<void> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            const data: CachedThumbnail = {
                fileId,
                blob,
                timestamp: Date.now()
            };

            const request = store.put(data);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    async delete(fileId: string): Promise<void> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(fileId);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    async cleanExpired(): Promise<void> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const index = store.index('timestamp');
            const request = index.openCursor();

            const now = Date.now();
            const expiredKeys: string[] = [];

            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest).result;
                if (cursor) {
                    const data = cursor.value as CachedThumbnail;
                    if (now - data.timestamp > CACHE_DURATION) {
                        expiredKeys.push(data.fileId);
                    }
                    cursor.continue();
                } else {
                    // Delete all expired entries
                    Promise.all(expiredKeys.map(key => this.delete(key)))
                        .then(() => resolve())
                        .catch(reject);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    async clear(): Promise<void> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    async getCacheStats(): Promise<{ count: number; totalSize: number; oldestTimestamp: number }> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const items = request.result as CachedThumbnail[];
                const count = items.length;
                const totalSize = items.reduce((sum, item) => sum + item.blob.size, 0);
                const oldestTimestamp = items.length > 0
                    ? Math.min(...items.map(item => item.timestamp))
                    : Date.now();

                resolve({ count, totalSize, oldestTimestamp });
            };
        });
    }
}

// Export singleton instance
export const thumbnailCache = new ThumbnailCache();

// Helper to fetch and cache thumbnail
export async function fetchAndCacheThumbnail(fileId: string): Promise<string> {
    // Try to get from cache first
    try {
        const cached = await thumbnailCache.get(fileId);
        if (cached) {
            console.log(`✅ Thumbnail loaded from cache: ${fileId}`);
            return cached;
        }
    } catch (error) {
        console.error('Error reading from cache:', error);
    }

    // Not in cache or cache read failed, fetch from Google Drive
    const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w600`;

    try {
        const response = await fetch(thumbnailUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch thumbnail: ${response.status}`);
        }

        const blob = await response.blob();

        // Store in cache for future use
        try {
            await thumbnailCache.set(fileId, blob);
            console.log(`💾 Thumbnail cached: ${fileId}`);
        } catch (error) {
            console.error('Error saving to cache:', error);
        }

        // Convert to data URL for display
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error(`❌ Failed to fetch thumbnail for ${fileId}:`, error);
        throw error;
    }
}

// Clean expired cache on page load
thumbnailCache.cleanExpired().catch(console.error);

export default thumbnailCache;
