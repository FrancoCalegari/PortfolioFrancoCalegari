const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

// Cargar variables de .env de forma nativa
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
	const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const eqIdx = trimmed.indexOf("=");
		if (eqIdx === -1) continue;
		const key = trimmed.slice(0, eqIdx).trim();
		const val = trimmed
			.slice(eqIdx + 1)
			.trim()
			.replace(/^["']|["']$/g, "");
		if (!(key in process.env)) {
			process.env[key] = val;
		}
	}
}

const projectsHandler = require("./api/projects");
const storageHandler = require("./api/storage");
const chatHandler = require("./api/chat");

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
	".html": "text/html; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".js": "application/javascript; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".webp": "image/webp",
	".svg": "image/svg+xml",
	".ico": "image/x-icon",
	".pdf": "application/pdf",
	".ttf": "font/ttf",
};

function readBody(req) {
	return new Promise((resolve) => {
		const chunks = [];
		req.on("data", (c) => chunks.push(c));
		req.on("end", () => {
			const raw = Buffer.concat(chunks).toString("utf8");
			if (!raw) return resolve({});
			try {
				resolve(JSON.parse(raw));
			} catch {
				resolve({});
			}
		});
	});
}

function decorateRes(res) {
	res.status = (code) => {
		res.statusCode = code;
		return res;
	};
	res.json = (data) => {
		if (!res.getHeader("Content-Type")) {
			res.setHeader("Content-Type", "application/json; charset=utf-8");
		}
		res.end(JSON.stringify(data));
		return res;
	};
	res.send = (buf) => {
		res.end(buf);
		return res;
	};
	return res;
}

const server = http.createServer(async (req, res) => {
	decorateRes(res);
	const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
	req.query = Object.fromEntries(parsedUrl.searchParams.entries());
	const pathname = decodeURIComponent(parsedUrl.pathname);

	if (pathname.startsWith("/api/")) {
		req.body = await readBody(req);
		if (pathname === "/api/projects" || pathname.startsWith("/api/projects/")) {
			return projectsHandler(req, res);
		}
		if (pathname === "/api/storage") {
			return storageHandler(req, res);
		}
		if (pathname === "/api/chat") {
			return chatHandler(req, res);
		}
		return res.status(404).json({ error: "Endpoint no encontrado" });
	}

	// Servir archivos estáticos
	let relPath = pathname === "/" ? "/index.html" : pathname;
	if (relPath === "/admin" || relPath === "/admin/") {
		relPath = "/admin/index.html";
	}
	const safePath = path.normalize(path.join(__dirname, relPath));
	if (!safePath.startsWith(__dirname)) {
		return res.status(403).end("Forbidden");
	}

	fs.stat(safePath, (err, stat) => {
		if (err || !stat.isFile()) {
			res.status(404).end("Not Found");
			return;
		}
		const ext = path.extname(safePath).toLowerCase();
		res.setHeader("Content-Type", MIME_TYPES[ext] || "application/octet-stream");
		fs.createReadStream(safePath).pipe(res);
	});
});

if (require.main === module) {
	server.listen(PORT, () => {
		console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
		console.log(`📊 CMS Admin: http://localhost:${PORT}/admin`);
		console.log(`🌐 Portfolio: http://localhost:${PORT}/index.html\n`);
	});
}

module.exports = server;
