const {
	verifyAdmin,
	listStorageFiles,
	uploadStorageBuffer,
	fetchStorageFileResponse,
	deleteStorageFile,
} = require("./_lib/spider");

module.exports = async function handler(req, res) {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
	res.setHeader(
		"Access-Control-Allow-Headers",
		"Content-Type, x-admin-key, Authorization",
	);

	if (req.method === "OPTIONS") {
		return res.status(200).end();
	}

	try {
		// ==================== GET ?download=:id (Proxy público de imágenes) ====================
		const downloadId = req.query && req.query.download;
		if (req.method === "GET" && downloadId) {
			const upstream = await fetchStorageFileResponse(downloadId);
			if (!upstream.ok) {
				return res
					.status(upstream.status)
					.json({ error: "Archivo no encontrado en SpiderCloudStorage" });
			}
			const contentType =
				upstream.headers.get("content-type") || "application/octet-stream";
			const arrayBuffer = await upstream.arrayBuffer();
			res.setHeader("Content-Type", contentType);
			res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
			return res.status(200).send(Buffer.from(arrayBuffer));
		}

		// ==================== GET: Listar archivos del proyecto 46 ====================
		if (req.method === "GET") {
			if (!verifyAdmin(req)) {
				return res.status(401).json({ error: "No autorizado" });
			}
			const data = await listStorageFiles();
			const files = (data.files || []).map((f) => ({
				...f,
				proxyUrl: `/api/storage?download=${f.id}`,
			}));
			return res.status(200).json({
				project: data.project,
				files,
			});
		}

		// ==================== POST: Subir archivo a Cloud Storage (Proyecto 46) ====================
		if (req.method === "POST") {
			if (!verifyAdmin(req)) {
				return res.status(401).json({ error: "No autorizado" });
			}
			const { filename, mimeType, base64 } = req.body || {};
			if (!base64) {
				return res
					.status(400)
					.json({ error: "Se requiere el archivo en formato base64" });
			}

			const cleanBase64 = base64.replace(/^data:[^;]+;base64,/, "");
			const buffer = Buffer.from(cleanBase64, "base64");
			const uploadRes = await uploadStorageBuffer(buffer, filename, mimeType);

			// SpiderWebArgAPI devuelve los archivos subidos en uploadRes.files o uploadRes.file
			const uploadedFile =
				(Array.isArray(uploadRes.files) && uploadRes.files[0]) ||
				uploadRes.file ||
				uploadRes;
			const fileId = uploadedFile && uploadedFile.id ? uploadedFile.id : null;

			return res.status(201).json({
				message: "Archivo subido a SpiderCloudStorage",
				file: uploadedFile,
				fileId,
				url: fileId ? `/api/storage?download=${fileId}` : null,
			});
		}

		// ==================== DELETE: Eliminar archivo de Cloud Storage ====================
		if (req.method === "DELETE") {
			if (!verifyAdmin(req)) {
				return res.status(401).json({ error: "No autorizado" });
			}
			const fileId = req.query && req.query.id;
			if (!fileId) {
				return res
					.status(400)
					.json({ error: "Falta el parámetro ?id= del archivo" });
			}
			const delRes = await deleteStorageFile(fileId);
			return res.status(200).json(delRes);
		}

		return res.status(405).json({ error: "Método no permitido" });
	} catch (error) {
		console.error("Error en /api/storage:", error);
		return res
			.status(500)
			.json({ error: error.message || "Error en Cloud Storage" });
	}
};

