# Scan History - Quick Reference Card

## File Locations

```
/Users/qmacmini/spotit/
├── src/
│   ├── screens/
│   │   └── scan/
│   │       └── ScanHistoryScreen.tsx ✅ NEW
│   ├── types/
│   │   └── navigation.ts ✅ MODIFIED (added ScanHistory route)
│   ├── database/
│   │   └── helpers/
│   │       └── scanHelpers.ts ✅ EXISTING (has getRecentScans)
│   └── navigation/
│       └── ScanStack.tsx ⏸️ NEEDS UPDATE
├── SCAN_HISTORY_SUMMARY.md ✅ NEW
├── SCAN_HISTORY_INTEGRATION.md ✅ NEW
├── SCAN_HISTORY_VISUAL_GUIDE.md ✅ NEW
└── SCAN_HISTORY_QUICK_REF.md ✅ NEW (this file)
```

## 2-Step Integration

### Step 1: Add Screen to Navigator
**File**: `/Users/qmacmini/spotit/src/navigation/ScanStack.tsx`

```tsx
// Add import at top (line ~8)
import ScanHistoryScreen from '../screens/scan/ScanHistoryScreen';

// Add screen in Stack.Navigator (after line 26)
<Stack.Screen
  name="ScanHistory"
  component={ScanHistoryScreen}
  options={{ title: 'Scan History' }}
/>
```

### Step 2: Add Navigation Button
**File**: `/Users/qmacmini/spotit/src/screens/scan/ScanModePickerScreen.tsx`

**Location**: After line 103, inside `<ScrollView>`, after the subheading

```tsx
<TouchableOpacity
  style={styles.historyButton}
  activeOpacity={0.7}
  onPress={() => navigation.navigate('ScanHistory')}
>
  <Text style={styles.historyButtonIcon}>{'\u{1F4C4}'}</Text>
  <Text style={styles.historyButtonText}>View Scan History</Text>
  <Text style={styles.historyChevron}>{'\u203A'}</Text>
</TouchableOpacity>
```

**Add Styles** (in StyleSheet at bottom):
```tsx
historyButton: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: colors.surface,
  borderRadius: borderRadius.md,
  padding: spacing.md,
  marginBottom: spacing.lg,
  borderWidth: 1,
  borderColor: colors.border,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 1,
},
historyButtonIcon: {
  fontSize: 20,
  marginRight: spacing.sm,
},
historyButtonText: {
  flex: 1,
  fontSize: fontSize.lg,
  fontWeight: fontWeight.medium,
  color: colors.text,
},
historyChevron: {
  fontSize: 20,
  color: colors.textTertiary,
},
```

## What the Screen Does

| Feature | Description |
|---------|-------------|
| **Data Source** | `getRecentScans(50)` from scanHelpers |
| **Update Method** | WatermelonDB observable (auto-updates) |
| **Card Info** | Thumbnail, room/zone, date, status, detections |
| **Status Colors** | 🟢 Completed, 🟠 Processing, 🔴 Failed |
| **Tap Action** | Navigate to ScanReview (completed only) |
| **Empty State** | Shows when no scans exist |

## Component Props

```typescript
type Props = StackScreenProps<ScanStackParamList, 'ScanHistory'>;
// No route params needed (undefined)
```

## Navigation

```typescript
// From any screen in ScanStack:
navigation.navigate('ScanHistory');

// From outside ScanStack (e.g., HomeScreen):
navigation.navigate('Scan', { screen: 'ScanHistory' });
```

## Database Query

```typescript
// In the component:
const [scans, setScans] = useState<Scan[]>([]);

useEffect(() => {
  const subscription = getRecentScans(50).subscribe(setScans);
  return () => subscription.unsubscribe();
}, []);
```

## Screen States

| State | UI Display |
|-------|------------|
| **0 scans** | Empty state with icon and message |
| **1-10 scans** | Scrollable list, no performance issues |
| **50+ scans** | Limited to 50 by query, smooth scrolling |

## Card Data Flow

```
Scan (from DB)
  ↓
Fetch room via relation → room.name
  ↓
Fetch zone via relation → zone.name (if zoneId exists)
  ↓
Render card with:
  - photoUri → Image or placeholder
  - roomName + zoneName → Location text
  - createdAt → Relative time
  - status → Colored badge
  - detectionCount → Detection badge (if completed)
```

## Styling

All styles follow existing patterns from:
- `RoomListScreen` (card layout)
- `HomeScreen` (badges, time format)
- `RoomDetailScreen` (metadata rows)

Uses theme tokens:
- `colors.*` - All colors
- `spacing.*` - All spacing
- `fontSize.*` - Text sizes
- `fontWeight.*` - Text weights
- `borderRadius.*` - Corner rounding

## Status Values

| Status | Color | Background | Hex |
|--------|-------|------------|-----|
| `completed` | Green | Green 15% | #10B981 |
| `processing` | Orange | Orange 15% | #F59E0B |
| `failed` | Red | Red 15% | #EF4444 |

## Time Format Logic

| Time Difference | Display |
|-----------------|---------|
| < 60 seconds | "Just now" |
| < 60 minutes | "Xm ago" |
| < 24 hours | "Xh ago" |
| 1 day | "Yesterday" |
| < 30 days | "Xd ago" |
| ≥ 30 days | "MM/DD/YYYY" |

## Common Issues & Solutions

### Issue: Room shows as "Unknown Room"
**Cause**: Room relation fetch failed
**Solution**: Check that room still exists in DB

### Issue: Screen doesn't update when new scan created
**Cause**: Observable not properly subscribed
**Solution**: Verify useEffect cleanup returns unsubscribe

### Issue: Thumbnails don't show
**Cause**: photoUri is null or invalid
**Solution**: Falls back to placeholder automatically

### Issue: TypeScript error on navigation
**Cause**: ScanHistory not in navigation types
**Solution**: Already added to ScanStackParamList

## Testing Commands

```bash
# Start Metro bundler
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Type check (will show pre-existing decorator errors)
npx tsc --noEmit
```

## Performance Notes

- **Efficient**: Uses FlatList for large lists
- **Lazy Loading**: Room/zone names fetched per-card
- **Observable**: Only re-renders on data changes
- **Limited**: Query returns max 50 scans
- **Smooth**: No blocking operations

## Dependencies (Already Installed)

```json
{
  "@nozbe/watermelondb": "^0.27.x",
  "@react-navigation/stack": "^6.x",
  "react": "^18.x",
  "react-native": "^0.73.x"
}
```

## Related Files

| File | Purpose |
|------|---------|
| `Scan.ts` | Database model |
| `Room.ts` | Database model |
| `Zone.ts` | Database model |
| `scanHelpers.ts` | Query functions |
| `navigation.ts` | Type definitions |
| `ScanStack.tsx` | Navigator config |

## Documentation Files

1. **SCAN_HISTORY_SUMMARY.md** - Overview and quick start
2. **SCAN_HISTORY_INTEGRATION.md** - Detailed integration guide
3. **SCAN_HISTORY_VISUAL_GUIDE.md** - Design specs and layout
4. **SCAN_HISTORY_QUICK_REF.md** - This reference card

## Next Steps After Integration

- [ ] Test empty state
- [ ] Test with multiple scans
- [ ] Verify status colors
- [ ] Test navigation to ScanReview
- [ ] Test room/zone name display
- [ ] Verify live updates work
- [ ] Test on both iOS and Android

## Future Enhancement Ideas

- Add filter by status (completed/processing/failed)
- Add filter by room dropdown
- Add search bar for room/zone names
- Add swipe-to-delete gesture
- Add pull-to-refresh
- Increase limit beyond 50 scans with pagination
- Add scan detail screen
- Add share/export functionality

## Need Help?

1. Check **SCAN_HISTORY_INTEGRATION.md** for detailed steps
2. Check **SCAN_HISTORY_VISUAL_GUIDE.md** for design questions
3. Check **SCAN_HISTORY_SUMMARY.md** for feature overview
4. Check existing screens for pattern examples:
   - `/Users/qmacmini/spotit/src/screens/rooms/RoomListScreen.tsx`
   - `/Users/qmacmini/spotit/src/screens/home/HomeScreen.tsx`

---

**Status**: Ready to integrate (just needs navigation setup)
**Estimated Integration Time**: 5 minutes
**Testing Time**: 10-15 minutes
**Total Time**: ~20 minutes
