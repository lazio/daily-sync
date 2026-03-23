// === Default Questions ===
var DEFAULT_QUESTIONS = [
  { id: 'daily-feel', category: 'Daily', question: 'How did I feel overall?', hint: 'Name it. Don\'t numb it.', frequency: 'daily', scale: '1-5', order: 0 },
  { id: 'daily-person', category: 'Daily', question: 'Was I the person I want to be?', hint: 'Reliable. Honest. No resentment. Face the hard thing.', frequency: 'daily', scale: '1-5', order: 1 },
  { id: 'daily-envy', category: 'Daily', question: 'Did I avoid envy?', hint: 'Comparing kills gratitude. Run your own race.', frequency: 'daily', scale: '1-5', order: 2 },
  { id: 'daily-eat', category: 'Daily', question: 'Did I eat well?', hint: 'Portions first. Protein first. No eating at the screen.', frequency: 'daily', scale: '1-5', order: 3 },
  { id: 'daily-move', category: 'Daily', question: 'Did I move my body?', hint: 'Dance, train, walk. The body that can\'t sit still.', frequency: 'daily', scale: '1-5', order: 4 },
  { id: 'daily-sleep', category: 'Daily', question: 'Sleep quality?', hint: 'Bad sleep = 20% more eating. It starts here.', frequency: 'daily', scale: '1-5', order: 5 },
  { id: 'daily-deep-work', category: 'Daily', question: 'Did I do deep work?', hint: 'One thing that moves the needle. Not busywork.', frequency: 'daily', scale: '1-5', order: 6 },
  { id: 'daily-connect', category: 'Daily', question: 'Did I connect with people I care about?', hint: 'Liza, family, friends. Be present, not just around.', frequency: 'daily', scale: '1-5', order: 7 },
  { id: 'daily-learn', category: 'Daily', question: 'Did I learn or create something?', hint: 'Something I can use, not just consume.', frequency: 'daily', scale: '1-5', order: 8 },
  { id: 'daily-stress', category: 'Daily', question: 'How did I handle stress?', hint: 'Move, breathe, or talk. Not eat.', frequency: 'daily', scale: '1-5', order: 9 },
  { id: 'daily-hard', category: 'Daily', question: 'Did I face something hard?', hint: 'The call, the conversation, the thing I keep postponing.', frequency: 'daily', scale: '1-5', order: 10 },
  { id: 'daily-smoke', category: 'Daily', question: 'Did I smoke?', hint: 'Every session resets the cycle. Clean break.', frequency: 'daily', scale: '1-5', order: 11 },
  { id: 'weekly-partner', category: 'Weekly', question: 'Did I love my partner well this week?', hint: 'Praise, recognition, presence. Not just coexisting.', frequency: 'weekly', scale: '1-5', order: 0 },
  { id: 'weekly-financial', category: 'Weekly', question: 'Was I wise financially?', hint: 'Decisions that build safety, not just comfort.', frequency: 'weekly', scale: '1-5', order: 1 },
  { id: 'weekly-entertainment', category: 'Weekly', question: 'Was my entertainment healthy?', hint: 'No late nights with games or movies. Rest instead.', frequency: 'weekly', scale: '1-5', order: 2 },
  { id: 'weekly-goals', category: 'Weekly', question: 'Did I progress on my goals?', hint: 'Agency, products, learning. Check the quarterly plan.', frequency: 'weekly', scale: '1-5', order: 3 },
  { id: 'weekly-meaning', category: 'Weekly', question: 'Did I feel meaning?', hint: 'Not happiness. Purpose. Was the week worth it?', frequency: 'weekly', scale: '1-5', order: 4 },
];

// === State ===
var currentDate = new Date();
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

function isWeekend(d) {
  return d.getDay() === 0 || d.getDay() === 6;
}

// Find the most recent weekly answer for a question within the same Mon-Sun week
function findWeeklyAnswer(d, questionId) {
  var dayOfWeek = d.getDay();
  var mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  var monday = new Date(d);
  monday.setDate(d.getDate() + mondayOffset);

  for (var i = 6; i >= 0; i--) {
    var check = new Date(monday);
    check.setDate(monday.getDate() + i);
    var data = loadDay(formatDate(check));
    if (data.answers[questionId] !== undefined) {
      return data.answers[questionId];
    }
  }
  return undefined;
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

  var weekend = isWeekend(currentDate);
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
    var allWeekly = catQuestions.every(function(q) { return q.frequency === 'weekly'; });
    if (allWeekly && !weekend) return; // skip entire category on weekdays
    html += '<div class="category">';
    html += '<div class="category-title">' + escapeHtml(cat) + '</div>';

    catQuestions.forEach(function(q) {
      var isWeekly = q.frequency === 'weekly';
      if (isWeekly && !weekend) return; // skip weekly questions on weekdays
      var weeklyClass = isWeekly ? ' weekly' : '';
      var savedValue = dayData.answers[q.id];
      // Pre-populate weekly questions from earlier in the week
      if (isWeekly && savedValue === undefined) {
        savedValue = findWeeklyAnswer(currentDate, q.id);
      }

      html += '<div class="question-card' + weeklyClass + '" data-id="' + q.id + '">';

      if (isWeekly) {
        html += '<div class="weekly-badge">Weekly</div>';
      }

      html += '<div class="question-text">' + escapeHtml(q.question) + '</div>';
      if (q.hint) {
        html += '<div class="question-hint">' + escapeHtml(q.hint) + '</div>';
      }

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
        if (q.hint) {
          html += '<div class="settings-q-hint">' + escapeHtml(q.hint) + '</div>';
        }
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
  html += '<label>Hint (optional)</label>';
  html += '<input type="text" class="edit-q-hint" value="' + escapeHtml(q.hint || '') + '" placeholder="Subtitle shown below the question...">';
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
    var hint = form.querySelector('.edit-q-hint').value.trim();
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
          var updated = { id: q.id, category: category, question: text, frequency: freq, scale: scale, order: order };
          if (hint) updated.hint = hint;
          return updated;
        }
        return q;
      });
    } else {
      // New question
      var catCount = questions.filter(function(x) { return x.category === category; }).length;
      var newQ = {
        id: generateId(text),
        category: category,
        question: text,
        frequency: freq,
        scale: scale,
        order: catCount
      };
      if (hint) newQ.hint = hint;
      questions.push(newQ);
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

// === Migrations ===
function runMigrations() {
  var stored = localStorage.getItem('ds-questions');
  if (!stored) return; // using defaults, no migration needed

  var questions = JSON.parse(stored);
  var changed = false;

  // Migration 1: Replace daily-screens with daily-hard and daily-smoke
  var hasScreens = questions.some(function(q) { return q.id === 'daily-screens'; });
  var hasHard = questions.some(function(q) { return q.id === 'daily-hard'; });

  if (hasScreens && !hasHard) {
    questions = questions.filter(function(q) { return q.id !== 'daily-screens'; });
    questions.push({ id: 'daily-hard', category: 'Daily', question: 'Did I face something hard?', hint: 'The call, the conversation, the thing I keep postponing.', frequency: 'daily', scale: '1-5', order: 9 });
    questions.push({ id: 'daily-smoke', category: 'Daily', question: 'Did I smoke?', hint: 'Every session resets the cycle. Clean break.', frequency: 'daily', scale: '1-5', order: 10 });
    changed = true;
  }

  // Migration 2: Add hints to all questions
  var hintMap = {
    'daily-feel': 'Name it. Don\'t numb it.',
    'daily-person': 'Reliable. Honest. No resentment. Face the hard thing.',
    'daily-eat': 'Portions first. Protein first. No eating at the screen.',
    'daily-move': 'Dance, train, walk. The body that can\'t sit still.',
    'daily-sleep': 'Bad sleep = 20% more eating. It starts here.',
    'daily-deep-work': 'One thing that moves the needle. Not busywork.',
    'daily-connect': 'Liza, family, friends. Be present, not just around.',
    'daily-learn': 'Something I can use, not just consume.',
    'daily-stress': 'Move, breathe, or talk. Not eat.',
    'daily-hard': 'The call, the conversation, the thing I keep postponing.',
    'daily-smoke': 'Every session resets the cycle. Clean break.',
    'weekly-partner': 'Praise, recognition, presence. Not just coexisting.',
    'weekly-financial': 'Decisions that build safety, not just comfort.',
    'weekly-entertainment': 'No late nights with games or movies. Rest instead.',
    'weekly-goals': 'Agency, products, learning. Check the quarterly plan.',
    'weekly-meaning': 'Not happiness. Purpose. Was the week worth it?'
  };

  questions = questions.map(function(q) {
    if (!q.hint && hintMap[q.id]) {
      q.hint = hintMap[q.id];
      changed = true;
    }
    return q;
  });

  if (changed) saveQuestions(questions);
}

runMigrations();

// === Init ===
render();
