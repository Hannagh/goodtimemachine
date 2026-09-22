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

if (upcomingList && pastList) {
  const now = new Date();
  const cards = Array.from(upcomingList.querySelectorAll('.show-card'));

  const upcoming = [];
  const past = [];

  cards.forEach(card => {
    const showDate = new Date(card.dataset.datetime);
    if (showDate < now) {
      card.classList.add('is-past');
      const ticketLink = card.querySelector('.btn');
      if (ticketLink) ticketLink.remove();
      past.push({ card, showDate });
    } else {
      upcoming.push({ card, showDate });
    }
  });

  upcoming.sort((a, b) => a.showDate - b.showDate);
  past.sort((a, b) => b.showDate - a.showDate);

  upcoming.forEach(({ card }) => upcomingList.appendChild(card));
  past.forEach(({ card }) => pastList.appendChild(card));

  if (upcoming.length === 0) {
    noUpcomingNote.hidden = false;
  }
  if (past.length > 0) {
    pastHeading.hidden = false;
  }
}
