const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const translations = {
    'en->hi': {
        'cotton kurti': 'कॉटन कुर्ती',
        'palazzo set': 'पलाज़ो सेट',
        'price': 'कीमत',
        'add to cart': 'कार्ट में जोड़ें',
        'buy now': 'अभी खरीदें',
        'in stock': 'स्टॉक में',
        'out of stock': 'स्टॉक खत्म',
        'shipping': 'शिपिंग',
        'free delivery': 'मुफ्त डिलीवरी',
        'customer reviews': 'ग्राहक समीक्षा'
    },
    'en->mr': {
        'cotton kurti': 'कॉटन कुर्ता',
        'palazzo set': 'पलाज्झो सेट',
        'price': 'किंमत',
        'add to cart': 'कार्टमध्ये जोडा',
        'buy now': 'आता खरेदी करा',
        'in stock': 'स्टॉकमध्ये',
        'out of stock': 'स्टॉक संपला',
        'shipping': 'शिपिंग',
        'free delivery': 'मोफत डिलिव्हरी',
        'customer reviews': 'ग्राहक पुनरावलोकन'
    }
};

// @route   POST /api/localization/translate
// @desc    Translate text (simple dictionary fallback)
// @access  Private
router.post('/translate', authMiddleware, asyncHandler(async (req, res) => {
    const { text, targetLanguage, sourceLanguage = 'en' } = req.body;
    const key = `${sourceLanguage}->${targetLanguage}`;
    const translatedText = translations[key]?.[text] || text;

    res.json({
        originalText: text,
        translatedText,
        sourceLanguage,
        targetLanguage
    });
}));

// @route   GET /api/localization/content
// @desc    Get localized vendor content
// @access  Private
router.get('/content', authMiddleware, asyncHandler(async (req, res) => {
    const { vendorId } = req.query;
    res.json({
        vendorId,
        content: {
            hi: {
                name: 'फैशन हब',
                description: 'प्रीमियम कपड़े और फैशन आइटम्स',
                categories: {
                    kurti: 'कुर्ती',
                    palazzo: 'पलाज़ो',
                    saree: 'साड़ी'
                }
            },
            mr: {
                name: 'फॅशन हब',
                description: 'प्रीमियम कपडे आणि फॅशन आयटम्स',
                categories: {
                    kurti: 'कुर्ता',
                    palazzo: 'पलाज्झो',
                    saree: 'साडी'
                }
            }
        }
    });
}));

module.exports = router;
