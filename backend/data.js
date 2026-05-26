export const graphNodes = [
  { id: 0, label: 'Frost Hub', type: 'hub', x: 50, y: 48 },
  { id: 1, label: 'Aurora Kitchen', type: 'restaurant', x: 22, y: 28 },
  { id: 2, label: 'Glacier Grill', type: 'restaurant', x: 78, y: 30 },
  { id: 3, label: 'Polaris Pizza', type: 'restaurant', x: 18, y: 68 },
  { id: 4, label: 'Nimbus Noodles', type: 'restaurant', x: 82, y: 72 },
  { id: 5, label: 'North Junction', type: 'junction', x: 40, y: 35 },
  { id: 6, label: 'Ice Bridge', type: 'junction', x: 62, y: 38 },
  { id: 7, label: 'Harbor Curve', type: 'junction', x: 35, y: 58 },
  { id: 8, label: 'Skyline Loop', type: 'junction', x: 68, y: 62 },
  { id: 9, label: 'Home', type: 'customer', x: 48, y: 82 },
  { id: 10, label: 'Courier', type: 'courier', x: 52, y: 18 },
  { id: 11, label: 'Work', type: 'customer', x: 88, y: 50 },
  { id: 12, label: 'Gym', type: 'customer', x: 20, y: 90 },
  
  // NEW SCALED NODES
  { id: 13, label: 'Avalanche Diner', type: 'restaurant', x: 70, y: 12 }, 
  { id: 14, label: 'Boreal Bistro', type: 'restaurant', x: 30, y: 78 },   
  { id: 15, label: 'East Junction', type: 'junction', x: 88, y: 22 },
  { id: 16, label: 'West Bridge', type: 'junction', x: 10, y: 48 },
  { id: 17, label: 'Summit Pass', type: 'junction', x: 48, y: 10 },
  { id: 18, label: 'Sector 5 Colony', type: 'customer', x: 92, y: 85 },   
  { id: 19, label: 'Tundra Labs', type: 'customer', x: 5, y: 20 },        
  { id: 20, label: 'Outpost Delta', type: 'junction', x: 50, y: 92 },
  { id: 21, label: 'Nexus Sector', type: 'junction', x: 95, y: 55 }
];

export const graphEdges = [
  { from: 0, to: 5, distance: 4.2, traffic: 0.35 },
  { from: 0, to: 6, distance: 3.8, traffic: 0.28 },
  { from: 0, to: 7, distance: 4.5, traffic: 0.42 },
  { from: 0, to: 8, distance: 4.0, traffic: 0.31 },
  { from: 1, to: 5, distance: 3.1, traffic: 0.22 },
  { from: 2, to: 6, distance: 3.4, traffic: 0.4 },
  { from: 3, to: 7, distance: 3.6, traffic: 0.55 },
  { from: 4, to: 8, distance: 3.2, traffic: 0.38 },
  { from: 5, to: 6, distance: 5.2, traffic: 0.48 },
  { from: 5, to: 7, distance: 4.8, traffic: 0.52 },
  { from: 6, to: 8, distance: 4.9, traffic: 0.44 },
  { from: 7, to: 8, distance: 5.5, traffic: 0.6 },
  { from: 7, to: 9, distance: 6.0, traffic: 0.5 },
  { from: 8, to: 9, distance: 5.8, traffic: 0.47 },
  { from: 10, to: 5, distance: 5.5, traffic: 0.33 },
  { from: 10, to: 6, distance: 5.1, traffic: 0.29 },
  { from: 8, to: 11, distance: 3.5, traffic: 0.3 },
  { from: 6, to: 11, distance: 4.8, traffic: 0.2 },
  { from: 7, to: 12, distance: 4.2, traffic: 0.4 },
  { from: 3, to: 12, distance: 2.5, traffic: 0.2 },

  // NEW SCALED EDGES
  { from: 13, to: 15, distance: 2.8, traffic: 0.2 },
  { from: 13, to: 17, distance: 3.5, traffic: 0.15 },
  { from: 14, to: 7, distance: 3.0, traffic: 0.35 },
  { from: 14, to: 20, distance: 3.2, traffic: 0.25 },
  { from: 15, to: 2, distance: 3.0, traffic: 0.4 },
  { from: 15, to: 11, distance: 4.5, traffic: 0.25 },
  { from: 16, to: 1, distance: 3.8, traffic: 0.18 },
  { from: 16, to: 3, distance: 3.5, traffic: 0.3 },
  { from: 17, to: 10, distance: 2.5, traffic: 0.1 },
  { from: 17, to: 5, distance: 4.0, traffic: 0.2 },
  { from: 18, to: 21, distance: 3.6, traffic: 0.45 },
  { from: 11, to: 21, distance: 2.2, traffic: 0.3 },
  { from: 19, to: 1, distance: 4.5, traffic: 0.12 },
  { from: 19, to: 16, distance: 3.0, traffic: 0.2 },
  { from: 20, to: 9, distance: 2.0, traffic: 0.4 },
  { from: 20, to: 12, distance: 4.8, traffic: 0.3 },
  { from: 21, to: 4, distance: 3.4, traffic: 0.3 }
];

export const NODE_COUNT = 22;

export const restaurants = [
  {
    id: 'r1',
    nodeId: 1,
    name: 'Aurora Kitchen',
    cuisine: 'Nordic fusion',
    rating: 4.8,
    eta: '22–28 min',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
    menu: [
      { id: 'm1', name: 'Glacier Salmon', price: 18.5, desc: 'Citrus ice glaze', badge: 'Chef' },
      { id: 'm2', name: 'Frost Root Bowl', price: 14.0, desc: 'Charred roots, skyr' },
      { id: 'm3', name: 'Ember Beet Tart', price: 12.5, desc: 'Hazelnut dust' },
      { id: 'm10', name: 'Boreal Foraged Salad', price: 11.0, desc: 'Wild greens, birch dressing' },
    ],
  },
  {
    id: 'r2',
    nodeId: 2,
    name: 'Glacier Grill',
    cuisine: 'Open flame',
    rating: 4.6,
    eta: '24–32 min',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
    menu: [
      { id: 'm4', name: 'Char Ice Burger', price: 15.5, desc: 'Smoked cheddar' },
      { id: 'm5', name: 'Polar Ribs', price: 21.0, desc: 'Blueberry reduction' },
    ],
  },
  {
    id: 'r3',
    nodeId: 3,
    name: 'Polaris Pizza',
    cuisine: 'Wood oven',
    rating: 4.9,
    eta: '18–26 min',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
    menu: [
      { id: 'm6', name: 'White Truffle Pie', price: 19.0, desc: 'Mozzarella cloud' },
      { id: 'm7', name: 'Arctic Veg', price: 16.0, desc: 'Pesto frost' },
    ],
  },
  {
    id: 'r4',
    nodeId: 4,
    name: 'Nimbus Noodles',
    cuisine: 'Steam & broth',
    rating: 4.7,
    eta: '20–28 min',
    image: 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=800&q=80',
    menu: [
      { id: 'm8', name: 'Thunder Ramen', price: 17.5, desc: 'Soft egg, nori' },
      { id: 'm9', name: 'Mist Udon', price: 15.0, desc: 'Dashi foam' },
    ],
  },
  {
    id: 'r5',
    nodeId: 13,
    name: 'Avalanche Diner',
    cuisine: 'Arctic Steakhouse',
    rating: 4.7,
    eta: '15–22 min',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
    menu: [
      { id: 'm22', name: 'Glacier Smoked Brisket', price: 24.5, desc: 'Hickory ash rub, sweet berry BBQ' },
      { id: 'm23', name: 'Summit T-Bone', price: 29.0, desc: 'Dry-aged with pepper crust' },
      { id: 'm24', name: 'Iron-Skillet Beans', price: 8.5, desc: 'Baked with wild honey' }
    ]
  },
  {
    id: 'r6',
    nodeId: 14,
    name: 'Boreal Bistro',
    cuisine: 'Artisanal Cafe',
    rating: 4.5,
    eta: '10–18 min',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
    menu: [
      { id: 'm25', name: 'Frost Espresso Roast', price: 4.5, desc: 'Triple-shot hazelnut cream' },
      { id: 'm26', name: 'Arctic Wildberry Crepe', price: 9.0, desc: 'Cloudberry jam, maple glaze' },
      { id: 'm27', name: 'Snowball Cookie Rack', price: 6.5, desc: 'Powdered cinnamon butter balls' }
    ]
  }
];
