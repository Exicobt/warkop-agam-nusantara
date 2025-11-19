import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient()

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Token tidak ditemukan' 
      });
    }

    console.log('🔍 Validating token:', token);
    console.log('🕒 Current time:', new Date());

    // Validasi token dengan logging detail
    const session = await prisma.tableSessions.findFirst({
      where: {
        token: token,
        status: 'active'
        // SEMENTARA: Comment dulu expired_at check untuk debugging
        // expired_at: { gt: new Date() }
      },
      include: {
        table: true
      }
    });

    console.log('📋 Session found:', session);

    if (!session) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Token tidak ditemukan atau sudah digunakan' 
      });
    }

    // Debug expired time
    console.log('⏰ Session expired_at:', session.expired_at);
    console.log('⏰ Time until expiry:', session.expired_at - new Date());

    // Check expiry dengan buffer
    const now = new Date();
    const expiryBuffer = 5 * 60 * 1000; // 5 menit buffer
    const isExpired = session.expired_at < new Date(now.getTime() - expiryBuffer);

    if (isExpired) {
      console.log('❌ Token expired');
      return NextResponse.json({ 
        valid: false, 
        error: 'Token sudah kadaluarsa' 
      });
    }

    // Check table availability
    if (session.table.status !== 'available') {
      console.log('❌ Table not available:', session.table.status);
      return NextResponse.json({ 
        valid: false, 
        error: 'Meja sedang tidak tersedia' 
      });
    }

    console.log('✅ Token valid for table:', session.table_number);
    
    return NextResponse.json({ 
      valid: true, 
      table_number: session.table_number,
      session_id: session.id
    });

  } catch (error) {
    console.error('❌ Error validating session:', error);
    return NextResponse.json({ 
      valid: false, 
      error: 'Terjadi kesalahan validasi' 
    });
  }
}