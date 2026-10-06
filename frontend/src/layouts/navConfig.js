import {
  BarChart3, Bell, ClipboardList, CreditCard, FileText, Heart, LayoutDashboard, MessageSquare, Package,
  PlusCircle, Settings, ShoppingCart, Star, Tag, Truck, UserCircle, Users, Wallet, Wheat, Search,
} from 'lucide-react';

export const NAV = {
  farmer: [
    { to: '/farmer', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/farmer/profile', label: 'My Profile', icon: UserCircle },
    { to: '/farmer/products/new', label: 'Add Product', icon: PlusCircle },
    { to: '/farmer/products', label: 'My Products', icon: Package, end: true },
    { to: '/farmer/orders', label: 'Orders', icon: ClipboardList },
    { to: '/farmer/sales', label: 'Sales', icon: BarChart3 },
    { to: '/farmer/earnings', label: 'Earnings', icon: Wallet },
    { to: '/farmer/reviews', label: 'Reviews', icon: Star },
    { to: '/farmer/notifications', label: 'Notifications', icon: Bell },
    { to: '/farmer/settings', label: 'Settings', icon: Settings },
  ],
  client: [
    { to: '/client', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/client/browse', label: 'Browse Products', icon: Search },
    { to: '/client/cart', label: 'My Cart', icon: ShoppingCart },
    { to: '/client/orders', label: 'My Orders', icon: ClipboardList },
    { to: '/client/tracking', label: 'Order Tracking', icon: Truck },
    { to: '/client/wishlist', label: 'Wishlist', icon: Heart },
    { to: '/client/reviews', label: 'Reviews', icon: Star },
    { to: '/client/notifications', label: 'Notifications', icon: Bell },
    { to: '/client/profile', label: 'My Profile', icon: UserCircle },
    { to: '/client/settings', label: 'Settings', icon: Settings },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/farmers', label: 'Farmers', icon: Wheat },
    { to: '/admin/clients', label: 'Clients', icon: Users },
    { to: '/admin/products', label: 'Products', icon: Package },
    { to: '/admin/categories', label: 'Categories', icon: Tag },
    { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
    { to: '/admin/payments', label: 'Payments', icon: CreditCard },
    { to: '/admin/reviews', label: 'Reviews', icon: Star },
    { to: '/admin/complaints', label: 'Complaints', icon: MessageSquare },
    { to: '/admin/notifications', label: 'Notifications', icon: Bell },
    { to: '/admin/reports', label: 'Reports', icon: FileText },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ],
};

export const PANEL_TITLE = { farmer: 'Farmer Panel', client: 'Customer Panel', admin: 'Admin Panel' };
