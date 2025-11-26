import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request) {
    try {
        const { order_type_id, orders, name, table, token } = await request.json(); 

        // 1. VALIDASI TOKEN JIKA ADA (untuk QR code order)
        if (token) {
            const validSession = await prisma.tableSessions.findFirst({
                where: {
                    token: token,
                    status: 'active',
                    expired_at: { gt: new Date() },
                    table: {
                        status: 'available' // Pastikan meja masih available saat scan
                    }
                }
            });

            if (!validSession) {
                return new Response(
                    JSON.stringify({ 
                        error: "QR code sudah tidak valid atau meja sudah terisi." 
                    }), 
                    { status: 400 }
                );
            }
        }

        let customers;
        let tableIdForUpdate = null; // Untuk menyimpan ID meja jika ada

        if (order_type_id === 1) {
            // 2. Untuk Dine In, pastikan meja available sebelum membuat customer
            const tableCheck = await prisma.table.findFirst({
                where: { 
                    table_number: table,
                    status: 'available'
                }
            });

            if (!tableCheck) {
                return new Response(
                    JSON.stringify({ 
                        error: "Meja tidak tersedia atau sedang digunakan." 
                    }), 
                    { status: 400 }
                );
            }
            
            tableIdForUpdate = tableCheck.id; // Simpan ID meja
            
            customers = await prisma.customers.create({
                data: {
                    name: name,
                    table: {
                        connect: { id: tableIdForUpdate }
                    }
                }
            });

        } else {
            // Take Away
            customers = await prisma.customers.create({
                data: {
                    name: name
                }
            });
        }

        // 3. Buat Basket (Pesanan) dengan status default 'pending'
        const newBasket = await prisma.basket.create({
            data: {
                order_type: { connect: { id: order_type_id } },
                customers: { connect: { id: customers.id } },
                status: 'pending', // Status awal: pending
                orders: {
                    create: orders.map(order => ({
                        menu_id: order.id,
                        qty: order.qty,
                        total: (order.harga * order.qty)
                    }))
                },
            },
            include: {
                order_type: true,
                orders: true,
                customers: { include: { table: true } }
            }
        });

        // 4. Update Table Status menjadi 'not_available' (Dine In)
        if (order_type_id === 1 && tableIdForUpdate) {
            await prisma.table.update({
                where: { id: tableIdForUpdate },
                data: { status: 'not_available' }
            });
        }
        
        // 5. MARK TOKEN AS USED (Jika menggunakan QR code)
        if (token) {
            await prisma.tableSessions.update({
                where: { token: token },
                data: { 
                    status: 'used',
                    order_id: newBasket.id // Simpan relasi ke order
                }
            });
        }

        // 6. Update menu stats (existing code)
        await Promise.all(
            orders.map(async (order) => {
                await prisma.menu_stats.upsert({
                where: { menu_id: order.id },
                update: {
                    quantity: {
                    increment: order.qty
                    }
                },
                create: {
                    menu_id: order.id,
                    quantity: order.qty
                }
                });
            })
        );

        console.log("Berhasil menambah data basket dengan status 'pending':", newBasket.id);

        return new Response(JSON.stringify(newBasket), { status: 201 });

    } catch (err) {
        console.error(err);
        return new Response(
            JSON.stringify({ error: "Error creating basket" }), 
            { status: 500 }
        );
    }
}