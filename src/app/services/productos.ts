import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  doc,
  updateDoc,
  deleteDoc
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface Producto {
  id?: string;
  nombre: string;
  subtitulo: string;
  categoria: 'Hombre' | 'Mujer';
  estilo?: 'Oversize' | 'Run' | 'Casual' | 'Elegante' | 'Regular Fit';
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

  // 1. Obtener prendas en tiempo real desde la base de datos de Firebase
  listar(): Observable<Producto[]> {
    return collectionData(this.productosRef, { idField: 'id' }) as Observable<Producto[]>;
  }

  // 2. Guardar prenda directamente en Firebase (se verá en todas las PCs)
  agregar(producto: Producto): Promise<any> {
    return addDoc(this.productosRef, producto);
  }

  // 3. Editar prenda en la base de datos central
  editar(id: string, producto: Partial<Producto>): Promise<void> {
    const docRef = doc(this.firestore, `productos/${id}`);
    return updateDoc(docRef, producto);
  }

  // 4. Eliminar prenda en la base de datos central
  eliminar(id: string): Promise<void> {
    const docRef = doc(this.firestore, `productos/${id}`);
    return deleteDoc(docRef);
  }
}
