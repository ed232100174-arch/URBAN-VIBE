import { Injectable, inject } from '@angular/core';
import { Firestore, addDoc, collection, collectionData, doc, deleteDoc, updateDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface Producto {
  id?: string;
  nombre: string;
  categoria: 'Hombre' | 'Mujer' | 'Unisex';
  estilo: 'Casual' | 'Deportiva' | 'Oversize';
  precio: number;
  tallas: string[];
  imagenUrl: string;
  descripcion: string;
}

export interface ItemCarrito {
  producto: Producto;
  tallaSeleccionada: string;
  cantidad: number;
}

@Injectable({ providedIn: 'root' })
export class ProductosService {
  private firestore = inject(Firestore);
  private productosRef = collection(this.firestore, 'productos');

  listar(): Observable<Producto[]> {
    return collectionData(this.productosRef, { idField: 'id' }) as Observable<Producto[]>;
  }

  agregar(producto: Producto) {
    return addDoc(this.productosRef, producto);
  }

  eliminar(id: string) {
    const docRef = doc(this.firestore, `productos/${id}`);
    return deleteDoc(docRef);
  }

  actualizar(id: string, datos: Partial<Producto>) {
    const docRef = doc(this.firestore, `productos/${id}`);
    return updateDoc(docRef, datos);
  }
}
