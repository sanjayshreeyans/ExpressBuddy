/**
 * Memory Utilities for ExpressBuddy Pico Avatar
 * 
 * This module provides utilities for managing child-specific memories
 * in the live chat interface using localStorage.
 */

export interface MemoryEntry {
  key: string;
  value: string;
  timestamp: string;
}

export interface MemoryStats {
  totalMemories: number;
  oldestMemory?: string;
  newestMemory?: string;
  memoryKeys: string[];
}

/**
 * Store a memory about the child
 */
export function storeMemory(key: string, value: string): boolean {
  try {
    const memoryKey = `memory_${key}`;
    const memoryData = {
      value,
      timestamp: new Date().toISOString(),
      key
    };
    
    localStorage.setItem(memoryKey, JSON.stringify(memoryData));
    console.log(`💾 Memory stored: ${key} = ${value}`);
    return true;
  } catch (error) {
    console.error('❌ Error storing memory:', error);
    return false;
  }
}

/**
 * Retrieve all memories about the child
 */
export function getAllMemories(): { [key: string]: string } {
  const memories: { [key: string]: string } = {};
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('memory_')) {
        const memoryKey = key.replace('memory_', '');
        const memoryData = localStorage.getItem(key);
        
        if (memoryData) {
          try {
            // Try to parse as JSON (new format)
            const parsed = JSON.parse(memoryData);
            memories[memoryKey] = parsed.value || parsed;
          } catch {
            // Fallback to plain string (legacy format)
            memories[memoryKey] = memoryData;
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error retrieving memories:', error);
  }
  
  return memories;
}

/**
 * Get detailed memory entries with timestamps
 */
export function getDetailedMemories(): MemoryEntry[] {
  const entries: MemoryEntry[] = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('memory_')) {
        const memoryKey = key.replace('memory_', '');
        const memoryData = localStorage.getItem(key);
        
        if (memoryData) {
          try {
            // Try to parse as JSON (new format)
            const parsed = JSON.parse(memoryData);
            entries.push({
              key: memoryKey,
              value: parsed.value || parsed,
              timestamp: parsed.timestamp || new Date().toISOString()
            });
          } catch {
            // Fallback to plain string (legacy format)
            entries.push({
              key: memoryKey,
              value: memoryData,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error retrieving detailed memories:', error);
  }
  
  return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Get memory statistics
 */
export function getMemoryStats(): MemoryStats {
  const entries = getDetailedMemories();
  
  return {
    totalMemories: entries.length,
    oldestMemory: entries.length > 0 ? entries[entries.length - 1].timestamp : undefined,
    newestMemory: entries.length > 0 ? entries[0].timestamp : undefined,
    memoryKeys: entries.map(e => e.key)
  };
}

/**
 * Clear all memories (for testing or reset)
 */
export function clearAllMemories(): number {
  let cleared = 0;
  
  try {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('memory_')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      cleared++;
    });
    
    console.log(`🧹 Cleared ${cleared} memories`);
  } catch (error) {
    console.error('❌ Error clearing memories:', error);
  }
  
  return cleared;
}

/**
 * Remove a specific memory
 */
export function removeMemory(key: string): boolean {
  try {
    const memoryKey = `memory_${key}`;
    localStorage.removeItem(memoryKey);
    console.log(`🗑️ Removed memory: ${key}`);
    return true;
  } catch (error) {
    console.error('❌ Error removing memory:', error);
    return false;
  }
}

/**
 * Export memories as JSON for backup
 */
export function exportMemories(): string {
  const memories = getAllMemories();
  const detailed = getDetailedMemories();
  
  return JSON.stringify({
    memories,
    detailed,
    exportedAt: new Date().toISOString(),
    stats: getMemoryStats()
  }, null, 2);
}

/**
 * Import memories from JSON backup
 */
export function importMemories(jsonData: string): boolean {
  try {
    const data = JSON.parse(jsonData);
    
    if (data.memories) {
      Object.entries(data.memories).forEach(([key, value]) => {
        storeMemory(key, value as string);
      });
      
      console.log(`📥 Imported ${Object.keys(data.memories).length} memories`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error importing memories:', error);
    return false;
  }
}

/**
 * Debug function to log all memory operations
 */
export function debugMemories(): void {
  const stats = getMemoryStats();
  const memories = getAllMemories();
  
  console.log('🧠 Memory Debug Info:');
  console.log('📊 Stats:', stats);
  console.log('💾 All Memories:', memories);
  console.log('📋 Detailed Entries:', getDetailedMemories());
}

// Expose debug function globally for development
if (typeof window !== 'undefined') {
  (window as any).debugMemories = debugMemories;
  (window as any).clearAllMemories = clearAllMemories;
  (window as any).exportMemories = exportMemories;
  (window as any).importMemories = importMemories;
}
