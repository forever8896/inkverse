import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Sign out using Better Auth
    const response = await auth.api.signOut({
      headers: request.headers,
    });

    return new NextResponse(null, {
      status: 200,
      headers: (response as any).headers || undefined,
    });
  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json(
      { error: 'Failed to sign out' },
      { status: 500 }
    );
  }
}

// Also support GET for simple logout links
export async function GET(request: NextRequest) {
  try {
    // Sign out using Better Auth
    const response = await auth.api.signOut({
      headers: request.headers,
    });

    // Redirect to home page after logout
    return NextResponse.redirect(new URL('/', request.url), {
      status: 302,
      headers: (response as any).headers || undefined,
    });
  } catch (error) {
    console.error('Logout API error:', error);
    // Even if logout fails, redirect to home
    return NextResponse.redirect(new URL('/', request.url), {
      status: 302,
    });
  }
}