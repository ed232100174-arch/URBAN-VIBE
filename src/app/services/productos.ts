import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, doc, deleteDoc, updateDoc } from '@angular/fire/firestore';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

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
  private STORAGE_KEY = 'urbanvibe_productos_locales';

  // Stream reactivo persistente
  private productosSubject$ = new BehaviorSubject<Producto[]>([]);

  private prendasDefault: Producto[] = [
    {
      id: 'prenda-hoodie-3',
      nombre: 'Hoodie Obsidian Echo Oversize',
      subtitulo: 'Heavyweight Black Graphic Pullover',
      categoria: 'Hombre',
      estilo: 'Oversize',
      precio: 65.00,
      precioOriginal: 85.00,
      descuentoBadge: '-23%',
      tallas: ['S', 'M', 'L', 'XL'],
      imagenUrl: 'https://m.media-amazon.com/images/I/71g3QuLm+iL._AC_UY1000_.jpg'
    },
    {
      id: 'prenda-blank-2',
      nombre: 'Camiseta Blank Canvas Acid Oversize',
      subtitulo: 'Off-White Graphic Back Print',
      categoria: 'Hombre',
      estilo: 'Oversize',
      precio: 42.00,
      precioOriginal: 55.00,
      descuentoBadge: '-24%',
      tallas: ['S', 'M', 'L', 'XL'],
      imagenUrl: 'https://m.media-amazon.com/images/I/61ljJAiSzDL._AC_UY1000_.jpg'
    },
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

  constructor() {
    this.cargarProductosLocales();
  }

  // 1. Cargar desde memoria del navegador al arrancar
  private cargarProductosLocales() {
    const guardados = localStorage.getItem(this.STORAGE_KEY);
    if (guardados) {
      try {
        const parsed = JSON.parse(guardados);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.prendasDefault = parsed;
        }
      } catch (e) {
        console.error('Error al leer de localStorage:', e);
      }
    } else {
      this.guardarEnLocalStorage();
    }
    this.productosSubject$.next([...this.prendasDefault]);
  }

  // 2. Guardar en memoria del navegador
  private guardarEnLocalStorage() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.prendasDefault));
    this.productosSubject$.next([...this.prendasDefault]);
  }

  // 3. Listar priorizando los datos persistentes locales y combinando con Firebase
  listar(): Observable<Producto[]> {
    return (collectionData(this.productosRef, { idField: 'id' }) as Observable<Producto[]>).pipe(
      map(itemsFirebase => {
        if (itemsFirebase && itemsFirebase.length > 0) {
          const combinados = [...this.prendasDefault];
          for (const itemFb of itemsFirebase) {
            if (!combinados.some(p => p.nombre === itemFb.nombre)) {
              combinados.push(itemFb);
            }
          }
          return combinados;
        }
        return this.prendasDefault;
      }),
      catchError(() => this.productosSubject$.asObservable())
    );
  }

  // 4. Agregar prenda y asegurar su persistencia inmediata
  async agregar(producto: Producto) {
    const nuevaPrenda = { ...producto, id: 'local-' + Date.now() };

    // Guardar en el arreglo y persistir en localStorage
    this.prendasDefault = [nuevaPrenda, ...this.prendasDefault];
    this.guardarEnLocalStorage();

    // Guardar en Firebase (sin bloquear el almacenamiento local)
    try {
      await addDoc(this.productosRef, producto);
    } catch (e) {
      console.warn('Firebase no conectado, prenda guardada localmente de forma permanente:', e);
    }
    return nuevaPrenda;
  }

  async editar(id: string, producto: Partial<Producto>) {
    const idx = this.prendasDefault.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.prendasDefault[idx] = { ...this.prendasDefault[idx], ...producto };
      this.guardarEnLocalStorage();
    }

    if (!id.startsWith('prenda-') && !id.startsWith('local-')) {
      try {
        const docRef = doc(this.firestore, `productos/${id}`);
        await updateDoc(docRef, producto);
      } catch (e) {
        console.warn('Error editando en Firebase:', e);
      }
    }
  }

  async eliminar(id: string) {
    this.prendasDefault = this.prendasDefault.filter(p => p.id !== id);
    this.guardarEnLocalStorage();

    if (!id.startsWith('prenda-') && !id.startsWith('local-')) {
      try {
        const docRef = doc(this.firestore, `productos/${id}`);
        await deleteDoc(docRef);
      } catch (e) {
        console.warn('Error eliminando en Firebase:', e);
      }
    }
  }
}
