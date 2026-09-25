// ==========================================================
// MOTO VELOZ - JavaScript principal
// Módulo de Catálogo: buscador, filtro, ordenamiento, detalle
// ==========================================================

// ----------------------------------------------------------
// UTILIDADES
// ----------------------------------------------------------

function formatearPrecio(valor, moneda) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: moneda,
        maximumFractionDigits: 0
    }).format(valor);
}

function obtenerIdDeURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

async function cargarDatos() {
    try {
        const resp = await fetch('motos.json');
        return await resp.json();
    } catch (error) {
        console.error('Error cargando motos.json:', error);
        return null;
    }
}

// ----------------------------------------------------------
// MODO OSCURO
// ----------------------------------------------------------
function configurarModoTema() {
    const btn = document.getElementById('btnTema');
    if (!btn) return;

    const body = document.body;
    const temaGuardado = localStorage.getItem('tema');
    if (temaGuardado === 'oscuro') {
        body.classList.add('oscuro');
        btn.textContent = 'Modo claro';
    }

    btn.addEventListener('click', () => {
        body.classList.toggle('oscuro');
        const esOscuro = body.classList.contains('oscuro');
        btn.textContent = esOscuro ? 'Modo claro' : 'Modo oscuro';
        localStorage.setItem('tema', esOscuro ? 'oscuro' : 'claro');
    });
}

// ----------------------------------------------------------
// BOTÓN VOLVER ARRIBA
// ----------------------------------------------------------
function configurarBotonArriba() {
    const btn = document.getElementById('btnArriba');
    if (!btn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ==========================================================
// RENDERIZAR MOTOS (función reutilizable)
// Recibe un array de motos y las pinta en el grid
// ==========================================================
function renderizarMotos(motos, contenedor) {
    contenedor.innerHTML = '';

    if (motos.length === 0) {
        contenedor.innerHTML = `
            <p class="sin-resultados">No se encontraron motos con esos criterios.</p>
        `;
        return;
    }

    motos.forEach(moto => {
        const card = document.createElement('article');
        card.className = 'card-moto';
        card.innerHTML = `
            <img src="${moto.imagen}" alt="${moto.modelo}" class="card-imagen">
            <span class="categoria">${moto.categoria}</span>
            <h3>${moto.modelo}</h3>
            <p class="precio">${formatearPrecio(moto.precio, moto.moneda)}</p>
            <p class="descripcion">${moto.descripcion}</p>
            <a class="btn-ver" href="detalle.html?id=${moto.id}">Ver detalles</a>
        `;
        contenedor.appendChild(card);
    });
}

// ==========================================================
// PÁGINA DE CATÁLOGO (index.html)
// ==========================================================
async function iniciarCatalogo() {
    const datos = await cargarDatos();
    if (!datos) return;

    // Cabecera
    document.querySelector('.cabecera h1').textContent = datos.nombre;
    document.querySelector('.subtitulo').textContent = datos.eslogan;

    // Índice lateral
    const listaIndice = document.getElementById('listaIndice');
    listaIndice.innerHTML = '';
    datos.motos.forEach(moto => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = 'detalle.html?id=' + moto.id;
        a.textContent = moto.modelo;
        li.appendChild(a);
        listaIndice.appendChild(li);
    });

    // Elementos del DOM
    const contenedor = document.getElementById('listaMotos');
    const buscador = document.getElementById('buscador');
    const filtroCategoria = document.getElementById('filtroCategoria');
    const ordenarPrecio = document.getElementById('ordenarPrecio');
    const contador = document.getElementById('contadorResultados');

    // Función que aplica todos los filtros y renderiza
    function aplicarFiltros() {
        let resultado = [...datos.motos];

        // 1) Buscador por nombre
        const texto = buscador.value.trim().toLowerCase();
        if (texto) {
            resultado = resultado.filter(m =>
                m.modelo.toLowerCase().includes(texto) ||
                m.categoria.toLowerCase().includes(texto)
            );
        }

        // 2) Filtro por categoría
        const categoria = filtroCategoria.value;
        if (categoria !== 'Todas') {
            resultado = resultado.filter(m => m.categoria === categoria);
        }

        // 3) Ordenamiento por precio
        const orden = ordenarPrecio.value;
        if (orden === 'asc') {
            resultado.sort((a, b) => a.precio - b.precio);
        } else if (orden === 'desc') {
            resultado.sort((a, b) => b.precio - a.precio);
        }

        // Renderizamos
        renderizarMotos(resultado, contenedor);

        // Actualizamos el contador
        contador.textContent = resultado.length === 0
            ? 'Sin resultados'
            : `Mostrando ${resultado.length} de ${datos.motos.length} motos`;
    }

    // Eventos de los controles
    buscador.addEventListener('input', aplicarFiltros);
    filtroCategoria.addEventListener('change', aplicarFiltros);
    ordenarPrecio.addEventListener('change', aplicarFiltros);

    // Primera carga
    aplicarFiltros();
}

// ==========================================================
// PÁGINA DE DETALLE (detalle.html)
// ==========================================================
async function iniciarDetalle() {
    const datos = await cargarDatos();
    if (!datos) return;

    const id = obtenerIdDeURL();
    const moto = datos.motos.find(m => m.id === id);
    const contenedor = document.getElementById('fichaMoto');

    if (!moto) {
        contenedor.innerHTML = `
            <p class="cargando">No se encontró la moto solicitada.
            <a href="index.html">Volver al catálogo</a></p>
        `;
        return;
    }

    document.title = moto.modelo + ' | Moto Veloz';
    document.getElementById('tituloDetalle').textContent = moto.modelo;

    contenedor.innerHTML = `
        <img src="${moto.imagen}" alt="${moto.modelo}" class="ficha-imagen">
        <div class="ficha-info">
            <span class="categoria">${moto.categoria}</span>
            <h2>${moto.modelo}</h2>
            <p class="precio-grande">${formatearPrecio(moto.precio, moto.moneda)}</p>
            <p class="descripcion">${moto.descripcion}</p>
            <a href="#" class="btn-comprar">Cotizar esta moto</a>
        </div>

        <h3 class="titulo-bloque">Ficha técnica</h3>
        <table class="tabla-specs">
            <tr><th>Cilindraje</th><td>${moto.cilindraje}</td></tr>
            <tr><th>Potencia</th><td>${moto.potencia}</td></tr>
            <tr><th>Peso</th><td>${moto.peso}</td></tr>
            <tr><th>Velocidad máxima</th><td>${moto.velocidadMaxima}</td></tr>
        </table>

        <h3 class="titulo-bloque">Características</h3>
        <ul class="lista-caract">
            ${moto.caracteristicas.map(c => `<li>${c}</li>`).join('')}
        </ul>

        <h3 class="titulo-bloque">Colores disponibles</h3>
        <div class="colores">
            ${moto.colores.map(c => `<span class="color-chip">${c}</span>`).join('')}
        </div>
    `;
}

// ==========================================================
// INICIALIZACIÓN GENERAL
// ==========================================================
document.addEventListener('DOMContentLoaded', () => {
    configurarModoTema();
    configurarBotonArriba();

    if (document.getElementById('listaMotos')) {
        iniciarCatalogo();
    } else if (document.getElementById('fichaMoto')) {
        iniciarDetalle();
    }
});