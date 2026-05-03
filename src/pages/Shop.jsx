import { useState, useEffect } from 'react'
import { ShoppingCart, X, Plus, Minus, User, LogOut, Search, Shield, Zap, Package } from 'lucide-react'
import { getProducts, login, register, createOrder } from '../api'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'

const CATEGORY_COLORS = {
  Electronics: '#e8f4fd',
  Furniture: '#f0fdf4',
  Lifestyle: '#fef9e7',
  Sports: '#fdf2f8',
  Clothing: '#f0f4ff',
  default: '#f5f5f5'
}

export default function Shop() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sg_user')
    return saved ? JSON.parse(saved) : null
  })
  const [authMode, setAuthMode] = useState(null) // 'login' | 'register' | null
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' })
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [orderSuccess, setOrderSuccess] = useState(null)
  const [checkingOut, setCheckingOut] = useState(false)
  const [notification, setNotification] = useState(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    try {
      const res = await getProducts()
      const data = res.data
      setProducts(data.products || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function notify(msg, type = 'success') {
    setNotification({ msg, type })
    setTimeout(() => setNotification(null), 3000)
  }

  function addToCart(product) {
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.productId)
      if (existing) {
        if (existing.quantity >= product.stock) {
          notify('Max stock reached', 'error')
          return prev
        }
        return prev.map(i => i.productId === product.productId ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { ...product, quantity: 1 }]
    })
    notify(`${product.name} added to cart`)
  }

  function removeFromCart(productId) {
    setCart(prev => prev.filter(i => i.productId !== productId))
  }

  function updateQty(productId, delta) {
    setCart(prev => prev.map(i => {
      if (i.productId !== productId) return i
      const newQty = i.quantity + delta
      if (newQty <= 0) return null
      if (newQty > i.stock) return i
      return { ...i, quantity: newQty }
    }).filter(Boolean))
  }

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0)

  async function handleAuth(e) {
    e.preventDefault()
    setAuthError('')
    setAuthLoading(true)
    try {
      if (authMode === 'login') {
        const res = await login(authForm.email, authForm.password)
        const u = res.data
        setUser(u)
        localStorage.setItem('sg_user', JSON.stringify(u))
        setAuthMode(null)
        notify(`Welcome back, ${u.name}!`)
      } else {
        await register(authForm.name, authForm.email, authForm.password)
        const res = await login(authForm.email, authForm.password)
        const u = res.data
        setUser(u)
        localStorage.setItem('sg_user', JSON.stringify(u))
        setAuthMode(null)
        notify(`Welcome, ${u.name}!`)
      }
    } catch (err) {
      setAuthError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setAuthLoading(false)
    }
  }

  function logout() {
    setUser(null)
    localStorage.removeItem('sg_user')
    notify('Logged out')
  }

  async function handleCheckout() {
    if (!user) { setAuthMode('login'); setCartOpen(false); return }
    setCheckingOut(true)
    const results = []
    for (const item of cart) {
      try {
        const res = await createOrder(item.productId, user.userId, item.quantity)
        results.push({ ...res.data.order, name: item.name })
      } catch (err) {
        notify(`Failed to order ${item.name}: ${err.response?.data?.error || 'error'}`, 'error')
      }
    }
    setCheckingOut(false)
    if (results.length > 0) {
      setCart([])
      setCartOpen(false)
      setOrderSuccess(results)
      fetchProducts()
    }
  }

  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))]
  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'All' || p.category === category
    return matchSearch && matchCat
  })

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7f4', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Notification */}
      {notification && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: notification.type === 'error' ? '#fee2e2' : '#dcfce7',
          color: notification.type === 'error' ? '#991b1b' : '#166534',
          padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 500,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)', transition: 'all 0.3s'
        }}>
          {notification.msg}
        </div>
      )}

      {/* Header */}
      <header style={{
        background: '#fff', borderBottom: '1px solid #eee',
        padding: '0 32px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={22} color="#f59e0b" fill="#f59e0b" />
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px' }}>SpikeGuard</span>
          <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 4, fontWeight: 400 }}>store</span>
        </div>

        <div style={{ flex: 1, maxWidth: 400, margin: '0 32px', position: 'relative' }}>
          <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            style={{
              width: '100%', padding: '9px 12px 9px 36px',
              border: '1px solid #e5e7eb', borderRadius: 8,
              fontSize: 14, outline: 'none', background: '#f9fafb'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 600, color: '#92400e'
              }}>{user.name?.[0]?.toUpperCase()}</div>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{user.name}</span>
              <button onClick={logout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex' }}>
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button onClick={() => setAuthMode('login')} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8, border: '1px solid #e5e7eb',
              background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500
            }}>
              <User size={15} /> Sign in
            </button>
          )}

          <button onClick={() => setCartOpen(true)} style={{
            position: 'relative', background: '#1a1a1a', border: 'none',
            borderRadius: 8, padding: '8px 16px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontSize: 14, fontWeight: 500
          }}>
            <ShoppingCart size={16} />
            Cart
            {cartCount > 0 && (
              <span style={{
                background: '#f59e0b', color: '#1a1a1a', borderRadius: '50%',
                width: 20, height: 20, fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>{cartCount}</span>
            )}
          </button>
        </div>
      </header>

      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        color: '#fff', padding: '48px 32px', textAlign: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
          <Shield size={16} color="#f59e0b" />
          <span style={{ fontSize: 13, color: '#f59e0b', fontWeight: 500, letterSpacing: 1 }}>POWERED BY AWS LAMBDA</span>
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 8, letterSpacing: '-1px' }}>
          Shop Without Limits
        </h1>
        <p style={{ fontSize: 16, color: '#9ca3af', maxWidth: 480, margin: '0 auto' }}>
          Serverless infrastructure means zero downtime — even during flash sales with 10,000+ simultaneous orders.
        </p>
      </div>

      {/* Category Filter */}
      <div style={{ padding: '20px 32px 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)} style={{
            padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500,
            border: '1px solid', cursor: 'pointer', transition: 'all 0.15s',
            background: category === cat ? '#1a1a1a' : '#fff',
            color: category === cat ? '#fff' : '#6b7280',
            borderColor: category === cat ? '#1a1a1a' : '#e5e7eb'
          }}>{cat}</button>
        ))}
      </div>

      {/* Products Grid */}
      <main style={{ padding: '24px 32px 64px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
            <p>Loading products from AWS...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af' }}>
            <Package size={48} style={{ marginBottom: 12, opacity: 0.4 }} />
            <p>No products found</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 20
          }}>
            {filtered.map(product => (
              <ProductCard key={product.productId} product={product} onAdd={() => addToCart(product)} />
            ))}
          </div>
        )}
      </main>

      {/* Cart Drawer */}
      {cartOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
          <div onClick={() => setCartOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: 400,
            background: '#fff', display: 'flex', flexDirection: 'column',
            boxShadow: '-8px 0 30px rgba(0,0,0,0.12)'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>Your Cart ({cartCount})</h2>
              <button onClick={() => setCartOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
                  <ShoppingCart size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                  <p>Your cart is empty</p>
                </div>
              ) : cart.map(item => (
                <div key={item.productId} style={{
                  display: 'flex', gap: 12, padding: '12px 0',
                  borderBottom: '1px solid #f3f4f6', alignItems: 'center'
                }}>
                  <img src={item.image || FALLBACK_IMAGE} alt={item.name}
                    style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }}
                    onError={e => { e.target.src = FALLBACK_IMAGE }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{item.name}</p>
                    <p style={{ fontSize: 13, color: '#6b7280' }}>₹{item.price.toLocaleString()}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                      <button onClick={() => updateQty(item.productId, -1)} style={qtyBtn}><Minus size={12} /></button>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{item.quantity}</span>
                      <button onClick={() => updateQty(item.productId, 1)} style={qtyBtn}><Plus size={12} /></button>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 14, fontWeight: 600 }}>₹{(item.price * item.quantity).toLocaleString()}</p>
                    <button onClick={() => removeFromCart(item.productId)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', marginTop: 4 }}>
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {cart.length > 0 && (
              <div style={{ padding: '16px 24px', borderTop: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <span style={{ fontWeight: 500 }}>Total</span>
                  <span style={{ fontWeight: 700, fontSize: 18 }}>₹{cartTotal.toLocaleString()}</span>
                </div>
                <button onClick={handleCheckout} disabled={checkingOut} style={{
                  width: '100%', padding: '14px', borderRadius: 10, border: 'none',
                  background: checkingOut ? '#9ca3af' : '#1a1a1a',
                  color: '#fff', fontSize: 15, fontWeight: 600, cursor: checkingOut ? 'not-allowed' : 'pointer'
                }}>
                  {checkingOut ? 'Placing Orders...' : user ? 'Place Order' : 'Sign in to Checkout'}
                </button>
                {!user && <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 8 }}>You need to be signed in to checkout</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {authMode && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => setAuthMode(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
          <div style={{
            position: 'relative', background: '#fff', borderRadius: 16,
            padding: '32px', width: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
              <Zap size={20} color="#f59e0b" fill="#f59e0b" />
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>
                {authMode === 'login' ? 'Welcome back' : 'Create account'}
              </h2>
            </div>

            <form onSubmit={handleAuth}>
              {authMode === 'register' && (
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Full Name</label>
                  <input value={authForm.name} onChange={e => setAuthForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Arnav Kumar" required style={inputStyle} />
                </div>
              )}
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Email</label>
                <input type="email" value={authForm.email} onChange={e => setAuthForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="you@example.com" required style={inputStyle} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Password</label>
                <input type="password" value={authForm.password} onChange={e => setAuthForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••" required style={inputStyle} />
              </div>

              {authError && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 14 }}>{authError}</p>}

              <button type="submit" disabled={authLoading} style={{
                width: '100%', padding: '12px', borderRadius: 8, border: 'none',
                background: '#1a1a1a', color: '#fff', fontSize: 15, fontWeight: 600,
                cursor: authLoading ? 'not-allowed' : 'pointer', marginBottom: 12
              }}>
                {authLoading ? 'Please wait...' : authMode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: 13, color: '#6b7280' }}>
              {authMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <span onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError('') }}
                style={{ color: '#1a1a1a', fontWeight: 600, cursor: 'pointer' }}>
                {authMode === 'login' ? 'Register' : 'Sign in'}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Order Success Modal */}
      {orderSuccess && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => setOrderSuccess(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
          <div style={{
            position: 'relative', background: '#fff', borderRadius: 16,
            padding: '32px', width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Order Confirmed!</h2>
              <p style={{ color: '#6b7280', fontSize: 14 }}>Your order has been pushed to SQS queue and processed via AWS Lambda.</p>
            </div>
            {orderSuccess.map((order, i) => (
              <div key={i} style={{ background: '#f9fafb', borderRadius: 8, padding: '12px 16px', marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{order.name}</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>₹{Number(order.totalPrice).toLocaleString()}</span>
                </div>
                <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Order ID: {order.orderId?.slice(0, 8)}...</p>
              </div>
            ))}
            <button onClick={() => setOrderSuccess(null)} style={{
              width: '100%', padding: '12px', borderRadius: 8, border: 'none',
              background: '#1a1a1a', color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', marginTop: 16
            }}>Continue Shopping</button>
          </div>
        </div>
      )}
    </div>
  )
}

function ProductCard({ product, onAdd }) {
  const [imgError, setImgError] = useState(false)
  const inStock = product.stock > 0

  return (
    <div style={{
      background: '#fff', borderRadius: 14, overflow: 'hidden',
      border: '1px solid #f0f0f0', transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'default'
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.08)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div style={{ position: 'relative', height: 200, overflow: 'hidden', background: '#f9fafb' }}>
        <img
          src={imgError ? FALLBACK_IMAGE : (product.image || FALLBACK_IMAGE)}
          alt={product.name}
          onError={() => setImgError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {product.category && (
          <span style={{
            position: 'absolute', top: 10, left: 10,
            background: CATEGORY_COLORS[product.category] || CATEGORY_COLORS.default,
            color: '#374151', fontSize: 11, fontWeight: 600,
            padding: '4px 10px', borderRadius: 20
          }}>{product.category}</span>
        )}
        {!inStock && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <span style={{ background: '#ef4444', color: '#fff', padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>Out of Stock</span>
          </div>
        )}
      </div>

      <div style={{ padding: '14px 16px' }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, lineHeight: 1.3 }}>{product.name}</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 18, fontWeight: 700 }}>₹{Number(product.price).toLocaleString()}</span>
          <span style={{ fontSize: 12, color: product.stock < 10 ? '#ef4444' : '#9ca3af' }}>
            {inStock ? `${product.stock} left` : 'Sold out'}
          </span>
        </div>
        <button onClick={onAdd} disabled={!inStock} style={{
          width: '100%', padding: '9px', borderRadius: 8, border: 'none',
          background: inStock ? '#1a1a1a' : '#e5e7eb',
          color: inStock ? '#fff' : '#9ca3af',
          fontSize: 13, fontWeight: 600, cursor: inStock ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
        }}>
          <ShoppingCart size={14} /> Add to Cart
        </button>
      </div>
    </div>
  )
}

const qtyBtn = {
  width: 24, height: 24, borderRadius: 6, border: '1px solid #e5e7eb',
  background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
}

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#374151' }

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: '1px solid #e5e7eb', fontSize: 14, outline: 'none',
  fontFamily: "'DM Sans', sans-serif"
}
