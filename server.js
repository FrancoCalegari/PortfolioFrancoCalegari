const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Servir archivos estáticos del portfolio

// Ruta del archivo JSON
const projectsFilePath = path.join(__dirname, "json", "proyectos.json");

// Helper: Leer proyectos del JSON
const readProjects = () => {
	try {
		const data = fs.readFileSync(projectsFilePath, "utf8");
		return JSON.parse(data);
	} catch (error) {
		console.error("Error leyendo proyectos:", error);
		return { projects: [] };
	}
};

// Helper: Escribir proyectos al JSON
const writeProjects = (data) => {
	try {
		fs.writeFileSync(projectsFilePath, JSON.stringify(data, null, 4), "utf8");
		return true;
	} catch (error) {
		console.error("Error escribiendo proyectos:", error);
		return false;
	}
};

// ==================== API ENDPOINTS ====================

// GET /api/projects - Obtener todos los proyectos
app.get("/api/projects", (req, res) => {
	const data = readProjects();
	res.json(data);
});

// GET /api/projects/:index - Obtener proyecto por índice
app.get("/api/projects/:index", (req, res) => {
	const data = readProjects();
	const index = parseInt(req.params.index);

	if (index >= 0 && index < data.projects.length) {
		res.json(data.projects[index]);
	} else {
		res.status(404).json({ error: "Proyecto no encontrado" });
	}
});

// POST /api/projects - Crear nuevo proyecto
app.post("/api/projects", (req, res) => {
	const data = readProjects();
	const newProject = req.body;

	// Validación básica
	if (!newProject.name || !newProject.url) {
		return res
			.status(400)
			.json({ error: "Faltan campos requeridos (name, url)" });
	}

	// Agregar proyecto
	data.projects.push(newProject);

	if (writeProjects(data)) {
		res.status(201).json({
			message: "Proyecto creado exitosamente",
			project: newProject,
			index: data.projects.length - 1,
		});
	} else {
		res.status(500).json({ error: "Error al guardar el proyecto" });
	}
});

// PUT /api/projects/:index - Actualizar proyecto existente
app.put("/api/projects/:index", (req, res) => {
	const data = readProjects();
	const index = parseInt(req.params.index);
	const updatedProject = req.body;

	if (index >= 0 && index < data.projects.length) {
		// Validación básica
		if (!updatedProject.name || !updatedProject.url) {
			return res
				.status(400)
				.json({ error: "Faltan campos requeridos (name, url)" });
		}

		data.projects[index] = updatedProject;

		if (writeProjects(data)) {
			res.json({
				message: "Proyecto actualizado exitosamente",
				project: updatedProject,
			});
		} else {
			res.status(500).json({ error: "Error al actualizar el proyecto" });
		}
	} else {
		res.status(404).json({ error: "Proyecto no encontrado" });
	}
});

// DELETE /api/projects/:index - Eliminar proyecto
app.delete("/api/projects/:index", (req, res) => {
	const data = readProjects();
	const index = parseInt(req.params.index);

	if (index >= 0 && index < data.projects.length) {
		const deletedProject = data.projects.splice(index, 1)[0];

		if (writeProjects(data)) {
			res.json({
				message: "Proyecto eliminado exitosamente",
				project: deletedProject,
			});
		} else {
			res.status(500).json({ error: "Error al eliminar el proyecto" });
		}
	} else {
		res.status(404).json({ error: "Proyecto no encontrado" });
	}
});

// PATCH /api/projects/:index/toggle-destacado - Toggle destacado
app.patch("/api/projects/:index/toggle-destacado", (req, res) => {
	const data = readProjects();
	const index = parseInt(req.params.index);

	if (index >= 0 && index < data.projects.length) {
		const currentValue = data.projects[index].destacado || 0;
		data.projects[index].destacado = currentValue === 1 ? 0 : 1;

		if (writeProjects(data)) {
			res.json({
				message: "Estado de destacado actualizado",
				destacado: data.projects[index].destacado,
			});
		} else {
			res.status(500).json({ error: "Error al actualizar el proyecto" });
		}
	} else {
		res.status(404).json({ error: "Proyecto no encontrado" });
	}
});

// ==================== SERVIDOR ====================

app.listen(PORT, () => {
	console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
	console.log(`📊 Admin Dashboard: http://localhost:${PORT}/admin`);
	console.log(`🌐 Portfolio: http://localhost:${PORT}/index.html\n`);
});
