# Scan History Screen Integration Guide

## Overview
A new **ScanHistoryScreen** component has been created at `/Users/qmacmini/spotit/src/screens/scan/ScanHistoryScreen.tsx` to display a list of all scans performed in the app.

## Screen Features
- Displays all scans ordered by creation date (most recent first)
- Shows scan thumbnail (or placeholder if no photo)
- Displays room name and zone name (if applicable)
- Shows relative time (e.g., "2h ago", "Yesterday")
- Displays scan status with color-coded badges:
  - **Completed** (green)
  - **Processing** (orange)
  - **Failed** (red)
- Shows detection count for completed scans
- Empty state with instructions when no scans exist
- Tappable cards that navigate to ScanReview for completed scans

## Files Modified/Created

### 1. Created
- `/Users/qmacmini/spotit/src/screens/scan/ScanHistoryScreen.tsx`

### 2. Modified
- `/Users/qmacmini/spotit/src/types/navigation.ts`
  - Added `ScanHistory: undefined` to `ScanStackParamList`

## Integration Steps

### Step 1: Add Screen to ScanStack Navigator

Open `/Users/qmacmini/spotit/src/navigation/ScanStack.tsx` and add the new screen:

```tsx
import ScanHistoryScreen from '../screens/scan/ScanHistoryScreen';

// Inside the Stack.Navigator, add this screen:
<Stack.Screen
  name="ScanHistory"
  component={ScanHistoryScreen}
  options={{ title: 'Scan History' }}
/>
```

**Recommended placement:** Add it after the `ScanModePicker` screen definition (around line 26).

### Step 2: Add Navigation Link

There are several good places to add a link to the Scan History screen:

#### Option A: Add to ScanModePickerScreen (Recommended)
Add a "View History" button at the top of the ScanModePickerScreen:

File: `/Users/qmacmini/spotit/src/screens/scan/ScanModePickerScreen.tsx`

```tsx
// After the subheading (around line 103), add:
<TouchableOpacity
  style={styles.historyButton}
  activeOpacity={0.7}
  onPress={() => navigation.navigate('ScanHistory')}
>
  <Text style={styles.historyButtonIcon}>{'\u{1F4C4}'}</Text>
  <Text style={styles.historyButtonText}>View Scan History</Text>
  <Text style={styles.historyChevron}>{'\u203A'}</Text>
</TouchableOpacity>

// Add these styles to the StyleSheet:
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
  shadowOffset: { width: 0, height: 1 },
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

#### Option B: Add Header Button to ScanModePickerScreen
Add a header button in the navigation options:

File: `/Users/qmacmini/spotit/src/navigation/ScanStack.tsx`

```tsx
<Stack.Screen
  name="ScanModePicker"
  component={ScanModePickerScreen}
  options={({ navigation }) => ({
    title: 'Choose Scan Mode',
    headerRight: () => (
      <TouchableOpacity
        onPress={() => navigation.navigate('ScanHistory')}
        style={{ paddingRight: 16 }}
      >
        <Text style={{ fontSize: 18 }}>{'\u{1F4C4}'}</Text>
      </TouchableOpacity>
    ),
  })}
/>
```

#### Option C: Add to HomeScreen Stats
Add a link in the HomeScreen's scan stat card:

File: `/Users/qmacmini/spotit/src/screens/home/HomeScreen.tsx`

Make the "Scans" stat card tappable and navigate to ScanHistory when pressed:

```tsx
// Wrap the scan stat card in a TouchableOpacity
<TouchableOpacity
  key={stat.label}
  style={styles.statCard}
  activeOpacity={stat.label === 'Scans' ? 0.7 : 1}
  onPress={() => {
    if (stat.label === 'Scans') {
      navigation.navigate('Scan', { screen: 'ScanHistory' });
    }
  }}
>
  {/* existing stat card content */}
</TouchableOpacity>
```

## Data Flow

The screen uses WatermelonDB observables for live updates:

1. **`getRecentScans(50)`** - Fetches up to 50 most recent scans
2. **Room/Zone names** - Fetched via relations from each scan's `roomId` and `zoneId`
3. **Live updates** - The screen automatically updates when scans are added/modified/deleted

## UI Consistency

The screen follows the existing SpotIt design system:

- **Colors**: Uses the standard color palette from `/Users/qmacmini/spotit/src/theme/colors.ts`
- **Typography**: Uses fontSize and fontWeight tokens from `/Users/qmacmini/spotit/src/theme/typography.ts`
- **Spacing**: Uses spacing and borderRadius tokens from `/Users/qmacmini/spotit/src/theme/spacing.ts`
- **Card Pattern**: Matches the style of RoomListScreen and RoomDetailScreen
- **Empty State**: Follows the pattern used in other screens

## Navigation Flow

```
ScanStack
  └─ ScanModePicker (initial screen)
       ├─ ScanHistory (NEW) ← User can view all past scans
       │    └─ ScanReview (tap on completed scan)
       ├─ CameraScan
       ├─ ScanReview
       ├─ AreaTypePicker
       └─ LayerSetup
```

## Testing Recommendations

1. **Empty State**: Test with no scans in the database
2. **Multiple Scans**: Create several scans with different statuses
3. **Long Room Names**: Test with long room/zone names for text truncation
4. **Different Statuses**: Verify color coding for completed/processing/failed scans
5. **Navigation**: Ensure tapping completed scans navigates to ScanReview
6. **Live Updates**: Create a new scan and verify it appears in the list automatically

## Future Enhancements

Potential improvements to consider:

1. **Filter by Status**: Add filter buttons to show only completed/processing/failed scans
2. **Filter by Room**: Allow filtering scans by specific room
3. **Delete Scans**: Add swipe-to-delete or long-press menu for removing scans
4. **Search**: Add search bar to find scans by room/zone name
5. **Sort Options**: Allow sorting by date, room name, or detection count
6. **Pull to Refresh**: Add pull-to-refresh gesture
7. **Pagination**: Load more scans as user scrolls (currently limited to 50)
8. **Scan Details**: Create a dedicated scan detail screen showing more information

## Dependencies

The screen depends on:

- `@nozbe/watermelondb` - Database queries
- `@react-navigation/stack` - Navigation typing
- Existing database models: `Scan`, `Room`, `Zone`
- Existing helpers: `getRecentScans()` from `scanHelpers.ts`

All dependencies are already installed and configured in the project.
