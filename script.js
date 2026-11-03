document.getElementById('year').textContent = new Date().getFullYear();

const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

navToggle.addEventListener('click', () => {
  const isOpen = navMenu.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', isOpen);
});

navMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navMenu.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

const upcomingList = document.getElementById('upcomingShowsList');
const pastList = document.getElementById('pastShowsList');
const pastHeading = document.getElementById('pastShowsHeading');
const noUpcomingNote = document.getElementById('noUpcomingNote');
const showsError = document.getElementById('showsError');

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function formatTime(hours, minutes) {
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return hour12 + ':' + String(minutes).padStart(2, '0') + ' ' + suffix;
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === 'https:';
  } catch (e) {
    return false;
  }
}

function buildShowCard(show, isPast) {
  const [datePart, timePart] = show.datetime.split('T');
  const [, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);

  const card = document.createElement('li');
  card.className = 'show-card' + (isPast ? ' is-past' : '');

  const dateEl = document.createElement('div');
  dateEl.className = 'show-date';
  dateEl.append(MONTHS[month - 1], document.createElement('br'), String(day));

  const info = document.createElement('div');
  info.className = 'show-info';
  const venue = document.createElement('h3');
  venue.textContent = show.venue;
  const time = document.createElement('p');
  time.textContent = formatTime(hours, minutes);
  info.append(venue, time);

  card.append(dateEl, info);

  if (!isPast && show.ticketUrl && isHttpsUrl(show.ticketUrl)) {
    const link = document.createElement('a');
    link.className = 'btn btn-small';
    link.href = show.ticketUrl;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = 'Get Tickets';
    card.append(link);
  }

  return card;
}

async function loadShows() {
  if (!upcomingList || !pastList) return;

  try {
    const response = await fetch('shows.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const data = await response.json();

    const now = new Date();
    const shows = data.shows.map(show => ({ show, date: new Date(show.datetime) }));
    const upcoming = shows.filter(s => s.date >= now).sort((a, b) => a.date - b.date);
    const past = shows.filter(s => s.date < now).sort((a, b) => b.date - a.date);

    upcoming.forEach(s => upcomingList.appendChild(buildShowCard(s.show, false)));
    past.forEach(s => pastList.appendChild(buildShowCard(s.show, true)));

    noUpcomingNote.hidden = upcoming.length > 0;
    pastHeading.hidden = past.length === 0;
  } catch (e) {
    showsError.hidden = false;
  }
}

loadShows();
