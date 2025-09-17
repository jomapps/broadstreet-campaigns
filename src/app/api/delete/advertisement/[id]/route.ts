import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LocalAdvertisement from '@/lib/models/local-advertisement';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id: advertisementId } = await context.params;

    // Find and delete the local advertisement
    const deletedAdvertisement = await LocalAdvertisement.findByIdAndDelete(advertisementId);

    if (!deletedAdvertisement) {
      return NextResponse.json(
        { message: 'Local advertisement not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Local advertisement deleted successfully',
      advertisement: {
        mongo_id: deletedAdvertisement._id?.toString(),
        name: deletedAdvertisement.name,
      }
    });

  } catch (error) {
    console.error('Error deleting local advertisement:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
