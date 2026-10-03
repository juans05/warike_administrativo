export type ImportCategoryType = 'food' | 'drink' | 'dessert' | 'other';

export interface DraftDish {
  name: string;
  description?: string;
  price: number | null;
}

export interface DraftCategory {
  name: string;
  categoryType: ImportCategoryType;
  dishes: DraftDish[];
}

export interface MenuTemplate {
  id: string;
  label: string;
  icon: string;
  categories: DraftCategory[];
}

const d = (name: string, price: number, description?: string): DraftDish => ({ name, price, description });

// Los precios son de ejemplo: el restaurante los revisa y edita en la vista previa antes de guardar.
export const MENU_TEMPLATES: MenuTemplate[] = [
  {
    id: 'cevicheria',
    label: 'Cevichería',
    icon: '🐟',
    categories: [
      { name: 'Ceviches', categoryType: 'food', dishes: [d('Ceviche clásico', 38, 'Pescado del día, limón, ají limo y cebolla'), d('Ceviche mixto', 44, 'Pescado y mariscos'), d('Leche de tigre', 18)] },
      { name: 'Calientes', categoryType: 'food', dishes: [d('Chicharrón de pescado', 32), d('Arroz con mariscos', 40), d('Jalea mixta', 55)] },
      { name: 'Bebidas', categoryType: 'drink', dishes: [d('Chicha morada', 8), d('Limonada', 8), d('Cerveza', 10), d('Gaseosa', 6)] },
    ],
  },
  {
    id: 'polleria',
    label: 'Pollería y parrillas',
    icon: '🍗',
    categories: [
      { name: 'Pollo a la brasa', categoryType: 'food', dishes: [d('1/4 de pollo con papas', 22), d('1/2 pollo con papas', 38), d('Pollo entero con papas', 70)] },
      { name: 'Parrillas', categoryType: 'food', dishes: [d('Anticuchos', 24), d('Mollejitas', 20), d('Choripán', 12)] },
      { name: 'Acompañamientos', categoryType: 'food', dishes: [d('Ensalada', 10), d('Papas fritas', 10), d('Arroz chaufa', 12)] },
      { name: 'Bebidas', categoryType: 'drink', dishes: [d('Chicha morada', 8), d('Gaseosa 1/2 L', 6), d('Cerveza', 10)] },
    ],
  },
  {
    id: 'criolla',
    label: 'Comida criolla / menú',
    icon: '🍲',
    categories: [
      { name: 'Entradas', categoryType: 'food', dishes: [d('Papa a la huancaína', 14), d('Causa limeña', 16), d('Tequeños', 14)] },
      { name: 'Platos de fondo', categoryType: 'food', dishes: [d('Lomo saltado', 28), d('Ají de gallina', 24), d('Seco de res con frejoles', 26), d('Arroz con pollo', 22)] },
      { name: 'Postres', categoryType: 'dessert', dishes: [d('Suspiro limeño', 10), d('Mazamorra morada', 8), d('Picarones', 12)] },
      { name: 'Bebidas', categoryType: 'drink', dishes: [d('Chicha morada', 8), d('Maracuyá', 8), d('Gaseosa', 6)] },
    ],
  },
  {
    id: 'chifa',
    label: 'Chifa',
    icon: '🥡',
    categories: [
      { name: 'Entradas', categoryType: 'food', dishes: [d('Wantán frito', 14), d('Sopa wantán', 20), d('Tequeños de pollo', 14)] },
      { name: 'Arroces y tallarines', categoryType: 'food', dishes: [d('Arroz chaufa de pollo', 22), d('Tallarín saltado', 24), d('Aeropuerto', 26)] },
      { name: 'Platos', categoryType: 'food', dishes: [d('Pollo tipakay', 28), d('Lomo saltado al estilo chifa', 30), d('Chancho agridulce', 28)] },
      { name: 'Bebidas', categoryType: 'drink', dishes: [d('Té chino', 5), d('Chicha morada', 8), d('Gaseosa', 6)] },
    ],
  },
  {
    id: 'cafeteria',
    label: 'Cafetería',
    icon: '☕',
    categories: [
      { name: 'Cafés', categoryType: 'drink', dishes: [d('Espresso', 6), d('Cappuccino', 10), d('Latte', 11), d('Frappé', 14)] },
      { name: 'Desayunos', categoryType: 'food', dishes: [d('Pan con chicharrón', 14), d('Tostadas con palta', 12), d('Sándwich de pavo', 12)] },
      { name: 'Postres', categoryType: 'dessert', dishes: [d('Cheesecake', 14), d('Torta de chocolate', 12), d('Alfajor', 5)] },
      { name: 'Jugos y frozen', categoryType: 'drink', dishes: [d('Jugo de naranja', 9), d('Limonada frozen', 10)] },
    ],
  },
  {
    id: 'bar',
    label: 'Bar y piqueos',
    icon: '🍸',
    categories: [
      { name: 'Cócteles', categoryType: 'drink', dishes: [d('Pisco sour', 22), d('Chilcano', 20), d('Maracuyá sour', 24), d('Mojito', 22)] },
      { name: 'Cervezas', categoryType: 'drink', dishes: [d('Cerveza nacional', 10), d('Cerveza artesanal', 16)] },
      { name: 'Piqueos', categoryType: 'food', dishes: [d('Alitas BBQ', 26), d('Nachos', 24), d('Tequeños', 14)] },
    ],
  },
];
