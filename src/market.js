const STORAGE_KEY = 'nexora-market-local-v1';
const MERCHANT_DIR = `${import.meta.env.BASE_URL}images/merchant/`;

const catalog = [
  { id: 'basic', name: 'Marco Básico', description: 'Un marco limpio para cualquier recuerdo.', price: 20, rarity: 'common', style: 'basic', type: 'frame' },
  { id: 'crimson', name: 'Crimson Frame', description: 'Cristal oscuro con acentos carmesí.', price: 35, rarity: 'common', style: 'crimson', type: 'frame' },
  { id: 'neon-red', name: 'Neon Red', description: 'Luz roja precisa sobre vidrio ahumado.', price: 45, rarity: 'rare', style: 'neon', type: 'frame' },
  { id: 'luxury-gold', name: 'Luxury Gold', description: 'Detalles metálicos en dorado cálido.', price: 60, rarity: 'rare', style: 'gold', type: 'frame' },
  { id: 'glass-premium', name: 'Glass Premium', description: 'Capas translúcidas con reflejos suaves.', price: 80, rarity: 'epic', style: 'glass', type: 'frame' },
  { id: 'melgar-edition', name: 'Melgar Edition', description: 'Una pieza exclusiva de este viaje.', price: 100, rarity: 'epic', style: 'melgar', type: 'frame' },
  { id: 'memories-forever', name: 'Memories Forever', description: 'Un acabado especial para guardar por siempre.', price: 120, rarity: 'epic', style: 'memories', type: 'frame' },
  { id: 'nexora-exclusive', name: 'Nexora Exclusive', description: 'La pieza más rara del mercado.', price: 200, rarity: 'legendary', style: 'exclusive', type: 'frame' },
  { id: 'melgar-stickers', name: 'Melgar Stickers', description: 'Detalles gráficos para celebrar cada recuerdo.', price: 25, rarity: 'common', style: 'melgar', type: 'decoration' },
  { id: 'profile-burgundy', name: 'Burgundy Profile', description: 'Fondo borgoña para tu perfil.', price: 50, rarity: 'rare', style: 'crimson', type: 'background' },
  { id: 'nexora-signature', name: 'Nexora Signature', description: 'Un detalle de colección para tu inventario.', price: 90, rarity: 'epic', style: 'gold', type: 'decoration' },
];

const demoAccounts = [
  { id: 'manchi', username: 'manchi', name: 'manchi', role: 'Propietario · privilegios pendientes de autenticación' },
  ...Array.from({ length: 10 }, (_, index) => ({
    id: `persona-${index + 1}`,
    username: `persona${index + 1}`,
    name: `Persona ${index + 1}`,
    role: 'Participante · perfil local de prueba',
  })),
];

const sellerLines = {
  entrance: ['Vaya, vaya... tenemos un nuevo visitante.', 'Piezas únicas para historias que merecen quedarse.', 'Pasa. Siempre hay algo especial esperando.'],
  purchase: ['Una excelente elección. Cuida bien esa pieza.', 'Ya es tuya. Estoy seguro de que encontrará su lugar.', 'Una pieza digna de tu colección.'],
  broke: ['Me temo que tu bolsillo todavía no está preparado.', 'Vuelve cuando tengas unas monedas más.', 'Las buenas piezas saben esperar.'],
  special: ['Esto no se encuentra todos los días...', 'Una pieza extraordinaria para alguien especial.', 'Has elegido una rareza. Cuídala bien.'],
};

const ui = {
  wallet: document.querySelector('#coinBalance'),
  account: document.querySelector('#marketAccount'),
  status: document.querySelector('#marketStatus'),
  connection: document.querySelector('#marketConnection'),
  catalog: document.querySelector('#marketCatalog'),
  inventory: document.querySelector('#marketInventory'),
  history: document.querySelector('#marketHistory'),
  equipped: document.querySelector('#equippedLabel'),
  reveal: document.querySelector('#marketReveal'),
  merchantCard: document.querySelector('#merchantCard'),
  merchantImage: document.querySelector('#merchantImage'),
  merchantPlaceholder: document.querySelector('#merchantPlaceholder'),
  dialogue: document.querySelector('#merchantDialogue'),
};

let state = loadState();
let revealTimer;

export function initMarket() {
  if (!ui.catalog) return;
  ui.connection.textContent = 'MODO LOCAL · SIN SUPABASE';
  ui.status.textContent = 'Saldos y compras guardados solo en este navegador. No hay sincronización ni cuentas autenticadas.';
  ui.account.innerHTML = demoAccounts.map((account) => `<option value="${escapeHtml(account.id)}">${escapeHtml(account.name)} · ${escapeHtml(account.role)}</option>`).join('');
  ui.account.value = state.activeUserId;
  ui.account.addEventListener('change', () => {
    state.activeUserId = ui.account.value;
    persistState();
    renderMarket();
    announceGalleryUpdate();
  });
  ui.catalog.addEventListener('click', handleCatalogAction);
  ui.inventory.addEventListener('click', handleInventoryAction);
  ui.reveal?.addEventListener('click', (event) => { if (event.target.closest('[data-market-reveal-close]')) closeReveal(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeReveal(); });

  window.nexoraMarketUserId = () => state.activeUserId;
  window.nexoraMarketFrameClass = (memory) => {
    if (!memory || memory.ownerUserId !== state.activeUserId) return '';
    const item = catalog.find((entry) => entry.id === state.accounts[state.activeUserId]?.equippedItemId);
    return item?.type === 'frame' ? `market-personal-frame market-personal-frame--${item.style}` : '';
  };
  window.nexoraMarketAward = awardCoins;
  window.addEventListener('nexora:market-updated', announceGalleryUpdate);

  setMerchantMood('idle');
  say('entrance');
  renderMarket();
}

function loadState() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { saved = {}; }
  const accounts = Object.fromEntries(demoAccounts.map((account) => {
    const prior = saved.accounts?.[account.id] || {};
    const inventory = Array.isArray(prior.inventory) ? [...new Set(prior.inventory.filter((id) => catalog.some((item) => item.id === id)))] : [];
    return [account.id, {
      coinBalance: Math.max(0, Math.floor(Number(prior.coinBalance) || 0)),
      inventory,
      equippedItemId: inventory.includes(prior.equippedItemId) ? prior.equippedItemId : null,
    }];
  }));
  return {
    activeUserId: accounts[saved.activeUserId] ? saved.activeUserId : 'persona-1',
    accounts,
    transactions: Array.isArray(saved.transactions) ? saved.transactions.slice(0, 200) : [],
  };
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function renderMarket() {
  const account = state.accounts[state.activeUserId];
  ui.wallet.textContent = `${formatNumber(account.coinBalance)} NC`;
  renderCatalog();
  renderInventory();
  renderHistory();
}

function renderCatalog() {
  const account = state.accounts[state.activeUserId];
  ui.catalog.innerHTML = catalog.map((item) => {
    const owned = account.inventory.includes(item.id);
    return `<article class="market-item market-rarity--${item.rarity}" data-item-card="${item.id}">
      <div class="market-item__art"><span class="market-rarity">${escapeHtml(item.rarity)}</span><div class="market-frame-preview market-frame-preview--${item.style}"><span>NEXORA</span><strong>${item.type === 'frame' ? 'RECUERDO' : escapeHtml(item.type)}</strong><small>MELGAR · 2026</small></div></div>
      <div class="market-item__body"><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.description)}</p><div class="market-item__buy"><strong class="market-price"><span class="coin-icon coin-icon--small">N</span>${formatNumber(item.price)} <small>NC</small></strong><button class="button" type="button" data-market-buy="${item.id}" ${owned ? 'disabled' : ''}>${owned ? 'En tu inventario' : 'Adquirir pieza'}</button></div></div>
    </article>`;
  }).join('');
}

function renderInventory() {
  const account = state.accounts[state.activeUserId];
  const owned = account.inventory.map((id) => catalog.find((item) => item.id === id)).filter(Boolean);
  ui.inventory.innerHTML = owned.length
    ? owned.map((item) => `<article class="inventory-item"><div class="market-frame-preview market-frame-preview--${item.style}"><span>NEXORA</span><strong>${item.type === 'frame' ? 'RECUERDO' : escapeHtml(item.type)}</strong><small>MELGAR · 2026</small></div><div><strong>${escapeHtml(item.name)}</strong><small>${account.equippedItemId === item.id ? 'Equipado' : 'En tu colección'}</small><button class="button-ghost" type="button" data-market-equip="${item.id}">${account.equippedItemId === item.id ? 'Desequipar' : 'Equipar'}</button></div></article>`).join('')
    : '<p class="market-empty">Todavía no hay artículos en esta colección.</p>';
  const equipped = catalog.find((item) => item.id === account.equippedItemId);
  ui.equipped.textContent = equipped ? `Equipado · ${equipped.name}` : 'Sin artículo equipado';
}

function renderHistory() {
  const history = state.transactions.filter((entry) => entry.userId === state.activeUserId).slice(0, 30);
  ui.history.innerHTML = history.length
    ? history.map((entry) => `<div class="market-transaction"><span>${escapeHtml(entry.reason)}<small>${formatDate(entry.createdAt)}</small></span><strong class="${entry.delta < 0 ? 'is-debit' : 'is-credit'}">${entry.delta > 0 ? '+' : ''}${formatNumber(entry.delta)} NC</strong></div>`).join('')
    : '<p class="market-empty">El historial de movimientos está vacío.</p>';
}

function handleCatalogAction(event) {
  const button = event.target.closest('[data-market-buy]');
  if (!button || button.disabled) return;
  const item = catalog.find((entry) => entry.id === button.dataset.marketBuy);
  const account = state.accounts[state.activeUserId];
  if (!item || account.inventory.includes(item.id)) return;
  if (account.coinBalance < item.price) { say('broke'); setMerchantMood('idle'); return; }

  const before = structuredClone(state);
  button.disabled = true;
  button.textContent = 'Procesando…';
  account.coinBalance -= item.price;
  account.inventory.push(item.id);
  state.transactions.unshift({ id: safeId(), userId: state.activeUserId, delta: -item.price, reason: `Compra · ${item.name}`, createdAt: new Date().toISOString() });
  try { persistState(); }
  catch {
    state = before;
    renderMarket();
    setStatus('No se pudo guardar en este navegador. No se confirmó la compra.');
    return;
  }

  renderMarket();
  button.closest('.market-item')?.classList.add('market-item--purchased');
  setMerchantMood('buy');
  say(item.rarity === 'legendary' ? 'special' : 'purchase');
  revealPurchase(item);
  window.setTimeout(() => setMerchantMood(item.rarity === 'legendary' ? 'special' : 'happy'), 1100);
  announceGalleryUpdate();
}

function handleInventoryAction(event) {
  const button = event.target.closest('[data-market-equip]');
  if (!button) return;
  const itemId = button.dataset.marketEquip;
  const account = state.accounts[state.activeUserId];
  if (!account.inventory.includes(itemId)) return;
  account.equippedItemId = account.equippedItemId === itemId ? null : itemId;
  try { persistState(); }
  catch { setStatus('No se pudo guardar el equipamiento en este navegador.'); return; }
  renderMarket();
  announceGalleryUpdate();
}

function awardCoins(amount, reason, participantId) {
  const accountId = state.accounts[participantId] ? participantId : state.activeUserId;
  const account = state.accounts[accountId];
  const value = Math.floor(Number(amount));
  if (!account || !Number.isFinite(value) || value <= 0) return false;
  const before = structuredClone(state);
  account.coinBalance += value;
  state.transactions.unshift({ id: safeId(), userId: accountId, delta: value, reason: String(reason || 'Recompensa'), createdAt: new Date().toISOString() });
  try { persistState(); }
  catch { state = before; return false; }
  if (accountId === state.activeUserId) renderMarket();
  return true;
}

function revealPurchase(item) {
  document.querySelector('#revealItemName').textContent = item.name;
  document.querySelector('#revealCost').textContent = `−${formatNumber(item.price)} NC · Saldo disponible: ${formatNumber(state.accounts[state.activeUserId].coinBalance)} NC`;
  document.querySelector('#revealFrame').className = `market-frame-preview market-frame-preview--${item.style}`;
  ui.reveal.classList.remove('hidden');
  window.clearTimeout(revealTimer);
  revealTimer = window.setTimeout(closeReveal, 9000);
}

function closeReveal() { ui.reveal?.classList.add('hidden'); window.clearTimeout(revealTimer); }

function setMerchantMood(mood) {
  if (!ui.merchantImage || !ui.merchantPlaceholder) return;
  const candidates = mood === 'idle' ? ['merchant-idle.png', 'merchant.png']
    : mood === 'happy' ? ['merchant-happy.png', 'merchant-idle.png', 'merchant.png']
      : mood === 'buy' ? ['merchant-buy.png', 'merchant-happy.png', 'merchant.png']
        : ['merchant-special.png', 'merchant-happy.png', 'merchant.png'];
  let index = 0;
  ui.merchantImage.onerror = () => {
    index += 1;
    if (index < candidates.length) ui.merchantImage.src = `${MERCHANT_DIR}${candidates[index]}`;
    else { ui.merchantImage.classList.remove('is-visible'); ui.merchantPlaceholder.classList.remove('hidden'); }
  };
  ui.merchantImage.onload = () => { ui.merchantImage.classList.add('is-visible'); ui.merchantPlaceholder.classList.add('hidden'); };
  ui.merchantPlaceholder.classList.remove('hidden');
  ui.merchantImage.classList.remove('is-visible');
  ui.merchantImage.src = `${MERCHANT_DIR}${candidates[0]}`;
  ui.merchantCard?.setAttribute('data-mood', mood);
}

function say(kind) {
  const lines = sellerLines[kind] || sellerLines.purchase;
  if (ui.dialogue) { ui.dialogue.textContent = `«${lines[Math.floor(Math.random() * lines.length)]}»`; ui.dialogue.classList.remove('dialogue-pulse'); void ui.dialogue.offsetWidth; ui.dialogue.classList.add('dialogue-pulse'); }
}

function announceGalleryUpdate() { window.dispatchEvent(new Event('nexora:render-gallery')); }
function setStatus(message) { if (ui.status) ui.status.textContent = message; }
function formatNumber(value) { return new Intl.NumberFormat('es-CO').format(Number(value) || 0); }
function formatDate(value) { return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }
function safeId() { return crypto.randomUUID?.() || `nc-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
function escapeHtml(value = '') { return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }

