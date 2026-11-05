/**
 * Endpoint previsto para el futuro Chatbot IA usando SpiderIA
 * Documentación:
 * - GET  /api/v1/ia/models
 * - POST /api/v1/ia/chat
 * - GET  /api/v1/ia/usage
 *
 * Actualmente desactivado por defecto (CHATBOT_ENABLED=false en .env).
 */
const {
	getConfig,
	verifyAdmin,
	getIAModels,
	getIAUsage,
	sendIAChat,
	querySQL,
} = require("./_lib/spider");

module.exports = async function handler(req, res) {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
	res.setHeader(
		"Access-Control-Allow-Headers",
		"Content-Type, x-admin-key, Authorization",
	);

	if (req.method === "OPTIONS") {
		return res.status(200).end();
	}

	const { chatbotEnabled } = getConfig();

	try {
		// GET /api/chat: Estado de preparación para el panel Admin CMS
		if (req.method === "GET") {
			if (!verifyAdmin(req)) {
				return res.status(200).json({ enabled: chatbotEnabled });
			}
			const [modelsData, usageData] = await Promise.all([
				getIAModels().catch(() => ({ models: [] })),
				getIAUsage().catch(() => ({ usage: null })),
			]);
			return res.status(200).json({
				enabled: chatbotEnabled,
				models: modelsData.models || [],
				usage: usageData,
			});
		}

		// POST /api/chat: Enviar mensaje al asistente IA (previsto)
		if (req.method === "POST") {
			if (!chatbotEnabled) {
				return res.status(503).json({
					error:
						"El asistente IA está dejado previsto pero aún no se encuentra habilitado (CHATBOT_ENABLED=false).",
				});
			}

			const { message, history = [], modelId } = req.body || {};
			if (!message) {
				return res.status(400).json({ error: "Falta el mensaje del usuario" });
			}

			let targetModelId = modelId;
			if (!targetModelId) {
				const { models } = await getIAModels();
				if (!models || models.length === 0) {
					return res
						.status(500)
						.json({ error: "No hay modelos disponibles en SpiderIA" });
				}
				targetModelId = models[0].id;
			}

			// Contexto dinámico desde la base de datos de proyectos
			const projects = await querySQL(
				"SELECT name, description, url FROM projects ORDER BY destacado DESC LIMIT 15",
			).catch(() => []);

			const projectsContext = (projects || [])
				.map((p) => `- ${p.name}: ${p.description} (${p.url})`)
				.join("\n");

			const messages = [
				{
					role: "system",
					content: `Eres el asistente virtual del portfolio de Franco Calegari (Desarrollador Web, Automatizaciones IA con n8n, Python, Node.js y Creador de Contenido en YouTube). Responde de forma concisa, amable y en español.\nProyectos de Franco:\n${projectsContext}`,
				},
				...history.slice(-6),
				{ role: "user", content: String(message).slice(0, 1000) },
			];

			const reply = await sendIAChat({ modelId: targetModelId, messages });
			return res.status(200).json(reply);
		}

		return res.status(405).json({ error: "Método no permitido" });
	} catch (error) {
		console.error("Error en /api/chat:", error);
		return res
			.status(500)
			.json({ error: error.message || "Error en SpiderIA" });
	}
};

