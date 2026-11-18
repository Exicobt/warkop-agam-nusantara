import React from 'react'
import { cn } from '@/lib/utils'

export const Table = ({ children, className }) => {
    return (
        <table className={cn('w-full', className)}>
            { children }
        </table>
    )
}

export const TableHeader = ({ children, className }) => {
    return (
        <thead className={cn("bg-gray-50 border-b border-gray-200", className)}>
            { children }
        </thead>
    )
}

export const TableRow = ({ children }) => {
    return (
        <tr>
            { children }
        </tr>
    )
}

export const TableHead = ({ children, className }) => {
    return (
        <th className={cn("text-left py-4 px-6 font-semibold text-gray-800", className)}>
            { children }
        </th>
    )
}

export const TableBody = ({ children, className }) => {
    return (
        <tbody className={cn("divide-y divide-gray-200", className)}>
            { children }
        </tbody>
    )
}

export const TableCell = ({ children, className }) => {
    return (
        <td className={cn("py-4 px-6", className)}>
            { children }
        </td>
    )
}
