# Migration from OpenStreetMap to Google Maps

This document outlines the migration from OpenStreetMap/Leaflet to Google Maps.

## Changes Made

### 1. Dependencies Updated

**Removed:**
- `leaflet`
- `leaflet-defaulticon-compatibility`
- `leaflet-geosearch`
- `react-leaflet`
- `@types/react-leaflet`

**Added:**
- `@react-google-maps/api` (already present)

### 2. Files Modified

#### `/frontend/package.json`
- Removed all Leaflet-related dependencies
- Retained `@react-google-maps/api` for Google Maps integration

#### `/frontend/src/lib/overpass.ts`
- **Renamed to:** This file still exists but now handles Google Places API
- Replaced Overpass API logic with Google Places API calls
- Functions updated:
  - `fetchOverpassWithRetry()` → `fetchGooglePlacesWithRetry()`
  - `buildOverpassQuery()` → `buildGooglePlacesTypes()`
  - `parseOverpassResponse()` → `parseGooglePlacesResponse()`

#### `/frontend/src/components/MapClient.tsx`
- Replaced `MapContainer`, `TileLayer`, `Marker`, `Popup` from react-leaflet
- Now uses `GoogleMap`, `MarkerF`, `InfoWindowF` from @react-google-maps/api
- Added `useJsApiLoader` for loading Google Maps API
- Updated search to use Google Places Autocomplete service

#### `/frontend/src/components/SearchMap.tsx`
- Converted from Leaflet to Google Maps components
- Replaced custom Leaflet markers with Google Maps `MarkerF`
- Changed `Circle` to `CircleF` for radius visualization
- Updated map bounds logic to use Google Maps geometry library
- Changed facility verification link from OpenStreetMap to Google Maps

#### `/frontend/src/components/AddHospitalForm.tsx`
- Migrated map from Leaflet to Google Maps
- Updated location search to use Google Places service
- Replaced map click handlers with Google Maps event handlers

#### `/frontend/src/app/api/places/route.ts` (NEW)
- Created API proxy route for Google Places API calls
- Handles nearby search requests from the client
- Protects API key by keeping it server-side

### 3. Environment Variables

**Required:** You must add a Google Maps API key to your environment:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

### 4. Google Cloud Setup

To use Google Maps, you need to:

1. **Create a Google Cloud Project**
   - Visit https://console.cloud.google.com/
   - Create a new project

2. **Enable Required APIs**
   - Maps JavaScript API (required)
   - Places API (required)
   - Geocoding API (optional)

3. **Create API Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the generated API key

4. **Configure API Key (Recommended)**
   - Restrict by HTTP referrer for production
   - Add your domain (e.g., `yourdomain.com/*`)
   - Restrict to only the APIs you're using

5. **Enable Billing**
   - Google Maps requires a billing account
   - You get $200 free credit per month
   - Set up billing alerts to avoid unexpected charges

### 5. Key Differences

| Feature | OpenStreetMap | Google Maps |
|---------|--------------|-------------|
| **Cost** | Free | Paid (with free tier) |
| **Data Source** | Community-driven | Google proprietary |
| **Coverage** | Good in Europe | Excellent worldwide |
| **POI Data** | Variable quality | High quality |
| **API Complexity** | Simple (Overpass) | Moderate (Places API) |
| **Rate Limits** | Relaxed | Strict (with quotas) |

### 6. Running the Application

After migration:

```bash
# 1. Remove old dependencies
cd frontend
rm -rf node_modules package-lock.json

# 2. Install new dependencies
npm install

# 3. Add your Google Maps API key to .env.local
echo "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here" >> .env.local

# 4. Start the development server
npm run dev
```

### 7. Testing

Verify the following features work correctly:

- ✅ Map loads with Google Maps tiles
- ✅ Location search using Google Places
- ✅ Click on map to select location
- ✅ Hospital markers display correctly
- ✅ Search for nearby facilities
- ✅ Radius circle displays properly
- ✅ Info windows show facility details
- ✅ Links to Google Maps directions work

### 8. Cost Considerations

Google Maps pricing (as of 2026):

- **Maps JavaScript API**: $7 per 1,000 loads
- **Places API (Nearby Search)**: $32 per 1,000 requests
- **Places API (Find Place)**: $17 per 1,000 requests

**Free tier:** $200/month credit ≈ 28,000 map loads or ~6,000 nearby searches

**Cost optimization tips:**
- Cache search results when possible
- Implement request debouncing
- Use map sessions to reduce costs
- Set up budget alerts in Google Cloud

### 9. Troubleshooting

**Map doesn't load:**
- Check API key is correctly set in `.env.local`
- Verify Maps JavaScript API is enabled
- Check browser console for errors

**"This page can't load Google Maps correctly":**
- API key is invalid or restricted
- Billing not enabled on Google Cloud project
- Domain restrictions too strict

**Search doesn't work:**
- Ensure Places API is enabled
- Check API key has access to Places API
- Verify network requests in browser DevTools

### 10. Reverting to OpenStreetMap

If you need to revert:

```bash
# Checkout the previous commit before migration
git log --oneline  # Find the commit hash
git checkout <commit-hash-before-migration>
```

Or restore from backup if you created one before migration.

## Support

For Google Maps API issues:
- Documentation: https://developers.google.com/maps/documentation
- Support: https://support.google.com/googlemaps

For application-specific issues:
- Check the project README
- Review component code comments
- Consult the development team
