const fetch = require('node-fetch');

// GitHub Token aus Umgebungsvariable (optional)
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

/**
 * Parst eine GitHub Issue/PR URL und extrahiert Owner, Repo und Issue-Nummer
 * Unterstützt Formate:
 * - https://github.com/owner/repo/issues/123
 * - https://github.com/owner/repo/pull/456
 */
function parseGithubUrl(url) {
    const regex = /github\.com\/([^\/]+)\/([^\/]+)\/(issues|pull)\/(\d+)/;
    const match = url.match(regex);

    if (!match) {
        throw new Error('Ungültige GitHub URL. Format: https://github.com/owner/repo/issues/123');
    }

    return {
        owner: match[1],
        repo: match[2],
        urlType: match[3], // 'issues' oder 'pull'
        number: parseInt(match[4], 10)
    };
}

/**
 * Holt Issue-Details von der GitHub API
 */
async function fetchIssueDetails(owner, repo, issueNumber) {
    // GitHub API behandelt Pull Requests auch unter dem /issues Endpoint
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`;

    const headers = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GitHub-Status-Tracker'
    };

    // Optionaler Token für höhere Rate Limits
    if (GITHUB_TOKEN) {
        headers['Authorization'] = `token ${GITHUB_TOKEN}`;
    }

    try {
        const response = await fetch(apiUrl, { headers });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Issue nicht gefunden. Bitte URL überprüfen.');
            }
            if (response.status === 403) {
                throw new Error('GitHub API Rate Limit erreicht. Bitte später erneut versuchen.');
            }
            throw new Error(`GitHub API Fehler: ${response.status}`);
        }

        const data = await response.json();

        // Bestimme ob es ein Pull Request ist
        const isPullRequest = !!data.pull_request;

        return {
            title: data.title,
            state: data.state, // 'open' oder 'closed'
            labels: data.labels.map(label => ({
                name: label.name,
                color: label.color
            })),
            githubType: isPullRequest ? 'Pull Request' : 'Issue',
            url: data.html_url,
            created_at: data.created_at,
            updated_at: data.updated_at
        };
    } catch (error) {
        throw error;
    }
}

/**
 * Holt Issue-Details basierend auf einer GitHub URL
 */
async function getIssueFromUrl(githubUrl) {
    const parsed = parseGithubUrl(githubUrl);
    const details = await fetchIssueDetails(parsed.owner, parsed.repo, parsed.number);

    return {
        ...parsed,
        ...details
    };
}

module.exports = {
    parseGithubUrl,
    fetchIssueDetails,
    getIssueFromUrl
};
