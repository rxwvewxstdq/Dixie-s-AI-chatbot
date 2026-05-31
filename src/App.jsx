import React, { useState, useMemo } from 'react';
import ChatBot from './ChatBot';
import Cart from './Cart';
import {
  ChefHat,
  Clock,
  Flame,
  Leaf,
  Percent,
  Search,
  ShoppingBasket,
  Star,
  TrendingDown,
  WalletCards,
  ShoppingCart
} from 'lucide-react';

// Данные
const heroDeals = [
  { id: 1, title: 'Куриное филе', unit: '1 кг', dixy: 279, competitor: 359, competitorName: 'Средняя цена рядом', badge: '-22%', image: '🍗' },
  { id: 2, title: 'Макароны', unit: '450 г', dixy: 49, competitor: 72, competitorName: 'Другие магазины', badge: '-32%', image: '🍝' },
  { id: 3, title: 'Томаты', unit: '1 кг', dixy: 129, competitor: 169, competitorName: 'Средняя цена рядом', badge: '-24%', image: '🍅' },
  { id: 4, title: 'Сыр Российский', unit: '200 г', dixy: 139, competitor: 189, competitorName: 'Другие магазины', badge: '-26%', image: '🧀' }
];

const recipesStatic = [
  { id: 1, title: 'Паста с курицей и томатами', time: '25', difficulty: 'Легко', servings: '2', price: 178, oldPrice: 238, tags: ['ужин', 'выгодно'], ingredientsList: ['макароны', 'куриное филе', 'томаты', 'сыр'], emoji: '🍝', dietary: [] },
  { id: 2, title: 'Овощной суп', time: '35', difficulty: 'Легко', servings: '4', price: 94, oldPrice: 132, tags: ['обед', 'полезно', 'вегетарианское'], ingredientsList: ['картофель', 'морковь', 'капуста', 'зелень'], emoji: '🍲', dietary: ['vegetarian', 'lowcalorie'] },
  { id: 3, title: 'Сырные гренки', time: '12', difficulty: 'Очень легко', servings: '2', price: 71, oldPrice: 96, tags: ['завтрак', 'быстрое'], ingredientsList: ['хлеб', 'сыр', 'яйца', 'молоко'], emoji: '🥪', dietary: ['quick'] },
  { id: 4, title: 'Гречка с овощами', time: '20', difficulty: 'Легко', servings: '2', price: 89, oldPrice: 120, tags: ['обед', 'полезно', 'вегетарианское', 'без глютена'], ingredientsList: ['гречка', 'морковь', 'лук', 'масло'], emoji: '🍚', dietary: ['glutenfree', 'vegetarian'] }
];

const comparisonRows = [
  { product: 'Куриное филе, 1 кг', dixy: 279, shopA: 359, shopB: 342, shopC: 369 },
  { product: 'Макароны, 450 г', dixy: 49, shopA: 72, shopB: 68, shopC: 65 },
  { product: 'Томаты, 1 кг', dixy: 129, shopA: 169, shopB: 159, shopC: 175 },
  { product: 'Сыр Российский, 200 г', dixy: 139, shopA: 189, shopB: 179, shopC: 185 },
  { product: 'Молоко, 1 л', dixy: 74, shopA: 89, shopB: 84, shopC: 92 }
];

function formatRub(value) {
  return new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
}

function getUnitForProduct(productName) {
  const units = {
    "макароны": "г", "куриное филе": "кг", "томаты": "кг", "сыр": "г",
    "картофель": "кг", "морковь": "кг", "капуста": "кг", "хлеб": "шт",
    "яйца": "шт", "молоко": "мл", "гречка": "г", "лук": "шт",
    "масло": "мл", "зелень": "пучок"
  };
  return units[productName] || "шт";
}

// ============ КОМПОНЕНТЫ ============

function Header({ cartItemCount, onCartOpen }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <header className="site-header">
      <a className="brand" href="#top">
        <span className="brand-mark">Д</span>
        <span><strong>Дикси</strong><small>готовить дешевле</small></span>
      </a>
      <button className="menu-button" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? 'Закрыть' : 'Меню'}
      </button>
      <nav className={isOpen ? 'nav nav-open' : 'nav'}>
        <a href="#deals">Скидки</a>
        <a href="#recipes">Рецепты</a>
        <a href="#comparison">Сравнение цен</a>
        <button className="cart-icon-btn" onClick={onCartOpen}>
          <ShoppingCart size={20} />
          {cartItemCount > 0 && <span className="cart-count">{cartItemCount}</span>}
        </button>
        <a className="nav-cta" href="#recipes">Выбрать рецепт</a>
      </nav>
    </header>
  );
}

function Hero() {
  const totalSaving = heroDeals.reduce((sum, item) => sum + item.competitor - item.dixy, 0);
  return (
    <section className="hero" id="top">
      <div className="hero-content">
        <p className="eyebrow"><Percent size={18} /> Главные скидки недели</p>
        <h1>С Дикси готовить дешевле</h1>
        <p className="hero-text">Готовые идеи для завтрака, обеда и ужина с выгодными продуктами.</p>
        <div className="hero-actions">
          <a className="button primary" href="#deals">Смотреть скидки</a>
          <a className="button secondary" href="#comparison">Сравнить цены</a>
        </div>
      </div>
      <div className="hero-card">
        <div className="hero-card-top">
          <span>Экономия на корзине</span>
          <strong>{formatRub(totalSaving)}</strong>
        </div>
        <div className="mini-basket">
          {heroDeals.slice(0, 3).map((item) => (
            <div className="mini-row" key={item.id}>
              <span>{item.image}</span>
              <div><strong>{item.title}</strong><small>{item.unit}</small></div>
              <b>{formatRub(item.dixy)}</b>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DealsSection() {
  return (
    <section className="section" id="deals">
      <div className="section-head">
        <p className="eyebrow"><Flame size={18} /> Горячие предложения</p>
        <h2>Главные скидки и сравнение с соседними магазинами</h2>
      </div>
      <div className="deal-grid">
        {heroDeals.map(deal => (
          <article key={deal.id} className="deal-card">
            <div className="deal-image">{deal.image}</div>
            <div className="deal-badge">{deal.badge}</div>
            <h3>{deal.title}</h3>
            <p>{deal.unit}</p>
            <div className="price-line"><span>Дикси</span><strong>{formatRub(deal.dixy)}</strong></div>
            <div className="price-line muted"><span>{deal.competitorName}</span><del>{formatRub(deal.competitor)}</del></div>
            <div className="saving"><TrendingDown size={16} /> Экономия {formatRub(deal.competitor - deal.dixy)}</div>
          </article>
        ))}
      </div>
    </section>
  );
}

function RecipesSection() {
  return (
    <section className="section recipes" id="recipes">
      <div className="section-head">
        <p className="eyebrow"><Leaf size={18} /> Идеи на каждый день</p>
        <h2>Рецепты из продуктов со скидкой</h2>
      </div>
      <div className="recipe-grid">
        {recipesStatic.map(recipe => (
          <article key={recipe.id} className="recipe-card">
            <div className="recipe-emoji">{recipe.emoji}</div>
            <div className="recipe-tags">
              {recipe.tags.map(tag => <span key={tag}>{tag}</span>)}
              {recipe.dietary.includes('glutenfree') && <span className="diet-tag">🚫 Без глютена</span>}
              {recipe.dietary.includes('vegetarian') && <span className="diet-tag">🌱 Вегетарианское</span>}
              {recipe.dietary.includes('quick') && <span className="diet-tag">⚡ Быстрое</span>}
            </div>
            <h3>{recipe.title}</h3>
            <div className="recipe-meta">
              <span><Clock size={15} /> {recipe.time} мин</span>
              <span><ChefHat size={15} /> {recipe.difficulty}</span>
              <span><ShoppingBasket size={15} /> {recipe.servings} порц</span>
            </div>
            <p className="ingredients">{recipe.ingredientsList.join(' • ')}</p>
            <div className="recipe-price">
              <div><small>Стоимость порции</small><strong>{formatRub(recipe.price)}</strong></div>
              <span>−{formatRub(recipe.oldPrice - recipe.price)}</span>
            </div>
            <button className="button full">Добавить продукты</button>
          </article>
        ))}
      </div>
    </section>
  );
}

function ComparisonSection() {
  const [query, setQuery] = useState('');
  const filteredRows = useMemo(() => {
    if (!query.trim()) return comparisonRows;
    return comparisonRows.filter(row => row.product.toLowerCase().includes(query.toLowerCase()));
  }, [query]);

  const basketTotal = comparisonRows.reduce((acc, item) => ({
    dixy: acc.dixy + item.dixy,
    shopA: acc.shopA + item.shopA,
    shopB: acc.shopB + item.shopB,
    shopC: acc.shopC + item.shopC
  }), { dixy: 0, shopA: 0, shopB: 0, shopC: 0 });

  const averageCompetitor = Math.round((basketTotal.shopA + basketTotal.shopB + basketTotal.shopC) / 3);
  const saving = averageCompetitor - basketTotal.dixy;

  return (
    <section className="section comparison" id="comparison">
      <div className="section-head two-columns">
        <div><p className="eyebrow"><WalletCards size={18} /> Проверяем выгоду</p><h2>Сравнение цен по популярной корзине</h2></div>
        <div className="search-box"><Search size={18} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Найти товар" /></div>
      </div>
      <div className="summary-cards">
        <div><span>Корзина в Дикси</span><strong>{formatRub(basketTotal.dixy)}</strong></div>
        <div><span>Средняя цена у других</span><strong>{formatRub(averageCompetitor)}</strong></div>
        <div className="accent-card"><span>Ваша выгода</span><strong>{formatRub(saving)}</strong></div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Товар</th><th>Дикси</th><th>Магазин A</th><th>Магазин B</th><th>Магазин C</th></tr></thead>
          <tbody>
            {filteredRows.map(row => (
              <tr key={row.product}>
                <td>{row.product}</td>
                <td className="best-price">{formatRub(row.dixy)}</td>
                <td>{formatRub(row.shopA)}</td>
                <td>{formatRub(row.shopB)}</td>
                <td>{formatRub(row.shopC)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div><strong>С Дикси готовить дешевле</strong><p>Демо-макет сайта для учебного/презентационного проекта.</p></div>
      <div className="footer-rating"><Star size={18} fill="currentColor" /><span>Выгодная корзина каждый день</span></div>
    </footer>
  );
}

// ============ ГЛАВНЫЙ КОМПОНЕНТ APP ============

export default function App() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddToCart = (recipe) => {
    if (recipe.ingredients && recipe.ingredients.length > 0) {
      recipe.ingredients.forEach(ingredient => {
        setCartItems(prev => {
          const existing = prev.find(item => item.name === ingredient.name);
          if (existing) {
            return prev.map(item =>
              item.name === ingredient.name
                ? {
                    ...item,
                    quantity: item.quantity + 1,
                    total_price: Math.round(item.price_per_unit * (item.quantity + 1)),
                    recipes_from: [...new Set([...item.recipes_from, recipe.title])]
                  }
                : item
            );
          }
          return [...prev, {
            id: Date.now() + Math.random(),
            name: ingredient.name,
            quantity: 1,
            price_per_unit: ingredient.price,
            total_price: ingredient.price,
            unit: ingredient.amount ? ingredient.amount.split(' ')[1] || 'шт' : getUnitForProduct(ingredient.name),
            recipes_from: [recipe.title]
          }];
        });
      });
    }
  };

  return (
    <div className="app">
      <Header cartItemCount={cartItemCount} onCartOpen={() => setIsCartOpen(true)} />

      <main>
        <Hero />
        <DealsSection />
        <RecipesSection />
        <ComparisonSection />
      </main>

      <Footer />

      <ChatBot onAddToCart={handleAddToCart} cartItemCount={cartItemCount} />
      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        setCartItems={setCartItems}
      />
    </div>
  );
}