# Health & Wellness Platform Migration Plan

## 🎯 Overview

This document outlines the complete migration from the general `creatordata` table to a specialized `healthwellness` table, transforming BuzzBerry from a general marketing platform to a health & wellness focused creator discovery platform.

## 📊 Current State Analysis

### Current `creatordata` Table
- **61 fields** including basic info, metrics, and social data
- **Key fields**: `primary_niche`, `secondary_niche`, `bio`, `hashtags`, `engagement_rate`, `buzz_score`
- **Used by**: 4 main API endpoints and multiple frontend components

### API Endpoints Using `creatordata`
1. `/api/ai-matches` - AI-powered creator matching
2. `/api/creator-recommendations` - Creator discovery
3. `/api/chat-creator-results` - Chat-based creator search
4. `/api/import-creators` - Creator import functionality

## 🏥 New Health & Wellness Schema

### Key Health & Wellness Fields
- **`primary_wellness_niche`**: fitness, nutrition, mental_health, yoga, meditation, wellness_lifestyle, holistic_health, sports, recovery, wellness_business
- **`wellness_specialties`**: weight_loss, muscle_building, stress_management, flexibility, mind_body_connection, meal_planning, nutrition_education, mindfulness
- **`health_credentials`**: certified_trainer, nutritionist, yoga_instructor, therapist, doctor, wellness_practitioner
- **`wellness_engagement_score`**: Specialized engagement for health content
- **`content_quality_score`**: Quality of health advice/education
- **`credibility_score`**: Based on credentials and content accuracy
- **`service_types`**: personal_training, nutrition_coaching, wellness_consulting, online_courses
- **`content_themes`**: workout_routines, nutrition_tips, mental_health, recovery, motivation

## 🔄 Migration Strategy

### Phase 1: Database Schema Creation
1. **Create `healthwellness` table** with health/wellness specific fields
2. **Create `healthwellness_index` table** for semantic search
3. **Set up proper indexes** for performance
4. **Configure RLS policies** for security

### Phase 2: Data Migration
1. **Run migration script** to transfer data from `creatordata` to `healthwellness`
2. **Filter creators** based on health/wellness relevance
3. **Map general niches** to wellness-specific niches
4. **Extract wellness specialties** from bio and hashtags
5. **Calculate health-specific metrics**

### Phase 3: API Endpoint Updates
1. **Update `/api/ai-matches`** to use `healthwellness` table
2. **Update `/api/creator-recommendations`** for wellness focus
3. **Update `/api/chat-creator-results`** for health queries
4. **Update `/api/import-creators`** for wellness data

### Phase 4: Frontend Component Updates
1. **Update creator cards** to show wellness-specific information
2. **Add wellness filters** (niches, specialties, credentials)
3. **Update search functionality** for health/wellness terms
4. **Add wellness-specific metrics** display

### Phase 5: Testing & Validation
1. **Test data migration** completeness
2. **Validate API endpoints** functionality
3. **Test frontend components** with new data
4. **Performance testing** with new schema

## 📋 Implementation Steps

### Step 1: Run Database Migrations
```sql
-- 1. Create healthwellness schema
-- Run: database/migrations/healthwellness_schema.sql

-- 2. Migrate data from creatordata
-- Run: database/migrations/migrate_creatordata_to_healthwellness.sql
```

### Step 2: Update TypeScript Types
- **File**: `app/types/healthwellness.ts` ✅ Created
- **Update**: `app/lib/supabase.ts` to include healthwellness types
- **Update**: All API endpoints to use new types

### Step 3: Update API Endpoints

#### `/api/ai-matches/route.ts`
```typescript
// Change from:
.from('creatordata')
// To:
.from('healthwellness')

// Update niche filtering:
.in('primary_wellness_niche', selected_niches)
.in('wellness_specialties', selected_specialties)
```

#### `/api/creator-recommendations/route.ts`
```typescript
// Change from:
.from('creatordata')
// To:
.from('healthwellness')

// Update filters for wellness focus:
if (query.filters.primary_wellness_niche?.length) {
  supabaseQuery = supabaseQuery.in('primary_wellness_niche', query.filters.primary_wellness_niche)
}
if (query.filters.wellness_specialties?.length) {
  supabaseQuery = supabaseQuery.overlaps('wellness_specialties', query.filters.wellness_specialties)
}
```

#### `/api/chat-creator-results/route.ts`
```typescript
// Update to use healthwellness table
// Add wellness-specific search capabilities
```

#### `/api/import-creators/route.ts`
```typescript
// Update to work with healthwellness schema
// Add wellness data validation
```

### Step 4: Update Frontend Components

#### Creator Cards
- **Add wellness credentials** display
- **Show wellness specialties** 
- **Display health-specific metrics**
- **Add service offerings** information

#### Filter Components
- **Add wellness niche filters**
- **Add specialty filters**
- **Add credential filters**
- **Add service type filters**

#### Search Functionality
- **Update search to prioritize wellness terms**
- **Add wellness-specific autocomplete**
- **Improve health/wellness content matching**

### Step 5: Update Database Types
```typescript
// Update app/lib/supabase.ts
export type Database = {
  public: {
    Tables: {
      healthwellness: {
        Row: HealthWellnessCreator;
        Insert: Partial<HealthWellnessCreator>;
        Update: Partial<HealthWellnessCreator>;
      };
      healthwellness_index: {
        Row: HealthWellnessIndex;
        Insert: Partial<HealthWellnessIndex>;
        Update: Partial<HealthWellnessIndex>;
      };
    };
  };
};
```

## 🚀 Rollout Plan

### Phase 1: Database Migration (Day 1)
1. **Run schema migration** in Supabase
2. **Run data migration** script
3. **Verify data integrity** and completeness
4. **Test basic queries** on new tables

### Phase 2: API Updates (Day 2-3)
1. **Update API endpoints** one by one
2. **Test each endpoint** thoroughly
3. **Update error handling** for new schema
4. **Add wellness-specific validation**

### Phase 3: Frontend Updates (Day 4-5)
1. **Update TypeScript types** throughout codebase
2. **Update creator display components**
3. **Add wellness-specific filters**
4. **Update search functionality**

### Phase 4: Testing & Launch (Day 6-7)
1. **End-to-end testing** of all functionality
2. **Performance testing** with new schema
3. **User acceptance testing**
4. **Launch to production**

## 🔍 Data Migration Details

### Wellness Niche Mapping
```sql
-- General niches → Wellness niches
'fitness' → 'fitness'
'nutrition' → 'nutrition'  
'health' → 'wellness_lifestyle'
'wellness' → 'wellness_lifestyle'
'yoga' → 'yoga'
'mental_health' → 'mental_health'
'sports' → 'sports'
'lifestyle' → 'wellness_lifestyle'
```

### Wellness Specialties Extraction
- **From bio content**: Extract specialties based on keywords
- **From hashtags**: Analyze wellness-related hashtags
- **From content themes**: Identify recurring wellness topics

### Health Credentials Detection
- **Certified indicators**: "certified", "certification"
- **Professional titles**: "doctor", "therapist", "nutritionist"
- **Training credentials**: "trainer", "instructor", "coach"

### Service Types Identification
- **Personal training**: "personal", "train", "coach"
- **Nutrition coaching**: "nutrition", "diet", "meal"
- **Wellness consulting**: "consultation", "wellness", "health"
- **Online courses**: "course", "program", "class"

## 📊 Expected Results

### Data Migration
- **~70% of creators** should migrate (health/wellness relevant)
- **Enhanced metadata** for each creator
- **Improved search relevance** for wellness queries

### Performance Improvements
- **Faster wellness queries** with specialized indexes
- **Better semantic search** with wellness-focused embeddings
- **Improved recommendation accuracy** for health/wellness content

### User Experience
- **More relevant creators** for health/wellness brands
- **Better filtering options** for wellness specialties
- **Enhanced creator profiles** with health credentials
- **Improved search results** for wellness queries

## 🔧 Rollback Plan

### If Issues Arise
1. **Keep `creatordata` table** intact during migration
2. **Maintain API compatibility** during transition
3. **Quick rollback** by reverting API endpoints
4. **Data restoration** from `creatordata` if needed

### Rollback Steps
1. **Revert API endpoints** to use `creatordata`
2. **Update frontend components** to original state
3. **Restore original types** and interfaces
4. **Verify functionality** with original schema

## 📈 Success Metrics

### Technical Metrics
- **Migration completion rate**: >95% of relevant creators
- **API response times**: <200ms for wellness queries
- **Search accuracy**: >90% relevant results for wellness queries
- **Data integrity**: 100% successful migration validation

### Business Metrics
- **User engagement**: Increased time on wellness-focused content
- **Search relevance**: Higher click-through rates for wellness creators
- **Filter usage**: Increased use of wellness-specific filters
- **Creator quality**: Better matches for health/wellness brands

## 🎯 Next Steps

1. **Review and approve** this migration plan
2. **Run database migrations** in development environment
3. **Test data migration** with sample data
4. **Update API endpoints** one by one
5. **Update frontend components** for wellness focus
6. **Deploy to production** with monitoring
7. **Monitor performance** and user feedback

This migration will transform BuzzBerry into a specialized health & wellness creator discovery platform, providing more relevant and valuable matches for health-focused brands and agencies.
