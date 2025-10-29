import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient()

export async function GET() {
    const menus = await prisma.menu.findMany()
    return Response.json(menus)
}

export async function POST(req) {
    const { menu_id, nama, kategori, harga, gambar, action } = await req.json()

    if(action === "update") {
        try {
            const update = await prisma.menu.update({
                where: {
                    id: menu_id
                },
                data: {
                    nama: nama,
                    kategori: kategori,
                    harga: harga,
                    gambar: gambar
                }
            })

            return new Response(JSON.stringify(update))
        } catch(err) {
            console.error(err)
        }
    }

    if(action === "create") {
        try {
            const create = await prisma.menu.create({
                data: {
                    nama: nama,
                    kategori: kategori,
                    harga: harga,
                    gambar: gambar
                }
            })

            return new Response(JSON.stringify(create))
        } catch(err) {
            console.error(err)
        }
    }

    if(action === 'delete') {
        try {
            const deleteMenu = await prisma.menu.delete({
                where: {
                    id: menu_id
                }
            }) 

            return new Response(JSON.stringify(deleteMenu))
        } catch(err) {
            console.error(err)
        }
    }

    
}

GET()
    .then(async() => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        await prisma.$disconnect()
        process.exit(1)
    })