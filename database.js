const Database = require('better-sqlite3');
const path = require('path');

// Datenbank-Verbindung
const dbPath = process.env.DB_PATH || path.join(__dirname, 'data', 'issues.db');
const db = new Database(dbPath);

// Tabellen erstellen
function initDatabase() {
    // Kategorien-Tabelle
    db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    // Issues-Tabelle
    db.exec(`
    CREATE TABLE IF NOT EXISTS issues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      github_url TEXT NOT NULL UNIQUE,
      category_id INTEGER NOT NULL,
      type TEXT NOT NULL DEFAULT 'Bug',
      owner TEXT NOT NULL,
      repo TEXT NOT NULL,
      issue_number INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);

    console.log('✅ Datenbank initialisiert');
}

// Kategorie-Operationen
function getAllCategories() {
    const stmt = db.prepare('SELECT * FROM categories ORDER BY name ASC');
    return stmt.all();
}

function getCategoryById(id) {
    const stmt = db.prepare('SELECT * FROM categories WHERE id = ?');
    return stmt.get(id);
}

function getCategoryByName(name) {
    const stmt = db.prepare('SELECT * FROM categories WHERE name = ?');
    return stmt.get(name);
}

function createCategory(name) {
    const stmt = db.prepare('INSERT INTO categories (name) VALUES (?)');
    const result = stmt.run(name);
    return { id: result.lastInsertRowid, name };
}

// Issue-Operationen
function getAllIssues() {
    const stmt = db.prepare(`
    SELECT i.*, c.name as category_name
    FROM issues i
    JOIN categories c ON i.category_id = c.id
    ORDER BY i.created_at DESC
  `);
    return stmt.all();
}

function getIssueByUrl(url) {
    const stmt = db.prepare('SELECT * FROM issues WHERE github_url = ?');
    return stmt.get(url);
}

function createIssue(githubUrl, categoryId, type, owner, repo, issueNumber) {
    const stmt = db.prepare(`
    INSERT INTO issues (github_url, category_id, type, owner, repo, issue_number)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
    const result = stmt.run(githubUrl, categoryId, type, owner, repo, issueNumber);
    return { id: result.lastInsertRowid };
}

function deleteIssue(id) {
    const stmt = db.prepare('DELETE FROM issues WHERE id = ?');
    return stmt.run(id);
}

module.exports = {
    initDatabase,
    getAllCategories,
    getCategoryById,
    getCategoryByName,
    createCategory,
    getAllIssues,
    getIssueByUrl,
    createIssue,
    deleteIssue
};
