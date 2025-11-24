import { BarChart3, ChefHat, MapPin, DollarSign, LogOut, ChevronDown, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const Sidebar = ({ activeTab, setActiveTab }) => {
  const router = useRouter();
  const [openMenus, setOpenMenus] = useState({});

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
      });
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleMenuDropdown = (menuId) => {
    setOpenMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  const handleNavigation = (item) => {
    setActiveTab(item.id);
    if (item.route) {
      router.push(item.route);
    }
  };

  const isMenuActive = (menuItem) => {
    if (menuItem.isParent) {
      return menuItem.children.some(child => activeTab === child.id);
    }
    return activeTab === menuItem.id;
  };

  const isChildActive = (childId) => {
    return activeTab === childId;
  };

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: BarChart3,
      route: "/dashboard",
    },
    {
      id: "menu_parent",
      label: "Kelola Menu",
      icon: ChefHat,
      isParent: true,
      children: [
        {
          id: "menu",
          label: "Menu Items",
          route: "/dashboard/menu",
        },
        {
          id: "kombo_menu",
          label: "Kombo Menu",
          route: "/dashboard/kombo_menu",
        }
      ]
    },
    {
      id: "tables",
      label: "Kelola Meja",
      icon: MapPin,
      route: "/dashboard/table",
    },
  ];

  return (
    <div className="w-64 bg-white shadow-xl h-[calc(100vh-3.5rem)] fixed left-0 top-14 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = isMenuActive(item);
              const isOpen = openMenus[item.id];

              if (item.isParent) {
                return (
                  <div key={item.id} className="space-y-1">
                    <button
                      onClick={() => toggleMenuDropdown(item.id)}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-orange-500 text-white shadow-lg"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        {item.label}
                      </div>
                      {isOpen ? (
                        <ChevronDown className="w-4 h-4 transition-transform duration-200" />
                      ) : (
                        <ChevronRight className="w-4 h-4 transition-transform duration-200" />
                      )}
                    </button>
                    
                    {/* Dropdown Menu */}
                    {isOpen && (
                      <div className="ml-4 space-y-1 animate-fadeIn">
                        {item.children.map((child) => (
                          <button
                            key={child.id}
                            onClick={() => handleNavigation(child)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                              isChildActive(child.id)
                                ? "bg-orange-400 text-white shadow-md"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                              isChildActive(child.id) ? "bg-white scale-125" : "bg-orange-400"
                            }`}></span>
                            <span className="text-sm">{child.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-orange-500 text-white shadow-lg"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Logout Button - Fixed at bottom */}
      <div className="p-6 border-t border-gray-100 mt-auto">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;