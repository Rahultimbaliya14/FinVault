import { useState, useEffect } from 'react';
import PageLayout from '../components/PageLayout';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../context/ToastContext';
import {
  fetchCards,
  createCard,
  recordPurchase,
  fetchBillingCycles,
  payBillingCycle,
} from '../api/cards';

const formatCurrency = (amount) => `₹${Math.round(amount || 0).toLocaleString('en-IN')}`;

const EMPTY_CARD_FORM = { cardName: '', creditLimit: '', billingDate: '', dueDate: '' };
const EMPTY_PURCHASE_FORM = { amount: '', date: new Date().toISOString().slice(0, 10), category: 'other', description: '' };

const CreditCards = () => {
  const { showToast } = useToast();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardForm, setCardForm] = useState(EMPTY_CARD_FORM);
  const [submittingCard, setSubmittingCard] = useState(false);

  const [expandedCardId, setExpandedCardId] = useState(null);
  const [cycles, setCycles] = useState([]);
  const [loadingCycles, setLoadingCycles] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState(EMPTY_PURCHASE_FORM);
  const [submittingPurchase, setSubmittingPurchase] = useState(false);

  const [confirmState, setConfirmState] = useState({ open: false, cardId: null, cycleId: null });

  const loadCards = async () => {
    try {
      const res = await fetchCards();
      setCards(res.data.cards);
    } catch (err) {
      showToast('Could not load credit cards.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCardFormChange = (e) => setCardForm({ ...cardForm, [e.target.name]: e.target.value });

  const handleAddCard = async (e) => {
    e.preventDefault();
    setSubmittingCard(true);
    try {
      await createCard({
        ...cardForm,
        creditLimit: Number(cardForm.creditLimit),
        billingDate: Number(cardForm.billingDate),
        dueDate: Number(cardForm.dueDate),
      });
      setCardForm(EMPTY_CARD_FORM);
      setShowCardForm(false);
      loadCards();
      showToast('Card added', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not add card.', 'error');
    } finally {
      setSubmittingCard(false);
    }
  };

  const toggleExpand = async (cardId) => {
    if (expandedCardId === cardId) {
      setExpandedCardId(null);
      return;
    }
    setExpandedCardId(cardId);
    setLoadingCycles(true);
    try {
      const res = await fetchBillingCycles(cardId);
      setCycles(res.data.cycles);
    } catch (err) {
      showToast('Could not load billing cycles.', 'error');
    } finally {
      setLoadingCycles(false);
    }
  };

  const handlePurchaseFormChange = (e) => setPurchaseForm({ ...purchaseForm, [e.target.name]: e.target.value });

  const handleRecordPurchase = async (e, cardId) => {
    e.preventDefault();
    setSubmittingPurchase(true);
    try {
      await recordPurchase(cardId, { ...purchaseForm, amount: Number(purchaseForm.amount) });
      setPurchaseForm(EMPTY_PURCHASE_FORM);
      loadCards();
      const res = await fetchBillingCycles(cardId);
      setCycles(res.data.cycles);
      showToast('Purchase recorded and billed to the correct cycle', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not record purchase.', 'error');
    } finally {
      setSubmittingPurchase(false);
    }
  };

  const handleConfirmPay = async () => {
    const { cardId, cycleId } = confirmState;
    try {
      await payBillingCycle(cardId, cycleId);
      loadCards();
      const res = await fetchBillingCycles(cardId);
      setCycles(res.data.cycles);
      showToast('Cycle marked as paid', 'success');
    } catch (err) {
      showToast('Could not update the cycle.', 'error');
    } finally {
      setConfirmState({ open: false, cardId: null, cycleId: null });
    }
  };

  return (
    <PageLayout>
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
          <span className="eyebrow-tab">Credit Cards</span>
          <h1 className="font-display mt-3" style={{ fontSize: '2rem', color: 'var(--ink-navy)' }}>
            Cards & billing cycles
          </h1>
        </div>
        <button className="btn-ledger" onClick={() => setShowCardForm(!showCardForm)}>
          {showCardForm ? 'Cancel' : '+ Add card'}
        </button>
      </div>

      {showCardForm && (
        <div className="card-paper p-4 mb-4">
          <form onSubmit={handleAddCard}>
            <div className="row g-3">
              <div className="col-md-6">
                <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>Card name</label>
                <input name="cardName" className="input-ledger" value={cardForm.cardName} onChange={handleCardFormChange} required />
              </div>
              <div className="col-md-6">
                <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>Credit limit</label>
                <input name="creditLimit" type="number" className="input-ledger" value={cardForm.creditLimit} onChange={handleCardFormChange} required min="0" />
              </div>
              <div className="col-md-6">
                <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>Billing date (day of month)</label>
                <input name="billingDate" type="number" className="input-ledger" value={cardForm.billingDate} onChange={handleCardFormChange} required min="1" max="31" placeholder="e.g. 15" />
              </div>
              <div className="col-md-6">
                <label style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)' }}>Due date (day of month)</label>
                <input name="dueDate" type="number" className="input-ledger" value={cardForm.dueDate} onChange={handleCardFormChange} required min="1" max="31" placeholder="e.g. 5" />
              </div>
            </div>
            <button type="submit" className="btn-ledger mt-4" disabled={submittingCard}>
              {submittingCard ? 'Adding…' : 'Add card'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--ink-text-muted)' }}>Loading cards…</p>
      ) : cards.length === 0 ? (
        <div className="card-paper p-4">
          <p style={{ color: 'var(--ink-text-muted)' }}>No credit cards added yet.</p>
        </div>
      ) : (
        cards.map((card) => (
          <div className="card-paper p-4 mb-3" key={card._id}>
            <div
              className="d-flex justify-content-between align-items-center"
              style={{ cursor: 'pointer' }}
              onClick={() => toggleExpand(card._id)}
            >
              <div>
                <div className="font-display" style={{ fontSize: '1.15rem' }}>{card.cardName}</div>
                <div className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--ink-text-muted)' }}>
                  Bills on the {card.billingDate}{getOrdinal(card.billingDate)} · Due the {card.dueDate}{getOrdinal(card.dueDate)}
                </div>
              </div>
              <div className="text-end">
                <div className="ledger-row-value value-negative">{formatCurrency(card.outstanding)}</div>
                <div className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--ink-text-muted)' }}>
                  of {formatCurrency(card.creditLimit)} limit
                </div>
              </div>
            </div>

            {expandedCardId === card._id && (
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--rule)' }}>
                {/* Record a purchase */}
                <h3 className="font-display" style={{ fontSize: '1rem', marginBottom: '0.8rem' }}>Record a purchase</h3>
                <form onSubmit={(e) => handleRecordPurchase(e, card._id)} className="row g-2 mb-4">
                  <div className="col-md-3">
                    <input name="amount" type="number" placeholder="Amount" className="input-ledger" value={purchaseForm.amount} onChange={handlePurchaseFormChange} required min="0" />
                  </div>
                  <div className="col-md-3">
                    <input name="date" type="date" className="input-ledger" value={purchaseForm.date} onChange={handlePurchaseFormChange} required />
                  </div>
                  <div className="col-md-3">
                    <input name="description" placeholder="Description" className="input-ledger" value={purchaseForm.description} onChange={handlePurchaseFormChange} />
                  </div>
                  <div className="col-md-3">
                    <button type="submit" className="btn-ledger w-100" disabled={submittingPurchase}>
                      {submittingPurchase ? 'Saving…' : 'Add purchase'}
                    </button>
                  </div>
                </form>

                {/* Billing cycles */}
                <h3 className="font-display" style={{ fontSize: '1rem', marginBottom: '0.8rem' }}>Billing cycles</h3>
                {loadingCycles ? (
                  <p style={{ color: 'var(--ink-text-muted)', fontSize: '0.9rem' }}>Loading cycles…</p>
                ) : cycles.length === 0 ? (
                  <p style={{ color: 'var(--ink-text-muted)', fontSize: '0.9rem' }}>No purchases recorded yet.</p>
                ) : (
                  cycles.map((cycle) => (
                    <div className="ledger-row" key={cycle._id}>
                      <div>
                        <div className="ledger-row-label" style={{ color: 'var(--ink-text)', fontWeight: 500 }}>
                          {new Date(cycle.periodStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          {' – '}
                          {new Date(cycle.periodEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </div>
                        <div className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--ink-text-muted)' }}>
                          Due {new Date(cycle.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {cycle.status}
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-3">
                        <span className="ledger-row-value value-negative">{formatCurrency(cycle.statementAmount)}</span>
                        {cycle.status !== 'paid' && (
                          <button
                            onClick={() => setConfirmState({ open: true, cardId: card._id, cycleId: cycle._id })}
                            style={{ background: 'none', border: 'none', color: 'var(--emerald)', fontSize: '0.8rem', cursor: 'pointer' }}
                          >
                            Mark paid
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))
      )}

      <ConfirmDialog
        open={confirmState.open}
        title="Mark this cycle as paid?"
        message="This clears the statement amount from your outstanding balance. Only do this once the payment has actually gone through."
        confirmLabel="Mark paid"
        onConfirm={handleConfirmPay}
        onCancel={() => setConfirmState({ open: false, cardId: null, cycleId: null })}
      />
    </PageLayout>
  );
};

// 1st, 2nd, 3rd, 4th... for the billing/due date display
const getOrdinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
};

export default CreditCards;