import './styles.css';

const STORAGE_KEY = 'nexora-melgar-album-v1';
const ACCESS_KEY = 'nexora-private-access';
const ACCESS_CODE = import.meta.env.VITE_PRIVATE_ACCESS_CODE || 'MELGAR2026';
const TRIP_START = '2026-11-20T00:00:00-05:00';
const TAG_REWARDS = { piscina: 15, amigos: 10, melgar: 10, comida: 5, habitacion: 5, momentazo: 10, diversion: 10, grupo: 10, selfie: 5, nexora: 10 };
const RANKS = ['Rookie', 'Explorer', 'Adventurer', 'Photographer', 'Elite Traveler', 'Nexora Legend'];
const STORE_ITEMS = [
  { id: 'crimson', name: 'Crimson Frame', price: 100, style: 'crimson' }, { id: 'gold', name: 'Luxury Gold', price: 150, style: 'gold' },
  { id: 'neon', name: 'Neon Red', price: 200, style: 'neon' }, { id: 'glass', name: 'Glass Premium', price: 250, style: 'glass' },
  { id: 'melgar', name: 'Melgar Edition', price: 300, style: 'melgar' }, { id: 'memories', name: 'Memories Forever', price: 400, style: 'memories' },
  { id: 'exclusive', name: 'Nexora Exclusive · LIMITED EDITION', price: 500, style: 'exclusive' },
];

const defaultState = {
  trip: {
    title: 'MELGAR',
    tagline: 'Un viaje, una historia y recuerdos que permanecerán.',
    location: 'Club de la Policía, Melgar, Colombia',
    dateLabel: '20 de noviembre de 2026',
    startAt: TRIP_START,
    endAt: '',
  },
  participants: [
    {
      id: 'p1',
      name: 'Nicolás',
      role: 'Owner · Diseño & producto',
      description: 'Responsable de la identidad visual, diseño y experiencia digital del proyecto.',
    },
    {
      id: 'p2',
      name: 'Sausalitoz Z9',
      role: 'Crew',
      description: 'Acompañando cada rincón del viaje con energía y buena vibra.',
    },
    {
      id: 'p3',
      name: 'Nexora Studio',
      role: 'Creatividad',
      description: 'Capturando detalles, luces y momentos del recorrido.',
    },
  ],
  memories: [],
  activities: [
    { id: 'a1', title: 'Llegada al club', date: '12 Nov', description: 'Recibimos la bienvenida con un primer paseo por el lugar y la puesta en escena del viaje.' },
    { id: 'a2', title: 'Atardecer y fotos', date: '13 Nov', description: 'El grupo se fue a los mejores puntos para capturar la luz y las risas.' },
    { id: 'a3', title: 'Noche de fuego y música', date: '15 Nov', description: 'Velada con música, conversaciones largas y recuerdos inolvidables.' },
  ],
  messages: [
    { id: 'mssg1', author: 'Nicolás', text: 'La mejor parte no fue el destino, sino la gente que lo hizo especial.' },
    { id: 'mssg2', author: 'Sausalitoz Z9', text: 'Cada momento aquí se siente como una historia que merece ser guardada para siempre.' },
  ],
  donations: {
    goal: 2500000,
    raised: 1825000,
    count: 18,
    methods: ['Nequi', 'Daviplata', 'Transferencia bancaria', 'Otro'],
    note: 'Las donaciones son voluntarias y se usan para la logística, alimentación y organización del viaje.',
  },
  game: {
    activeParticipant: 'p1', profiles: {}, history: [],
    missions: [
      { id: 'first-memory', title: 'El primer recuerdo', description: 'Publica tu primera fotografía aprobada.', reward: 25, xp: 30, goal: 1, kind: 'photos', unique: true },
      { id: 'melgar-explorer', title: 'Explorador de Melgar', description: 'Comparte tres fotos aprobadas con #Melgar.', reward: 50, xp: 60, goal: 3, kind: 'melgar', unique: true },
      { id: 'photographer', title: 'Fotógrafo oficial', description: 'Consigue cinco fotografías aprobadas.', reward: 75, xp: 80, goal: 5, kind: 'photos', unique: true },
      { id: 'daily-pool', title: 'Día de piscina', description: 'Comparte un recuerdo con #Piscina.', reward: 35, xp: 40, goal: 1, kind: 'piscina', daily: true },
      { id: 'secret', title: '??? Misión desconocida', description: 'Un secreto espera en tus recuerdos.', reward: 100, xp: 120, goal: 1, kind: 'secret', unique: true, secret: true },
    ],
  },
};

const state = loadState();

const app = {
  accessModal: document.querySelector('#accessModal'),
  accessForm: document.querySelector('#accessForm'),
  accessInput: document.querySelector('#accessInput'),
  siteShell: document.querySelector('#siteShell'),
  tripTitle: document.querySelector('#tripTitle'),
  tripTagline: document.querySelector('#tripTagline'),
  tripLocation: document.querySelector('#tripLocation'),
  tripDate: document.querySelector('#tripDate'),
  galleryGrid: document.querySelector('#galleryGrid'),
  participantsList: document.querySelector('#participantsList'),
  activityList: document.querySelector('#activityList'),
  timelineList: document.querySelector('#timelineList'),
  messagesList: document.querySelector('#messagesList'),
  messageForm: document.querySelector('#messageForm'),
  messageInput: document.querySelector('#messageInput'),
  uploadForm: document.querySelector('#uploadForm'),
  fileInput: document.querySelector('#fileInput'),
  participantForm: document.querySelector('#participantForm'),
  participantName: document.querySelector('#participantName'),
  participantRole: document.querySelector('#participantRole'),
  donationGoal: document.querySelector('#donationGoal'),
  donationRaised: document.querySelector('#donationRaised'),
  donationProgress: document.querySelector('#donationProgress'),
  donationCount: document.querySelector('#donationCount'),
  donationSettingsForm: document.querySelector('#donationSettingsForm'),
  donationGoalInput: document.querySelector('#donationGoalInput'),
  donationRaisedInput: document.querySelector('#donationRaisedInput'),
  donationMethodsInput: document.querySelector('#donationMethodsInput'),
  donationNoteInput: document.querySelector('#donationNoteInput'),
  viewerModal: document.querySelector('#viewerModal'),
  viewerContent: document.querySelector('#viewerContent'),
  viewerClose: document.querySelector('#viewerClose'),
  tripCounter: document.querySelector('#tripCounter'),
  counterTitle: document.querySelector('#counterTitle'),
  counterEyebrow: document.querySelector('#counterEyebrow'),
  counterNote: document.querySelector('#counterNote'),
  activeParticipant: document.querySelector('#activeParticipant'),
  memoryParticipant: document.querySelector('#memoryParticipant'),
  memoryCaption: document.querySelector('#memoryCaption'),
  memoryHashtags: document.querySelector('#memoryHashtags'),
  playerProfile: document.querySelector('#playerProfile'),
  questList: document.querySelector('#questList'),
  pointHistory: document.querySelector('#pointHistory'),
  storeGrid: document.querySelector('#storeGrid'),
  leaderboardList: document.querySelector('#leaderboardList'),
  tripSettingsForm: document.querySelector('#tripSettingsForm'),
  tripEndAt: document.querySelector('#tripEndAt'),
};

initialize();

function initialize() {
  bindEvents();
  renderHero();
  renderParticipants();
  renderGallery();
  renderActivities();
  renderTimeline();
  renderMessages();
  renderDonations();
  renderGame();
  updateTripCounter();
  window.setInterval(updateTripCounter, 1000);
  updateAccessState();
}

function updateAccessState() {
  const hasAccess = localStorage.getItem(ACCESS_KEY) === 'granted';

  if (app.accessModal) {
    app.accessModal.classList.toggle('hidden', hasAccess);
  }

  if (app.siteShell) {
    app.siteShell.classList.toggle('hidden', !hasAccess);
  }
}

function bindEvents() {
  if (app.accessForm) {
    app.accessForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const entered = (app.accessInput?.value || '').trim();
      if (entered === ACCESS_CODE) {
        localStorage.setItem(ACCESS_KEY, 'granted');
        updateAccessState();
        return;
      }

      app.accessInput.value = '';
      app.accessInput.placeholder = 'Código incorrecto';
      app.accessInput.classList.add('is-invalid');
    });
  }

  document.querySelectorAll('[data-scroll]').forEach((button) => {
    button.addEventListener('click', () => {
      const target = document.getElementById(button.dataset.scroll);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  if (app.messageForm) {
    app.messageForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const text = app.messageInput.value.trim();
      if (!text) return;

      state.messages.unshift({
        id: `msg-${Date.now()}`,
        author: 'Nexora Studio',
        text,
      });

      persistState();
      renderMessages();
      app.messageForm.reset();
    });
  }

  if (app.participantForm) {
    app.participantForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const name = app.participantName.value.trim();
      const role = app.participantRole.value.trim() || 'Amigo';

      if (!name) return;

      state.participants.push({
        id: `p-${Date.now()}`,
        name,
        role,
        description: 'Nuevo integrante del viaje. Aún faltan sus recuerdos por compartir.',
      });

      persistState();
      renderParticipants();
      renderGame();
      app.participantForm.reset();
    });
  }

  if (app.uploadForm) {
    app.uploadForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const files = Array.from(app.fileInput.files || []);
      if (!files.length) return;

      const caption = app.memoryCaption?.value.trim() || 'Recuerdo del viaje';
      const tags = normalizeTags(app.memoryHashtags?.value || '');
      const participantId = app.memoryParticipant?.value || state.game.activeParticipant;

      const uploads = await Promise.all(
        files.map(async (file, index) => {
          const src = await readFileAsDataUrl(file);
          return {
            id: `upload-${Date.now()}-${index}`,
            uploader: state.participants.find((person) => person.id === participantId)?.name || 'Participante',
            participantId,
            type: file.type.startsWith('video/') ? 'video' : 'image',
            caption,
            tags,
            approved: false,
            src,
            uploadedAt: new Date().toISOString(),
            size: ['large', 'small', 'medium'][index % 3],
          };
        })
      );

      const existingSources = new Set(state.memories.map((memory) => memory.src));
      const uniqueUploads = uploads.filter((memory) => {
        if (existingSources.has(memory.src)) return false;
        existingSources.add(memory.src);
        return true;
      });
      if (!uniqueUploads.length) {
        window.alert('Estas fotografías ya están en el álbum. No se otorgaron puntos.');
        return;
      }

      state.memories = [...uniqueUploads, ...state.memories];
      persistState();
      renderGallery();
      renderTimeline();
      renderGame();
      app.uploadForm.reset();
    });
  }

  if (app.donationSettingsForm) {
    app.donationSettingsForm.addEventListener('submit', (event) => {
      event.preventDefault();
      state.donations.goal = Number(app.donationGoalInput.value || state.donations.goal);
      state.donations.raised = Number(app.donationRaisedInput.value || state.donations.raised);
      state.donations.methods = (app.donationMethodsInput.value || '').split(',').map((item) => item.trim()).filter(Boolean) || state.donations.methods;
      state.donations.note = app.donationNoteInput.value.trim() || state.donations.note;
      persistState();
      renderDonations();
    });
  }

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-game-action]')) return;
    const card = event.target.closest('[data-memory-id]');
    if (!card) return;
    const memory = state.memories.find((item) => item.id === card.dataset.memoryId);
    if (memory) openViewer(memory);
  });

  document.querySelectorAll('[data-close-modal]').forEach((button) => {
    button.addEventListener('click', () => closeViewer());
  });

  if (app.viewerModal) {
    app.viewerModal.addEventListener('click', (event) => {
      if (event.target === app.viewerModal) closeViewer();
    });
  }

  app.activeParticipant?.addEventListener('change', () => {
    state.game.activeParticipant = app.activeParticipant.value;
    persistState();
    renderGame();
  });
  app.tripSettingsForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = app.tripEndAt.value;
    state.trip.endAt = value ? `${value}:00-05:00` : '';
    persistState(); updateTripCounter();
  });

  document.addEventListener('click', (event) => {
    const action = event.target.closest('[data-game-action]');
    if (!action) return;
    const id = action.dataset.id;
    if (action.dataset.gameAction === 'approve') approveMemory(id);
    if (action.dataset.gameAction === 'buy') buyFrame(id);
    if (action.dataset.gameAction === 'equip') equipFrame(id);
    if (action.dataset.gameAction === 'claim') claimMission(id);
  });
}

function updateTripCounter() {
  if (!app.tripCounter) return;
  const now = Date.now();
  const start = new Date(state.trip.startAt || TRIP_START).getTime();
  const end = state.trip.endAt ? new Date(state.trip.endAt).getTime() : null;
  let target; let heading; let label;
  if (end && now >= end) {
    app.counterEyebrow.textContent = 'MODO RECUERDOS';
    app.counterTitle.textContent = 'GRACIAS POR HACER PARTE DE ESTA HISTORIA.';
    target = start; heading = 'duración total'; label = 'DÍAS TRANSCURRIDOS';
    app.counterNote.textContent = `El viaje duró ${formatDuration(Math.max(0, end - start))}. Modo de recuerdos activado.`;
  } else if (now >= start) {
    app.counterEyebrow.textContent = 'MELGAR';
    app.counterTitle.textContent = '¡ESTAMOS EN MELGAR!';
    target = start; heading = 'desde el inicio'; label = 'DÍAS';
    app.counterNote.textContent = 'Hora oficial de Colombia · America/Bogota';
  } else {
    app.counterEyebrow.textContent = 'CUENTA REGRESIVA';
    app.counterTitle.textContent = 'EL VIAJE COMIENZA EN...';
    target = start; heading = 'restantes'; label = 'DÍAS';
    app.counterNote.textContent = 'Hora oficial de Colombia · America/Bogota';
  }
  const distance = end && now >= end ? Math.max(0, end - start) : Math.max(0, Math.abs(target - now));
  const seconds = Math.floor(distance / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  app.tripCounter.innerHTML = [
    [days, label], [hours, 'HORAS'], [minutes, 'MINUTOS'], [secs, 'SEGUNDOS'],
  ].map(([value, unit]) => `<div class="counter-unit"><strong>${String(value).padStart(2, '0')}</strong><span>${unit}</span></div>`).join('');
  app.tripCounter.dataset.phase = end && now >= end ? 'ended' : now >= start ? 'started' : 'upcoming';
}

function formatDuration(ms) {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 86400)} días, ${Math.floor(total % 86400 / 3600)} horas, ${Math.floor(total % 3600 / 60)} minutos y ${total % 60} segundos`;
}

function normalizeTags(value) {
  return [...new Set((value.match(/#[\p{L}\d_]+/gu) || []).map((tag) => tag.slice(1).toLowerCase()))];
}

function getProfile(id) {
  const empty = { points: 0, xp: 0, inventory: [], equipped: '', claimed: [], badges: [] };
  state.game.profiles[id] = { ...empty, ...(state.game.profiles[id] || {}) };
  return state.game.profiles[id];
}

function renderGame() {
  if (!app.playerProfile) return;
  const active = state.participants.some((person) => person.id === state.game.activeParticipant) ? state.game.activeParticipant : state.participants[0]?.id;
  state.game.activeParticipant = active;
  const participant = state.participants.find((person) => person.id === active);
  if (app.tripEndAt && document.activeElement !== app.tripEndAt) app.tripEndAt.value = state.trip.endAt ? colombiaInputValue(state.trip.endAt) : '';
  const profile = getProfile(active);
  const photos = state.memories.filter((memory) => memory.participantId === active && memory.approved);
  const xpStep = 100;
  const level = Math.min(RANKS.length, Math.floor(profile.xp / xpStep) + 1);
  const progress = Math.min(100, profile.xp % xpStep);
  const options = state.participants.map((person) => `<option value="${escapeHtml(person.id)}">${escapeHtml(person.name)}</option>`).join('');
  [app.activeParticipant, app.memoryParticipant].forEach((select) => { if (select) { select.innerHTML = options; select.value = select === app.activeParticipant ? active : (select.value || active); } });
  const ownedFrames = profile.inventory.map((id) => STORE_ITEMS.find((item) => item.id === id)?.name).filter(Boolean);
  app.playerProfile.innerHTML = `<div class="profile-avatar">${escapeHtml(getInitials(participant?.name))}</div><div class="profile-main"><span class="eyebrow">NEXORA RANK ${level}</span><h3>${escapeHtml(RANKS[level - 1])} · ${escapeHtml(participant?.name || 'Participante')}</h3><div class="xp-track"><span style="width:${progress}%"></span></div><small>${profile.xp} XP · ${xpStep - profile.xp % xpStep} XP para el siguiente nivel</small><div class="inventory-items">${ownedFrames.length ? ownedFrames.map((name) => `<span>${escapeHtml(name)}</span>`).join('') : '<span>Tu inventario de marcos está vacío</span>'}</div><div class="inventory-items">${profile.badges.length ? profile.badges.map((badge) => `<span>✦ ${escapeHtml(badge)}</span>`).join('') : '<span>Insignias por desbloquear</span>'}</div></div><div class="profile-stats"><strong>${profile.points} NP</strong><span>${photos.length} fotos aprobadas · ${profile.inventory.length} marcos</span><span>${profile.claimed.length} misiones · ${profile.badges.length} insignias</span></div>`;
  app.questList.innerHTML = state.game.missions.map((mission) => {
    const claimKey = mission.daily ? `${mission.id}:${localDay()}` : mission.id;
    const claimed = profile.claimed.includes(claimKey);
    const matching = photos.filter((photo) => mission.kind === 'photos' || (mission.kind === 'melgar' && photo.tags?.includes('melgar')) || (mission.kind === 'piscina' && photo.tags?.includes('piscina'))).length;
    const progressCount = mission.kind === 'secret' ? photos.filter((photo) => photo.tags?.includes('nexora')).length : Math.min(matching, mission.goal);
    const ready = progressCount >= mission.goal && !claimed;
    const title = mission.secret && !claimed ? '??? Misión desconocida' : mission.title;
    return `<article class="quest-card"><div><span class="eyebrow">${mission.daily ? 'DIARIA' : 'ESPECIAL'} · ${mission.reward} NP</span><h4>${escapeHtml(title)}</h4><p>${escapeHtml(mission.secret && !claimed ? 'Descubre cómo revelar este reto.' : mission.description)}</p><div class="quest-progress"><span style="width:${Math.round(progressCount / mission.goal * 100)}%"></span></div><small>${progressCount}/${mission.goal} · ${mission.xp} XP</small></div><button class="button ${ready ? '' : 'button-ghost'}" data-game-action="claim" data-id="${escapeHtml(mission.id)}" ${ready ? '' : 'disabled'}>${claimed ? 'Completada' : 'Reclamar'}</button></article>`;
  }).join('');
  app.storeGrid.innerHTML = STORE_ITEMS.map((item) => {
    const owned = profile.inventory.includes(item.id);
    const equipped = profile.equipped === item.id;
    return `<article class="store-card"><div class="frame-preview frame-${item.style}"><span>NEXORA</span><strong>RECUERDO</strong><small>MELGAR · 2026</small></div><span class="eyebrow">${item.style === 'exclusive' ? 'LIMITED EDITION' : 'MARCOS PARA FOTOGRAFÍAS'}</span><h3>${escapeHtml(item.name)}</h3><p>${item.price} NP</p><button class="button" data-game-action="${owned ? 'equip' : 'buy'}" data-id="${item.id}">${equipped ? 'Equipado' : owned ? 'Equipar marco' : 'Desbloquear'}</button></article>`;
  }).join('');
  const ranked = [...state.participants].sort((a, b) => (getProfile(b.id).points - getProfile(a.id).points));
  app.leaderboardList.innerHTML = ranked.map((person, index) => `<div class="leader-row"><strong class="leader-rank">${String(index + 1).padStart(2, '0')}</strong><span class="participant-card__avatar">${escapeHtml(getInitials(person.name))}</span><strong>${escapeHtml(person.name)}</strong><span>${RANKS[Math.min(RANKS.length - 1, Math.floor(getProfile(person.id).xp / xpStep))]} · ${getProfile(person.id).points} NP</span></div>`).join('');
  const history = state.game.history.filter((item) => item.participantId === active).slice(0, 8);
  app.pointHistory.innerHTML = history.length ? history.map((item) => `<div class="history-row"><span>${escapeHtml(item.label)}</span><strong>+${item.points} NP</strong></div>`).join('') : '<p class="muted-copy">Tus movimientos aprobados aparecerán aquí.</p>';
}

function colombiaInputValue(iso) {
  const parts = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(iso));
  const get = (type) => parts.find((part) => part.type === type)?.value || '00';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

function localDay() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date()); }

function addPoints(participantId, amount, label, xp = amount) {
  const profile = getProfile(participantId);
  profile.points += amount; profile.xp += xp;
  state.game.history.unshift({ participantId, points: amount, label, createdAt: new Date().toISOString() });
}

function approveMemory(memoryId) {
  const memory = state.memories.find((item) => item.id === memoryId);
  if (!memory || memory.approved || memory.type !== 'image') return;
  memory.approved = true;
  const tagBonus = [...new Set(memory.tags || [])].reduce((sum, tag) => sum + (TAG_REWARDS[tag] || 0), 0);
  addPoints(memory.participantId || state.game.activeParticipant, 10 + tagBonus, `Foto aprobada · ${(memory.tags || []).map((tag) => `#${tag}`).join(' ') || 'sin hashtag'}`, 15);
  persistState(); renderGallery(); renderGame();
}

function buyFrame(id) {
  const item = STORE_ITEMS.find((entry) => entry.id === id); const profile = getProfile(state.game.activeParticipant);
  if (!item || profile.inventory.includes(id) || profile.points < item.price) return;
  profile.points -= item.price; profile.inventory.push(id);
  state.game.history.unshift({ participantId: state.game.activeParticipant, points: -item.price, label: `Compra · ${item.name}`, createdAt: new Date().toISOString() });
  persistState(); renderGame();
}

function equipFrame(id) {
  const profile = getProfile(state.game.activeParticipant);
  if (!profile.inventory.includes(id)) return;
  profile.equipped = profile.equipped === id ? '' : id; persistState(); renderGame(); renderGallery();
}

function claimMission(id) {
  const mission = state.game.missions.find((entry) => entry.id === id); const profile = getProfile(state.game.activeParticipant);
  const claimKey = mission?.daily ? `${mission.id}:${localDay()}` : id;
  if (!mission || profile.claimed.includes(claimKey)) return;
  const matching = state.memories.filter((photo) => photo.participantId === state.game.activeParticipant && photo.approved && (mission.kind === 'photos' || photo.tags?.includes(mission.kind))).length;
  if (mission.kind === 'secret' ? !state.memories.some((photo) => photo.participantId === state.game.activeParticipant && photo.approved && photo.tags?.includes('nexora')) : matching < mission.goal) return;
  profile.claimed.push(claimKey); addPoints(state.game.activeParticipant, mission.reward, `Misión · ${mission.title}`, mission.xp);
  profile.badges.push(mission.title); persistState(); renderGame();
}

function renderHero() {
  if (app.tripTitle) app.tripTitle.textContent = state.trip.title;
  if (app.tripTagline) app.tripTagline.textContent = state.trip.tagline;
  if (app.tripLocation) app.tripLocation.textContent = state.trip.location;
  if (app.tripDate) app.tripDate.textContent = state.trip.dateLabel;
}

function renderParticipants() {
  if (!app.participantsList) return;
  app.participantsList.innerHTML = state.participants
    .map(
      (participant) => {
        const image = isLocalMediaSource(participant.image)
          ? `<img src="${escapeHtml(participant.image)}" alt="${escapeHtml(participant.name)}" />`
          : `<span class="participant-card__avatar" aria-hidden="true">${escapeHtml(getInitials(participant.name))}</span>`;
        return `
        <article class="participant-card">
          <div class="participant-card__image-wrap">
            ${image}
          </div>
          <div class="participant-card__body">
            <span class="chip">${escapeHtml(participant.role)}</span>
            <h3>${escapeHtml(participant.name)}</h3>
            <p>${escapeHtml(participant.description)}</p>
            <strong>${countPhotosForUser(participant.name)} recuerdos</strong>
          </div>
        </article>
      `;
      }
    )
    .join('');
}

function renderGallery() {
  if (!app.galleryGrid) return;

  if (!state.memories.length) {
    app.galleryGrid.innerHTML = '<div class="empty-state">Aún no hay recuerdos compartidos. Sube el primero.</div>';
    return;
  }

  app.galleryGrid.innerHTML = state.memories
    .map(
      (memory) => `
        <article class="memory-card ${memory.size || ''} ${memory.approved === false ? 'memory-pending' : ''} ${frameClass(memory.participantId)}" data-memory-id="${escapeHtml(memory.id)}">
          <div class="memory-card__visual">
            ${memory.type === 'video'
              ? `<video src="${memory.src}" controls playsinline muted></video>`
              : `<img src="${memory.src}" alt="${escapeHtml(memory.caption)}" loading="lazy" />`}
          </div>
          <div class="memory-card__content">
            <div class="memory-card__meta">
              <span>${escapeHtml(memory.uploader)}</span>
              <span>${formatDate(memory.uploadedAt)}</span>
            </div>
            <p>${escapeHtml(memory.caption)}</p>
            <div class="memory-tags">${(memory.tags || []).map((tag) => `<span>#${escapeHtml(tag)}</span>`).join('')}</div>
            ${memory.approved === false ? `<div class="pending-review"><span>Pendiente de revisión</span><button type="button" class="button-ghost" data-game-action="approve" data-id="${escapeHtml(memory.id)}">Aprobar · otorgar NP</button></div>` : ''}
          </div>
        </article>
      `
    )
    .join('');
}

function renderActivities() {
  if (!app.activityList) return;
  app.activityList.innerHTML = state.activities
    .map(
      (activity) => `
        <article class="activity-card">
          <span class="activity-date">${escapeHtml(activity.date)}</span>
          <h3>${escapeHtml(activity.title)}</h3>
          <p>${escapeHtml(activity.description)}</p>
        </article>
      `
    )
    .join('');
}

function renderTimeline() {
  if (!app.timelineList) return;

  const sorted = [...state.memories].sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  app.timelineList.innerHTML = sorted
    .map(
      (memory) => `
        <div class="timeline-item">
          <span class="timeline-date">${formatDate(memory.uploadedAt)}</span>
          <div>
            <strong>${escapeHtml(memory.uploader)}</strong>
            <p>${escapeHtml(memory.caption)}</p>
          </div>
        </div>
      `
    )
    .join('');
}

function renderMessages() {
  if (!app.messagesList) return;
  app.messagesList.innerHTML = state.messages
    .map(
      (message) => `
        <article class="comment-card">
          <strong>${escapeHtml(message.author)}</strong>
          <p>${escapeHtml(message.text)}</p>
        </article>
      `
    )
    .join('');
}

function renderDonations() {
  if (!app.donationGoal || !app.donationRaised || !app.donationProgress || !app.donationCount) return;
  const goal = Number(state.donations.goal || 0);
  const raised = Number(state.donations.raised || 0);
  const progress = Math.min((raised / goal) * 100, 100);

  app.donationGoal.textContent = formatCurrency(goal);
  app.donationRaised.textContent = formatCurrency(raised);
  app.donationProgress.style.width = `${progress}%`;
  app.donationCount.textContent = `${state.donations.count} donaciones`;

  if (app.donationGoalInput) app.donationGoalInput.value = goal;
  if (app.donationRaisedInput) app.donationRaisedInput.value = raised;
  if (app.donationMethodsInput) app.donationMethodsInput.value = state.donations.methods.join(', ');
  if (app.donationNoteInput) app.donationNoteInput.value = state.donations.note;

  const methodsWrap = document.querySelector('#paymentMethods');
  if (methodsWrap) {
    methodsWrap.innerHTML = state.donations.methods.map((method) => `<li>${escapeHtml(method)}</li>`).join('');
  }
}

function openViewer(memory) {
  if (!app.viewerModal || !app.viewerContent) return;
  app.viewerModal.classList.remove('hidden');
  app.viewerContent.innerHTML = `
    ${memory.type === 'video'
      ? `<video class="viewer-media" src="${memory.src}" controls playsinline></video>`
      : `<img class="viewer-media" src="${memory.src}" alt="${escapeHtml(memory.caption)}" />`}
    <div class="viewer-meta">
      <div>
        <strong>${escapeHtml(memory.uploader)}</strong>
        <span>${formatDate(memory.uploadedAt)}</span>
      </div>
      <a class="download-button" href="${memory.src}" target="_blank" rel="noreferrer">Descargar</a>
    </div>
    <p>${escapeHtml(memory.caption)}</p>
  `;
}

function closeViewer() {
  if (!app.viewerModal) return;
  app.viewerModal.classList.add('hidden');
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(defaultState);

  try {
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(defaultState),
      ...parsed,
      trip: { ...structuredClone(defaultState.trip), ...(parsed.trip || {}), dateLabel: defaultState.trip.dateLabel },
      game: { ...structuredClone(defaultState.game), ...(parsed.game || {}), profiles: parsed.game?.profiles || {}, history: parsed.game?.history || [], missions: parsed.game?.missions || structuredClone(defaultState.game.missions) },
      participants: (Array.isArray(parsed.participants) && parsed.participants.length ? parsed.participants : structuredClone(defaultState.participants))
        .map((participant) => ({ ...participant, image: isLocalMediaSource(participant.image) ? participant.image : '' })),
      memories: (Array.isArray(parsed.memories) ? parsed.memories : structuredClone(defaultState.memories))
        .filter((memory) => isLocalMediaSource(memory.src)),
      activities: Array.isArray(parsed.activities) ? parsed.activities : structuredClone(defaultState.activities),
      messages: Array.isArray(parsed.messages) ? parsed.messages : structuredClone(defaultState.messages),
      donations: { ...structuredClone(defaultState.donations), ...(parsed.donations || {}) },
    };
  } catch (error) {
    return structuredClone(defaultState);
  }
}

function isLocalMediaSource(source) {
  return typeof source === 'string' && /^(data:image\/|data:video\/|blob:|\/)/i.test(source);
}

function getInitials(name) {
  return String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function formatDate(value) {
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' }).format(new Date(value));
}

function formatCurrency(value) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function countPhotosForUser(name) {
  return state.memories.filter((memory) => memory.uploader === name).length;
}

function frameClass(participantId) {
  const frame = getProfile(participantId || state.game.activeParticipant).equipped;
  const item = STORE_ITEMS.find((entry) => entry.id === frame);
  return item ? `frame-applied frame-${item.style}` : '';
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
