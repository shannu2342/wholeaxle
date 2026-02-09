const mongoose = require('mongoose');
require('dotenv').config();

const Category = require('../models/Category');
const Product = require('../models/Product');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI;

const categories = [
    { name: 'Fashion & Lifestyle', icon: 'female', subcategories: ['Shirts', 'Pants', 'Dresses', 'Shoes'] },
    { name: 'Electronics & Mobiles', icon: 'mobile', subcategories: ['Phones', 'Accessories', 'Laptops', 'Audio'] },
    { name: 'FMCG & Food', icon: 'leaf', subcategories: ['Snacks', 'Beverages', 'Staples', 'Personal Care'] },
    { name: 'Pharma & Medical', icon: 'medkit', subcategories: ['Supplements', 'OTC', 'Medical Devices', 'Wellness'] },
    { name: 'Home & Kitchen', icon: 'home', subcategories: ['Kitchenware', 'Storage', 'Decor', 'Bedding'] },
    { name: 'Automotive', icon: 'car', subcategories: ['Parts', 'Accessories', 'Tools', 'Lubricants'] },
    { name: 'Industrial', icon: 'cogs', subcategories: ['Safety', 'Machinery', 'Electrical', 'Hardware'] },
    { name: 'Books & Stationery', icon: 'book', subcategories: ['Notebooks', 'Office', 'Art', 'Books'] },
];

const sampleVendors = [
    'Wholexale Fashion Hub',
    'Mega Electronics',
    'Daily FMCG',
    'MedCare Supply',
    'Home Essentials Co',
    'AutoMart Parts',
    'IndusPro Tools',
    'Stationery World',
];

const buildProducts = (categoryDocs) => {
    const products = [];
    categoryDocs.forEach((categoryDoc, index) => {
        const vendorName = sampleVendors[index] || 'Wholexale Vendor';
        categoryDoc.subcategories.forEach((sub, subIndex) => {
            products.push({
                name: `${sub} Pack ${subIndex + 1}`,
                description: `Popular ${sub.toLowerCase()} items for ${categoryDoc.name.toLowerCase()}.`,
                price: 199 + subIndex * 50,
                originalPrice: 299 + subIndex * 50,
                category: categoryDoc.name,
                subcategory: sub,
                images: ['https://via.placeholder.com/400'],
                stock: 100,
                moq: 5,
                sizes: ['S', 'M', 'L'],
                colors: ['Blue', 'Black', 'White'],
                vendor: {
                    name: vendorName,
                    rating: 4.5,
                },
                tags: [sub.toLowerCase(), 'wholesale'],
                complianceStatus: 'approved',
                rating: 4.2,
                reviewCount: 10,
            });
        });
    });
    return products;
};

const seed = async () => {
    if (!MONGODB_URI) {
        // eslint-disable-next-line no-console
        console.error('MONGODB_URI not set. Please configure it in backend/.env');
        process.exit(1);
    }

    await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    // Seed users (idempotent-ish by email)
    const seedUsers = [
        {
            email: 'buyer@wholexale.com',
            password: 'Password123',
            firstName: 'Buyer',
            lastName: 'Demo',
            phone: '9000000001',
            role: 'user',
            status: 'active',
            isActive: true,
            isVerified: true,
            emailVerified: true,
        },
        {
            email: 'seller@wholexale.com',
            password: 'Password123',
            firstName: 'Seller',
            lastName: 'Demo',
            phone: '9000000002',
            role: 'vendor',
            status: 'active',
            isActive: true,
            isVerified: true,
            emailVerified: true,
        },
        {
            email: 'admin@wholexale.com',
            password: 'Password123',
            firstName: 'Admin',
            lastName: 'Demo',
            phone: '9000000003',
            role: 'admin',
            partitions: ['overview', 'users', 'brands', 'products', 'orders', 'analytics', 'settings'],
            status: 'active',
            isActive: true,
            isVerified: true,
            emailVerified: true,
        },
        {
            email: 'superadmin@wholexale.com',
            password: 'Password123',
            firstName: 'Super',
            lastName: 'Admin',
            phone: '9000000004',
            role: 'super_admin',
            partitions: ['*'],
            status: 'active',
            isActive: true,
            isVerified: true,
            emailVerified: true,
        },
    ];

    await Category.deleteMany({});
    await Product.deleteMany({});

    for (const u of seedUsers) {
        const existing = await User.findOne({ email: u.email });
        if (!existing) {
            // Create triggers password hashing via pre-save hook.
            await User.create(u);
        }
    }

    const categoryDocs = await Category.insertMany(categories);
    const products = buildProducts(categoryDocs);
    await Product.insertMany(products);

    // eslint-disable-next-line no-console
    console.log(`Seeded ${seedUsers.length} users, ${categoryDocs.length} categories and ${products.length} products.`);
    await mongoose.disconnect();
};

seed().catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Seeding failed:', error);
    process.exit(1);
});
