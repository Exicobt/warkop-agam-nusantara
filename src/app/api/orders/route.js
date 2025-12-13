import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient()

// Mengubah fungsi GET agar bisa memfilter, termasuk opsi untuk mengambil SEMUA data
export async function GET(req) {
    const url = new URL(req.url);
    const filterStatus = url.searchParams.get('status');

    // Tentukan kondisi WHERE berdasarkan filter
    let whereClause = {};

    if (filterStatus) {
        // Jika ada filter spesifik
        
        if (filterStatus === 'all') {
        // Jika ?status=all, ambil SEMUA pesanan termasuk pending
        whereClause = {}; 
        } else if (filterStatus === 'finish') {
            // Jika ?status=finish, ambil hanya yang berstatus 'finish' (Histori)
            whereClause = { status: 'finish' };
        } else if (filterStatus === 'pending') {
            // Jika ?status=pending, ambil hanya pending
            whereClause = { status: 'pending' };
        } else {
            // Untuk status lainnya (waiting, preparing, done, cancelled)
            whereClause = { status: filterStatus };
        }
    } else {
        // Default: ambil semua pesanan aktif (kecuali pending dan finish)
        whereClause = {
            status: {
                in: ['waiting', 'preparing', 'done'] // Hanya yang sedang diproses
            }
        };
    }

    try {
        const orders = await prisma.basket.findMany({
            where: whereClause,
            include: {
                customers: {
                    include: {
                        table: true
                    }
                },
                orders: {
                    include: {
                        menu: true, // Ini sudah benar, include menu
                    }
                },
                payment_method: true, // Tambahkan payment method

                
            },
            orderBy: {
                create_at: 'desc'
            }
        })

        // Format data untuk memastikan response konsisten
        const formattedOrders = orders.map(order => ({
            id: order.id,
            create_at: order.create_at,
            status: order.status,
            customers: order.customers,
            total: order.total,
            orders: order.orders.map(item => ({
                id: item.id,
                qty: item.qty,
                total: item.total, // TOTAL sudah dihitung dari database
                menu: item.menu ? {
                    id: item.menu.id,
                    nama: item.menu.nama,
                    harga: item.menu.harga, // HARGA SATUAN dari database
                    kategori: item.menu.kategori,
                    gambar: item.menu.gambar
                } : null
            })),
            payment_method: order.payment_method
        }))

        return Response.json(formattedOrders)
    } catch (error) {
        console.error("Error fetching orders:", error)
        return new Response(
            JSON.stringify({ error: "Gagal mengambil data pesanan" }),
            { status: 500 }
        )
    }
}

export async function POST(req) {
    try {
        const { basket_id, status } = await req.json()

        // Get current order data
        const currentOrder = await prisma.basket.findUnique({
            where: { id: basket_id },
            include: {
                customers: {
                    include: { table: true }
                }
            }
        })

        if (!currentOrder) {
            return new Response(
                JSON.stringify({ error: "Pesanan tidak ditemukan" }), 
                { status: 404 }
            )
        }

        // Prepare update data
        const updateData = { status: status }

        // Jika status diubah ke 'finish' (diselesaikan oleh kasir)
        if (status === 'finish') {
            // Set finish time
            
            // Jika ada meja, kembalikan meja ke available
            if (currentOrder.customers?.table) {
                await prisma.table.update({
                    where: { id: currentOrder.customers.table.id },
                    data: { status: 'available' }
                })
            }
        }

        // Update order status
        const statusOrders = await prisma.basket.update({
            where: { id: basket_id },
            data: updateData
        })

        return new Response(JSON.stringify(statusOrders), { status: 200 })
    } catch(err) {
        console.error("Error updating order:", err)
        return new Response(
            JSON.stringify({ error: "Gagal update status order" }), 
            { status: 500 }
        )
    }
}