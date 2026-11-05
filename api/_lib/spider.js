const API_BASE = "https://spiderwebargapi.com.ar/api/v1";

function getConfig() {
	return {
		apiKey: process.env.spiderapykey || process.env.SPIDER_API_KEY || "",
		dbName:
			process.env.spiderwebdbname ||
			process.env.SPIDER_DB_NAME ||
			"sw_Franco Calegari_PortfolioFrancoCalegari",
		storageProjectId:
			process.env.spidercloudstorageid ||
			process.env.SPIDER_STORAGE_PROJECT_ID ||
			"46",
		adminSecret: process.env.ADMIN_SECRET_KEY || "",
		chatbotEnabled: process.env.CHATBOT_ENABLED === "true",
	};
}

/**
 * Escapes values safely for SQL string literals to prevent SQL injection
 */
function sqlVal(val) {
	if (val === null || val === undefined) return "NULL";
	if (typeof val === "number") return Number.isFinite(val) ? String(val) : "0";
	if (typeof val === "boolean") return val ? "1" : "0";
	const escaped = String(val)
		.replace(/\\/g, "\\\\")
		.replace(/\0/g, "\\0")
		.replace(/\n/g, "\\n")
		.replace(/\r/g, "\\r")
		.replace(/'/g, "\\'")
		.replace(/"/g, '\\"')
		.replace(/\x1a/g, "\\Z");
	return `'${escaped}'`;
}

/**
 * Verify admin key header when ADMIN_SECRET_KEY is configured
 */
function verifyAdmin(req) {
	const { adminSecret } = getConfig();
	if (!adminSecret) return true; // Local fallback if not set
	const provided =
		req.headers["x-admin-key"] ||
		(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
	return provided === adminSecret;
}

/**
 * Execute SQL query against SpiderWebArgAPI
 */
async function querySQL(query) {
	const { apiKey, dbName } = getConfig();
	if (!apiKey) {
		throw new Error("Falta configurar spiderapykey en las variables de entorno");
	}
	const res = await fetch(`${API_BASE}/query`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-API-KEY": apiKey,
		},
		body: JSON.stringify({ database: dbName, query }),
	});
	const data = await res.json();
	if (!res.ok || data.success === false) {
		throw new Error(data.error || data.message || `Error SQL (${res.status})`);
	}
	return data.result;
}

/**
 * Ensure the projects table exists
 */
async function ensureProjectsTable() {
	return querySQL(`CREATE TABLE IF NOT EXISTS projects (
		id INT AUTO_INCREMENT PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		description TEXT,
		image VARCHAR(500),
		storage_file_id INT NULL,
		url VARCHAR(500) NOT NULL,
		alt VARCHAR(255),
		destacado TINYINT(1) DEFAULT 0,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	)`);
}

// ==================== STORAGE HELPERS ====================

async function listStorageFiles() {
	const { apiKey, storageProjectId } = getConfig();
	const res = await fetch(
		`${API_BASE}/storage/projects/${storageProjectId}/files`,
		{
			headers: { "X-API-KEY": apiKey },
		},
	);
	return res.json();
}

async function uploadStorageBuffer(buffer, filename, mimeType) {
	const { apiKey, storageProjectId } = getConfig();
	const form = new FormData();
	const blob = new Blob([buffer], {
		type: mimeType || "application/octet-stream",
	});
	form.append("files", blob, filename || "upload.jpg");

	const res = await fetch(
		`${API_BASE}/storage/projects/${storageProjectId}/files`,
		{
			method: "POST",
			headers: { "X-API-KEY": apiKey },
			body: form,
		},
	);
	const data = await res.json();
	if (!res.ok || data.success === false) {
		throw new Error(
			data.error || data.message || `Error subiendo archivo (${res.status})`,
		);
	}
	return data;
}

async function fetchStorageFileResponse(fileId) {
	const { apiKey } = getConfig();
	return fetch(`${API_BASE}/storage/files/${encodeURIComponent(fileId)}`, {
		headers: { "X-API-KEY": apiKey },
	});
}

async function deleteStorageFile(fileId) {
	const { apiKey } = getConfig();
	const res = await fetch(
		`${API_BASE}/storage/files/${encodeURIComponent(fileId)}`,
		{
			method: "DELETE",
			headers: { "X-API-KEY": apiKey },
		},
	);
	return res.json();
}

// ==================== SPIDER IA (DEJADO PREVISTO) ====================

async function getIAModels() {
	const { apiKey } = getConfig();
	const res = await fetch(`${API_BASE}/ia/models`, {
		headers: { "X-API-KEY": apiKey },
	});
	return res.json();
}

async function getIAUsage() {
	const { apiKey } = getConfig();
	const res = await fetch(`${API_BASE}/ia/usage`, {
		headers: { "X-API-KEY": apiKey },
	});
	return res.json();
}

async function sendIAChat({ modelId, messages }) {
	const { apiKey } = getConfig();
	const res = await fetch(`${API_BASE}/ia/chat`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-API-KEY": apiKey,
		},
		body: JSON.stringify({
			model_id: modelId,
			messages,
		}),
	});
	return res.json();
}

module.exports = {
	API_BASE,
	getConfig,
	sqlVal,
	verifyAdmin,
	querySQL,
	ensureProjectsTable,
	listStorageFiles,
	uploadStorageBuffer,
	fetchStorageFileResponse,
	deleteStorageFile,
	getIAModels,
	getIAUsage,
	sendIAChat,
};

