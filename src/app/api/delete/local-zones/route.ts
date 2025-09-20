import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LocalZone from '@/lib/models/local-zone';

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    // Delete all local zones that haven't been synced
    const deleteResult = await LocalZone.deleteMany({ synced_with_api: false });

    return NextResponse.json({
      message: `Successfully deleted ${deleteResult.deletedCount} local zones`,
      deleted: deleteResult.deletedCount,
    });

  } catch (error) {
    console.error('Error deleting local zones:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
