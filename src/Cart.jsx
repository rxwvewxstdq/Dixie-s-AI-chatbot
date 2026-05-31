import React, { useEffect } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, X, Info } from 'lucide-react';

export default function Cart({ isOpen, onClose, cartItems, setCartItems }) {

  useEffect(() => {
    if (cartItems.length > 0) {
      localStorage.setItem('dixy_cart', JSON.stringify(cartItems));
    }
  }, [cartItems]);

  const removeFromCart = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id, delta) => {
    setCartItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const newQuantity = Math.max(1, item.quantity + delta);
          return {
            ...item,
            quantity: newQuantity,
            total_price: Math.round(item.price_per_unit * newQuantity)
          };
        }
        return item;
      })
    );
  };

  const getTotalPrice = () => {
    return cartItems.reduce((sum, item) => sum + (item.total_price || item.price_per_unit * item.quantity), 0);
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('dixy_cart');
  };

  const groupedItems = cartItems.reduce((acc, item) => {
    const existing = acc.find(i => i.name === item.name);
    if (existing) {
      existing.quantity += item.quantity;
      existing.total_price = Math.round(existing.price_per_unit * existing.quantity);
      existing.recipes_from = [...new Set([...existing.recipes_from, ...item.recipes_from])];
    } else {
      acc.push({ ...item, recipes_from: [...item.recipes_from] });
    }
    return acc;
  }, []);

  if (!isOpen) return null;

  return (
    <div className="cart-overlay" onClick={onClose}>
      <div className="cart-window" onClick={(e) => e.stopPropagation()}>
        <div className="cart-header">
          <div className="cart-header-title">
            <ShoppingCart size={24} />
            <span>Корзина покупок</span>
            {cartItems.length > 0 && <span className="cart-badge">{groupedItems.length}</span>}
          </div>
          <button onClick={onClose} className="cart-close">
            <X size={20} />
          </button>
        </div>

        <div className="cart-body">
          {cartItems.length === 0 ? (
            <div className="cart-empty">
              <ShoppingCart size={64} />
              <p>Корзина пуста</p>
              <small>Добавьте ингредиенты через чат-бота</small>
            </div>
          ) : (
            <>
              {groupedItems.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-info">
                    <h4>{item.name}</h4>
                    <div className="cart-item-price">
                      {Math.round(item.price_per_unit)} ₽ / {item.unit}
                    </div>
                    {item.recipes_from && item.recipes_from.length > 0 && (
                      <div className="cart-item-from">
                        <Info size={12} />
                        <small>из: {item.recipes_from.join(', ')}</small>
                      </div>
                    )}
                  </div>
                  <div className="cart-item-controls">
                    <button onClick={() => updateQuantity(item.id, -1)}>
                      <Minus size={16} />
                    </button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)}>
                      <Plus size={16} />
                    </button>
                    <button onClick={() => removeFromCart(item.id)} className="cart-delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="cart-item-total">
                    <strong>{Math.round(item.total_price)} ₽</strong>
                  </div>
                </div>
              ))}

              <div className="cart-total">
                <div className="cart-total-row">
                  <span>Итого к оплате:</span>
                  <strong>{Math.round(getTotalPrice())} ₽</strong>
                </div>
                <div className="cart-total-row">
                  <span>Всего позиций:</span>
                  <strong>{groupedItems.reduce((sum, item) => sum + item.quantity, 0)}</strong>
                </div>
                <button className="cart-checkout" onClick={clearCart}>
                  Очистить корзину
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}