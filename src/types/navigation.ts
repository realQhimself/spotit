/**
 * Navigation type definitions for the SpotIt app.
 *
 * Each navigator has its own param list so that screens receive
 * strongly-typed route params and navigation props.
 */

// ---------------------------------------------------------------------------
// Root Stack (Auth flow + Main app)
// ---------------------------------------------------------------------------
export type RootStackParamList = {
  Auth: undefined;
  MainTabs: undefined;
};

// ---------------------------------------------------------------------------
// Main Bottom Tabs
// ---------------------------------------------------------------------------
export type MainTabParamList = {
  Home: undefined;
  Rooms: undefined;
  Scan: undefined;
  Search: undefined;
  Settings: undefined;
};

// ---------------------------------------------------------------------------
// Home Stack
// ---------------------------------------------------------------------------
export type HomeStackParamList = {
  HomeScreen: undefined;
  SearchResults: { query: string };
  ItemDetail: { itemId: string };
};

// ---------------------------------------------------------------------------
// Rooms Stack
// ---------------------------------------------------------------------------
export type RoomsStackParamList = {
  RoomList: undefined;
  RoomDetail: { roomId: string };
  ZoneDetail: { zoneId: string };
  ItemDetail: { itemId: string };
};

// ---------------------------------------------------------------------------
// Scan Stack
// ---------------------------------------------------------------------------
export type ScanStackParamList = {
  ScanModePicker: undefined;
  CameraScan: { mode: 'quick' | 'room' | 'area' };
  ScanReview: { scanId: string };
  AreaTypePicker: undefined;
  LayerSetup: { areaType: string };
  RoomPlanScan: { roomId: string };
};

// ---------------------------------------------------------------------------
// Search Stack
// ---------------------------------------------------------------------------
export type SearchStackParamList = {
  Search: undefined;
  SearchResults: { query: string; filters?: { room?: string; category?: string } };
  ItemDetail: { itemId: string };
};

// ---------------------------------------------------------------------------
// Settings Stack
// ---------------------------------------------------------------------------
export type SettingsStackParamList = {
  Settings: undefined;
  Profile: undefined;
  SyncStatus: undefined;
};
