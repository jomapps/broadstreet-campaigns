import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LocalAdvertiser from '@/lib/models/local-advertiser';

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    // Delete all local advertisers that haven't been synced
    const deleteResult = await LocalAdvertiser.deleteMany({ synced_with_api: false });

    return NextResponse.json({
      message: `Successfully deleted ${deleteResult.deletedCount} local advertisers`,
      deleted: deleteResult.deletedCount,
    });

  } catch (error) {
    console.error('Error deleting local advertisers:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
