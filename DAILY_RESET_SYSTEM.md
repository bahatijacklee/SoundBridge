# SoundBridge - Daily Task Reset System

## Overview

The daily task reset system allows users to complete tasks every day and earn rewards progressively. While tasks reset daily, all accumulated earnings, points, and progress are maintained permanently and never reset.

## Key Features

### 1. Daily Task Completion
- Users can complete each task **once per day**
- Tasks reset at UTC midnight (00:00 UTC)
- Users can complete the same task on different days
- Each completion is tracked with a date stamp

### 2. Cumulative Rewards
- Total earnings accumulate across all days
- Total points accumulate across all days
- User balance grows progressively
- All historical data is preserved

### 3. Persistent Progress
- Level progression is never reset
- All historical task completions are recorded
- User stats show cumulative totals
- No penalty for not completing tasks daily

## Database Schema Changes

### Modified Table: `user_tasks`

```sql
-- New columns added:
- completion_date: DATE (tracks which date task was completed)

-- Updated constraint:
- UNIQUE constraint on (user_id, task_id, completion_date)
- Allows same task to be completed on different dates
- Prevents duplicate completion on same date

-- New index:
- idx_user_tasks_daily on (user_id, completion_date)
- Optimizes queries for daily task lookups
```

### Unchanged Tables:
- `users` - stores cumulative total_earnings and total_points
- `level_progress` - never resets
- `transactions` - all transactions are permanent records

## Implementation Details

### Tasks Page (`/app/(app)/tasks/page.tsx`)

**Daily Completion Check:**
```typescript
// Fetch only today's completed tasks
const todayDate = getTodayDate() // Returns YYYY-MM-DD format
const { data: completed } = await supabase
  .from('user_tasks')
  .select('task_id, completion_date')
  .eq('user_id', authUser.id)
  .eq('completion_date', todayDate)
```

**Task Completion Handler:**
```typescript
handleCompleteTask() {
  // 1. Check if task is completed TODAY (not ever)
  // 2. If not completed today, allow completion
  // 3. Insert new record with completion_date = TODAY
  // 4. Add reward_amount to total_earnings (cumulative)
  // 5. Add reward_points to total_points (cumulative)
  // 6. Never decrease earnings or points
  // 7. Update UI to show "Completed Today"
}
```

**Button States:**
- **Available**: Shows "Complete Task" - clickable, yellow button
- **Completed Today**: Shows "Completed Today" - disabled, green button
- **Reset Tomorrow**: Automatically resets to "Complete Task" at midnight UTC

### Home Page (`/app/(app)/home/page.tsx`)

**Daily Earnings Display:**
```typescript
// New cards showing:
1. Today's Earnings: Sum of all earned_amount from today's completions
2. Today's Points: Sum of all earned_points from today's completions
3. Total Earnings: User's cumulative total_earnings (never resets)
4. Total Points: User's cumulative total_points (never resets)
```

**Query:**
```typescript
// Fetch today's tasks only
const { data: todayTasks } = await supabase
  .from('user_tasks')
  .select('earned_amount, earned_points')
  .eq('user_id', authUser.id)
  .eq('completion_date', todayDate)

// Calculate today's total
const totalEarnings = todayTasks.reduce((sum, task) => sum + (task.earned_amount || 0), 0)
const totalPoints = todayTasks.reduce((sum, task) => sum + (task.earned_points || 0), 0)
```

## User Experience Flow

### Daily Task Workflow

```
Day 1:
├─ User logs in
├─ Sees all tasks available (Not completed today)
├─ Completes 3 tasks: +$10, +$5, +$3 = $18 earned
├─ Total earnings: $18
└─ Dashboard shows: Today +$18, Total $18

Day 2:
├─ User logs in
├─ Tasks reset (new day)
├─ Previously completed tasks are available again
├─ Completes same 3 tasks: +$10, +$5, +$3 = $18 earned
├─ Total earnings: $18 + $18 = $36
├─ Dashboard shows: Today +$18, Total $36
└─ User sees progress accumulating

Day 3:
├─ User logs in
├─ Completes 5 tasks today: +$25 earned
├─ Total earnings: $36 + $25 = $61
├─ Dashboard shows: Today +$25, Total $61
└─ History visible in transactions page
```

### UI Updates

**Tasks Page:**
- Shows "Completed Today" badge for tasks done today
- Shows "Complete Task" for tasks not yet done today
- Previous completions (from other days) don't appear as "completed"

**Home Dashboard:**
- Displays separate cards for "Today's Earnings" and "Total Earnings"
- Separate cards for "Today's Points" and "Total Points"
- Shows progressive growth over time

**Account/Profile Page:**
- Shows complete transaction history
- Lists all historical task completions
- Shows cumulative stats

## Business Logic

### Earnings Rules

```
✓ Earnings are cumulative - never reset
✓ Each task can be completed once per day
✓ Completing same task multiple days = multiple earnings
✓ Daily earnings are visible separately from total
✓ Total always equals sum of all daily earnings
```

### Example Scenario

| Day | Task | Earnings | Daily Total | Cumulative Total |
|-----|------|----------|-------------|------------------|
| 1   | Like Artist | $5 | $5 | $5 |
| 1   | Follow Artist | $10 | $15 | $15 |
| 2   | Like Artist | $5 | $5 | $20 |
| 2   | Rate Artist | $3 | $8 | $23 |
| 3   | Follow Artist | $10 | $10 | $33 |

## Technical Considerations

### Date Handling

```typescript
// Always use UTC date
const getTodayDate = () => {
  const date = new Date()
  return date.toISOString().split('T')[0] // YYYY-MM-DD UTC
}

// This ensures consistent behavior across timezones
// Resets at midnight UTC for all users
```

### Performance Optimizations

```sql
-- Index for fast daily queries
CREATE INDEX idx_user_tasks_daily 
ON public.user_tasks(user_id, completion_date);

-- Allows quick lookup of "today's tasks"
-- Speeds up home page dashboard loading
-- Improves tasks page rendering
```

### Data Integrity

```
Constraint: UNIQUE(user_id, task_id, completion_date)
Ensures:
├─ User can complete task once per day
├─ Multiple completions possible on different dates
├─ Database prevents duplicate daily completions
└─ No manual cleanup needed
```

## API Endpoints Used

### Fetch Today's Tasks
```typescript
supabase
  .from('user_tasks')
  .select('task_id, completion_date')
  .eq('user_id', userId)
  .eq('completion_date', todayDate)
```

### Insert Task Completion
```typescript
supabase.from('user_tasks').insert({
  user_id: userId,
  task_id: taskId,
  earned_amount: taskRewardAmount,
  earned_points: taskRewardPoints,
  completion_date: todayDate,
})
```

### Update Cumulative Earnings
```typescript
supabase
  .from('users')
  .update({
    total_earnings: newTotal,
    total_points: newPoints,
  })
  .eq('id', userId)
```

## Migration Notes

### For Existing Data

If migrating from a system without daily resets:

1. All existing completed tasks are marked with the date they were completed
2. Earnings remain cumulative
3. Users can see their earning history
4. No data loss occurs during migration

### Backward Compatibility

- Old task completions without dates will fail migration
- New system assumes all tasks have completion_date
- Can backfill dates if needed using task creation timestamps

## Future Enhancements

### Potential Improvements

1. **Timezone Support**
   - Allow users to set preferred timezone
   - Reset at user's local midnight instead of UTC

2. **Streak Tracking**
   - Track consecutive days of task completion
   - Bonus rewards for streaks

3. **Daily Limits**
   - Optional cap on daily earnings
   - Rate limiting to prevent abuse

4. **Analytics Dashboard**
   - Show earning trends over time
   - Identify most profitable tasks
   - Track user engagement patterns

5. **Rewards Multiplier**
   - Increase earnings for consecutive days
   - VIP users get bonus multipliers
   - Special events with double rewards

## Testing Checklist

- [ ] Task completes successfully and adds to earnings
- [ ] Same task can be completed again tomorrow
- [ ] Button changes to "Completed Today" after completion
- [ ] Button resets to "Complete Task" at midnight UTC
- [ ] Daily earnings card shows correct today's total
- [ ] Total earnings card shows cumulative total
- [ ] Earnings never decrease
- [ ] Points accumulate correctly
- [ ] Transaction history shows all completions with dates
- [ ] Mobile responsive for all task cards
- [ ] Loading states work correctly
- [ ] Error handling displays proper messages

## Summary

The daily reset system enables users to:
✓ Complete tasks every day for continuous rewards
✓ Accumulate earnings over time without limits
✓ Track both daily and cumulative progress
✓ Maintain permanent earning history
✓ Engage more consistently with the platform

All while maintaining data integrity, user trust, and encouraging long-term engagement.
