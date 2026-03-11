// === Default Questions ===
var DEFAULT_QUESTIONS = [
  { id: 'wellbeing-overall', category: 'Overall wellbeing & actions', question: 'What was my overall wellbeing?', frequency: 'daily', scale: '1-5', order: 0 },
  { id: 'wellbeing-person', category: 'Overall wellbeing & actions', question: 'Was I the person I want to be?', frequency: 'daily', scale: '1-5', order: 1 },
  { id: 'faith-spiritual', category: 'Faith', question: 'Did I engage in spiritual practices?', frequency: 'daily', scale: '1-5', order: 0 },
  { id: 'rel-partner', category: 'Relationships & community', question: 'Did I love my partner well?', frequency: 'daily', scale: '1-5', order: 0 },
  { id: 'rel-family', category: 'Relationships & community', question: 'Did I love my family well?', frequency: 'weekly', scale: '1-5', order: 1 },
  { id: 'rel-friends', category: 'Relationships & community', question: 'Did I love my friends well?', frequency: 'daily', scale: '1-5', order: 2 },
  { id: 'rel-community', category: 'Relationships & community', question: 'Did I contribute to society / the community?', frequency: 'weekly', scale: '1-5', order: 3 },
  { id: 'mental-routine', category: 'Mental health', question: 'Did I do my morning routine?', frequency: 'daily', scale: '1-5', order: 0 },
  { id: 'mental-stress', category: 'Mental health', question: 'How did I handle stress?', frequency: 'daily', scale: '1-5', order: 1 },
  { id: 'mental-time', category: 'Mental health', question: 'Did I spend 5+ minutes on mental health?', frequency: 'daily', scale: '1-5', order: 2 },
  { id: 'physical-feel', category: 'Physical health', question: 'How did I feel physically?', frequency: 'daily', scale: '1-5', order: 0 },
  { id: 'physical-sleep-hours', category: 'Physical health', question: 'How many hours of sleep did I get?', frequency: 'daily', scale: 'hours', order: 1 },
  { id: 'physical-sleep-quality', category: 'Physical health', question: 'What was the quality of my sleep?', frequency: 'daily', scale: '1-5', order: 2 },
  { id: 'physical-eat', category: 'Physical health', question: 'Did I eat healthy?', frequency: 'daily', scale: '1-5', order: 3 },
  { id: 'physical-workout', category: 'Physical health', question: 'Did I work out?', frequency: 'daily', scale: '1-5', order: 4 },
  { id: 'work-enjoy', category: 'Work', question: 'Did I enjoy work?', frequency: 'daily', scale: '1-5', order: 0 },
  { id: 'work-hours', category: 'Work', question: 'How many hours did I work?', frequency: 'daily', scale: 'hours', order: 1 },
  { id: 'work-financial', category: 'Work', question: 'Was I wise financially?', frequency: 'weekly', scale: '1-5', order: 2 },
  { id: 'purpose-meaning', category: 'Purpose & engagement', question: 'Did I experience meaning?', frequency: 'daily', scale: '1-5', order: 0 },
  { id: 'purpose-positive', category: 'Purpose & engagement', question: 'Did I experience positive emotions?', frequency: 'daily', scale: '1-5', order: 1 },
  { id: 'purpose-engaged', category: 'Purpose & engagement', question: 'Did I feel engaged by what I was doing?', frequency: 'daily', scale: '1-5', order: 2 },
  { id: 'achieve-sense', category: 'Achievement & growth', question: 'Did I have a sense of achievement?', frequency: 'daily', scale: '1-5', order: 0 },
  { id: 'achieve-learn', category: 'Achievement & growth', question: 'Was my mind stimulated / did I learn?', frequency: 'weekly', scale: '1-5', order: 1 },
  { id: 'achieve-goals', category: 'Achievement & growth', question: 'Did I achieve my daily goals?', frequency: 'daily', scale: '1-5', order: 2 },
  { id: 'character-virtues', category: 'Character & virtue', question: 'Did I practice the virtues I am working on?', frequency: 'daily', scale: '1-5', order: 0 },
  { id: 'character-service', category: 'Character & virtue', question: 'Was I of service or generous to others?', frequency: 'weekly', scale: '1-5', order: 1 },
  { id: 'character-habits', category: 'Character & virtue', question: 'Did I practice the habits I am building?', frequency: 'daily', scale: '1-5', order: 2 },
  { id: 'entertain-healthy', category: 'Entertainment', question: 'Was my engagement in hobbies & entertainment healthy?', frequency: 'weekly', scale: '1-5', order: 0 },
];

// === State ===
var currentDate = new Date();
var showWeekly = false;
var historyWeekOffset = 0;
var editingQuestion = null; // question id being edited, or 'new-<category>' for new

// === Helpers ===
function formatDate(d) {
  var y = d.getFullYear();
  var m = String(d.getMonth() + 1).padStart(2, '0');
  var day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

function formatDateDisplay(d) {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function isSunday(d) {
  return d.getDay() === 0;
}

function changeDate(offset) {
  currentDate.setDate(currentDate.getDate() + offset);
  render();
}

function escapeHtml(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// === Data Layer ===
function getQuestions() {
  try {
    var stored = localStorage.getItem('ds-questions');
    if (stored) return JSON.parse(stored);
  } catch (e) { /* fall through */ }
  return DEFAULT_QUESTIONS;
}

function loadDay(dateStr) {
  try {
    var stored = localStorage.getItem('ds-' + dateStr);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* fall through */ }
  return { date: dateStr, answers: {}, updatedAt: null };
}

function saveAnswer(dateStr, questionId, value) {
  var day = loadDay(dateStr);
  if (value === null || value === '' || value === undefined) {
    delete day.answers[questionId];
  } else {
    day.answers[questionId] = value;
  }
  day.updatedAt = new Date().toISOString();
  try {
    localStorage.setItem('ds-' + dateStr, JSON.stringify(day));
  } catch (e) {
    alert('Could not save — storage may be full.');
  }
}

// === Export: CSV ===
function exportCSV() {
  var questions = getQuestions();
  var qMap = {};
  questions.forEach(function(q) { qMap[q.id] = q; });

  var rows = [['Date', 'Category', 'Question', 'Value']];
  var keys = [];

  // Collect all ds- date keys
  for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i);
    if (key.match(/^ds-\d{4}-\d{2}-\d{2}$/)) {
      keys.push(key);
    }
  }
  keys.sort();

  keys.forEach(function(key) {
    try {
      var day = JSON.parse(localStorage.getItem(key));
      var date = day.date;
      Object.keys(day.answers).forEach(function(qid) {
        var q = qMap[qid];
        var cat = q ? q.category : 'Unknown';
        var text = q ? q.question : qid;
        rows.push([date, cat, text, day.answers[qid]]);
      });
    } catch (e) { /* skip bad data */ }
  });

  if (rows.length === 1) {
    alert('No data to export yet.');
    return;
  }

  var csv = rows.map(function(r) {
    return r.map(function(cell) {
      var s = String(cell);
      if (s.indexOf(',') !== -1 || s.indexOf('"') !== -1 || s.indexOf('\n') !== -1) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    }).join(',');
  }).join('\n');

  downloadFile(csv, 'daily-score-export.csv', 'text/csv');
}

// === Export: JSON ===
function exportJSON() {
  var data = { questions: getQuestions(), days: {} };

  for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i);
    if (key.match(/^ds-\d{4}-\d{2}-\d{2}$/)) {
      try {
        data.days[key] = JSON.parse(localStorage.getItem(key));
      } catch (e) { /* skip */ }
    }
  }

  if (Object.keys(data.days).length === 0) {
    alert('No data to export yet.');
    return;
  }

  var json = JSON.stringify(data, null, 2);
  downloadFile(json, 'daily-score-backup.json', 'application/json');
}

// === Import: JSON ===
function importJSON() {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.addEventListener('change', function(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      try {
        var data = JSON.parse(ev.target.result);
        if (data.questions) {
          localStorage.setItem('ds-questions', JSON.stringify(data.questions));
        }
        if (data.days) {
          Object.keys(data.days).forEach(function(key) {
            localStorage.setItem(key, JSON.stringify(data.days[key]));
          });
        }
        render();
        alert('Import complete — ' + Object.keys(data.days || {}).length + ' days restored.');
      } catch (err) {
        alert('Invalid backup file.');
      }
    };
    reader.readAsText(file);
  });
  input.click();
}

function downloadFile(content, filename, mimeType) {
  var blob = new Blob([content], { type: mimeType });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(function() {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

// === Questions CRUD ===
function saveQuestions(questions) {
  try {
    localStorage.setItem('ds-questions', JSON.stringify(questions));
  } catch (e) {
    alert('Could not save — storage may be full.');
  }
}

function generateId(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 40) + '-' + Date.now().toString(36);
}

// === View Switching ===
var currentView = 'score';

function switchView(view) {
  currentView = view;
  document.querySelectorAll('.tab-nav button').forEach(function(b) { b.classList.remove('active'); });
  document.querySelector('.tab-nav button[data-view="' + view + '"]').classList.add('active');
  document.querySelectorAll('.view').forEach(function(v) { v.classList.remove('active'); });
  document.getElementById('view-' + view).classList.add('active');
  if (view === 'history') renderHistory();
  if (view === 'settings') renderSettings();
}

document.querySelector('.tab-nav').addEventListener('click', function(e) {
  var btn = e.target.closest('button[data-view]');
  if (!btn) return;
  switchView(btn.dataset.view);
});

// === Date Navigation ===
document.getElementById('prev-day').addEventListener('click', function() { changeDate(-1); });
document.getElementById('next-day').addEventListener('click', function() { changeDate(1); });
document.getElementById('date-picker').addEventListener('change', function(e) {
  if (e.target.value) {
    var parts = e.target.value.split('-');
    currentDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    render();
  }
});

// === Event Delegation for Score View ===
document.getElementById('view-score').addEventListener('click', function(e) {
  // Score button tap
  var btn = e.target.closest('.score-btn');
  if (btn) {
    var qid = btn.dataset.question;
    var value = parseInt(btn.dataset.value);
    var dateStr = formatDate(currentDate);
    var day = loadDay(dateStr);

    // Toggle: if already selected, deselect
    if (day.answers[qid] === value) {
      saveAnswer(dateStr, qid, null);
    } else {
      saveAnswer(dateStr, qid, value);
    }

    // Update UI without full re-render
    var card = btn.closest('.question-card');
    card.querySelectorAll('.score-btn').forEach(function(b) { b.classList.remove('selected'); });
    if (loadDay(dateStr).answers[qid] === value) {
      btn.classList.add('selected');
    }
    return;
  }

  // Weekly toggle
  if (e.target.id === 'toggle-weekly') {
    showWeekly = !showWeekly;
    render();
    return;
  }

  // Export CSV
  if (e.target.id === 'export-csv') {
    exportCSV();
    return;
  }

  // Export JSON
  if (e.target.id === 'export-json') {
    exportJSON();
    return;
  }

  // Import JSON
  if (e.target.id === 'import-json') {
    importJSON();
    return;
  }
});

// Hours input — use event delegation with focusout
document.getElementById('view-score').addEventListener('focusout', function(e) {
  if (e.target.classList.contains('hours-input')) {
    var qid = e.target.dataset.question;
    var val = e.target.value.trim();
    var dateStr = formatDate(currentDate);
    if (val === '') {
      saveAnswer(dateStr, qid, null);
    } else {
      saveAnswer(dateStr, qid, parseFloat(val));
    }
  }
});

// Also save hours on Enter key
document.getElementById('view-score').addEventListener('keydown', function(e) {
  if (e.target.classList.contains('hours-input') && e.key === 'Enter') {
    e.target.blur();
  }
});

// === Render Score View ===
function render() {
  var dateStr = formatDate(currentDate);
  document.getElementById('date-text').textContent = formatDateDisplay(currentDate);
  document.getElementById('date-picker').value = dateStr;

  var sunday = isSunday(currentDate);
  var container = document.getElementById('view-score');
  var questions = getQuestions();
  var dayData = loadDay(dateStr);

  // Group by category
  var categories = [];
  var catMap = {};
  questions.forEach(function(q) {
    if (!catMap[q.category]) {
      catMap[q.category] = [];
      categories.push(q.category);
    }
    catMap[q.category].push(q);
  });

  var html = '';

  categories.forEach(function(cat) {
    var catQuestions = catMap[cat].sort(function(a, b) { return a.order - b.order; });
    html += '<div class="category">';
    html += '<div class="category-title">' + escapeHtml(cat) + '</div>';

    catQuestions.forEach(function(q) {
      var isWeekly = q.frequency === 'weekly';
      var hiddenClass = (isWeekly && !sunday && !showWeekly) ? ' hidden' : '';
      var weeklyClass = isWeekly ? ' weekly' : '';
      var savedValue = dayData.answers[q.id];

      html += '<div class="question-card' + weeklyClass + hiddenClass + '" data-id="' + q.id + '">';

      if (isWeekly) {
        html += '<div class="weekly-badge">Weekly</div>';
      }

      html += '<div class="question-text">' + escapeHtml(q.question) + '</div>';

      if (q.scale === '1-5') {
        html += '<div class="score-buttons">';
        for (var i = 1; i <= 5; i++) {
          var sel = (savedValue === i) ? ' selected' : '';
          html += '<button class="score-btn' + sel + '" data-question="' + q.id + '" data-value="' + i + '">' + i + '</button>';
        }
        html += '</div>';
      } else {
        var hval = (savedValue !== undefined && savedValue !== null) ? savedValue : '';
        html += '<div class="hours-input-wrap">';
        html += '<input type="number" class="hours-input" data-question="' + q.id + '" min="0" max="24" step="0.5" placeholder="0" value="' + hval + '">';
        html += '<span class="hours-label">hours</span>';
        html += '</div>';
      }

      html += '</div>';
    });

    html += '</div>';
  });

  // Weekly toggle
  if (!sunday) {
    var toggleText = showWeekly ? 'Hide weekly questions' : 'Show weekly questions';
    html += '<div class="weekly-toggle"><button id="toggle-weekly">' + toggleText + '</button></div>';
  }

  // Footer with export/import
  html += '<div class="footer">';
  html += '<button id="export-csv">Export CSV</button> ';
  html += '<button id="export-json">Export JSON</button> ';
  html += '<button id="import-json">Import JSON</button>';
  html += '</div>';

  container.innerHTML = html;
}

// === Render History View ===
function renderHistory() {
  var container = document.getElementById('view-history');
  var questions = getQuestions();

  // Calculate week start (Monday)
  var today = new Date();
  var dayOfWeek = today.getDay();
  var mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  var weekStart = new Date(today);
  weekStart.setDate(today.getDate() + mondayOffset + (historyWeekOffset * 7));

  var days = [];
  var dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  for (var i = 0; i < 7; i++) {
    var d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    days.push({ date: d, label: dayLabels[i], str: formatDate(d) });
  }

  var weekLabel = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  var html = '';
  html += '<div class="history-week-nav">';
  html += '<button id="history-prev" aria-label="Previous week">&#8249;</button>';
  html += '<span class="history-week-label">Week of ' + escapeHtml(weekLabel) + '</span>';
  html += '<button id="history-next" aria-label="Next week">&#8250;</button>';
  html += '</div>';

  // Load all 7 days of data
  var dayData = days.map(function(d) { return loadDay(d.str); });

  // Daily averages row (only 1-5 scale questions)
  var scaleQuestions = questions.filter(function(q) { return q.scale === '1-5'; });

  html += '<div class="history-section-title">Daily Average</div>';
  html += '<div class="daily-row">';
  days.forEach(function(d, idx) {
    var answers = dayData[idx].answers;
    var scores = [];
    scaleQuestions.forEach(function(q) {
      if (typeof answers[q.id] === 'number') scores.push(answers[q.id]);
    });
    var avg = scores.length > 0 ? (scores.reduce(function(a, b) { return a + b; }, 0) / scores.length) : null;
    var scoreClass = avg !== null ? 'daily-cell-score has-score' : 'daily-cell-score empty';
    var display = avg !== null ? avg.toFixed(1) : '—';
    html += '<div class="daily-cell">';
    html += '<div class="daily-cell-label">' + d.label + '</div>';
    html += '<div class="' + scoreClass + '">' + display + '</div>';
    html += '</div>';
  });
  html += '</div>';

  // Category averages
  var categories = [];
  var catMap = {};
  questions.forEach(function(q) {
    if (q.scale !== '1-5') return;
    if (!catMap[q.category]) {
      catMap[q.category] = [];
      categories.push(q.category);
    }
    catMap[q.category].push(q);
  });

  var hasAnyData = false;

  html += '<div class="history-section-title">By Category</div>';
  categories.forEach(function(cat) {
    var catQ = catMap[cat];
    var allScores = [];
    dayData.forEach(function(dd) {
      catQ.forEach(function(q) {
        if (typeof dd.answers[q.id] === 'number') allScores.push(dd.answers[q.id]);
      });
    });
    var avg = allScores.length > 0 ? (allScores.reduce(function(a, b) { return a + b; }, 0) / allScores.length) : null;
    if (avg !== null) hasAnyData = true;
    var pct = avg !== null ? ((avg / 5) * 100).toFixed(0) : 0;
    var display = avg !== null ? avg.toFixed(1) : '—';

    html += '<div class="cat-bar">';
    html += '<div class="cat-bar-header">';
    html += '<span class="cat-bar-name">' + escapeHtml(cat) + '</span>';
    html += '<span class="cat-bar-value">' + display + '</span>';
    html += '</div>';
    html += '<div class="cat-bar-track"><div class="cat-bar-fill" style="width: ' + pct + '%"></div></div>';
    html += '</div>';
  });

  if (!hasAnyData) {
    html += '<div class="history-empty">No data for this week yet.</div>';
  }

  container.innerHTML = html;

  // Week nav handlers
  document.getElementById('history-prev').addEventListener('click', function() {
    historyWeekOffset--;
    renderHistory();
  });
  document.getElementById('history-next').addEventListener('click', function() {
    historyWeekOffset++;
    renderHistory();
  });
}

// === Render Settings View ===
function renderSettings() {
  var container = document.getElementById('view-settings');
  var questions = getQuestions();

  // Group by category
  var categories = [];
  var catMap = {};
  questions.forEach(function(q) {
    if (!catMap[q.category]) {
      catMap[q.category] = [];
      categories.push(q.category);
    }
    catMap[q.category].push(q);
  });

  var html = '';
  html += '<button class="settings-back" id="settings-back">&#8249; Settings</button>';

  categories.forEach(function(cat) {
    var catQuestions = catMap[cat].sort(function(a, b) { return a.order - b.order; });

    html += '<div class="settings-category" data-category="' + escapeHtml(cat) + '">';
    html += '<div class="settings-cat-header">';
    html += '<span class="settings-cat-title">' + escapeHtml(cat) + '</span>';
    html += '</div>';

    catQuestions.forEach(function(q, idx) {
      if (editingQuestion === q.id) {
        html += renderEditForm(q, categories);
      } else {
        html += '<div class="settings-q-card" data-id="' + q.id + '">';
        html += '<span class="settings-q-handle">&#9776;</span>';
        html += '<div class="settings-q-body">';
        html += '<div class="settings-q-text">' + escapeHtml(q.question) + '</div>';
        html += '<div class="settings-q-meta">' + capitalize(q.frequency) + ' &middot; ' + q.scale + '</div>';
        html += '</div>';
        html += '<div class="settings-q-actions">';
        if (idx > 0) html += '<button class="move-up-btn" data-id="' + q.id + '" aria-label="Move up">&#9650;</button>';
        if (idx < catQuestions.length - 1) html += '<button class="move-down-btn" data-id="' + q.id + '" aria-label="Move down">&#9660;</button>';
        html += '<button class="edit-btn" data-id="' + q.id + '" aria-label="Edit">&#9998;</button>';
        html += '</div>';
        html += '</div>';
      }
    });

    // New question form for this category
    if (editingQuestion === 'new-' + cat) {
      html += renderEditForm({ id: '', category: cat, question: '', frequency: 'daily', scale: '1-5', order: catQuestions.length }, categories);
    }

    html += '<button class="settings-add-btn add-question-btn" data-category="' + escapeHtml(cat) + '">+ Add question</button>';
    html += '</div>';
  });

  // Add category
  html += '<button class="settings-add-btn" id="add-category-btn" style="margin-top: 8px;">+ Add category</button>';

  // Data section
  html += '<div class="settings-section-title">Data</div>';
  html += '<div class="settings-data-buttons">';
  html += '<button id="settings-export-csv">Export CSV</button>';
  html += '<button id="settings-export-json">Export JSON backup</button>';
  html += '<button id="settings-import-json">Import JSON backup</button>';
  html += '</div>';

  container.innerHTML = html;
}

function renderEditForm(q, categories) {
  var isNew = !q.id;
  var html = '<div class="edit-form">';
  html += '<label>Question text</label>';
  html += '<input type="text" class="edit-q-text" value="' + escapeHtml(q.question) + '" placeholder="Enter question...">';
  html += '<label>Category</label>';
  html += '<select class="edit-q-category">';
  categories.forEach(function(cat) {
    var sel = cat === q.category ? ' selected' : '';
    html += '<option value="' + escapeHtml(cat) + '"' + sel + '>' + escapeHtml(cat) + '</option>';
  });
  html += '</select>';
  html += '<label>Frequency</label>';
  html += '<div class="edit-form-radios">';
  html += '<label><input type="radio" name="edit-freq" value="daily"' + (q.frequency === 'daily' ? ' checked' : '') + '> Daily</label>';
  html += '<label><input type="radio" name="edit-freq" value="weekly"' + (q.frequency === 'weekly' ? ' checked' : '') + '> Weekly</label>';
  html += '</div>';
  html += '<label>Scale</label>';
  html += '<div class="edit-form-radios">';
  html += '<label><input type="radio" name="edit-scale" value="1-5"' + (q.scale === '1-5' ? ' checked' : '') + '> 1-5</label>';
  html += '<label><input type="radio" name="edit-scale" value="hours"' + (q.scale === 'hours' ? ' checked' : '') + '> Hours</label>';
  html += '</div>';
  html += '<div class="edit-form-actions">';
  if (!isNew) {
    html += '<button class="btn-delete" data-id="' + q.id + '">Delete</button>';
  }
  html += '<button class="btn-cancel">Cancel</button>';
  html += '<button class="btn-save" data-id="' + (q.id || '') + '">' + (isNew ? 'Add' : 'Save') + '</button>';
  html += '</div>';
  html += '</div>';
  return html;
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// === Settings Event Delegation ===
document.getElementById('view-settings').addEventListener('click', function(e) {
  var target = e.target;

  // Back button
  if (target.closest('#settings-back')) {
    switchView('score');
    return;
  }

  // Edit button
  var editBtn = target.closest('.edit-btn');
  if (editBtn) {
    editingQuestion = editBtn.dataset.id;
    renderSettings();
    return;
  }

  // Move up
  var upBtn = target.closest('.move-up-btn');
  if (upBtn) {
    reorderQuestion(upBtn.dataset.id, -1);
    return;
  }

  // Move down
  var downBtn = target.closest('.move-down-btn');
  if (downBtn) {
    reorderQuestion(downBtn.dataset.id, 1);
    return;
  }

  // Add question
  var addBtn = target.closest('.add-question-btn');
  if (addBtn) {
    editingQuestion = 'new-' + addBtn.dataset.category;
    renderSettings();
    return;
  }

  // Add category
  if (target.id === 'add-category-btn') {
    var name = prompt('Category name:');
    if (name && name.trim()) {
      var questions = getQuestions();
      // Add a placeholder question so category shows up
      questions.push({
        id: generateId(name.trim()),
        category: name.trim(),
        question: 'New question',
        frequency: 'daily',
        scale: '1-5',
        order: 0
      });
      saveQuestions(questions);
      editingQuestion = questions[questions.length - 1].id;
      renderSettings();
    }
    return;
  }

  // Cancel edit
  if (target.classList.contains('btn-cancel')) {
    editingQuestion = null;
    renderSettings();
    return;
  }

  // Save edit
  if (target.classList.contains('btn-save')) {
    var form = target.closest('.edit-form');
    var text = form.querySelector('.edit-q-text').value.trim();
    if (!text) { alert('Question text is required.'); return; }
    var category = form.querySelector('.edit-q-category').value;
    var freq = form.querySelector('input[name="edit-freq"]:checked').value;
    var scale = form.querySelector('input[name="edit-scale"]:checked').value;
    var qid = target.dataset.id;
    var questions = getQuestions();

    if (qid) {
      // Update existing
      questions = questions.map(function(q) {
        if (q.id === qid) {
          // If category changed, put at end of new category
          var order = q.order;
          if (q.category !== category) {
            order = questions.filter(function(x) { return x.category === category; }).length;
          }
          return { id: q.id, category: category, question: text, frequency: freq, scale: scale, order: order };
        }
        return q;
      });
    } else {
      // New question
      var catCount = questions.filter(function(x) { return x.category === category; }).length;
      questions.push({
        id: generateId(text),
        category: category,
        question: text,
        frequency: freq,
        scale: scale,
        order: catCount
      });
    }

    saveQuestions(questions);
    editingQuestion = null;
    renderSettings();
    return;
  }

  // Delete
  if (target.classList.contains('btn-delete')) {
    if (!confirm('Delete this question? Past answers will be kept.')) return;
    var qid = target.dataset.id;
    var questions = getQuestions().filter(function(q) { return q.id !== qid; });
    saveQuestions(questions);
    editingQuestion = null;
    renderSettings();
    return;
  }

  // Data buttons
  if (target.id === 'settings-export-csv') { exportCSV(); return; }
  if (target.id === 'settings-export-json') { exportJSON(); return; }
  if (target.id === 'settings-import-json') { importJSON(); return; }
});

function reorderQuestion(qid, direction) {
  var questions = getQuestions();
  var q = questions.find(function(x) { return x.id === qid; });
  if (!q) return;

  var catQuestions = questions
    .filter(function(x) { return x.category === q.category; })
    .sort(function(a, b) { return a.order - b.order; });

  var idx = catQuestions.findIndex(function(x) { return x.id === qid; });
  var swapIdx = idx + direction;
  if (swapIdx < 0 || swapIdx >= catQuestions.length) return;

  // Swap orders
  var tmpOrder = catQuestions[idx].order;
  catQuestions[idx].order = catQuestions[swapIdx].order;
  catQuestions[swapIdx].order = tmpOrder;

  // Apply back to questions array
  questions = questions.map(function(x) {
    var updated = catQuestions.find(function(c) { return c.id === x.id; });
    return updated || x;
  });

  saveQuestions(questions);
  renderSettings();
}

// === Init ===
render();
