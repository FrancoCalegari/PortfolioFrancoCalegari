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
const servicesFilePath = path.join(__dirname, "json", "servicios.json");
const packagesFilePath = path.join(__dirname, "json", "paquetes.json");

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

// Helper genérico: Leer JSON
const readJSON = (filePath, defaultKey) => {
	try {
		const data = fs.readFileSync(filePath, "utf8");
		return JSON.parse(data);
	} catch (error) {
		console.error(`Error leyendo ${filePath}:`, error);
		return { [defaultKey]: [] };
	}
};

// Helper genérico: Escribir JSON
const writeJSON = (filePath, data) => {
	try {
		fs.writeFileSync(filePath, JSON.stringify(data, null, 4), "utf8");
		return true;
	} catch (error) {
		console.error(`Error escribiendo ${filePath}:`, error);
		return false;
	}
};

// ==================== API ENDPOINTS - PROJECTS ====================

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

// ==================== API ENDPOINTS - SERVICES ====================

// GET /api/services
app.get("/api/services", (req, res) => {
	const data = readJSON(servicesFilePath, "services");
	res.json(data);
});

// POST /api/services
app.post("/api/services", (req, res) => {
	const data = readJSON(servicesFilePath, "services");
	const newService = req.body;

	if (!newService.name) {
		return res.status(400).json({ error: "Falta el campo requerido (name)" });
	}

	data.services.push(newService);

	if (writeJSON(servicesFilePath, data)) {
		res.status(201).json({
			message: "Servicio creado exitosamente",
			service: newService,
			index: data.services.length - 1,
		});
	} else {
		res.status(500).json({ error: "Error al guardar el servicio" });
	}
});

// PUT /api/services/:index
app.put("/api/services/:index", (req, res) => {
	const data = readJSON(servicesFilePath, "services");
	const index = parseInt(req.params.index);
	const updatedService = req.body;

	if (index >= 0 && index < data.services.length) {
		if (!updatedService.name) {
			return res.status(400).json({ error: "Falta el campo requerido (name)" });
		}
		data.services[index] = updatedService;

		if (writeJSON(servicesFilePath, data)) {
			res.json({
				message: "Servicio actualizado exitosamente",
				service: updatedService,
			});
		} else {
			res.status(500).json({ error: "Error al actualizar el servicio" });
		}
	} else {
		res.status(404).json({ error: "Servicio no encontrado" });
	}
});

// DELETE /api/services/:index
app.delete("/api/services/:index", (req, res) => {
	const data = readJSON(servicesFilePath, "services");
	const index = parseInt(req.params.index);

	if (index >= 0 && index < data.services.length) {
		const deleted = data.services.splice(index, 1)[0];

		if (writeJSON(servicesFilePath, data)) {
			res.json({
				message: "Servicio eliminado exitosamente",
				service: deleted,
			});
		} else {
			res.status(500).json({ error: "Error al eliminar el servicio" });
		}
	} else {
		res.status(404).json({ error: "Servicio no encontrado" });
	}
});

// ==================== API ENDPOINTS - PACKAGES ====================

// GET /api/packages
app.get("/api/packages", (req, res) => {
	const data = readJSON(packagesFilePath, "packages");
	res.json(data);
});

// POST /api/packages
app.post("/api/packages", (req, res) => {
	const data = readJSON(packagesFilePath, "packages");
	const newPkg = req.body;

	if (!newPkg.name) {
		return res.status(400).json({ error: "Falta el campo requerido (name)" });
	}

	data.packages.push(newPkg);

	if (writeJSON(packagesFilePath, data)) {
		res.status(201).json({
			message: "Paquete creado exitosamente",
			package: newPkg,
			index: data.packages.length - 1,
		});
	} else {
		res.status(500).json({ error: "Error al guardar el paquete" });
	}
});

// PUT /api/packages/:index
app.put("/api/packages/:index", (req, res) => {
	const data = readJSON(packagesFilePath, "packages");
	const index = parseInt(req.params.index);
	const updatedPkg = req.body;

	if (index >= 0 && index < data.packages.length) {
		if (!updatedPkg.name) {
			return res.status(400).json({ error: "Falta el campo requerido (name)" });
		}
		data.packages[index] = updatedPkg;

		if (writeJSON(packagesFilePath, data)) {
			res.json({
				message: "Paquete actualizado exitosamente",
				package: updatedPkg,
			});
		} else {
			res.status(500).json({ error: "Error al actualizar el paquete" });
		}
	} else {
		res.status(404).json({ error: "Paquete no encontrado" });
	}
});

// DELETE /api/packages/:index
app.delete("/api/packages/:index", (req, res) => {
	const data = readJSON(packagesFilePath, "packages");
	const index = parseInt(req.params.index);

	if (index >= 0 && index < data.packages.length) {
		const deleted = data.packages.splice(index, 1)[0];

		if (writeJSON(packagesFilePath, data)) {
			res.json({ message: "Paquete eliminado exitosamente", package: deleted });
		} else {
			res.status(500).json({ error: "Error al eliminar el paquete" });
		}
	} else {
		res.status(404).json({ error: "Paquete no encontrado" });
	}
});

// ==================== SERVIDOR ====================

app.listen(PORT, () => {
	console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
	console.log(`📊 Admin Dashboard: http://localhost:${PORT}/admin`);
	console.log(`🌐 Portfolio: http://localhost:${PORT}/index.html\n`);
});
