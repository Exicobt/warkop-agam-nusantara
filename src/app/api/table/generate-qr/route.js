import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient()

export async function POST(request) {
  try {
    const { table_number, table_id } = await request.json();

    if (!table_number) {
      return NextResponse.json(
        { error: 'Table number is required' },
        { status: 400 }
      );
    }

    const token = uuidv4();
    
    const now = new Date();
    const expiryHours = 4;
    const expired_at = new Date(now.getTime() + expiryHours * 60 * 60 * 1000);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const qrUrl = `${baseUrl}/kasir/${token}`;

    const updatedTable = await prisma.table.update({
      where: { 
        id: parseInt(table_id) 
      },
      data: {
        qr_token: token,
        qr_generated_at: new Date()
      }
    });

    const session = await prisma.tableSessions.create({
      data: {
        id: uuidv4(),
        table_number: table_number.toString(),
        token: token,
        status: 'active',
        expired_at: expired_at, 
        created_at: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      qr_url: qrUrl,
      token: token,
      table_number: table_number,
      session_id: session.id,
      expires_at: session.expired_at
    });

  } catch (error) {
    console.error('❌ Error generating QR:', error);
    return NextResponse.json(
      { error: 'Gagal generate QR code' },
      { status: 500 }
    );
  }
}