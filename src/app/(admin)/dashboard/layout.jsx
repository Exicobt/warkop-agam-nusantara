"use client";

import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar"

export default function DashboardLayout({ children }) {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Navbar></Navbar>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 ml-64"> 
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}