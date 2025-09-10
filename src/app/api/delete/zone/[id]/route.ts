import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LocalZone from '@/lib/models/local-zone';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = params;

    // Find and delete the local zone
    const deletedZone = await LocalZone.findByIdAndDelete(id);

    if (!deletedZone) {
      return NextResponse.json(
        { message: 'Local zone not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Local zone deleted successfully',
      zone: {
        id: deletedZone._id,
        name: deletedZone.name,
      }
    });

  } catch (error) {
    console.error('Error deleting local zone:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
