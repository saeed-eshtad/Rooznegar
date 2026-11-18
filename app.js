const $ = selector => document.querySelector(selector);
const key = 'rooznegar-v1';
const number = new Intl.NumberFormat('fa-IR');
const persianDate = new Intl.DateTimeFormat('fa-IR', {dateStyle: 'medium'});
const iso = date => [date.getFullYear(), date.getMonth() + 1, date.getDate()]
  .map((part, index) => String(part).padStart(index ? 2 : 4, '0')).join('-');
const state = JSON.parse(localStorage.getItem(key) || 'null') || {
  habits: [
    {id: 'kindness', title: 'کمک به دیگران', type: 1, weight: 1, action: ''},
    {id: 'prayer', title: 'نماز اول وقت', type: 1, weight: 1, action: ''},
    {id: 'anger', title: 'تندی در گفتار', type: -1, weight: 1, action: 'در صورت نیاز عذرخواهی کنم'}
  ],
  days: {},
  follow: []
};
const day = () => state.days[$('#date').value] ??= {entries: {}, gratitude: ''};
$('#date').value = iso(new Date());

function save() {
  try {
    localStorage.setItem(key, JSON.stringify(state));
    $('#status').textContent = 'ذخیره شد';
  } catch {
    $('#status').textContent = 'ذخیره انجام نشد. فضای مرورگر را بررسی کنید.';
  }
}

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function inputLabel(text, input) {
  const label = element('label', text);
  label.append(input);
  return label;
}

function renderEntries() {
  const selected = day();
  $('#gratitude').value = selected.gratitude;
  const cards = state.habits.filter(habit => !habit.archived || selected.entries[habit.id]).map(habit => {
    const card = element('article', '', 'entry');
    const heading = element('div', '', 'row');
    const count = element('input');
    count.type = 'number';
    count.min = '0';
    count.max = '999';
    count.value = selected.entries[habit.id]?.count || 0;
    const note = element('textarea');
    note.rows = 2;
    note.value = selected.entries[habit.id]?.note || '';
    const update = () => {
      if (!count.validity.valid) return;
      selected.entries[habit.id] = {count: Number(count.value), note: note.value};
      save();
    };
    count.addEventListener('input', update);
    note.addEventListener('input', update);
    heading.append(element('strong', habit.title), inputLabel('تعداد', count));
    const score = (habit.type > 0 ? '+' : '−') + number.format(habit.weight);
    card.append(heading, element('p', score + ' امتیاز برای هر بار' + (habit.action ? ' · ' + habit.action : '')),
      inputLabel('یادداشت رفتار', note));
    return card;
  });
  $('#entries').replaceChildren(...(cards.length ? cards : [element('p', 'از بخش رفتارها یک رفتار اضافه کنید.')]));
}

function renderHabits() {
  $('#habit-list').replaceChildren(...state.habits.map(habit => {
    const item = element('li');
    const row = element('div', '', 'row');
    const toggle = element('button', habit.archived ? 'فعال‌سازی' : 'بایگانی');
    toggle.onclick = () => {
      habit.archived = !habit.archived;
      save();
      renderHabits();
      renderEntries();
    };
    row.append(element('strong', habit.title), toggle);
    item.append(row);
    return item;
  }));
}

function dayScores(date) {
  const scores = {positive: 0, negative: 0};
  for (const habit of state.habits) {
    const entry = state.days[date]?.entries[habit.id];
    if (!entry) continue;
    scores[habit.type === 1 ? 'positive' : 'negative'] += habit.weight * entry.count;
  }
  return scores;
}

function renderReports() {
  const count = Number($('#period').value);
  const end = new Date($('#date').value + 'T12:00:00');
  const days = Array.from({length: count}, (_, index) => {
    const date = new Date(end);
    date.setDate(end.getDate() - index);
    return {date, ...dayScores(iso(date))};
  });
  $('#range').textContent = persianDate.formatRange(days.at(-1).date, end);
  const total = field => days.reduce((sum, item) => sum + item[field], 0);
  const positive = total('positive');
  const negative = total('negative');
  const stats = element('div', '', 'stats');
  stats.append(...[['مثبت', positive], ['منفی', negative], ['خالص', positive - negative]]
    .map(([label, value]) => element('span', label + ' ' + number.format(value))));
  $('#summary').replaceChildren(stats);
  const maximum = Math.max(1, ...days.flatMap(item => [item.positive, item.negative]));
  const active = days.filter(item => item.positive || item.negative);
  $('#chart').replaceChildren(...active.map(item => {
    const row = element('div', '', 'chart-row');
    const bars = element('div');
    for (const [field, label] of [['positive', 'مثبت'], ['negative', 'منفی']]) {
      const bar = element('progress', '', field);
      bar.max = maximum;
      bar.value = item[field];
      bars.append(inputLabel(label + ' ' + number.format(item[field]), bar));
    }
    row.append(element('span', persianDate.format(item.date)), bars);
    return row;
  }));
  if (!active.length) $('#chart').append(element('p', 'در این بازه امتیازی ثبت نشده است.'));
}

function renderFollow() {
  $('#follow-list').replaceChildren(...state.follow.map(record => {
    const item = element('li');
    const row = element('div', '', 'row');
    const checkbox = element('input');
    checkbox.type = 'checkbox';
    checkbox.checked = record.done;
    checkbox.onchange = () => {
      record.done = checkbox.checked;
      save();
    };
    row.append(element('strong', record.title), inputLabel('انجام شد', checkbox));
    item.append(row, element('p', record.category + ' · ' + persianDate.format(new Date(record.date + 'T12:00:00'))));
    if (record.details) item.append(element('p', record.details));
    return item;
  }));
}

$('#date').onchange = () => {
  if (!$('#date').value) $('#date').value = iso(new Date());
  renderEntries();
  renderReports();
};
$('#period').onchange = renderReports;
$('#gratitude').oninput = event => {
  day().gratitude = event.target.value;
  save();
};
$('#habit-form').onsubmit = event => {
  event.preventDefault();
  const data = new FormData(event.target);
  const title = data.get('title').trim();
  if (!title) return;
  state.habits.push({id: crypto.randomUUID(), title, type: Number(data.get('type')),
    weight: Number(data.get('weight')), action: data.get('action').trim()});
  event.target.reset();
  save();
  renderHabits();
  renderEntries();
};
$('#follow-form').onsubmit = event => {
  event.preventDefault();
  const data = new FormData(event.target);
  const title = data.get('title').trim();
  if (!title) return;
  state.follow.unshift({title, category: data.get('category'), details: data.get('details').trim(),
    date: $('#date').value, done: false});
  event.target.reset();
  save();
  renderFollow();
};
for (const button of document.querySelectorAll('nav button')) {
  button.onclick = () => {
    for (const other of document.querySelectorAll('nav button')) other.removeAttribute('aria-current');
    button.setAttribute('aria-current', 'page');
    for (const panel of document.querySelectorAll('.panel')) panel.hidden = panel.id !== button.dataset.tab;
    if (button.dataset.tab === 'reports') renderReports();
  };
}
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  const button = $('#install');
  button.hidden = false;
  button.onclick = async () => {
    button.hidden = true;
    await event.prompt();
  };
});
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(console.error);
renderEntries();
renderHabits();
renderFollow();
