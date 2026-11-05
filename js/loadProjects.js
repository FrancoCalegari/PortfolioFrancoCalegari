// Carga el catálogo completo de proyectos con búsqueda y filtro accesible
let allProjects = [];
let currentFilter = "all";
let searchQuery = "";

async function fetchProjectsData() {
	try {
		const res = await fetch("/api/projects");
		if (res.ok) {
			const data = await res.json();
			if (Array.isArray(data.projects)) return data.projects;
		}
	} catch {
		// Fallback estático
	}
	const fallback = await fetch("./json/proyectos.json");
	const data = await fallback.json();
	return data.projects || [];
}

function createProjectCard(project) {
	const article = document.createElement("article");
	article.className = "project-card";

	const media = document.createElement("div");
	media.className = "project-card-media";

	const img = document.createElement("img");
	img.src = project.image || "./img/icon/nophoto.jpg";
	img.alt = project.alt || `Vista previa de ${project.name}`;
	img.loading = "lazy";
	img.onerror = () => {
		img.src = "./img/icon/nophoto.jpg";
	};
	media.appendChild(img);

	if (Number(project.destacado) === 1) {
		const badge = document.createElement("span");
		badge.className = "project-badge-featured";
		badge.innerHTML =
			'<i class="bi bi-star-fill" aria-hidden="true"></i> Destacado';
		media.appendChild(badge);
	}

	const body = document.createElement("div");
	body.className = "project-card-body";

	const title = document.createElement("h3");
	title.textContent = project.name;
	body.appendChild(title);

	const desc = document.createElement("p");
	desc.textContent =
		project.description || "Proyecto desarrollado por Franco Calegari.";
	body.appendChild(desc);

	const footer = document.createElement("div");
	footer.className = "project-card-footer";

	if (project.url && project.url !== "#") {
		const link = document.createElement("a");
		link.className = "project-card-link";
		link.href = project.url;
		link.target = "_blank";
		link.rel = "noopener noreferrer";
		link.setAttribute("aria-label", `Visitar proyecto ${project.name}`);
		link.innerHTML =
			'Visitar proyecto <i class="bi bi-box-arrow-up-right" aria-hidden="true"></i>';
		footer.appendChild(link);
	}

	article.appendChild(media);
	article.appendChild(body);
	article.appendChild(footer);
	return article;
}

function renderFilteredProjects() {
	const container = document.getElementById("projectsContainer");
	if (!container) return;

	const filtered = allProjects.filter((p) => {
		const matchesFilter =
			currentFilter === "all" || Number(p.destacado) === 1;
		const text = `${p.name || ""} ${p.description || ""}`.toLowerCase();
		const matchesSearch = !searchQuery || text.includes(searchQuery);
		return matchesFilter && matchesSearch;
	});

	container.innerHTML = "";

	if (filtered.length === 0) {
		container.innerHTML =
			'<p class="empty-projects-msg">No se encontraron proyectos con ese criterio.</p>';
		return;
	}

	filtered.forEach((project) => {
		container.appendChild(createProjectCard(project));
	});
}

async function initProjectsCatalog() {
	try {
		allProjects = await fetchProjectsData();
		renderFilteredProjects();
	} catch (error) {
		console.error("Error cargando los proyectos:", error);
	}

	const searchInput = document.getElementById("project-search");
	if (searchInput) {
		searchInput.addEventListener("input", (e) => {
			searchQuery = e.target.value.trim().toLowerCase();
			renderFilteredProjects();
		});
	}

	document.querySelectorAll(".filter-btn").forEach((btn) => {
		btn.addEventListener("click", () => {
			document.querySelectorAll(".filter-btn").forEach((b) => {
				b.classList.remove("active");
				b.setAttribute("aria-pressed", "false");
			});
			btn.classList.add("active");
			btn.setAttribute("aria-pressed", "true");
			currentFilter = btn.getAttribute("data-filter") || "all";
			renderFilteredProjects();
		});
	});
}

if (document.readyState === "loading") {
	window.__projectsReadyPromise = new Promise((resolve) => {
		document.addEventListener(
			"DOMContentLoaded",
			() => resolve(initProjectsCatalog()),
			{ once: true },
		);
	});
} else {
	window.__projectsReadyPromise = initProjectsCatalog();
}
