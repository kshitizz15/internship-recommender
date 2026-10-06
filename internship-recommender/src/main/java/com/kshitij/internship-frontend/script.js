/* ============================================================
   Internship Recommender — Shared App Script
   Vanilla JS · fetch() against Spring Boot REST API
   ============================================================ */

/* ----------  API Configuration  ----------
   Base URL of the Spring Boot backend. Adjust if your backend
   runs on a different host/port.
*/
const API_BASE = 'http://localhost:8080';

/* Centralised endpoints so every page uses the same paths. */
const API = {
  list:            () => `${API_BASE}/internships`,
  byCompany:       (v) => `${API_BASE}/internships/company/${encodeURIComponent(v)}`,
  byRole:          (v) => `${API_BASE}/internships/role/${encodeURIComponent(v)}`,
  bySector:        (v) => `${API_BASE}/internships/sector/${encodeURIComponent(v)}`,
  byState:         (v) => `${API_BASE}/internships/state/${encodeURIComponent(v)}`,
  byQualification: (v) => `${API_BASE}/internships/qualification/${encodeURIComponent(v)}`,
  byStipend:       (v) => `${API_BASE}/internships/stipend/${encodeURIComponent(v)}`,
  byDuration:      (v) => `${API_BASE}/internships/duration/${encodeURIComponent(v)}`,
  create:          () => `${API_BASE}/internships`,
  update:          (id) => `${API_BASE}/internships/${encodeURIComponent(id)}`,
  remove:          (id) => `${API_BASE}/internships/${encodeURIComponent(id)}`,
};

/* ----------  Toast notifications  ---------- */
function showToast(message, type = 'info', timeout = 4000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `app-toast ${type}`;
  const icon = type === 'success' ? 'check-circle-fill'
            : type === 'error'   ? 'exclamation-triangle-fill'
            : 'info-circle-fill';
  toast.innerHTML = `<i class="bi bi-${icon} me-2"></i><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all .3s ease';
    setTimeout(() => toast.remove(), 300);
  }, timeout);
}

/* ----------  Friendly error text  ---------- */
function friendlyError(error) {
  if (error && error.name === 'TypeError' && /fetch|NetworkError/i.test(error.message)) {
    return 'Cannot reach the backend server. Please make sure your Spring Boot API is running at ' + API_BASE + '.';
  }
  return (error && error.message) ? error.message : 'Something went wrong. Please try again.';
}

/* ----------  Generic fetch wrapper with loading + error handling  ----------
   Returns parsed JSON or throws. Does NOT catch here — callers decide
   how to surface errors (toasts, inline messages, etc.).
*/
async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try { const body = await res.json(); if (body) detail = body.message || detail; } catch (_) {}
    throw new Error(detail);
  }
  // 204 No Content (typical for DELETE)
  if (res.status === 204) return null;
  return res.json();
}

/* ----------  Loading indicator helpers  ---------- */
function showLoader(target, label = 'Loading…') {
  if (!target) return;
  target.innerHTML = `
    <div class="spinner-wrap">
      <div class="page-loader"></div>
      <p class="mt-3 mb-0">${label}</p>
    </div>`;
}
function hideLoader(target) {
  if (target) target.innerHTML = '';
}

/* ----------  Navbar scroll state  ---------- */
function initNavbarScroll() {
  const nav = document.getElementById('mainNav');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ----------  Scroll reveal animations  ---------- */
function initRevealOnScroll() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('in-view'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  items.forEach((el, i) => {
    el.style.animationDelay = `${Math.min(i * 0.08, 0.4)}s`;
    io.observe(el);
  });
}

/* ----------  Footer year  ---------- */
function initFooterYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
}

/* ----------  Home page: live statistics  ----------
   Pulls the full list once and derives counts so the hero
   statistics reflect real data when the backend is available.
*/
async function loadHomeStats() {
  const fields = {
    statCompanies: 'company',
    statRoles:     'role',
    statStates:    'state',
    statSectors:   'sector',
  };

  // Set sensible fallback values shown while loading / when offline
  const fallbacks = { statCompanies: 50, statRoles: 200, statStates: 28, statSectors: 12 };

  try {
    const data = await apiFetch(API.list());
    const list = Array.isArray(data) ? data : (data.content || data.internships || []);
    Object.entries(fields).forEach(([id, key]) => {
      const el = document.getElementById(id);
      if (!el) return;
      const unique = new Set(list.map((x) => x && x[key]).filter(Boolean));
      animateCount(el, unique.size);
    });
  } catch (err) {
    console.warn('Home stats: backend unavailable, showing fallback values.', err);
    Object.entries(fallbacks).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) animateCount(el, val);
    });
    showToast('Showing sample statistics — backend not reachable.', 'info', 5000);
  }
}

/* Animated count-up for a nice micro-interaction. */
function animateCount(el, target, duration = 1200) {
  const start = 0;
  const startTime = performance.now();
  const step = (now) => {
    const p = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
    el.textContent = Math.round(start + (target - start) * eased);
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = target;
  };
  requestAnimationFrame(step);
}

/* ----------  Active nav link highlight  ---------- */
function highlightActiveNav() {
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.navbar-custom .nav-link').forEach((link) => {
    const href = (link.getAttribute('href') || '').toLowerCase();
    link.classList.toggle('active', href === path);
  });
}

/* ============================================================
   Internships page logic
   ============================================================ */

/* In-memory cache of all internships fetched from the backend.
   Filtering is done client-side so the search box feels instant,
   while dropdown options are derived from the live data. */
let allInternships = [];
let filters = {
  search: '',
  company: '',
  role: '',
  sector: '',
  state: '',
  qualification: '',
  stipend: '',
  duration: '',
};

/* ----------  DOM references (resolved on DOMContentLoaded)  ---------- */
let listEl, searchInput, searchBtn, clearBtn, refreshBtn, resultCountEl;

/* ----------  Load all internships from the backend  ---------- */
async function loadInternships() {
  if (!listEl) return;
  showLoader(listEl, 'Loading internships…');

  try {
    const data = await apiFetch(API.list());
    allInternships = Array.isArray(data) ? data : (data.content || data.internships || []);
    populateFilters();
    renderList();
  } catch (err) {
    allInternships = [];
    renderError(err);
  }
}

/* ----------  Populate filter dropdowns from live data  ---------- */
function populateFilters() {
  const sources = {
    filterCompany:       { key: 'company',       label: 'All companies' },
    filterRole:          { key: 'role',           label: 'All roles' },
    filterSector:        { key: 'sector',         label: 'All sectors' },
    filterState:         { key: 'state',          label: 'All states' },
    filterQualification: { key: 'qualification',  label: 'All qualifications' },
    filterStipend:       { key: 'stipend',        label: 'Any stipend' },
    filterDuration:      { key: 'duration',       label: 'Any duration' },
  };

  Object.entries(sources).forEach(([id, { key, label }]) => {
    const select = document.getElementById(id);
    if (!select) return;
    const current = select.value;
    const values = [...new Set(allInternships.map((x) => x && x[key]).filter(Boolean))].sort((a, b) =>
      String(a).localeCompare(String(b), undefined, { numeric: true })
    );
    select.innerHTML = `<option value="">${label}</option>` +
      values.map((v) => `<option value="${escapeAttr(v)}">${escapeHtml(v)}</option>`).join('');
    // Preserve the user's selection if still valid
    if (values.map(String).includes(String(current))) select.value = current;
  });
}

/* ----------  Apply filters and render the card grid  ---------- */
function renderList() {
  if (!listEl) return;

  const q = filters.search.trim().toLowerCase();
  const filtered = allInternships.filter((it) => {
    if (!it) return false;
    const fields = ['company', 'role', 'sector', 'state', 'qualification', 'stipend', 'duration']
      .map((k) => String(it[k] ?? '').toLowerCase());

    if (q && !fields.some((f) => f.includes(q))) return false;
    if (filters.company       && String(it.company)      !== filters.company)       return false;
    if (filters.role          && String(it.role)          !== filters.role)          return false;
    if (filters.sector        && String(it.sector)        !== filters.sector)        return false;
    if (filters.state         && String(it.state)         !== filters.state)         return false;
    if (filters.qualification && String(it.qualification) !== filters.qualification) return false;
    if (filters.stipend       && String(it.stipend)       !== filters.stipend)       return false;
    if (filters.duration      && String(it.duration)      !== filters.duration)      return false;
    return true;
  });

  // Update result count
  if (resultCountEl) {
    resultCountEl.innerHTML = filtered.length
      ? `<b>${filtered.length}</b> internship${filtered.length === 1 ? '' : 's'} found`
      : '';
  }

  if (!filtered.length) {
    renderEmpty();
    return;
  }

  listEl.innerHTML = filtered.map((it, i) => internshipCardHtml(it, i)).join('');

  // Wire up edit / delete buttons
  listEl.querySelectorAll('[data-edit]').forEach((btn) =>
    btn.addEventListener('click', () => openEditModal(btn.getAttribute('data-edit')))
  );
  listEl.querySelectorAll('[data-delete]').forEach((btn) =>
    btn.addEventListener('click', () => confirmDelete(btn.getAttribute('data-delete')))
  );
}

/* ----------  Card markup  ---------- */
function internshipCardHtml(it, i) {
  const id = it.id ?? '';
  const initials = String(it.company || '?').trim().charAt(0).toUpperCase();
  const stipend = it.stipend ? `₹${it.stipend}` : 'Unpaid';
  return `
  <div class="col-md-6 col-xl-4" style="animation-delay:${Math.min(i * 0.05, 0.3)}s">
    <article class="glass internship-card">
      <div class="card-top">
        <div class="d-flex gap-2 align-items-center">
          <div class="card-avatar">${escapeHtml(initials)}</div>
          <div>
            <h3>${escapeHtml(it.role || 'Untitled Role')}</h3>
            <div class="company-name">${escapeHtml(it.company || 'Unknown company')}</div>
          </div>
        </div>
      </div>

      <div class="card-meta">
        <span class="meta-item"><i class="bi bi-diagram-3"></i><span><b>${escapeHtml(it.sector || '—')}</b></span></span>
        <span class="meta-item"><i class="bi bi-geo-alt"></i><span><b>${escapeHtml(it.state || '—')}</b></span></span>
        <span class="meta-item"><i class="bi bi-mortarboard"></i><span><b>${escapeHtml(it.qualification || '—')}</b></span></span>
        <span class="meta-item"><i class="bi bi-clock"></i><span><b>${escapeHtml(it.duration || '—')}</b></span></span>
      </div>

      <div class="card-tags">
        <span class="tag accent">${escapeHtml(it.sector || 'General')}</span>
        <span class="tag stipend"><i class="bi bi-currency-rupee"></i> ${escapeHtml(stipend)}</span>
        <span class="tag">${escapeHtml(it.duration || 'Flexible')}</span>
      </div>

      <div class="card-actions">
        <a class="btn btn-apply-card" href="apply.html?id=${escapeAttr(id)}"><i class="bi bi-send-fill me-1"></i>Apply Now</a>
        <button class="btn btn-edit" data-edit="${escapeAttr(id)}"><i class="bi bi-pencil-square me-1"></i>Edit</button>
        <button class="btn btn-delete" data-delete="${escapeAttr(id)}"><i class="bi bi-trash3 me-1"></i>Delete</button>
      </div>
    </article>
  </div>`;
}

/* ----------  Empty state  ---------- */
function renderEmpty() {
  const hasFilters = filters.search || Object.values(filters).some((v, i) => i && v);
  listEl.innerHTML = `
    <div class="col-12">
      <div class="glass state-block">
        <i class="bi bi-inbox"></i>
        <h3>No internships found</h3>
        <p>${hasFilters
          ? 'No listings match your current filters. Try adjusting your search or clearing the filters.'
          : 'There are no internship listings in the database yet. Add the first one!'}</p>
        <div class="d-flex gap-2 justify-content-center flex-wrap">
          ${hasFilters ? '<button class="btn btn-outline-light" onclick="clearFilters()"><i class="bi bi-arrow-counterclockwise me-1"></i>Clear filters</button>' : ''}
          <a class="btn btn-primary" href="add.html"><i class="bi bi-plus-lg me-1"></i>Add Internship</a>
        </div>
      </div>
    </div>`;
}

/* ----------  Error state  ---------- */
function renderError(err) {
  if (resultCountEl) resultCountEl.textContent = '';
  listEl.innerHTML = `
    <div class="col-12">
      <div class="glass state-block error">
        <i class="bi bi-exclamation-triangle"></i>
        <h3>Couldn't load internships</h3>
        <p>${escapeHtml(friendlyError(err))}</p>
        <button class="btn btn-primary" onclick="loadInternships()"><i class="bi bi-arrow-clockwise me-1"></i>Try again</button>
      </div>
    </div>`;
}

/* ----------  Clear all filters  ---------- */
function clearFilters() {
  filters = { search: '', company: '', role: '', sector: '', state: '', qualification: '', stipend: '', duration: '' };
  if (searchInput) searchInput.value = '';
  document.querySelectorAll('.filter-select').forEach((s) => (s.value = ''));
  renderList();
}

/* ----------  Delete with confirmation  ---------- */
async function confirmDelete(id) {
  const item = allInternships.find((x) => String(x.id) === String(id));
  const label = item ? `${item.role} at ${item.company}` : `this internship`;
  if (!confirm(`Delete "${label}"? This action cannot be undone.`)) return;

  try {
    await apiFetch(API.remove(id), { method: 'DELETE' });
    allInternships = allInternships.filter((x) => String(x.id) !== String(id));
    populateFilters();
    renderList();
    showToast('Internship deleted successfully.', 'success');
  } catch (err) {
    showToast(friendlyError(err), 'error', 6000);
  }
}

/* ----------  Edit modal  ---------- */
let editModalInstance = null;

function openEditModal(id) {
  const item = allInternships.find((x) => String(x.id) === String(id));
  if (!item) { showToast('Internship not found.', 'error'); return; }

  const modalEl = document.getElementById('editModal');
  if (!modalEl) return;

  // Fill the form fields
  ['id','company','role','sector','state','qualification','stipend','duration'].forEach((k) => {
    const field = modalEl.querySelector(`[name="${k}"]`);
    if (field) field.value = item[k] ?? '';
  });

  editModalInstance = editModalInstance || new bootstrap.Modal(modalEl);
  editModalInstance.show();
}

async function submitEdit(e) {
  e.preventDefault();
  const form = e.target;
  const id = form.elements.id.value;
  const payload = {
    company: form.elements.company.value.trim(),
    role: form.elements.role.value.trim(),
    sector: form.elements.sector.value.trim(),
    state: form.elements.state.value.trim(),
    qualification: form.elements.qualification.value.trim(),
    stipend: form.elements.stipend.value.trim(),
    duration: form.elements.duration.value.trim(),
  };

  if (!payload.company || !payload.role) {
    showToast('Company and Role are required.', 'error');
    return;
  }

  const submitBtn = form.querySelector('[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving…';

  try {
    await apiFetch(API.update(id), { method: 'PUT', body: JSON.stringify(payload) });
    // Update local cache
    const idx = allInternships.findIndex((x) => String(x.id) === String(id));
    if (idx > -1) allInternships[idx] = { ...allInternships[idx], ...payload };
    populateFilters();
    renderList();
    editModalInstance.hide();
    showToast('Internship updated successfully.', 'success');
  } catch (err) {
    showToast(friendlyError(err), 'error', 6000);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="bi bi-check-lg me-1"></i>Save changes';
  }
}

/* ----------  Small HTML/attr escapers  ---------- */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function escapeAttr(str) { return escapeHtml(str); }

/* ----------  Wire up the internships page  ---------- */
function initInternshipsPage() {
  listEl       = document.getElementById('internshipList');
  searchInput  = document.getElementById('searchInput');
  searchBtn    = document.getElementById('searchBtn');
  clearBtn     = document.getElementById('clearBtn');
  refreshBtn   = document.getElementById('refreshBtn');
  resultCountEl = document.getElementById('resultCount');

  if (!listEl) return; // not on the internships page

  // Search — live with a tiny debounce
  let t;
  searchInput.addEventListener('input', () => {
    filters.search = searchInput.value;
    clearTimeout(t);
    t = setTimeout(renderList, 200);
  });
  searchBtn.addEventListener('click', renderList);
  searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') renderList(); });

  // Filter dropdowns
  const bind = (id, key) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', () => { filters[key] = el.value; renderList(); });
  };
  bind('filterCompany', 'company');
  bind('filterRole', 'role');
  bind('filterSector', 'sector');
  bind('filterState', 'state');
  bind('filterQualification', 'qualification');
  bind('filterStipend', 'stipend');
  bind('filterDuration', 'duration');

  clearBtn.addEventListener('click', clearFilters);
  refreshBtn.addEventListener('click', loadInternships);

  // Edit modal form
  const editForm = document.getElementById('editForm');
  if (editForm) editForm.addEventListener('submit', submitEdit);

  loadInternships();
}

/* ============================================================
   Add Internship page logic
   ============================================================ */

/* ----------  DOM references (resolved on DOMContentLoaded)  ---------- */
let addForm, submitBtn, resetBtn;

/* ----------  Validate a single field  ----------
   Returns true when valid; marks the field with Bootstrap's
   is-invalid class otherwise so the inline message shows.
*/
function validateField(input) {
  const value = (input.value ?? '').toString().trim();
  let valid = true;

  if (input.hasAttribute('required') && !value) {
    valid = false;
  } else if (input.type === 'number') {
    const num = Number(value);
    if (!value || isNaN(num) || num <= 0) valid = false;
  }

  input.classList.toggle('is-invalid', !valid);
  return valid;
}

/* ----------  Validate the whole form  ---------- */
function validateAddForm() {
  const fields = addForm.querySelectorAll('input[required]');
  let allValid = true;
  fields.forEach((f) => { if (!validateField(f)) allValid = false; });
  return allValid;
}

/* ----------  Build the JSON payload from the form  ---------- */
function buildPayload() {
  return {
    company:      addForm.company.value.trim(),
    role:         addForm.role.value.trim(),
    sector:       addForm.sector.value.trim(),
    state:        addForm.state.value.trim(),
    qualification: addForm.qualification.value.trim(),
    stipend:      Number(addForm.stipend.value),
    duration:     Number(addForm.duration.value),
  };
}

/* ----------  Toggle the submit button loading state  ---------- */
function setSubmitting(loading) {
  if (!submitBtn) return;
  submitBtn.disabled = loading;
  submitBtn.querySelector('.btn-label').classList.toggle('d-none', loading);
  submitBtn.querySelector('.btn-spinner').classList.toggle('d-none', !loading);
}

/* ----------  Submit handler: POST to backend  ---------- */
async function submitAddForm(e) {
  e.preventDefault();

  // Re-validate every field before sending
  if (!validateAddForm()) {
    showToast('Please fix the highlighted fields.', 'error');
    return;
  }

  const payload = buildPayload();
  setSubmitting(true);

  try {
    // POST the new internship; apiFetch throws on non-2xx
    await apiFetch(API.create(), {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    showToast('Internship published successfully!', 'success');
    addForm.reset();
    addForm.querySelectorAll('.is-invalid').forEach((f) => f.classList.remove('is-invalid'));

    // Redirect to the internships listing after a short delay
    setTimeout(() => { window.location.href = 'internship.html'; }, 1500);
  } catch (err) {
    // Friendly message for offline backend or HTTP errors
    showToast(friendlyError(err), 'error', 6000);
  } finally {
    setSubmitting(false);
  }
}

/* ----------  Wire up the Add Internship page  ---------- */
function initAddPage() {
  addForm   = document.getElementById('addForm');
  submitBtn = document.getElementById('submitBtn');
  resetBtn  = document.getElementById('resetBtn');

  if (!addForm) return; // not on the add page

  // Submit
  addForm.addEventListener('submit', submitAddForm);

  // Live validation: clear the invalid state as the user corrects a field
  addForm.querySelectorAll('input[required]').forEach((input) => {
    input.addEventListener('input', () => {
      if (input.classList.contains('is-invalid')) validateField(input);
    });
  });

  // Reset clears validation styling too
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      addForm.querySelectorAll('.is-invalid').forEach((f) => f.classList.remove('is-invalid'));
    });
  }
}

/* ============================================================
   Apply page logic
   ============================================================ */

/* ----------  DOM references  ---------- */
let applyContentEl;

/* ----------  Get internship id from URL query string  ---------- */
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/* ----------  Load a single internship by fetching all and filtering  ---------- */
async function loadInternshipForApply(id) {
  if (!applyContentEl) return;
  showLoader(applyContentEl, 'Loading internship details…');

  try {
    const data = await apiFetch(API.list());
    const all = Array.isArray(data) ? data : (data.content || data.internships || []);
    const item = all.find((x) => String(x.id) === String(id));
    if (!item) { renderApplyNotFound(); return; }
    renderApplyPage(item);
  } catch (err) {
    renderApplyError(err);
  }
}

/* ----------  Render the apply page  ---------- */
function renderApplyPage(it) {
  const id = it.id ?? '';
  const initials = String(it.company || '?').trim().charAt(0).toUpperCase();
  const today = new Date();
  const lastDate = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000);
  const lastDateStr = lastDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  applyContentEl.innerHTML = `
    <!-- Back link -->
    <div class="form-back reveal">
      <a href="internship.html" class="back-link"><i class="bi bi-arrow-left me-1"></i>Back to internships</a>
    </div>

    <div class="row g-4">
      <!-- LEFT: Internship details -->
      <div class="col-lg-7 reveal">
        <div class="glass apply-detail-card">
          <div class="apply-header">
            <div class="company-logo-placeholder">${escapeHtml(initials)}</div>
            <div>
              <h2>${escapeHtml(it.role || 'Untitled Role')}</h2>
              <p class="company-name">${escapeHtml(it.company || 'Unknown company')}</p>
            </div>
          </div>

          <p class="apply-description">
            We are looking for a passionate <b>${escapeHtml(it.role || 'Intern')}</b> to join our
            <b>${escapeHtml(it.sector || 'General')}</b> team. This is a great opportunity to gain
            hands-on experience, work on real-world projects, and learn from industry experts.
            The selected candidate will be based in <b>${escapeHtml(it.state || 'India')}</b> for a
            duration of <b>${escapeHtml(it.duration || '3')}</b> months.
          </p>

          <div class="apply-tags">
            <span class="tag accent"><i class="bi bi-diagram-3 me-1"></i>${escapeHtml(it.sector || 'General')}</span>
            <span class="tag stipend"><i class="bi bi-currency-rupee me-1"></i>${escapeHtml(it.stipend ? '₹' + it.stipend : 'Unpaid')}</span>
            <span class="tag"><i class="bi bi-clock me-1"></i>${escapeHtml(it.duration || 'Flexible')} months</span>
            <span class="tag"><i class="bi bi-geo-alt me-1"></i>${escapeHtml(it.state || 'Remote')}</span>
          </div>

          <div class="apply-info-grid">
            <div class="info-item">
              <span class="info-label"><i class="bi bi-building me-1"></i>Company</span>
              <span class="info-value">${escapeHtml(it.company || '—')}</span>
            </div>
            <div class="info-item">
              <span class="info-label"><i class="bi bi-briefcase me-1"></i>Role</span>
              <span class="info-value">${escapeHtml(it.role || '—')}</span>
            </div>
            <div class="info-item">
              <span class="info-label"><i class="bi bi-diagram-3 me-1"></i>Sector</span>
              <span class="info-value">${escapeHtml(it.sector || '—')}</span>
            </div>
            <div class="info-item">
              <span class="info-label"><i class="bi bi-geo-alt me-1"></i>Location</span>
              <span class="info-value">${escapeHtml(it.state || '—')}</span>
            </div>
            <div class="info-item">
              <span class="info-label"><i class="bi bi-currency-rupee me-1"></i>Stipend</span>
              <span class="info-value">${escapeHtml(it.stipend ? '₹' + it.stipend : 'Unpaid')}</span>
            </div>
            <div class="info-item">
              <span class="info-label"><i class="bi bi-clock me-1"></i>Duration</span>
              <span class="info-value">${escapeHtml(it.duration || '—')} months</span>
            </div>
            <div class="info-item">
              <span class="info-label"><i class="bi bi-mortarboard me-1"></i>Eligibility</span>
              <span class="info-value">${escapeHtml(it.qualification || '—')}</span>
            </div>
            <div class="info-item">
              <span class="info-label"><i class="bi bi-calendar-event me-1"></i>Last Date to Apply</span>
              <span class="info-value">${lastDateStr}</span>
            </div>
          </div>

          <div class="apply-skills">
            <h4><i class="bi bi-stars me-2"></i>Required Skills</h4>
            <div class="skill-tags">
              <span class="skill-tag">${escapeHtml(it.sector || 'General')}</span>
              <span class="skill-tag">Communication</span>
              <span class="skill-tag">Teamwork</span>
              <span class="skill-tag">Problem Solving</span>
              <span class="skill-tag">${escapeHtml(it.qualification || 'Relevant Qualification')}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT: Application form -->
      <div class="col-lg-5 reveal">
        <div class="glass apply-form-card">
          <h3 class="form-title"><i class="bi bi-pencil-square me-2"></i>Apply for this role</h3>
          <p class="form-subtitle">Fill in your details below. We'll get back to you shortly.</p>

          <form id="applicationForm" novalidate>
            <input type="hidden" name="internshipId" value="${escapeAttr(id)}" />
            <input type="hidden" name="internshipTitle" value="${escapeAttr(it.role || '')}" />
            <input type="hidden" name="company" value="${escapeAttr(it.company || '')}" />

            <div class="mb-3">
              <label class="form-label" for="fullName">Full Name</label>
              <input type="text" class="form-control" id="fullName" name="fullName" placeholder="Enter your full name" required />
              <div class="invalid-feedback">Please enter your full name.</div>
            </div>
            <div class="mb-3">
              <label class="form-label" for="email">Email Address</label>
              <input type="email" class="form-control" id="email" name="email" placeholder="you@example.com" required />
              <div class="invalid-feedback">Please enter a valid email address.</div>
            </div>
            <div class="mb-3">
              <label class="form-label" for="phone">Phone Number</label>
              <input type="tel" class="form-control" id="phone" name="phone" placeholder="+91 90000 00000" required />
              <div class="invalid-feedback">Please enter your phone number.</div>
            </div>
            <div class="mb-3">
              <label class="form-label" for="college">College / University</label>
              <input type="text" class="form-control" id="college" name="college" placeholder="Your institution" required />
              <div class="invalid-feedback">Please enter your college or university.</div>
            </div>
            <div class="mb-3">
              <label class="form-label" for="resumeLink">Resume / Portfolio Link</label>
              <input type="url" class="form-control" id="resumeLink" name="resumeLink" placeholder="https://drive.google.com/your-resume" />
              <div class="invalid-feedback">Please enter a valid URL.</div>
            </div>
            <div class="mb-3">
              <label class="form-label" for="coverLetter">Why should we hire you?</label>
              <textarea class="form-control" id="coverLetter" name="coverLetter" rows="3" placeholder="Tell us what makes you a great fit…" required></textarea>
              <div class="invalid-feedback">Please tell us why you're a good fit.</div>
            </div>

            <button type="submit" class="btn btn-primary btn-submit w-100" id="applySubmitBtn">
              <span class="btn-label"><i class="bi bi-send-fill me-2"></i>Submit Application</span>
              <span class="btn-spinner spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
            </button>
          </form>
        </div>
      </div>
    </div>
  `;

  // Wire up the application form
  const form = document.getElementById('applicationForm');
  if (form) form.addEventListener('submit', submitApplication);

  initRevealOnScroll();
}

/* ----------  Validate the application form  ---------- */
function validateApplicationForm(form) {
  let valid = true;
  const fields = form.querySelectorAll('input[required], textarea[required]');
  fields.forEach((f) => {
    const val = (f.value ?? '').trim();
    let ok = !!val;
    if (ok && f.type === 'email') {
      ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    }
    f.classList.toggle('is-invalid', !ok);
    if (!ok) valid = false;
  });
  // Optional URL field — validate only if filled
  const url = form.querySelector('#resumeLink');
  if (url && url.value.trim()) {
    try { new URL(url.value.trim()); url.classList.remove('is-invalid'); }
    catch { url.classList.add('is-invalid'); valid = false; }
  }
  return valid;
}

/* ----------  Submit the application  ---------- */
async function submitApplication(e) {
  e.preventDefault();
  const form = e.target;
  if (!validateApplicationForm(form)) {
    showToast('Please fix the highlighted fields.', 'error');
    return;
  }

  const btn = document.getElementById('applySubmitBtn');
  btn.disabled = true;
  btn.querySelector('.btn-label').classList.add('d-none');
  btn.querySelector('.btn-spinner').classList.remove('d-none');

  // Simulate submission — no backend endpoint for applications yet
  setTimeout(() => {
    btn.disabled = false;
    btn.querySelector('.btn-label').classList.remove('d-none');
    btn.querySelector('.btn-spinner').classList.add('d-none');
    window.location.href = 'success.html';
  }, 1200);
}

/* ----------  Not found state  ---------- */
function renderApplyNotFound() {
  applyContentEl.innerHTML = `
    <div class="glass state-block">
      <i class="bi bi-search"></i>
      <h3>Internship not found</h3>
      <p>This listing may have been removed or the link is incorrect.</p>
      <a class="btn btn-primary" href="internship.html"><i class="bi bi-arrow-left me-1"></i>Back to internships</a>
    </div>`;
}

/* ----------  Error state  ---------- */
function renderApplyError(err) {
  applyContentEl.innerHTML = `
    <div class="glass state-block error">
      <i class="bi bi-exclamation-triangle"></i>
      <h3>Couldn't load this internship</h3>
      <p>${escapeHtml(friendlyError(err))}</p>
      <button class="btn btn-primary" onclick="location.reload()"><i class="bi bi-arrow-clockwise me-1"></i>Try again</button>
    </div>`;
}

/* ----------  Wire up the Apply page  ---------- */
function initApplyPage() {
  applyContentEl = document.getElementById('applyContent');
  if (!applyContentEl) return;
  const id = getQueryParam('id');
  if (!id) { renderApplyNotFound(); return; }
  loadInternshipForApply(id);
}

/* ----------  Page bootstrapping  ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initNavbarScroll();
  initRevealOnScroll();
  initFooterYear();
  highlightActiveNav();

  // Home page stats container present → load live stats
  if (document.getElementById('statCompanies')) {
    loadHomeStats();
  }

  // Internships page
  initInternshipsPage();

  // Add Internship page
  initAddPage();

  // Apply page
  initApplyPage();
});
