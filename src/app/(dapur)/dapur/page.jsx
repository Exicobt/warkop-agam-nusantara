'use client'

import { useEffect, useState } from "react"
import { Clock, ChefHat, CheckCircle, Calendar, Bell, Menu, CheckSquare, XCircle, Package } from "lucide-react"
import Navbar from "../components/navbar"

const Page = () => {
  const [orders, setOrders] = useState([])
  const [waiting, setWaiting] = useState(0)
  const [cooking, setCooking] = useState(0)
  const [ready, setReady] = useState(0)
  const [completed, setCompleted] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [filter, setFilter] = useState('all') // 'all', 'waiting', 'preparing', 'done'
  const [selectedOrder, setSelectedOrder] = useState(null)

  const fetchOrders = async() => {
    setIsLoading(true)
    try {
      // Fetch berdasarkan filter
      const url = filter === 'all' ? "/api/orders" : `/api/orders?status=${filter}`
      const res = await fetch(url)
      const data = await res.json()
      setOrders(data)
      
      // Hitung statistik
      setWaiting(data.filter(order => order.status === 'waiting').length)
      setCooking(data.filter(order => order.status === 'preparing').length)
      setReady(data.filter(order => order.status === 'done').length)
      // Hanya pesanan yang sudah ditandai finish oleh kasir
      setCompleted(data.filter(order => order.status === 'finish').length)
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateStatus = async(order, status) => {
    try {
      await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          basket_id: order.id,
          status: status
        })
      })
      
      fetchOrders() // Refresh data
    } catch (error) {
      console.error("Error updating status:", error)
      alert("Gagal mengupdate status pesanan")
    }
  }

  const handleMarkAsReady = (order) => {
    setSelectedOrder(order)
  }

  const confirmMarkAsReady = async() => {
    if (selectedOrder) {
      await updateStatus(selectedOrder, "done")
      setSelectedOrder(null)
    }
  }

  useEffect(() => {
    fetchOrders()
    
    // Auto refresh setiap 30 detik
    const interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
  }, [filter])

  const getStatusConfig = (status) => {
    const configs = {
      waiting: {
        bg: "bg-gradient-to-br from-orange-50 to-yellow-50 border-l-4 border-orange-400",
        badge: "bg-orange-100 text-orange-800",
        icon: Clock,
        iconColor: "text-orange-500",
        label: "Menunggu"
      },
      preparing: {
        bg: "bg-gradient-to-br from-blue-50 to-cyan-50 border-l-4 border-blue-400",
        badge: "bg-blue-100 text-blue-800",
        icon: ChefHat,
        iconColor: "text-blue-500",
        label: "Memasak"
      },
      done: {
        bg: "bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-green-400",
        badge: "bg-green-100 text-green-800",
        icon: CheckCircle,
        iconColor: "text-green-500",
        label: "Siap Diambil"
      },
      finish: {
        bg: "bg-gradient-to-br from-purple-50 to-pink-50 border-l-4 border-purple-400",
        badge: "bg-purple-100 text-purple-800",
        icon: Package,
        iconColor: "text-purple-500",
        label: "Selesai"
      }
    }
    return configs[status] || configs.waiting
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className='w-full min-h-screen bg-gradient-to-br from-slate-50 to-gray-100'>
      <Navbar />

      <div className='w-full pt-20 px-6 pb-8'>
        {/* Statistics Cards */}
        <div className='w-full mb-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6'>
          <div className='bg-gradient-to-br from-orange-400 to-yellow-500 text-white rounded-2xl p-6 shadow-xl'>
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-8 h-8 opacity-80" />
              <Bell className="w-5 h-5 opacity-60" />
            </div>
            <div className="text-3xl font-bold mb-2">{waiting}</div>
            <div className="text-orange-100 font-medium">Menunggu</div>
          </div>

          <div className='bg-gradient-to-br from-blue-400 to-cyan-500 text-white rounded-2xl p-6 shadow-xl'>
            <div className="flex items-center justify-between mb-4">
              <ChefHat className="w-8 h-8 opacity-80" />
            </div>
            <div className="text-3xl font-bold mb-2">{cooking}</div>
            <div className="text-blue-100 font-medium">Sedang Dimasak</div>
          </div>

          <div className='bg-gradient-to-br from-green-400 to-emerald-500 text-white rounded-2xl p-6 shadow-xl'>
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="w-8 h-8 opacity-80" />
            </div>
            <div className="text-3xl font-bold mb-2">{ready}</div>
            <div className="text-green-100 font-medium">Siap Diambil</div>
            <div className="text-sm opacity-80 mt-2">*Menunggu konfirmasi kasir</div>
          </div>

          <div className='bg-gradient-to-br from-purple-400 to-pink-500 text-white rounded-2xl p-6 shadow-xl'>
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-8 h-8 opacity-80" />
            </div>
            <div className="text-3xl font-bold mb-2">{completed}</div>
            <div className="text-purple-100 font-medium">Selesai Hari Ini</div>
            <div className="text-sm opacity-80 mt-2">*Sudah dikonfirmasi kasir</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Dashboard Dapur</h2>
              <p className="text-gray-500">Kelola semua pesanan yang masuk</p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {/* Filter Buttons */}
              <div className="flex gap-2 bg-gray-100 p-1.5 rounded-lg">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-md transition-colors ${filter === 'all' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setFilter('waiting')}
                  className={`px-4 py-2 rounded-md transition-colors ${filter === 'waiting' ? 'bg-white shadow text-orange-600' : 'text-gray-600 hover:text-gray-800'}`}
                >
                  Menunggu
                </button>
                <button
                  onClick={() => setFilter('preparing')}
                  className={`px-4 py-2 rounded-md transition-colors ${filter === 'preparing' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                >
                  Memasak
                </button>
                <button
                  onClick={() => setFilter('done')}
                  className={`px-4 py-2 rounded-md transition-colors ${filter === 'done' ? 'bg-white shadow text-green-600' : 'text-gray-600 hover:text-gray-800'}`}
                >
                  Siap
                </button>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={fetchOrders} 
                  disabled={isLoading}
                  className={`${isLoading ? 'bg-gray-300' : 'bg-blue-500 hover:bg-blue-600'} text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Loading...
                    </>
                  ) : 'Refresh'}
                </button>
              </div>
            </div>
          </div>

          {/* Orders List */}
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🍳</div>
                <div className="text-black/50 text-lg">Tidak ada pesanan saat ini</div>
                <div className="text-gray-400 text-sm mt-2">Semua pesanan sudah ditangani</div>
              </div>
            ) : (
              orders.map((order) => {
                const config = getStatusConfig(order.status)
                const StatusIcon = config.icon
                
                return (
                  <div key={order.id} className={`${config.bg} rounded-xl p-5 hover:shadow-lg transition-all duration-300`}>
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      {/* Order Info */}
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          <div className="bg-white p-3 rounded-xl shadow-sm">
                            <StatusIcon className={`w-6 h-6 ${config.iconColor}`} />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                              <h3 className="font-bold text-lg text-gray-800">Order #{order.id}</h3>
                              <span className={`${config.badge} px-3 py-1 rounded-full text-sm font-medium`}>
                                {config.label}
                              </span>
                              <span className="text-sm text-gray-500">
                                {formatTime(order.create_at)}
                              </span>
                            </div>
                            
                            <div className="text-gray-600 mb-3">
                              {order.customers.table ? (
                                <span className="font-semibold">Meja {order.customers.table.table_number}</span>
                              ) : (
                                <span className="font-semibold">Take Away</span>
                              )}
                              <span className="mx-2">•</span>
                              <span>{order.customers.name}</span>
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                              {order.orders.map((item, idx) => (
                                <span key={idx} className="bg-white bg-opacity-60 px-3 py-1 rounded-lg text-sm font-medium text-gray-700 flex items-center gap-2">
                                  <span>{item.menu.nama}</span>
                                  <span className="text-orange-500">×{item.qty}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        {order.status === 'waiting' && (
                          <button 
                            onClick={() => updateStatus(order, "preparing")}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <ChefHat size={18} />
                            Mulai Masak
                          </button>
                        )}
                        
                        {order.status === 'preparing' && (
                          <button 
                            onClick={() => handleMarkAsReady(order)}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <CheckCircle size={18} />
                            Siap Disajikan
                          </button>
                        )}
                        
                        {order.status === 'done' && (
                          <div className="text-center p-2">
                            <div className="text-green-600 font-bold mb-2">✓ Siap Diambil</div>
                            <div className="text-sm text-gray-500">Menunggu kasir</div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Notes for done status */}
                    {order.status === 'done' && (
                      <div className="mt-4 pt-3 border-t border-green-200 border-dashed">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-green-600 font-medium flex items-center gap-2">
                            <Bell size={16} />
                            Pesanan sudah siap! Tunggu kasir mengambil pesanan ini.
                          </div>
                          <div className="text-xs text-gray-500">
                            Selesai memasak: {formatTime(order.updated_at || order.create_at)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Konfirmasi Pesanan Siap</h3>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <XCircle size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Apakah pesanan <span className="font-bold">Order #{selectedOrder.id}</span> sudah siap disajikan?
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckSquare className="text-yellow-600 mt-0.5" size={20} />
                  <div>
                    <p className="text-sm text-yellow-800 font-medium">
                      Catatan Penting:
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Status akan berubah menjadi <span className="font-bold">"Siap Diambil"</span>. 
                      Pesanan tidak akan otomatis selesai. Kasir harus menandai selesai terlebih dahulu.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmMarkAsReady}
                className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} />
                Ya, Pesanan Siap
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Page