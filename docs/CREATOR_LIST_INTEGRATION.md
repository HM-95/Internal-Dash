# Creator List in List Mode - Integration Guide

This guide provides the complete CSS code and Supabase integration details for implementing the creator list in list mode for your AI search page.

## Table of Contents
1. [CSS Code](#css-code)
2. [HTML Structure](#html-structure)
3. [Supabase Database Schema](#supabase-database-schema)
4. [Data Fetching Functions](#data-fetching-functions)
5. [Integration Steps](#integration-steps)
6. [JavaScript Utilities](#javascript-utilities)

## CSS Code

### Required Font Import
```css
@import url("https://fonts.googleapis.com/css?family=Inter:600,500,400,700");
```

### Complete CSS for Creator List
```css
/* Base styles */
.creator-list-container {
  width: 100%;
  overflow-x: auto;
}

.creator-list-container.lg\:overflow-x-visible {
  overflow-x: visible;
}

/* Table container */
.creator-list-table {
  min-width: 1200px;
}

@media (min-width: 1024px) {
  .creator-list-table {
    min-width: 1300px;
  }
}

@media (min-width: 1280px) {
  .creator-list-table {
    min-width: 0;
  }
}

/* Table header */
.creator-list-header {
  gap: 0.75rem;
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 0.5rem 0.5rem 0 0;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
  font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
}

@media (min-width: 640px) {
  .creator-list-header {
    gap: 1rem;
    font-size: 0.875rem;
  }
}

@media (min-width: 1024px) {
  .creator-list-header {
    gap: 1.25rem;
    font-size: 0.8125rem;
  }
}

@media (min-width: 1280px) {
  .creator-list-header {
    font-size: 0.875rem;
  }
}

/* Dark mode header */
.dark .creator-list-header {
  background-color: #374151;
  border-color: #4b5563;
  color: #d1d5db;
}

/* Grid layout for AI mode */
.creator-list-header.ai-mode {
  display: grid;
  grid-template-columns: 50px 200px 100px 100px 100px 100px 140px 120px 90px 50px;
}

@media (min-width: 1024px) {
  .creator-list-header.ai-mode {
    grid-template-columns: 60px 220px 110px 110px 110px 110px 140px 120px 100px 60px;
  }
}

@media (min-width: 1280px) {
  .creator-list-header.ai-mode {
    grid-template-columns: 60px 2fr 1fr 1fr 1fr 1fr 1.1fr 1fr 0.9fr 60px;
  }
}

/* Grid layout for All Creators mode */
.creator-list-header.all-mode {
  display: grid;
  grid-template-columns: 50px 200px 100px 100px 100px 140px 120px 90px 50px;
}

@media (min-width: 1024px) {
  .creator-list-header.all-mode {
    grid-template-columns: 60px 220px 110px 110px 110px 140px 120px 100px 60px;
  }
}

@media (min-width: 1280px) {
  .creator-list-header.all-mode {
    grid-template-columns: 60px 2fr 1fr 1fr 1fr 1.1fr 1fr 0.9fr 60px;
  }
}

/* Header buttons */
.creator-list-header-button {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  justify-content: center;
  color: #6b7280;
  transition: color 0.2s;
  cursor: pointer;
  font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
}

@media (min-width: 640px) {
  .creator-list-header-button {
    gap: 0.5rem;
  }
}

@media (min-width: 1024px) {
  .creator-list-header-button {
    gap: 0.5rem;
  }
}

.creator-list-header-button:hover {
  color: #374151;
}

.dark .creator-list-header-button:hover {
  color: #f9fafb;
}

/* Sort icon */
.creator-list-sort-icon {
  width: 0.5rem;
  height: 0.5rem;
  flex-shrink: 0;
  transition: transform 0.2s;
}

@media (min-width: 640px) {
  .creator-list-sort-icon {
    width: 0.75rem;
    height: 0.75rem;
  }
}

@media (min-width: 1024px) {
  .creator-list-sort-icon {
    width: 1rem;
    height: 1rem;
  }
}

.creator-list-sort-icon.rotated {
  transform: rotate(180deg);
}

/* Table body */
.creator-list-body {
  background-color: #ffffff;
  border-radius: 0 0 0.5rem 0.5rem;
  border: 1px solid #e5e7eb;
  border-top: 0;
  overflow: hidden;
}

.dark .creator-list-body {
  background-color: #1f2937;
  border-color: #4b5563;
}

/* Table rows */
.creator-list-row {
  gap: 0.75rem;
  padding: 1rem;
  align-items: center;
  transition: background-color 0.2s;
  cursor: pointer;
  font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
}

@media (min-width: 640px) {
  .creator-list-row {
    gap: 1rem;
  }
}

@media (min-width: 1024px) {
  .creator-list-row {
    gap: 1.25rem;
  }
}

.creator-list-row:hover {
  background-color: #f9fafb;
}

.dark .creator-list-row:hover {
  background-color: #374151;
}

.creator-list-row.selected {
  background-color: #f1f6fe;
}

.dark .creator-list-row.selected {
  background-color: #1e3a8a;
}

.creator-list-row.checked {
  border-left: 4px solid #94c4fc;
}

.creator-list-row:not(:last-child) {
  border-bottom: 1px solid #f3f4f6;
}

.dark .creator-list-row:not(:last-child) {
  border-bottom-color: #4b5563;
}

/* Grid layout for rows (same as header) */
.creator-list-row.ai-mode {
  display: grid;
  grid-template-columns: 50px 200px 100px 100px 100px 100px 140px 120px 90px 50px;
}

@media (min-width: 1024px) {
  .creator-list-row.ai-mode {
    grid-template-columns: 60px 220px 110px 110px 110px 110px 140px 120px 100px 60px;
  }
}

@media (min-width: 1280px) {
  .creator-list-row.ai-mode {
    grid-template-columns: 60px 2fr 1fr 1fr 1fr 1fr 1.1fr 1fr 0.9fr 60px;
  }
}

.creator-list-row.all-mode {
  display: grid;
  grid-template-columns: 50px 200px 100px 100px 100px 140px 120px 90px 50px;
}

@media (min-width: 1024px) {
  .creator-list-row.all-mode {
    grid-template-columns: 60px 220px 110px 110px 110px 140px 120px 100px 60px;
  }
}

@media (min-width: 1280px) {
  .creator-list-row.all-mode {
    grid-template-columns: 60px 2fr 1fr 1fr 1fr 1.1fr 1fr 0.9fr 60px;
  }
}

/* Checkbox */
.creator-list-checkbox {
  width: 1rem;
  height: 1rem;
  border: 2px solid #dbe2eb;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

@media (min-width: 640px) {
  .creator-list-checkbox {
    width: 1.25rem;
    height: 1.25rem;
  }
}

.creator-list-checkbox.checked {
  background-color: #3b82f6;
  border-color: #3b82f6;
}

.dark .creator-list-checkbox {
  border-color: #6b7280;
}

/* Creator info section */
.creator-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

@media (min-width: 1024px) {
  .creator-info {
    gap: 1rem;
  }
}

@media (min-width: 1280px) {
  .creator-info {
    gap: 1.5rem;
  }
}

/* Profile image */
.creator-profile-image {
  width: 2rem;
  height: 2rem;
  background-color: #384455;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

@media (min-width: 640px) {
  .creator-profile-image {
    width: 2.5rem;
    height: 2.5rem;
  }
}

@media (min-width: 1024px) {
  .creator-profile-image {
    width: 3rem;
    height: 3rem;
  }
}

.creator-profile-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Creator details */
.creator-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
  flex: 1;
}

.creator-name {
  font-weight: 600;
  color: #06152b;
  font-size: 0.75rem;
  min-width: 0;
  max-width: 140px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (min-width: 1024px) {
  .creator-name {
    font-size: 0.8125rem;
    max-width: none;
  }
}

@media (min-width: 1280px) {
  .creator-name {
    font-size: 0.875rem;
  }
}

.dark .creator-name {
  color: #f9fafb;
}

.creator-username {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  min-width: 0;
}

.creator-username-text {
  color: #71737c;
  font-size: 0.625rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (min-width: 1024px) {
  .creator-username-text {
    font-size: 0.6875rem;
  }
}

@media (min-width: 1280px) {
  .creator-username-text {
    font-size: 0.75rem;
  }
}

.dark .creator-username-text {
  color: #9ca3af;
}

/* Social media icons */
.social-media-icons {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
}

.social-media-icon {
  width: 0.625rem;
  height: 0.625rem;
}

@media (min-width: 1024px) {
  .social-media-icon {
    width: 0.75rem;
    height: 0.75rem;
  }
}

@media (min-width: 1280px) {
  .social-media-icon {
    width: 0.875rem;
    height: 0.875rem;
  }
}

/* Match score */
.match-score {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.1875rem 0.375rem;
  border-radius: 0.375rem;
  margin-left: 0.0625rem;
  font-weight: 600;
  font-size: 0.6875rem;
  line-height: 0.875rem;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
}

.match-score.high {
  background-color: #16a34a;
  border-color: rgba(255, 255, 255, 0.2);
}

.match-score.medium {
  background-color: #ca8a04;
  border-color: rgba(255, 255, 255, 0.2);
}

.match-score.low {
  background-color: #ea580c;
  border-color: rgba(255, 255, 255, 0.2);
}

.match-score.very-low {
  background-color: #dc2626;
  border-color: rgba(255, 255, 255, 0.2);
}

/* Metric columns */
.metric-column {
  text-align: center;
  font-size: 0.75rem;
  font-weight: 500;
  color: #06152b;
}

@media (min-width: 1024px) {
  .metric-column {
    font-size: 0.8125rem;
  }
}

@media (min-width: 1280px) {
  .metric-column {
    font-size: 0.8125rem;
  }
}

.dark .metric-column {
  color: #f9fafb;
}

.metric-change {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  margin-top: 0.25rem;
}

.metric-change-icon {
  width: 0.5rem;
  height: 0.5rem;
  flex-shrink: 0;
}

@media (min-width: 640px) {
  .metric-change-icon {
    width: 0.75rem;
    height: 0.75rem;
  }
}

@media (min-width: 1024px) {
  .metric-change-icon {
    width: 0.75rem;
    height: 0.75rem;
  }
}

.metric-change-text {
  font-size: 0.625rem;
  font-weight: 500;
}

@media (min-width: 1024px) {
  .metric-change-text {
    font-size: 0.6875rem;
  }
}

@media (min-width: 1280px) {
  .metric-change-text {
    font-size: 0.6875rem;
  }
}

.metric-change-text.positive {
  color: #1ad598;
}

.metric-change-text.negative {
  color: #ea3a3d;
}

.metric-change-text.neutral {
  color: #9ca3af;
}

.dark .metric-change-text.neutral {
  color: #6b7280;
}

/* Category badges */
.category-badges {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.category-badge {
  display: flex;
  align-items: center;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-weight: 500;
  font-size: 0.625rem;
}

@media (min-width: 1024px) {
  .category-badge {
    padding: 0.1875rem 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.6875rem;
  }
}

@media (min-width: 1280px) {
  .category-badge {
    padding: 0.25rem 0.625rem;
    border-radius: 0.5rem;
    font-size: 0.75rem;
  }
}

.category-badge.primary {
  background-color: #f0f9ff;
  border: 1px solid #dbe2eb;
  color: #111827;
}

.dark .category-badge.primary {
  background-color: #1e3a8a;
  border-color: #3b82f6;
  color: #f9fafb;
}

.category-badge.secondary {
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}

.dark .category-badge.secondary {
  background-color: #14532d;
  border-color: #22c55e;
  color: #f9fafb;
}

/* Location */
.location-text {
  font-size: 0.75rem;
  color: #06152b;
  text-align: center;
}

@media (min-width: 1024px) {
  .location-text {
    font-size: 0.8125rem;
  }
}

@media (min-width: 1280px) {
  .location-text {
    font-size: 0.8125rem;
  }
}

.dark .location-text {
  color: #f9fafb;
}

/* Donut chart container */
.donut-chart-container {
  display: flex;
  justify-content: center;
}

.donut-chart-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 70px;
}

@media (min-width: 1024px) {
  .donut-chart-wrapper {
    max-width: 80px;
  }
}

@media (min-width: 1280px) {
  .donut-chart-wrapper {
    max-width: none;
  }
}

/* Donut chart */
.donut-chart {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.donut-chart svg {
  transform: rotate(-90deg);
}

.donut-chart-circle-bg {
  stroke: #e5e7eb;
  fill: transparent;
}

.dark .donut-chart-circle-bg {
  stroke: #6b7280;
}

.donut-chart-score {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.5rem;
  font-weight: 700;
  color: #111827;
}

@media (min-width: 640px) {
  .donut-chart-score {
    font-size: 0.5625rem;
  }
}

@media (min-width: 1024px) {
  .donut-chart-score {
    font-size: 0.625rem;
  }
}

@media (min-width: 1280px) {
  .donut-chart-score {
    font-size: 0.6875rem;
  }
}

.dark .donut-chart-score {
  color: #f9fafb;
}

/* Utility classes */
.text-center {
  text-align: center;
}

.flex {
  display: flex;
}

.items-center {
  align-items: center;
}

.justify-center {
  justify-content: center;
}

.justify-start {
  justify-content: flex-start;
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

.gap-5 {
  gap: 1.25rem;
}

.min-w-0 {
  min-width: 0;
}

.flex-1 {
  flex: 1;
}

.flex-shrink-0 {
  flex-shrink: 0;
}

.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.transition-colors {
  transition: color 0.2s;
}

.transition-all {
  transition: all 0.2s;
}

.cursor-pointer {
  cursor: pointer;
}

.overflow-hidden {
  overflow: hidden;
}

.rounded-full {
  border-radius: 50%;
}

.object-cover {
  object-fit: cover;
}
```

## HTML Structure

### Basic HTML Structure
```html
<div class="creator-list-container lg:overflow-x-visible">
  <div class="creator-list-table ai-mode">
    <!-- Header -->
    <div class="creator-list-header ai-mode">
      <div></div>
      <div class="flex items-center gap-1 sm:gap-2 justify-start">
        <span class="truncate">Creators</span>
      </div>
      <button class="creator-list-header-button">
        <span class="truncate">Match Score</span>
        <svg class="creator-list-sort-icon" viewBox="0 0 24 24">
          <!-- Sort icon SVG -->
        </svg>
      </button>
      <button class="creator-list-header-button">
        <span class="truncate">Followers</span>
        <svg class="creator-list-sort-icon" viewBox="0 0 24 24">
          <!-- Sort icon SVG -->
        </svg>
      </button>
      <button class="creator-list-header-button">
        <span class="truncate">Average Views</span>
        <svg class="creator-list-sort-icon" viewBox="0 0 24 24">
          <!-- Sort icon SVG -->
        </svg>
      </button>
      <button class="creator-list-header-button">
        <span class="truncate">Engagement</span>
        <svg class="creator-list-sort-icon" viewBox="0 0 24 24">
          <!-- Sort icon SVG -->
        </svg>
      </button>
      <div><span class="truncate">Category</span></div>
      <div class="flex items-center justify-center"><span class="truncate">Location</span></div>
      <div class="flex items-center justify-center"><span class="truncate">Buzz Score</span></div>
      <div></div>
    </div>
    
    <!-- Body -->
    <div class="creator-list-body">
      <!-- Row example -->
      <div class="creator-list-row ai-mode">
        <div class="flex justify-center">
          <input type="checkbox" class="creator-list-checkbox" />
        </div>
        <div class="creator-info">
          <div class="creator-profile-image">
            <img src="profile.jpg" alt="Creator profile" />
          </div>
          <div class="creator-details">
            <span class="creator-name">Creator Name</span>
            <div class="creator-username">
              <span class="creator-username-text">@username</span>
              <div class="social-media-icons">
                <!-- Social media icons -->
              </div>
            </div>
          </div>
        </div>
        <div class="flex justify-center">
          <div class="match-score high">85%</div>
        </div>
        <div class="metric-column">
          <div>1.2M</div>
          <div class="metric-change">
            <svg class="metric-change-icon positive"></svg>
            <span class="metric-change-text positive">2.5%</span>
          </div>
        </div>
        <div class="metric-column">
          <div>500K</div>
          <div class="metric-change">
            <svg class="metric-change-icon positive"></svg>
            <span class="metric-change-text positive">1.8%</span>
          </div>
        </div>
        <div class="metric-column">
          <div>3.2%</div>
          <div class="metric-change">
            <svg class="metric-change-icon negative"></svg>
            <span class="metric-change-text negative">0.5%</span>
          </div>
        </div>
        <div class="category-badges">
          <div class="category-badge primary">Lifestyle</div>
        </div>
        <div class="text-center">
          <div class="location-text">New York, NY</div>
        </div>
        <div class="donut-chart-container">
          <div class="donut-chart-wrapper">
            <div class="donut-chart" style="width: 38px; height: 38px;">
              <svg width="38" height="38">
                <circle cx="19" cy="19" r="17" stroke="#E5E7EB" stroke-width="4" fill="transparent" />
                <circle cx="19" cy="19" r="17" stroke="url(#gradient)" stroke-width="4" fill="transparent" stroke-dasharray="106.8" stroke-dashoffset="16" stroke-linecap="round" />
              </svg>
              <div class="donut-chart-score">85%</div>
            </div>
          </div>
        </div>
        <div></div>
      </div>
    </div>
  </div>
</div>
```

## Supabase Database Schema

### Table: `creatordata`

| Column Name | Type | Description | Example |
|-------------|------|-------------|---------|
| `id` | `uuid` | Primary key | `"123e4567-e89b-12d3-a456-426614174000"` |
| `display_name` | `text` | Creator's display name | `"John Doe"` |
| `handle` | `text` | Social media handle | `"johndoe"` |
| `profile_image_url` | `text` | Profile picture URL | `"https://example.com/profile.jpg"` |
| `bio` | `text` | Creator's bio | `"Lifestyle content creator"` |
| `platform` | `text` | Social media platform | `"instagram"`, `"tiktok"`, `"youtube"`, `"twitter"` |
| `profile_url` | `text` | Profile URL | `"https://instagram.com/johndoe"` |
| `followers_count` | `integer` | Number of followers | `1250000` |
| `followers_change` | `numeric` | Follower change percentage | `2.5` |
| `followers_change_type` | `text` | Change direction | `"positive"`, `"negative"` |
| `engagement_rate` | `numeric` | Engagement rate percentage | `3.2` |
| `engagement_rate_change` | `numeric` | Engagement change percentage | `0.5` |
| `engagement_rate_change_type` | `text` | Change direction | `"positive"`, `"negative"` |
| `average_views` | `integer` | Average views per post | `500000` |
| `average_views_change` | `numeric` | Views change percentage | `1.8` |
| `average_views_change_type` | `text` | Change direction | `"positive"`, `"negative"` |
| `average_likes` | `integer` | Average likes per post | `25000` |
| `average_likes_change` | `numeric` | Likes change percentage | `1.2` |
| `average_likes_change_type` | `text` | Change direction | `"positive"`, `"negative"` |
| `average_comments` | `integer` | Average comments per post | `1500` |
| `average_comments_change` | `numeric` | Comments change percentage | `0.8` |
| `average_comments_change_type` | `text` | Change direction | `"positive"`, `"negative"` |
| `primary_niche` | `text` | Primary content category | `"Lifestyle"` |
| `secondary_niche` | `text` | Secondary content category | `"Fashion"` |
| `hashtags` | `text[]` | Array of hashtags | `["lifestyle", "fashion", "beauty"]` |
| `location` | `text` | Creator's location | `"New York, NY"` |
| `locationRegion` | `text` | Location region | `"United States"` |
| `buzz_score` | `integer` | Buzz score (0-100) | `85` |
| `email` | `text` | Contact email | `"john@example.com"` |
| `recent_post_1` | `jsonb` | Recent post data | `{"media_urls": ["url1"], "video_url": "url2"}` |
| `recent_post_2` | `jsonb` | Recent post data | `{"media_urls": ["url3"], "video_url": "url4"}` |
| `recent_post_3` | `jsonb` | Recent post data | `{"media_urls": ["url5"], "video_url": "url6"}` |
| `recent_post_4` | `jsonb` | Recent post data | `{"media_urls": ["url7"], "video_url": "url8"}` |
| `recent_post_5` | `jsonb` | Recent post data | `{"media_urls": ["url9"], "video_url": "url10"}` |
| `recent_post_6` | `jsonb` | Recent post data | `{"media_urls": ["url11"], "video_url": "url12"}` |
| `recent_post_7` | `jsonb` | Recent post data | `{"media_urls": ["url13"], "video_url": "url14"}` |
| `recent_post_8` | `jsonb` | Recent post data | `{"media_urls": ["url15"], "video_url": "url16"}` |
| `recent_post_9` | `jsonb` | Recent post data | `{"media_urls": ["url17"], "video_url": "url18"}` |
| `recent_post_10` | `jsonb` | Recent post data | `{"media_urls": ["url19"], "video_url": "url20"}` |
| `recent_post_11` | `jsonb` | Recent post data | `{"media_urls": ["url21"], "video_url": "url22"}` |
| `recent_post_12` | `jsonb` | Recent post data | `{"media_urls": ["url23"], "video_url": "url24"}` |
| `created_at` | `timestamp` | Record creation time | `"2024-01-01T00:00:00Z"` |

## Data Fetching Functions

### 1. Fetch All Creators with Pagination
```javascript
// Fetch creators with pagination and filters
const fetchCreators = async (page = 1, filters = {}, sortField = 'followers_count', sortDirection = 'desc') => {
  const CREATORS_PER_PAGE = 24;
  const startIndex = (page - 1) * CREATORS_PER_PAGE;
  const endIndex = startIndex + CREATORS_PER_PAGE - 1;
  
  let query = supabase
    .from('creatordata')
    .select('*')
    .order(sortField, { ascending: sortDirection === 'asc' })
    .range(startIndex, endIndex);
  
  // Apply filters
  if (filters.niches?.length) {
    query = query.in('primary_niche', filters.niches);
  }
  if (filters.platforms?.length) {
    const platformConditions = filters.platforms.map(platform => {
      const lowerPlatform = platform.toLowerCase();
      if (lowerPlatform === 'instagram') return 'platform.ilike.instagram';
      if (lowerPlatform === 'tiktok') return 'platform.ilike.tiktok';
      if (lowerPlatform === 'youtube') return 'platform.ilike.youtube';
      if (lowerPlatform === 'x' || lowerPlatform === 'twitter') return 'platform.ilike.twitter';
      return `platform.ilike.${platform}`;
    });
    query = query.or(platformConditions.join(','));
  }
  if (filters.followers_min !== undefined) {
    query = query.gte('followers_count', filters.followers_min);
  }
  if (filters.followers_max !== undefined) {
    query = query.lte('followers_count', filters.followers_max);
  }
  if (filters.engagement_min !== undefined) {
    query = query.gte('engagement_rate', filters.engagement_min);
  }
  if (filters.engagement_max !== undefined) {
    query = query.lte('engagement_rate', filters.engagement_max);
  }
  if (filters.avg_views_min !== undefined) {
    query = query.gte('average_views', filters.avg_views_min);
  }
  if (filters.avg_views_max !== undefined) {
    query = query.lte('average_views', filters.avg_views_max);
  }
  if (filters.buzz_scores?.length) {
    // Handle buzz score ranges
    const conditions = [];
    filters.buzz_scores.forEach(scoreRange => {
      switch (scoreRange) {
        case '90%+':
          conditions.push('buzz_score.gte.90');
          break;
        case '80-90%':
          conditions.push('and(buzz_score.gte.80,buzz_score.lt.90)');
          break;
        case '70-80%':
          conditions.push('and(buzz_score.gte.70,buzz_score.lt.80)');
          break;
        case '60-70%':
          conditions.push('and(buzz_score.gte.60,buzz_score.lt.70)');
          break;
        case 'Less than 60%':
          conditions.push('buzz_score.lt.60');
          break;
      }
    });
    if (conditions.length > 0) {
      query = query.or(conditions.join(','));
    }
  }
  if (filters.locations?.length) {
    query = query.in('location', filters.locations);
  }
  
  const { data, error, count } = await query;
  if (error) throw error;
  
  return {
    creators: data || [],
    totalCount: count || 0,
    totalPages: Math.ceil((count || 0) / CREATORS_PER_PAGE)
  };
};
```

### 2. Search Creators by AI Prompt
```javascript
// Search creators based on AI prompt
const searchCreatorsByPrompt = async (prompt, page = 1, filters = {}) => {
  const CREATORS_PER_PAGE = 24;
  const startIndex = (page - 1) * CREATORS_PER_PAGE;
  const endIndex = startIndex + CREATORS_PER_PAGE - 1;
  
  // Base query
  let query = supabase
    .from('creatordata')
    .select('*')
    .range(startIndex, endIndex);
  
  // Apply text search based on prompt
  if (prompt) {
    // Search in display_name, bio, primary_niche, secondary_niche
    query = query.or(`display_name.ilike.%${prompt}%,bio.ilike.%${prompt}%,primary_niche.ilike.%${prompt}%,secondary_niche.ilike.%${prompt}%`);
  }
  
  // Apply additional filters
  if (filters.platforms?.length) {
    const platformConditions = filters.platforms.map(platform => {
      const lowerPlatform = platform.toLowerCase();
      if (lowerPlatform === 'instagram') return 'platform.ilike.instagram';
      if (lowerPlatform === 'tiktok') return 'platform.ilike.tiktok';
      if (lowerPlatform === 'youtube') return 'platform.ilike.youtube';
      if (lowerPlatform === 'x' || lowerPlatform === 'twitter') return 'platform.ilike.twitter';
      return `platform.ilike.${platform}`;
    });
    query = query.or(platformConditions.join(','));
  }
  
  // Apply other filters (followers, engagement, etc.)
  if (filters.followers_min !== undefined) {
    query = query.gte('followers_count', filters.followers_min);
  }
  if (filters.followers_max !== undefined) {
    query = query.lte('followers_count', filters.followers_max);
  }
  if (filters.engagement_min !== undefined) {
    query = query.gte('engagement_rate', filters.engagement_min);
  }
  if (filters.engagement_max !== undefined) {
    query = query.lte('engagement_rate', filters.engagement_max);
  }
  
  const { data, error, count } = await query;
  if (error) throw error;
  
  return {
    creators: data || [],
    totalCount: count || 0,
    totalPages: Math.ceil((count || 0) / CREATORS_PER_PAGE)
  };
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

### 2. Create Data Transformation Functions
```javascript
// Transform Supabase data to match UI expectations
const transformCreatorData = (dbCreator) => {
  // Extract thumbnails from recent posts
  const validThumbnails = [];
  for (let i = 1; i <= 12; i++) {
    const post = dbCreator[`recent_post_${i}`];
    if (post) {
      let thumbnailUrl = '';
      if (Array.isArray(post.media_urls) && post.media_urls.length > 0) {
        thumbnailUrl = post.media_urls[0];
      } else if (post.video_url) {
        thumbnailUrl = post.video_url;
      }
      if (thumbnailUrl) {
        validThumbnails.push(thumbnailUrl);
      }
    }
  }
  
  // Create social media array
  const socialMedia = [{
    platform: (dbCreator.platform || 'instagram').toLowerCase(),
    username: dbCreator.handle || '',
    url: dbCreator.profile_url || `https://${(dbCreator.platform || 'instagram').toLowerCase()}.com/${dbCreator.handle || ''}`
  }];
  
  // Create niches array
  const niches = [];
  if (dbCreator.primary_niche) {
    niches.push({ name: dbCreator.primary_niche, type: 'primary' });
  }
  if (dbCreator.secondary_niche) {
    niches.push({ name: dbCreator.secondary_niche, type: 'secondary' });
  }
  
  return {
    id: dbCreator.id,
    profile_pic: dbCreator.profile_image_url,
    match_score: dbCreator.match_score || undefined,
    buzz_score: dbCreator.buzz_score ?? 0,
    username: dbCreator.display_name,
    username_tag: `@${dbCreator.handle}`,
    social_media: socialMedia,
    bio: dbCreator.bio || '',
    followers: dbCreator.followers_count || 0,
    followers_change: dbCreator.followers_change || 0,
    followers_change_type: dbCreator.followers_change_type || 'positive',
    engagement: dbCreator.engagement_rate || 0,
    engagement_change: dbCreator.engagement_rate_change || 0,
    engagement_change_type: dbCreator.engagement_rate_change_type || 'positive',
    avg_views: dbCreator.average_views || 0,
    avg_views_change: dbCreator.average_views_change || 0,
    avg_views_change_type: dbCreator.average_views_change_type || 'positive',
    niches: niches,
    location: dbCreator.location || 'Unknown',
    thumbnails: validThumbnails.slice(0, 3),
    expanded_thumbnails: validThumbnails.slice(0, 4)
  };
};
```

## JavaScript Utilities

### 1. Format Numbers
```javascript
// Format numbers for display
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

### 2. Get Social Media Icon
```javascript
// Get social media icon
export const getSocialMediaIcon = (platform) => {
  const iconMap = {
    instagram: 'InstagramLogo.svg',
    tiktok: 'TikTokLogo.svg',
    youtube: 'YouTubeLogo.svg',
    x: 'XLogo.svg',
    twitter: 'XLogo.svg'
  };
  return iconMap[platform.toLowerCase()] || 'InstagramLogo.svg';
};
```

### 3. Get Match Score Styling
```javascript
// Get match score styling
export const getMatchScoreStyle = (score) => {
  const baseStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3px 6px',
    borderRadius: '6px',
    marginLeft: '1px',
    fontWeight: '600',
    fontSize: '11px',
    lineHeight: '14px',
    color: 'white',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
  };

  if (score >= 80) {
    return { ...baseStyle, backgroundColor: '#16a34a' };
  }
  if (score >= 50) {
    return { ...baseStyle, backgroundColor: '#ca8a04' };
  }
  if (score >= 30) {
    return { ...baseStyle, backgroundColor: '#ea580c' };
  }
  return { ...baseStyle, backgroundColor: '#dc2626' };
};
```

### 4. Create Donut Chart
```javascript
// Function to create donut chart with gradient
function createDonutChart(score, size = 38, strokeWidth = 4) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const center = size / 2;
  
  return `
    <div class="donut-chart" style="width: ${size}px; height: ${size}px;">
      <svg width="${size}" height="${size}">
        <defs>
          <linearGradient id="gradient-${score}" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#FC4C4B" />
            <stop offset="50%" stop-color="#CD45BA" />
            <stop offset="100%" stop-color="#6E57FF" />
          </linearGradient>
        </defs>
        <circle cx="${center}" cy="${center}" r="${radius}" stroke="#E5E7EB" stroke-width="${strokeWidth}" fill="transparent" class="donut-chart-circle-bg" />
        <circle cx="${center}" cy="${center}" r="${radius}" stroke="url(#gradient-${score})" stroke-width="${strokeWidth}" fill="transparent" stroke-dasharray="${circumference}" stroke-dashoffset="${strokeDashoffset}" stroke-linecap="round" />
      </svg>
      <div class="donut-chart-score">${score}%</div>
    </div>
  `;
}
```

## Usage Example

```javascript
// Example React component
import React, { useState, useEffect } from 'react';
import { supabase } from './supabase-client';
import { fetchCreators, transformCreatorData, formatNumber } from './utils';

const CreatorList = () => {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadCreators();
  }, [currentPage]);

  const loadCreators = async () => {
    setLoading(true);
    try {
      const result = await fetchCreators(currentPage, {}, 'followers_count', 'desc');
      const transformedCreators = result.creators.map(transformCreatorData);
      setCreators(transformedCreators);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error loading creators:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="creator-list-container">
      <div className="creator-list-table ai-mode">
        {/* Header */}
        <div className="creator-list-header ai-mode">
          {/* Header content */}
        </div>
        
        {/* Body */}
        <div className="creator-list-body">
          {creators.map((creator) => (
            <div key={creator.id} className="creator-list-row ai-mode">
              {/* Row content */}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CreatorList;
```

This comprehensive guide provides everything you need to integrate the creator list in list mode into your AI search page, including complete CSS styling, HTML structure, Supabase database schema, data fetching functions, and JavaScript utilities. 