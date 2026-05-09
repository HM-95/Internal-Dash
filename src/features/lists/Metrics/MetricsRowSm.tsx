import React from 'react';
import { MetricCard } from './MetricCard';

type Props = {
  avgFollowers: string;
  avgViews: string;
  avgEngagement: string;
};

export function MetricsRowSm({ avgFollowers, avgViews, avgEngagement }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2 w-full min-w-0" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) minmax(0,1.2fr)' }}>
      <MetricCard iconSrc="/FollowerIcon.svg" iconAlt="Followers" title="Avg. Followers" value={avgFollowers} />
      <MetricCard iconSrc="/AvgViewsIcon.svg" iconAlt="Views" title="Avg. Views" value={avgViews} />
      <MetricCard iconSrc="/EngagementIcon.svg" iconAlt="Engagement" title="Avg. Engagement" value={avgEngagement} />
    </div>
  );
}


