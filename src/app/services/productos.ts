import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, doc, deleteDoc, updateDoc } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface Producto {
  id?: string;
  nombre: string;
  subtitulo: string;
  categoria: 'Hombre' | 'Mujer';
  estilo?: 'Oversize' | 'Run' | 'Casual' | 'Elegante';
  precio: number;
  precioOriginal?: number;
  descuentoBadge?: string;
  stockMensaje?: string;
  tallas: string[];
  imagenUrl: string;
}

export interface ItemCarrito {
  producto: Producto;
  tallaSeleccionada: string;
  cantidad: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductosService {
  private firestore = inject(Firestore);
  private productosRef = collection(this.firestore, 'productos');

  // Prenda base para asegurar la visualización inmediata
  private prendasDefault: Producto[] = [
    {
      id: 'prenda-dynamo-1',
      nombre: 'Camisa Dynamo Oversize Streetwear',
      subtitulo: 'Acid Black Heavy Cotton',
      categoria: 'Hombre',
      estilo: 'Oversize',
      precio: 48.00,
      precioOriginal: 60.00,
      descuentoBadge: '-20%',
      tallas: ['S', 'M', 'L', 'XL'],
      imagenUrl: 'https://dynamobrand.co/cdn/shop/files/0477.jpg?v=1784044249&width=800'
    }
  ];

  listar(): Observable<Producto[]> {
    return (collectionData(this.productosRef, { idField: 'id' }) as Observable<Producto[]>).pipe(
      map(items => (items && items.length > 0 ? items : this.prendasDefault)),
      catchError(() => of(this.prendasDefault))
    );
  }

  async agregar(producto: Producto) {
    try {
      return await addDoc(this.productosRef, producto);
    } catch {
      this.prendasDefault.push({ ...producto, id: 'local-' + Date.now() });
      return null;
    }
  }

  async editar(id: string, producto: Partial<Producto>) {
    if (id.startsWith('prenda-') || id.startsWith('local-')) {
      const idx = this.prendasDefault.findIndex(p => p.id === id);
      if (idx !== -1) this.prendasDefault[idx] = { ...this.prendasDefault[idx], ...producto };
      return;
    }
    const docRef = doc(this.firestore, `productos/${id}`);
    return updateDoc(docRef, producto);
  }

  async eliminar(id: string) {
    if (id.startsWith('prenda-') || id.startsWith('local-')) {
      this.prendasDefault = this.prendasDefault.filter(p => p.id !== id);
      return;
    }
    const docRef = doc(this.firestore, `productos/${id}`);
    return deleteDoc(docRef);
  }
}
