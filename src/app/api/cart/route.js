import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request) {
    try {
        const { order_type_id, orders, name, table, token } = await request.json(); 

        // ✅ VALIDASI TOKEN JIKA ADA (untuk QR code order)
        if (token) {
            const validSession = await prisma.tableSessions.findFirst({
                where: {
                    token: token,
                    status: 'active',
                    expired_at: { gt: new Date() },
                    table: {
                        status: 'available' // Pastikan meja masih available
                    }
                }
            });

            if (!validSession) {
                return new Response(
                    JSON.stringify({ 
                        error: "QR code sudah tidak valid. Silakan scan ulang QR code." 
                    }), 
                    { status: 400 }
                );
            }

            // ✅ Validasi bahwa table number match dengan token
            if (table && table !== validSession.table_number) {
                return new Response(
                    JSON.stringify({ 
                        error: "Meja tidak sesuai dengan QR code." 
                    }), 
                    { status: 400 }
                );
            }
        }

        let customers;

        if (order_type_id === 1) {
            // ✅ Untuk Dine In, pastikan meja available
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

            customers = await prisma.customers.create({
                data: {
                    name: name,
                    table: {
                        connect: { table_number: table }
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

        const newBasket = await prisma.basket.create({
            data: {
                order_type: { connect: { id: order_type_id } },
                orders: {
                    create: orders.map(order => ({
                        menu_id: order.id,
                        qty: order.qty,
                        total: (order.harga * order.qty)
                    }))
                },
                customers: { connect: { id: customers.id } },
            },
            include: {
                order_type: true,
                orders: true,
                customers: true
            }
        });

        // ✅ MARK TOKEN AS USED JIKA ORDER BERHASIL
        if (token) {
            await prisma.tableSessions.update({
                where: { token: token },
                data: { 
                    status: 'used',
                    order_id: newBasket.id // Simpan relasi ke order
                }
            });

            // ✅ UPDATE TABLE STATUS JADI NOT AVAILABLE
            if (order_type_id === 1 && table) {
                await prisma.table.update({
                    where: { table_number: table },
                    data: { status: 'not_available' }
                });
            }
        }

        // Update menu stats (existing code)
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

        console.log("Berhasil menambah data basket dengan orders:", newBasket);

        return new Response(JSON.stringify(newBasket), { status: 201 });

    } catch (err) {
        console.error(err);
        return new Response(
            JSON.stringify({ error: "Error creating basket" }), 
            { status: 500 }
        );
    }
}