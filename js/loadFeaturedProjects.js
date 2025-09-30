// Función para cargar solo los proyectos destacados
async function loadFeaturedProjects() {
    try {
        const response = await fetch('./json/proyectos.json');
        const data = await response.json();
        const container = document.getElementById('featuredProjectsContainer');

        // Filtrar solo los proyectos con destacado = 1
        const featuredProjects = data.projects.filter(project => project.destacado === 1);

        featuredProjects.forEach(project => {
            // Crear contenedor principal
            const projectContainer = document.createElement('div');
            projectContainer.classList.add('proyectAppContainer');

            const link = document.createElement('a');
            link.href = project.url;
            link.target = "_blank";

            const innerDiv = document.createElement('div');

            const img = document.createElement('img');
            img.src = project.image;
            img.alt = project.alt;

            const title = document.createElement('h3');
            title.classList.add('proyectAppContainerName');
            title.textContent = project.name;

            // Añadir imagen y título al div interno
            innerDiv.appendChild(img);
            innerDiv.appendChild(title);

            // Añadir div interno al link
            link.appendChild(innerDiv);

            // Añadir link al contenedor principal
            projectContainer.appendChild(link);

            // Agregar descripción
            if (project.description) {
                const desc = document.createElement('p');
                desc.textContent = project.description;
                projectContainer.appendChild(desc);
            }

            // Añadir todo al contenedor principal de la sección
            container.appendChild(projectContainer);
        });
    } catch (error) {
        console.error("Error cargando los proyectos destacados:", error);
    }
}

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', loadFeaturedProjects);
