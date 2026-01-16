// app.js - Main Dashboard Logic

const API_BASE = '/api';

// DOM Elements
const loadingEl = document.getElementById('loading');
const errorMessageEl = document.getElementById('error-message');
const issuesContainer = document.getElementById('issues-container');
const emptyStateEl = document.getElementById('empty-state');

// Fetch and display all issues
async function loadIssues() {
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/issues`);

        if (!response.ok) {
            throw new Error('Fehler beim Laden der Issues');
        }

        const issues = await response.json();
        displayIssues(issues);
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

// Group issues first by type (Feature/Bug), then by category
function groupByTypeAndCategory(issues) {
    const grouped = {
        'Feature': {},
        'Bug': {}
    };

    issues.forEach(issue => {
        const type = issue.type || 'Bug';
        const category = issue.category_name || 'Ohne Kategorie';

        if (!grouped[type]) {
            grouped[type] = {};
        }

        if (!grouped[type][category]) {
            grouped[type][category] = [];
        }

        grouped[type][category].push(issue);
    });

    return grouped;
}

// Display issues grouped by type and category
function displayIssues(issues) {
    if (issues.length === 0) {
        showEmptyState();
        return;
    }

    const grouped = groupByTypeAndCategory(issues);

    // Separate HTML for Features and Bugs
    const featureHtml = renderTypeSection('Feature', grouped['Feature'] || {});
    const bugHtml = renderTypeSection('Bug', grouped['Bug'] || {});

    // Render both columns
    issuesContainer.innerHTML = featureHtml + bugHtml;
    issuesContainer.style.display = 'grid';
    hideEmptyState();

    // Attach delete event listeners
    attachDeleteListeners();
}

// Render a single type section
function renderTypeSection(type, categories) {
    const typeIcon = type === 'Feature' ? '✨' : '🐛';
    const issueCount = Object.values(categories).reduce((acc, arr) => acc + arr.length, 0);

    // Return empty string if no issues
    if (issueCount === 0) {
        return `
      <div class="type-section type-section--empty">
        <div class="type-section__header">
          <h2 class="type-section__title">${typeIcon} ${type}</h2>
          <span class="type-section__count">0 Issues</span>
        </div>
        <div class="empty-state" style="padding: 2rem;">
          <p style="color: var(--text-muted);">Keine ${type}s vorhanden</p>
        </div>
      </div>
    `;
    }

    let categoriesHtml = '';

    // Render each category within this type
    Object.entries(categories).forEach(([category, categoryIssues]) => {
        if (categoryIssues.length === 0) return;

        categoriesHtml += `
      <section class="category-section">
        <div class="category-section__header">
          <h3 class="category-section__title">${escapeHtml(category)}</h3>
          <span class="category-section__count">${categoryIssues.length}</span>
        </div>
        <div class="category-section__grid">
          ${categoryIssues.map(issue => renderIssueCard(issue)).join('')}
        </div>
      </section>
    `;
    });

    return `
    <div class="type-section">
      <div class="type-section__header">
        <h2 class="type-section__title">${typeIcon} ${type}</h2>
        <span class="type-section__count">${issueCount} ${issueCount === 1 ? 'Issue' : 'Issues'}</span>
      </div>
      <div class="type-section__categories">
        ${categoriesHtml}
      </div>
    </div>
  `;
}

// Render individual issue card
function renderIssueCard(issue) {
    const statusBadge = getStatusBadge(issue.state);
    const typeBadge = getTypeBadge(issue.githubType || 'Issue');
    const labels = renderLabels(issue.labels);

    return `
    <article class="card issue-card" data-issue-id="${issue.id}">
      <div class="issue-card__header">
        <div class="issue-card__header-content">
          <a href="${issue.github_url}" target="_blank" class="issue-card__title">
            ${escapeHtml(issue.title)}
          </a>
        </div>
        <button class="btn-delete" data-issue-id="${issue.id}" title="Issue löschen">
          🗑️
        </button>
      </div>
      <div class="issue-card__meta">
        ${statusBadge}
        ${typeBadge}
      </div>
      ${labels ? `<div class="issue-card__labels">${labels}</div>` : ''}
      ${issue.error ? `<div class="form-hint" style="color: var(--accent-warning);">⚠️ ${escapeHtml(issue.error)}</div>` : ''}
    </article>
  `;
}

// Get status badge HTML
function getStatusBadge(state) {
    const stateMap = {
        'open': { class: 'badge-open', icon: '●', text: 'Open' },
        'closed': { class: 'badge-closed', icon: '✓', text: 'Closed' },
        'unknown': { class: 'badge-unknown', icon: '?', text: 'Unknown' }
    };

    const config = stateMap[state] || stateMap.unknown;
    return `<span class="badge ${config.class}"><span>${config.icon}</span> ${config.text}</span>`;
}

// Get type badge HTML (for GitHub PR vs Issue, not Feature/Bug)
function getTypeBadge(type) {
    return `<span class="badge badge-type">${escapeHtml(type)}</span>`;
}

// Render labels
function renderLabels(labels) {
    if (!labels || labels.length === 0) return '';

    return labels.map(label => {
        const bgColor = `#${label.color}`;
        const textColor = getContrastColor(label.color);

        return `
      <span class="label-tag" style="background-color: ${bgColor}; color: ${textColor}; border-color: ${bgColor};">
        ${escapeHtml(label.name)}
      </span>
    `;
    }).join('');
}

// Calculate contrast color for label text
function getContrastColor(hexColor) {
    // Convert hex to RGB
    const r = parseInt(hexColor.substr(0, 2), 16);
    const g = parseInt(hexColor.substr(2, 2), 16);
    const b = parseInt(hexColor.substr(4, 2), 16);

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5 ? '#000000' : '#ffffff';
}

// Attach delete event listeners
function attachDeleteListeners() {
    const deleteButtons = document.querySelectorAll('.btn-delete');

    deleteButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            e.stopPropagation();
            const issueId = button.dataset.issueId;
            await handleDelete(issueId);
        });
    });
}

// Handle issue deletion
async function handleDelete(issueId) {
    // Confirmation dialog
    const confirmed = confirm('Möchtest du dieses Issue wirklich löschen?');

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/issues/${issueId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Fehler beim Löschen');
        }

        // Remove card from DOM with animation
        const card = document.querySelector(`.issue-card[data-issue-id="${issueId}"]`);
        if (card) {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.9)';
            setTimeout(() => {
                card.remove();

                // Reload if no more issues
                const remainingCards = document.querySelectorAll('.issue-card');
                if (remainingCards.length === 0) {
                    loadIssues();
                }
            }, 250);
        }
    } catch (error) {
        alert(`Fehler beim Löschen: ${error.message}`);
    }
}

// UI State Management
function showLoading() {
    loadingEl.style.display = 'flex';
    issuesContainer.style.display = 'none';
    emptyStateEl.style.display = 'none';
    errorMessageEl.style.display = 'none';
}

function hideLoading() {
    loadingEl.style.display = 'none';
}

function showEmptyState() {
    emptyStateEl.style.display = 'block';
    issuesContainer.style.display = 'none';
}

function hideEmptyState() {
    emptyStateEl.style.display = 'none';
}

function showError(message) {
    errorMessageEl.className = 'message message-error';
    errorMessageEl.innerHTML = `<span>⚠️</span> <span>${escapeHtml(message)}</span>`;
    errorMessageEl.style.display = 'flex';
    hideLoading();
}

// Utility: Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadIssues();
});
