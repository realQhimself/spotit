# Scan History Screen - Visual Design Guide

## Screen Layout

```
┌─────────────────────────────────────────┐
│ ← [Scan History]                    [3] │ ← Header with count badge
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ┌────┐                              │ │
│ │ │📷  │  🚪 Kitchen › Fridge         │ │ ← Scan card with thumbnail
│ │ │    │  2h ago                      │ │    room/zone, and time
│ │ └────┘  [Completed] 🔍 12          › │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ┌────┐                              │ │
│ │ │📷  │  🚪 Living Room              │ │
│ │ │    │  Yesterday                   │ │
│ │ └────┘  [Processing]               › │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ┌────┐                              │ │
│ │ │📷  │  🚪 Bedroom › Closet         │ │
│ │ │    │  3d ago                      │ │
│ │ └────┘  [Completed] 🔍 8           › │ │
│ └─────────────────────────────────────┘ │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

## Component Breakdown

### 1. Header Section
```
┌─────────────────────────────────────────┐
│ [Scan History]                      [3] │
└─────────────────────────────────────────┘
```
- **Left**: Screen title "Scan History" (24px, bold, #111827)
- **Right**: Badge with count of scans (#4F46E5 background, white text)
- **Background**: White (#FFFFFF)
- **Border**: 1px bottom border (#E5E7EB)

### 2. Scan Card Layout
```
┌────────────────────────────────────────┐
│ ┌──────┐                               │
│ │      │  🚪 Kitchen › Fridge          │
│ │ 📷   │  2h ago                       │
│ │      │  [Completed] 🔍 12           ›│
│ └──────┘                               │
└────────────────────────────────────────┘
```

Each card contains:

#### A. Thumbnail (64x64px)
- **With Photo**: Displays scan photo with 8px border-radius
- **Without Photo**: Gray placeholder (#F3F4F6) with camera icon (📷 28px)
- **Spacing**: 8px margin-right

#### B. Content Area (Flexible width)
1. **Location Row**
   - Room icon (🚪 14px) + margin-right 6px
   - Text: "RoomName › ZoneName" (or just "RoomName" if no zone)
   - Font: 16px, semibold (#111827)
   - Single line with ellipsis if too long

2. **Date Text**
   - Relative time: "Just now", "2h ago", "Yesterday", "3d ago", or date
   - Font: 12px, regular (#6B7280)
   - Margin-bottom: 4px

3. **Metadata Row**
   - **Status Badge**:
     - Background: Status color at 15% opacity
     - Text: Status color (full opacity)
     - Font: 11px, semibold
     - Padding: 6px horizontal, 3px vertical
     - Border-radius: 8px
     - Colors:
       - Completed: #10B981 (green)
       - Processing: #F59E0B (orange)
       - Failed: #EF4444 (red)

   - **Detection Badge** (only for completed scans with detections):
     - Background: #EEF2FF
     - Icon: 🔍 (10px)
     - Count: Number in #4F46E5
     - Font: 11px, semibold
     - Gap: 4px between icon and count

#### C. Chevron (›)
- Font: 24px
- Color: #9CA3AF
- Padding: 8px horizontal

### 3. Empty State
```
┌─────────────────────────────────────────┐
│                                         │
│              📷 (64px)                  │
│                                         │
│          No Scans Yet                   │
│                                         │
│   Start scanning rooms to see your     │
│      scan history here.                │
│                                         │
└─────────────────────────────────────────┘
```
- Centered vertically and horizontally
- Icon: 📷 (64px)
- Title: "No Scans Yet" (20px, bold, #111827)
- Description: Instructions (14px, regular, #6B7280)
- Text alignment: center

## Color Palette

### Primary Colors
- **Primary**: #4F46E5 (Indigo-600)
- **Primary Light**: #818CF8 (Indigo-400)

### Background Colors
- **Background**: #F9FAFB (Gray-50)
- **Surface**: #FFFFFF (White)
- **Surface Secondary**: #F3F4F6 (Gray-100)

### Text Colors
- **Text**: #111827 (Gray-900)
- **Text Secondary**: #6B7280 (Gray-500)
- **Text Tertiary**: #9CA3AF (Gray-400)

### Semantic Colors
- **Success**: #10B981 (Green-500) - Completed scans
- **Warning**: #F59E0B (Amber-500) - Processing scans
- **Danger**: #EF4444 (Red-500) - Failed scans

### Border Colors
- **Border**: #E5E7EB (Gray-200)
- **Border Light**: #F3F4F6 (Gray-100)

## Spacing Scale
- **xs**: 4px
- **sm**: 8px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px

## Typography Scale
- **xs**: 10px
- **sm**: 12px
- **md**: 14px
- **lg**: 16px
- **xl**: 20px
- **xxl**: 24px
- **xxxl**: 32px

## Border Radius
- **xs**: 4px
- **sm**: 8px
- **md**: 12px
- **lg**: 16px
- **full**: 9999px (pill shape)

## Card Shadows
All scan cards have subtle shadows:
```
shadowColor: '#000'
shadowOffset: { width: 0, height: 2 }
shadowOpacity: 0.06
shadowRadius: 6
elevation: 2 (Android)
```

## Interactive States

### Scan Card
- **Default**: White background, subtle shadow
- **Pressed**: Opacity 0.7 (via activeOpacity)
- **Tap Action**:
  - If completed → Navigate to ScanReview
  - Otherwise → Show alert "Scan Not Complete"

## Responsive Behavior

### Card Content Flow
1. **Normal**: All content fits in one line
2. **Long Room Name**: Truncates with ellipsis (...)
3. **Multiple Badges**: Wrap to next line if needed (though unlikely)

### Empty State
- Maintains center alignment on all screen sizes
- Text wraps naturally for narrow screens

## Animations

### List Updates (via WatermelonDB Observable)
- New scans appear at the top
- Updates happen smoothly without jumps
- Deletions animate out naturally

### Scroll Behavior
- Smooth scrolling with iOS-style bounce
- No visible scrollbar (showsVerticalScrollIndicator: false)

## Accessibility Considerations

### Text Contrast
All text meets WCAG AA standards:
- Title text (#111827) on white: 15.8:1
- Secondary text (#6B7280) on white: 4.7:1
- Badge text uses full-opacity colors on light backgrounds

### Touch Targets
- Card touch target: Full card height (~88px) - exceeds 44px minimum
- Chevron provides visual affordance for tap interaction

### Status Communication
- Status is communicated both by color AND text label
- Icons provide additional context (🔍 for detections, 🚪 for room)

## Implementation Notes

### Performance
- Uses FlatList for efficient rendering of long lists
- Room/zone names fetched asynchronously to avoid blocking
- Observable subscription updates only changed items

### Data Freshness
- Screen automatically updates when:
  - New scans are created
  - Scan statuses change
  - Scans are deleted
- No manual refresh needed (but could add pull-to-refresh)

### Error Handling
- Shows "Unknown Room" if room fetch fails
- Handles missing zones gracefully (doesn't show zone separator)
- Empty state for zero scans

## Consistency with Existing Screens

This screen follows the same patterns as:

1. **RoomListScreen**
   - Similar card-based layout
   - Same empty state pattern
   - Matching shadows and spacing

2. **HomeScreen**
   - Same "Recent Items" card structure
   - Consistent badge styling
   - Same time formatting (timeAgo function)

3. **RoomDetailScreen**
   - Similar metadata row layouts
   - Matching confidence/detection badges
   - Same item card patterns

## Testing Scenarios

### Visual Tests
1. Empty state with no scans
2. 1 scan (tests singular layout)
3. 3-5 scans (tests scrolling)
4. 50+ scans (tests performance)
5. Mix of statuses (completed, processing, failed)
6. Long room names (test truncation)
7. Scans with and without zones
8. Scans with 0 detections vs many detections

### Interaction Tests
1. Tap completed scan → navigates to ScanReview
2. Tap processing scan → shows alert
3. Tap failed scan → shows alert
4. Scroll through long list
5. Screen updates when new scan created elsewhere

### Edge Cases
1. Room deleted but scan still exists
2. Zone deleted but scan references it
3. Very recent scan (shows "Just now")
4. Old scan (shows full date)
5. Scan with very high detection count (>99)
