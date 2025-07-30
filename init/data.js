const slugify = require("slugify");
const rawListings = [
  {
    title: "Fresh Organic Bananas",
    description: "Premium organic bananas, perfectly ripe and sweet. Rich in potassium and natural energy.",
    image: {
      filename: "productimage",
      url: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    },
    price: 2.99,
    location: "Produce Section",
    country: "Ecuador",
    category: "Fruits",
    inStock: true,
    weight: "1 lb"
  },
  {
    title: "Whole Wheat Bread",
    description: "Freshly baked whole wheat bread, soft and nutritious. Perfect for sandwiches and toast.",
    image: {
      filename: "productimage",
      url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    },
    price: 3.49,
    location: "Bakery Section",
    country: "Local",
    category: "Bakery",
    inStock: true,
    weight: "24 oz"
  },
  {
    title: "Fresh Milk - 2% Fat",
    description: "Farm fresh 2% milk, rich in calcium and protein. Perfect for cereals, coffee, and cooking.",
    image: {
      filename: "productimage",
      url: "https://images.unsplash.com/photo-1563636619-e9143da7973b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    },
    price: 4.29,
    location: "Dairy Section",
    country: "Local",
    category: "Dairy",
    inStock: true,
    weight: "1 gallon"
  },
  {
    title: "Premium Ground Coffee",
    description: "Arabica ground coffee with rich aroma and bold flavor. Perfect for your morning brew.",
    image: {
      filename: "productimage",
      url: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    },
    price: 12.99,
    location: "Beverages Section",
    country: "Colombia",
    category: "Beverages",
    inStock: true,
    weight: "12 oz"
  },
  {
    title: "Organic Baby Spinach",
    description: "Fresh organic baby spinach leaves, perfect for salads and smoothies. Packed with iron and vitamins.",
    image: {
      filename: "productimage",
      url: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    },
    price: 4.99,
    location: "Produce Section",
    country: "Local",
    category: "Vegetables",
    inStock: true,
    weight: "5 oz"
  },
  {
    title: "Premium Ribeye Steak",
    description: "USDA Choice ribeye steak, well-marbled and tender. Perfect for grilling or pan-searing.",
    image: {
      filename: "productimage",
      url: "https://images.unsplash.com/photo-1588347818115-c9a9587ecfdc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    },
    price: 24.99,
    location: "Meat Section",
    country: "Local",
    category: "Meat",
    inStock: true,
    weight: "1 lb"
  },
  {
    title: "Greek Yogurt - Vanilla",
    description: "Creamy Greek yogurt with natural vanilla flavor. High in protein and probiotics.",
    image: {
      filename: "productimage",
      url: "https://images.unsplash.com/photo-1571212515416-68c3b4c81987?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    },
    price: 5.99,
    location: "Dairy Section",
    country: "Local",
    category: "Dairy",
    inStock: true,
    weight: "32 oz"
  },
  {
    title: "Fresh Atlantic Salmon",
    description: "Wild-caught Atlantic salmon fillet, rich in omega-3 fatty acids. Perfect for healthy meals.",
    image: {
      filename: "productimage",
      url: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    },
    price: 18.99,
    location: "Seafood Section",
    country: "Atlantic Ocean",
    category: "Seafood",
    inStock: true,
    weight: "1 lb"
  },
  {
    title: "Organic Avocados",
    description: "Ripe organic avocados, creamy and delicious. Great for guacamole, toast, or salads.",
    image: {
      filename: "productimage",
      url: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    },
    price: 6.99,
    location: "Produce Section",
    country: "Mexico",
    category: "Fruits",
    inStock: true,
    weight: "4 count"
  },
  {
    title: "Artisan Sourdough Bread",
    description: "Handcrafted sourdough bread with a crispy crust and tangy flavor. Made with traditional methods.",
    image: {
      filename: "productimage",
      url: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    },
    price: 5.99,
    location: "Bakery Section",
    country: "Local",
    category: "Bakery",
    inStock: true,
    weight: "1 loaf"
  },
  {
    title: "Free-Range Eggs",
    description: "Farm-fresh free-range eggs from pasture-raised hens. Rich, golden yolks and superior taste.",
    image: {
      filename: "productimage",
      url: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    },
    price: 7.99,
    location: "Dairy Section",
    country: "Local",
    category: "Dairy",
    inStock: true,
    weight: "12 count"
  },
  {
    title: "Organic Quinoa",
    description: "Premium organic quinoa, a complete protein and superfood. Perfect for healthy meals and salads.",
    image: {
      filename: "productimage",
      url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    },
    price: 8.99,
    location: "Grains & Pasta",
    country: "Peru",
    category: "Grains",
    inStock: true,
    weight: "2 lbs"
  },
  {
    title: "Extra Virgin Olive Oil",
    description: "Cold-pressed extra virgin olive oil with rich flavor. Perfect for cooking and dressings.",
    image: {
      filename: "productimage",
      url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    },
    price: 15.99,
    location: "Condiments & Oils",
    country: "Italy",
    category: "Pantry",
    inStock: true,
    weight: "500ml"
  },
  {
    title: "Organic Blueberries",
    description: "Sweet and juicy organic blueberries, packed with antioxidants. Perfect for snacking or baking.",
    image: {
      filename: "productimage",
      url: "https://images.unsplash.com/photo-1498557850523-fd3d118b962e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    },
    price: 7.99,
    location: "Produce Section",
    country: "Local",
    category: "Fruits",
    inStock: true,
    weight: "1 pint"
  },
  {
    title: "Aged Cheddar Cheese",
    description: "Sharp aged cheddar cheese with rich, complex flavor. Perfect for sandwiches and cheese boards.",
    image: {
      filename: "productimage",
      url: "https://images.unsplash.com/photo-1552767059-ce182ead6c1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    },
    price: 9.99,
    location: "Dairy Section",
    country: "Local",
    category: "Dairy",
    inStock: true,
    weight: "8 oz"
  },
  {
    title: "Fresh Broccoli Crowns",
    description: "Fresh broccoli crowns, crisp and nutritious. Rich in vitamins and perfect for steaming or roasting.",
    image: {
      filename: "productimage",
      url: "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    },
    price: 3.99,
    location: "Produce Section",
    country: "Local",
    category: "Vegetables",
    inStock: true,
    weight: "1 lb"
  },
  {
    title: "Grass-Fed Ground Beef",
    description: "Premium grass-fed ground beef, lean and flavorful. Perfect for burgers, tacos, and pasta dishes.",
    image: {
      filename: "productimage",
      url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    },
    price: 16.99,
    location: "Meat Section",
    country: "Local",
    category: "Meat",
    inStock: true,
    weight: "1 lb"
  },
  {
    title: "Artisan Pizza Dough",
    description: "Fresh artisan pizza dough, ready to roll and top. Made with high-quality flour and natural ingredients.",
    image: {
      filename: "productimage",
      url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    },
    price: 4.99,
    location: "Bakery Section",
    country: "Local",
    category: "Bakery",
    inStock: true,
    weight: "1 lb"
  },
  {
    title: "Organic Honey",
    description: "Pure organic wildflower honey, unprocessed and natural. Perfect for tea, toast, or baking.",
    image: {
      filename: "productimage",
      url: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    },
    price: 11.99,
    location: "Condiments & Sweeteners",
    country: "Local",
    category: "Pantry",
    inStock: true,
    weight: "12 oz"
  },
  {
    title: "Fresh Mozzarella",
    description: "Creamy fresh mozzarella cheese, perfect for caprese salads, pizza, and Italian dishes.",
    image: {
      filename: "productimage",
      url: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    },
    price: 6.99,
    location: "Dairy Section",
    country: "Local",
    category: "Dairy",
    inStock: true,
    weight: "8 oz"
  },
];
const sampleListings = rawListings.map(item => ({
  ...item,
  slug: slugify(item.title, { lower: true, strict: true })
}));

module.exports = { data: sampleListings };