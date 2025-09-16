import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Network from '@/lib/models/network';

export async function GET() {
  try {
    console.log('Testing MongoDB connection...');
    console.log('MongoDB URI:', process.env.MONGODB_URI);
    
    // Test the database connection
    await connectDB();
    console.log('MongoDB connection successful');
    
    // Test a simple query
    const networkCount = await Network.countDocuments();
    console.log('Network count:', networkCount);
    
    return NextResponse.json({
      success: true,
      message: 'MongoDB connection successful',
      networkCount,
      mongoUri: process.env.MONGODB_URI
    });
  } catch (error) {
    console.error('MongoDB test error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'MongoDB connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      mongoUri: process.env.MONGODB_URI
    }, { status: 500 });
  }
}
