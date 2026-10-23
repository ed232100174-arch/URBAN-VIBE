import { Component, inject, OnInit } from '@angular/core';
import { AsyncPipe, DecimalPipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductosService, Producto, ItemCarrito } from './services/productos';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

type Vista = 'login' | 'registro' | 'catalogo' | 'carrito' | 'checkout' | 'admin';

interface Usuario {
  nombre: string;
  correo: string;
  clave: string;
  telefono: string;
  direccion: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, AsyncPipe, DecimalPipe, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private productosService = inject(ProductosService);

  vistaActual: Vista = 'catalogo';
  carrito: ItemCarrito[] = [];
  filtroCategoria: string = 'TODOS';

  // Base de datos local de usuarios
  usuariosRegistrados: Usuario[] = [];

  // Formulario de Registro
  nuevoNombre: string = '';
  nuevoCorreo: string = '';
  nuevaClave: string = '';
  nuevoTelefono: string = '';
  nuevaDireccion: string = '';

  // Formulario de Login
  correoIngresado: string = '';
  claveIngresada: string = '';

  // Estado de Sesión Activa
  usuarioAutenticado: boolean = false;
  usuarioActivo: Usuario | null = null;
  esAdmin: boolean = false;

  // Datos para Checkout
  datosEnvio = {
    nombre: '',
    telefono: '',
    direccion: '',
    tarjeta: ''
  };

  // Modal de Detalle de Producto
  productoSeleccionado: Producto | null = null;
  tallaSeleccionadaModal: string = 'M';
  cantidadModal: number = 1;

  // Edición de Prenda (Admin)
  modoEdicion: boolean = false;
  productoEditandoId: string | null = null;

  // Feedback
  mensajeErrorAuth: string = '';
  mensajeExitoAuth: string = '';
  mensajeErrorAdmin: string = '';
  mensajeExitoAdmin: string = '';

  // Formulario Admin (Crear / Editar)
  nuevoProducto: Producto = {
    nombre: '',
    subtitulo: '',
    categoria: 'Hombre',
    estilo: 'Oversize',
    precio: 0,
    precioOriginal: 0,
    descuentoBadge: '',
    stockMensaje: '',
    tallas: ['S', 'M', 'L', 'XL'],
    imagenUrl: ''
  };

  ngOnInit() {
    // 1. Recuperar usuarios registrados previos
    const usuariosGuardados = localStorage.getItem('urbanvibe_usuarios');
    if (usuariosGuardados) {
      this.usuariosRegistrados = JSON.parse(usuariosGuardados);
    }

    // 2. Recuperar sesión activa al recargar pantalla (F5)
    const sesionGuardada = localStorage.getItem('urbanvibe_sesion');
    if (sesionGuardada) {
      const datosSesion = JSON.parse(sesionGuardada);
      this.usuarioAutenticado = true;
      this.usuarioActivo = datosSesion.usuario;
      this.esAdmin = datosSesion.esAdmin;
    }
  }

  cambiarVista(vista: Vista) {
    this.vistaActual = vista;
    this.mensajeErrorAuth = '';
    this.mensajeExitoAuth = '';
    this.mensajeErrorAdmin = '';
    this.mensajeExitoAdmin = '';

    if (vista === 'checkout' && this.usuarioActivo) {
      this.datosEnvio.nombre = this.usuarioActivo.nombre;
      this.datosEnvio.telefono = this.usuarioActivo.telefono;
      this.datosEnvio.direccion = this.usuarioActivo.direccion;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  filtrarPorCategoria(filtro: string) {
    this.filtroCategoria = filtro;
  }

  obtenerProductosFiltrados(): Observable<Producto[]> {
    return this.productosService.listar().pipe(
      map(productos => {
        if (this.filtroCategoria === 'TODOS') return productos;
        if (this.filtroCategoria === 'HOMBRE' || this.filtroCategoria === 'MUJER') {
          return productos.filter(p => p.categoria && p.categoria.toUpperCase() === this.filtroCategoria);
        }
        return productos.filter(p => p.estilo && p.estilo.toUpperCase() === this.filtroCategoria);
      })
    );
  }

  obtenerSugerencias(productoActual: Producto): Observable<Producto[]> {
    return this.productosService.listar().pipe(
      map(productos => productos.filter(p => p.id !== productoActual.id && p.categoria === productoActual.categoria))
    );
  }

  abrirModalProducto(p: Producto) {
    this.productoSeleccionado = p;
    this.tallaSeleccionadaModal = (p.tallas && p.tallas.length > 0) ? p.tallas[0] : 'M';
    this.cantidadModal = 1;
  }

  cerrarModalProducto() {
    this.productoSeleccionado = null;
  }

  agregarModalAlCarrito() {
    if (!this.productoSeleccionado) return;

    const itemExistente = this.carrito.find(
      item => item.producto.id === this.productoSeleccionado?.id && item.tallaSeleccionada === this.tallaSeleccionadaModal
    );

    if (itemExistente) {
      itemExistente.cantidad += this.cantidadModal;
    } else {
      this.carrito.push({
        producto: this.productoSeleccionado,
        tallaSeleccionada: this.tallaSeleccionadaModal,
        cantidad: this.cantidadModal
      });
    }

    this.cerrarModalProducto();
  }

  validarDominioCorreo(correo: string): boolean {
    const dominiosPermitidos = ['gmail.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'yahoo.com', 'urbanvibe.com'];
    const partes = correo.toLowerCase().split('@');
    if (partes.length !== 2) return false;
    return dominiosPermitidos.includes(partes[1]);
  }

  registrarUsuario() {
    this.mensajeErrorAuth = '';
    this.mensajeExitoAuth = '';

    if (!this.nuevoNombre || !this.nuevoCorreo || !this.nuevaClave || !this.nuevoTelefono || !this.nuevaDireccion) {
      this.mensajeErrorAuth = 'Por favor completa todos los campos del registro.';
      return;
    }

    if (!this.validarDominioCorreo(this.nuevoCorreo)) {
      this.mensajeErrorAuth = 'Ingresa un correo válido (Google, Hotmail, Outlook, iCloud o Yahoo).';
      return;
    }

    const existe = this.usuariosRegistrados.some(
      u => u.correo.toLowerCase() === this.nuevoCorreo.toLowerCase().trim()
    );

    if (existe) {
      this.mensajeErrorAuth = 'Este correo ya se encuentra registrado.';
      return;
    }

    const nuevoUsuario: Usuario = {
      nombre: this.nuevoNombre.trim(),
      correo: this.nuevoCorreo.toLowerCase().trim(),
      clave: this.nuevaClave,
      telefono: this.nuevoTelefono.trim(),
      direccion: this.nuevaDireccion.trim()
    };

    this.usuariosRegistrados.push(nuevoUsuario);
    localStorage.setItem('urbanvibe_usuarios', JSON.stringify(this.usuariosRegistrados));

    this.mensajeExitoAuth = '¡Cuenta creada con éxito! Inicia sesión para continuar.';
    this.limpiarFormularios();
    setTimeout(() => this.cambiarVista('login'), 1200);
  }

  procesarLogin() {
    this.mensajeErrorAuth = '';
    this.mensajeExitoAuth = '';

    if (!this.correoIngresado || !this.claveIngresada) {
      this.mensajeErrorAuth = 'Por favor ingresa tu correo y contraseña.';
      return;
    }

    const correo = this.correoIngresado.toLowerCase().trim();

    // Administrador
    if (correo === 'admin@urbanvibe.com' || correo === 'ed232100174-arch@urbanvibe.com') {
      if (this.claveIngresada === 'admin123' || this.claveIngresada === '123456') {
        this.usuarioAutenticado = true;
        this.esAdmin = true;
        this.usuarioActivo = {
          nombre: 'Administrador',
          correo: correo,
          clave: '',
          telefono: '0000-0000',
          direccion: 'Oficina Central Urban Vibe'
        };

        localStorage.setItem('urbanvibe_sesion', JSON.stringify({
          usuario: this.usuarioActivo,
          esAdmin: true
        }));

        this.cambiarVista('catalogo');
        return;
      } else {
        this.mensajeErrorAuth = 'La contraseña de administrador es incorrecta.';
        return;
      }
    }

    // Cliente
    const usuarioEncontrado = this.usuariosRegistrados.find(
      u => u.correo.toLowerCase() === correo
    );

    if (!usuarioEncontrado) {
      this.mensajeErrorAuth = 'Esta cuenta no existe. Por favor crea una cuenta primero.';
      return;
    }

    if (usuarioEncontrado.clave !== this.claveIngresada) {
      this.mensajeErrorAuth = 'La contraseña ingresada es incorrecta.';
      return;
    }

    this.usuarioAutenticado = true;
    this.esAdmin = false;
    this.usuarioActivo = usuarioEncontrado;

    localStorage.setItem('urbanvibe_sesion', JSON.stringify({
      usuario: this.usuarioActivo,
      esAdmin: false
    }));

    this.limpiarFormularios();
    this.cambiarVista('catalogo');
  }

  cerrarSesion() {
    this.usuarioAutenticado = false;
    this.esAdmin = false;
    this.usuarioActivo = null;

    localStorage.removeItem('urbanvibe_sesion');

    this.limpiarFormularios();
    this.cambiarVista('catalogo');
  }

  limpiarFormularios() {
    this.correoIngresado = '';
    this.claveIngresada = '';
    this.nuevoNombre = '';
    this.nuevoCorreo = '';
    this.nuevaClave = '';
    this.nuevoTelefono = '';
    this.nuevaDireccion = '';
  }

  // CARRITO & CHECKOUT
  agregarAlCarritoDirecto(producto: Producto, event: Event) {
    event.stopPropagation();
    const talla = (producto.tallas && producto.tallas.length > 0) ? producto.tallas[0] : 'M';
    const itemExistente = this.carrito.find(
      item => item.producto.id === producto.id && item.tallaSeleccionada === talla
    );

    if (itemExistente) {
      itemExistente.cantidad++;
    } else {
      this.carrito.push({ producto, tallaSeleccionada: talla, cantidad: 1 });
    }
  }

  cambiarCantidad(item: ItemCarrito, cambio: number) {
    item.cantidad += cambio;
    if (item.cantidad <= 0) {
      this.carrito = this.carrito.filter(i => i !== item);
    }
  }

  obtenerSubtotal(): number {
    return this.carrito.reduce((sum, item) => sum + (item.producto.precio * item.cantidad), 0);
  }

  obtenerTotal(): number {
    const envio = 5.00;
    return this.obtenerSubtotal() + (this.carrito.length > 0 ? envio : 0);
  }

  procederAlPago(): void {
    if (!this.usuarioAutenticado) {
      this.mensajeErrorAuth = 'Para finalizar la compra debes iniciar sesión.';
      this.cambiarVista('login');
    } else {
      this.cambiarVista('checkout');
    }
  }

  confirmarPago(): void {
    this.carrito = [];
    this.cambiarVista('catalogo');
  }

  // ADMIN
  prepararEdicion(producto: Producto, event: Event) {
    event.stopPropagation();
    this.modoEdicion = true;
    this.productoEditandoId = producto.id || null;
    this.nuevoProducto = { ...producto };
    this.cambiarVista('admin');
  }

  async guardarNuevoProducto(): Promise<void> {
    this.mensajeErrorAdmin = '';
    this.mensajeExitoAdmin = '';

    if (!this.nuevoProducto.nombre || !this.nuevoProducto.precio || this.nuevoProducto.precio <= 0) {
      this.mensajeErrorAdmin = 'Ingresa el nombre y un precio válido mayor a 0.';
      return;
    }

    if (!this.nuevoProducto.imagenUrl) {
      this.nuevoProducto.imagenUrl = 'https://dynamobrand.co/cdn/shop/files/0477.jpg?v=1784044249&width=800';
    }

    if (!this.nuevoProducto.tallas || this.nuevoProducto.tallas.length === 0) {
      this.nuevoProducto.tallas = ['S', 'M', 'L', 'XL'];
    }

    try {
      if (this.modoEdicion && this.productoEditandoId) {
        await this.productosService.editar(this.productoEditandoId, this.nuevoProducto);
        this.mensajeExitoAdmin = '¡Prenda actualizada correctamente!';
      } else {
        await this.productosService.agregar(this.nuevoProducto);
        this.mensajeExitoAdmin = '¡Prenda guardada con éxito en el catálogo!';
      }
      this.resetearFormularioAdmin();
    } catch (error) {
      console.error('Error guardando en Firebase:', error);
      this.mensajeErrorAdmin = 'Error de conexión con Firebase. Verifica tus permisos o conexión.';
    }
  }

  resetearFormularioAdmin() {
    this.nuevoProducto = {
      nombre: '',
      subtitulo: '',
      categoria: 'Hombre',
      estilo: 'Oversize',
      precio: 0,
      precioOriginal: 0,
      descuentoBadge: '',
      stockMensaje: '',
      tallas: ['S', 'M', 'L', 'XL'],
      imagenUrl: ''
    };
    this.modoEdicion = false;
    this.productoEditandoId = null;

    setTimeout(() => {
      this.mensajeExitoAdmin = '';
      this.cambiarVista('catalogo');
    }, 1200);
  }

  async eliminarPrenda(id?: string, event?: Event): Promise<void> {
    if (event) event.stopPropagation();
    if (id) {
      try {
        await this.productosService.eliminar(id);
      } catch (error) {
        console.error('Error al eliminar prenda:', error);
      }
    }
  }
}
