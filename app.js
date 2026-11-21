const $ = selector => document.querySelector(selector);
const demo = new URLSearchParams(location.search).get('demo') === '1';
const key = demo ? 'rooznegar-demo-v1' : 'rooznegar-v1';
const number = new Intl.NumberFormat('fa-IR');
const persianDate = new Intl.DateTimeFormat('fa-IR', {dateStyle: 'medium'});
const fullPersianDate = new Intl.DateTimeFormat('fa-IR', {dateStyle: 'full'});
let kind = 1;
const basicTypes = {
  good: {type: 1, label: 'خوبی', section: 'habit'},
  bad: {type: -1, label: 'بدی', section: 'habit'},
  reward: {type: 1, label: 'پاداش', section: 'action'},
  penalty: {type: -1, label: 'جریمه', section: 'action'}
};
let basicCategory = basicTypes.good;
let editingItem = null;
const persianMonth = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {month: 'long', year: 'numeric'});
const persianYear = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {year: 'numeric'});
let reportPeriod = 'day';
let activeTab = 'daily';
const persianDay = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', {day: 'numeric'});
const iso = date => [date.getFullYear(), date.getMonth() + 1, date.getDate()]
  .map((part, index) => String(part).padStart(index ? 2 : 4, '0')).join('-');
const scheduleDate = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', {
  month: 'numeric', day: 'numeric'
});
const scheduleGroups = [
  {name: 'months', title: 'ماه‌های ارزیابی', labels: [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ]},
  {name: 'weeks', title: 'هفته‌های ماه', labels: ['اول', 'دوم', 'سوم', 'چهارم', 'پنجم'],
    hint: 'هفتهٔ اول روزهای ۱ تا ۷ ماه است و هفتهٔ پنجم از روز ۲۹ آغاز می‌شود.'},
  {name: 'weekdays', title: 'روزهای هفته', labels: [
    'شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'
  ]}
];
const state = JSON.parse(localStorage.getItem(key) || 'null') ||
  (demo ? makeDemoState() : makeStarterState());
state.actions ??= [];
const day = () => state.days[$('#date').value] ??= {entries: {}, gratitude: ''};
$('#date').value = iso(new Date());

function makeStarterState() {
  const examples = [
    [1, 'کمک به دیگران', 2, 'وقت آزاد برای سرگرمی دلخواه', 1],
    [1, 'نماز اول وقت', 3, 'استراحت با یک فنجان چای', 1],
    [1, 'مطالعه', 2, 'گوش دادن به موسیقی دلخواه', 1],
    [1, 'ورزش', 2, 'قدم‌زدن در پارک', 1],
    [1, 'وفای به عهد', 3, 'تماشای یک برنامهٔ دلخواه', 1],
    [-1, 'تندی در گفتار', 3, 'عذرخواهی و گفت‌وگوی آرام', 1],
    [-1, 'دیر رسیدن', 2, 'تنظیم یادآور برای قرار بعدی', 1],
    [-1, 'به‌تعویق‌انداختن کارها', 2, 'انجام یک کار عقب‌افتاده', 1],
    [-1, 'اسراف غذا', 2, 'برنامه‌ریزی برای استفاده از غذای باقی‌مانده', 1],
    [-1, 'بدقولی', 3, 'صلوات', 100]
  ];
  const habits = [];
  const actions = [];
  for (const [index, [type, title, weight, actionTitle, quantity]] of examples.entries()) {
    const id = 'starter-habit-' + index;
    habits.push({id, type, title, weight});
    actions.push({id: 'starter-action-' + index, type, title: actionTitle,
      habitIds: [id], quantity, pending: 0});
  }
  return {habits, actions, days: {}};
}

function makeDemoState() {
  const examples = [
    [1, 'نماز اول وقت', 'استراحت با یک فنجان چای'],
    [1, 'کمک به دیگران', 'تماشای یک قسمت از برنامهٔ دلخواه'],
    [1, 'مطالعه', 'گوش دادن به موسیقی دلخواه'],
    [1, 'ورزش', 'رفتن به پارک'],
    [1, 'وفای به عهد', 'آماده کردن میان‌وعدهٔ دلخواه'],
    [1, 'تماس با والدین', 'وقت گذاشتن برای یک سرگرمی'],
    [1, 'خوش‌رفتاری', 'نوشیدن قهوه در کافه'],
    [1, 'مرتب‌کردن خانه', 'وقت آزاد برای مطالعهٔ داستان'],
    [1, 'پس‌انداز', 'برنامه‌ریزی برای یک گردش'],
    [1, 'وقت‌گذاشتن برای خانواده', 'انتخاب یک فیلم برای تماشای خانوادگی'],
    [-1, 'دیر رسیدن', 'تنظیم یادآور برای قرار بعدی'],
    [-1, 'تندی در گفتار', 'عذرخواهی و گفت‌وگوی آرام'],
    [-1, 'به‌تعویق‌انداختن کارها', 'انجام یک کار عقب‌افتاده'],
    [-1, 'استفادهٔ زیاد از گوشی', 'تنظیم محدودیت زمانی برای گوشی'],
    [-1, 'بدقولی', 'پیگیری و جبران قول انجام‌نشده'],
    [-1, 'اسراف غذا', 'برنامه‌ریزی برای مصرف باقی‌ماندهٔ غذا'],
    [-1, 'حواس‌پرتی هنگام گفت‌وگو', 'تمرین گوش‌دادن بدون گوشی'],
    [-1, 'خرید غیرضروری', 'مرور مخارج روزانه'],
    [-1, 'دیر خوابیدن', 'تنظیم یادآور زمان خواب'],
    [-1, 'بی‌نظمی', 'مرتب‌کردن فضای کار']
  ];
  let seed = 14031404;
  function random() {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  const habits = examples.map(([type, title], index) => ({
    id: 'demo-habit-' + index, type, title, weight: 1 + Math.floor(random() * 20)
  }));
  const actions = examples.map(([type, , title], index) => ({
    id: 'demo-action-' + index, type, title, habitIds: [habits[index].id], pending: 0
  }));
  const days = {};
  const first = new Date('2024-03-20T12:00:00');
  const last = new Date('2026-03-20T12:00:00');
  for (let date = first; date <= last; date = shiftDate(date, 1)) {
    const entries = {};
    for (const [index, habit] of habits.entries()) {
      const frequency = (habit.type === 1 ? 0.75 : 0.48) - 0.045 * (index % 10);
      if (random() >= frequency) continue;
      const count = 1 + Math.floor(random() * (index % 3 + 2));
      const action = actions[index];
      entries[habit.id] = {count, credits: {[action.id]: count}};
      // Older demo items are completed, leaving a short queue to try.
      if (date >= shiftDate(last, -6) && random() < 0.3) action.pending += count;
    }
    days[iso(date)] = {entries};
  }
  return {habits, actions, days};
}

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

function scheduleMatches(schedule, date) {
  if (!schedule) return true;
  const parts = scheduleDate.formatToParts(date);
  const month = Number(parts.find(part => part.type === 'month').value);
  const dayOfMonth = Number(parts.find(part => part.type === 'day').value);
  const week = Math.ceil(dayOfMonth / 7);
  const weekday = (date.getDay() + 1) % 7 + 1;
  return schedule.months.includes(month) && schedule.weeks.includes(week) &&
    schedule.weekdays.includes(weekday);
}

function renderHabitSchedule() {
  const fields = scheduleGroups.map(({name, title, labels, hint}) => {
    const field = element('fieldset', '', 'schedule-field');
    const all = element('input');
    all.type = 'checkbox';
    all.defaultChecked = true;
    const choices = element('div', '', 'schedule-choices');
    const boxes = labels.map((label, index) => {
      const input = element('input');
      input.type = 'checkbox';
      input.name = name;
      input.value = index + 1;
      input.defaultChecked = true;
      choices.append(inputLabel(label, input));
      return input;
    });

    function syncSelection() {
      const count = boxes.filter(box => box.checked).length;
      all.checked = count === boxes.length;
      all.indeterminate = count > 0 && count < boxes.length;
      boxes[0].setCustomValidity(count ? '' : 'دست‌کم یک گزینه انتخاب کنید.');
    }

    all.onchange = () => {
      for (const box of boxes) box.checked = all.checked;
      syncSelection();
    };
    for (const box of boxes) box.onchange = syncSelection;
    $('#habit-form').addEventListener('reset', () => queueMicrotask(syncSelection));
    field.append(element('legend', title), inputLabel('انتخاب همه', all));
    if (hint) field.append(element('small', hint));
    field.append(choices);
    return field;
  });
  $('#habit-schedule').replaceChildren(...fields);
}

function updateActionCredits(entry, habit, change) {
  entry.credits ??= {};
  for (const action of state.actions) {
    const recorded = entry.credits[action.id];
    const batches = Array.isArray(recorded) ? recorded :
      recorded ? [{count: recorded, quantity: 1}] : [];
    let units = 0;
    if (change > 0 && !action.archived && action.type === habit.type && action.habitIds.includes(habit.id)) {
      const quantity = action.quantity ?? 1;
      const last = batches.at(-1);
      if (last?.quantity === quantity) last.count += change;
      else batches.push({count: change, quantity});
      units = quantity * change;
    } else if (change < 0) {
      let remaining = -change;
      while (remaining && batches.length) {
        const last = batches.at(-1);
        const removed = Math.min(last.count, remaining);
        last.count -= removed;
        remaining -= removed;
        units -= removed * last.quantity;
        if (!last.count) batches.pop();
      }
    }
    if (!units) continue;
    if (batches.length) entry.credits[action.id] = batches;
    else delete entry.credits[action.id];
    action.pending = Math.max(0, action.pending + units);
  }
}

function renderEntries() {
  const selected = day();
  const date = new Date($('#date').value + 'T12:00:00');
  const cards = state.habits.filter(habit => habit.type === kind &&
    (!habit.archived || selected.entries[habit.id]) && (selected.entries[habit.id]?.count > 0 || scheduleMatches(habit.schedule, date))).map(habit => {
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
      updateActionCredits(entry, habit, change);
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
  $('#entries').replaceChildren(...(cards.length ? cards : [element('p', 'برای این تاریخ رفتاری در این دسته برنامه‌ریزی نشده است.')]));
}

function definitionControls(item, refresh) {
  const controls = element('div', '', 'definition-controls');
  const toggle = element('button', item.archived ? 'فعال‌سازی' : 'بایگانی');
  toggle.onclick = () => {
    item.archived = !item.archived;
    save();
    refresh();
  };
  controls.append(editButton(item), toggle);
  return controls;
}

function renderHabits() {
  $('#habit-list').replaceChildren(...state.habits.filter(habit => habit.type === basicCategory.type).map(habit => {
    const item = element('li');
    item.append(element('strong', habit.title + ' · ' + number.format(habit.weight) + ' امتیاز'),
      definitionControls(habit, () => {
        renderHabits();
        renderActionLinks();
        renderEntries();
      }));
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
  $('#range').hidden = reportPeriod !== 'week';
  renderDatePicker(date, start, end, label);
  const totals = {positive: 0, negative: 0, goodCount: 0, badCount: 0};
  const behaviorCounts = new Map();
  for (let current = start; current <= end; current = shiftDate(current, 1)) {
    const scores = dayScores(iso(current), behaviorCounts);
    for (const field of Object.keys(totals)) totals[field] += scores[field];
  }
  const positive = totals.positive;
  const negative = totals.negative;
  const stats = element('div', '', 'stats');
  stats.append(...[
    ['مثبت', positive, 'score-positive'],
    ['خالص', positive - negative, 'score-net'],
    ['منفی', negative, 'score-negative']
  ].map(([label, value, tone]) => element('span', label + ' ' + number.format(value), tone)));
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

// Lunar month starts transcribed from Iran's official calendar, 1403–1405.
const iranLunarStarts = [
  '2024-03-12', '2024-04-10', '2024-05-10', '2024-06-08',
  '2024-07-07', '2024-08-06', '2024-09-05', '2024-10-05',
  '2024-11-03', '2024-12-03', '2025-01-02', '2025-01-31',
  '2025-03-02', '2025-03-31', '2025-04-29', '2025-05-28',
  '2025-06-27', '2025-07-26', '2025-08-25', '2025-09-24',
  '2025-10-23', '2025-11-22', '2025-12-22', '2026-01-21',
  '2026-02-19', '2026-03-21', '2026-04-19', '2026-05-18',
  '2026-06-16', '2026-07-16', '2026-08-14', '2026-09-13',
  '2026-10-12', '2026-11-11', '2026-12-11', '2027-01-10',
  '2027-02-08', '2027-03-10'
].map(value => Date.parse(value));
const lunarMonthNames = [
  'محرم', 'صفر', 'ربیع‌الاول', 'ربیع‌الثانی', 'جمادی‌الاولی', 'جمادی‌الثانیه',
  'رجب', 'شعبان', 'رمضان', 'شوال', 'ذی‌القعده', 'ذی‌الحجه'
];

function iranLunarDate(date) {
  const civilDate = iso(date);
  if (civilDate < '2024-03-20' || civilDate > '2027-03-20') return '';
  const timestamp = Date.parse(civilDate);
  const index = iranLunarStarts.findLastIndex(start => start <= timestamp);
  const monthOffset = index + 8;
  const day = (timestamp - iranLunarStarts[index]) / 86400000 + 1;
  return number.format(day) + ' ' + lunarMonthNames[monthOffset % 12] + ' ' +
    (1445 + Math.floor(monthOffset / 12)).toLocaleString('fa-IR', {useGrouping: false});
}

function renderDatePicker(date, start, end, label) {
  const period = activeTab === 'reports' ? reportPeriod : 'day';
  const units = {day: 'روز', week: 'هفته', month: 'ماه', year: 'سال'};
  let heading = period === 'day' ? fullPersianDate.format(date) : label;
  if (period === 'week') {
    // A Saturday–Friday week belongs to the month containing its Friday.
    const week = Math.ceil(Number(persianDay.format(end)) / 7);
    const ordinals = ['اول', 'دوم', 'سوم', 'چهارم', 'پنجم'];
    heading = 'هفتهٔ ' + ordinals[week - 1] + ' ' + persianMonth.format(end);
  }
  $('#selected-day').textContent = heading;
  const firstLunar = iranLunarDate(period === 'day' ? date : start);
  const lastLunar = period === 'day' ? firstLunar : iranLunarDate(end);
  $('#lunar-day').textContent = firstLunar && lastLunar
    ? (firstLunar === lastLunar ? firstLunar : firstLunar + ' تا ' + lastLunar) + ' هجری قمری'
    : 'تاریخ قمری رسمی برای این بازه در دسترس نیست.';
  $('#prev').setAttribute('aria-label', units[period] + ' قبل');
  $('#next').setAttribute('aria-label', units[period] + ' بعد');
  $('#date-field').hidden = period !== 'day';
  $('#today').textContent = period === 'day' ? 'امروز' : units[period] + ' جاری';
}

function selectDay(value) {
  $('#date').value = value;
  renderEntries();
  renderReports();
}

function moveDate(step) {
  const date = new Date($('#date').value + 'T12:00:00');
  const period = activeTab === 'reports' ? reportPeriod : 'day';
  selectDay(iso(adjacentDate(date, period, step)));
}

function adjacentDate(date, period, step) {
  if (period === 'day' || period === 'week') {
    return shiftDate(date, step * (period === 'week' ? 7 : 1));
  }
  const {start, end} = reportRange(date, period);
  const neighbor = shiftDate(step < 0 ? start : end, step);
  return reportRange(neighbor, period).start;
}

$('#date').onchange = () => selectDay($('#date').value || iso(new Date()));
$('#prev').onclick = () => moveDate(-1);
$('#next').onclick = () => moveDate(1);
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
function resetBasicForm() {
  editingItem = null;
  const {section, label} = basicCategory;
  const form = $('#' + section + '-form');
  form.reset();
  $('#' + section + '-settings-title').textContent = 'تعریف ' + label;
  form.querySelector('[type="submit"]').textContent = 'افزودن ' + label;
  $('#' + section + '-cancel').hidden = true;
  if (section === 'action') renderActionLinks();
}

function editButton(item) {
  const button = element('button', 'ویرایش');
  button.setAttribute('aria-label', 'ویرایش ' + item.title);
  button.onclick = () => {
    resetBasicForm();
    editingItem = item;
    const {section, label} = basicCategory;
    const form = $('#' + section + '-form');
    form.elements.title.value = item.title;
    if (section === 'habit') {
      form.elements.weight.value = item.weight;
      if (item.schedule) {
        for (const {name} of scheduleGroups) {
          for (const box of form.querySelectorAll('[name="' + name + '"]')) {
            box.checked = item.schedule[name].includes(Number(box.value));
            box.onchange();
          }
        }
      }
    } else {
      form.elements.quantity.value = item.quantity ?? 1;
      renderActionLinks();
    }
    $('#' + section + '-settings-title').textContent = 'ویرایش ' + label;
    form.querySelector('[type="submit"]').textContent = 'ذخیرهٔ تغییرات';
    $('#' + section + '-cancel').hidden = false;
    form.elements.title.focus();
  };
  return button;
}

$('#habit-cancel').onclick = resetBasicForm;
$('#action-cancel').onclick = resetBasicForm;

for (const button of document.querySelectorAll('[data-basics]')) {
  button.onclick = () => {
    basicCategory = basicTypes[button.dataset.basics];
    const {section} = basicCategory;
    for (const other of document.querySelectorAll('[data-basics]')) {
      other.setAttribute('aria-pressed', String(other === button));
    }
    $('#habit-settings').hidden = section !== 'habit';
    $('#action-settings').hidden = section !== 'action';
    resetBasicForm();
    if (section === 'habit') renderHabits();
    else renderActionDefinitions();
  };
}

$('#habit-form').onsubmit = event => {
  event.preventDefault();
  const data = new FormData(event.target);
  const title = data.get('title').trim();
  if (!title) return;
  const schedule = Object.fromEntries(scheduleGroups.map(({name}) =>
    [name, data.getAll(name).map(Number)]));
  const values = {title, weight: Number(data.get('weight')), schedule};
  if (editingItem) Object.assign(editingItem, values);
  else state.habits.push({id: crypto.randomUUID(), type: basicCategory.type, ...values});
  resetBasicForm();
  save();
  renderHabits();
  renderActionLinks();
  renderEntries();
};
function renderActionLinks() {
  const links = $('#action-links');
  const active = state.habits.filter(habit => habit.type === basicCategory.type &&
    (!habit.archived || editingItem?.habitIds?.includes(habit.id)));
  links.replaceChildren(...active.map(habit => {
    const checkbox = element('input');
    checkbox.type = 'checkbox';
    checkbox.name = 'habit';
    checkbox.value = habit.id;
    checkbox.checked = editingItem?.habitIds?.includes(habit.id) ?? false;
    return inputLabel((habit.type === 1 ? 'خوبی · ' : 'بدی · ') + habit.title, checkbox);
  }));
  if (!active.length) links.append(element('p', 'ابتدا یک ' + (basicCategory.type === 1 ? 'خوبی' : 'بدی') + ' تعریف یا فعال کنید.'));
  $('#action-form [type="submit"]').disabled = !active.length;
}

function actionType(action) {
  return action.type === 1 ? 'پاداش' : 'جریمه';
}

function renderActionDefinitions() {
  $('#action-definitions').replaceChildren(...state.actions.filter(action => action.type === basicCategory.type).map(action => {
    const item = element('li');
    const names = state.habits.filter(habit => habit.type === action.type && action.habitIds.includes(habit.id))
      .map(habit => habit.title);
    item.append(element('strong', actionType(action) + ' · ' + action.title),
      element('p', number.format(action.quantity ?? 1) + ' بار به‌ازای هر ثبت'),
      element('p', names.join('، ') || 'رفتار مرتبط انتخاب نشده است.'), definitionControls(action, renderActionDefinitions));
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
  const quantity = Number(data.get('quantity'));
  const habitIds = data.getAll('habit').filter(id => state.habits.some(habit =>
    habit.id === id && habit.type === basicCategory.type));
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000000) return;
  if (!title || !habitIds.length) {
    $('#status').textContent = 'عنوان و دست‌کم یک رفتار مرتبط را وارد کنید.';
    return;
  }
  if (editingItem) Object.assign(editingItem, {title, habitIds, quantity});
  else state.actions.push({id: crypto.randomUUID(), title, type: basicCategory.type, habitIds, quantity, pending: 0});
  resetBasicForm();
  save();
  renderActionDefinitions();
};

function validBackup(data) {
  const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const integer = (value, min, max = Number.MAX_SAFE_INTEGER) =>
    Number.isSafeInteger(value) && value >= min && value <= max;
  const id = value => typeof value === 'string' && /^[a-z0-9-]+$/i.test(value);
  const definition = item => record(item) && id(item.id) &&
    typeof item.title === 'string' && item.title.trim() && [1, -1].includes(item.type);
  if (!record(data) || !Array.isArray(data.habits) || !Array.isArray(data.actions) ||
      !record(data.days)) return false;
  const validSchedule = schedule => schedule == null || (record(schedule) &&
    scheduleGroups.every(({name, labels}) => {
      const values = schedule[name];
      return Array.isArray(values) && values.length > 0 &&
        values.every(value => integer(value, 1, labels.length));
    }));
  if (!data.habits.every(habit => definition(habit) && integer(habit.weight, 1, 100) &&
      validSchedule(habit.schedule))) return false;
  const habitIds = new Set(data.habits.map(habit => habit.id));
  if (habitIds.size !== data.habits.length || !data.actions.every(action => definition(action) &&
      integer(action.pending, 0) && integer(action.quantity ?? 1, 1, 1000000) &&
      Array.isArray(action.habitIds) && action.habitIds.every(habit => habitIds.has(habit)))) return false;
  const actionIds = new Set(data.actions.map(action => action.id));
  if (actionIds.size !== data.actions.length) return false;
  const validCredit = credit => integer(credit, 0, 999) ||
    (Array.isArray(credit) && credit.every(batch => record(batch) &&
      integer(batch.count, 1, 999) && integer(batch.quantity, 1, 1000000)));
  function validEntry([habit, entry]) {
    if (!habitIds.has(habit) || !record(entry) || !integer(entry.count, 0, 999)) return false;
    const credits = entry.credits;
    return credits == null || (record(credits) && Object.entries(credits).every(
      ([action, credit]) => actionIds.has(action) && validCredit(credit)));
  }
  return Object.entries(data.days).every(([date, day]) => /^\d{4,}-\d{2}-\d{2}$/.test(date) &&
    record(day) && record(day.entries) && Object.entries(day.entries).every(validEntry));
}

$('#export-backup').onclick = () => {
  const backup = {app: 'Rooznegar', version: 1, data: state};
  const blob = new Blob([JSON.stringify(backup, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const link = element('a');
  link.href = url;
  link.download = 'Rooznegar-' + iso(new Date()) + '.json';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

$('#restore-backup').onsubmit = async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const status = $('#backup-status');
  let backup;
  try {
    backup = JSON.parse(await form.elements.backup.files[0].text());
  } catch {
    status.textContent = 'فایل پشتیبان خوانده نشد.';
    return;
  }
  if (backup?.app !== 'Rooznegar' || backup.version !== 1 || !validBackup(backup.data)) {
    status.textContent = 'ساختار یا نسخهٔ فایل پشتیبان معتبر نیست.';
    return;
  }
  if (!confirm('اطلاعات فعلی با محتوای فایل پشتیبان جایگزین شود؟')) return;
  try {
    localStorage.setItem(key, JSON.stringify(backup.data));
  } catch {
    status.textContent = 'بازیابی انجام نشد. فضای ذخیره‌سازی مرورگر را بررسی کنید.';
    return;
  }
  location.reload();
};

for (const button of document.querySelectorAll('nav button')) {
  button.onclick = () => {
    for (const other of document.querySelectorAll('nav button')) other.removeAttribute('aria-current');
    button.setAttribute('aria-current', 'page');
    for (const panel of document.querySelectorAll('.panel')) panel.hidden = panel.id !== button.dataset.tab;
    activeTab = button.dataset.tab;
    $('#day-picker').hidden = !['daily', 'reports'].includes(activeTab);
    if (button.dataset.tab === 'actions') renderActionQueue();
    if (activeTab === 'daily' || activeTab === 'reports') renderReports();
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
selectDay(demo ? '2026-03-20' : iso(new Date()));
if (demo) {
  $('#demo-tools').hidden = false;
  for (const button of document.querySelectorAll('[data-demo-year]')) {
    button.onclick = () => {
      selectDay(button.dataset.demoYear);
      $('#reports-tab').click();
      document.querySelector('[data-period="year"]').click();
    };
  }
}
renderHabits();
renderActionLinks();
renderActionDefinitions();
renderHabitSchedule();
