const PAPERS = {
  coflip: {
    name: 'CO-FLIP',
    url: 'http://cseweb.ucsd.edu/~viscomp/projects/SIGA24COFLIP/',
  },
  covector: {
    name: 'Covector Fluids',
    url: 'http://cseweb.ucsd.edu/~viscomp/projects/SIG22CovectorFluids/',
  },
  kelvin: {
    name: 'Kelvin Transform',
    url: 'http://cseweb.ucsd.edu/~viscomp/projects/SIG21KelvinTransform/',
  },
  extcourse: {
    name: 'Exterior Calculus in Computer Graphics',
    url: 'https://stephaniewang.page/ExteriorCalculusInGraphics/',
  },
  schrodinger: {
    name: 'Schrödinger Bridges on Discretized Geometric Domains',
    url: 'https://lmattos.com/projects/bridges-geometric-domains.html',
  },
  walkondecomposed: {
    name: 'Walk on Decomposed Subdomains',
    url: 'https://clementjambon.github.io/wods',
  },
  tangentblowup: {
    name: 'Tangent Blow-Ups',
    url: 'https://diglib.eg.org/items/3695e41a-61b5-40f3-b35b-7ad8895b9deb',
  },
};

const SIDEBAR_TYPES = new Set(['milestone', 'award', 'publication', 'service', 'attendance', 'course']);
const TALK_TYPES = new Set(['talk', 'conference', 'course']);
const SIDEBAR_VISIBLE = 5;

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

let allNewsItems = [];

function formatDateLong(dateStr) {
  const [year, month] = dateStr.split('-');
  return `${MONTHS[parseInt(month, 10) - 1]}. ${year}`;
}

function formatDateShort(dateStr) {
  const [year, month] = dateStr.split('-');
  return `${MONTHS[parseInt(month, 10) - 1]}. ${year}`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function paperName(paperKey) {
  return paperKey && PAPERS[paperKey] ? PAPERS[paperKey].name : '';
}

function isUpcoming(item) {
  if (item.upcoming != null) return item.upcoming;
  const parts = item.date.split('-').map(Number);
  const now = new Date();
  const itemEnd = parts.length === 3
    ? new Date(parts[0], parts[1] - 1, parts[2])
    : new Date(parts[0], parts[1], 0);
  return now <= itemEnd;
}

function sidebarSentence(item) {
  const paper = paperName(item.paper);
  const paperHtml = item.paper && PAPERS[item.paper]?.url
    ? `<a href="${PAPERS[item.paper].url}">${escapeHtml(paper)}</a>`
    : paper
      ? `<em>${escapeHtml(paper)}</em>`
      : '';

  if (item.type === 'milestone' && item.event === 'PhD defense') {
    const thesis = item.detail
      ? `<a href="${item.links?.detail || '#'}">${escapeHtml(item.detail)}</a>`
      : 'my PhD thesis';
    return `Defended ${thesis} at UC San Diego.`;
  }

  if (item.type === 'milestone') {
    return `Started as a PostDoc at MIT with Justin Solomon.`;
  }

  if (item.type === 'service') {
    return `Co-organizing the ${escapeHtml(item.detail || item.event)}.`;
  }

  if (item.type === 'attendance') {
    const verb = isUpcoming(item) ? 'Will attend' : 'Attended';
    const loc = item.location ? ` in ${escapeHtml(item.location)}` : '';
    return `${verb} ${escapeHtml(item.event)}${loc}.`;
  }

  if (item.type === 'course') {
    const courseName = item.detail || paperName(item.paper);
    const venue = escapeHtml(item.event);
    const verb = item.cotaught ? 'Co-taught' : 'Taught';
    if (courseName) {
      return `${verb} ${escapeHtml(courseName)} at ${venue}.`;
    }
    return `${verb} a course at ${venue}.`;
  }

  if (item.type === 'award') {
    return `${paperHtml} received a ${escapeHtml(item.event)} at ${escapeHtml(item.detail || item.event)}.`;
  }

  if (item.type === 'publication') {
    if (item.detail) {
      return `${paperHtml} received a ${escapeHtml(item.detail)} at ${escapeHtml(item.event)}.`;
    }
    const status = 'accepted';
    return `${paperHtml} was ${status} at ${escapeHtml(item.event)}.`;
  }

  return escapeHtml(item.event);
}

function renderSidebarItem(item) {
  return `
    <li class="news-sidebar-item">
      <span class="news-sidebar-date">${formatDateLong(item.date)}</span>
      <span class="news-sidebar-text">${sidebarSentence(item)}</span>
    </li>
  `;
}

function renderSidebar(items, expanded) {
  const sidebarItems = items.filter((item) => SIDEBAR_TYPES.has(item.type));
  const visible = expanded ? sidebarItems : sidebarItems.slice(0, SIDEBAR_VISIBLE);
  const list = document.getElementById('news-sidebar-list');
  const toggle = document.getElementById('news-sidebar-toggle');

  if (!list) return;

  if (!sidebarItems.length) {
    list.innerHTML = '<li class="news-sidebar-item news-sidebar-empty">No recent updates.</li>';
    if (toggle) toggle.hidden = true;
    return;
  }

  list.innerHTML = visible.map((item) => renderSidebarItem(item)).join('');

  if (toggle) {
    if (sidebarItems.length > SIDEBAR_VISIBLE) {
      toggle.hidden = false;
      toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      toggle.textContent = expanded ? 'Show less' : 'Show more';
    } else {
      toggle.hidden = true;
    }
  }
}

function talkTitle(item) {
  const paper = paperName(item.paper);
  if (item.type === 'course') {
    if (item.detail) return `${item.detail}, ${item.event}`;
    return paper ? `${paper}, ${item.event}` : item.event;
  }
  if (paper) {
    return `${paper}, ${item.event}`;
  }
  return item.event;
}

function talkVenue(item) {
  const parts = [];
  if (item.location) parts.push(item.location);
  if (item.remote) parts.push('remote');
  return parts.join(' · ') || '—';
}

function talkLinks(links) {
  if (!links) return '';
  const parts = [];
  if (links.recording) {
    parts.push(
      `<a href="${links.recording}" class="compact-link"><i class="fas fa-play-circle"></i> Recording</a>`
    );
  }
  if (links.detail) {
    parts.push(
      `<a href="${links.detail}" class="compact-link"><i class="fas fa-link"></i> Link</a>`
    );
  }
  return parts.join(' ');
}

function renderTalksTable(items) {
  const tbody = document.getElementById('talks-table-body');
  if (!tbody) return;

  const talks = items.filter((item) => TALK_TYPES.has(item.type));

  tbody.innerHTML = talks
    .map(
      (item) => `
    <tr>
      <td class="compact-date">${formatDateShort(item.date)}</td>
      <td class="compact-title">${escapeHtml(talkTitle(item))}</td>
      <td class="compact-venue">${escapeHtml(talkVenue(item))}</td>
      <td class="compact-links">${talkLinks(item.links)}</td>
    </tr>
  `
    )
    .join('');
}

function renderAwardsTable(awards) {
  const tbody = document.getElementById('awards-table-body');
  if (!tbody) return;

  tbody.innerHTML = awards
    .map(
      (item) => `
    <tr>
      <td class="compact-year">${escapeHtml(item.year)}</td>
      <td class="compact-title">${escapeHtml(item.title)}</td>
      <td class="compact-detail">
        ${escapeHtml(item.detail || '')}
        ${item.links?.detail ? ` <a href="${item.links.detail}" class="compact-link">Details</a>` : ''}
      </td>
    </tr>
  `
    )
    .join('');
}

async function initNews() {
  try {
    const [newsRes, awardsRes] = await Promise.all([
      fetch('./news.json'),
      fetch('./awards.json'),
    ]);

    if (!newsRes.ok) throw new Error('Failed to load news');
    if (!awardsRes.ok) throw new Error('Failed to load awards');

    allNewsItems = await newsRes.json();
    const awards = await awardsRes.json();

    allNewsItems.sort((a, b) => b.date.localeCompare(a.date));

    renderSidebar(allNewsItems, false);
    renderTalksTable(allNewsItems);
    renderAwardsTable(awards);

    const sidebarToggle = document.getElementById('news-sidebar-toggle');
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', () => {
        const expanded = sidebarToggle.getAttribute('aria-expanded') === 'true';
        renderSidebar(allNewsItems, !expanded);
      });
    }
  } catch (err) {
    const list = document.getElementById('news-sidebar-list');
    if (list) {
      list.innerHTML =
        '<li class="news-sidebar-item news-sidebar-empty">Could not load news.</li>';
    }
    console.error(err);
  }
}

function initNav() {
  const nav = document.getElementById('site-nav');
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');

  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('nav-links--open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    links.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        links.classList.remove('nav-links--open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  if (nav) {
    const onScroll = () => {
      nav.classList.toggle('site-nav--scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initNews();
  initNav();
});
