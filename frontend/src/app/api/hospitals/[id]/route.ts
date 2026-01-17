import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const backendUrl = process.env.BACKEND_URL ;
    const { id } = await context.params;
    
    const response = await fetch(`${backendUrl}/api/hospitals/${id}`);
    
    if (!response.ok) {
        if (response.status === 404) {
            return NextResponse.json(
                { error: 'Hospital not found' },
                { status: 404 }
            );
        }
      return NextResponse.json(
        { error: 'Failed to fetch hospital' },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    return NextResponse.json(result.data || result);
  } catch (error) {
    console.error('Error proxying to backend:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const backendUrl = process.env.BACKEND_URL ;
    const { id } = await context.params;
    
    const response = await fetch(`${backendUrl}/api/hospitals/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to update hospital' },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error proxying to backend:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const backendUrl = process.env.BACKEND_URL ;
    const { id } = await context.params;
    
    const response = await fetch(`${backendUrl}/api/hospitals/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to delete hospital' },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error proxying to backend:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
