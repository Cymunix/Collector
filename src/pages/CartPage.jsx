import React from 'react'

export default function CartPage({ scope }) {
  const {
    authMessage,
    cartItems,
    cartSubtotalCents,
    cartTaxCents,
    cartTotalCents,
    formatPlanPrice,
    handleCheckoutCart,
    isUpdatingPlan,
    removePlanFromCart,
    setCurrentScreen,
    tx
  } = scope
  return (
          <section className="plans-screen" aria-label="Shopping cart">
            <h1>{tx('Your Cart')}</h1>
            <p className="subtitle">{tx('Review your selected subscription items before checkout.')}</p>

            {authMessage && <p className="auth-banner">{authMessage}</p>}

            {cartItems.length === 0 ? (
              <div className="cart-page-empty">
                <p className="subtitle">{tx('Your cart is empty.')}</p>
                <button type="button" className="back-home-btn" onClick={() => setCurrentScreen('plans')}>
                  {tx('Browse Plans')}
                </button>
              </div>
            ) : (
              <div className="cart-page-layout">
                <div className="cart-list" role="list">
                  {cartItems.map((item) => (
                    <div key={item.tier} className="cart-item" role="listitem">
                      <div>
                        <p className="cart-item-name">{item.display_name}</p>
                        <p className="cart-item-price">{formatPlanPrice(item.monthly_price_cents)}</p>
                      </div>
                      <button
                        type="button"
                        className="cart-remove-btn"
                        onClick={() => removePlanFromCart(item.tier)}
                      >
                        {tx('Remove')}
                      </button>
                    </div>
                  ))}
                </div>

                <aside className="cart-summary cart-page-summary">
                  <div className="cart-summary-row">
                    <span>{tx('Items')}</span>
                    <span>{cartItems.length}</span>
                  </div>
                  <div className="cart-summary-row">
                    <span>{tx('Subtotal')}</span>
                    <span>{formatPlanPrice(cartSubtotalCents)}</span>
                  </div>
                  <div className="cart-summary-row">
                    <span>Tax (14%)</span>
                    <span>{formatPlanPrice(cartTaxCents)}</span>
                  </div>
                  <div className="cart-summary-row cart-summary-total">
                    <span>{tx('Total')}</span>
                    <span>{formatPlanPrice(cartTotalCents)}</span>
                  </div>

                  <div className="cart-page-actions">
                    <button type="button" className="switch-auth support-cancel" onClick={() => setCurrentScreen('plans')}>
                      {tx('Keep Shopping')}
                    </button>
                    <button
                      type="button"
                      className="auth-submit support-submit"
                      onClick={handleCheckoutCart}
                      disabled={isUpdatingPlan}
                    >
                      {isUpdatingPlan ? tx('Processing...') : tx('Checkout')}
                    </button>
                  </div>
                </aside>
              </div>
            )}
          </section>
  )
}
