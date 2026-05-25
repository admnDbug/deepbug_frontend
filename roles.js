document.addEventListener('DOMContentLoaded', () => {
    const rolUsuario = localStorage.getItem('rolUsuario'); 
    if (!rolUsuario) return;

    document.querySelectorAll("[data-role]").forEach(el => {
        const rolesPermitidos = el.getAttribute("data-role").split(" ");

        if (!rolesPermitidos.includes(rolUsuario)) {
            el.remove(); 
        }
    });
});