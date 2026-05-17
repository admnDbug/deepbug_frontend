// Archivo: roles.js

document.addEventListener('DOMContentLoaded', () => {
    // Obtenemos el rol real del usuario desde el localStorage
    const rolUsuario = localStorage.getItem('rolUsuario'); 

    // Si no hay rol (no ha iniciado sesión), no hacemos nada
    if (!rolUsuario) return;

    // Buscar todos los elementos que tienen el atributo "data-role"
    document.querySelectorAll("[data-role]").forEach(el => {
        // Obtenemos los roles permitidos para ese elemento (ej: "Responsable Colaborador")
        const rolesPermitidos = el.getAttribute("data-role").split(" ");

        // Si el rol del usuario NO está en la lista de permitidos, borramos el elemento
        if (!rolesPermitidos.includes(rolUsuario)) {
            el.remove(); 
        }
    });
});