import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LocalNetwork from '@/lib/models/local-network';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = params;

    // Find and delete the local network
    const deletedNetwork = await LocalNetwork.findByIdAndDelete(id);

    if (!deletedNetwork) {
      return NextResponse.json(
        { message: 'Local network not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Local network deleted successfully',
      network: {
        id: deletedNetwork._id,
        name: deletedNetwork.name,
      }
    });

  } catch (error) {
    console.error('Error deleting local network:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
