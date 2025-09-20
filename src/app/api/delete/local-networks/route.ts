import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LocalNetwork from '@/lib/models/local-network';

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    // Delete all local networks that haven't been synced
    const deleteResult = await LocalNetwork.deleteMany({ synced_with_api: false });

    return NextResponse.json({
      message: `Successfully deleted ${deleteResult.deletedCount} local networks`,
      deleted: deleteResult.deletedCount,
    });

  } catch (error) {
    console.error('Error deleting local networks:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
