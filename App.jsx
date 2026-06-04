import { useMemo, useState } from 'react';
import { restaurants } from './data.js';

const initialCustomer = {
  name: '',
  phone: '',
  address: '',
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [activeRestaurantId, setActiveRestaurantId] = useState(restaurants[0].id);
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState(initialCustomer);
  const [stage, setStage] = useState('menu');
  const [paymentStatus, setPaymentStatus] = useState('idle');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [sortBy, setSortBy] = useState('recommend');
  const [filterTags, setFilterTags] = useState([]);
  const [addedDishes, setAddedDishes] = useState(new Set());
  const publicPath = import.meta.env.BASE_URL;

  // 标签样式映射
  const getTagClass = (tag) => {
    const map = { '招牌': 'signature', '热销': 'hot', '售罄': 'soldout', '素食': 'vegan', '辣': 'spicy' };
    return map[tag] || 'default';
  };

  // 标签显示名称
  const getTagLabel = (tag) => {
    const map = { '辣': '🌶️辣' };
    return map[tag] || tag;
  };

  // 搜索功能：支持搜索餐厅名称和菜品名称
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const results = [];

    restaurants.forEach((restaurant) => {
      // 搜索餐厅名称
      if (restaurant.name.toLowerCase().includes(query)) {
        results.push({
          type: 'restaurant',
          data: restaurant,
        });
      }

      // 搜索菜品
      restaurant.menu.forEach((dish) => {
        if (dish.name.toLowerCase().includes(query)) {
          results.push({
            type: 'dish',
            data: dish,
            restaurant: restaurant,
          });
        }
      });
    });

    return results;
  }, [searchQuery]);

  const activeRestaurant = useMemo(
    () => restaurants.find((item) => item.id === activeRestaurantId),
    [activeRestaurantId]
  );

  // 筛选和排序菜品
  const filteredAndSortedMenu = useMemo(() => {
    let menu = [...activeRestaurant.menu];

    // 标签筛选
    if (filterTags.length > 0) {
      menu = menu.filter((dish) => 
        filterTags.some((tag) => dish.tags?.includes(tag))
      );
    }

    // 排序
    switch (sortBy) {
      case 'sales':
        menu.sort((a, b) => (b.sales || 0) - (a.sales || 0));
        break;
      case 'price-asc':
        menu.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        menu.sort((a, b) => b.price - a.price);
        break;
      default:
        // recommend - 按销量和评分综合排序
        menu.sort((a, b) => {
          const scoreA = (a.sales || 0) * 0.6 + (a.rating || 0) * 10;
          const scoreB = (b.sales || 0) * 0.6 + (b.rating || 0) * 10;
          return scoreB - scoreA;
        });
    }

    return menu;
  }, [activeRestaurant.menu, sortBy, filterTags]);

  // 切换标签筛选
  const toggleFilterTag = (tag) => {
    setFilterTags((prev) => 
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // 处理加入购物车，添加反馈
  const handleAddToCartWithFeedback = (dish) => {
    handleAddToCart(dish);
    setAddedDishes((prev) => new Set([...prev, dish.id]));
    setTimeout(() => {
      setAddedDishes((prev) => {
        const next = new Set(prev);
        next.delete(dish.id);
        return next;
      });
    }, 2000);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleAddToCart = (dish) => {
    setCart((current) => {
      const exist = current.find((item) => item.id === dish.id);
      if (exist) {
        return current.map((item) =>
          item.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...current, { ...dish, quantity: 1 }];
    });
  };

  const handleQuantityChange = (dishId, delta) => {
    setCart((current) =>
      current
        .map((item) =>
          item.id === dishId ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemove = (dishId) => {
    setCart((current) => current.filter((item) => item.id !== dishId));
  };

  const handleConfirmOrder = () => {
    if (!customer.name.trim() || !customer.phone.trim() || !customer.address.trim()) {
      alert('请填写联系人信息以继续。');
      return;
    }
    if (!cart.length) {
      alert('购物车为空，请先添加菜品。');
      return;
    }
    setStage('confirm');
  };

  const handlePay = () => {
    setPaymentStatus('processing');
    setTimeout(() => {
      setPaymentStatus('success');
    }, 1000);
  };

  const handleReset = () => {
    setCart([]);
    setCustomer(initialCustomer);
    setStage('menu');
    setPaymentStatus('idle');
  };

  const handleLogin = () => {
    if (username.trim() && password.trim()) {
      setIsLoggedIn(true);
    } else {
      alert('请输入用户名和密码');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
  };

  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1>在线订餐系统</h1>
            <p>欢迎回来，请登录</p>
          </div>
          <form className="login-form" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
            <div className="form-group">
              <label htmlFor="username">用户名</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">密码</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
              />
            </div>
            <button type="submit" className="login-button">登录</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header
        className="topbar"
        style={{ backgroundImage: `url(${publicPath}images/d401.jpg)` }}
      >
        <div className="topbar-overlay">
          <div className="topbar-title">
            <h1>在线订餐系统</h1>
            <nav className="breadcrumb" aria-label="当前位置">
              <span>首页</span>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-current">{activeRestaurant?.name || '请选择餐厅'}</span>
              <button className="logout-btn" onClick={handleLogout}>退出登录</button>
            </nav>
          </div>
          <div
            className={`search-container ${searchExpanded ? 'expanded' : ''}`}
            onClick={() => setSearchExpanded(true)}
          >
            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="搜索餐厅或菜品..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => setTimeout(() => setSearchExpanded(false), 200)}
                onClick={(e) => e.stopPropagation()}
              />
              {searchQuery && (
                <button className="search-clear" onClick={(e) => { e.stopPropagation(); setSearchQuery(''); }}>✕</button>
              )}
            </div>
            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.slice(0, 6).map((result, index) => (
                  <button
                    key={index}
                    className="search-result-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (result.type === 'restaurant') {
                        setActiveRestaurantId(result.data.id);
                      } else {
                        setActiveRestaurantId(result.restaurant.id);
                      }
                      setSearchQuery('');
                      setSearchExpanded(false);
                      setStage('menu');
                    }}
                  >
                    <span className="result-icon">
                      {result.type === 'restaurant' ? '🍽️' : '🍲'}
                    </span>
                    <div className="result-content">
                      <span className="result-name">{result.data.name}</span>
                      <span className="result-hint">
                        {result.type === 'restaurant' ? result.data.category : `来自 ${result.restaurant.name}`}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="page-grid">
        <section className="panel restaurants-panel">
          <h2>餐厅浏览</h2>
          <div className="restaurants-list">
            {restaurants.map((rest) => (
              <button
                key={rest.id}
                className={rest.id === activeRestaurantId ? 'restaurant-card active' : 'restaurant-card'}
                onClick={() => {
                  setActiveRestaurantId(rest.id);
                  setStage('menu');
                }}
              >
                <div className="restaurant-card-label">
                  <strong>{rest.name}</strong>
                  <span className="restaurant-category">・{rest.category}</span>
                </div>
                {rest.id === activeRestaurantId ? (
                  <span className="restaurant-icon" aria-hidden="true">🍽️</span>
                ) : null}
                <div className="restaurant-hover-info">
                  <span>评分 {rest.rating.toFixed(1)}</span>
                  <span>人均 ¥{rest.avg}</span>
                  <span>{rest.fee ? `配送 ¥${rest.fee}` : '免配送费'}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="panel menu-panel">
          <div className="panel-header">
            <div>
              <h2>{activeRestaurant.name}</h2>
              <p>{activeRestaurant.description}</p>
            </div>
            <div className="restaurant-meta">
              <span>{activeRestaurant.opening}</span>
              <span>{activeRestaurant.delivery}</span>
            </div>
          </div>

          {/* 筛选排序栏 */}
          <div className="filter-bar">
            <div className="sort-options">
              <span className="filter-label">排序：</span>
              {[
                { key: 'recommend', label: '推荐' },
                { key: 'sales', label: '销量优先' },
                { key: 'price-asc', label: '价格从低到高' },
              ].map((option) => (
                <button
                  key={option.key}
                  className={`sort-btn ${sortBy === option.key ? 'active' : ''}`}
                  onClick={() => setSortBy(option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="tag-filters">
              <span className="filter-label">筛选：</span>
              {[
                { key: '招牌', label: '招牌' },
                { key: '素食', label: '素食' },
                { key: '辣', label: '辣度' },
              ].map((tag) => (
                <button
                  key={tag.key}
                  className={`tag-filter ${filterTags.includes(tag.key) ? 'active' : ''}`}
                  onClick={() => toggleFilterTag(tag.key)}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          <div className="dishes-grid">
            {filteredAndSortedMenu.map((dish) => (
              <article key={dish.id} className="dish-card">
                <div className="dish-media">
                  <img
                    src={`${publicPath}images/${dish.id}.jpg`}
                    alt={dish.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `${publicPath}images/placeholder.svg`;
                    }}
                  />
                  {/* 标签叠加 */}
                  {dish.tags && dish.tags.length > 0 && (
                    <div className="dish-tags">
                      {dish.tags.map((tag, idx) => (
                        <span key={idx} className={`tag tag-${getTagClass(tag)}`}>
                          {getTagLabel(tag)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="dish-info">
                  <h3>{dish.name}</h3>
                  <p className="dish-desc">{dish.description}</p>
                  <div className="dish-meta">
                    <span className="meta-item">月售{dish.sales}+</span>
                    <span className="meta-item">好评率{dish.rating}%</span>
                    <span className="meta-item">{dish.calories}kcal</span>
                  </div>
                </div>
                <div className="dish-footer">
                  <span className="price">¥{dish.price.toFixed(2)}</span>
                  <button
                    className={`add-cart-btn ${addedDishes.has(dish.id) ? 'added' : ''}`}
                    onClick={() => handleAddToCartWithFeedback(dish)}
                  >
                    {addedDishes.has(dish.id) ? '已加入✓' : '加入购物车'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="panel cart-panel">
          <div className="cart-header">
            <h2>购物车</h2>
            {cart.length > 0 && (
              <span className="cart-count">
                <span className="count-num">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
              </span>
            )}
          </div>
          <div className="cart-list">
            {cart.length ? (
              cart.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-info">
                    <strong>{item.name}</strong>
                    <span className="cart-item-price">¥{item.price.toFixed(2)}</span>
                  </div>
                  <div className="cart-item-meta">
                    <span className="cart-item-subtotal">小计 ¥{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                  <div className="cart-controls">
                    <button className="qty-btn" onClick={() => handleQuantityChange(item.id, -1)}>-</button>
                    <span className="qty-num">{item.quantity}</span>
                    <button className="qty-btn" onClick={() => handleQuantityChange(item.id, 1)}>+</button>
                    <button className="remove-btn" onClick={() => handleRemove(item.id)}>✕</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-cart">
                <div className="empty-icon">🛒</div>
                <p className="empty-title">购物车空空如也～</p>
                <p className="empty-desc">快去挑选美食吧😋</p>
                <button className="empty-action" onClick={() => setStage('menu')}>去逛逛</button>
              </div>
            )}
          </div>

          <div className="summary-card">
            {/* 满减提示 */}
            {cart.length > 0 && cartTotal < 20 && (
              <div className="promo-hint">
                <span className="promo-icon">🎁</span>
                <span>再买 ¥{(20 - cartTotal).toFixed(2)} 元享满20减3</span>
              </div>
            )}
            {cart.length > 0 && cartTotal >= 20 && (
              <div className="promo-success">
                <span className="promo-icon">🎉</span>
                <span>已享满20减3优惠！</span>
              </div>
            )}
            <p className="total-row">总计：<strong>¥{cartTotal.toFixed(2)}</strong></p>
            <button
              className={`confirm-btn ${!cart.length ? 'disabled' : cartTotal < 20 ? 'disabled' : ''}`}
              onClick={handleConfirmOrder}
              disabled={!cart.length || cartTotal < 20}
              title={!cart.length ? '请先添加商品' : cartTotal < 20 ? '订单不足起送价20元' : ''}
            >
              {!cart.length ? '请先添加商品' : cartTotal < 20 ? '还差 ¥' + (20 - cartTotal).toFixed(2) + ' 元起送' : '确认订单'}
            </button>
            <button
              className={`secondary clear-btn ${cart.length === 0 ? 'disabled' : ''}`}
              onClick={() => {
                if (cart.length > 0 && window.confirm('确定要清空购物车吗？')) {
                  handleReset();
                }
              }}
              disabled={cart.length === 0}
            >
              清空订单
            </button>
          </div>
        </aside>
      </main>

      <section className="panel checkout-panel">
        <h2>订单确认</h2>
        <div className="checkout-grid">
          <div className="checkout-form">
            <label>
              姓名
              <input
                value={customer.name}
                onChange={(event) => setCustomer({ ...customer, name: event.target.value })}
                placeholder="联系人"
              />
            </label>
            <label>
              电话
              <input
                value={customer.phone}
                onChange={(event) => setCustomer({ ...customer, phone: event.target.value })}
                placeholder="手机号"
              />
            </label>
            <label>
              地址
              <input
                value={customer.address}
                onChange={(event) => setCustomer({ ...customer, address: event.target.value })}
                placeholder="送餐地址"
              />
            </label>
          </div>

          <div className="checkout-info">
            <div className="info-card">
              <h3>当前订单</h3>
              <ol>
                {cart.map((item) => (
                  <li key={item.id}>
                    {item.name} × {item.quantity} = ¥{(item.price * item.quantity).toFixed(2)}
                  </li>
                ))}
              </ol>
              <p className="order-total">订单总额：¥{cartTotal.toFixed(2)}</p>
            </div>
            <button
              className="pay-button"
              onClick={handlePay}
              disabled={stage !== 'confirm' || paymentStatus === 'processing' || !cart.length}
            >
                {paymentStatus === 'processing' ? '支付中...' : '支付'}
              </button>
            {paymentStatus === 'success' && (
              <div className="success-box">
                支付成功！感谢下单，{customer.name}。
              </div>
            )}
            <button className="secondary" onClick={handleReset}>重新开始</button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;