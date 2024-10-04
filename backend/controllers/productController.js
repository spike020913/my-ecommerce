import Product from '../models/Product.js';
import { redis } from '../lib/redis.js';
import cloudinary from '../lib/cloudinary.js';
export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({});
        // Always sends a JSON object!!
        res.json({products});
    } catch (error) {
        console.log("Error in getAllProducts", error);
        res.status(500).json({ message: error.message });
    }
}

export const getFeaturedProducts = async (req, res) => {
    try {
        const featuredProducts = await redis.get('featuredProducts');
        if (featuredProducts) {
            return res.json(JSON.parse(featuredProducts));
        }

        // If not in redis, fetch from mongoDB
        // .lean() is used to get a plain JS object instead of a mongoose object
        featuredProducts = await Product.find({ isFeatured: true }).lean();

        if (!featuredProducts) {
            return res.status(404).json({ message: "No featured products found" });
        }

        await redis.set('featuredProducts', JSON.stringify(featuredProducts));
        res.json(featuredProducts);
    } catch (error) {
        console.log("Error in getFeaturedProducts", error);
        res.status(500).json({ message: error.message });
    }
}

export const createProduct = async (req, res) => {
	try {
		const { name, description, price, image, category } = req.body;

		let cloudinaryResponse = null;

		if (image) {
			cloudinaryResponse = await cloudinary.uploader.upload(image, { folder: "products" });
		}

		const product = await Product.create({
			name,
			description,
			price,
			image: cloudinaryResponse?.secure_url ? cloudinaryResponse.secure_url : "",
			category,
		});

		res.status(201).json(product);
	} catch (error) {
		console.log("Error in createProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            res.status(404);
            throw new Error('Product not found');
        }

        if (product.image) {
            const productId = product.image.split('/').pop().split('.')[0]; // Get the public_id of the image
            try {
                await cloudinary.uploader.destroy(`products/${productId}`);
                console.log("Image deleted from cloudinary");
            } catch (error) {
                console.log("Error in cloudinary delete", error);
            }
        }
        await Product.findByIdAndDelete(req.params.id);

        res.json({ message: 'Product removed' });
    } catch (error) {
        console.log("Error in deleteProduct", error);
        res.status(500).json({ message: error.message });
    }
}

export const getRecommendations = async (req, res) => {
    try {
        const products = await Product.aggregate([
            { 
                $sample: { size: 4 } 
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    image: 1,
                    price: 1
                }
            }
        
        ])

        res.json(products);
    } catch (error) {
        console.log("Error in getRecommendations", error);
        res.status(500).json({ message: error.message });
    }
}

export const getCategory = async (req, res) => {
    const { category } = req.params;
    try {
        const products = await Product.find({ category });
        res.json({products});

    } catch (error) {
        console.log("Error in getCategory", error);
        res.status(500).json({ message: error.message });
    }
}

export const toggleFeaturedProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            res.status(404);
            throw new Error('Product not found');
        }

        product.isFeatured = !product.isFeatured;
        const updatedProduct = await product.save();
        // update the featured products cache in redis
        await updateFeaturedProductsCache();
        res.json(updatedProduct);
    } catch (error) {
        console.log("Error in toggleFeaturedProduct", error);
        res.status(500).json({ message: error.message });
    }
}

export const updateFeaturedProductsCache = async () => {
    try {
        // Give all featured products in redis
        const featuredProducts = await Product.find({ isFeatured: true }).lean();
        await redis.set('featuredProducts', JSON.stringify(featuredProducts));
    } catch (error) {
        console.log("Error in updateFeaturedProductsCache", error);
    }
}