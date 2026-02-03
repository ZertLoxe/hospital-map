import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const location = searchParams.get('location');
  const radius = searchParams.get('radius');
  const type = searchParams.get('type');
  const pagetoken = searchParams.get('pagetoken');

  if (!pagetoken && (!location || !radius)) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Google Maps API key not configured' }, { status: 500 });
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
    
    if (pagetoken) {
      url.searchParams.set('pagetoken', pagetoken);
    } else {
      url.searchParams.set('location', location!);
      url.searchParams.set('radius', radius!);
      if (type) {
        url.searchParams.set('type', type);
      }
      // Biases results towards Morocco
      url.searchParams.set('region', 'ma');
    }
    
    url.searchParams.set('key', apiKey);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
      return NextResponse.json(data);
    } else {
      return NextResponse.json({ error: data.error_message || data.status }, { status: 500 });
    }
  } catch (error) {
    console.error('Error fetching from Google Places API:', error);
    return NextResponse.json({ error: 'Failed to fetch places' }, { status: 500 });
  }
}
