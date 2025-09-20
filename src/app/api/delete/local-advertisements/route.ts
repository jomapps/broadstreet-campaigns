import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LocalAdvertisement from '@/lib/models/local-advertisement';

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    // Delete all local advertisements that haven't been synced
    const deleteResult = await LocalAdvertisement.deleteMany({ synced_with_api: false });

    return NextResponse.json({
      message: `Successfully deleted ${deleteResult.deletedCount} local advertisements`,
      deleted: deleteResult.deletedCount,
    });

  } catch (error) {
    console.error('Error deleting local advertisements:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
