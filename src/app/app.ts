import { Component, inject } from '@angular/core';
import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductosService, Producto, ItemCarrito } from './services/productos';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AsyncPipe, CurrencyPipe, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private productosService = inject(ProductosService);
  productos$: Observable<Producto[]> = this.productosService.listar();

  carrito: ItemCarrito[] = [];
  mostrarCarrito: boolean = false;
  tallasSeleccionadas: { [key: string]: string } = {};

  agregarAlCarrito(producto: Producto) {
    const talla = this.tallasSeleccionadas[producto.id || ''] || producto.tallas[0];
    const itemExistente = this.carrito.find(
      item => item.producto.id === producto.id && item.tallaSeleccionada === talla
    );

    if (itemExistente) {
      itemExistente.cantidad++;
    } else {
      this.carrito.push({ producto, tallaSeleccionada: talla, cantidad: 1 });
    }
  }

  eliminarDelCarrito(index: number) {
    this.carrito.splice(index, 1);
  }

  obtenerTotal(): number {
    return this.carrito.reduce((total, item) => total + (item.producto.precio * item.cantidad), 0);
  }

  pagar() {
    if (this.carrito.length === 0) return;
    alert(`¡Gracias por tu compra en Urban Vibe! Total pagado: $${this.obtenerTotal()}`);
    this.carrito = [];
    this.mostrarCarrito = false;
  }

  eliminarPrenda(id?: string) {
    if (id && confirm('¿Deseas eliminar esta prenda del catálogo?')) {
      this.productosService.eliminar(id);
    }
  }

  cargarPrendasEjemplo() {
    const prendasEjemplo: Producto[] = [
      {
        nombre: 'Hoodie Heavy Oversize Black',
        categoria: 'Unisex',
        estilo: 'Oversize',
        precio: 35.00,
        tallas: ['S', 'M', 'L', 'XL'],
        imagenUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500',
        descripcion: 'Sudadera oversize 100% algodón gramaje pesado.'
      },
      {
        nombre: 'Camiseta Casual White Fit',
        categoria: 'Hombre',
        estilo: 'Casual',
        precio: 18.50,
        tallas: ['S', 'M', 'L'],
        imagenUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500',
        descripcion: 'Camiseta básica estilo minimalista.'
      },
      {
        nombre: 'Top Deportivo Seamless',
        categoria: 'Mujer',
        estilo: 'Deportiva',
        precio: 22.00,
        tallas: ['XS', 'S', 'M'],
        imagenUrl: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=500',
        descripcion: 'Top deportivo compresión media alta flexibilidad.'
      }
    ];

    prendasEjemplo.forEach(p => this.productosService.agregar(p));
  }
}
