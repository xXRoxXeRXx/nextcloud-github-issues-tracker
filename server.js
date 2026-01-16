const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('./database');
const githubApi = require('./github-api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Datenbank initialisieren
// Erstelle data Verzeichnis falls nicht vorhanden
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}
db.initDatabase();

// ======== API Endpoints ========

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Kategorien abrufen
app.get('/api/categories', (req, res) => {
    try {
        const categories = db.getAllCategories();
        res.json(categories);
    } catch (error) {
        console.error('Fehler beim Abrufen der Kategorien:', error);
        res.status(500).json({ error: 'Fehler beim Abrufen der Kategorien' });
    }
});

// Kategorie erstellen
app.post('/api/categories', (req, res) => {
    const { name } = req.body;

    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Kategoriename erforderlich' });
    }

    try {
        // Prüfe ob Kategorie bereits existiert
        const existing = db.getCategoryByName(name);
        if (existing) {
            return res.json(existing);
        }

        const category = db.createCategory(name);
        res.status(201).json(category);
    } catch (error) {
        console.error('Fehler beim Erstellen der Kategorie:', error);
        res.status(500).json({ error: 'Fehler beim Erstellen der Kategorie' });
    }
});

// Issues abrufen (mit aktuellen GitHub-Daten)
app.get('/api/issues', async (req, res) => {
    try {
        const issues = db.getAllIssues();

        // Aktualisiere jedes Issue mit den neuesten GitHub-Daten
        const updatedIssues = await Promise.all(
            issues.map(async (issue) => {
                try {
                    const githubData = await githubApi.fetchIssueDetails(
                        issue.owner,
                        issue.repo,
                        issue.issue_number
                    );

                    return {
                        id: issue.id,
                        github_url: issue.github_url,
                        category_name: issue.category_name,
                        type: issue.type,
                        ...githubData
                    };
                } catch (error) {
                    console.error(`Fehler beim Abrufen von Issue ${issue.github_url}:`, error.message);
                    // Fallback wenn GitHub API fehlschlägt
                    return {
                        id: issue.id,
                        github_url: issue.github_url,
                        category_name: issue.category_name,
                        type: issue.type,
                        title: 'Fehler beim Laden',
                        state: 'unknown',
                        labels: [],
                        error: error.message
                    };
                }
            })
        );

        res.json(updatedIssues);
    } catch (error) {
        console.error('Fehler beim Abrufen der Issues:', error);
        res.status(500).json({ error: 'Fehler beim Abrufen der Issues' });
    }
});

// Issue hinzufügen
app.post('/api/issues', async (req, res) => {
    const { github_url, category_name, type } = req.body;

    if (!github_url || !category_name) {
        return res.status(400).json({ error: 'GitHub URL und Kategorie erforderlich' });
    }

    // Validiere type
    const issueType = type || 'Bug';
    if (issueType !== 'Feature' && issueType !== 'Bug') {
        return res.status(400).json({ error: 'Type muss "Feature" oder "Bug" sein' });
    }

    try {
        // Prüfe ob Issue bereits existiert
        const existing = db.getIssueByUrl(github_url);
        if (existing) {
            return res.status(409).json({ error: 'Issue wurde bereits hinzugefügt' });
        }

        // Parse und validiere GitHub URL
        const parsed = githubApi.parseGithubUrl(github_url);

        // Hole Issue-Details von GitHub
        const githubData = await githubApi.getIssueFromUrl(github_url);

        // Erstelle oder hole Kategorie
        let category = db.getCategoryByName(category_name);
        if (!category) {
            category = db.createCategory(category_name);
        }

        // Speichere Issue in Datenbank
        const issue = db.createIssue(
            github_url,
            category.id,
            issueType,
            parsed.owner,
            parsed.repo,
            parsed.number
        );

        res.status(201).json({
            id: issue.id,
            github_url,
            category_name,
            type: issueType,
            ...githubData
        });
    } catch (error) {
        console.error('Fehler beim Hinzufügen des Issues:', error);
        res.status(400).json({ error: error.message });
    }
});

// Issue löschen
app.delete('/api/issues/:id', (req, res) => {
    const { id } = req.params;

    try {
        const result = db.deleteIssue(id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Issue nicht gefunden' });
        }

        res.json({ success: true, message: 'Issue gelöscht' });
    } catch (error) {
        console.error('Fehler beim Löschen des Issues:', error);
        res.status(500).json({ error: 'Fehler beim Löschen des Issues' });
    }
});

// Server starten
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════╗
║   🚀 GitHub Status Tracker läuft!        ║
║                                           ║
║   URL: http://localhost:${PORT}            ║
║   Health: http://localhost:${PORT}/health  ║
╚═══════════════════════════════════════════╝
  `);

    if (process.env.GITHUB_TOKEN) {
        console.log('✅ GitHub Token konfiguriert (höhere Rate Limits aktiv)');
    } else {
        console.log('ℹ️  Kein GitHub Token - Rate Limit: 60 Anfragen/Stunde');
    }
});
