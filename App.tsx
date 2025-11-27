import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, 
  Flower2, 
  ShoppingCart, 
  History, 
  LogOut, 
  Bell, 
  Plus, 
  Trash2, 
  Edit, 
  AlertTriangle,
  Clock,
  TrendingDown,
  ChevronRight,
  Menu,
  X,
  Search,
  DollarSign,
  Maximize,
  Minimize
} from 'lucide-react';
import { Login } from './components/Login';
import { GeminiAssistant } from './components/GeminiAssistant';
import { dataService } from './services/dataService';
import { Flower, CartItem, Shift, Alert, ViewState, Sale } from './types';

// Utility for formatting currency
const formatMoney = (amount: number) => `$${amount.toFixed(2)}`;

// Utility for formatting dates
const formatDate = (timestamp: number) => new Date(timestamp).toLocaleString();

const App: React.FC = () => {
  // --- STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [view, setView] = useState<ViewState>('login');
  
  // Data State
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  
  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedFlowerForAI, setSelectedFlowerForAI] = useState<Flower | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Forms State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingFlower, setEditingFlower] = useState<Flower | null>(null);
  const [newFlower, setNewFlower] = useState<Partial<Flower>>({});
  
  // Shift Form
  const [startCash, setStartCash] = useState<string>('0');

  // --- EFFECTS ---

  // Load data on mount
  useEffect(() => {
    const loadedFlowers = dataService.getFlowers();
    setFlowers(loadedFlowers);
    setShifts(dataService.getShifts());
    setAlerts(dataService.getAlerts());
    
    // Check for open shift
    const savedShifts = dataService.getShifts();
    const open = savedShifts.find(s => s.isOpen);
    if (open) setCurrentShift(open);

    runPeriodicChecks(loadedFlowers);

    // Listener for fullscreen change (user might press Escape)
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Periodic checks (every minute)
  useEffect(() => {
    const interval = setInterval(() => {
      runPeriodicChecks(flowers);
    }, 60000); // 1 minute
    return () => clearInterval(interval);
  }, [flowers]);

  // Persist data when changed
  useEffect(() => {
    if (isAuthenticated) {
      dataService.saveFlowers(flowers);
      dataService.saveShifts(shifts);
      dataService.saveAlerts(alerts);
    }
  }, [flowers, shifts, alerts, isAuthenticated]);

  // --- LOGIC ---

  const runPeriodicChecks = (currentFlowers: Flower[]) => {
    const newAlerts: Alert[] = [];
    const now = Date.now();

    currentFlowers.forEach(f => {
      // Check stock
      if (f.stock <= f.threshold && f.stock > 0) {
        newAlerts.push({
          id: `low-${f.id}-${now}`,
          type: 'low-stock',
          message: `Low stock: ${f.name} (${f.stock} left)`,
          flowerId: f.id,
          timestamp: now,
          read: false
        });
      }

      // Check decay
      const daysSinceAdded = (now - f.addedAt) / (1000 * 60 * 60 * 24);
      const daysLeft = f.shelfLifeDays - daysSinceAdded;
      
      if (daysLeft < 0) {
        newAlerts.push({
          id: `decay-${f.id}-${now}`,
          type: 'decay',
          message: `EXPIRED: ${f.name} (Added ${Math.floor(daysSinceAdded)} days ago)`,
          flowerId: f.id,
          timestamp: now,
          read: false
        });
      } else if (daysLeft < 2) {
        newAlerts.push({
          id: `near-decay-${f.id}-${now}`,
          type: 'decay',
          message: `Near Decay: ${f.name} (${daysLeft.toFixed(1)} days left)`,
          flowerId: f.id,
          timestamp: now,
          read: false
        });
      }
    });

    // Only add unique alerts (simple dedup logic for demo)
    setAlerts(prev => {
      const existingIds = new Set(prev.map(a => a.message)); // dedupe by message content for simplicity
      const uniqueNew = newAlerts.filter(a => !existingIds.has(a.message));
      return [...uniqueNew, ...prev].slice(0, 50); // Keep last 50
    });
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    setView('pos');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setView('login');
    setCart([]);
  };

  // Inventory Logic
  const handleSaveFlower = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlower.name || !newFlower.price) return;

    const flowerData: Flower = {
      id: editingFlower ? editingFlower.id : Date.now().toString(),
      name: newFlower.name || '',
      price: Number(newFlower.price) || 0,
      stock: Number(newFlower.stock) || 0,
      threshold: Number(newFlower.threshold) || 5,
      shelfLifeDays: Number(newFlower.shelfLifeDays) || 7,
      addedAt: editingFlower ? editingFlower.addedAt : Date.now(),
      image: newFlower.image || `https://picsum.photos/200/200?random=${Date.now()}`,
      description: newFlower.description || ''
    };

    if (editingFlower) {
      setFlowers(prev => prev.map(f => f.id === flowerData.id ? flowerData : f));
    } else {
      setFlowers(prev => [...prev, flowerData]);
    }
    
    setIsAddModalOpen(false);
    setEditingFlower(null);
    setNewFlower({});
  };

  const handleDeleteFlower = (id: string) => {
    if (window.confirm('Are you sure you want to remove this batch?')) {
      setFlowers(prev => prev.filter(f => f.id !== id));
    }
  };

  // POS Logic
  const addToCart = (flower: Flower) => {
    if (!currentShift) {
      alert("Please open a shift first!");
      return;
    }
    if (flower.stock <= 0) return;

    setCart(prev => {
      const existing = prev.find(item => item.id === flower.id);
      if (existing) {
        if (existing.quantity >= flower.stock) return prev; // Check max stock
        return prev.map(item => item.id === flower.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...flower, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        const stock = flowers.find(f => f.id === id)?.stock || 0;
        if (newQty > 0 && newQty <= stock) {
          return { ...item, quantity: newQty };
        }
      }
      return item;
    }));
  };

  const handleCheckout = () => {
    if (!currentShift) return;
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Create sale record
    const sale: Sale = {
      id: Date.now().toString(),
      items: [...cart],
      total,
      timestamp: Date.now(),
      shiftId: currentShift.id
    };

    // Update stocks
    const updatedFlowers = flowers.map(f => {
      const cartItem = cart.find(c => c.id === f.id);
      if (cartItem) {
        return { ...f, stock: f.stock - cartItem.quantity };
      }
      return f;
    });

    // Update shift stats
    const updatedShift = {
      ...currentShift,
      totalSales: currentShift.totalSales + total,
      salesCount: currentShift.salesCount + 1
    };

    setFlowers(updatedFlowers);
    setCurrentShift(updatedShift);
    setShifts(prev => prev.map(s => s.id === updatedShift.id ? updatedShift : s));
    
    // Save sale history (mocked simply here)
    const allSales = dataService.getSales();
    dataService.saveSales([...allSales, sale]);

    setCart([]);
    alert(`Sale completed! Total: ${formatMoney(total)}`);
  };

  // Shift Logic
  const handleOpenShift = () => {
    const newShift: Shift = {
      id: Date.now().toString(),
      openedAt: Date.now(),
      closedAt: null,
      startCash: Number(startCash),
      endCash: null,
      totalSales: 0,
      salesCount: 0,
      isOpen: true
    };
    setCurrentShift(newShift);
    setShifts(prev => [newShift, ...prev]);
  };

  const handleCloseShift = () => {
    if (!currentShift) return;
    const closedShift = {
      ...currentShift,
      isOpen: false,
      closedAt: Date.now(),
      endCash: currentShift.startCash + currentShift.totalSales // Simple calc
    };
    setCurrentShift(null);
    setShifts(prev => prev.map(s => s.id === closedShift.id ? closedShift : s));
    alert(`Shift Closed.\nTotal Sales: ${formatMoney(closedShift.totalSales)}\nTransactions: ${closedShift.salesCount}`);
  };

  const handleClearAlerts = () => {
    setAlerts([]);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const unreadAlertsCount = alerts.filter(a => !a.read).length;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 flex flex-col z-20 shadow-xl`}
      >
        <div className="p-4 flex items-center justify-between">
          {isSidebarOpen && <span className="font-bold text-xl text-rose-400">BloomPOS</span>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-slate-800 rounded">
            <Menu className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 py-4 space-y-2">
          <SidebarItem icon={<ShoppingCart />} label="Point of Sale" active={view === 'pos'} onClick={() => setView('pos')} expanded={isSidebarOpen} />
          <SidebarItem icon={<Flower2 />} label="Inventory" active={view === 'inventory'} onClick={() => setView('inventory')} expanded={isSidebarOpen} />
          <SidebarItem icon={<History />} label="Shift History" active={view === 'shifts'} onClick={() => setView('shifts')} expanded={isSidebarOpen} />
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-4">
           {isSidebarOpen && (
              <button 
                onClick={toggleFullScreen}
                className="w-full flex items-center gap-2 text-sm text-gray-400 hover:text-white transition p-2 hover:bg-slate-800 rounded-lg"
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Mode'}
              </button>
           )}

           <div className={`flex items-center gap-3 ${!isSidebarOpen && 'justify-center'}`}>
             <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center font-bold">Z</div>
             {isSidebarOpen && (
               <div className="flex-1 overflow-hidden">
                 <p className="text-sm font-medium truncate">Zyrus</p>
                 <p className="text-xs text-gray-400">Manager</p>
               </div>
             )}
             {isSidebarOpen && (
                <button onClick={handleLogout} className="text-gray-400 hover:text-white" title="Logout">
                  <LogOut className="h-5 w-5" />
                </button>
             )}
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 z-10">
          <h2 className="text-xl font-semibold text-gray-800 capitalize">
            {view === 'pos' ? 'Point of Sale' : view}
          </h2>

          <div className="flex items-center gap-4">
             {/* Shift Status Indicator */}
             <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 ${currentShift ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
               <div className={`w-2 h-2 rounded-full ${currentShift ? 'bg-green-500' : 'bg-red-500'}`}></div>
               {currentShift ? `Shift Open (${formatMoney(currentShift.totalSales)})` : 'Shift Closed'}
             </div>

             {/* Notifications */}
             <div className="relative">
               <button 
                 onClick={() => setShowNotifications(!showNotifications)}
                 className="p-2 text-gray-600 hover:bg-gray-100 rounded-full relative"
               >
                 <Bell className="h-6 w-6" />
                 {unreadAlertsCount > 0 && (
                   <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full">
                     {unreadAlertsCount}
                   </span>
                 )}
               </button>

               {showNotifications && (
                 <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50">
                   <div className="p-3 border-b flex justify-between items-center bg-gray-50">
                     <span className="font-semibold text-sm">Notifications</span>
                     <button onClick={handleClearAlerts} className="text-xs text-blue-600 hover:underline">Clear All</button>
                   </div>
                   <div className="max-h-96 overflow-y-auto">
                     {alerts.length === 0 ? (
                       <p className="text-center py-4 text-gray-500 text-sm">No alerts</p>
                     ) : (
                       alerts.map(alert => (
                         <div key={alert.id} className={`p-3 border-b text-sm ${alert.type === 'decay' ? 'bg-red-50' : 'bg-yellow-50'}`}>
                           <div className="flex items-start gap-2">
                             <AlertTriangle className={`h-4 w-4 mt-0.5 ${alert.type === 'decay' ? 'text-red-500' : 'text-yellow-600'}`} />
                             <div>
                               <p className="font-medium text-gray-800">{alert.message}</p>
                               <p className="text-xs text-gray-500">{new Date(alert.timestamp).toLocaleTimeString()}</p>
                             </div>
                           </div>
                         </div>
                       ))
                     )}
                   </div>
                 </div>
               )}
             </div>
          </div>
        </header>

        {/* Views */}
        <div className="flex-1 overflow-auto p-6 relative">
          
          {/* INVENTORY VIEW */}
          {view === 'inventory' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex gap-4">
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                    <div className="p-2 bg-rose-100 text-rose-600 rounded-lg"><Flower2 className="h-6 w-6"/></div>
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase">Total Items</p>
                      <p className="text-2xl font-bold text-gray-800">{flowers.reduce((a,b) => a + b.stock, 0)}</p>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg"><TrendingDown className="h-6 w-6"/></div>
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase">Low Stock</p>
                      <p className="text-2xl font-bold text-gray-800">{flowers.filter(f => f.stock <= f.threshold).length}</p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => { setEditingFlower(null); setNewFlower({}); setIsAddModalOpen(true); }}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-lg shadow-rose-200"
                >
                  <Plus className="h-5 w-5" /> Add Stock
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Flower</th>
                      <th className="p-4">Added</th>
                      <th className="p-4">Shelf Life</th>
                      <th className="p-4">Stock</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {flowers.map(flower => {
                      const daysOld = (Date.now() - flower.addedAt) / (1000 * 60 * 60 * 24);
                      const daysLeft = flower.shelfLifeDays - daysOld;
                      const isLow = flower.stock <= flower.threshold;
                      
                      return (
                        <tr key={flower.id} className="hover:bg-gray-50 transition">
                          <td className="p-4 flex items-center gap-3">
                            <img src={flower.image} alt={flower.name} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                            <span className="font-medium text-gray-800">{flower.name}</span>
                          </td>
                          <td className="p-4 text-sm text-gray-600">{new Date(flower.addedAt).toLocaleDateString()}</td>
                          <td className="p-4 text-sm">
                            <div className="flex flex-col">
                              <span className="font-medium">{daysLeft.toFixed(1)} days left</span>
                              <div className="w-20 h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${daysLeft < 2 ? 'bg-red-500' : 'bg-green-500'}`}
                                  style={{ width: `${Math.max(0, Math.min(100, (daysLeft / flower.shelfLifeDays) * 100))}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${isLow ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                              {flower.stock} units
                            </span>
                          </td>
                          <td className="p-4 font-medium">{formatMoney(flower.price)}</td>
                          <td className="p-4 text-sm">
                             {daysLeft < 0 ? <span className="text-red-600 font-bold">EXPIRED</span> : <span className="text-green-600">Fresh</span>}
                          </td>
                          <td className="p-4 text-right space-x-2">
                             <button onClick={() => setSelectedFlowerForAI(flower)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded" title="Ask AI">
                              <SparklesIcon className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => { setEditingFlower(flower); setNewFlower(flower); setIsAddModalOpen(true); }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteFlower(flower.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* POS VIEW */}
          {view === 'pos' && (
            <div className="flex h-full gap-6">
              <div className="flex-1 overflow-y-auto pr-2">
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                  {flowers.filter(f => f.stock > 0).map(flower => (
                    <div 
                      key={flower.id} 
                      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition group cursor-pointer"
                      onClick={() => addToCart(flower)}
                    >
                      <div className="h-40 overflow-hidden relative">
                         <img src={flower.image} alt={flower.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                         <div className="absolute top-2 right-2 bg-white/90 backdrop-blur text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                           Stock: {flower.stock}
                         </div>
                         <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedFlowerForAI(flower); }}
                            className="absolute top-2 left-2 bg-indigo-600 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition"
                            title="Ask AI"
                          >
                            <SparklesIcon className="w-3 h-3" />
                         </button>
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-800 line-clamp-1">{flower.name}</h3>
                          <span className="text-rose-600 font-bold">{formatMoney(flower.price)}</span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{flower.description || 'Fresh cut flower.'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cart Sidebar */}
              <div className="w-96 bg-white rounded-2xl shadow-xl flex flex-col border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-gray-800">Current Order</h3>
                  <p className="text-sm text-gray-500">Shift ID: #{currentShift ? currentShift.id.slice(-6) : 'CLOSED'}</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50">
                      <ShoppingCart className="h-12 w-12 mb-2" />
                      <p>Cart is empty</p>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.id} className="flex gap-3 items-center">
                         <img src={item.image} className="w-12 h-12 rounded-lg object-cover" alt="" />
                         <div className="flex-1">
                           <p className="font-medium text-sm text-gray-800">{item.name}</p>
                           <p className="text-xs text-rose-600 font-bold">{formatMoney(item.price)}</p>
                         </div>
                         <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                           <button onClick={() => updateCartQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-rose-600">-</button>
                           <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                           <button onClick={() => updateCartQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-rose-600">+</button>
                         </div>
                         <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500">
                           <X className="w-4 h-4" />
                         </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100 rounded-b-2xl space-y-4">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatMoney(cart.reduce((s, i) => s + (i.price * i.quantity), 0))}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-gray-900">
                    <span>Total</span>
                    <span>{formatMoney(cart.reduce((s, i) => s + (i.price * i.quantity), 0))}</span>
                  </div>
                  
                  <button 
                    onClick={handleCheckout}
                    disabled={!currentShift || cart.length === 0}
                    className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition transform active:scale-95 flex items-center justify-center gap-2
                      ${!currentShift || cart.length === 0 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-200'}`}
                  >
                    <DollarSign className="w-5 h-5" /> Checkout
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SHIFTS VIEW */}
          {view === 'shifts' && (
            <div className="space-y-6 max-w-5xl mx-auto">
               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                 <div>
                   <h3 className="text-lg font-bold text-gray-800">Shift Management</h3>
                   <p className="text-sm text-gray-500">Track sales sessions and cash flow</p>
                 </div>
                 
                 {currentShift ? (
                   <button 
                     onClick={handleCloseShift}
                     className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-red-200"
                   >
                     Close Shift
                   </button>
                 ) : (
                   <div className="flex gap-2">
                     <div className="relative">
                       <span className="absolute left-3 top-2.5 text-gray-500 text-sm">$</span>
                       <input 
                         type="number" 
                         value={startCash} 
                         onChange={(e) => setStartCash(e.target.value)}
                         className="pl-6 pr-4 py-2 border border-gray-300 rounded-lg w-32 focus:ring-2 focus:ring-rose-500 outline-none"
                         placeholder="Start Cash"
                       />
                     </div>
                     <button 
                       onClick={handleOpenShift}
                       className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-green-200"
                     >
                       Open Shift
                     </button>
                   </div>
                 )}
               </div>

               <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                 <table className="w-full text-left">
                   <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                     <tr>
                       <th className="p-4">Shift ID</th>
                       <th className="p-4">Opened</th>
                       <th className="p-4">Closed</th>
                       <th className="p-4">Sales Count</th>
                       <th className="p-4">Total Sales</th>
                       <th className="p-4">Status</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                     {shifts.map(shift => (
                       <tr key={shift.id} className="hover:bg-gray-50">
                         <td className="p-4 font-mono text-xs text-gray-500">#{shift.id.slice(-6)}</td>
                         <td className="p-4 text-sm text-gray-700">{formatDate(shift.openedAt)}</td>
                         <td className="p-4 text-sm text-gray-700">{shift.closedAt ? formatDate(shift.closedAt) : '-'}</td>
                         <td className="p-4 text-sm text-gray-700">{shift.salesCount}</td>
                         <td className="p-4 font-bold text-green-600">{formatMoney(shift.totalSales)}</td>
                         <td className="p-4">
                           <span className={`px-2 py-1 rounded text-xs font-bold ${shift.isOpen ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                             {shift.isOpen ? 'OPEN' : 'CLOSED'}
                           </span>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}

        </div>
      </main>

      {/* Add/Edit Flower Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">{editingFlower ? 'Edit Stock' : 'Add New Stock'}</h3>
            <form onSubmit={handleSaveFlower} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Flower Name</label>
                <input 
                  required
                  type="text" 
                  value={newFlower.name || ''} 
                  onChange={e => setNewFlower({...newFlower, name: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    value={newFlower.price || ''} 
                    onChange={e => setNewFlower({...newFlower, price: parseFloat(e.target.value)})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input 
                    required
                    type="number" 
                    value={newFlower.stock || ''} 
                    onChange={e => setNewFlower({...newFlower, stock: parseInt(e.target.value)})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shelf Life (Days)</label>
                  <input 
                    required
                    type="number" 
                    value={newFlower.shelfLifeDays || 7} 
                    onChange={e => setNewFlower({...newFlower, shelfLifeDays: parseInt(e.target.value)})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Alert at</label>
                  <input 
                    required
                    type="number" 
                    value={newFlower.threshold || 5} 
                    onChange={e => setNewFlower({...newFlower, threshold: parseInt(e.target.value)})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  value={newFlower.description || ''} 
                  onChange={e => setNewFlower({...newFlower, description: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium shadow-lg shadow-rose-200"
                >
                  Save Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gemini Assistant Modal */}
      {selectedFlowerForAI && (
        <GeminiAssistant 
          flower={selectedFlowerForAI} 
          onClose={() => setSelectedFlowerForAI(null)} 
        />
      )}
    </div>
  );
};

// Helper component for sidebar items
const SidebarItem = ({ icon, label, active, onClick, expanded }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, expanded: boolean }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 transition-colors duration-200 relative
      ${active ? 'bg-slate-800 text-rose-400 border-r-4 border-rose-400' : 'text-gray-400 hover:bg-slate-800 hover:text-white'}
    `}
  >
    <div className="h-6 w-6">{icon}</div>
    {expanded && <span className="font-medium whitespace-nowrap">{label}</span>}
  </button>
);

// Sparkles icon for AI
const SparklesIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
);

export default App;