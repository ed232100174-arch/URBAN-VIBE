import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc
} from '@angular/fire/firestore';

export interface Producto {
  id?: string;
  nombre: string;
  subtitulo: string;
  categoria: 'Hombre' | 'Mujer';
  estilo?: 'Oversize' | 'Run';
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

export interface Pedido {
  id?: string;
  correoUsuario: string;
  nombreDestinatario: string;
  direccion: string;
  telefono: string;
  items: ItemCarrito[];
  total: number;
  fecha: string;
  estado: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductosService {
  private firestore = inject(Firestore);

  async obtenerTodos(): Promise<Producto[]> {
    const colRef = collection(this.firestore, 'productos');
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(d => ({
      id: d.id,
      ...(d.data() as Producto)
    }));
  }

  async agregar(producto: Producto): Promise<any> {
    const colRef = collection(this.firestore, 'productos');
    const limpio = JSON.parse(JSON.stringify(producto));
    return addDoc(colRef, limpio);
  }

  async editar(id: string, producto: Partial<Producto>): Promise<void> {
    const docRef = doc(this.firestore, `productos/${id}`);
    const limpio = JSON.parse(JSON.stringify(producto));
    return updateDoc(docRef, limpio);
  }

  async eliminar(id: string): Promise<void> {
    const docRef = doc(this.firestore, `productos/${id}`);
    return deleteDoc(docRef);
  }

  async guardarPedido(pedido: Pedido): Promise<any> {
    const colRef = collection(this.firestore, 'pedidos');
    const limpio = JSON.parse(JSON.stringify(pedido));
    return addDoc(colRef, limpio);
  }

  async obtenerPedidosPorUsuario(correo: string): Promise<Pedido[]> {
    const colRef = collection(this.firestore, 'pedidos');
    const snapshot = await getDocs(colRef);
    return snapshot.docs
      .map(d => ({
        id: d.id,
        ...(d.data() as Pedido)
      }))
      .filter(p => p.correoUsuario?.toLowerCase() === correo.toLowerCase());
  }
}
