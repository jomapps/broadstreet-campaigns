import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LocalCampaign from '@/lib/models/local-campaign';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await context.params;

    // Find and delete the local campaign
    const deletedCampaign = await LocalCampaign.findByIdAndDelete(id);

    if (!deletedCampaign) {
      return NextResponse.json(
        { message: 'Local campaign not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Local campaign deleted successfully',
      campaign: {
        id: deletedCampaign._id,
        name: deletedCampaign.name,
      }
    });

  } catch (error) {
    console.error('Error deleting local campaign:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
