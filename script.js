// Фільтр за категорією
const cpuProducts = products.filter(p => p.category === "CPU");

// Сортування за ціною
const sortedByPrice = [...products].sort((a,b) => a.price - b.price);

// Пошук
const searchResults = products.filter(p => 
    p.name.toLowerCase().includes("rtx") || 
    p.description.toLowerCase().includes("rtx")
);