import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Theme from '@/lib/models/theme';

// GET /api/themes/search - Search themes with query params
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    let mongoQuery: any = {};
    
    if (query.trim()) {
      mongoQuery = {
        $or: [
          { name: { $regex: query.trim(), $options: 'i' } },
          { description: { $regex: query.trim(), $options: 'i' } }
        ]
      };
    }
    
    const themes = await Theme.find(mongoQuery)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean();
    
    const total = await Theme.countDocuments(mongoQuery);
    
    return NextResponse.json({ 
      themes,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + themes.length < total
      }
    });
  } catch (error) {
    console.error('Error searching themes:', error);
    return NextResponse.json(
      { error: 'Failed to search themes' },
      { status: 500 }
    );
  }
}
