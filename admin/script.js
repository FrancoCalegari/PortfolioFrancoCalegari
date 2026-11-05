// ==================== CONFIGURACIÓN CMS ====================
const API_BASE = window.location.origin + "/api";
let projects = [];
let editingId = null;

function getAdminHeaders(extra = {}) {
	const keyInput = document.getElementById("admin-key-input");
	const key = keyInput ? keyInput.value.trim() : "";
	if (key) {
		sessionStorage.setItem("cms_admin_key", key);
	}
	return {
		"Content-Type": "application/json",
		"x-admin-key": key || sessionStorage.getItem("cms_admin_key") || "",
		...extra,
	};
}

document.addEventListener("DOMContentLoaded", () => {
	const keyInput = document.getElementById("admin-key-input");
	const savedKey = sessionStorage.getItem("cms_admin_key");
	if (keyInput && savedKey) {
		keyInput.value = savedKey;
	}
	if (keyInput) {
		keyInput.addEventListener("change", () => {
			sessionStorage.setItem("cms_admin_key", keyInput.value.trim());
		});
	}

	setupTabs();
	setupEventListeners();
	setupImagePreview();
	setupCloudUpload();
	loadProjects();
});

// ==================== TABS ====================
function setupTabs() {
	document.querySelectorAll(".tab-btn").forEach((btn) => {
		btn.addEventListener("click", () => {
			document
				.querySelectorAll(".tab-btn")
				.forEach((b) => b.classList.remove("active"));
			document
				.querySelectorAll(".tab-content")
				.forEach((c) => c.classList.remove("active"));
			btn.classList.add("active");
			const tab = btn.getAttribute("data-tab");
			document.getElementById(`tab-${tab}`).classList.add("active");

			if (tab === "storage") loadStorageFiles();
			if (tab === "ia") loadIAStatus();
		});
	});
}

// ==================== EVENTOS ====================
function setupEventListeners() {
	document
		.getElementById("project-form")
		.addEventListener("submit", handleProjectSubmit);
	document.getElementById("cancel-btn").addEventListener("click", resetForm);
	document.getElementById("seed-btn").addEventListener("click", seedFromJSON);
	document
		.getElementById("refresh-storage-btn")
		.addEventListener("click", loadStorageFiles);

	const standaloneUpload = document.getElementById("standalone-upload");
	if (standaloneUpload) {
		standaloneUpload.addEventListener("change", async (e) => {
			const file = e.target.files && e.target.files[0];
			if (!file) return;
			try {
				showToast("Subiendo archivo a SpiderCloudStorage...", "success");
				await uploadFileToSpider(file);
				showToast("Archivo subido correctamente", "success");
				loadStorageFiles();
			} catch (err) {
				showToast(err.message || "Error al subir archivo", "error");
			} finally {
				standaloneUpload.value = "";
			}
		});
	}

	document.getElementById("cancel-delete").addEventListener("click", () => {
		const dialog = document.getElementById("confirm-modal");
		if (dialog && dialog.open) dialog.close();
	});
}

function setupImagePreview() {
	const imageInput = document.getElementById("image");
	const previewDiv = document.getElementById("image-preview");
	const previewImg = document.getElementById("preview-img");

	imageInput.addEventListener("input", (e) => {
		const url = e.target.value.trim();
		if (url) {
			previewImg.src = url;
			previewDiv.style.display = "block";
			previewImg.onerror = () => {
				previewDiv.style.display = "none";
			};
		} else {
			previewDiv.style.display = "none";
		}
	});
}

// ==================== SUBIDA A CLOUD STORAGE (#46) ====================
function fileToBase64(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result);
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}

async function uploadFileToSpider(file) {
	const base64 = await fileToBase64(file);
	const res = await fetch(`${API_BASE}/storage`, {
		method: "POST",
		headers: getAdminHeaders(),
		body: JSON.stringify({
			filename: file.name,
			mimeType: file.type,
			base64,
		}),
	});
	const data = await res.json();
	if (!res.ok) {
		throw new Error(data.error || "Error subiendo imagen");
	}
	return data;
}

function setupCloudUpload() {
	const fileInput = document.getElementById("image-upload");
	const statusEl = document.getElementById("upload-status");
	if (!fileInput) return;

	fileInput.addEventListener("change", async (e) => {
		const file = e.target.files && e.target.files[0];
		if (!file) return;

		statusEl.textContent = "Subiendo a Cloud Storage #46...";
		try {
			const uploaded = await uploadFileToSpider(file);
			if (uploaded.url) {
				document.getElementById("image").value = uploaded.url;
				document.getElementById("storage-file-id").value =
					uploaded.fileId || "";
				document.getElementById("preview-img").src = uploaded.url;
				document.getElementById("image-preview").style.display = "block";
			}
			statusEl.textContent = "Imagen subida a Cloud Storage";
			showToast("Imagen subida a SpiderCloudStorage", "success");
		} catch (err) {
			statusEl.textContent = "Error al subir";
			showToast(err.message, "error");
		}
	});
}

// ==================== CRUD PROYECTOS (SQL) ====================
async function loadProjects() {
	try {
		const res = await fetch(`${API_BASE}/projects`);
		const data = await res.json();
		projects = data.projects || [];
		const badge = document.getElementById("db-source-badge");
		if (badge) {
			badge.textContent =
				data.source === "sql"
					? "Fuente activa: Base de datos SQL (SpiderWebArgAPI)"
					: "Fuente activa: Respaldo local (json/proyectos.json)";
		}
		renderProjects();
		document.getElementById("projects-count").textContent =
			`${projects.length} proyecto${projects.length !== 1 ? "s" : ""}`;
	} catch (error) {
		console.error("Error cargando proyectos:", error);
		showToast("Error al cargar proyectos", "error");
	}
}

async function seedFromJSON() {
	try {
		const res = await fetch(`${API_BASE}/projects`, {
			method: "POST",
			headers: getAdminHeaders(),
			body: JSON.stringify({ action: "seed" }),
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.error || "Error al sincronizar");
		showToast(data.message || "Sincronización exitosa", "success");
		await loadProjects();
	} catch (err) {
		showToast(err.message, "error");
	}
}

async function handleProjectSubmit(e) {
	e.preventDefault();
	const payload = {
		name: document.getElementById("name").value.trim(),
		url: document.getElementById("url").value.trim(),
		description: document.getElementById("description").value.trim(),
		image: document.getElementById("image").value.trim(),
		storage_file_id: document.getElementById("storage-file-id").value || null,
		alt: document.getElementById("alt").value.trim(),
		destacado: document.getElementById("destacado").checked ? 1 : 0,
	};

	try {
		const url = editingId
			? `${API_BASE}/projects?id=${editingId}`
			: `${API_BASE}/projects`;
		const method = editingId ? "PUT" : "POST";

		const res = await fetch(url, {
			method,
			headers: getAdminHeaders(),
			body: JSON.stringify(payload),
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.error || "Error guardando proyecto");

		showToast(
			editingId ? "Proyecto actualizado en SQL" : "Proyecto creado en SQL",
			"success",
		);
		resetForm();
		await loadProjects();
	} catch (err) {
		showToast(err.message, "error");
	}
}

function editProject(index) {
	const project = projects[index];
	if (!project) return;
	editingId = project.id;
	document.getElementById("project-id").value = project.id || "";
	document.getElementById("storage-file-id").value =
		project.storage_file_id || "";
	document.getElementById("name").value = project.name || "";
	document.getElementById("url").value = project.url || "";
	document.getElementById("description").value = project.description || "";
	document.getElementById("image").value = project.image || "";
	document.getElementById("alt").value = project.alt || "";
	document.getElementById("destacado").checked =
		Number(project.destacado) === 1;

	if (project.image) {
		document.getElementById("preview-img").src = project.image;
		document.getElementById("image-preview").style.display = "block";
	} else {
		document.getElementById("image-preview").style.display = "none";
	}

	document.getElementById("form-title").innerHTML =
		'<i class="bi bi-pencil-fill" aria-hidden="true"></i> Editar Proyecto #' +
		project.id;
	document.getElementById("submit-btn").innerHTML =
		'<i class="bi bi-save" aria-hidden="true"></i> Actualizar Proyecto';
	document.getElementById("cancel-btn").style.display = "inline-flex";
	document
		.querySelector(".form-section")
		.scrollIntoView({ behavior: "smooth" });
}

function resetForm() {
	document.getElementById("project-form").reset();
	document.getElementById("project-id").value = "";
	document.getElementById("storage-file-id").value = "";
	document.getElementById("upload-status").textContent = "";
	document.getElementById("form-title").innerHTML =
		'<i class="bi bi-plus-circle" aria-hidden="true"></i> Agregar Nuevo Proyecto';
	document.getElementById("submit-btn").innerHTML =
		'<i class="bi bi-save" aria-hidden="true"></i> Guardar en SQL';
	document.getElementById("cancel-btn").style.display = "none";
	document.getElementById("image-preview").style.display = "none";
	editingId = null;
}

async function toggleDestacado(id) {
	if (!id) {
		showToast("Primero sincroniza los proyectos a SQL", "error");
		return;
	}
	try {
		const res = await fetch(`${API_BASE}/projects?id=${id}`, {
			method: "PATCH",
			headers: getAdminHeaders(),
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.error || "Error al actualizar");
		await loadProjects();
		showToast("Estado destacado actualizado", "success");
	} catch (err) {
		showToast(err.message, "error");
	}
}

function confirmDeleteProject(id, name) {
	if (!id) {
		showToast("Primero sincroniza los proyectos a SQL", "error");
		return;
	}
	showModal(`¿Estás seguro de eliminar el proyecto "${name}"?`, async () => {
		try {
			const res = await fetch(`${API_BASE}/projects?id=${id}`, {
				method: "DELETE",
				headers: getAdminHeaders(),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Error al eliminar");
			showToast("Proyecto eliminado", "success");
			await loadProjects();
		} catch (err) {
			showToast(err.message, "error");
		}
	});
}

function renderProjects() {
	const tbody = document.getElementById("projects-list");
	const emptyState = document.getElementById("empty-state");
	const tableContainer = document.getElementById("projects-table-container");

	if (projects.length === 0) {
		tableContainer.style.display = "none";
		emptyState.style.display = "block";
		return;
	}
	tableContainer.style.display = "block";
	emptyState.style.display = "none";

	tbody.innerHTML = projects
		.map((project, index) => {
			const isFeatured = Number(project.destacado) === 1;
			const safeImg = project.image ? project.image.replace(/"/g, "&quot;") : "";
			return `
		<tr>
			<td>
				${
					safeImg
						? `<img src="${safeImg}" alt="${(project.alt || project.name || "").replace(/"/g, "&quot;")}" class="project-img" loading="lazy">`
						: '<div class="img-placeholder"><i class="bi bi-image" aria-hidden="true"></i></div>'
				}
			</td>
			<td class="project-name">${project.name}</td>
			<td><a href="${project.url}" target="_blank" rel="noopener noreferrer" class="project-url">${project.url}</a></td>
			<td class="project-description" title="${(project.description || "").replace(/"/g, "&quot;")}">${project.description || "—"}</td>
			<td>
				<button type="button" class="badge-destacado ${isFeatured ? "active" : "inactive"}" onclick="toggleDestacado(${project.id})">
					<i class="bi bi-star${isFeatured ? "-fill" : ""}" aria-hidden="true"></i> ${isFeatured ? "Destacado" : "Normal"}
				</button>
			</td>
			<td class="actions">
				<button type="button" class="btn btn-primary btn-sm" onclick="editProject(${index})" aria-label="Editar ${project.name}">
					<i class="bi bi-pencil" aria-hidden="true"></i>
				</button>
				<button type="button" class="btn btn-danger btn-sm" onclick="confirmDeleteProject(${project.id}, '${(project.name || "").replace(/'/g, "\\'")}')" aria-label="Eliminar ${project.name}">
					<i class="bi bi-trash" aria-hidden="true"></i>
				</button>
			</td>
		</tr>
	`;
		})
		.join("");
}

// ==================== STORAGE VIEWER ====================
async function loadStorageFiles() {
	const grid = document.getElementById("storage-grid");
	if (!grid) return;
	grid.innerHTML = '<p class="text-muted">Consultando Cloud Storage #46...</p>';

	try {
		const res = await fetch(`${API_BASE}/storage`, {
			headers: getAdminHeaders(),
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.error || "No autorizado");

		const files = data.files || [];
		if (files.length === 0) {
			grid.innerHTML =
				'<p class="text-muted">No hay archivos subidos en el proyecto #46 todavía.</p>';
			return;
		}

		grid.innerHTML = files
			.map(
				(f) => `
			<div class="storage-card">
				<img src="${f.proxyUrl}" alt="${f.original_name || f.filename || "Archivo"}" loading="lazy" />
				<div class="storage-card-info">
					<strong>${f.original_name || f.filename || `Archivo #${f.id}`}</strong>
					<div class="storage-card-actions">
						<button type="button" class="btn btn-primary btn-sm" onclick="copyStorageUrl('${f.proxyUrl}')">
							<i class="bi bi-clipboard" aria-hidden="true"></i> Copiar URL
						</button>
						<button type="button" class="btn btn-danger btn-sm" onclick="deleteStorageItem(${f.id})">
							<i class="bi bi-trash" aria-hidden="true"></i>
						</button>
					</div>
				</div>
			</div>
		`,
			)
			.join("");
	} catch (err) {
		grid.innerHTML = `<p class="text-muted">${err.message}</p>`;
	}
}

function copyStorageUrl(url) {
	navigator.clipboard.writeText(url);
	showToast("URL copiada al portapapeles", "success");
}

function deleteStorageItem(fileId) {
	showModal("¿Eliminar este archivo de SpiderCloudStorage?", async () => {
		try {
			const res = await fetch(`${API_BASE}/storage?id=${fileId}`, {
				method: "DELETE",
				headers: getAdminHeaders(),
			});
			if (!res.ok) throw new Error("No se pudo eliminar el archivo");
			showToast("Archivo eliminado de Cloud Storage", "success");
			loadStorageFiles();
		} catch (err) {
			showToast(err.message, "error");
		}
	});
}

// ==================== SPIDER IA STATUS ====================
async function loadIAStatus() {
	const list = document.getElementById("ia-models-list");
	const badge = document.getElementById("ia-status-badge");
	if (!list) return;

	try {
		const res = await fetch(`${API_BASE}/chat`, {
			headers: getAdminHeaders(),
		});
		const data = await res.json();
		if (badge) {
			badge.textContent = data.enabled
				? "Activo"
				: "Previsto (CHATBOT_ENABLED=false)";
		}
		const models = data.models || [];
		if (models.length === 0) {
			list.innerHTML =
				'<li class="text-muted">Ingresa la clave de Administrador para consultar los modelos disponibles en SpiderIA.</li>';
			return;
		}
		list.innerHTML = models
			.map(
				(m) =>
					`<li><strong>ID ${m.id}:</strong> ${m.display_name || m.model_name} <code>(${m.model_name})</code></li>`,
			)
			.join("");
	} catch (err) {
		list.innerHTML = `<li class="text-muted">Error consultando SpiderIA: ${err.message}</li>`;
	}
}

// ==================== MODAL NATIVO (<dialog>) & TOAST ====================
function showModal(message, onConfirm) {
	const dialog = document.getElementById("confirm-modal");
	document.getElementById("confirm-modal-text").textContent = message;
	const confirmBtn = document.getElementById("confirm-delete");
	const newBtn = confirmBtn.cloneNode(true);
	confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
	newBtn.addEventListener("click", () => {
		onConfirm();
		dialog.close();
	});
	dialog.showModal();
}

function showToast(message, type = "success") {
	const toast = document.getElementById("toast");
	toast.textContent = message;
	toast.className = `toast ${type} show`;
	setTimeout(() => {
		toast.className = "toast";
	}, 3200);
}
