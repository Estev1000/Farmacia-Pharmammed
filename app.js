// ============================================
// CONFIGURACIÓN Y ESTADO
// ============================================

class FarmaciaApp {
    constructor() {
        // Estado inicial
        this.productos = [];
        this.carrito = [];
        this.ventas = []; // Historial de ventas
        this.ventasTotales = 0.0;
        this.editId = null; // Estado para edición de productos
        this.rotacionMethod = localStorage.getItem('rotacionMethod') || 'FIFO';

        // Cargar datos del localStorage y migrar si es necesario
        this.cargarDatos();

        // Inicializar interfaz
        this.inicializar();
    }

    // ============================================
    // ALMACENAMIENTO DE DATOS
    // ============================================

    cargarDatos() {
        try {
            const datosGuardados = localStorage.getItem('farmaciaData');

            if (datosGuardados) {
                const datos = JSON.parse(datosGuardados);
                this.productos = datos.productos || [];
                this.ventasTotales = datos.ventasTotales || 0.0;
                this.ventas = datos.ventas || []; // Historial nuevo

                // MIGRACIÓN: Asegurar estructura de lotes
                this.migrarDatos();
            } else {
                // Datos de prueba iniciales
                if (this.productos.length === 0) {
                    this.productos = [
                        {
                            id: 1,
                            nombre: 'Paracetamol',
                            droga: 'Paracetamol',
                            dosis: '500mg',
                            presentacion: 'Caja x 10',
                            marca: 'Genérico',
                            laboratorio: 'Genérico',
                            precio: 5.00,
                            temp: 'Ambiente',
                            lotes: [
                                { id: 'L1', lote: 'A001', vto: '2025-12-01', stock: 100 }
                            ]
                        }
                    ];
                    this.guardarDatos();
                }
            }
        } catch (error) {
            console.error('Error al cargar datos:', error);
            this.mostrarError('Error crítico al cargar la base de datos.');
        }
    }

    migrarDatos() {
        let migrado = false;
        this.productos.forEach(p => {
            // Si tiene stock plano y no lotes, convertir
            if (p.stock !== undefined && !p.lotes) {
                p.lotes = [{
                    id: Date.now() + Math.random(),
                    lote: 'S/L', // Sin Lote (Legacy)
                    vto: '2099-12-31', // Sin Vencimiento
                    stock: p.stock
                }];
                // Mantener campos aunque estén vacíos si no existen
                p.droga = p.droga || '';
                p.presentacion = p.presentacion || '';
                p.marca = p.marca || '';
                p.laboratorio = p.laboratorio || '';

                delete p.stock; // Remover propiedad antigua
                migrado = true;
            }
        });

        if (migrado) {
            console.log("Base de datos migrada a sistema de lotes.");
            this.guardarDatos();
        }
    }

    guardarDatos() {
        try {
            const datos = {
                productos: this.productos,
                ventasTotales: this.ventasTotales,
                ventas: this.ventas
            };
            localStorage.setItem('farmaciaData', JSON.stringify(datos));
        } catch (error) {
            console.error('Error al guardar datos:', error);
            this.mostrarError('No se pudo guardar la información. Espacio insuficiente?');
        }
    }

    // ============================================
    // INICIALIZACIÓN
    // ============================================

    inicializar() {
        this.setupElementos();
        this.configurarEventos();

        // Sets default date logic
        const hoy = new Date().toISOString().split('T')[0];
        if (this.elementos.fechaVenta) this.elementos.fechaVenta.value = hoy;

        this.actualizarUI();
        this.verificarAlertasVencimiento();
    }

    setupElementos() {
        this.elementos = {
            // Inventario Inputs
            prodNombre: document.getElementById('prodNombre'),
            prodCodigoBarras: document.getElementById('prodCodigoBarras'),
            prodDroga: document.getElementById('prodDroga'),
            prodDosis: document.getElementById('prodDosis'),
            prodPresentacion: document.getElementById('prodPresentacion'),
            prodMarca: document.getElementById('prodMarca'),
            prodLaboratorio: document.getElementById('prodLaboratorio'),
            prodTemp: document.getElementById('prodTemp'),
            prodLote: document.getElementById('prodLote'),
            prodVencimiento: document.getElementById('prodVencimiento'),
            prodPrecio: document.getElementById('prodPrecio'),
            prodStock: document.getElementById('prodStock'),

            btnAgregarProducto: document.getElementById('btnAgregarProducto'),
            listaProductos: document.getElementById('listaProductos'),

            // Excel & Tools
            btnImportarExcel: document.getElementById('btnImportarExcel'),
            btnExportarExcel: document.getElementById('btnExportarExcel'),
            btnAumentoMasivo: document.getElementById('btnAumentoMasivo'),
            btnReduccionMasiva: document.getElementById('btnReduccionMasiva'),
            inputExcel: document.getElementById('inputExcel'),

            // Sincronización Multicaja
            btnExportarCierre: document.getElementById('btnExportarCierre'),
            btnImportarVentas: document.getElementById('btnImportarVentas'),
            btnImportarMaster: document.getElementById('btnImportarMaster'),
            btnDistribuirStock: document.getElementById('btnDistribuirStock'), // Nuevo
            inputSync: document.getElementById('inputSync'),

            // Ventas Inputs
            inputCodigoBarras: document.getElementById('inputCodigoBarras'),
            selectProductoVenta: document.getElementById('selectProductoVenta'),
            cantidadVenta: document.getElementById('cantidadVenta'),
            fechaVenta: document.getElementById('fechaVenta'),
            clienteNombre: document.getElementById('clienteNombre'),
            inputDocumento: document.getElementById('inputDocumento'),
            btnAgregarCarrito: document.getElementById('btnAgregarCarrito'),

            // Carrito
            tablaCarrito: document.getElementById('tablaCarrito'),
            cuerpoTablaCarrito: document.getElementById('cuerpoTablaCarrito'),
            carritoVacio: document.getElementById('carritoVacio'),
            totalCarrito: document.getElementById('totalCarrito'),

            // Acciones Finales
            btnFinalizarCompra: document.getElementById('btnFinalizarCompra'),
            btnCancelarCompra: document.getElementById('btnCancelarCompra'),

            // Navbar / Toolbar
            btnVerVentas: document.getElementById('btnVerVentas'),
            btnVentasHeader: document.getElementById('btnVentasHeader'),
            btnImprimirTicket: document.getElementById('btnImprimirTicket'),
            btnSoporte: document.getElementById('btnSoporte'),
            selectRotacion: document.getElementById('selectRotacion'),

            // Reports Toolbar
            btnReporteStock: document.getElementById('btnReporteStock'),
            btnReporteDispensas: document.getElementById('btnReporteDispensas'),
            btnAlertasVencimiento: document.getElementById('btnAlertasVencimiento'),
            btnAlertasStock: document.getElementById('btnAlertasStock'),
            contenedorReportes: document.getElementById('contenedorReportes'),
            tablaReportes: document.getElementById('tablaReportes'),
            headerReportes: document.getElementById('headerReportes'),
            bodyReportes: document.getElementById('bodyReportes'),
            footerReportes: document.getElementById('footerReportes'),

            // Tabs
            tabButtons: document.querySelectorAll('.tab-button'),
            tabContents: document.querySelectorAll('.tab-content'),

            // Modales
            modalConfirmacion: document.getElementById('modalConfirmacion'),
            modalInfo: document.getElementById('modalInfo'),
            modalError: document.getElementById('modalError'),

            btnConfirmarSi: document.getElementById('btnConfirmarSi'),
            btnConfirmarNo: document.getElementById('btnConfirmarNo'),
            btnCerrarInfo: document.getElementById('btnCerrarInfo'),
            btnCerrarError: document.getElementById('btnCerrarError'),
        };
    }

    configurarEventos() {
        // Inventario
        this.elementos.btnAgregarProducto.addEventListener('click', () => this.agregarProducto());

        // Excel
        if (this.elementos.btnImportarExcel) this.elementos.btnImportarExcel.addEventListener('click', () => this.elementos.inputExcel.click());
        if (this.elementos.inputExcel) this.elementos.inputExcel.addEventListener('change', (e) => this.procesarExcel(e));
        if (this.elementos.btnExportarExcel) this.elementos.btnExportarExcel.addEventListener('click', () => this.exportarExcel());
        if (this.elementos.btnAumentoMasivo) this.elementos.btnAumentoMasivo.addEventListener('click', () => this.aumentoMasivo());
        if (this.elementos.btnReduccionMasiva) this.elementos.btnReduccionMasiva.addEventListener('click', () => this.reduccionMasiva());

        // Ventas
        this.elementos.btnAgregarCarrito.addEventListener('click', () => this.agregarAlCarrito());
        this.elementos.btnFinalizarCompra.addEventListener('click', () => this.finalizarCompra());
        this.elementos.btnCancelarCompra.addEventListener('click', () => this.cancelarCompra());

        // Reportes
        if (this.elementos.btnReporteStock) this.elementos.btnReporteStock.addEventListener('click', () => this.generarReporteStock());
        if (this.elementos.btnReporteDispensas) this.elementos.btnReporteDispensas.addEventListener('click', () => this.generarReporteDispensas());
        if (this.elementos.btnAlertasVencimiento) this.elementos.btnAlertasVencimiento.addEventListener('click', () => this.generarAlertasVencimiento());
        if (this.elementos.btnAlertasStock) this.elementos.btnAlertasStock.addEventListener('click', () => this.generarAlertasVencimiento());

        // Sincronización Multicaja
        if (this.elementos.btnExportarCierre) {
            this.elementos.btnExportarCierre.addEventListener('click', () => this.exportarCierreCaja());
        }
        if (this.elementos.btnImportarVentas) {
            this.elementos.btnImportarVentas.addEventListener('click', () => {
                this._syncMode = 'CONSOLIDAR_VENTAS';
                this.elementos.inputSync.click();
            });
        }
        if (this.elementos.btnImportarMaster) {
            this.elementos.btnImportarMaster.addEventListener('click', () => {
                this._syncMode = 'ACTUALIZAR_MASTER';
                this.elementos.inputSync.click();
            });
        }
        if (this.elementos.btnDistribuirStock) {
            this.elementos.btnDistribuirStock.addEventListener('click', () => this.distribuirStock());
        }
        if (this.elementos.inputSync) {
            this.elementos.inputSync.addEventListener('change', (e) => this.procesarSync(e));
        }

        // Ventas - Lector Código de Barras
        if (this.elementos.inputCodigoBarras) {
            this.elementos.inputCodigoBarras.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.buscarPorCodigoBarras();
                }
            });
        }

        // Rotación FIFO/FEFO
        if (this.elementos.selectRotacion) {
            this.elementos.selectRotacion.value = this.rotacionMethod;
            this.elementos.selectRotacion.addEventListener('change', (e) => {
                this.rotacionMethod = e.target.value;
                localStorage.setItem('rotacionMethod', this.rotacionMethod);
                this.actualizarSelectProductos(); // Refresca visualmente cantidades si varian por modo
                this.mostrarInfo(`Prioridad de salida cambiada a: <strong>${this.rotacionMethod}</strong>`);
            });
        }

        // Globales
        this.elementos.btnVerVentas.addEventListener('click', () => this.verVentasTotales());
        this.elementos.btnVentasHeader.addEventListener('click', () => this.verVentasTotales());
        this.elementos.btnImprimirTicket.addEventListener('click', () => this.imprimirUltimoTicket());

        // Soporte
        if (this.elementos.btnSoporte) {
            this.elementos.btnSoporte.addEventListener('click', () => {
                const modal = document.getElementById('modalSupport');
                if (modal) modal.classList.add('active');
            });
        }

        // Soporte: formulario que envía a Formspree y botones de copia/WhatsApp
        const formSupport = document.getElementById('formSupport');
        if (formSupport) {
            formSupport.addEventListener('submit', () => {
                // dejar que el formulario se envíe normalmente (target=_blank)
                setTimeout(() => {
                    const modal = document.getElementById('modalSupport');
                    if (modal) modal.classList.remove('active');
                    this.mostrarInfo('Gracias. Se abrió una nueva pestaña para enviar tu mensaje.');
                }, 300);
            });
        }

        // Copiar link de soporte (Formspree) y cerrar modal
        const copyBtn = document.getElementById('supportCopyLink');
        if (copyBtn) copyBtn.addEventListener('click', () => {
            const link = 'https://formspree.io/f/mvgzqkpv';
            navigator.clipboard.writeText(link).then(() => alert('Link de soporte copiado al portapapeles'));
        });
        const closeSupport = document.getElementById('supportClose');
        if (closeSupport) closeSupport.addEventListener('click', () => {
            const modal = document.getElementById('modalSupport');
            if (modal) modal.classList.remove('active');
        });

        // Tabs
        this.elementos.tabButtons.forEach((btn) => {
            btn.addEventListener('click', () => {
                const tabId = btn.getAttribute('data-tab');
                this.abrirTab(tabId);
            });
        });

        // Modales
        this.elementos.btnConfirmarNo.addEventListener('click', () => this.cerrarModal('confirmacion'));
        this.elementos.btnCerrarInfo.addEventListener('click', () => this.cerrarModal('info'));
        this.elementos.btnCerrarError.addEventListener('click', () => this.cerrarModal('error'));

        [this.elementos.modalConfirmacion, this.elementos.modalInfo, this.elementos.modalError].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) modal.classList.remove('active');
                });
            }
        });
    }

    actualizarUI() {
        this.renderizarInventario();
        this.actualizarSelectProductos();
        this.actualizarTablaCarrito();
    }

    abrirTab(tabId) {
        this.elementos.tabButtons.forEach(btn => btn.classList.remove('active'));
        this.elementos.tabContents.forEach(content => content.classList.remove('active'));

        const btn = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
        if (btn) btn.classList.add('active');

        const tab = document.getElementById(tabId);
        if (tab) tab.classList.add('active');
    }

    // ============================================
    // GESTIÓN DE INVENTARIO (MULTI-LOTE)
    // ============================================

    agregarProducto() {
        const data = {
            nombre: this.elementos.prodNombre.value.trim(),
            codigoBarras: this.elementos.prodCodigoBarras.value.trim(),
            droga: this.elementos.prodDroga.value.trim(),
            dosis: this.elementos.prodDosis.value.trim(),
            presentacion: this.elementos.prodPresentacion.value.trim(),
            marca: this.elementos.prodMarca.value.trim(),
            laboratorio: this.elementos.prodLaboratorio.value.trim(),
            temp: this.elementos.prodTemp.value,
            lote: this.elementos.prodLote.value.trim(),
            vto: this.elementos.prodVencimiento.value,
            precio: parseFloat(this.elementos.prodPrecio.value.trim().replace(',', '.')),
            cantidad: parseInt(this.elementos.prodStock.value.trim())
        };

        if (!data.nombre) return this.mostrarError('El nombre del producto es obligatorio');
        if (isNaN(data.precio) || data.precio <= 0) return this.mostrarError('Precio inválido');
        if (isNaN(data.cantidad) || data.cantidad < 0) return this.mostrarError('Cantidad inválida');

        // Validar Lote y Vencimiento si hay stock
        if (data.cantidad > 0) {
            if (!data.lote) return this.mostrarError('Debe ingresar el código de Lote');
            if (!data.vto) return this.mostrarError('Debe ingresar la fecha de vencimiento');
        }

        if (this.editId) {
            // MODO EDICIÓN
            const producto = this.productos.find(p => p.id === this.editId);
            if (producto) {
                // Actualizar datos generales del producto
                producto.nombre = data.nombre;
                producto.codigoBarras = data.codigoBarras;
                producto.droga = data.droga;
                producto.dosis = data.dosis;
                producto.presentacion = data.presentacion;
                producto.marca = data.marca;
                producto.laboratorio = data.laboratorio;
                producto.temp = data.temp;
                producto.precio = data.precio;

                // Si agregaron stock durante la edición, lo sumamos como nuevo lote
                if (data.cantidad > 0) {
                    if (!producto.lotes) producto.lotes = [];
                    producto.lotes.push({
                        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
                        lote: data.lote,
                        vto: data.vto,
                        stock: data.cantidad
                    });
                    this.mostrarInfo('Producto actualizado y stock agregado.');
                } else {
                    this.mostrarInfo('Datos del producto actualizados.');
                }
            }

            // Reset Estado Edición
            this.editId = null;
            this.elementos.btnAgregarProducto.textContent = '➕ Agregar Producto';
            this.elementos.btnAgregarProducto.classList.remove('btn-warning');
            this.elementos.btnAgregarProducto.classList.add('btn-success');

            this.guardarDatos();
            this.limpiarFormularioProducto();
            this.actualizarUI();

        } else {
            // MODO CREACIÓN - Buscar producto existente
            const existente = this.productos.find(p => p.nombre.toLowerCase() === data.nombre.toLowerCase());

            if (existente) {
                this.mostrarConfirmacion(
                    `El producto "${existente.nombre}" ya existe.<br>
                ¿Desea agregar este nuevo Lote/Stock al producto existente?`,
                    () => {
                        this.agregarLoteAProducto(existente, data);
                    });
            } else {
                this.crearNuevoProducto(data);
            }
        }
    }

    agregarLoteAProducto(producto, data) {
        // Actualizar datos generales si se desea (opcional, aqui solo actualizamos precio)
        producto.precio = data.precio;
        producto.droga = data.droga || producto.droga;
        // Agregar lote
        producto.lotes.push({
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            lote: data.lote,
            vto: data.vto,
            stock: data.cantidad
        });

        this.guardarDatos();
        this.limpiarFormularioProducto();
        this.actualizarUI();
        this.mostrarInfo('Stock/Lote agregado al producto existente.');
    }

    crearNuevoProducto(data) {
        const nuevo = {
            id: Date.now(),
            nombre: data.nombre,
            codigoBarras: data.codigoBarras,
            droga: data.droga,
            dosis: data.dosis,
            presentacion: data.presentacion,
            marca: data.marca,
            laboratorio: data.laboratorio,
            temp: data.temp,
            precio: data.precio,
            lotes: [
                {
                    id: Date.now().toString(36),
                    lote: data.lote || 'S/L',
                    vto: data.vto || '2099-12-31',
                    stock: data.cantidad,
                    fechaIngreso: new Date().toISOString()
                }
            ]
        };

        this.productos.push(nuevo);
        this.guardarDatos();
        this.limpiarFormularioProducto();
        this.actualizarUI();
        this.mostrarInfo('Producto nuevo creado correctamente.');
    }

    limpiarFormularioProducto() {
        this.elementos.prodNombre.value = '';
        this.elementos.prodCodigoBarras.value = '';
        this.elementos.prodDroga.value = '';
        this.elementos.prodDosis.value = '';
        this.elementos.prodPresentacion.value = '';
        this.elementos.prodMarca.value = '';
        this.elementos.prodLaboratorio.value = '';
        this.elementos.prodLote.value = '';
        this.elementos.prodVencimiento.value = '';
        this.elementos.prodPrecio.value = '';
        this.elementos.prodStock.value = '';
    }

    iniciarEdicion(id) {
        const prod = this.productos.find(p => p.id === id);
        if (!prod) return;

        this.editId = id;
        this.elementos.prodNombre.value = prod.nombre;
        this.elementos.prodCodigoBarras.value = prod.codigoBarras || '';
        this.elementos.prodDroga.value = prod.droga || '';
        this.elementos.prodDosis.value = prod.dosis || '';
        this.elementos.prodPresentacion.value = prod.presentacion || '';
        this.elementos.prodMarca.value = prod.marca || '';
        this.elementos.prodLaboratorio.value = prod.laboratorio || '';
        this.elementos.prodTemp.value = prod.temp || 'Ambiente';
        this.elementos.prodPrecio.value = prod.precio;
        this.elementos.prodStock.value = ''; // Stock reset para agregar nuevos lotes

        // Cambiar botón e indicador visual
        this.elementos.btnAgregarProducto.textContent = '💾 Guardar Cambios';
        this.elementos.btnAgregarProducto.classList.remove('btn-success');
        this.elementos.btnAgregarProducto.classList.add('btn-warning');

        this.elementos.prodNombre.focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    eliminarProducto(id) {
        this.mostrarConfirmacion('¿Eliminar producto y todo su historial de lotes?', () => {
            if (this.editId === id) {
                this.editId = null;
                this.elementos.btnAgregarProducto.textContent = '➕ Agregar Producto';
                this.elementos.btnAgregarProducto.classList.replace('btn-warning', 'btn-success');
                this.limpiarFormularioProducto();
            }
            this.productos = this.productos.filter(p => p.id !== id);
            this.guardarDatos();
            this.actualizarUI();
        });
    }

    renderizarInventario() {
        this.elementos.listaProductos.innerHTML = '';
        this.productos.forEach(prod => {
            const stockTotal = prod.lotes.reduce((acc, l) => acc + l.stock, 0);

            // Determinar si hay alerta de vencimiento
            const tieneVencimientoCercano = this.checkVencimientoCercano(prod);
            const alertaClass = tieneVencimientoCercano ? 'alert-warning' : '';

            const tr = document.createElement('tr');
            if (alertaClass) tr.classList.add(alertaClass);

            tr.innerHTML = `
                <td>
                    <strong>${prod.nombre}</strong><br>
                    <small>${prod.droga || ''} ${prod.dosis || ''}</small>
                    ${prod.codigoBarras ? '<br><small style="color:#666">🧬 ' + prod.codigoBarras + '</small>' : ''}
                </td>
                <td>$${prod.precio.toFixed(2)}</td>
                <td>${stockTotal}</td>
                <td>
                    <button class="btn btn-warning btn-small btn-editar-prod" style="margin-right:5px;">✏️</button>
                    <button class="btn btn-danger btn-small btn-eliminar-prod" data-id="${prod.id}">🗑️</button>
                </td>
            `;
            tr.querySelector('.btn-editar-prod').addEventListener('click', () => this.iniciarEdicion(prod.id));
            tr.querySelector('.btn-eliminar-prod').addEventListener('click', () => this.eliminarProducto(prod.id));
            this.elementos.listaProductos.appendChild(tr);
        });
    }

    checkVencimientoCercano(prod) {
        const hoy = new Date();
        const limite = new Date();
        limite.setDate(hoy.getDate() + 30); // 30 días aviso

        return prod.lotes.some(l => {
            if (l.stock <= 0) return false;
            const vto = new Date(l.vto);
            return vto <= limite;
        });
    }

    // ============================================
    // LOGICA FEFO (First Expired First Out)
    // ============================================

    actualizarSelectProductos() {
        const select = this.elementos.selectProductoVenta;
        const valorActual = select.value;
        select.innerHTML = '<option value="">Seleccione un producto...</option>';

        this.productos.forEach(prod => {
            const stockTotal = prod.lotes.reduce((acc, l) => acc + l.stock, 0);
            if (stockTotal > 0) {
                const option = document.createElement('option');
                option.value = prod.id;
                option.textContent = `${prod.nombre} - $${prod.precio.toFixed(2)} (Total: ${stockTotal})`;
                select.appendChild(option);
            }
        });

        if (valorActual) select.value = valorActual;
    }

    agregarAlCarrito() {
        const idProd = parseInt(this.elementos.selectProductoVenta.value);
        const cantidadSolicitada = parseInt(this.elementos.cantidadVenta.value);

        if (!idProd) return this.mostrarError('Seleccione un producto');
        if (isNaN(cantidadSolicitada) || cantidadSolicitada < 1) return this.mostrarError('Cantidad inválida');

        const producto = this.productos.find(p => p.id === idProd);
        if (!producto) return this.mostrarError('Producto no encontrado');

        const stockTotal = producto.lotes.reduce((acc, l) => acc + l.stock, 0);
        if (stockTotal < cantidadSolicitada) {
            return this.mostrarError(`Stock insuficiente. Disponible total: ${stockTotal}`);
        }

        // LÓGICA DE ROTACIÓN: Ordenar lotes por prioridad (FIFO/FEFO)
        const lotesOrdenados = [...producto.lotes].sort((a, b) => {
            if (this.rotacionMethod === 'FEFO') {
                // FEFO: Vencimiento más cercano primero. Lotes sin fecha al final.
                if (a.vto && b.vto) return new Date(a.vto) - new Date(b.vto);
                if (a.vto && !b.vto) return -1;
                if (!a.vto && b.vto) return 1;
                return 0;
            } else {
                // FIFO: Más antiguo (por ID o fecha de ingreso) primero.
                return (a.id < b.id) ? -1 : 1;
            }
        });

        let cantidadPendiente = cantidadSolicitada;
        const lotesParaVenta = [];

        for (const lote of lotesOrdenados) {
            if (cantidadPendiente <= 0) break;
            if (lote.stock <= 0) continue;

            const cantidadATomar = Math.min(lote.stock, cantidadPendiente);

            lotesParaVenta.push({
                loteId: lote.id,
                numeroLote: lote.lote,
                vto: lote.vto,
                cantidad: cantidadATomar
            });

            cantidadPendiente -= cantidadATomar;
        }

        // Agregar al carrito (consolidado visualmente pero con detalle interno)
        this.carrito.push({
            producto: producto,
            precioUnitario: producto.precio,
            subtotal: cantidadSolicitada * producto.precio,
            cantidadTotal: cantidadSolicitada,
            detalleLotes: lotesParaVenta // Guardamos qué lotes se usarán
        });

        this.elementos.cantidadVenta.value = 1;
        this.elementos.selectProductoVenta.value = "";
        this.actualizarTablaCarrito();
    }

    actualizarTablaCarrito() {
        this.elementos.cuerpoTablaCarrito.innerHTML = '';
        let total = 0;

        if (this.carrito.length === 0) {
            this.elementos.tablaCarrito.style.display = 'none';
            this.elementos.carritoVacio.style.display = 'block';
            this.elementos.totalCarrito.textContent = '$0.00';
            return;
        }

        this.elementos.tablaCarrito.style.display = 'table';
        this.elementos.carritoVacio.style.display = 'none';

        this.carrito.forEach((item, index) => {
            total += item.subtotal;

            // Crear detalle de lotes string
            const detalleLotesStr = item.detalleLotes.map(d =>
                `<br><small class='text-muted'>Lote: ${d.numeroLote} (Vto: ${d.vto}) x ${d.cantidad}</small>`
            ).join('');

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    ${item.producto.nombre}
                    ${detalleLotesStr}
                </td>
                <td>${item.cantidadTotal}</td>
                <td>$${item.precioUnitario.toFixed(2)}</td>
                <td>$${item.subtotal.toFixed(2)}</td>
                <td>
                    <button class="btn btn-danger btn-small btn-eliminar-item" data-index="${index}">✕</button>
                </td>
            `;
            tr.querySelector('.btn-eliminar-item').addEventListener('click', () => this.eliminarDelCarrito(index));
            this.elementos.cuerpoTablaCarrito.appendChild(tr);
        });

        this.elementos.totalCarrito.textContent = `$${total.toFixed(2)}`;
    }

    eliminarDelCarrito(index) {
        this.carrito.splice(index, 1);
        this.actualizarTablaCarrito();
    }

    cancelarCompra() {
        if (this.carrito.length === 0) return;
        this.mostrarConfirmacion('¿Cancelar venta y vaciar carrito?', () => {
            this.carrito = [];
            this.actualizarTablaCarrito();
        });
    }

    finalizarCompra() {
        if (this.carrito.length === 0) return this.mostrarError('El carrito está vacío');

        const fechaVenta = this.elementos.fechaVenta.value || new Date().toISOString().split('T')[0];
        const cliente = this.elementos.clienteNombre.value.trim() || 'Consumidor Final';
        const documento = this.elementos.inputDocumento.value.trim() || '';

        this.mostrarConfirmacion(`¿Confirmar venta con fecha ${fechaVenta}?`, () => {
            try {
                const totalVenta = this.carrito.reduce((sum, item) => sum + item.subtotal, 0);

                // ACTUALIZAR STOCK REAL (Deducción por lote)
                this.carrito.forEach(cartItem => {
                    const productoReal = this.productos.find(p => p.id === cartItem.producto.id);
                    if (productoReal) {
                        cartItem.detalleLotes.forEach(loteUso => {
                            const loteReal = productoReal.lotes.find(l => l.id === loteUso.loteId);
                            if (loteReal) {
                                loteReal.stock -= loteUso.cantidad;
                                if (loteReal.stock < 0) loteReal.stock = 0; // Seguridad
                            }
                        });
                    }
                });

                // Registrar Venta en Historial
                const nuevaVenta = {
                    id: Date.now(),
                    fecha: fechaVenta,
                    cliente: cliente,
                    documento: documento,
                    total: totalVenta,
                    items: this.carrito.map(i => ({
                        nombre: i.producto.nombre,
                        cantidad: i.cantidadTotal,
                        precio: i.precioUnitario,
                        detalle: i.detalleLotes
                    }))
                };

                this.ventas.push(nuevaVenta);
                this.ventasTotales += totalVenta;

                // Guardar última para ticket
                localStorage.setItem('ultimaVenta', JSON.stringify(nuevaVenta));

                this.guardarDatos();

                // Intentar Imprimir
                try {
                    this.imprimirTicket(nuevaVenta, totalVenta);
                } catch (e) { console.error(e); }

                // Limpiar
                this.carrito = [];
                this.elementos.clienteNombre.value = '';
                this.elementos.inputDocumento.value = '';
                this.elementos.inputCodigoBarras.value = '';
                this.actualizarUI();
                this.mostrarInfo('Venta registrada correctamente');

            } catch (error) {
                console.error(error);
                this.mostrarError('Error al procesar la venta');
            }
        });
    }

    // ============================================
    // REPORTES
    // ============================================

    limpiarTablaReportes() {
        this.elementos.tablaReportes.style.display = 'table';
        this.elementos.headerReportes.innerHTML = '';
        this.elementos.bodyReportes.innerHTML = '';
        this.elementos.footerReportes.innerHTML = '';
    }

    generarReporteStock() {
        this.limpiarTablaReportes();

        // Cabecera
        this.elementos.headerReportes.innerHTML = `
            <tr>
                <th>Producto</th>
                <th>Laboratorio</th>
                <th>Lote</th>
                <th>Vencimiento</th>
                <th>Stock</th>
                <th>P. Unit</th>
                <th>Total ($)</th>
            </tr>
        `;

        let valorizacionTotal = 0;

        // Cuerpo: Flatten lotes
        this.productos.forEach(p => {
            p.lotes.forEach(l => {
                if (l.stock > 0) {
                    const subtotal = l.stock * p.precio;
                    valorizacionTotal += subtotal;

                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${p.nombre}</td>
                        <td>${p.laboratorio || '-'}</td>
                        <td>${l.lote}</td>
                        <td style="${new Date(l.vto) < new Date() ? 'color:red;font-weight:bold;' : ''}">${l.vto}</td>
                        <td>${l.stock}</td>
                        <td>$${p.precio.toFixed(2)}</td>
                        <td>$${subtotal.toFixed(2)}</td>
                     `;
                    this.elementos.bodyReportes.appendChild(tr);
                }
            });
        });

        // Pie
        this.elementos.footerReportes.innerHTML = `
            <tr class="total-row">
                <td colspan="6" style="text-align:right">VALORIZACIÓN TOTAL:</td>
                <td>$${valorizacionTotal.toFixed(2)}</td>
            </tr>
        `;
    }

    generarReporteDispensas() {
        this.limpiarTablaReportes();

        this.elementos.headerReportes.innerHTML = `
            <tr>
                <th>Fecha</th>
                <th>Paciente</th>
                <th>Producto</th>
                <th>Lote</th>
                <th>Vencimiento</th>
                <th>Cant.</th>
            </tr>
        `;

        this.ventas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)); // Más reciente primero

        this.ventas.forEach(v => {
            v.items.forEach(item => {
                item.detalle.forEach(det => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${v.fecha}</td>
                        <td>${v.cliente}</td>
                        <td>${item.nombre}</td>
                        <td>${det.numeroLote}</td>
                        <td>${det.vto}</td>
                        <td>${det.cantidad}</td>
                    `;
                    this.elementos.bodyReportes.appendChild(tr);
                });
            });
        });
    }

    generarAlertasVencimiento() {
        this.limpiarTablaReportes();

        this.elementos.headerReportes.innerHTML = `
            <tr>
                <th>Producto</th>
                <th>Lote</th>
                <th>Vencimiento</th>
                <th>Días Restantes</th>
                <th>Estado</th>
            </tr>
        `;

        const hoy = new Date();
        let alertas = 0;

        this.productos.forEach(p => {
            p.lotes.forEach(l => {
                if (l.stock > 0) {
                    const vto = new Date(l.vto);
                    const diffTime = vto - hoy;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    let estado = '';
                    let clase = '';

                    if (diffDays < 0) {
                        estado = 'VENCIDO';
                        clase = 'alert-urgent';
                    } else if (diffDays <= 30) {
                        estado = 'Por Vencer';
                        clase = 'alert-warning';
                    }

                    if (estado) {
                        alertas++;
                        const tr = document.createElement('tr');
                        tr.className = clase;
                        tr.innerHTML = `
                            <td>${p.nombre}</td>
                            <td>${l.lote}</td>
                            <td>${l.vto}</td>
                            <td>${diffDays}</td>
                            <td>${estado}</td>
                        `;
                        this.elementos.bodyReportes.appendChild(tr);
                    }
                }
            });
        });

        if (alertas === 0) {
            this.elementos.bodyReportes.innerHTML = '<tr><td colspan="5" style="text-align:center">✅ No hay productos vencidos ni próximos a vencer (30 días).</td></tr>';
        }
    }

    verificarAlertasVencimiento() {
        // Simple check on load to warn user
        const hoy = new Date();
        const tieneRiesgos = this.productos.some(p =>
            p.lotes.some(l => {
                if (l.stock <= 0) return false;
                const vto = new Date(l.vto);
                const diffDays = (vto - hoy) / (1000 * 60 * 60 * 24);
                return diffDays <= 30;
            })
        );

        if (tieneRiesgos) {
            this.mostrarInfo('⚠️ <strong>Atención:</strong> Hay productos vencidos o próximos a vencer.<br>Ver pestaña Reportes.');
        }
    }

    // ============================================
    // IMPRESIÓN Y EXCEL (Adapters)
    // ============================================

    imprimirUltimoTicket() {
        // Adaptación para usar el nuevo historial o localStorage
        const ultima = localStorage.getItem('ultimaVenta');
        if (ultima) {
            const v = JSON.parse(ultima);
            this.imprimirTicket(v, v.total);
        }
    }

    imprimirTicket(venta, total) {
        // Simplificado para no reescribir todo el HTML string gigante aquí, 
        // pero idealmente iterar sobre venta.items y mostrar detalle
        const ventanaImpresion = window.open('', '_blank');
        const fecha = venta.fecha;

        let itemsHtml = '';
        venta.items.forEach(item => {
            itemsHtml += `
                <div class="item">
                    <span>${item.cantidad} x ${item.nombre}</span>
                </div>
                <!-- Opcional: mostrar lote en ticket -->
                <div style="font-size:10px; color:#555; margin-left:10px;">
                    ${item.detalle.map(d => `Lote: ${d.numeroLote}`).join(', ')}
                </div>
                <div class="item" style="justify-content: flex-end;">
                    <span>$${(item.cantidad * item.precio).toFixed(2)}</span>
                </div>
            `;
        });

        const html = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Courier New', monospace; max-width: 300px; margin: 0; padding: 10px; }
                    .header { text-align:center; margin-bottom: 10px; }
                    .separador { border-top: 1px dashed #000; margin: 5px 0; }
                    .item { display: flex; justify-content: space-between; font-size: 12px; margin: 3px 0; }
                    .total { font-weight: bold; text-align: right; margin-top: 10px; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h3>⚕️ Pharmammed ⚕️</h3>
                    <p>Fecha Dispensa: ${fecha}</p>
                    <p>Paciente: ${venta.cliente}</p>
                </div>
                <div class="separador"></div>
                ${itemsHtml}
                <div class="separador"></div>
                <div class="total">TOTAL: $${total.toFixed(2)}</div>
                <script>window.print(); setTimeout(()=>window.close(), 500);</script>
            </body>
            </html>
        `;
        ventanaImpresion.document.write(html);
        ventanaImpresion.document.close();
    }

    // EXCEL EXPORT (Simplificado para Valorización)
    exportarExcel() {
        const rows = [];
        this.productos.forEach(p => {
            p.lotes.forEach(l => {
                rows.push({
                    Producto: p.nombre,
                    Droga: p.droga,
                    Laboratorio: p.laboratorio,
                    Lote: l.lote,
                    Vencimiento: l.vto,
                    Stock: l.stock,
                    Precio: p.precio,
                    Total: l.stock * p.precio
                });
            });
        });

        if (rows.length === 0) return this.mostrarError('Nada que exportar');
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Inventario");
        XLSX.writeFile(wb, "Farmacia_Stock_Valorizado.xlsx");
    }

    // EXCEL IMPORT (Solo simple UPDATE de Precios o STOCK a un Lote Default si no existe)
    procesarExcel(event) {
        // Implementación básica para no romper compatibilidad total
        // Idealmente requeriría formato estricto de columnas Lote/Vto
        this.mostrarInfo('La importación masiva solo actualiza precios/stock de productos existentes genéricos. Use carga manual para nuevos lotes específicos.');
    }

    aumentoMasivo() {
        const porcentajeStr = prompt("Ingrese porcentaje aumento:");
        if (!porcentajeStr) return;
        const pct = parseFloat(porcentajeStr.replace(',', '.'));
        if (isNaN(pct)) return;

        this.productos.forEach(p => {
            p.precio = parseFloat((p.precio * (1 + pct / 100)).toFixed(2));
        });
        this.guardarDatos();
        this.actualizarUI();
        this.mostrarInfo('Precios actualizados');
    }

    reduccionMasiva() {
        const porcentajeStr = prompt("Ingrese porcentaje reducción:");
        if (!porcentajeStr) return;
        const pct = parseFloat(porcentajeStr.replace(',', '.'));
        if (isNaN(pct)) return;

        this.productos.forEach(p => {
            p.precio = parseFloat((p.precio * (1 - pct / 100)).toFixed(2));
        });
        this.guardarDatos();
        this.actualizarUI();
        this.mostrarInfo('Precios actualizados');
    }

    // MODALES (Helpers)
    mostrarConfirmacion(msg, cb) {
        document.getElementById('textoConfirmacion').innerHTML = msg;
        this.elementos.modalConfirmacion.classList.add('active');
        const btn = this.elementos.btnConfirmarSi;
        const nuevoBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(nuevoBtn, btn);
        this.elementos.btnConfirmarSi = nuevoBtn;
        this.elementos.btnConfirmarSi.addEventListener('click', () => {
            this.cerrarModal('confirmacion');
            cb();
        });
    }

    mostrarInfo(msg) {
        document.getElementById('textoInfo').innerHTML = msg;
        this.elementos.modalInfo.classList.add('active');
    }

    mostrarError(msg) {
        document.getElementById('textoError').textContent = msg;
        this.elementos.modalError.classList.add('active');
    }

    cerrarModal(id) {
        const m = document.getElementById(id === 'confirmacion' ? 'modalConfirmacion' : id === 'info' ? 'modalInfo' : 'modalError');
        if (m) m.classList.remove('active');
    }

    verVentasTotales() {
        this.mostrarInfo(`Total Ventas Acumulado: $${this.ventasTotales.toFixed(2)}`);
    }

    // ============================================
    // SINCRONIZACIÓN MULTICAJA
    // ============================================

    exportarCierreCaja() {
        if (typeof XLSX === 'undefined') return this.mostrarError('Librería Excel no cargada');
        const wb = XLSX.utils.book_new();

        // 1. Sheet Inventario
        const rowsInv = [];
        this.productos.forEach(p => {
            if (p.lotes && p.lotes.length > 0) {
                p.lotes.forEach(l => {
                    rowsInv.push({
                        ID: p.id,
                        Nombre: p.nombre,
                        Droga: p.droga || '',
                        Dosis: p.dosis || '',
                        CodigoBarras: p.codigoBarras || '',
                        Precio: p.precio,
                        LoteID: l.id,
                        LoteNum: l.lote || '',
                        Vto: l.vto || '',
                        Stock: l.stock,
                        FechaIngreso: l.fechaIngreso || ''
                    });
                });
            } else {
                rowsInv.push({
                    ID: p.id,
                    Nombre: p.nombre,
                    Droga: p.droga || '',
                    Dosis: p.dosis || '',
                    CodigoBarras: p.codigoBarras || '',
                    Precio: p.precio,
                    LoteID: '',
                    LoteNum: '',
                    Vto: '',
                    Stock: 0,
                    FechaIngreso: ''
                });
            }
        });
        const wsInv = XLSX.utils.json_to_sheet(rowsInv);
        XLSX.utils.book_append_sheet(wb, wsInv, "Inventario");

        // 2. Sheet Ventas
        const rowsVentas = [];
        this.ventas.forEach(v => {
            if (v.items) {
                v.items.forEach(it => {
                    if (it.detalle) {
                        it.detalle.forEach(det => {
                            rowsVentas.push({
                                VentaID: v.id,
                                Fecha: v.fecha,
                                Cliente: v.cliente || '',
                                Documento: v.documento || '',
                                ProductoNombre: it.nombre,
                                LoteID: det.loteId,
                                NumeroLote: det.numeroLote || '',
                                Cantidad: det.cantidad,
                                Subtotal: (it.precio || 0) * (det.cantidad || 0)
                            });
                        });
                    }
                });
            }
        });
        const wsVentas = XLSX.utils.json_to_sheet(rowsVentas);
        XLSX.utils.book_append_sheet(wb, wsVentas, "Ventas");

        const fecha = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `Cierre_Caja_${fecha}.xlsx`);
        this.mostrarInfo('Cierre de caja exportado correctamente');
    }

    procesarSync(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                if (this._syncMode === 'CONSOLIDAR_VENTAS') {
                    this.consolidarVentasDesdeExcel(workbook);
                } else if (this._syncMode === 'ACTUALIZAR_MASTER') {
                    this.actualizarInventarioDesdeMaster(workbook);
                }
                event.target.value = '';
            } catch (error) {
                console.error(error);
                this.mostrarError('Error al procesar el archivo de sincronización');
            }
        };
        reader.readAsArrayBuffer(file);
    }

    consolidarVentasDesdeExcel(workbook) {
        if (!workbook.Sheets["Ventas"]) return this.mostrarError('Falta hoja Ventas en el archivo');
        const rawVentas = XLSX.utils.sheet_to_json(workbook.Sheets["Ventas"]);

        let contador = 0;
        const ventasExternas = {};

        rawVentas.forEach(row => {
            if (!ventasExternas[row.VentaID]) {
                ventasExternas[row.VentaID] = {
                    id: row.VentaID,
                    fecha: row.Fecha,
                    cliente: row.Cliente,
                    documento: row.Documento,
                    rows: []
                };
            }
            ventasExternas[row.VentaID].rows.push(row);
        });

        Object.values(ventasExternas).forEach(vExt => {
            const existe = this.ventas.find(h => h.id == vExt.id);
            if (!existe) {
                contador++;
                // Agregar al historial local
                this.ventas.push({
                    id: vExt.id,
                    fecha: vExt.fecha,
                    cliente: vExt.cliente + ' (Importado)',
                    documento: vExt.documento,
                    total: vExt.rows.reduce((s, r) => s + (r.Subtotal || 0), 0),
                    items: [] // Simplificado
                });

                // Descontar Stock Real local
                vExt.rows.forEach(r => {
                    for (const p of this.productos) {
                        if (p.lotes) {
                            const l = p.lotes.find(lot => lot.id == r.LoteID);
                            if (l) {
                                l.stock -= r.Cantidad;
                                if (l.stock < 0) l.stock = 0;
                                break;
                            }
                        }
                    }
                });
            }
        });

        this.guardarDatos();
        this.actualizarUI();
        this.mostrarInfo(`Consolidación completa: ${contador} ventas externas procesadas.`);
    }

    actualizarInventarioDesdeMaster(workbook) {
        if (!workbook.Sheets["Inventario"]) return this.mostrarError('Falta hoja Inventario en el archivo');
        const rawInv = XLSX.utils.sheet_to_json(workbook.Sheets["Inventario"]);

        this.mostrarConfirmacion('¿Desea SOBREESCRIBIR su inventario local con los datos del Master?', () => {
            const prodsMap = {};

            rawInv.forEach(row => {
                const pid = row.ID;
                if (!prodsMap[pid]) {
                    prodsMap[pid] = {
                        id: pid,
                        nombre: row.Nombre,
                        droga: row.Droga || '',
                        dosis: row.Dosis || '',
                        codigoBarras: row.CodigoBarras || '',
                        precio: row.Precio,
                        lotes: []
                    };
                }
                if (row.LoteID) {
                    prodsMap[pid].lotes.push({
                        id: row.LoteID,
                        lote: row.LoteNum || 'S/L',
                        vto: row.Vto || '',
                        stock: row.Stock || 0,
                        fechaIngreso: row.FechaIngreso || new Date().toISOString()
                    });
                }
            });

            this.productos = Object.values(prodsMap);
            this.guardarDatos();
            this.actualizarUI();
            this.mostrarInfo('Inventario actualizado exitosamente desde el archivo maestro.');
        });
    }

    distribuirStock() {
        const numCajasStr = prompt("¿En cuántas cajas desea dividir el stock? (Ej: 2, 3...)\nEsto generará archivos separados para cada caja.");
        if (!numCajasStr) return;

        const numCajas = parseInt(numCajasStr);
        if (isNaN(numCajas) || numCajas < 2 || numCajas > 10) {
            return this.mostrarError("Ingrese un número válido entre 2 y 10.");
        }

        this.mostrarConfirmacion(`¿Desea generar ${numCajas} archivos de Excel dividiendo el stock equitativamente?\nDeberá cargar el 'Archivo 1' en esta PC y los demás en las otras.`, () => {
            this.procesarDistribucion(numCajas);
        });
    }

    procesarDistribucion(numCajas) {
        // Crear N arrays para N cajas
        const inventarios = Array.from({ length: numCajas }, () => []);

        this.productos.forEach(p => {
            // Prepare product base info
            const baseProd = {
                ID: p.id,
                Nombre: p.nombre,
                Droga: p.droga || '',
                Dosis: p.dosis || '',
                CodigoBarras: p.codigoBarras || '',
                Precio: p.precio
            };

            if (p.lotes && p.lotes.length > 0) {
                p.lotes.forEach(l => {
                    const totalCantidad = l.stock; // STOCK property used here
                    const baseCantidad = Math.floor(totalCantidad / numCajas);
                    let resto = totalCantidad % numCajas;

                    // Distribuir en N inventarios
                    for (let i = 0; i < numCajas; i++) {
                        let cantidadAsignada = baseCantidad;
                        if (resto > 0) {
                            cantidadAsignada++;
                            resto--;
                        }

                        // Agregar siempre para mantener la estructura, incluso si es 0
                        inventarios[i].push({
                            ...baseProd,
                            LoteID: l.id,
                            LoteNum: l.lote || '', // LOTE property used here
                            Vto: l.vto || '',      // VTO property used here
                            Stock: cantidadAsignada,
                            FechaIngreso: l.fechaIngreso || ''
                        });
                    }
                });
            } else {
                // Producto sin lotes, agregar con stock 0
                for (let i = 0; i < numCajas; i++) {
                    inventarios[i].push({
                        ...baseProd,
                        LoteID: '', LoteNum: '', Vto: '', Stock: 0, FechaIngreso: ''
                    });
                }
            }
        });

        // Generar y descargar Archivos secuencialmente
        inventarios.forEach((datos, index) => {
            setTimeout(() => {
                try {
                    const wb = XLSX.utils.book_new();
                    const ws = XLSX.utils.json_to_sheet(datos);
                    XLSX.utils.book_append_sheet(wb, ws, "Inventario");

                    const fecha = new Date().toISOString().split('T')[0];
                    // Nombres claros: Caja 1 (Master), Caja 2...
                    const suffix = `Caja_${index + 1}`;
                    const nombreArchivo = `Inventario_Distribuido_${suffix}_${fecha}.xlsx`;

                    XLSX.writeFile(wb, nombreArchivo);
                } catch (err) {
                    console.error("Error generating file " + index, err);
                }
            }, index * 1500); // Delay 1.5s
        });

        this.mostrarInfo(`Se están descargando ${numCajas} archivos...<br>Recuerde importar el Archivo (Caja 1) en esta PC.`);
    }

    buscarPorCodigoBarras() {
        const codigo = this.elementos.inputCodigoBarras.value.trim();
        if (!codigo) return;

        const producto = this.productos.find(p => p.codigoBarras == codigo);

        if (producto) {
            // Seleccionar en el select
            this.elementos.selectProductoVenta.value = producto.id;
            // Limpiar y enfocar
            this.elementos.inputCodigoBarras.value = '';
            this.elementos.cantidadVenta.focus();
            this.elementos.cantidadVenta.select();
        } else {
            this.mostrarError(`No se encontró producto con el código: ${codigo}`);
            this.elementos.inputCodigoBarras.value = '';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new FarmaciaApp();
});
