// ========================================
// SERVICIOS PAGE - JavaScript
// ========================================

let currentCurrency = "ARS";
let servicesData = [];
let packagesData = [];
let dolarBlueVenta = 0;

// ==================== PRICE FORMATTING ====================
function formatPrice(value, currency) {
	const num = parseInt(String(value).replace(/\D/g, ""), 10);
	if (isNaN(num) || num === 0) return "";
	const formatted = num.toLocaleString("es-AR");
	if (currency === "USD") {
		return `US$${formatted}`;
	}
	return `$${formatted}`;
}

function arsToUsd(ars) {
	if (!dolarBlueVenta || dolarBlueVenta === 0) return 0;
	return Math.round(ars / dolarBlueVenta);
}

function getUsdPrice(item) {
	// Convert from ARS using live rate, fallback to stored priceUSD
	if (dolarBlueVenta > 0 && item.priceARS) {
		return arsToUsd(item.priceARS);
	}
	return item.priceUSD || 0;
}

// ==================== INIT ====================
document.addEventListener("DOMContentLoaded", async () => {
	// Fetch blue dollar rate first
	try {
		const res = await fetch("https://dolarapi.com/v1/dolares/blue");
		const data = await res.json();
		dolarBlueVenta = data.venta || 0;
		// Show rate next to toggle
		const rateInfo = document.getElementById("dolar-rate-info");
		if (rateInfo && dolarBlueVenta > 0) {
			rateInfo.textContent = `Dólar Blue: $${dolarBlueVenta.toLocaleString("es-AR")}`;
			rateInfo.style.display = "block";
		}
	} catch (err) {
		console.warn("No se pudo obtener cotización del dólar blue:", err);
	}

	loadServicesPage();
	loadPackagesPage();
	setupCurrencyToggle();
	setupNav();
	setupContactForm();
	setupPlanModal();
});

// ==================== CURRENCY TOGGLE ====================
function setupCurrencyToggle() {
	const toggle = document.getElementById("currency-toggle");
	if (!toggle) return;

	toggle.querySelectorAll(".currency-btn").forEach((btn) => {
		btn.addEventListener("click", () => {
			toggle
				.querySelectorAll(".currency-btn")
				.forEach((b) => b.classList.remove("active"));
			btn.classList.add("active");
			currentCurrency = btn.getAttribute("data-currency");
			// Re-render with new currency
			renderServices();
			renderPackages();
		});
	});
}

// ==================== DYNAMIC DATA LOADING ====================
async function loadServicesPage() {
	try {
		const response = await fetch("./json/servicios.json");
		const data = await response.json();
		servicesData = data.services || [];
		renderServices();
	} catch (error) {
		console.error("Error cargando servicios:", error);
	}
}

async function loadPackagesPage() {
	try {
		const response = await fetch("./json/paquetes.json");
		const data = await response.json();
		packagesData = data.packages || [];
		renderPackages();
	} catch (error) {
		console.error("Error cargando paquetes:", error);
	}
}

// ==================== RENDERING ====================
function renderServices() {
	const container = document.getElementById("services-container");
	if (!container) return;

	container.innerHTML = servicesData
		.map((svc) => {
			const price = currentCurrency === "USD" ? getUsdPrice(svc) : svc.priceARS;
			const prefix = svc.pricePrefix || "";
			return `
				<div class="serv-card">
					<div class="serv-card-icon">
						<i class="bi ${svc.icon || "bi-question-circle"}"></i>
					</div>
					<h3>${svc.name}</h3>
					<p>${svc.description || ""}</p>
					<span class="serv-card-price">${prefix ? prefix + " " : ""}${formatPrice(price, currentCurrency)}</span>
				</div>
			`;
		})
		.join("");
}

function renderPackages() {
	const container = document.getElementById("packages-container");
	if (!container) return;

	container.innerHTML = packagesData
		.map((pkg) => {
			const priceOriginal =
				currentCurrency === "USD" ? getUsdPrice(pkg) : pkg.priceARS;
			const currLabel = currentCurrency === "USD" ? "USD" : "ARS";
			const hasDiscount = pkg.badge && parseInt(pkg.badge, 10) > 0;
			const discountPercent = hasDiscount ? parseInt(pkg.badge, 10) : 0;
			const priceFinal = hasDiscount
				? Math.round(priceOriginal * (1 - discountPercent / 100))
				: priceOriginal;

			const priceHTML = hasDiscount
				? `<span class="serv-package-original">${formatPrice(priceOriginal, currentCurrency)}</span>
				   <div class="serv-package-price">${formatPrice(priceFinal, currentCurrency)} <span>${currLabel}</span></div>`
				: `<div class="serv-package-price">${formatPrice(priceOriginal, currentCurrency)} <span>${currLabel}</span></div>`;

			return `
				<div class="serv-package">
					${hasDiscount ? `<div class="serv-package-badge">-${discountPercent}%</div>` : ""}
					<span class="serv-package-tag">${pkg.tag || ""}</span>
					<h3>${pkg.name}</h3>
					<p class="serv-pkg-desc">${pkg.description || ""}</p>
					${priceHTML}
					<p class="serv-package-period">${pkg.period || ""}</p>
					<ul class="serv-package-features">
						${(pkg.features || []).map((f) => `<li><i class="bi bi-check-circle-fill"></i> ${f}</li>`).join("")}
					</ul>
					<a href="#contact" class="serv-package-cta" data-plan="${pkg.name}">
						Elegir Plan
					</a>
				</div>
			`;
		})
		.join("");

	// Re-bind CTA handlers
	setupPackageCTAs();
}

// ==================== NAV & SCROLL ====================
function setupNav() {
	const nav = document.querySelector(".serv-nav");
	if (nav) {
		window.addEventListener("scroll", () => {
			nav.classList.toggle("scrolled", window.scrollY > 50);
		});
	}

	const toggle = document.querySelector(".serv-nav-toggle");
	const navLinks = document.querySelector(".serv-nav-links");
	const overlay = document.querySelector(".serv-nav-overlay");

	if (toggle && navLinks) {
		toggle.addEventListener("click", () => {
			navLinks.classList.toggle("open");
			if (overlay) overlay.classList.toggle("show");
		});

		if (overlay) {
			overlay.addEventListener("click", () => {
				navLinks.classList.remove("open");
				overlay.classList.remove("show");
			});
		}

		navLinks.querySelectorAll("a").forEach((link) => {
			link.addEventListener("click", () => {
				navLinks.classList.remove("open");
				if (overlay) overlay.classList.remove("show");
			});
		});
	}

	// Smooth scroll
	document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
		anchor.addEventListener("click", (e) => {
			e.preventDefault();
			const target = document.querySelector(anchor.getAttribute("href"));
			if (target) {
				const navHeight = nav ? nav.offsetHeight : 0;
				const targetPosition =
					target.getBoundingClientRect().top + window.scrollY - navHeight;
				window.scrollTo({ top: targetPosition, behavior: "smooth" });
			}
		});
	});
}

let selectedPlanName = "";

function setupPackageCTAs() {
	document.querySelectorAll(".serv-package-cta").forEach((btn) => {
		btn.addEventListener("click", (e) => {
			e.preventDefault();
			selectedPlanName = btn.getAttribute("data-plan") || "";
			openPlanModal(selectedPlanName);
		});
	});
}

function openPlanModal(planName) {
	const overlay = document.getElementById("planModalOverlay");
	const planLabel = document.getElementById("planModalPlan");
	if (!overlay) return;

	// Set the plan name
	if (planLabel) planLabel.textContent = `📦 ${planName}`;

	// Reset form
	const form = document.getElementById("planModalForm");
	if (form) form.reset();

	// Show modal
	overlay.classList.add("show");
	document.body.style.overflow = "hidden";
}

function closePlanModal() {
	const overlay = document.getElementById("planModalOverlay");
	if (!overlay) return;
	overlay.classList.remove("show");
	document.body.style.overflow = "";
}

function setupPlanModal() {
	const overlay = document.getElementById("planModalOverlay");
	const closeBtn = document.getElementById("planModalClose");
	const form = document.getElementById("planModalForm");

	if (closeBtn) {
		closeBtn.addEventListener("click", closePlanModal);
	}

	if (overlay) {
		overlay.addEventListener("click", (e) => {
			if (e.target === overlay) closePlanModal();
		});
	}

	// ESC key to close
	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape") closePlanModal();
	});

	if (form) {
		form.addEventListener("submit", (e) => {
			e.preventDefault();

			const nombre = document.getElementById("planNombre").value.trim();
			const email = document.getElementById("planEmail").value.trim();
			const mensaje = document.getElementById("planMensaje").value.trim();

			if (!nombre || !email) {
				showToast("Por favor completá nombre y email.", "error");
				return;
			}

			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(email)) {
				showToast("Por favor ingresá un email válido.", "error");
				return;
			}

			const whatsappMsg =
				`¡Hola Franco! 👋\n\n` +
				`*Consulta de Plan desde el Portfolio*\n\n` +
				`📦 *Plan:* ${selectedPlanName}\n` +
				`👤 *Nombre:* ${nombre}\n` +
				`📧 *Email:* ${email}\n` +
				(mensaje ? `\n💬 *Mensaje:*\n${mensaje}` : "");

			const whatsappURL = `https://wa.me/5492617735869?text=${encodeURIComponent(whatsappMsg)}`;

			showToast("¡Redirigiendo a WhatsApp! 🚀");
			closePlanModal();

			setTimeout(() => {
				window.open(whatsappURL, "_blank");
			}, 600);
		});
	}
}

// ==================== CONTACT FORM ====================
function setupContactForm() {
	const form = document.getElementById("servContactForm");
	if (!form) return;

	form.addEventListener("submit", (e) => {
		e.preventDefault();

		const nombre = document.getElementById("servNombre").value.trim();
		const email = document.getElementById("servEmail").value.trim();
		const interes = document.getElementById("servInteres").value;
		const mensaje = document.getElementById("servMensaje").value.trim();

		if (!nombre || !email || !interes || !mensaje) {
			showToast("Por favor completá todos los campos.", "error");
			return;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			showToast("Por favor ingresá un email válido.", "error");
			return;
		}

		const whatsappMsg =
			`¡Hola Franco! 👋\n\n` +
			`*Solicitud de servicio desde el Portfolio*\n\n` +
			`👤 *Nombre:* ${nombre}\n` +
			`📧 *Email:* ${email}\n` +
			`🎯 *Interés:* ${interes}\n\n` +
			`💬 *Mensaje:*\n${mensaje}`;

		const whatsappURL = `https://wa.me/5492617735869?text=${encodeURIComponent(whatsappMsg)}`;

		showToast("¡Redirigiendo a WhatsApp! 🚀");

		setTimeout(() => {
			window.open(whatsappURL, "_blank");
		}, 800);

		form.reset();
	});
}

// ==================== TOAST ====================
function showToast(message, type = "success") {
	const existing = document.querySelector(".serv-toast");
	if (existing) existing.remove();

	const toast = document.createElement("div");
	toast.className = "serv-toast";
	toast.innerHTML = `
		<i class="bi ${type === "error" ? "bi-exclamation-circle" : "bi-check-circle-fill"}"></i>
		<span>${message}</span>
	`;
	document.body.appendChild(toast);

	requestAnimationFrame(() => {
		toast.classList.add("show");
	});

	setTimeout(() => {
		toast.classList.remove("show");
		setTimeout(() => toast.remove(), 400);
	}, 3000);
}
