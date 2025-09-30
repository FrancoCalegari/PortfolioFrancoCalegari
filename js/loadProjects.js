// Función para cargar proyectos desde el JSON
async function loadProjects() {
    try {
        const response = await fetch('./json/proyectos.json');
        const data = await response.json();
        const container = document.getElementById('projectsContainer');

        data.projects.forEach(project => {
            // Crear elementos
            const projectItem = document.createElement('div');
            projectItem.classList.add('proyecto-item');

            const link = document.createElement('a');
            link.href = project.url;
            link.target = "_blank";

            const title = document.createElement('h3');
            title.textContent = project.name;

            const img = document.createElement('img');
            img.src = project.image;
            img.alt = project.alt;

            // Añadir título e imagen al link
            link.appendChild(title);
            link.appendChild(img);

            // Añadir link al proyecto
            projectItem.appendChild(link);

            // Añadir descripción debajo
            if (project.description) {
                const desc = document.createElement('p');
                desc.textContent = project.description;
                projectItem.appendChild(desc);
            }

            // Añadir todo al contenedor
            container.appendChild(projectItem);
        });
    } catch (error) {
        console.error("Error cargando los proyectos:", error);
    }
}

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', loadProjects);
