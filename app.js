const $ = selector => document.querySelector(selector);
const key = 'rooznegar-v1';
const number = new Intl.NumberFormat('fa-IR');
const persianDate = new Intl.DateTimeFormat('fa-IR', {dateStyle: 'medium'});
const fullPersianDate = new Intl.DateTimeFormat('fa-IR', {dateStyle: 'full'});
let kind = 1;
const persianMonth = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {month: 'long', year: 'numeric'});
const persianYear = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {year: 'numeric'});
let reportPeriod = 'day';
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
state.actions ??= [];
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
  const cards = state.habits.filter(habit => habit.type === kind &&
    (!habit.archived || selected.entries[habit.id])).map(habit => {
    const card = element('article', '', 'entry');
    const heading = element('div', '', 'row');
    const count = element('input');
    count.type = 'number';
    count.min = '0';
    count.max = '999';
    count.value = selected.entries[habit.id]?.count || 0;
    const update = () => {
      if (!count.validity.valid) return;
      const entry = selected.entries[habit.id] ??= {count: 0};
      const next = Number(count.value);
      const change = next - entry.count;
      if (!change) return;
      entry.count = next;
      entry.credits ??= {};
      for (const action of state.actions) {
        const previous = entry.credits[action.id] || 0;
        const delta = change < 0 ? -Math.min(previous, -change) :
          action.habitIds.includes(habit.id) ? change : 0;
        if (!delta) continue;
        entry.credits[action.id] = previous + delta;
        action.pending = Math.max(0, action.pending + delta);
      }
      save();
    };
    count.addEventListener('input', update);
    const counter = element('div', '', 'counter');
    count.setAttribute('aria-label', 'تعداد ' + habit.title);
    for (const [step, symbol, label] of [[1, '+', 'افزایش'], [-1, '−', 'کاهش']]) {
      const button = element('button', symbol);
      button.setAttribute('aria-label', label + ' تعداد ' + habit.title);
      button.onclick = () => {
        count.value = Math.max(0, Math.min(999, (Number(count.value) || 0) + step));
        update();
      };
      counter.append(button);
      if (step === 1) counter.append(count);
    }
    heading.append(element('strong', habit.title), counter);
    const score = (habit.type > 0 ? '+' : '−') + number.format(habit.weight);
    card.append(heading, element('p', score + ' امتیاز برای هر بار'));
    return card;
  });
  $('#entries').replaceChildren(...(cards.length ? cards : [element('p', 'از بخش اطلاعات پایه یک رفتار اضافه کنید.')]));
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
      renderActionLinks();
      renderEntries();
    };
    row.append(element('strong', habit.title + ' · ' + number.format(habit.weight) + ' امتیاز'), toggle);
    item.append(row);
    return item;
  }));
}

function dayScores(date, behaviorCounts) {
  const scores = {positive: 0, negative: 0, goodCount: 0, badCount: 0};
  for (const habit of state.habits) {
    const entry = state.days[date]?.entries[habit.id];
    if (!entry) continue;
    scores[habit.type === 1 ? 'positive' : 'negative'] += habit.weight * entry.count;
    scores[habit.type === 1 ? 'goodCount' : 'badCount'] += entry.count;
    behaviorCounts.set(habit.id, (behaviorCounts.get(habit.id) || 0) + entry.count);
  }
  return scores;
}

function shiftDate(date, days) {
  const shifted = new Date(date);
  shifted.setDate(date.getDate() + days);
  return shifted;
}

function reportRange(date, period) {
  if (period === 'day') return {start: date, end: date, label: persianDate.format(date)};
  if (period === 'week') {
    const start = shiftDate(date, -((date.getDay() + 1) % 7));
    const end = shiftDate(start, 6);
    return {start, end, label: persianDate.formatRange(start, end)};
  }

  const formatter = period === 'month' ? persianMonth : persianYear;
  const label = formatter.format(date);
  let start = date;
  let end = date;
  while (formatter.format(shiftDate(start, -1)) === label) start = shiftDate(start, -1);
  while (formatter.format(shiftDate(end, 1)) === label) end = shiftDate(end, 1);
  return {start, end, label: period === 'year' ? 'سال ' + label : label};
}

function renderReports() {
  const date = new Date($('#date').value + 'T12:00:00');
  const {start, end, label} = reportRange(date, reportPeriod);
  $('#range').textContent = label;
  const totals = {positive: 0, negative: 0, goodCount: 0, badCount: 0};
  const behaviorCounts = new Map();
  for (let current = start; current <= end; current = shiftDate(current, 1)) {
    const scores = dayScores(iso(current), behaviorCounts);
    for (const field of Object.keys(totals)) totals[field] += scores[field];
  }
  const positive = totals.positive;
  const negative = totals.negative;
  const stats = element('div', '', 'stats');
  stats.append(...[['مثبت', positive], ['منفی', negative], ['خالص', positive - negative]]
    .map(([label, value]) => element('span', label + ' ' + number.format(value))));
  $('#summary').replaceChildren(stats);
  const chart = $('#chart');
  if (positive || negative) {
    const row = element('div', '', 'chart-row');
    const bars = element('div');
    for (const [field, caption] of [['positive', 'مثبت'], ['negative', 'منفی']]) {
      const bar = element('progress', '', field);
      bar.max = Math.max(positive, negative);
      bar.value = totals[field];
      bars.append(inputLabel(caption + ' ' + number.format(totals[field]), bar));
    }
    row.append(element('span', 'جمع بازه'), bars);
    chart.replaceChildren(row);
  } else {
    chart.replaceChildren(element('p', 'در این بازه امتیازی ثبت نشده است.'));
  }
  renderBreakdown(totals.goodCount, totals.badCount);
  const ranked = state.habits
    .map(habit => ({...habit, count: behaviorCounts.get(habit.id) || 0}))
    .filter(habit => habit.count > 0)
    .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title, 'fa'));
  renderPareto($('#good-pareto'), ranked.filter(habit => habit.type === 1), totals.goodCount);
  renderPareto($('#bad-pareto'), ranked.filter(habit => habit.type === -1), totals.badCount);
}

function renderPareto(panel, ranked, total) {
  if (!ranked.length) {
    panel.replaceChildren(element('p', 'در این بازه موردی ثبت نشده است.'));
    return;
  }

  const percent = new Intl.NumberFormat('fa-IR', {style: 'percent', maximumFractionDigits: 1});
  const list = element('ol', '', 'pareto-list');
  let cumulative = 0;
  for (const {title, count} of ranked) {
    cumulative += count;
    const item = element('li');
    const bar = element('progress');
    bar.max = ranked[0].count;
    bar.value = count;
    bar.setAttribute('aria-hidden', 'true');
    const row = element('div', '', 'row');
    row.append(element('strong', title), element('span', number.format(count) + ' بار'));
    item.append(row, bar, element('small', 'سهم تجمعی ' + percent.format(cumulative / total)));
    list.append(item);
  }
  panel.replaceChildren(list);
}

function renderBreakdown(good, bad) {
  const total = good + bad;
  const panel = $('#breakdown');
  if (!total) {
    panel.replaceChildren(element('p', 'در این بازه رفتاری ثبت نشده است.'));
    return;
  }

  const pie = element('div', '', 'report-pie');
  pie.setAttribute('aria-hidden', 'true');
  pie.style.setProperty('--good-share', (100 * good / total) + '%');
  const percent = new Intl.NumberFormat('fa-IR', {style: 'percent', maximumFractionDigits: 1});
  const legend = element('ul', '', 'report-legend');
  for (const [label, count, tone] of [['خوبی‌ها', good, 'good'], ['بدی‌ها', bad, 'bad']]) {
    legend.append(element('li', label + ' · ' + number.format(count) + ' مورد · ' +
      percent.format(count / total), tone));
  }
  panel.replaceChildren(pie, legend);
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

function selectDay(value) {
  $('#date').value = value;
  $('#selected-day').textContent = fullPersianDate.format(new Date(value + 'T12:00:00'));
  renderEntries();
  renderReports();
}

function moveDay(step) {
  const date = new Date($('#date').value + 'T12:00:00');
  date.setDate(date.getDate() + step);
  selectDay(iso(date));
}

$('#date').onchange = () => selectDay($('#date').value || iso(new Date()));
$('#prev').onclick = () => moveDay(-1);
$('#next').onclick = () => moveDay(1);
$('#today').onclick = () => selectDay(iso(new Date()));
for (const button of document.querySelectorAll('[data-kind]')) {
  button.onclick = () => {
    kind = Number(button.dataset.kind);
    for (const tab of document.querySelectorAll('[data-kind]')) {
      tab.setAttribute('aria-pressed', String(tab === button));
    }
    renderEntries();
  };
}
for (const button of document.querySelectorAll('[data-period]')) {
  button.onclick = () => {
    reportPeriod = button.dataset.period;
    for (const period of document.querySelectorAll('[data-period]')) {
      period.setAttribute('aria-pressed', String(period === button));
    }
    renderReports();
  };
}
$('#habit-form').onsubmit = event => {
  event.preventDefault();
  const data = new FormData(event.target);
  const title = data.get('title').trim();
  if (!title) return;
  state.habits.push({id: crypto.randomUUID(), title, type: Number(data.get('type')),
    weight: Number(data.get('weight'))});
  event.target.reset();
  save();
  renderHabits();
  renderActionLinks();
  renderEntries();
};
function renderActionLinks() {
  const links = $('#action-links');
  const active = state.habits.filter(habit => !habit.archived);
  links.replaceChildren(...active.map(habit => {
    const checkbox = element('input');
    checkbox.type = 'checkbox';
    checkbox.name = 'habit';
    checkbox.value = habit.id;
    return inputLabel((habit.type === 1 ? 'خوبی · ' : 'بدی · ') + habit.title, checkbox);
  }));
  if (!active.length) links.append(element('p', 'ابتدا یک رفتار تعریف یا فعال کنید.'));
  $('#action-form button').disabled = !active.length;
}

function actionType(action) {
  return action.type === 1 ? 'پاداش' : 'جریمه';
}

function renderActionDefinitions() {
  $('#action-definitions').replaceChildren(...state.actions.map(action => {
    const item = element('li');
    const names = state.habits.filter(habit => action.habitIds.includes(habit.id)).map(habit => habit.title);
    item.append(element('strong', actionType(action) + ' · ' + action.title),
      element('p', names.join('، ')));
    return item;
  }));
}

function renderActionQueue() {
  const queue = $('#action-queue');
  queue.replaceChildren(...state.actions.filter(action => action.pending > 0).map(action => {
    const item = element('li', '', 'row');
    const counter = element('div', '', 'counter');
    const total = element('output', number.format(action.pending));
    const increase = element('button', '+');
    const decrease = element('button', '−');
    increase.setAttribute('aria-label', 'افزایش تعداد ' + action.title);
    decrease.setAttribute('aria-label', 'ثبت یک بار انجام ' + action.title);
    increase.onclick = () => adjust(1);
    decrease.onclick = () => adjust(-1);
    function adjust(change) {
      action.pending += change;
      save();
      total.textContent = number.format(action.pending);
      if (!action.pending) {
        renderActionQueue();
        $('#actions h2').focus();
      }
    }
    counter.append(increase, total, decrease);
    item.append(element('strong', actionType(action) + ' · ' + action.title), counter);
    return item;
  }));
  if (!queue.children.length) queue.append(element('li', 'پاداش یا جریمه‌ای برای انجام وجود ندارد.'));
}

$('#action-form').onsubmit = event => {
  event.preventDefault();
  const data = new FormData(event.target);
  const title = data.get('title').trim();
  const habitIds = data.getAll('habit');
  if (!title || !habitIds.length) {
    $('#status').textContent = 'عنوان و دست‌کم یک رفتار مرتبط را وارد کنید.';
    return;
  }
  state.actions.push({id: crypto.randomUUID(), title, type: Number(data.get('type')), habitIds, pending: 0});
  event.target.reset();
  save();
  renderActionDefinitions();
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
    $('#day-picker').hidden = !['daily', 'reports'].includes(button.dataset.tab);
    if (button.dataset.tab === 'actions') renderActionQueue();
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
selectDay(iso(new Date()));
renderHabits();
renderFollow();
renderActionLinks();
renderActionDefinitions();
