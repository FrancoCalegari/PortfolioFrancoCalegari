// ==================== CONFIGURACIÓN ====================
const API_BASE = "http://localhost:3000/api";
let projects = [];
let editingIndex = null;

// ==================== INICIALIZACIÓN ====================
document.addEventListener("DOMContentLoaded", () => {
	loadProjects();
	setupEventListeners();
	setupImagePreview();
});

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
	const form = document.getElementById("project-form");
	const cancelBtn = document.getElementById("cancel-btn");

	form.addEventListener("submit", handleSubmit);
	cancelBtn.addEventListener("click", resetForm);
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

// ==================== API CALLS ====================
async function loadProjects() {
	try {
		const response = await fetch(`${API_BASE}/projects`);
		const data = await response.json();
		projects = data.projects || [];
		renderProjects();
		updateProjectCount();
	} catch (error) {
		console.error("Error cargando proyectos:", error);
		showToast("Error al cargar proyectos", "error");
	}
}

async function createProject(projectData) {
	try {
		const response = await fetch(`${API_BASE}/projects`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(projectData),
		});

		if (response.ok) {
			showToast("Proyecto creado exitosamente", "success");
			await loadProjects();
			resetForm();
		} else {
			throw new Error("Error al crear proyecto");
		}
	} catch (error) {
		console.error("Error:", error);
		showToast("Error al crear el proyecto", "error");
	}
}

async function updateProject(index, projectData) {
	try {
		const response = await fetch(`${API_BASE}/projects/${index}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(projectData),
		});

		if (response.ok) {
			showToast("Proyecto actualizado exitosamente", "success");
			await loadProjects();
			resetForm();
		} else {
			throw new Error("Error al actualizar proyecto");
		}
	} catch (error) {
		console.error("Error:", error);
		showToast("Error al actualizar el proyecto", "error");
	}
}

async function deleteProject(index) {
	try {
		const response = await fetch(`${API_BASE}/projects/${index}`, {
			method: "DELETE",
		});

		if (response.ok) {
			showToast("Proyecto eliminado exitosamente", "success");
			await loadProjects();
		} else {
			throw new Error("Error al eliminar proyecto");
		}
	} catch (error) {
		console.error("Error:", error);
		showToast("Error al eliminar el proyecto", "error");
	}
}

async function toggleDestacado(index) {
	try {
		const response = await fetch(
			`${API_BASE}/projects/${index}/toggle-destacado`,
			{
				method: "PATCH",
			},
		);

		if (response.ok) {
			await loadProjects();
			showToast("Estado actualizado", "success");
		} else {
			throw new Error("Error al actualizar destacado");
		}
	} catch (error) {
		console.error("Error:", error);
		showToast("Error al actualizar el estado", "error");
	}
}

// ==================== FORM HANDLING ====================
function handleSubmit(e) {
	e.preventDefault();

	const projectData = {
		name: document.getElementById("name").value.trim(),
		url: document.getElementById("url").value.trim(),
		description: document.getElementById("description").value.trim(),
		image: document.getElementById("image").value.trim(),
		alt: document.getElementById("alt").value.trim(),
		destacado: document.getElementById("destacado").checked ? 1 : 0,
	};

	if (editingIndex !== null) {
		updateProject(editingIndex, projectData);
	} else {
		createProject(projectData);
	}
}

function resetForm() {
	document.getElementById("project-form").reset();
	document.getElementById("project-index").value = "";
	document.getElementById("form-title").innerHTML =
		'<i class="bi bi-plus-circle"></i> Agregar Nuevo Proyecto';
	document.getElementById("submit-btn").innerHTML =
		'<i class="bi bi-save"></i> Guardar Proyecto';
	document.getElementById("cancel-btn").style.display = "none";
	document.getElementById("image-preview").style.display = "none";
	editingIndex = null;
}

function editProject(index) {
	const project = projects[index];
	editingIndex = index;

	// Llenar formulario
	document.getElementById("name").value = project.name || "";
	document.getElementById("url").value = project.url || "";
	document.getElementById("description").value = project.description || "";
	document.getElementById("image").value = project.image || "";
	document.getElementById("alt").value = project.alt || "";
	document.getElementById("destacado").checked = project.destacado === 1;

	// Preview de imagen
	if (project.image) {
		document.getElementById("preview-img").src = project.image;
		document.getElementById("image-preview").style.display = "block";
	}

	// Actualizar UI
	document.getElementById("form-title").innerHTML =
		'<i class="bi bi-pencil-fill"></i> Editar Proyecto';
	document.getElementById("submit-btn").innerHTML =
		'<i class="bi bi-save"></i> Actualizar Proyecto';
	document.getElementById("cancel-btn").style.display = "inline-flex";

	// Scroll al formulario
	document
		.querySelector(".form-section")
		.scrollIntoView({ behavior: "smooth" });
}

function confirmDelete(index) {
	const modal = document.getElementById("confirm-modal");
	modal.style.display = "flex";

	const confirmBtn = document.getElementById("confirm-delete");
	const cancelBtn = document.getElementById("cancel-delete");

	confirmBtn.onclick = () => {
		deleteProject(index);
		modal.style.display = "none";
	};

	cancelBtn.onclick = () => {
		modal.style.display = "none";
	};
}

// ==================== RENDERING ====================
function renderProjects() {
	const tbody = document.getElementById("projects-list");
	const emptyState = document.getElementById("empty-state");
	const tableContainer = document.querySelector(".table-container");

	if (projects.length === 0) {
		tableContainer.style.display = "none";
		emptyState.style.display = "block";
		return;
	}

	tableContainer.style.display = "block";
	emptyState.style.display = "none";

	tbody.innerHTML = projects
		.map(
			(project, index) => `
        <tr>
            <td>
                ${
									project.image
										? `<img src="${project.image}" alt="${project.alt || "Imagen del proyecto"}" class="project-img">`
										: '<div style="width:60px;height:60px;background:#e5e7eb;border-radius:8px;display:flex;align-items:center;justify-content:center;"><i class="bi bi-image"></i></div>'
								}
            </td>
            <td class="project-name">${project.name}</td>
            <td>
                <a href="${project.url}" target="_blank" class="project-url" title="${project.url}">
                    ${project.url}
                </a>
            </td>
            <td class="project-description" title="${project.description || "Sin descripción"}">
                ${project.description || '<span class="text-muted">Sin descripción</span>'}
            </td>
            <td>
                <span class="badge-destacado ${project.destacado === 1 ? "active" : "inactive"}" 
                      onclick="toggleDestacado(${index})"
                      title="Click para cambiar">
                    <i class="bi bi-star${project.destacado === 1 ? "-fill" : ""}"></i>
                    ${project.destacado === 1 ? "Destacado" : "Normal"}
                </span>
            </td>
            <td class="actions">
                <button class="btn btn-primary btn-sm" onclick="editProject(${index})" title="Editar">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="confirmDelete(${index})" title="Eliminar">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `,
		)
		.join("");
}

function updateProjectCount() {
	const count = projects.length;
	const countBadge = document.getElementById("projects-count");
	countBadge.textContent = `${count} proyecto${count !== 1 ? "s" : ""}`;
}

// ==================== TOAST NOTIFICATIONS ====================
function showToast(message, type = "success") {
	const toast = document.getElementById("toast");
	toast.textContent = message;
	toast.className = `toast ${type} show`;

	setTimeout(() => {
		toast.className = "toast";
	}, 3000);
}
