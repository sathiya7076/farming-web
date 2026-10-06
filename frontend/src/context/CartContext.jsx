import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../services/api';
import { useAuth } from './AuthContext.jsx';

const CartContext = createContext(null);

// Keeps the cart badge and wishlist hearts in sync for client users.
export function CartProvider({ children }) {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [wishIds, setWishIds] = useState([]);
  const isClient = user?.role === 'client';

  const refresh = useCallback(async () => {
    if (!isClient) { setCount(0); setWishIds([]); return; }
    try {
      const [c, w] = await Promise.all([api.get('/cart'), api.get('/wishlist')]);
      setCount(c.data.data.count);
      setWishIds(w.data.data.map((p) => p._id));
    } catch { /* non-critical */ }
  }, [isClient]);

  useEffect(() => { refresh(); }, [refresh, user?._id]);

  const addToCart = async (productId, quantity = 1) => {
    try {
      const { data } = await api.post('/cart', { productId, quantity });
      setCount(data.data.count);
      toast.success('Added to cart');
      return true;
    } catch (e) {
      toast.error(errMsg(e));
      return false;
    }
  };

  const toggleWish = async (productId) => {
    try {
      const { data } = await api.post(`/wishlist/${productId}`);
      setWishIds(data.ids);
      toast.success(data.inWishlist ? 'Saved to wishlist' : 'Removed from wishlist');
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <CartContext.Provider value={{ count, setCount, wishIds, isClient, refresh, addToCart, toggleWish }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
