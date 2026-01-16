# 🚀 GitHub Status Tracker

Ein Tool zur übersichtlichen, kategorisierten Darstellung von GitHub Issues mit automatischer Status-Aktualisierung.

## Features

✨ **Moderne Weboberfläche** - Premium Design mit Glassmorphism und Animationen  
📊 **Kategorisierte Ansicht** - Issues werden nach Kategorien gruppiert  
🔄 **Automatische Updates** - GitHub Status wird beim Laden aktualisiert  
🏷️ **Label-Unterstützung** - Zeigt alle GitHub Labels an  
🎯 **Issue & PR Support** - Funktioniert mit Issues und Pull Requests  
🐳 **Docker Ready** - Einfaches Deployment mit Docker Compose  
⚡ **Health Checks** - Container-Monitoring integriert  

## Schnellstart mit Docker (Empfohlen)

### Voraussetzungen
- Docker
- Docker Compose

### Installation

1. **Repository klonen oder Dateien herunterladen**

2. **Optional: GitHub Token konfigurieren** (für höhere API Rate Limits)
   ```bash
   cp .env.example .env
   ```
   Bearbeite `.env` und füge deinen GitHub Token hinzu:
   ```
   GITHUB_TOKEN=dein_github_token_hier
   ```
   
   > **Hinweis**: Ohne Token sind 60 API-Anfragen pro Stunde möglich.  
   > Mit Token: 5000 Anfragen pro Stunde.
   >
   > Token erstellen: https://github.com/settings/tokens  
   > Für öffentliche Repos: Keine besonderen Berechtigungen erforderlich  
   > Für private Repos: "repo" Berechtigung erforderlich

3. **Container starten**
   ```bash
   docker-compose up -d
   ```

4. **Öffne im Browser**
   ```
   http://localhost:3000
   ```

### Docker Befehle

```bash
# Container starten
docker-compose up -d

# Logs ansehen
docker-compose logs -f

# Container stoppen
docker-compose down

# Container neu bauen
docker-compose up -d --build

# Health Status prüfen
docker-compose ps
```

## Lokale Entwicklung (ohne Docker)

### Voraussetzungen
- Node.js 18+ 
- npm

### Installation

1. **Dependencies installieren**
   ```bash
   npm install
   ```

2. **Optional: GitHub Token konfigurieren**
   ```bash
   cp .env.example .env
   # Bearbeite .env und füge Token hinzu
   ```

3. **Server starten**
   ```bash
   npm start
   ```

4. **Öffne im Browser**
   ```
   http://localhost:3000
   ```

## Verwendung

### Issue hinzufügen

1. Klicke auf "Issue hinzufügen"
2. Füge die GitHub Issue URL ein (z.B. `https://github.com/facebook/react/issues/12345`)
3. Wähle eine vorhandene Kategorie oder erstelle eine neue
4. Klicke auf "Issue hinzufügen"

### Kategorien

Kategorien werden automatisch erstellt, wenn du ein Issue hinzufügst. Beispiele:
- Bugfixes
- Features
- Documentation
- Performance
- Security

### Unterstützte URL-Formate

- Issues: `https://github.com/owner/repo/issues/123`
- Pull Requests: `https://github.com/owner/repo/pull/456`

## API Endpoints

Die Anwendung stellt folgende REST API bereit:

### `GET /health`
Health Check Endpoint für Container-Monitoring

### `GET /api/categories`
Alle Kategorien abrufen

### `POST /api/categories`
Neue Kategorie erstellen
```json
{
  "name": "Bugfixes"
}
```

### `GET /api/issues`
Alle Issues mit aktuellem GitHub-Status abrufen

### `POST /api/issues`
Neues Issue hinzufügen
```json
{
  "github_url": "https://github.com/owner/repo/issues/123",
  "category_name": "Bugfixes"
}
```

## Datenbank

Die Anwendung verwendet SQLite für die Datenspeicherung. Die Datenbank wird automatisch im `data/` Verzeichnis erstellt.

**Bei Docker**: Das `data/` Verzeichnis wird als Volume gemountet, sodass deine Daten persistent bleiben.

## Technologie-Stack

- **Backend**: Node.js, Express
- **Datenbank**: SQLite3
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Design**: Glassmorphism, Dark Theme, Gradient Animations
- **Deployment**: Docker, Docker Compose

## Troubleshooting

### GitHub API Rate Limit

**Problem**: "GitHub API Rate Limit erreicht"

**Lösung**: 
1. Erstelle einen GitHub Personal Access Token
2. Füge ihn zur `.env` Datei hinzu
3. Starte den Container neu: `docker-compose restart`

### Port bereits in Verwendung

**Problem**: Port 3000 ist bereits belegt

**Lösung**: Ändere den Port in `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Nutze Port 3001 statt 3000
```

### Container startet nicht

**Lösung**: Prüfe die Logs
```bash
docker-compose logs
```

## Lizenz

MIT

## Support

Bei Fragen oder Problemen erstelle bitte ein Issue im Repository.
