// ==================== CONFIGURACIÓN ====================
const API_BASE = window.location.origin + "/api";
let projects = [];
let services = [];
let packages = [];
let editingIndex = null;
let editingSvcIndex = null;
let editingPkgIndex = null;
let dolarBlueVenta = 0;

// ==================== BLUE DOLLAR ====================
async function fetchDolarBlue() {
	try {
		const res = await fetch("https://dolarapi.com/v1/dolares/blue");
		const data = await res.json();
		dolarBlueVenta = data.venta || 0;
		// Show rate in the header
		const badge = document.getElementById("dolar-badge");
		if (badge && dolarBlueVenta > 0) {
			badge.textContent = `💵 Blue: $${dolarBlueVenta.toLocaleString("es-AR")}`;
			badge.style.display = "inline-block";
		}
		console.log(`Dólar Blue venta: $${dolarBlueVenta}`);
	} catch (err) {
		console.warn("No se pudo obtener cotización del dólar blue:", err);
	}
}

function arsToUsd(ars) {
	if (!dolarBlueVenta || dolarBlueVenta === 0) return 0;
	return Math.round(ars / dolarBlueVenta);
}

// ==================== PRICE FORMATTING ====================
function formatPrice(value) {
	const num = parseInt(String(value).replace(/\D/g, ""), 10);
	if (isNaN(num)) return "";
	return "$" + num.toLocaleString("es-AR");
}

function rawPrice(value) {
	const num = parseInt(String(value).replace(/\D/g, ""), 10);
	return isNaN(num) ? 0 : num;
}

function setupPriceInputs() {
	document.querySelectorAll(".price-input").forEach((input) => {
		input.addEventListener("input", (e) => {
			const raw = rawPrice(e.target.value);
			if (raw > 0) {
				e.target.value = formatPrice(raw);
			} else {
				e.target.value = "";
			}

			// Auto-convert ARS → USD
			if (dolarBlueVenta > 0) {
				const id = e.target.id;
				if (id === "svc-priceARS") {
					document.getElementById("svc-priceUSD").value =
						raw > 0 ? formatPrice(arsToUsd(raw)) : "";
				} else if (id === "pkg-priceARS") {
					document.getElementById("pkg-priceUSD").value =
						raw > 0 ? formatPrice(arsToUsd(raw)) : "";
				}
			}
		});
	});
}

// ==================== INICIALIZACIÓN ====================
document.addEventListener("DOMContentLoaded", async () => {
	await fetchDolarBlue();
	loadProjects();
	loadServices();
	loadPackages();
	setupEventListeners();
	setupImagePreview();
	setupTabs();
	setupIconPreview();
	setupFeatures();
	setupPriceInputs();
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
			document
				.getElementById(`tab-${btn.getAttribute("data-tab")}`)
				.classList.add("active");
		});
	});
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
	document
		.getElementById("project-form")
		.addEventListener("submit", handleSubmit);
	document.getElementById("cancel-btn").addEventListener("click", resetForm);
	document
		.getElementById("service-form")
		.addEventListener("submit", handleServiceSubmit);
	document
		.getElementById("svc-cancel-btn")
		.addEventListener("click", resetServiceForm);
	document
		.getElementById("package-form")
		.addEventListener("submit", handlePackageSubmit);
	document
		.getElementById("pkg-cancel-btn")
		.addEventListener("click", resetPackageForm);
	document.getElementById("cancel-delete").addEventListener("click", () => {
		document.getElementById("confirm-modal").style.display = "none";
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

function setupIconPreview() {
	const iconInput = document.getElementById("svc-icon");
	const previewDiv = document.getElementById("svc-icon-preview");
	const previewIcon = document.getElementById("svc-icon-preview-icon");

	iconInput.addEventListener("input", (e) => {
		const cls = e.target.value.trim();
		if (cls) {
			previewIcon.className = `bi ${cls}`;
			previewDiv.style.display = "block";
		} else {
			previewDiv.style.display = "none";
		}
	});
}

function setupFeatures() {
	document.getElementById("pkg-add-feature").addEventListener("click", () => {
		addFeatureInput("");
	});
}

function addFeatureInput(value) {
	const container = document.getElementById("pkg-features-list");
	const row = document.createElement("div");
	row.className = "feature-row";
	row.innerHTML = `
		<input type="text" class="feature-input" value="${value}" placeholder="Ej: Diseño Gráfico (7 flyers)" />
		<button type="button" class="btn btn-danger btn-sm feature-remove" title="Quitar">
			<i class="bi bi-x"></i>
		</button>
	`;
	row
		.querySelector(".feature-remove")
		.addEventListener("click", () => row.remove());
	container.appendChild(row);
}

function getFeatures() {
	return Array.from(document.querySelectorAll(".feature-input"))
		.map((input) => input.value.trim())
		.filter((v) => v.length > 0);
}

// ==================== API CALLS - PROJECTS ====================
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
			{ method: "PATCH" },
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

// ==================== API CALLS - SERVICES ====================
async function loadServices() {
	try {
		const response = await fetch(`${API_BASE}/services`);
		const data = await response.json();
		services = data.services || [];
		renderServices();
		updateServiceCount();
	} catch (error) {
		console.error("Error cargando servicios:", error);
		showToast("Error al cargar servicios", "error");
	}
}

async function createService(data) {
	try {
		const response = await fetch(`${API_BASE}/services`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		});
		if (response.ok) {
			showToast("Servicio creado exitosamente", "success");
			await loadServices();
			resetServiceForm();
		} else {
			throw new Error("Error");
		}
	} catch (error) {
		console.error(error);
		showToast("Error al crear el servicio", "error");
	}
}

async function updateService(index, data) {
	try {
		const response = await fetch(`${API_BASE}/services/${index}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		});
		if (response.ok) {
			showToast("Servicio actualizado exitosamente", "success");
			await loadServices();
			resetServiceForm();
		} else {
			throw new Error("Error");
		}
	} catch (error) {
		console.error(error);
		showToast("Error al actualizar el servicio", "error");
	}
}

async function deleteService(index) {
	try {
		const response = await fetch(`${API_BASE}/services/${index}`, {
			method: "DELETE",
		});
		if (response.ok) {
			showToast("Servicio eliminado exitosamente", "success");
			await loadServices();
		} else {
			throw new Error("Error");
		}
	} catch (error) {
		console.error(error);
		showToast("Error al eliminar el servicio", "error");
	}
}

// ==================== API CALLS - PACKAGES ====================
async function loadPackages() {
	try {
		const response = await fetch(`${API_BASE}/packages`);
		const data = await response.json();
		packages = data.packages || [];
		renderPackages();
		updatePackageCount();
	} catch (error) {
		console.error("Error cargando paquetes:", error);
		showToast("Error al cargar paquetes", "error");
	}
}

async function createPackage(data) {
	try {
		const response = await fetch(`${API_BASE}/packages`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		});
		if (response.ok) {
			showToast("Paquete creado exitosamente", "success");
			await loadPackages();
			resetPackageForm();
		} else {
			throw new Error("Error");
		}
	} catch (error) {
		console.error(error);
		showToast("Error al crear el paquete", "error");
	}
}

async function updatePackage(index, data) {
	try {
		const response = await fetch(`${API_BASE}/packages/${index}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		});
		if (response.ok) {
			showToast("Paquete actualizado exitosamente", "success");
			await loadPackages();
			resetPackageForm();
		} else {
			throw new Error("Error");
		}
	} catch (error) {
		console.error(error);
		showToast("Error al actualizar el paquete", "error");
	}
}

async function deletePackage(index) {
	try {
		const response = await fetch(`${API_BASE}/packages/${index}`, {
			method: "DELETE",
		});
		if (response.ok) {
			showToast("Paquete eliminado exitosamente", "success");
			await loadPackages();
		} else {
			throw new Error("Error");
		}
	} catch (error) {
		console.error(error);
		showToast("Error al eliminar el paquete", "error");
	}
}

// ==================== FORM HANDLING - PROJECTS ====================
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
	document.getElementById("name").value = project.name || "";
	document.getElementById("url").value = project.url || "";
	document.getElementById("description").value = project.description || "";
	document.getElementById("image").value = project.image || "";
	document.getElementById("alt").value = project.alt || "";
	document.getElementById("destacado").checked = project.destacado === 1;
	if (project.image) {
		document.getElementById("preview-img").src = project.image;
		document.getElementById("image-preview").style.display = "block";
	}
	document.getElementById("form-title").innerHTML =
		'<i class="bi bi-pencil-fill"></i> Editar Proyecto';
	document.getElementById("submit-btn").innerHTML =
		'<i class="bi bi-save"></i> Actualizar Proyecto';
	document.getElementById("cancel-btn").style.display = "inline-flex";
	document
		.querySelector("#tab-proyectos .form-section")
		.scrollIntoView({ behavior: "smooth" });
}

function confirmDelete(index) {
	showModal("¿Estás seguro de eliminar este proyecto?", () =>
		deleteProject(index),
	);
}

// ==================== FORM HANDLING - SERVICES ====================
function handleServiceSubmit(e) {
	e.preventDefault();
	const serviceData = {
		icon: document.getElementById("svc-icon").value.trim(),
		name: document.getElementById("svc-name").value.trim(),
		description: document.getElementById("svc-description").value.trim(),
		priceARS: rawPrice(document.getElementById("svc-priceARS").value),
		priceUSD: rawPrice(document.getElementById("svc-priceUSD").value),
		pricePrefix: document.getElementById("svc-prefix").value.trim(),
	};
	if (editingSvcIndex !== null) {
		updateService(editingSvcIndex, serviceData);
	} else {
		createService(serviceData);
	}
}

function resetServiceForm() {
	document.getElementById("service-form").reset();
	document.getElementById("svc-index").value = "";
	document.getElementById("svc-form-title").innerHTML =
		'<i class="bi bi-plus-circle"></i> Agregar Nuevo Servicio';
	document.getElementById("svc-submit-btn").innerHTML =
		'<i class="bi bi-save"></i> Guardar Servicio';
	document.getElementById("svc-cancel-btn").style.display = "none";
	document.getElementById("svc-icon-preview").style.display = "none";
	document.getElementById("svc-prefix").value = "Desde";
	editingSvcIndex = null;
}

function editService(index) {
	const svc = services[index];
	editingSvcIndex = index;
	document.getElementById("svc-name").value = svc.name || "";
	document.getElementById("svc-icon").value = svc.icon || "";
	document.getElementById("svc-description").value = svc.description || "";
	document.getElementById("svc-priceARS").value = svc.priceARS
		? formatPrice(svc.priceARS)
		: "";
	document.getElementById("svc-priceUSD").value = svc.priceUSD
		? formatPrice(svc.priceUSD)
		: "";
	document.getElementById("svc-prefix").value = svc.pricePrefix || "Desde";
	if (svc.icon) {
		document.getElementById("svc-icon-preview-icon").className =
			`bi ${svc.icon}`;
		document.getElementById("svc-icon-preview").style.display = "block";
	}
	document.getElementById("svc-form-title").innerHTML =
		'<i class="bi bi-pencil-fill"></i> Editar Servicio';
	document.getElementById("svc-submit-btn").innerHTML =
		'<i class="bi bi-save"></i> Actualizar Servicio';
	document.getElementById("svc-cancel-btn").style.display = "inline-flex";
	document
		.querySelector("#tab-servicios .form-section")
		.scrollIntoView({ behavior: "smooth" });
}

function confirmDeleteService(index) {
	showModal("¿Estás seguro de eliminar este servicio?", () =>
		deleteService(index),
	);
}

// ==================== FORM HANDLING - PACKAGES ====================
function handlePackageSubmit(e) {
	e.preventDefault();
	const badgeVal = parseInt(document.getElementById("pkg-badge").value, 10);
	const pkgData = {
		tag: document.getElementById("pkg-tag").value.trim(),
		name: document.getElementById("pkg-name").value.trim(),
		description: document.getElementById("pkg-description").value.trim(),
		priceARS: rawPrice(document.getElementById("pkg-priceARS").value),
		priceUSD: rawPrice(document.getElementById("pkg-priceUSD").value),
		period: document.getElementById("pkg-period").value.trim(),
		badge: badgeVal > 0 && badgeVal <= 100 ? badgeVal : 0,
		features: getFeatures(),
	};
	if (editingPkgIndex !== null) {
		updatePackage(editingPkgIndex, pkgData);
	} else {
		createPackage(pkgData);
	}
}

function resetPackageForm() {
	document.getElementById("package-form").reset();
	document.getElementById("pkg-index").value = "";
	document.getElementById("pkg-features-list").innerHTML = "";
	document.getElementById("pkg-form-title").innerHTML =
		'<i class="bi bi-plus-circle"></i> Agregar Nuevo Paquete';
	document.getElementById("pkg-submit-btn").innerHTML =
		'<i class="bi bi-save"></i> Guardar Paquete';
	document.getElementById("pkg-cancel-btn").style.display = "none";
	editingPkgIndex = null;
}

function editPackage(index) {
	const pkg = packages[index];
	editingPkgIndex = index;
	document.getElementById("pkg-name").value = pkg.name || "";
	document.getElementById("pkg-tag").value = pkg.tag || "";
	document.getElementById("pkg-description").value = pkg.description || "";
	document.getElementById("pkg-priceARS").value = pkg.priceARS
		? formatPrice(pkg.priceARS)
		: "";
	document.getElementById("pkg-priceUSD").value = pkg.priceUSD
		? formatPrice(pkg.priceUSD)
		: "";
	document.getElementById("pkg-period").value = pkg.period || "";
	document.getElementById("pkg-badge").value = pkg.badge || 0;

	document.getElementById("pkg-features-list").innerHTML = "";
	if (pkg.features && Array.isArray(pkg.features)) {
		pkg.features.forEach((f) => addFeatureInput(f));
	}

	document.getElementById("pkg-form-title").innerHTML =
		'<i class="bi bi-pencil-fill"></i> Editar Paquete';
	document.getElementById("pkg-submit-btn").innerHTML =
		'<i class="bi bi-save"></i> Actualizar Paquete';
	document.getElementById("pkg-cancel-btn").style.display = "inline-flex";
	document
		.querySelector("#tab-paquetes .form-section")
		.scrollIntoView({ behavior: "smooth" });
}

function confirmDeletePackage(index) {
	showModal("¿Estás seguro de eliminar este paquete?", () =>
		deletePackage(index),
	);
}

// ==================== SHARED MODAL ====================
function showModal(message, onConfirm) {
	const modal = document.getElementById("confirm-modal");
	document.getElementById("confirm-modal-text").textContent = message;
	modal.style.display = "flex";
	const confirmBtn = document.getElementById("confirm-delete");
	const newBtn = confirmBtn.cloneNode(true);
	confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
	newBtn.addEventListener("click", () => {
		onConfirm();
		modal.style.display = "none";
	});
}

// ==================== RENDERING - PROJECTS ====================
function renderProjects() {
	const tbody = document.getElementById("projects-list");
	const emptyState = document.getElementById("empty-state");
	const tableContainer = document.querySelector(
		"#tab-proyectos .table-container",
	);

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
						? `<img src="${project.image}" alt="${project.alt || "Imagen"}" class="project-img">`
						: '<div style="width:60px;height:60px;background:#e5e7eb;border-radius:8px;display:flex;align-items:center;justify-content:center;"><i class="bi bi-image"></i></div>'
				}
			</td>
			<td class="project-name">${project.name}</td>
			<td><a href="${project.url}" target="_blank" class="project-url" title="${project.url}">${project.url}</a></td>
			<td class="project-description" title="${project.description || ""}">${project.description || '<span class="text-muted">—</span>'}</td>
			<td>
				<span class="badge-destacado ${project.destacado === 1 ? "active" : "inactive"}" onclick="toggleDestacado(${index})" title="Click para cambiar">
					<i class="bi bi-star${project.destacado === 1 ? "-fill" : ""}"></i> ${project.destacado === 1 ? "Destacado" : "Normal"}
				</span>
			</td>
			<td class="actions">
				<button class="btn btn-primary btn-sm" onclick="editProject(${index})" title="Editar"><i class="bi bi-pencil"></i></button>
				<button class="btn btn-danger btn-sm" onclick="confirmDelete(${index})" title="Eliminar"><i class="bi bi-trash"></i></button>
			</td>
		</tr>
	`,
		)
		.join("");
}

function updateProjectCount() {
	document.getElementById("projects-count").textContent =
		`${projects.length} proyecto${projects.length !== 1 ? "s" : ""}`;
}

// ==================== RENDERING - SERVICES ====================
function renderServices() {
	const tbody = document.getElementById("services-list");
	const emptyState = document.getElementById("svc-empty-state");
	const tableContainer = document.getElementById("svc-table-container");

	if (services.length === 0) {
		tableContainer.style.display = "none";
		emptyState.style.display = "block";
		return;
	}
	tableContainer.style.display = "block";
	emptyState.style.display = "none";

	tbody.innerHTML = services
		.map(
			(svc, index) => `
		<tr>
			<td><i class="bi ${svc.icon || "bi-question-circle"}" style="font-size:1.5rem;color:var(--primary-color)"></i></td>
			<td class="project-name">${svc.name}</td>
			<td class="project-description" title="${svc.description || ""}">${svc.description || '<span class="text-muted">—</span>'}</td>
			<td><span class="count-badge">${svc.pricePrefix || ""} ${formatPrice(svc.priceARS || 0)}</span></td>
			<td><span class="count-badge">USD ${formatPrice(svc.priceUSD || 0).replace("$", "")}</span></td>
			<td class="actions">
				<button class="btn btn-primary btn-sm" onclick="editService(${index})" title="Editar"><i class="bi bi-pencil"></i></button>
				<button class="btn btn-danger btn-sm" onclick="confirmDeleteService(${index})" title="Eliminar"><i class="bi bi-trash"></i></button>
			</td>
		</tr>
	`,
		)
		.join("");
}

function updateServiceCount() {
	document.getElementById("services-count").textContent =
		`${services.length} servicio${services.length !== 1 ? "s" : ""}`;
}

// ==================== RENDERING - PACKAGES ====================
function applyDiscount(price, badgePercent) {
	const discount = parseInt(badgePercent, 10);
	if (!discount || discount <= 0 || discount > 100) return price;
	return Math.round(price * (1 - discount / 100));
}

function renderPackages() {
	const tbody = document.getElementById("packages-list");
	const emptyState = document.getElementById("pkg-empty-state");
	const tableContainer = document.getElementById("pkg-table-container");

	if (packages.length === 0) {
		tableContainer.style.display = "none";
		emptyState.style.display = "block";
		return;
	}
	tableContainer.style.display = "block";
	emptyState.style.display = "none";

	tbody.innerHTML = packages
		.map((pkg, index) => {
			const hasDiscount = pkg.badge && parseInt(pkg.badge, 10) > 0;
			const discountARS = hasDiscount
				? applyDiscount(pkg.priceARS || 0, pkg.badge)
				: pkg.priceARS || 0;
			const discountUSD = hasDiscount
				? applyDiscount(pkg.priceUSD || 0, pkg.badge)
				: pkg.priceUSD || 0;

			const arsDisplay = hasDiscount
				? `<del style="color:#999;font-size:0.85em">${formatPrice(pkg.priceARS)}</del> ${formatPrice(discountARS)}`
				: formatPrice(pkg.priceARS || 0);

			const usdDisplay = hasDiscount
				? `<del style="color:#999;font-size:0.85em">USD ${formatPrice(pkg.priceUSD).replace("$", "")}</del> USD ${formatPrice(discountUSD).replace("$", "")}`
				: `USD ${formatPrice(pkg.priceUSD || 0).replace("$", "")}`;

			return `
		<tr>
			<td class="project-name">
				${pkg.name}
				${hasDiscount ? `<span class="badge-discount">-${pkg.badge}%</span>` : ""}
			</td>
			<td><span class="badge-tag">${pkg.tag || "—"}</span></td>
			<td><span class="count-badge">${arsDisplay} ARS</span></td>
			<td><span class="count-badge">${usdDisplay}</span></td>
			<td>${pkg.period || "—"}</td>
			<td>
				<ul class="features-preview">
					${(pkg.features || []).map((f) => `<li><i class="bi bi-check-circle-fill"></i> ${f}</li>`).join("")}
				</ul>
			</td>
			<td class="actions">
				<button class="btn btn-primary btn-sm" onclick="editPackage(${index})" title="Editar"><i class="bi bi-pencil"></i></button>
				<button class="btn btn-danger btn-sm" onclick="confirmDeletePackage(${index})" title="Eliminar"><i class="bi bi-trash"></i></button>
			</td>
		</tr>
	`;
		})
		.join("");
}

function updatePackageCount() {
	document.getElementById("packages-count").textContent =
		`${packages.length} paquete${packages.length !== 1 ? "s" : ""}`;
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
