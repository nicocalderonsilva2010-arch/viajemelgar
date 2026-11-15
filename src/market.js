const SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_KEY = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '');
const SESSION_KEY = 'nexora-market-session-v1';
const MERCHANT_DIR = '/images/merchant/';

const starterCatalog = [
  ['basic', 'Marco Básico', 'Un marco limpio para cualquier recuerdo.', 20, 'common', 'basic'],
  ['crimson', 'Crimson Frame', 'Cristal oscuro con acentos carmesí.', 35, 'common', 'crimson'],
  ['neon-red', 'Neon Red', 'Luz roja precisa sobre vidrio ahumado.', 45, 'rare', 'neon'],
  ['luxury-gold', 'Luxury Gold', 'Detalles metálicos en dorado cálido.', 60, 'rare', 'gold'],
  ['glass-premium', 'Glass Premium', 'Capas translúcidas con reflejos suaves.', 80, 'epic', 'glass'],
  ['melgar-edition', 'Melgar Edition', 'Una pieza exclusiva de este viaje.', 100, 'epic', 'melgar'],
  ['memories-forever', 'Memories Forever', 'Un acabado especial para guardar por siempre.', 120, 'epic', 'memories'],
  ['nexora-exclusive', 'Nexora Exclusive', 'La edición más rara del mercado.', 200, 'legendary', 'exclusive'],
].map(([slug, name, description, price, rarity, preview_style]) => ({ slug, name, description, price, rarity, preview_style, active: true }));

const ui = {
  wallet: document.querySelector('#coinBalance'),
  auth: document.querySelector('#marketAuth'),
  authForm: document.querySelector('#marketAuthForm'),
  email: document.querySelector('#marketEmail'),
  password: document.querySelector('#marketPassword'),
  status: document.querySelector('#marketStatus'),
  connection: document.querySelector('#marketConnection'),
  signout: document.querySelector('#marketSignout'),
  catalog: document.querySelector('#marketCatalog'),
  inventory: document.querySelector('#marketInventory'),
  history: document.querySelector('#marketHistory'),
  equipped: document.querySelector('#equippedLabel'),
  admin: document.querySelector('#marketAdmin'),
  adminCatalog: document.querySelector('#marketAdminCatalog'),
  adminUsers: document.querySelector('#marketAdminUser'),
  adminInventory: document.querySelector('#marketAdminInventory'),
  itemForm: document.querySelector('#marketItemForm'),
  reveal: document.querySelector('#marketReveal'),
  merchantCard: document.querySelector('#merchantCard'),
  merchantImage: document.querySelector('#merchantImage'),
  merchantPlaceholder: document.querySelector('#merchantPlaceholder'),
  dialogue: document.querySelector('#merchantDialogue'),
};

const sellerLines = {
  entrance: ['Vaya, vaya... tenemos un nuevo visitante.', 'Piezas únicas para historias que merecen quedarse.', 'Pasa. Siempre hay algo especial esperando.'],
  purchase: ['Una excelente elección. Cuida bien esa pieza.', 'Ya es tuya. Estoy seguro de que encontrará su lugar.', 'Una pieza digna de tu colección.'],
  broke: ['Me temo que tu bolsillo todavía no está preparado.', 'Vuelve cuando tengas unas monedas más.', 'Las buenas piezas saben esperar.'],
  special: ['Esto no se encuentra todos los días...', 'Una pieza extraordinaria para alguien especial.', 'Has elegido una rareza. Cuídala bien.'],
};

let session = readSession();
let profile = null;
let catalog = [];
let inventory = [];
let transactions = [];
let equippedItem = null;
let users = [];
let revealTimer;

export function initMarket() {
  if (!ui.catalog) return;
  renderCatalog(starterCatalog);
  setMerchantMood('idle');
  say('entrance');
  ui.authForm?.addEventListener('submit', handleAuth);
  ui.signout?.addEventListener('click', signOut);
  ui.catalog.addEventListener('click', handleCatalogAction);
  ui.inventory.addEventListener('click', handleInventoryAction);
  ui.itemForm?.addEventListener('submit', createItem);
  ui.adminCatalog?.addEventListener('click', handleAdminAction);
  ui.adminUsers?.addEventListener('change', loadAdminInventory);
  document.querySelector('#marketGrantCoins')?.addEventListener('click', adjustCoins);
  ui.reveal?.addEventListener('click', (event) => { if (event.target.closest('[data-market-reveal-close]')) closeReveal(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeReveal(); });

  window.nexoraMarketUserId = () => session?.user?.id || null;
  window.nexoraMarketFrameClass = (memory) => {
    if (!session?.user?.id || memory?.ownerUserId !== session.user.id || !equippedItem) return '';
    return `market-personal-frame market-personal-frame--${safeStyle(equippedItem.preview_style)}`;
  };
  window.addEventListener('nexora:market-updated', () => window.dispatchEvent(new Event('nexora:render-gallery')));

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    setStatus('Falta configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.', true);
    ui.connection.textContent = 'CONFIGURACIÓN PENDIENTE';
    return;
  }
  loadMarket().catch((error) => showConnectionError(error));
  window.setInterval(() => { if (session) refreshAccount().catch(() => {}); }, 30000);
}

async function api(path, options = {}) {
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${session?.access_token || SUPABASE_KEY}`,
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.prefer ? { Prefer: options.prefer } : {}),
    ...options.headers,
  };
  const response = await fetch(`${SUPABASE_URL}${path}`, { ...options, headers });
  const raw = await response.text();
  let data;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }
  if (!response.ok) throw new Error(data?.message || data?.msg || data?.error_description || `Supabase respondió ${response.status}`);
  return data;
}

async function loadMarket() {
  ui.connection.textContent = 'CONECTANDO…';
  try {
    catalog = await api('/rest/v1/store_items?select=id,slug,name,description,price,rarity,active,preview_style&order=price.asc');
    renderCatalog(catalog || []);
    ui.connection.textContent = 'MERCADO EN LÍNEA';
  } catch (error) {
    ui.connection.textContent = 'MIGRACIÓN PENDIENTE';
    setStatus(`No se pudo leer el catálogo: ${error.message}. Aplica la migración SQL del proyecto.`, true);
    renderCatalog([]);
  }
  if (session) {
    try { await refreshAccount(); }
    catch { clearSession(); setStatus('La sesión expiró. Inicia sesión de nuevo.'); }
  } else {
    renderAccount();
  }
}

async function handleAuth(event) {
  event.preventDefault();
  if (!SUPABASE_URL || !SUPABASE_KEY) return;
  const mode = event.submitter?.dataset.marketAuth || 'login';
  const email = ui.email.value.trim();
  const password = ui.password.value;
  setStatus(mode === 'signup' ? 'Creando tu cuenta…' : 'Iniciando sesión…');
  try {
    const result = mode === 'signup'
      ? await api('/auth/v1/signup', { method: 'POST', body: JSON.stringify({ email, password }) })
      : await api('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email, password }) });
    if (!result?.access_token) {
      setStatus('Cuenta creada. Confirma tu correo y luego inicia sesión.');
      return;
    }
    session = { access_token: result.access_token, refresh_token: result.refresh_token, user: result.user };
    saveSession();
    await refreshAccount();
    say('entrance');
    setStatus('Sesión iniciada. Bienvenido al mercado.');
  } catch (error) { setStatus(authMessage(error), true); }
}

async function refreshAccount() {
  const id = session?.user?.id;
  if (!id) return;
  const params = encodeURIComponent(id);
  const [profiles, owned, equipped, ledger] = await Promise.all([
    api(`/rest/v1/profiles?select=user_id,email,coin_balance,is_admin&user_id=eq.${params}`),
    api(`/rest/v1/user_inventory?select=id,item_id,purchased_at,store_items(id,slug,name,description,price,rarity,preview_style)&user_id=eq.${params}&order=purchased_at.desc`),
    api(`/rest/v1/equipped_items?select=item_id,store_items(id,slug,name,description,price,rarity,preview_style)&user_id=eq.${params}`),
    api(`/rest/v1/coin_transactions?select=id,delta,reason,created_at&user_id=eq.${params}&order=created_at.desc&limit=30`),
  ]);
  profile = profiles?.[0] || null;
  inventory = owned || [];
  equippedItem = equipped?.[0]?.store_items || null;
  transactions = ledger || [];
  if (profile?.is_admin) users = await api('/rest/v1/profiles?select=user_id,email,coin_balance&order=email.asc');
  renderAccount();
  if (catalog.length) renderCatalog(catalog);
  window.dispatchEvent(new Event('nexora:market-updated'));
}

function renderAccount() {
  const signedIn = Boolean(session?.user?.id && profile);
  ui.auth?.classList.toggle('hidden', signedIn);
  ui.signout?.classList.toggle('hidden', !session);
  if (ui.wallet) ui.wallet.textContent = signedIn ? `${formatNumber(profile.coin_balance)} NC` : 'Inicia sesión';
  ui.inventory.innerHTML = signedIn && inventory.length
    ? inventory.map((entry) => renderInventoryItem(entry.store_items, entry.item_id)).join('')
    : '<p class="market-empty">Inicia sesión para consultar o crear tu colección personal.</p>';
  ui.equipped.textContent = equippedItem ? `Equipado · ${escapeHtml(equippedItem.name)}` : 'Sin marco equipado';
  ui.history.innerHTML = transactions.length
    ? transactions.map((entry) => `<div class="market-transaction"><span>${escapeHtml(entry.reason)}<small>${formatDate(entry.created_at)}</small></span><strong class="${entry.delta < 0 ? 'is-debit' : 'is-credit'}">${entry.delta > 0 ? '+' : ''}${formatNumber(entry.delta)} NC</strong></div>`).join('')
    : '<p class="market-empty">Tu historial de monedas aparecerá aquí.</p>';
  ui.admin?.classList.toggle('hidden', !profile?.is_admin);
  if (profile?.is_admin) renderAdmin();
  else setOwnedAndRefreshCatalog();
}

function renderCatalog(items) {
  catalog = items || [];
  const fallback = !SUPABASE_URL || !SUPABASE_KEY;
  if (!catalog.length) {
    ui.catalog.innerHTML = `<div class="market-empty">${fallback ? 'Configura Supabase para activar el mercado.' : 'El catálogo está vacío. Aplica la migración de Nexora Market.'}</div>`;
    return;
  }
  ui.catalog.innerHTML = catalog.filter((item) => item.active || profile?.is_admin).map((item) => {
    const isOwned = inventory.some((entry) => entry.item_id === item.id);
    const rarity = safeStyle(item.rarity || 'common');
    return `<article class="market-item market-rarity--${rarity}" data-item-card="${escapeHtml(item.id || item.slug)}">
      <div class="market-item__art"><span class="market-rarity">${escapeHtml(item.rarity || 'common')}</span><div class="market-frame-preview market-frame-preview--${safeStyle(item.preview_style)}"><span>NEXORA</span><strong>RECUERDO</strong><small>MELGAR · 2026</small></div></div>
      <div class="market-item__body"><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.description || '')}</p><div class="market-item__buy"><strong class="market-price"><span class="coin-icon coin-icon--small">N</span>${formatNumber(item.price)} <small>NC</small></strong><button class="button" type="button" data-market-buy="${escapeHtml(item.id || '')}" ${!session || !profile || isOwned || fallback || !item.id ? 'disabled' : ''}>${isOwned ? 'En tu inventario' : session ? 'Adquirir pieza' : 'Inicia sesión'}</button></div></div>
    </article>`;
  }).join('');
}

function renderInventoryItem(item, itemId) {
  if (!item) return '';
  const isEquipped = equippedItem?.id === itemId;
  return `<article class="inventory-item"><div class="market-frame-preview market-frame-preview--${safeStyle(item.preview_style)}"><span>NEXORA</span><strong>RECUERDO</strong><small>MELGAR · 2026</small></div><div><strong>${escapeHtml(item.name)}</strong><small>${isEquipped ? 'Equipado' : 'En tu colección'}</small><button class="button-ghost" type="button" data-market-equip="${escapeHtml(itemId)}">${isEquipped ? 'Desequipar' : 'Equipar'}</button></div></article>`;
}

async function handleCatalogAction(event) {
  const button = event.target.closest('[data-market-buy]');
  if (!button || button.disabled) return;
  const item = catalog.find((entry) => entry.id === button.dataset.marketBuy);
  if (!item) return;
  const original = button.textContent;
  button.disabled = true; button.textContent = 'Procesando…';
  try {
    const result = await api('/rest/v1/rpc/nexora_buy_item', { method: 'POST', body: JSON.stringify({ p_item_id: item.id }) });
    await refreshAccount();
    button.closest('.market-item')?.classList.add('market-item--purchased');
    setMerchantMood('buy');
    window.setTimeout(() => setMerchantMood(item.rarity === 'legendary' ? 'special' : 'happy'), 1100);
    say(item.rarity === 'legendary' ? 'special' : 'purchase');
    revealPurchase(item, result?.balance ?? profile?.coin_balance);
  } catch (error) {
    button.textContent = original; button.disabled = false;
    if (/INSUFFICIENT_COINS|22003/i.test(error.message)) say('broke');
    else say('purchaseError');
    setMerchantMood('idle');
    setStatus(authMessage(error), true);
  }
}

async function handleInventoryAction(event) {
  const button = event.target.closest('[data-market-equip]');
  if (!button || button.disabled) return;
  const itemId = button.dataset.marketEquip;
  const next = equippedItem?.id === itemId ? null : itemId;
  button.disabled = true;
  try {
    await api('/rest/v1/rpc/nexora_equip_item', { method: 'POST', body: JSON.stringify({ p_item_id: next }) });
    await refreshAccount();
  } catch (error) { setStatus(`No se pudo equipar: ${error.message}`, true); button.disabled = false; }
}

function revealPurchase(item, balance) {
  document.querySelector('#revealItemName').textContent = item.name;
  document.querySelector('#revealCost').textContent = `−${formatNumber(item.price)} NC · Saldo disponible: ${formatNumber(balance)} NC`;
  document.querySelector('#revealFrame').className = `market-frame-preview market-frame-preview--${safeStyle(item.preview_style)}`;
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
  const lines = sellerLines[kind] || ['Una conexión delicada ha interrumpido el trato. Inténtalo de nuevo.'];
  if (ui.dialogue) ui.dialogue.textContent = `«${lines[Math.floor(Math.random() * lines.length)]}»`;
  if (kind === 'purchaseError') setMerchantMood('idle');
}

async function createItem(event) {
  event.preventDefault();
  if (!profile?.is_admin) return;
  const item = {
    slug: slugify(document.querySelector('#marketItemName').value),
    name: document.querySelector('#marketItemName').value.trim(),
    description: document.querySelector('#marketItemDescription').value.trim(),
    price: Number(document.querySelector('#marketItemPrice').value),
    rarity: document.querySelector('#marketItemRarity').value,
    preview_style: slugify(document.querySelector('#marketItemName').value), active: true,
  };
  try {
    await api('/rest/v1/store_items', { method: 'POST', body: JSON.stringify(item), prefer: 'return=representation' });
    event.target.reset(); await loadMarket(); setStatus('Artículo creado.');
  } catch (error) { setStatus(`No se pudo crear: ${error.message}`, true); }
}

async function handleAdminAction(event) {
  const button = event.target.closest('[data-admin-save]');
  if (!button || !profile?.is_admin) return;
  const card = button.closest('[data-admin-item]');
  const id = card.dataset.adminItem;
  const patch = {
    price: Number(card.querySelector('[data-admin-price]').value),
    active: card.querySelector('[data-admin-active]').checked,
    updated_at: new Date().toISOString(),
  };
  try { await api(`/rest/v1/store_items?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch), prefer: 'return=minimal' }); await loadMarket(); setStatus('Artículo actualizado.'); }
  catch (error) { setStatus(`No se pudo guardar: ${error.message}`, true); }
}

function renderAdmin() {
  if (!profile?.is_admin) return;
  ui.adminCatalog.innerHTML = catalog.map((item) => `<div class="market-admin-row" data-admin-item="${escapeHtml(item.id)}"><strong>${escapeHtml(item.name)}</strong><input class="form-input" data-admin-price type="number" min="0" value="${Number(item.price)}" aria-label="Precio NC"/><label><input data-admin-active type="checkbox" ${item.active ? 'checked' : ''}/> Activo</label><button class="button-ghost" data-admin-save type="button">Guardar</button></div>`).join('');
  ui.adminUsers.innerHTML = users.map((user) => `<option value="${escapeHtml(user.user_id)}">${escapeHtml(user.email)} · ${formatNumber(user.coin_balance)} NC</option>`).join('');
}

async function adjustCoins() {
  if (!profile?.is_admin) return;
  const userId = ui.adminUsers.value;
  const delta = Number(document.querySelector('#marketCoinDelta').value);
  const reason = document.querySelector('#marketCoinReason').value.trim();
  if (!userId || !Number.isInteger(delta) || delta === 0 || !reason) { setStatus('Indica participante, ajuste entero y motivo.', true); return; }
  try {
    await api('/rest/v1/rpc/nexora_admin_adjust_coins', { method: 'POST', body: JSON.stringify({ p_user_id: userId, p_delta: delta, p_reason: reason }) });
    await loadMarket(); setStatus('Ajuste registrado en el historial.');
  } catch (error) { setStatus(`No se registró el ajuste: ${error.message}`, true); }
}

async function signOut() {
  try { if (session?.access_token) await api('/auth/v1/logout', { method: 'POST' }); } catch { /* local session is cleared even if the network is unavailable */ }
  clearSession(); profile = null; inventory = []; transactions = []; equippedItem = null; users = [];
  renderAccount(); renderCatalog(catalog); setStatus('Sesión cerrada.');
  window.dispatchEvent(new Event('nexora:market-updated'));
}

function clearSession() { session = null; localStorage.removeItem(SESSION_KEY); }
function readSession() { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; } }
function saveSession() { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); }
function setOwnedAndRefreshCatalog() { if (catalog.length) renderCatalog(catalog); }
function setStatus(message, isError = false) { if (!ui.status) return; ui.status.textContent = message; ui.status.classList.toggle('is-error', isError); }
function showConnectionError(error) { ui.connection.textContent = 'SIN CONEXIÓN'; setStatus(`No se pudo conectar con Supabase: ${error.message}`, true); }
function authMessage(error) { return /INSUFFICIENT_COINS|22003/i.test(error.message) ? 'Me temo que tu bolsillo todavía no está preparado.' : error.message; }
function safeStyle(value = '') { return String(value).toLowerCase().replace(/[^a-z0-9-]/g, '') || 'basic'; }
function slugify(value = '') { return String(value).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `pieza-${Date.now()}`; }
function formatNumber(value) { return new Intl.NumberFormat('es-CO').format(Number(value) || 0); }
function formatDate(value) { return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Bogota' }).format(new Date(value)); }
function escapeHtml(value = '') { return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }

