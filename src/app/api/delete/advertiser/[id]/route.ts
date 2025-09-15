import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LocalAdvertiser from '@/lib/models/local-advertiser';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await context.params;

    // Find and delete the local advertiser
    const deletedAdvertiser = await LocalAdvertiser.findByIdAndDelete(id);

    if (!deletedAdvertiser) {
      return NextResponse.json(
        { message: 'Local advertiser not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Local advertiser deleted successfully',
      advertiser: {
        id: deletedAdvertiser._id,
        name: deletedAdvertiser.name,
      }
    });

  } catch (error) {
    console.error('Error deleting local advertiser:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
