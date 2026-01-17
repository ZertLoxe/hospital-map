import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const backendUrl = process.env.BACKEND_URL ;
    const response = await fetch(`${backendUrl}/api/hospitals/count`);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch hospital count' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying to backend:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
