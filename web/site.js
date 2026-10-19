const grid = document.getElementById('demo-grid');
for (let i = 0; i < 35; i++) {
  const day = i - 2;
  const actual = day < 1 ? day + 30 : day > 31 ? day - 31 : day;
  const lunar = day <= 9 ? day + 20 : day - 9;
  const span = document.createElement('span');
  span.className = day === 19 ? 'today' : day < 1 || day > 31 ? 'outside' : '';
  span.textContent = String(actual);
  const small = document.createElement('small');
  small.textContent = day === 10 ? '1/9' : String(lunar);
  span.append(small); grid.append(span);
}
fetch('/release.json').then(response => { if (!response.ok) throw new Error('metadata'); return response.json(); }).then(release => {
  document.querySelectorAll('[data-version]').forEach(el => { el.textContent = `v${release.version}`; });
  document.querySelectorAll('[data-download]').forEach(el => {
    const key = el.dataset.download;
    const href = release[key];
    // Keep downloads restricted to the project's official GitHub releases.
    if (typeof href === 'string' && href.startsWith('https://github.com/Phuc776/lunar_calendar/releases/')) el.href = href;
  });
}).catch(() => { /* The HTML retains working links to the releases page. */ });
