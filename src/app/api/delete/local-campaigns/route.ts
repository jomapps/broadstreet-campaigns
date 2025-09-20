import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LocalCampaign from '@/lib/models/local-campaign';

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    // Delete all local campaigns that haven't been synced
    const deleteResult = await LocalCampaign.deleteMany({ synced_with_api: false });

    return NextResponse.json({
      message: `Successfully deleted ${deleteResult.deletedCount} local campaigns`,
      deleted: deleteResult.deletedCount,
    });

  } catch (error) {
    console.error('Error deleting local campaigns:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
