import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LocalZone from '@/lib/models/local-zone';
import Zone from '@/lib/models/zone';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await context.params;

    let deletedZone = null;
    let zoneType = '';

    // Check if this is a valid MongoDB ObjectId (24 hex characters)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(zoneId);

    if (isValidObjectId) {
      // Try to delete from local zones first
      deletedZone = await LocalZone.findByIdAndDelete(zoneId);
      zoneType = 'local';
    }

    // If not found in local zones or not a valid ObjectId, try main zones collection
    if (!deletedZone) {
      // Check if this might be a broadstreet_id (numeric)
      const numericZoneId = parseInt(zoneId);
      if (!isNaN(numericZoneId)) {
        deletedZone = await Zone.findOneAndDelete({ broadstreet_id: numericZoneId });
        zoneType = 'synced';
      } else if (isValidObjectId) {
        // If it's a valid ObjectId but not found in LocalZone, try Zone collection by _id
        deletedZone = await Zone.findByIdAndDelete(zoneId);
        zoneType = 'synced';
      }
    }

    if (!deletedZone) {
      return NextResponse.json(
        { message: 'Zone not found in local or synced collections' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: `${zoneType} zone deleted successfully`,
      zone: {
        mongo_id: deletedZone._id?.toString(),
        broadstreet_id: deletedZone.broadstreet_id,
        name: deletedZone.name,
        type: zoneType,
      }
    });

  } catch (error) {
    console.error('Error deleting zone:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
