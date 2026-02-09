// Business Categories Configuration - Organized into 4 roles with 2 categories each
export const BUSINESS_CATEGORIES = [
    // Role 1: Retail & Consumer Goods
    {
        id: 'fashion-lifestyle',
        name: 'Fashion & Lifestyle',
        icon: 'shopping-bag',
        color: '#E91E63',
        subCategories: [
            'Clothing',
            'Footwear',
            'Accessories',
            'Beauty Products',
            'Jewelry',
            'Bags & Luggage'
        ]
    },
    {
        id: 'fmcg-food',
        name: 'FMCG & Food',
        icon: 'shopping-cart',
        color: '#4CAF50',
        subCategories: [
            'Packaged Foods',
            'Beverages',
            'Personal Care',
            'Household Items',
            'Fresh Produce',
            'Dairy Products'
        ]
    },

    // Role 2: Electronics & Technology
    {
        id: 'electronics-mobiles',
        name: 'Electronics & Mobiles',
        icon: 'mobile',
        color: '#2196F3',
        subCategories: [
            'Smartphones',
            'Laptops',
            'Accessories',
            'Gaming',
            'Cameras',
            'Smart Home'
        ]
    },
    {
        id: 'home-kitchen',
        name: 'Home & Kitchen',
        icon: 'home',
        color: '#795548',
        subCategories: [
            'Furniture',
            'Kitchen Appliances',
            'Home Decor',
            'Bedding',
            'Cleaning Supplies',
            'Storage Solutions'
        ]
    },

    // Role 3: Healthcare & Wellness
    {
        id: 'pharma-medical',
        name: 'Pharma & Medical',
        icon: 'heartbeat',
        color: '#FF5722',
        subCategories: [
            'Medicines',
            'Medical Equipment',
            'Healthcare Devices',
            'Pharmaceutical Supplies',
            'Medical Consumables',
            'Wellness Products'
        ]
    },
    {
        id: 'books-stationery',
        name: 'Books & Stationery',
        icon: 'book',
        color: '#3F51B5',
        subCategories: [
            'Educational Books',
            'Office Supplies',
            'Writing Instruments',
            'Art & Craft',
            'Printing Materials',
            'Office Equipment'
        ]
    },

    // Role 4: Industrial & Automotive
    {
        id: 'automotive',
        name: 'Automotive',
        icon: 'car',
        color: '#607D8B',
        subCategories: [
            'Car Accessories',
            'Motorcycle Parts',
            'Auto Tools',
            'Vehicle Maintenance',
            'Car Care Products',
            'Automotive Electronics'
        ]
    },
    {
        id: 'industrial',
        name: 'Industrial & Manufacturing',
        icon: 'industry',
        color: '#9C27B0',
        subCategories: [
            'Raw Materials',
            'Industrial Equipment',
            'Safety Gear',
            'Tools & Machinery',
            'Packaging Materials',
            'Manufacturing Supplies'
        ]
    }
];

// Helper function to get category by ID
export const getCategoryById = (categoryId) => {
    return BUSINESS_CATEGORIES.find(category => category.id === categoryId);
};

// Helper function to get category by name
export const getCategoryByName = (categoryName) => {
    return BUSINESS_CATEGORIES.find(category =>
        category.name.toLowerCase() === categoryName.toLowerCase()
    );
};