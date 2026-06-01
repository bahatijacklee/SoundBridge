# SoundBridge VIP Tier System

## Overview

The VIP tier system restricts access to higher-level tasks and exclusive rewards based on membership status. Free users have limited access, while VIP members enjoy unlimited task completion and higher rewards.

## Tier Structure

### Bronze Level (Free)
- **Access**: Available to all users
- **Daily Tasks**: 3 free tasks available daily
- **Rewards**: Standard earnings and points
- **Target**: Entry-level engagement
- **Cost**: Free

### Silver, Gold, Platinum Levels (VIP Only)
- **Access**: VIP members only
- **Daily Tasks**: All available tasks can be completed
- **Rewards**: Higher earnings and points
- **Target**: Exclusive rewards for premium members
- **Cost**: VIP Membership required

## Implementation Details

### Database Query Logic

```typescript
// User VIP Status Check
const { data: userData } = await supabase
  .from('users')
  .select('is_vip')
  .eq('id', authUser.id)
  .single()

if (userData) {
  setIsVip(userData.is_vip)
}
```

### Task Filtering Logic

```typescript
// Filter tasks based on VIP status
const filteredTasks = tasks.filter((task) => {
  if (isVip) {
    return true // VIP users see all tasks
  }
  // Non-VIP users see only Bronze level tasks
  return task.required_level === 'bronze' || !task.required_level
})

// Limit free tasks to 3 for non-VIP users
const displayedFreeTasks = isVip 
  ? freeTasks 
  : freeTasks.slice(0, 3)

// Show locked tasks to non-VIP users
const lockedTasks = isVip
  ? []
  : tasks.filter(
      (task) =>
        task.required_level !== 'bronze' &&
        task.required_level !== null
    )
```

## User Experience

### For Free Users (Non-VIP)

**Dashboard Display:**
```
┌─────────────────────────────────────────────────┐
│ Free Plan - Limited Access                      │
│ You have access to 3 of X free tasks daily.     │
│ Unlock all tasks with VIP membership! 🔒        │
└─────────────────────────────────────────────────┘
```

**Task Visibility:**
- ✓ See all 3 free Bronze level tasks
- ✓ Can view locked higher-tier tasks
- ✗ Cannot interact with locked tasks
- ✗ Cannot see task rewards until upgraded

**Locked Task Display:**
```
┌──────────────────────────────┐
│ [VIP Only Overlay]           │
│      🔒                       │
│   VIP Only                   │
│ Unlock Premium Access        │
│                              │
│ Button: "VIP Only" (Gray)    │
└──────────────────────────────┘
```

### For VIP Users

**Dashboard Display:**
```
┌─────────────────────────────────────────────────┐
│ VIP Member ✨                                    │
│ You have unlimited access to all tasks and      │
│ exclusive rewards! 👑                            │
└─────────────────────────────────────────────────┘
```

**Task Visibility:**
- ✓ See all tasks (Bronze, Silver, Gold, Platinum)
- ✓ Can complete all available tasks
- ✓ No daily task limits
- ✓ Access to premium rewards

## UI Components

### Free User Banner
- **Background**: Amber/Orange gradient
- **Border**: Amber with 50% opacity
- **Icon**: Lock icon
- **Message**: Shows limited access information
- **Position**: Top of tasks page

### VIP User Banner
- **Background**: Yellow/Amber gradient
- **Border**: Yellow with 50% opacity
- **Icon**: Crown emoji
- **Message**: Shows unlimited access confirmation
- **Position**: Top of tasks page

### Locked Task Card
- **Overlay**: Semi-transparent black with blur
- **Lock Icon**: Yellow lock symbol
- **Text**: "VIP Only" with "Unlock Premium Access"
- **Button State**: Disabled, gray background
- **Button Text**: "VIP Only"

### Free Task Card
- **Border**: Gray (normal state)
- **Background**: Slate-800
- **Hover**: Yellow border highlight
- **Status**: Can be completed
- **Button**: Yellow (enabled)

## Database Schema

### Tasks Table
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  title VARCHAR,
  description TEXT,
  task_type VARCHAR,
  reward_amount DECIMAL,
  reward_points INTEGER,
  artist_id UUID REFERENCES artists(id),
  required_level VARCHAR, -- 'bronze', 'silver', 'gold', 'platinum'
  created_at TIMESTAMP
)
```

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR,
  username VARCHAR,
  is_vip BOOLEAN DEFAULT false,
  total_earnings DECIMAL,
  total_points INTEGER,
  created_at TIMESTAMP
)
```

## Business Logic Rules

### Task Access Rules
```
Rule 1: VIP Status Check
├─ IF user.is_vip = true
│  └─ Show ALL tasks (bronze, silver, gold, platinum)
└─ IF user.is_vip = false
   ├─ Show bronze tasks (3 only)
   └─ Show locked silver/gold/platinum tasks

Rule 2: Task Completion
├─ IF task is locked AND user is non-VIP
│  └─ Prevent completion, show "VIP Only" button
└─ IF task is unlocked OR user is VIP
   └─ Allow completion, show "Complete Task" button

Rule 3: Daily Limits
├─ IF user is VIP
│  └─ No limits, all tasks available
└─ IF user is non-VIP
   ├─ Show only 3 bronze tasks
   └─ Remaining tasks shown as locked
```

### Reward Structure

**Free User (Bronze Tasks Only):**
```
Example Task Rewards:
- Like Artist: $1.00 + 10 points
- Follow Artist: $2.50 + 25 points
- Read Bio: $0.50 + 5 points

Daily Potential: ~$4.00 + 40 points
```

**VIP User (All Tasks):**
```
Example Task Rewards:
- Like Artist (Bronze): $1.00 + 10 points
- Follow Artist (Bronze): $2.50 + 25 points
- Read Bio (Bronze): $0.50 + 5 points
- Buy Card (Silver): $5.00 + 50 points
- Premium Like (Gold): $10.00 + 100 points
- Exclusive (Platinum): $25.00 + 250 points

Daily Potential: Unlimited access to all rewards
```

## Feature Flags & Configuration

### Current Settings
```javascript
FREE_TASKS_LIMIT = 3  // Number of free tasks available daily
FREE_TIER_NAME = 'Bronze'
VIP_TIERS = ['Silver', 'Gold', 'Platinum']
```

### Customizable Parameters
```javascript
// Can be adjusted based on business needs
FREE_TASKS_LIMIT = 3        // Change to 5, 2, etc.
SHOW_LOCKED_TASKS = true    // Show or hide locked tasks to free users
SHOW_REWARDS_PREVIEW = false // Show/hide reward amounts for locked tasks
```

## Migration Path

### Free → VIP Conversion Process
```
User clicks "Upgrade Now" button
  ↓
Opens VIP purchase modal
  ↓
Completes payment
  ↓
User's is_vip flag set to true
  ↓
Page refreshes/reloads
  ↓
All tasks now visible and accessible
```

### Data Persistence
- Free users' completed tasks remain in history
- Total earnings accumulate across both tiers
- Points accumulate across both tiers
- Upon upgrade, no data is lost

## Testing Checklist

### Free User Testing
- [ ] Banner shows "Free Plan - Limited Access"
- [ ] Only 3 free tasks are displayed
- [ ] Locked tasks show "VIP Only" overlay
- [ ] Locked task buttons are disabled
- [ ] Cannot complete locked tasks
- [ ] Lock icon visible on locked tasks
- [ ] Free tasks can be completed normally

### VIP User Testing
- [ ] Banner shows "VIP Member ✨"
- [ ] All tasks are visible (bronze + silver + gold + platinum)
- [ ] No "VIP Only" overlays
- [ ] All task buttons are enabled
- [ ] Can complete all tasks
- [ ] No daily limits apply
- [ ] Rewards shown correctly

### UI/UX Testing
- [ ] Banner responsive on mobile
- [ ] Locked overlay visible and readable
- [ ] Lock icon displays correctly
- [ ] Button text changes appropriately
- [ ] Transitions are smooth
- [ ] No visual glitches with opacity/blur

### Conversion Testing
- [ ] Free user can click upgrade button
- [ ] Upon VIP purchase, tasks immediately unlock
- [ ] Page shows new VIP banner after upgrade
- [ ] Previous completed tasks remain in history
- [ ] Balance updates correctly

## Future Enhancements

### Potential Improvements
1. **Task Preview for Non-VIP**
   - Show task rewards even when locked
   - Preview of what premium members earn

2. **Tier-Specific Limits**
   - Different limits for Bronze/Silver/Gold
   - Gradual unlock system

3. **Trial Period**
   - Free 7-day VIP trial
   - Limited free trial tasks

4. **Bundle Offers**
   - Discounted VIP + top-up bundles
   - Limited-time promotions

5. **Task Rotation**
   - Different free tasks each day
   - Seasonal limited tasks for VIP

6. **Achievements System**
   - Badges for completing tier levels
   - Milestone rewards for consistency

## Summary

The VIP tier system:
✓ Restricts higher-level tasks to VIP members
✓ Provides 3 free daily tasks for all users
✓ Shows locked tasks with clear UX indicators
✓ Maintains complete task history for users
✓ Encourages upgrade through feature visibility
✓ Protects revenue through premium access
✓ Maintains user trust with transparent pricing

This creates a sustainable freemium model while encouraging premium membership adoption.
