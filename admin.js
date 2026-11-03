const WORKER_URL = 'https://good-time-machine-admin.hannaghoover.workers.dev/';
const PASSWORD_KEY = 'gtmAdminPassword';

const loginView = document.getElementById('loginView');
const editorView = document.getElementById('editorView');
const loginForm = document.getElementById('loginForm');
const passwordInput = document.getElementById('passwordInput');
const loginButton = document.getElementById('loginButton');
const loginMessage = document.getElementById('loginMessage');
const logoutButton = document.getElementById('logoutButton');
const addButton = document.getElementById('addButton');
const saveButton = document.getElementById('saveButton');
const statusMessage = document.getElementById('statusMessage');
const upcomingRows = document.getElementById('upcomingRows');
const pastRows = document.getElementById('pastRows');
const upcomingEmpty = document.getElementById('upcomingEmpty');
const pastEmpty = document.getElementById('pastEmpty');
const venueOptions = document.getElementById('venueOptions');

let password = '';
let dirty = false;

function setDirty(value) {
  dirty = value;
}

function readStoredPassword() {
  try { return sessionStorage.getItem(PASSWORD_KEY) || ''; } catch (e) { return ''; }
}

function storePassword(value) {
  try {
    if (value) sessionStorage.setItem(PASSWORD_KEY, value);
    else sessionStorage.removeItem(PASSWORD_KEY);
  } catch (e) { /* storage unavailable; user will just log in again */ }
}

async function api(method, body) {
  const headers = { Authorization: 'Bearer ' + password };
  if (body) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(WORKER_URL, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch (e) {
    throw new Error('Could not reach the server. Check your connection and try again.');
  }

  let data = {};
  try { data = await response.json(); } catch (e) { /* non-JSON error body */ }

  if (!response.ok) {
    const error = new Error(data.error || 'Something went wrong (' + response.status + ').');
    error.status = response.status;
    throw error;
  }
  return data;
}

function showStatus(text, kind) {
  statusMessage.textContent = text;
  statusMessage.className = 'admin-message' + (kind ? ' ' + kind : '');
}

function showLogin(message) {
  password = '';
  storePassword('');
  editorView.hidden = true;
  loginView.hidden = false;
  passwordInput.value = '';
  loginMessage.hidden = !message;
  loginMessage.textContent = message || '';
}

function makeField(labelText, input, extraClass) {
  const label = document.createElement('label');
  label.className = 'field ' + (extraClass || '');
  const span = document.createElement('span');
  span.textContent = labelText;
  label.append(span, input);
  return label;
}

function makeInput(type, name, value, extra) {
  const input = document.createElement('input');
  input.type = type;
  input.dataset.name = name;
  input.value = value || '';
  Object.assign(input, extra || {});
  return input;
}

function createRow(show) {
  const [datePart, timePart] = (show.datetime || 'T').split('T');

  const row = document.createElement('div');
  row.className = 'show-row';

  const venue = makeInput('text', 'venue', show.venue, { maxLength: 100 });
  venue.setAttribute('list', 'venueOptions');
  const date = makeInput('date', 'date', datePart);
  const time = makeInput('time', 'time', timePart);
  const ticket = makeInput('url', 'ticketUrl', show.ticketUrl, { placeholder: 'https://… (optional)' });

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'delete-button';
  remove.textContent = 'Delete';
  remove.addEventListener('click', () => {
    if (!confirm('Delete this show?')) return;
    row.remove();
    setDirty(true);
    updateEmptyNotes();
  });

  row.append(
    makeField('Theater name', venue, 'field-venue'),
    makeField('Date', date),
    makeField('Time', time),
    makeField('Ticket link', ticket, 'field-ticket'),
    remove
  );
  return row;
}

function updateEmptyNotes() {
  upcomingEmpty.hidden = upcomingRows.children.length > 0;
  pastEmpty.hidden = pastRows.children.length > 0;
}

function refreshVenueOptions(shows) {
  venueOptions.replaceChildren();
  [...new Set(shows.map(s => s.venue))].forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    venueOptions.append(option);
  });
}

function renderShows(shows) {
  const now = new Date();
  const withDates = shows.map(show => ({ show, date: new Date(show.datetime) }));
  const upcoming = withDates.filter(s => s.date >= now).sort((a, b) => a.date - b.date);
  const past = withDates.filter(s => s.date < now).sort((a, b) => b.date - a.date);

  upcomingRows.replaceChildren(...upcoming.map(s => createRow(s.show)));
  pastRows.replaceChildren(...past.map(s => createRow(s.show)));
  refreshVenueOptions(shows);
  updateEmptyNotes();
  setDirty(false);
}

function collectShows() {
  const rows = [...document.querySelectorAll('.show-row')];
  const shows = [];
  let firstInvalid = null;
  let message = '';

  rows.forEach(row => {
    const get = name => row.querySelector('[data-name="' + name + '"]');
    const venue = get('venue');
    const date = get('date');
    const time = get('time');
    const ticket = get('ticketUrl');

    [venue, date, time, ticket].forEach(input => input.classList.remove('invalid'));

    const problems = [];
    if (!venue.value.trim()) problems.push([venue, 'Every show needs a theater name.']);
    if (!date.value) problems.push([date, 'Every show needs a date.']);
    if (!time.value) problems.push([time, 'Every show needs a time.']);
    if (ticket.value.trim() && !/^https:\/\//i.test(ticket.value.trim())) {
      problems.push([ticket, 'Ticket links must start with https://']);
    }

    problems.forEach(([input]) => input.classList.add('invalid'));
    if (problems.length && !firstInvalid) {
      firstInvalid = problems[0][0];
      message = problems[0][1];
    }

    shows.push({
      venue: venue.value.trim(),
      datetime: date.value + 'T' + time.value.slice(0, 5),
      ticketUrl: ticket.value.trim(),
    });
  });

  if (firstInvalid) {
    firstInvalid.focus();
    return { error: message };
  }
  return { shows };
}

async function loadEditor() {
  const data = await api('GET');
  renderShows(data.shows);
  loginView.hidden = true;
  editorView.hidden = false;
  showStatus('');
}

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  password = passwordInput.value;
  loginButton.disabled = true;
  loginMessage.hidden = true;

  try {
    await loadEditor();
    storePassword(password);
  } catch (e) {
    showLogin(e.message);
  } finally {
    loginButton.disabled = false;
  }
});

logoutButton.addEventListener('click', () => {
  if (dirty && !confirm('You have unsaved changes. Log out anyway?')) return;
  setDirty(false);
  showLogin('');
});

addButton.addEventListener('click', () => {
  const row = createRow({ venue: '', datetime: '', ticketUrl: '' });
  upcomingRows.prepend(row);
  upcomingEmpty.hidden = true;
  setDirty(true);
  row.querySelector('[data-name="venue"]').focus();
});

saveButton.addEventListener('click', async () => {
  const result = collectShows();
  if (result.error) {
    showStatus(result.error, 'error');
    return;
  }

  saveButton.disabled = true;
  showStatus('Saving…');
  try {
    const data = await api('PUT', { shows: result.shows });
    renderShows(data.shows);
    showStatus('Saved! The public site will update in a minute or two.', 'success');
  } catch (e) {
    if (e.status === 401) {
      showLogin('Your session expired. Please log in again.');
    } else {
      showStatus(e.message, 'error');
    }
  } finally {
    saveButton.disabled = false;
  }
});

editorView.addEventListener('input', () => setDirty(true));

window.addEventListener('beforeunload', event => {
  if (dirty) {
    event.preventDefault();
    event.returnValue = '';
  }
});

if (WORKER_URL.includes('REPLACE')) {
  loginMessage.textContent = 'This page is not connected to the server yet (setup is not finished).';
  loginMessage.hidden = false;
  loginButton.disabled = true;
} else {
  const stored = readStoredPassword();
  if (stored) {
    password = stored;
    loadEditor().catch(() => showLogin(''));
  }
}
