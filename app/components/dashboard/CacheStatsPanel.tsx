/**
 * Cache Statistics Panel
 * Displays cache performance metrics and allows cache management
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart3, 
  Database, 
  Trash2, 
  RefreshCw, 
  TrendingUp, 
  Clock,
  HardDrive,
  Zap
} from 'lucide-react';

interface CacheStatsProps {
  getCacheStats: () => any;
  invalidateCache: (type?: 'pages' | 'metrics' | 'all') => void;
  cacheHitRate: number;
  isPreloading: boolean;
}

export const CacheStatsPanel: React.FC<CacheStatsProps> = ({
  getCacheStats,
  invalidateCache,
  cacheHitRate,
  isPreloading
}) => {
  const [stats, setStats] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Refresh stats
  const refreshStats = React.useCallback(() => {
    setRefreshing(true);
    try {
      const newStats = getCacheStats();
      setStats(newStats);
    } catch (error) {
      console.error('Error getting cache stats:', error);
    } finally {
      setRefreshing(false);
    }
  }, [getCacheStats]);

  // Auto-refresh stats every 5 seconds
  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 5000);
    return () => clearInterval(interval);
  }, [refreshStats]);

  // Handle cache invalidation
  const handleInvalidate = (type?: 'pages' | 'metrics' | 'all') => {
    invalidateCache(type);
    setTimeout(refreshStats, 100); // Refresh stats after invalidation
  };

  if (!stats) {
    return (
      <Card className="w-full bg-gray-900 border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-400">Loading cache stats...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getCacheHealthColor = (hitRate: number) => {
    if (hitRate >= 80) return 'text-green-400';
    if (hitRate >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getCacheHealthBadge = (hitRate: number) => {
    if (hitRate >= 80) return <Badge className="bg-green-600 text-white">Excellent</Badge>;
    if (hitRate >= 60) return <Badge className="bg-yellow-600 text-white">Good</Badge>;
    if (hitRate >= 40) return <Badge className="bg-orange-600 text-white">Fair</Badge>;
    return <Badge className="bg-red-600 text-white">Poor</Badge>;
  };

  return (
    <Card className="w-full bg-gray-900 border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Database className="w-5 h-5" />
            Discover Cache Performance
          </CardTitle>
          <div className="flex items-center gap-2">
            {isPreloading && (
              <div className="flex items-center gap-1 text-blue-400">
                <Zap className="w-4 h-4 animate-pulse" />
                <span className="text-xs">Preloading</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshStats}
              disabled={refreshing}
              className="text-gray-400 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-white"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-400">Hit Rate</span>
            </div>
            <div className={`text-lg font-bold ${getCacheHealthColor(cacheHitRate)}`}>
              {cacheHitRate.toFixed(1)}%
            </div>
            <div className="mt-1">
              {getCacheHealthBadge(cacheHitRate)}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <HardDrive className="w-4 h-4 text-green-400" />
              <span className="text-xs text-gray-400">Memory Cache</span>
            </div>
            <div className="text-lg font-bold text-white">
              {stats.memoryEntries}
            </div>
            <div className="text-xs text-gray-400">entries</div>
          </div>

          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Database className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-gray-400">Local Storage</span>
            </div>
            <div className="text-lg font-bold text-white">
              {stats.localStorageEntries}
            </div>
            <div className="text-xs text-gray-400">entries</div>
          </div>

          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-orange-400" />
              <span className="text-xs text-gray-400">Preload Queue</span>
            </div>
            <div className="text-lg font-bold text-white">
              {stats.preloadQueueSize || 0}
            </div>
            <div className="text-xs text-gray-400">pending</div>
          </div>
        </div>

        {/* Request Statistics */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Request Statistics
          </h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Total Requests</div>
              <div className="text-white font-medium">{stats.totalRequests || 0}</div>
            </div>
            <div>
              <div className="text-gray-400">Cache Hits</div>
              <div className="text-green-400 font-medium">{stats.cacheHits || 0}</div>
            </div>
            <div>
              <div className="text-gray-400">Cache Misses</div>
              <div className="text-red-400 font-medium">{stats.cacheMisses || 0}</div>
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <>
            <Separator className="bg-gray-700" />
            
            {/* Top Filters */}
            {stats.topFilters && stats.topFilters.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="text-white font-medium mb-3">Most Used Filters</h4>
                <div className="space-y-2">
                  {stats.topFilters.slice(0, 5).map((filter: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm">{filter.filter}</span>
                      <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                        {filter.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Pages */}
            {stats.topPages && stats.topPages.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="text-white font-medium mb-3">Most Visited Pages</h4>
                <div className="space-y-2">
                  {stats.topPages.slice(0, 5).map((page: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm">Page {page.page}</span>
                      <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                        {page.count} visits
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Cache Management */}
        <Separator className="bg-gray-700" />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleInvalidate('pages')}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear Page Cache
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleInvalidate('metrics')}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear Metrics Cache
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleInvalidate('all')}
            className="border-gray-600 text-red-400 hover:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear All Cache
          </Button>
        </div>

        {/* Performance Tips */}
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
          <h5 className="text-blue-300 font-medium mb-2">💡 Performance Tips</h5>
          <ul className="text-sm text-blue-200 space-y-1">
            <li>• Cache hit rate above 80% indicates excellent performance</li>
            <li>• Preloading works best when users follow predictable navigation patterns</li>
            <li>• Clear cache if you notice stale data or after major updates</li>
            {cacheHitRate < 60 && (
              <li className="text-yellow-300">• Low hit rate may indicate frequent filter changes</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default CacheStatsPanel;
