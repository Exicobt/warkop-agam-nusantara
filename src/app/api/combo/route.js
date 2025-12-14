import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient()

export async function POST(request) {
  try {
    const { name, price, items } = await request.json();

    // Validasi
    if (!name || !price || !items || items.length < 2) {
      return NextResponse.json(
        { error: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    // Buat kombo baru
    const newCombo = await prisma.combo.create({
      data: {
        name,
        price,
        items: {
          create: items.map(menu_id => ({
            menu_id: parseInt(menu_id)
          }))
        }
      },
      include: {
        items: {
          include: {
            menu: true
          }
        }
      }
    });

    return NextResponse.json(newCombo, { status: 201 });
  } catch (error) {
    console.error('Error creating combo:', error);
    return NextResponse.json(
      { error: 'Gagal membuat kombo menu' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const combos = await prisma.combo.findMany({
      include: {
        items: {
          include: {
            menu: true
          }
        }
      },
      orderBy: {
        id: 'desc'
      }
    });

    return NextResponse.json(combos);
  } catch (error) {
    console.error('Error fetching combos:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data kombo menu' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const { id } = await request.json();

    if (id) {
    // Hapus semua combo items terlebih dahulu
      await prisma.comboItem.deleteMany({
        where: { combo_id: Number(id) },
      });

      // Hapus combo berdasarkan ID
      await prisma.combo.delete({
        where: { id: Number(id) },
      });
    } else {
      // Hapus semua combo items terlebih dahulu
      await prisma.comboItem.deleteMany();

      // Hapus semua combos
      await prisma.combo.deleteMany();
    }
    return NextResponse.json({ message: 'Semua kombo menu berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting all combos:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus semua kombo menu' },
      { status: 500 }
    );
  
  }
  
}

export async function PUT(request) {
  try {
    const { id, name, price, items } = await request.json();

    if (!id || !name || !price || !items || items.length < 2) {
      return NextResponse.json(
        { error: "Data tidak lengkap untuk update kombo" },
        { status: 400 }
      );
    }

    // Hapus semua item lama (biar update bersih)
    await prisma.comboItem.deleteMany({
      where: { combo_id: Number(id) },
    });

    // Update data combo + isi ulang items
    const updatedCombo = await prisma.combo.update({
      where: { id: Number(id) },
      data: {
        name,
        price,
        items: {
          create: items.map((menu_id) => ({
            menu_id: Number(menu_id),
          })),
        },
      },
      include: {
        items: {
          include: {
            menu: true,
          },
        },
      },
    });

    return NextResponse.json(updatedCombo, { status: 200 });
  } catch (error) {
    console.error("Error updating combo:", error);
    return NextResponse.json(
      { error: "Gagal mengupdate kombo menu" },
      { status: 500 }
    );
  }
}
