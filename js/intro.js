// Gestión del telón de carga (.intro), menú móvil accesible y selector de tema
document.addEventListener("DOMContentLoaded", () => {
	setupIntroSplash();
	setupMobileMenu();
	setupThemeToggle();
	const yearEl = document.getElementById("current-year");
	if (yearEl) yearEl.textContent = new Date().getFullYear();
});

function setupIntroSplash() {
	const intro = document.querySelector(".intro");
	if (!intro) return;

	let lifted = false;
	const liftCurtain = () => {
		if (lifted) return;
		lifted = true;
		intro.classList.add("intro--lifted");
		setTimeout(() => {
			intro.style.display = "none";
			intro.hidden = true;
		}, 900);
	};

	const minDelay = new Promise((resolve) => setTimeout(resolve, 650));
	const windowLoaded =
		document.readyState === "complete"
			? Promise.resolve()
			: new Promise((resolve) =>
					window.addEventListener("load", resolve, { once: true }),
				);
	const dataLoaded =
		window.__projectsReadyPromise instanceof Promise
			? window.__projectsReadyPromise
			: Promise.resolve();

	// Espera a que cargue el DOM/imágenes iniciales y los proyectos (o máximo 2s de seguridad)
	Promise.all([minDelay, windowLoaded, dataLoaded]).then(liftCurtain);
	setTimeout(liftCurtain, 2000);
}

function setupMobileMenu() {
	const toggleBtn = document.getElementById("menu-toggle");
	const menu = document.getElementById("primary-menu");
	if (!toggleBtn || !menu) return;

	toggleBtn.addEventListener("click", () => {
		const isExpanded = toggleBtn.getAttribute("aria-expanded") === "true";
		toggleBtn.setAttribute("aria-expanded", String(!isExpanded));
		menu.classList.toggle("is-open", !isExpanded);
		const icon = toggleBtn.querySelector("i");
		if (icon) {
			icon.className = !isExpanded ? "bi bi-x-lg" : "bi bi-list";
		}
	});

	menu.querySelectorAll("a").forEach((link) => {
		link.addEventListener("click", () => {
			toggleBtn.setAttribute("aria-expanded", "false");
			menu.classList.remove("is-open");
			const icon = toggleBtn.querySelector("i");
			if (icon) icon.className = "bi bi-list";
		});
	});
}

function setupThemeToggle() {
	const btn = document.getElementById("theme-toggle");
	const root = document.documentElement;
	const saved = localStorage.getItem("portfolio_theme");

	if (saved === "dark" || saved === "light") {
		root.setAttribute("data-theme", saved);
	}

	const updateIcon = () => {
		if (!btn) return;
		const icon = btn.querySelector("i");
		if (!icon) return;
		const current =
			root.getAttribute("data-theme") ||
			(window.matchMedia("(prefers-color-scheme: dark)").matches
				? "dark"
				: "light");
		icon.className =
			current === "dark" ? "bi bi-sun-fill" : "bi bi-moon-stars-fill";
	};

	updateIcon();

	if (btn) {
		btn.addEventListener("click", () => {
			const isDark =
				root.getAttribute("data-theme") === "dark" ||
				(!root.getAttribute("data-theme") &&
					window.matchMedia("(prefers-color-scheme: dark)").matches);
			const next = isDark ? "light" : "dark";
			root.setAttribute("data-theme", next);
			localStorage.setItem("portfolio_theme", next);
			updateIcon();
		});
	}
}
