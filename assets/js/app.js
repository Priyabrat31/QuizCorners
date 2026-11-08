'use strict';

const ATTEMPTS_KEY = 'quizcorner_static_attempts_v1';
const CANDIDATE_KEY = 'quizcorner_candidate_name';
const ACTIVE_KEY = 'quizcorner_active_quiz';
function getCreatorPhoto(creator) {
  // Creator photos are static GitHub assets so every visitor sees the same image.
  return typeof creator.image === 'string' ? creator.image : '';
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

async function loadJSON(path) {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Could not load ${path} (${response.status})`);
  return response.json();
}

function readAttempts() {
  try {
    const value = JSON.parse(localStorage.getItem(ATTEMPTS_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch (error) {
    console.warn('Could not read local quiz history:', error);
    return [];
  }
}

function writeAttempts(items) {
  localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(items));
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString();
}

function initials(name) {
  return String(name || 'Q').split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
}

function creatorAvatar(creator, extraClass = '', loading = 'lazy') {
  const name = escapeHTML(creator.name || 'QuizCorner creator');
  const photo = getCreatorPhoto(creator).trim();
  const image = photo
    ? `<img class=\"avatar-image\" src=\"${escapeHTML(photo)}\" alt=\"Photo of ${name}\" loading=\"${loading}\" onerror=\"this.remove()\">`
    : '';
  return `<div class=\"avatar ${extraClass}\"><span class=\"avatar-fallback\">${escapeHTML(initials(creator.name))}</span>${image}</div>`;
}

function renderShell() {
  const header = document.getElementById('site-header');
  const footer = document.getElementById('site-footer');
  if (header) {
    header.innerHTML = `
      <header class="site-header">
        <div class="header-inner page-wrap">
          <a class="brand" href="index.html" aria-label="QuizCorner home"><span class="brand-mark">Q</span><span>QuizCorner</span></a>
          <nav class="main-nav" aria-label="Main navigation">
            <a href="index.html">Home</a>
            <a href="users.html">Creators</a>
            <a href="history.html">Results history</a>
          </nav>
        </div>
      </header>`;
  }
  if (footer) {
    footer.innerHTML = `
      <footer class="site-footer"><div class="page-wrap footer-inner">
        <a class="brand footer-brand" href="index.html"><span class="brand-mark">Q</span><span>QuizCorner</span></a>
        <p>Designed and developed by Priyabrat Mohanty.</p>
        <span class="footer-small">© ${new Date().getFullYear()} QuizCorner</span>
      </div></footer>`;
  }
}

async function getCreators() {
  const data = await loadJSON('data/creators.json');
  if (!data || !Array.isArray(data.creators)) throw new Error('Creator list has an invalid format.');
  return data.creators;
}

function creatorCard(creator) {
  const available = creator.quizEnabled === true;
  return `
    <article class="creator-card">
      <div class="creator-card-top">
        ${creatorAvatar(creator, '', 'lazy')}
        <span class="status-pill ${available ? 'status-live' : 'status-soon'}">${available ? 'Quiz available' : 'Coming soon'}</span>
      </div>
      <h2>${escapeHTML(creator.name)}</h2>
      <p class="creator-subject">${escapeHTML(creator.subject || 'Subject not added')}</p>
      <p class="creator-topic">${escapeHTML(creator.topic || 'Topic not added')}</p>
      <a class="button ${available ? 'button-primary' : 'button-muted'} button-block" href="user.html?creator=${encodeURIComponent(creator.id)}">${available ? 'View creator' : 'View profile'} <span aria-hidden="true">→</span></a>
    </article>`;
}

async function renderHome() {
  const slot = document.getElementById('featured-creator');
  try {
    const creators = await getCreators();
    const featured = creators.find(item => item.id === 'creator-01') || creators[0];
    if (!featured) throw new Error('No creators have been added yet.');
    slot.innerHTML = `
      <article class="featured-card">
        ${creatorAvatar(featured, 'avatar-large', 'eager')}
        <div class="featured-info"><span class="status-pill ${featured.quizEnabled ? 'status-live' : 'status-soon'}">${featured.quizEnabled ? 'Quiz available' : 'Coming soon'}</span>
          <h3>${escapeHTML(featured.name)}</h3><p>${escapeHTML(featured.subject)} · ${escapeHTML(featured.topic)}</p></div>
        <a class="button button-primary" href="user.html?creator=${encodeURIComponent(featured.id)}">Explore quiz →</a>
      </article>`;
  } catch (error) {
    slot.innerHTML = `<div class="error-card">${escapeHTML(error.message)}</div>`;
  }
}

async function renderCreators() {
  const slot = document.getElementById('creator-list');
  try {
    const creators = await getCreators();
    slot.innerHTML = creators.map(creatorCard).join('');
  } catch (error) {
    slot.innerHTML = `<div class="error-card">${escapeHTML(error.message)}</div>`;
  }
}

async function renderCreatorProfile() {
  const slot = document.getElementById('creator-profile');
  try {
    const creatorId = getParam('creator');
    const creators = await getCreators();
    const creator = creators.find(item => item.id === creatorId);
    if (!creator) {
      slot.innerHTML = '<div class="empty-card"><h2>Creator not found</h2><p>Return to the creator list and choose a profile.</p><a class="button button-primary" href="users.html">View creators</a></div>';
      return;
    }
    const quiz = await loadJSON(creator.quizFile);
    const hasQuiz = creator.quizEnabled === true && quiz.isPublished === true && Array.isArray(quiz.questions) && quiz.questions.length > 0;
    slot.innerHTML = `
      <section class="profile-card">
        <div class="profile-top">${creatorAvatar(creator, 'avatar-profile', 'eager')}<div>
          <span class="eyebrow">Quiz creator</span><h1>${escapeHTML(creator.name)}</h1><p class="profile-subject">${escapeHTML(creator.subject)}</p>
        </div></div>
        <div class="profile-divider"></div>
        <div class="profile-detail"><span>Quiz topic</span><strong>${escapeHTML(creator.topic)}</strong></div>
        <p class="profile-intro">${escapeHTML(creator.introduction || '')}</p>
        ${hasQuiz ? `
          <div class="available-quiz"><div><span class="status-pill status-live">Available now</span><h2>${escapeHTML(quiz.title)}</h2><p>${quiz.questions.length} questions · ${quiz.durationMinutes} minutes · ${quiz.totalMarks} marks</p></div>
            <form id="start-quiz-form" class="start-form"><label for="student-name">Your name</label><input id="student-name" name="studentName" type="text" maxlength="60" autocomplete="name" placeholder="Enter your name" required><button class="button button-primary button-block" type="submit">Start quiz <span aria-hidden="true">→</span></button></form>
          </div>` : `
          <div class="coming-soon-panel"><span class="status-pill status-soon">Coming soon</span><h2>No quiz published yet</h2><p>This creator's quiz will appear here once it has been added and published.</p></div>`}
      </section>`;
    const form = document.getElementById('start-quiz-form');
    if (form) form.addEventListener('submit', event => {
      event.preventDefault();
      const name = document.getElementById('student-name').value.trim();
      if (name.length < 2) {
        document.getElementById('student-name').focus();
        return;
      }
      sessionStorage.setItem(CANDIDATE_KEY, name);
      sessionStorage.removeItem(ACTIVE_KEY);
      window.location.href = `quiz.html?creator=${encodeURIComponent(creator.id)}`;
    });
  } catch (error) {
    slot.innerHTML = `<div class="error-card">${escapeHTML(error.message)}</div>`;
  }
}

function showQuizSetup(slot, creator, quiz) {
  const candidate = sessionStorage.getItem(CANDIDATE_KEY) || '';
  slot.innerHTML = `
    <section class="quiz-intro-card">
      <a class="back-link" href="user.html?creator=${encodeURIComponent(creator.id)}">← Back to creator</a>
      <span class="eyebrow">Timed assessment</span><h1>${escapeHTML(quiz.title)}</h1>
      <p class="quiz-intro-text">Prepared by ${escapeHTML(creator.name)} · ${quiz.questions.length} questions · ${quiz.durationMinutes} minutes · ${quiz.totalMarks} marks</p>
      <div class="instruction-box"><h2>Instructions</h2><ul>${(quiz.instructions || []).map(line => `<li>${escapeHTML(line)}</li>`).join('')}</ul></div>
      <form id="quiz-begin-form" class="start-form start-form-wide"><label for="candidate-name">Student name</label><input id="candidate-name" type="text" maxlength="60" value="${escapeHTML(candidate)}" placeholder="Enter your name" required><button class="button button-primary button-block" type="submit">Begin quiz</button></form>
    </section>`;
  document.getElementById('quiz-begin-form').addEventListener('submit', event => {
    event.preventDefault();
    const name = document.getElementById('candidate-name').value.trim();
    if (name.length < 2) return;
    sessionStorage.setItem(CANDIDATE_KEY, name);
    startQuiz(slot, creator, quiz, name);
  });
}

function startQuiz(slot, creator, quiz, studentName) {
  const state = {
    creator, quiz, studentName,
    current: 0,
    answers: {},
    startedAt: Date.now(),
    remaining: quiz.durationMinutes * 60,
    submitting: false,
    timerId: null
  };
  renderQuizView(slot, state);
  state.timerId = window.setInterval(() => {
    state.remaining -= 1;
    const timer = document.getElementById('quiz-timer');
    if (timer) {
      timer.textContent = formatTime(Math.max(0, state.remaining));
      timer.classList.toggle('timer-warning', state.remaining <= 60);
    }
    if (state.remaining <= 0) submitQuiz(state, true);
  }, 1000);
  document.getElementById('quiz-view').dataset.started = 'true';
}

function formatTime(seconds) {
  const safe = Math.max(0, Number(seconds) || 0);
  const mins = Math.floor(safe / 60).toString().padStart(2, '0');
  const secs = (safe % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function renderQuizView(slot, state) {
  const { quiz } = state;
  slot.innerHTML = `
    <section class="quiz-view" id="quiz-view">
      <div class="quiz-heading"><div><span class="eyebrow">${escapeHTML(state.studentName)} · ${escapeHTML(state.creator.name)}</span><h1>${escapeHTML(quiz.title)}</h1></div><div class="timer-box"><span>Time remaining</span><strong id="quiz-timer">${formatTime(state.remaining)}</strong></div></div>
      <div class="quiz-progress-track"><div id="quiz-progress-bar" class="quiz-progress-bar"></div></div>
      <div class="quiz-layout">
        <section class="question-panel"><div id="question-content"></div><div class="question-actions"><button id="previous-question" class="button button-outline" type="button">← Previous</button><span id="question-counter" class="question-counter"></span><button id="next-question" class="button button-primary" type="button">Next →</button></div></section>
        <aside class="question-sidebar"><h2>Question palette</h2><p>Choose a number to move to that question.</p><div id="question-palette" class="question-palette"></div><div class="palette-legend"><span><i class="legend-dot legend-answered"></i>Answered</span><span><i class="legend-dot legend-current"></i>Current</span><span><i class="legend-dot"></i>Not answered</span></div><div class="sidebar-summary"><span>Answered</span><strong id="answered-count">0 / ${quiz.questions.length}</strong></div><button id="submit-quiz" class="button button-primary button-block" type="button">Submit quiz</button></aside>
      </div>
    </section>`;
  paintQuestion(state);
  document.getElementById('previous-question').addEventListener('click', () => {
    if (state.current > 0) { state.current -= 1; paintQuestion(state); }
  });
  document.getElementById('next-question').addEventListener('click', () => {
    if (state.current < quiz.questions.length - 1) { state.current += 1; paintQuestion(state); }
  });
  document.getElementById('submit-quiz').addEventListener('click', () => submitQuiz(state, false));
}

function paintQuestion(state) {
  const questions = state.quiz.questions;
  const q = questions[state.current];
  const picked = state.answers[q.id] || '';
  const qContent = document.getElementById('question-content');
  qContent.innerHTML = `
    <div class="question-meta"><span>QUESTION ${state.current + 1} OF ${questions.length}</span><span>${q.marks || 1} mark${(q.marks || 1) === 1 ? '' : 's'}</span></div>
    <h2 class="question-text">${escapeHTML(q.text)}</h2>
    <div class="option-list">${Object.entries(q.options).map(([key, value]) => `
      <button type="button" class="option-button ${picked === key ? 'option-selected' : ''}" data-answer="${key}" aria-pressed="${picked === key}">
        <span class="option-letter">${key}</span><span>${escapeHTML(value)}</span><span class="option-check">${picked === key ? '✓' : ''}</span>
      </button>`).join('')}</div>`;
  qContent.querySelectorAll('[data-answer]').forEach(button => button.addEventListener('click', () => {
    state.answers[q.id] = button.dataset.answer;
    paintQuestion(state);
  }));

  const palette = document.getElementById('question-palette');
  palette.innerHTML = questions.map((item, index) => `
    <button type="button" class="palette-number ${index === state.current ? 'palette-current' : ''} ${state.answers[item.id] ? 'palette-answered' : ''}" data-index="${index}" aria-label="Question ${index + 1}${state.answers[item.id] ? ', answered' : ', not answered'}">${index + 1}</button>`).join('');
  palette.querySelectorAll('[data-index]').forEach(button => button.addEventListener('click', () => {
    state.current = Number(button.dataset.index);
    paintQuestion(state);
  }));
  document.getElementById('previous-question').disabled = state.current === 0;
  const next = document.getElementById('next-question');
  next.disabled = state.current === questions.length - 1;
  document.getElementById('question-counter').textContent = `${state.current + 1} / ${questions.length}`;
  const answered = Object.keys(state.answers).length;
  document.getElementById('answered-count').textContent = `${answered} / ${questions.length}`;
  document.getElementById('quiz-progress-bar').style.width = `${((state.current + 1) / questions.length) * 100}%`;
}

async function submitQuiz(state, timedOut) {
  if (state.submitting) return;
  const answered = Object.keys(state.answers).length;
  const unanswered = state.quiz.questions.length - answered;
  if (!timedOut && !window.confirm(`Submit your quiz now?\nAnswered: ${answered}\nUnanswered: ${unanswered}`)) return;
  state.submitting = true;
  if (state.timerId) window.clearInterval(state.timerId);
  const submitButton = document.getElementById('submit-quiz');
  if (submitButton) { submitButton.disabled = true; submitButton.textContent = 'Evaluating…'; }
  try {
    const keyData = await loadJSON(state.quiz.answerKeyFile);
    const keyMap = keyData.answers || {};
    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;
    for (const question of state.quiz.questions) {
      const selected = state.answers[question.id] || '';
      const correct = keyMap[question.id] || '';
      if (!selected) unansweredCount += 1;
      else if (selected === correct) { correctCount += 1; score += Number(question.marks || 1); }
      else wrongCount += 1;
    }
    const totalMarks = Number(state.quiz.totalMarks || state.quiz.questions.reduce((sum, q) => sum + Number(q.marks || 1), 0));
    const record = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      quizId: state.quiz.quizId,
      creatorId: state.creator.id,
      creatorName: state.creator.name,
      quizTitle: state.quiz.title,
      studentName: state.studentName,
      createdAt: new Date().toISOString(),
      timeTakenSeconds: Math.max(0, Math.floor((Date.now() - state.startedAt) / 1000)),
      durationMinutes: state.quiz.durationMinutes,
      totalMarks,
      score,
      percentage: totalMarks ? Math.round((score / totalMarks) * 100) : 0,
      correctCount,
      wrongCount,
      unansweredCount,
      answers: state.answers,
      correctAnswers: keyMap,
      questions: state.quiz.questions
    };
    const attempts = readAttempts();
    attempts.unshift(record);
    writeAttempts(attempts.slice(0, 100));
    sessionStorage.removeItem(ACTIVE_KEY);
    window.location.href = `result.html?attempt=${encodeURIComponent(record.id)}${timedOut ? '&timedOut=1' : ''}`;
  } catch (error) {
    state.submitting = false;
    if (submitButton) { submitButton.disabled = false; submitButton.textContent = 'Submit quiz'; }
    window.alert(`Could not evaluate the quiz. Please check that the answer-key file exists.\n${error.message}`);
  }
}

async function renderQuiz() {
  const slot = document.getElementById('quiz-app');
  try {
    const creatorId = getParam('creator');
    const creators = await getCreators();
    const creator = creators.find(item => item.id === creatorId);
    if (!creator) throw new Error('Creator not found. Please return to the creator list.');
    const quiz = await loadJSON(creator.quizFile);
    const published = creator.quizEnabled === true && quiz.isPublished === true && Array.isArray(quiz.questions) && quiz.questions.length > 0;
    if (!published) {
      slot.innerHTML = `<div class="empty-card"><h2>Quiz not available</h2><p>This creator has not published a quiz yet.</p><a class="button button-primary" href="user.html?creator=${encodeURIComponent(creator.id)}">Back to creator</a></div>`;
      return;
    }
    showQuizSetup(slot, creator, quiz);
  } catch (error) {
    slot.innerHTML = `<div class="error-card">${escapeHTML(error.message)}</div>`;
  }
}

function renderResult() {
  const slot = document.getElementById('result-app');
  const id = getParam('attempt');
  const record = readAttempts().find(item => item.id === id);
  if (!record) {
    slot.innerHTML = '<div class="empty-card"><h2>Result not found</h2><p>This result may have been cleared from this browser.</p><a class="button button-primary" href="history.html">View history</a></div>';
    return;
  }
  const questionReview = (record.questions || []).map((question, index) => {
    const selected = record.answers[question.id] || '';
    const correct = record.correctAnswers[question.id] || '';
    const selectedText = selected ? `${selected}. ${question.options[selected]}` : 'Not answered';
    const correctText = correct ? `${correct}. ${question.options[correct]}` : 'Answer key unavailable';
    const right = selected && selected === correct;
    return `<article class="review-item ${right ? 'review-correct' : 'review-incorrect'}">
      <div class="review-heading"><strong>Q${index + 1}. ${escapeHTML(question.text)}</strong><span class="review-state">${right ? 'Correct' : selected ? 'Incorrect' : 'Not answered'}</span></div>
      <p><span>Your answer:</span> ${escapeHTML(selectedText)}</p>
      <p><span>Correct answer:</span> ${escapeHTML(correctText)}</p>
    </article>`;
  }).join('');
  slot.innerHTML = `
    <section class="result-card">
      <span class="eyebrow">Quiz completed</span><h1>Well done, ${escapeHTML(record.studentName)}!</h1><p class="result-subtitle">${escapeHTML(record.quizTitle)} · ${escapeHTML(record.creatorName)}</p>
      <div class="score-panel"><span>Your score</span><strong>${record.score} <small>/ ${record.totalMarks}</small></strong><div class="score-meter"><i style="width:${Math.min(100, Math.max(0, record.percentage))}%"></i></div><b>${record.percentage}%</b></div>
      <div class="result-stats"><div><strong>${record.correctCount}</strong><span>Correct</span></div><div><strong>${record.wrongCount}</strong><span>Incorrect</span></div><div><strong>${record.unansweredCount}</strong><span>Unanswered</span></div><div><strong>${formatTime(record.timeTakenSeconds)}</strong><span>Time taken</span></div></div>
      <div class="result-actions"><a class="button button-primary" href="users.html">Explore creators</a><a class="button button-outline" href="history.html">Results history</a></div>
    </section>
    <section class="review-section"><div class="section-heading"><div><span class="eyebrow">Learn from your attempt</span><h2>Answer review</h2></div></div><div class="review-list">${questionReview}</div></section>`;
}

function renderHistory() {
  const slot = document.getElementById('history-app');
  const attempts = readAttempts();
  if (!attempts.length) {
    slot.innerHTML = '<div class="empty-card"><div class="empty-icon">▤</div><h2>No results yet</h2><p>Your completed quizzes will appear here on this browser.</p><a class="button button-primary" href="users.html">Explore creators</a></div>';
    return;
  }
  slot.innerHTML = `
    <div class="history-toolbar"><p>${attempts.length} saved attempt${attempts.length === 1 ? '' : 's'}</p><button class="button button-outline button-small" id="clear-history" type="button">Clear history</button></div>
    <div class="history-list">${attempts.map(item => `
      <article class="history-card"><div class="history-main"><span class="history-date">${escapeHTML(formatDate(item.createdAt))}</span><h2>${escapeHTML(item.quizTitle)}</h2><p>${escapeHTML(item.studentName)} · ${escapeHTML(item.creatorName)}</p></div><div class="history-score"><strong>${item.score}/${item.totalMarks}</strong><span>${item.percentage}%</span></div><a class="button button-outline button-small" href="result.html?attempt=${encodeURIComponent(item.id)}">View result</a></article>`).join('')}</div>`;
  document.getElementById('clear-history').addEventListener('click', () => {
    if (!window.confirm('Clear all quiz history saved on this browser? This cannot be undone.')) return;
    writeAttempts([]);
    renderHistory();
  });
}

function boot() {
  renderShell();
  const page = document.body.dataset.page;
  const actions = {
    home: renderHome,
    creators: renderCreators,
    creator: renderCreatorProfile,
    quiz: renderQuiz,
    result: renderResult,
    history: renderHistory
  };
  if (actions[page]) actions[page]();
}

document.addEventListener('DOMContentLoaded', boot);
