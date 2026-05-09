# My Lists Page - Lists Management and CSV Export

This README provides a comprehensive guide for implementing the "My Lists" page where users can view all their saved creator lists, see aggregated metrics for each list, and export lists as CSV files.

## Table of Contents
1. [Overview](#overview)
2. [Page Layout & Design](#page-layout--design)
3. [CSS Code for My Lists Page](#css-code-for-my-lists-page)
4. [Supabase Database Schema](#supabase-database-schema)
5. [Data Fetching Functions](#data-fetching-functions)
6. [List Detail Page](#list-detail-page)
7. [CSV Export Functionality](#csv-export-functionality)
8. [Integration Steps](#integration-steps)
9. [JavaScript Utilities](#javascript-utilities)

## Overview

The "My Lists" page serves as a central hub for managing all saved creator lists. Each list displays:
- **List metadata**: Name, creation date, creator count, tags
- **Aggregated metrics**: Average followers, views, engagement, buzz score
- **Visual indicators**: Progress bars, category tags, selection checkboxes
- **Export capabilities**: CSV export for individual lists or bulk operations

## Page Layout & Design

### Main Lists Page Structure
```
My Lists Page
├── Header Section
│   ├── "My Lists" title
│   └── Action buttons (New List, Export, Select All)
├── Lists Grid
│   └── List Cards (each showing aggregated metrics)
└── Empty State (when no lists exist)
```

### List Detail Page Structure
```
List Detail Page (e.g., "Crypto Campaign May")
├── Campaign Overview
│   ├── Title and metadata
│   ├── Action buttons (Import, Export, Edit, Close)
│   ├── Category filters
│   └── Average metrics cards
├── Progress bar (Buzz Score)
└── Creator List Table
    ├── Table headers with sort options
    └── Individual creator rows
```

## CSS Code for My Lists Page

### Required Font Import
```css
@import url("https://fonts.googleapis.com/css?family=Inter:600,500,400,700");
```

### Complete CSS for My Lists Page
```css
/* Base Page Styles */
.my-lists-page {
  background-color: #0f1419;
  min-height: 100vh;
  padding: 1.5rem;
  font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
  color: #f8f9fa;
}

/* Header Section */
.lists-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #374151;
}

.lists-title {
  font-size: 2.25rem;
  font-weight: 700;
  color: #f8f9fa;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

/* Action Buttons */
.action-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #1f2937;
  border: 1px solid #374151;
  border-radius: 0.5rem;
  color: #f8f9fa;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.action-button:hover {
  background-color: #374151;
  border-color: #4b5563;
}

.action-button.primary {
  background: linear-gradient(90deg, #557EDD 0%, #6C40E4 100%);
  border-color: transparent;
}

.action-button.primary:hover {
  background: linear-gradient(90deg, #4A6BC8 0%, #5A36C7 100%);
}

/* Lists Grid */
.lists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

/* List Card */
.list-card {
  background-color: #1f2937;
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid #374151;
  transition: all 0.2s;
  position: relative;
}

.list-card:hover {
  border-color: #4b5563;
  transform: translateY(-2px);
}

.list-card.selected {
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px #3b82f6;
}

/* Card Header */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.card-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #f8f9fa;
  margin: 0 0 0.5rem 0;
}

.card-details {
  color: #9ca3af;
  font-size: 0.875rem;
  margin: 0;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.card-action-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #9ca3af;
  cursor: pointer;
  transition: color 0.2s;
  padding: 0.25rem;
}

.card-action-icon:hover {
  color: #f8f9fa;
}

.card-action-icon.pinned {
  color: #ef4444;
}

.card-checkbox {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid #4b5563;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;
  background-color: transparent;
}

.card-checkbox.checked {
  background-color: #3b82f6;
  border-color: #3b82f6;
  position: relative;
}

.card-checkbox.checked::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 0.75rem;
  font-weight: bold;
}

/* Tags Section */
.card-tags {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.tag {
  padding: 0.25rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.tag.primary {
  background-color: #3b82f6;
  color: #ffffff;
}

.tag.secondary {
  background-color: #1f2937;
  border: 1px solid #22c55e;
  color: #22c55e;
}

/* Metrics Section */
.card-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.metric-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.metric-icon {
  width: 1.5rem;
  height: 1.5rem;
  margin-bottom: 0.5rem;
  color: #9ca3af;
}

.metric-label {
  color: #9ca3af;
  font-size: 0.75rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.metric-value {
  color: #f8f9fa;
  font-size: 1rem;
  font-weight: 700;
}

/* Progress Bar */
.progress-section {
  margin-top: 1rem;
}

.progress-bar {
  width: 100%;
  height: 0.5rem;
  background-color: #374151;
  border-radius: 0.25rem;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(to right, #ef4444, #a855f7);
  border-radius: 0.25rem;
  transition: width 0.3s ease;
}

.progress-text {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
}

.progress-label {
  color: #9ca3af;
  font-size: 0.75rem;
  font-weight: 500;
}

.progress-percentage {
  color: #f8f9fa;
  font-size: 0.875rem;
  font-weight: 600;
}

/* List Detail Page Styles */
.list-detail-page {
  background-color: #0f1419;
  min-height: 100vh;
  padding: 1.5rem;
  font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
}

/* Campaign Overview */
.campaign-overview {
  background-color: #1f2937;
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid #374151;
}

.campaign-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.campaign-title {
  font-size: 2rem;
  font-weight: 700;
  color: #f8f9fa;
  margin: 0 0 0.5rem 0;
}

.campaign-meta {
  color: #9ca3af;
  font-size: 0.875rem;
  margin: 0;
}

.campaign-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.campaign-action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #374151;
  border: 1px solid #4b5563;
  border-radius: 0.5rem;
  color: #f8f9fa;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.campaign-action-btn:hover {
  background-color: #4b5563;
}

.close-btn {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: #374151;
  border: 1px solid #4b5563;
  color: #f8f9fa;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background-color: #4b5563;
}

/* Category Filters */
.category-filters {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.category-filter {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.category-filter.selected {
  background-color: #1e3a8a;
  color: #93c5fd;
  border-color: #3b82f6;
}

.category-filter:not(.selected) {
  background-color: #14532d;
  color: #86efac;
  border-color: #22c55e;
}

.category-filter:hover {
  opacity: 0.8;
}

/* Average Metrics Cards */
.average-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.metric-card {
  background-color: #374151;
  border-radius: 0.75rem;
  padding: 1rem;
  text-align: center;
  border: 1px solid #4b5563;
}

.metric-card-icon {
  width: 2rem;
  height: 2rem;
  margin: 0 auto 0.5rem;
  color: #9ca3af;
}

.metric-card-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f8f9fa;
  margin-bottom: 0.25rem;
}

.metric-card-label {
  font-size: 0.75rem;
  color: #9ca3af;
  font-weight: 500;
}

/* Creator List Table */
.creator-list-container {
  background-color: #1f2937;
  border-radius: 1rem;
  overflow: hidden;
  border: 1px solid #374151;
}

.creator-list-table {
  width: 100%;
  min-width: 1200px;
}

/* Table Header */
.creator-list-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  background-color: #374151;
  border-bottom: 1px solid #4b5563;
  font-size: 0.875rem;
  font-weight: 500;
  color: #d1d5db;
}

.header-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: color 0.2s;
}

.header-cell:hover {
  color: #f8f9fa;
}

.sort-icon {
  width: 1rem;
  height: 1rem;
  color: #9ca3af;
}

/* Table Rows */
.creator-list-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  align-items: center;
  border-bottom: 1px solid #374151;
  transition: background-color 0.2s;
}

.creator-list-row:hover {
  background-color: #374151;
}

.creator-list-row:last-child {
  border-bottom: none;
}

/* Creator Info */
.creator-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.creator-profile {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  overflow: hidden;
  background-color: #384455;
}

.creator-profile img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.creator-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.creator-name {
  color: #f8f9fa;
  font-weight: 600;
  font-size: 0.875rem;
}

.creator-handle {
  color: #9ca3af;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.platform-icon {
  width: 1rem;
  height: 1rem;
}

/* Metrics Display */
.metric-display {
  text-align: center;
  color: #f8f9fa;
  font-size: 0.875rem;
  font-weight: 500;
}

.metric-change {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  margin-top: 0.25rem;
  font-size: 0.75rem;
}

.metric-change.positive {
  color: #22c55e;
}

.metric-change.negative {
  color: #ef4444;
}

.metric-change.neutral {
  color: #9ca3af;
}

/* Category Tags */
.category-tags {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.category-tag {
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-align: center;
}

.category-tag.primary {
  background-color: #1e3a8a;
  color: #93c5fd;
}

.category-tag.secondary {
  background-color: #14532d;
  color: #86efac;
}

/* Location */
.location-text {
  text-align: center;
  color: #f8f9fa;
  font-size: 0.875rem;
}

/* Buzz Score Donut */
.buzz-score-donut {
  display: flex;
  justify-content: center;
}

.donut-chart {
  position: relative;
  width: 2.5rem;
  height: 2.5rem;
}

.donut-chart svg {
  transform: rotate(-90deg);
}

.donut-score {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.625rem;
  font-weight: 700;
  color: #f8f9fa;
}

/* Utility Classes */
.flex {
  display: flex;
}

.items-center {
  align-items: center;
}

.justify-center {
  justify-content: center;
}

.justify-between {
  justify-content: space-between;
}

.gap-1 {
  gap: 0.25rem;
}

.gap-2 {
  gap: 0.5rem;
}

.gap-3 {
  gap: 0.75rem;
}

.gap-4 {
  gap: 1rem;
}

.text-center {
  text-align: center;
}

.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.transition-all {
  transition: all 0.2s;
}

.cursor-pointer {
  cursor: pointer;
}

/* Responsive Design */
@media (max-width: 768px) {
  .lists-grid {
    grid-template-columns: 1fr;
  }
  
  .average-metrics {
    grid-template-columns: 1fr;
  }
  
  .campaign-actions {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .creator-list-header,
  .creator-list-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
}
```

## Supabase Database Schema

### Table: `lists`
```sql
CREATE TABLE lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),
  is_pinned BOOLEAN DEFAULT FALSE,
  avg_followers NUMERIC DEFAULT 0,
  avg_views NUMERIC DEFAULT 0,
  avg_engagement NUMERIC DEFAULT 0,
  avg_buzz_score NUMERIC DEFAULT 0,
  creator_count INTEGER DEFAULT 0
);
```

### Table: `list_creators`
```sql
CREATE TABLE list_creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES creatordata(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(list_id, creator_id)
);
```

### Table: `creatordata` (existing)
```sql
CREATE TABLE creatordata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT,
  handle TEXT,
  platform TEXT,
  followers_count INTEGER,
  average_views INTEGER,
  engagement_rate NUMERIC,
  buzz_score INTEGER,
  primary_niche TEXT,
  secondary_niche TEXT,
  location TEXT,
  profile_image_url TEXT,
  recent_posts JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Data Fetching Functions

### 1. Fetch All Lists with Aggregated Metrics
```javascript
const fetchAllLists = async (userId) => {
  const { data, error } = await supabase
    .from('lists')
    .select(`
      *,
      list_creators(
        creator_id,
        creatordata(*)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  // Calculate aggregated metrics for each list
  const listsWithMetrics = data.map(list => {
    const creators = list.list_creators.map(lc => lc.creatordata);
    return {
      ...list,
      avg_followers: calculateAverage(creators, 'followers_count'),
      avg_views: calculateAverage(creators, 'average_views'),
      avg_engagement: calculateAverage(creators, 'engagement_rate'),
      avg_buzz_score: calculateAverage(creators, 'buzz_score'),
      creator_count: creators.length
    };
  });
  
  return listsWithMetrics;
};
```

### 2. Fetch Single List with Creators
```javascript
const fetchListDetails = async (listId) => {
  const { data, error } = await supabase
    .from('lists')
    .select(`
      *,
      list_creators(
        creator_id,
        creatordata(*)
      )
    `)
    .eq('id', listId)
    .single();
  
  if (error) throw error;
  
  const creators = data.list_creators.map(lc => lc.creatordata);
  const metrics = {
    avg_followers: calculateAverage(creators, 'followers_count'),
    avg_views: calculateAverage(creators, 'average_views'),
    avg_engagement: calculateAverage(creators, 'engagement_rate'),
    avg_buzz_score: calculateAverage(creators, 'buzz_score'),
    creator_count: creators.length
  };
  
  return {
    ...data,
    creators,
    metrics
  };
};
```

### 3. Create New List
```javascript
const createList = async (listData, creatorIds) => {
  // Insert list
  const { data: list, error: listError } = await supabase
    .from('lists')
    .insert({
      name: listData.name,
      description: listData.description,
      tags: listData.tags,
      user_id: listData.userId
    })
    .select()
    .single();
  
  if (listError) throw listError;
  
  // Insert creator associations
  const listCreators = creatorIds.map(creatorId => ({
    list_id: list.id,
    creator_id: creatorId
  }));
  
  const { error: creatorsError } = await supabase
    .from('list_creators')
    .insert(listCreators);
  
  if (creatorsError) throw creatorsError;
  
  return list;
};
```

### 4. Update List Metrics
```javascript
const updateListMetrics = async (listId) => {
  // Fetch creators for the list
  const { data: listCreators, error } = await supabase
    .from('list_creators')
    .select(`
      creatordata(
        followers_count,
        average_views,
        engagement_rate,
        buzz_score
      )
    `)
    .eq('list_id', listId);
  
  if (error) throw error;
  
  const creators = listCreators.map(lc => lc.creatordata);
  
  // Calculate metrics
  const metrics = {
    avg_followers: calculateAverage(creators, 'followers_count'),
    avg_views: calculateAverage(creators, 'average_views'),
    avg_engagement: calculateAverage(creators, 'engagement_rate'),
    avg_buzz_score: calculateAverage(creators, 'buzz_score'),
    creator_count: creators.length
  };
  
  // Update list with new metrics
  const { error: updateError } = await supabase
    .from('lists')
    .update(metrics)
    .eq('id', listId);
  
  if (updateError) throw updateError;
  
  return metrics;
};
```

## List Detail Page

### Campaign Overview Component
```javascript
const CampaignOverview = ({ list, onExport, onEdit, onClose }) => {
  return (
    <div className="campaign-overview">
      <div className="campaign-header">
        <div>
          <h1 className="campaign-title">{list.name}</h1>
          <p className="campaign-meta">
            {list.creator_count} Creators | Created {formatDate(list.created_at)}
          </p>
        </div>
        <div className="campaign-actions">
          <button className="campaign-action-btn">
            <ImportIcon />
            Import Creators
          </button>
          <button className="campaign-action-btn" onClick={onExport}>
            <ExportIcon />
            Export
          </button>
          <button className="campaign-action-btn" onClick={onEdit}>
            <EditIcon />
            Edit
          </button>
          <button className="close-btn" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
      </div>
      
      <div className="category-filters">
        {list.tags.map(tag => (
          <button
            key={tag}
            className={`category-filter ${tag === 'Crypto' ? 'selected' : ''}`}
          >
            {tag}
          </button>
        ))}
      </div>
      
      <div className="average-metrics">
        <div className="metric-card">
          <div className="metric-card-icon">👥</div>
          <div className="metric-card-value">{formatNumber(list.avg_followers)}</div>
          <div className="metric-card-label">Avg. Followers</div>
        </div>
        <div className="metric-card">
          <div className="metric-card-icon">👁️</div>
          <div className="metric-card-value">{formatNumber(list.avg_views)}</div>
          <div className="metric-card-label">Avg. Views</div>
        </div>
        <div className="metric-card">
          <div className="metric-card-icon">📊</div>
          <div className="metric-card-value">{list.avg_engagement.toFixed(1)}%</div>
          <div className="metric-card-label">Avg. Engagement</div>
        </div>
      </div>
      
      <div className="progress-section">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${list.avg_buzz_score}%` }}
          />
        </div>
        <div className="progress-text">
          <span className="progress-label">Buzz Score</span>
          <span className="progress-percentage">{list.avg_buzz_score}%</span>
        </div>
      </div>
    </div>
  );
};
```

## CSV Export Functionality

### Export Single List
```javascript
const exportListToCSV = (list, creators) => {
  if (!creators || creators.length === 0) {
    console.warn("No creators to export.");
    return;
  }

  const headers = [
    "Name", "Handle", "Platform", "Followers", "Average Views", 
    "Engagement Rate", "Buzz Score", "Primary Category", 
    "Secondary Category", "Location"
  ];

  const csvRows = [];
  csvRows.push(headers.join(','));

  creators.forEach(creator => {
    const row = [
      `"${creator.display_name?.replace(/"/g, '""') || ''}"`,
      `"${creator.handle?.replace(/"/g, '""') || ''}"`,
      `"${creator.platform || ''}"`,
      creator.followers_count || 0,
      creator.average_views || 0,
      creator.engagement_rate || 0,
      creator.buzz_score || 0,
      `"${creator.primary_niche?.replace(/"/g, '""') || ''}"`,
      `"${creator.secondary_niche?.replace(/"/g, '""') || ''}"`,
      `"${creator.location?.replace(/"/g, '""') || ''}"`
    ];
    csvRows.push(row.join(','));
  });

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${list.name}_creators.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
```

### Export Multiple Lists
```javascript
const exportMultipleLists = async (listIds) => {
  const allCreators = [];
  
  for (const listId of listIds) {
    const listData = await fetchListDetails(listId);
    const creatorsWithList = listData.creators.map(creator => ({
      ...creator,
      list_name: listData.name
    }));
    allCreators.push(...creatorsWithList);
  }
  
  const headers = [
    "List Name", "Name", "Handle", "Platform", "Followers", 
    "Average Views", "Engagement Rate", "Buzz Score", 
    "Primary Category", "Secondary Category", "Location"
  ];

  const csvRows = [];
  csvRows.push(headers.join(','));

  allCreators.forEach(creator => {
    const row = [
      `"${creator.list_name?.replace(/"/g, '""') || ''}"`,
      `"${creator.display_name?.replace(/"/g, '""') || ''}"`,
      `"${creator.handle?.replace(/"/g, '""') || ''}"`,
      `"${creator.platform || ''}"`,
      creator.followers_count || 0,
      creator.average_views || 0,
      creator.engagement_rate || 0,
      creator.buzz_score || 0,
      `"${creator.primary_niche?.replace(/"/g, '""') || ''}"`,
      `"${creator.secondary_niche?.replace(/"/g, '""') || ''}"`,
      `"${creator.location?.replace(/"/g, '""') || ''}"`
    ];
    csvRows.push(row.join(','));
  });

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `multiple_lists_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
```

## Integration Steps

### 1. Set up Supabase Client
```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### 2. Create My Lists Page Component
```javascript
// pages/my-lists.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase-client';
import { fetchAllLists, exportMultipleLists } from '../utils/list-utils';
import ListCard from '../components/ListCard';

const MyListsPage = () => {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLists, setSelectedLists] = useState(new Set());

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    setLoading(true);
    try {
      const user = supabase.auth.user();
      const listsData = await fetchAllLists(user.id);
      setLists(listsData);
    } catch (error) {
      console.error('Error loading lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleListSelect = (listId) => {
    const newSelected = new Set(selectedLists);
    if (newSelected.has(listId)) {
      newSelected.delete(listId);
    } else {
      newSelected.add(listId);
    }
    setSelectedLists(newSelected);
  };

  const handleExportSelected = async () => {
    if (selectedLists.size === 0) return;
    await exportMultipleLists(Array.from(selectedLists));
  };

  const handleSelectAll = () => {
    if (selectedLists.size === lists.length) {
      setSelectedLists(new Set());
    } else {
      setSelectedLists(new Set(lists.map(list => list.id)));
    }
  };

  return (
    <div className="my-lists-page">
      <div className="lists-header">
        <h1 className="lists-title">My Lists</h1>
        <div className="header-actions">
          <button className="action-button">
            <PlusIcon />
            New List
          </button>
          <button className="action-button" onClick={handleSelectAll}>
            <SelectAllIcon />
            Select All
          </button>
          <button 
            className="action-button primary" 
            onClick={handleExportSelected}
            disabled={selectedLists.size === 0}
          >
            <ExportIcon />
            Export
          </button>
        </div>
      </div>
      
      <div className="lists-grid">
        {lists.map(list => (
          <ListCard
            key={list.id}
            list={list}
            selected={selectedLists.has(list.id)}
            onSelect={handleListSelect}
            onEdit={(id) => console.log('Edit list:', id)}
            onPin={(id) => console.log('Pin list:', id)}
          />
        ))}
      </div>
    </div>
  );
};

export default MyListsPage;
```

## JavaScript Utilities

### 1. Calculate Averages
```javascript
export const calculateAverage = (items, field) => {
  if (!items || items.length === 0) return 0;
  
  const sum = items.reduce((acc, item) => acc + (item[field] || 0), 0);
  return Math.round(sum / items.length);
};
```

### 2. Format Numbers
```javascript
export const formatNumber = (num) => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(0)}K`;
  }
  return num.toString();
};
```

### 3. Format Date
```javascript
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};
```

### 4. Generate UUID
```javascript
export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};
```

### 5. Get Platform Icon
```javascript
export const getPlatformIcon = (platform) => {
  const icons = {
    'instagram': '/icons/InstagramLogo.svg',
    'tiktok': '/icons/TikTokLogo.svg',
    'youtube': '/icons/YouTubeLogo.svg',
    'x': '/icons/XLogo.svg'
  };
  return icons[platform.toLowerCase()] || '/icons/PlatformIcon.svg';
};
```

This comprehensive guide provides everything you need to implement the "My Lists" page with aggregated metrics, list management, and CSV export functionality. The design matches the dark theme shown in your screenshots with proper responsive behavior and interactive elements.
