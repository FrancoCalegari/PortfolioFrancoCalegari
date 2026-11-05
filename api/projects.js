const fs = require("fs");
const path = require("path");
const {
	sqlVal,
	verifyAdmin,
	querySQL,
	ensureProjectsTable,
	deleteStorageFile,
} = require("./_lib/spider");

const fallbackFilePath = path.join(process.cwd(), "json", "proyectos.json");

function readFallbackProjects() {
	try {
		const raw = fs.readFileSync(fallbackFilePath, "utf8");
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed.projects) ? parsed.projects : [];
	} catch {
		return [];
	}
}

function extractId(req) {
	if (req.query && req.query.id) return parseInt(req.query.id, 10);
	if (req.params && req.params.id) return parseInt(req.params.id, 10);
	const match = (req.url || "").match(/\/api\/projects\/(\d+)/);
	return match ? parseInt(match[1], 10) : null;
}

module.exports = async function handler(req, res) {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader(
		"Access-Control-Allow-Methods",
		"GET,POST,PUT,PATCH,DELETE,OPTIONS",
	);
	res.setHeader(
		"Access-Control-Allow-Headers",
		"Content-Type, x-admin-key, Authorization",
	);

	if (req.method === "OPTIONS") {
		return res.status(200).end();
	}

	try {
		// ==================== GET: Listar proyectos ====================
		if (req.method === "GET") {
			try {
				const rows = await querySQL(
					"SELECT id, name, description, image, storage_file_id, url, alt, destacado FROM projects ORDER BY destacado DESC, id ASC",
				);
				if (Array.isArray(rows) && rows.length > 0) {
					return res.status(200).json({ projects: rows, source: "sql" });
				}
				// Si la tabla está vacía, devolver el respaldo JSON
				return res
					.status(200)
					.json({ projects: readFallbackProjects(), source: "json-fallback" });
			} catch (err) {
				console.warn("Fallback a json/proyectos.json:", err.message);
				return res
					.status(200)
					.json({ projects: readFallbackProjects(), source: "json-fallback" });
			}
		}

		// A partir de aquí se requiere autenticación de administrador
		if (!verifyAdmin(req)) {
			return res.status(401).json({
				error: "No autorizado. Ingresa una clave de administrador válida.",
			});
		}

		await ensureProjectsTable();

		// ==================== POST: Crear proyecto o Seed ====================
		if (req.method === "POST") {
			const body = req.body || {};

			// Acción especial: migrar proyectos del archivo json/proyectos.json a SQL
			if (body.action === "seed") {
				const fallbackProjects = readFallbackProjects();
				const existing = await querySQL("SELECT name, url FROM projects");
				const existingUrls = new Set(
					(existing || []).map((p) => `${p.name}|${p.url}`),
				);

				let inserted = 0;
				for (const p of fallbackProjects) {
					const key = `${p.name}|${p.url}`;
					if (existingUrls.has(key)) continue;
					await querySQL(
						`INSERT INTO projects (name, description, image, url, alt, destacado) VALUES (${sqlVal(
							p.name || "Sin nombre",
						)}, ${sqlVal(p.description || "")}, ${sqlVal(
							p.image || "",
						)}, ${sqlVal(p.url || "#")}, ${sqlVal(p.alt || p.name || "")}, ${
							p.destacado === 1 ? 1 : 0
						})`,
					);
					inserted++;
				}
				return res.status(200).json({
					message: `Sincronización completada (${inserted} proyectos importados).`,
					inserted,
				});
			}

			if (!body.name || !body.url) {
				return res
					.status(400)
					.json({ error: "Faltan campos requeridos (name, url)" });
			}

			const destacado = body.destacado ? 1 : 0;
			const storageFileId = body.storage_file_id
				? parseInt(body.storage_file_id, 10)
				: null;

			const result = await querySQL(
				`INSERT INTO projects (name, description, image, storage_file_id, url, alt, destacado) VALUES (${sqlVal(
					body.name,
				)}, ${sqlVal(body.description || "")}, ${sqlVal(
					body.image || "",
				)}, ${sqlVal(storageFileId)}, ${sqlVal(body.url)}, ${sqlVal(
					body.alt || body.name,
				)}, ${destacado})`,
			);

			return res.status(201).json({
				message: "Proyecto creado en SQL exitosamente",
				id: result.insertId,
			});
		}

		const id = extractId(req);
		if (!id || isNaN(id)) {
			return res
				.status(400)
				.json({ error: "Se requiere un ID de proyecto válido (?id=)" });
		}

		// ==================== PUT: Actualizar proyecto ====================
		if (req.method === "PUT") {
			const body = req.body || {};
			if (!body.name || !body.url) {
				return res
					.status(400)
					.json({ error: "Faltan campos requeridos (name, url)" });
			}

			const destacado = body.destacado ? 1 : 0;
			const storageFileId = body.storage_file_id
				? parseInt(body.storage_file_id, 10)
				: null;

			await querySQL(
				`UPDATE projects SET name = ${sqlVal(body.name)}, description = ${sqlVal(
					body.description || "",
				)}, image = ${sqlVal(body.image || "")}, storage_file_id = ${sqlVal(
					storageFileId,
				)}, url = ${sqlVal(body.url)}, alt = ${sqlVal(
					body.alt || body.name,
				)}, destacado = ${destacado} WHERE id = ${sqlVal(id)}`,
			);

			return res.status(200).json({
				message: "Proyecto actualizado exitosamente",
			});
		}

		// ==================== PATCH: Toggle destacado ====================
		if (req.method === "PATCH") {
			await querySQL(
				`UPDATE projects SET destacado = CASE WHEN destacado = 1 THEN 0 ELSE 1 END WHERE id = ${sqlVal(
					id,
				)}`,
			);
			return res.status(200).json({
				message: "Estado de destacado actualizado",
			});
		}

		// ==================== DELETE: Eliminar proyecto ====================
		if (req.method === "DELETE") {
			const existing = await querySQL(
				`SELECT storage_file_id FROM projects WHERE id = ${sqlVal(id)}`,
			);
			if (
				Array.isArray(existing) &&
				existing[0] &&
				existing[0].storage_file_id
			) {
				try {
					await deleteStorageFile(existing[0].storage_file_id);
				} catch (e) {
					console.warn("No se pudo borrar archivo de storage:", e.message);
				}
			}

			await querySQL(`DELETE FROM projects WHERE id = ${sqlVal(id)}`);
			return res.status(200).json({
				message: "Proyecto eliminado exitosamente",
			});
		}

		return res.status(405).json({ error: "Método no permitido" });
	} catch (error) {
		console.error("Error en /api/projects:", error);
		return res
			.status(500)
			.json({ error: error.message || "Error interno del servidor" });
	}
};

