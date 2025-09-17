import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Theme from '@/lib/models/theme';
import Zone from '@/lib/models/zone';

// GET /api/themes/[id] - Get theme with zones
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id: themeId } = await params;

    const theme = await Theme.findById(themeId).lean() as any;

    if (!theme) {
      return NextResponse.json(
        { error: 'Theme not found' },
        { status: 404 }
      );
    }

    // Get zone details for the theme
    const zones = await Zone.find({
      broadstreet_id: { $in: theme.zone_ids }
    }).lean();

    return NextResponse.json({ 
      theme,
      zones 
    });
  } catch (error) {
    console.error('Error fetching theme:', error);
    return NextResponse.json(
      { error: 'Failed to fetch theme' },
      { status: 500 }
    );
  }
}

// PUT /api/themes/[id] - Update theme name/description
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { name, description } = body;

    const theme = await Theme.findById(id);
    
    if (!theme) {
      return NextResponse.json(
        { error: 'Theme not found' },
        { status: 404 }
      );
    }

    // Validate name if provided
    if (name !== undefined) {
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Theme name is required' },
          { status: 400 }
        );
      }

      // Check if another theme with same name exists
      const existingTheme = await Theme.findOne({
        name: name.trim(),
        _id: { $ne: id }
      });

      if (existingTheme) {
        return NextResponse.json(
          { error: 'A theme with this name already exists' },
          { status: 409 }
        );
      }

      theme.name = name.trim();
    }

    if (description !== undefined) {
      theme.description = description?.trim() || undefined;
    }

    await theme.save();

    return NextResponse.json({ 
      theme: theme.toJSON(),
      message: 'Theme updated successfully' 
    });

  } catch (error) {
    console.error('Error updating theme:', error);
    return NextResponse.json(
      { error: 'Failed to update theme' },
      { status: 500 }
    );
  }
}

// DELETE /api/themes/[id] - Delete theme
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const theme = await Theme.findById(id);

    if (!theme) {
      return NextResponse.json(
        { error: 'Theme not found' },
        { status: 404 }
      );
    }

    await Theme.findByIdAndDelete(id);

    return NextResponse.json({ 
      message: 'Theme deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting theme:', error);
    return NextResponse.json(
      { error: 'Failed to delete theme' },
      { status: 500 }
    );
  }
}
