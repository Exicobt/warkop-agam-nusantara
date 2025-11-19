import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient()

export async function GET() {
    const table = await prisma.table.findMany()

    return Response.json(table)
}

export async function POST(req) {
    const { table_id, table_number, status, action } = await req.json()

    if(action === 'update') {
        const update = await prisma.table.update({
            where: {
                id: table_id
            },
            data: {
                table_number: table_number,
                status: status,
            }
        })

        return new Response(JSON.stringify(update))
    }

    if(action === 'create') {
        const create = await prisma.table.create({
            data: {
                table_number: table_number,
                status: status,
            }
        })

        return new Response(JSON.stringify(create))
    }

    if(action === 'delete') {
        await prisma.table.delete({
            where: {
                id: table_id
            }
        })
    }
}

GET()
    .then(async() => {
        await prisma.$disconnect()
    })
    .catch(async(e) => {
        await prisma.$disconnect()
        process.exit(1)
    })