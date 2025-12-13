import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request) {
    try {
        const { orders, name, table, total, token } = await request.json(); 

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

        // PREPARE ORDERS DATA - TANGANI COMBO
        const orderItems = [];

        for (const order of orders) {
            if (order.type === 'combo') {
                // Untuk combo, ambil items dari database
                const combo = await prisma.combo.findUnique({
                    where: { id: order.id },
                    include: {
                        items: {
                            include: {
                                menu: true
                            }
                        }
                    }
                });

                if (combo && combo.items) {
                    // Buat order untuk setiap item dalam combo
                    for (const comboItem of combo.items) {
                        orderItems.push({
                            menu_id: comboItem.menu_id,
                            qty: order.qty,
                            total: comboItem.menu.harga * order.qty
                        });
                    }
                }
            } else {
                // Untuk menu biasa
                orderItems.push({
                    menu_id: order.id,
                    qty: order.qty,
                    total: order.harga * order.qty
                });
            }
        }

        // 3. Buat Basket (Pesanan) dengan status default 'pending'
        const newBasket = await prisma.basket.create({
            data: {
                customers: { connect: { id: customers.id } },
                status: 'pending', // Status awal: pending
                orders: {
                    create: orderItems
                },
                total: total
            },
            include: {
                orders: {
                    include: {
                        menu: true // Include menu info untuk debugging
                    }
                },
                customers: { include: { table: true } }
            }
        });
        
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

        // 6. Update menu stats
        await Promise.all(
            orderItems.map(async (order) => {
                await prisma.menu_stats.upsert({
                    where: { menu_id: order.menu_id },
                    update: {
                        quantity: {
                            increment: order.qty
                        }
                    },
                    create: {
                        menu_id: order.menu_id,
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