document.addEventListener('DOMContentLoaded', async () => {
  const user = requireAuth('trainer');
  if (!user) return;
  renderNav('create-session');
  await Promise.all([loadActivities(), loadLocations()]);

  // Set default date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  document.getElementById('date').value = tomorrow.toISOString().slice(0, 10);
  document.getElementById('time').value = '09:00';
});

async function loadActivities() {
  try {
    const data = await api.get('/activities');
    const select = document.getElementById('activity_id');
    (data.activities || []).forEach(a => {
      select.innerHTML += `<option value="${a.id}">${a.name}</option>`;
    });
  } catch (e) {}
}

async function loadLocations() {
  try {
    const data = await api.get('/locations');
    const select = document.getElementById('location_id');
    (data.locations || []).forEach(l => {
      select.innerHTML += `<option value="${l.id}">${l.name} (cap: ${l.capacity})</option>`;
    });
  } catch (e) {}
}

document.getElementById('createSessionForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const alertBox = document.getElementById('alertBox');
  alertBox.innerHTML = '';

  const name = document.getElementById('name').value.trim();
  const date = document.getElementById('date').value;
  const time = document.getElementById('time').value;

  if (!name || !date || !time) {
    alertBox.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> Name, date, and time are required.</div>`;
    return;
  }

  const body = {
    name,
    activity_id: document.getElementById('activity_id').value || null,
    location_id: document.getElementById('location_id').value || null,
    date,
    time,
    duration_minutes: parseInt(document.getElementById('duration_minutes').value) || 60,
    max_participants: parseInt(document.getElementById('max_participants').value) || 20,
    description: document.getElementById('description').value.trim()
  };

  const submitBtn = e.submitter || document.querySelector('[type=submit]');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';

  try {
    const data = await api.post('/sessions', body);
    alertBox.innerHTML = `<div class="alert alert-success">
      <i class="fas fa-check-circle"></i> Session "${data.session.name}" created!
      <a href="/trainer/sessions.html" style="color:var(--accent-gold);text-decoration:none;"> View sessions</a>
    </div>`;
    document.getElementById('createSessionForm').reset();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('date').value = tomorrow.toISOString().slice(0, 10);
    document.getElementById('time').value = '09:00';
  } catch (err) {
    alertBox.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> ${err.message}</div>`;
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-plus"></i> Create Session';
  }
});
