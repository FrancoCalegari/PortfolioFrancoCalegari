// Carga los proyectos destacados desde /api/projects (con fallback a ./json/proyectos.json)
async function fetchProjectsData() {
	try {
		const res = await fetch("/api/projects");
		if (res.ok) {
			const data = await res.json();
			if (Array.isArray(data.projects)) return data.projects;
		}
	} catch {
		// Continúa al fallback estático si se abre sin backend
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

async function loadFeaturedProjects() {
	const container = document.getElementById("featuredProjectsContainer");
	if (!container) return;

	try {
		const projects = await fetchProjectsData();
		const featured = projects.filter((p) => Number(p.destacado) === 1);
		container.innerHTML = "";

		if (featured.length === 0) {
			container.innerHTML =
				'<p class="empty-projects-msg">No hay proyectos destacados por el momento.</p>';
			return;
		}

		featured.forEach((project) => {
			container.appendChild(createProjectCard(project));
		});
	} catch (error) {
		console.error("Error cargando los proyectos destacados:", error);
	}
}

if (document.readyState === "loading") {
	window.__projectsReadyPromise = new Promise((resolve) => {
		document.addEventListener(
			"DOMContentLoaded",
			() => resolve(loadFeaturedProjects()),
			{ once: true },
		);
	});
} else {
	window.__projectsReadyPromise = loadFeaturedProjects();
}
