import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient()

// Mengubah fungsi GET agar bisa memfilter, termasuk opsi untuk mengambil SEMUA data
export async function GET(req) {
    // 1. Ambil query parameter dari URL
    const url = new URL(req.url);
    const filterStatus = url.searchParams.get('status');

    // 2. Tentukan klausa WHERE berdasarkan parameter
    let whereClause = {};

    if (filterStatus === 'all') {
        // Jika ?status=all, ambil SEMUA pesanan (aktif + selesai)
        whereClause = {}; 
    } else if (filterStatus === 'finish') {
        // Jika ?status=finish, ambil hanya yang berstatus 'finish' (Histori)
        whereClause = { status: 'finish' };
    } else {
        // Default (atau parameter tidak ada): Ambil semua yang BUKAN 'finish' (Pesanan Aktif)
        whereClause = { 
        NOT: { 
            status: { 
                in: ['finish', 'pending'] 
            } 
        } 
    };
    }
    
    // 3. Eksekusi query dengan klausa WHERE yang fleksibel
    const orders = await prisma.basket.findMany({
        where: whereClause, // Menggunakan klausa yang sudah disiapkan
        include: {
            order_type: true,
            customers: {
                include: {
                    table: true
                }
            },
            orders: {
                include: {
                    menu: true,
                }
            }
        },
        // Untuk tampilan dashboard yang menampilkan semua data, mungkin Anda ingin mengurutkannya 
        // berdasarkan tanggal pembuatan terbaru secara default.
        orderBy: {
            create_at: 'desc' 
        }
    })

    return Response.json(orders)
}

export async function POST(req) {
    try {
        const { basket_id, status } = await req.json()

        const statusOrders = await prisma.basket.update({
            where: {
                id: basket_id
            },
            data: {
                status: status
            }
        })

        // Logika penghapusan sudah dihilangkan. Data histori aman.
        
        return new Response(JSON.stringify(statusOrders), { status: 201 })
    } catch(err) {
        console.error(err)
        return new Response("gagal update status order", { status: 500 })
    }
}