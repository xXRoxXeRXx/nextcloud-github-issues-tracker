// add.js - Add Issue Form Logic

const API_BASE = '/api';

// DOM Elements
const form = document.getElementById('add-issue-form');
const githubUrlInput = document.getElementById('github-url');
const issueTypeSelect = document.getElementById('issue-type');
const categorySelect = document.getElementById('category-select');
const newCategoryInput = document.getElementById('new-category');
const messageContainer = document.getElementById('message-container');

// Load categories on page load
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE}/categories`);

        if (!response.ok) {
            throw new Error('Fehler beim Laden der Kategorien');
        }

        const categories = await response.json();
        populateCategorySelect(categories);
    } catch (error) {
        console.error('Fehler beim Laden der Kategorien:', error);
        categorySelect.innerHTML = '<option value="">Fehler beim Laden</option>';
    }
}

// Populate category dropdown
function populateCategorySelect(categories) {
    if (categories.length === 0) {
        categorySelect.innerHTML = '<option value="">Keine Kategorien vorhanden</option>';
        return;
    }

    categorySelect.innerHTML = '<option value="">-- Kategorie auswählen --</option>';

    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.name;
        option.textContent = category.name;
        categorySelect.appendChild(option);
    });
}

// Handle form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const githubUrl = githubUrlInput.value.trim();
    const issueType = issueTypeSelect.value;
    const selectedCategory = categorySelect.value;
    const newCategory = newCategoryInput.value.trim();

    // Validate inputs
    if (!githubUrl) {
        showMessage('Bitte gib eine GitHub URL ein', 'error');
        return;
    }

    if (!selectedCategory && !newCategory) {
        showMessage('Bitte wähle eine Kategorie aus oder erstelle eine neue', 'error');
        return;
    }

    // Use new category if provided, otherwise use selected
    const categoryName = newCategory || selectedCategory;

    try {
        // Disable form during submission
        setFormDisabled(true);
        showMessage('Issue wird hinzugefügt...', 'info');

        const response = await fetch(`${API_BASE}/issues`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                github_url: githubUrl,
                category_name: categoryName,
                type: issueType
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Fehler beim Hinzufügen des Issues');
        }

        // Success!
        showMessage('✓ Issue erfolgreich hinzugefügt!', 'success');

        // Reset form
        form.reset();

        // Reload categories if new one was created
        if (newCategory) {
            await loadCategories();
        }

        // Redirect to main page after 1.5 seconds
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);

    } catch (error) {
        showMessage(error.message, 'error');
        setFormDisabled(false);
    }
});

// Clear new category input when selecting from dropdown
categorySelect.addEventListener('change', () => {
    if (categorySelect.value) {
        newCategoryInput.value = '';
    }
});

// Clear category select when typing new category
newCategoryInput.addEventListener('input', () => {
    if (newCategoryInput.value) {
        categorySelect.value = '';
    }
});

// Show message to user
function showMessage(text, type = 'info') {
    const messageClass = type === 'error' ? 'message-error' :
        type === 'success' ? 'message-success' :
            'message';

    const icon = type === 'error' ? '⚠️' :
        type === 'success' ? '✓' :
            'ℹ️';

    messageContainer.innerHTML = `
    <div class="${messageClass} message">
      <span>${icon}</span>
      <span>${escapeHtml(text)}</span>
    </div>
  `;
}

// Enable/disable form
function setFormDisabled(disabled) {
    const inputs = form.querySelectorAll('input, select, button');
    inputs.forEach(input => {
        input.disabled = disabled;
    });
}

// Utility: Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
});
