'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '../../../lib/api-client';
import Header from '../../../components/Header';
import {
  Loader,
  AlertTriangle,
  ShoppingBag,
  CheckCircle,
  Truck,
  Sparkles,
  Info,
  Upload,
  Heart,
  Star,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  CreditCard,
  RotateCcw,
  ShieldCheck,
  Zap,
  HeartIcon,
  CircleDot
} from 'lucide-react';

const dummyRatings = {
  1: { count: 42, avg: 4.8 },
  2: { count: 28, avg: 4.7 },
  3: { count: 19, avg: 4.9 },
  4: { count: 35, avg: 4.6 },
  5: { count: 50, avg: 4.8 },
  6: { count: 14, avg: 4.5 },
  7: { count: 62, avg: 4.9 },
  8: { count: 11, avg: 4.4 },
  9: { count: 23, avg: 4.7 },
  10: { count: 31, avg: 4.8 },
  11: { count: 17, avg: 4.6 },
  12: { count: 8, avg: 4.3 },
  13: { count: 29, avg: 4.7 }
};

export default function ProductDetailPage() {
  const { slug } = useParams();
  const router = useRouter();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Gallery State
  const [activeImage, setActiveImage] = useState('');

  // Variant Selection State (for VARIABLE product_type)
  const [selectedAttrs, setSelectedAttrs] = useState({});
  const [selectedVariant, setSelectedVariant] = useState(null);

  // Custom Fields Form State (for CUSTOMISABLE or PROJECT types)
  const [customFieldValues, setCustomFieldValues] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [fileUploading, setFileUploading] = useState({}); // tracking upload status per key

  // Related products
  const [relatedProducts, setRelatedProducts] = useState([]);

  // Reviews & Wishlist State
  const [reviews, setReviews] = useState([]);
  const [ratingStats, setRatingStats] = useState({ totalReviews: 0, averageRating: '0.0' });
  const [inWishlist, setInWishlist] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  // Accordions state
  const [accordionOpen, setAccordionOpen] = useState({
    details: true,
    shipping: false,
    returns: false
  });

  useEffect(() => {
    fetchProductDetails();
  }, [slug]);

  const fetchProductDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.get(`/products/${slug}`);
      setProduct(data);

      // Set default image
      const primary = data.images?.find(img => img.is_primary === 1)?.url
        || data.images?.[0]?.url
        || 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=400&auto=format&fit=crop';
      setActiveImage(primary);

      // Set default variant if applicable
      if (data.item_type === 'PRODUCT' && data.product_type === 'VARIABLE' && data.variants?.length > 0) {
        const firstActive = data.variants.find(v => v.status === 'ACTIVE') || data.variants[0];
        setSelectedVariant(firstActive);

        const attrs = typeof firstActive.attributes === 'string' ? JSON.parse(firstActive.attributes) : firstActive.attributes;
        setSelectedAttrs(attrs);
      }

      // Initialize custom field values
      if (data.customFields && data.customFields.length > 0) {
        const initialVals = {};
        data.customFields.forEach(f => {
          initialVals[f.field_key] = '';
        });
        setCustomFieldValues(initialVals);
      }

      // Fetch reviews
      try {
        const revRes = await apiClient.get(`/products/${data.id}/reviews`);
        setReviews(revRes.reviews || []);
        setRatingStats({
          totalReviews: revRes.totalReviews || revRes.reviews?.length || 0,
          averageRating: String(revRes.averageRating || '0.0')
        });
      } catch (revErr) {
        console.error('Failed to load reviews:', revErr);
      }

      // Check wishlist
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          const wl = await apiClient.get('/wishlist');
          const match = wl.some(w => Number(w.id) === Number(data.id));
          setInWishlist(match);
        }
      } catch (wlErr) {
        console.error('Failed to load wishlist status:', wlErr);
      }

      // Fetch related products (items in the same category)
      try {
        const relRes = await apiClient.get(`/products?categoryId=${data.category_id}&limit=5`);
        const list = relRes.data || relRes;
        setRelatedProducts(list.filter(p => p.id !== data.id));
      } catch (relErr) {
        console.error('Failed to load related products:', relErr);
      }

    } catch (err) {
      setError(err.message || 'Product not found.');
    } finally {
      setLoading(false);
    }
  };

  const handleAttrSelect = (key, val) => {
    if (!product) return;

    const updated = { ...selectedAttrs, [key]: val };
    setSelectedAttrs(updated);

    const matched = product.variants.find(v => {
      if (v.status !== 'ACTIVE') return false;
      const vAttrs = typeof v.attributes === 'string' ? JSON.parse(v.attributes) : v.attributes;
      const keys = Object.keys(updated);
      return keys.every(k => vAttrs[k] === updated[k]) && Object.keys(vAttrs).length === keys.length;
    });

    setSelectedVariant(matched || null);
  };

  const handleFileUpload = async (fieldKey, file, allowedMimeTypes, maxFileSizeKb) => {
    if (!file) return;

    if (maxFileSizeKb && file.size > maxFileSizeKb * 1024) {
      setFieldErrors(prev => ({ ...prev, [fieldKey]: `File size exceeds limit of ${maxFileSizeKb} KB.` }));
      return;
    }

    if (allowedMimeTypes && allowedMimeTypes.length > 0) {
      if (!allowedMimeTypes.includes(file.type)) {
        setFieldErrors(prev => ({ ...prev, [fieldKey]: `Unsupported format. Allowed formats: ${allowedMimeTypes.join(', ')}.` }));
        return;
      }
    }

    setFieldErrors(prev => ({ ...prev, [fieldKey]: '' }));
    setFileUploading(prev => ({ ...prev, [fieldKey]: true }));

    try {
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const uploadKey = `custom-uploads/${fileName}`;

      const appUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.thecreativeart.shop/api/v1';
      const proxyUrl = `${appUrl}/storage/upload?key=${encodeURIComponent(uploadKey)}&contentType=${encodeURIComponent(file.type)}`;

      const uploadRes = await fetch(proxyUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type
        },
        body: file
      });

      if (!uploadRes.ok) {
        throw new Error('Upload request failed.');
      }

      const resJson = await uploadRes.json();
      const fileUrl = resJson.data.fileUrl;

      // Update form values - support multiple file uploads if separated by comma or array
      setCustomFieldValues(prev => ({ ...prev, [fieldKey]: fileUrl }));
      setSuccess('File uploaded successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setFieldErrors(prev => ({ ...prev, [fieldKey]: 'Failed to upload file. Please try again.' }));
    } finally {
      setFileUploading(prev => ({ ...prev, [fieldKey]: false }));
    }
  };

  const handleCustomFieldChange = (key, val) => {
    setCustomFieldValues(prev => ({ ...prev, [key]: val }));
    if (fieldErrors[key]) {
      setFieldErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const validateForm = () => {
    if (!product || !product.customFields) return true;

    const errors = {};
    let isValid = true;

    product.customFields.forEach(field => {
      const val = customFieldValues[field.field_key];
      const isPresent = val !== undefined && val !== null && String(val).trim() !== '';

      if (field.required && !isPresent) {
        errors[field.field_key] = `This field is required.`;
        isValid = false;
      } else if (isPresent) {
        if (field.type === 'NUMBER' && isNaN(Number(val))) {
          errors[field.field_key] = 'Must be a valid number.';
          isValid = false;
        } else if (field.type === 'DATE' && isNaN(Date.parse(val))) {
          errors[field.field_key] = 'Must be a valid calendar date.';
          isValid = false;
        } else if (field.type === 'FILE' && (!val.startsWith('http://') && !val.startsWith('https://'))) {
          errors[field.field_key] = 'Please wait for file upload to complete.';
          isValid = false;
        }
      }
    });

    setFieldErrors(errors);
    return isValid;
  };

  const getProductCartItem = () => {
    let finalPrice = product.base_price;
    if (product.product_type === 'VARIABLE' && selectedVariant) {
      finalPrice = selectedVariant.price_override || product.base_price;
    }
    return {
      productId: product.id,
      name: product.name,
      slug: product.slug,
      itemType: product.item_type,
      productType: product.product_type,
      price: parseFloat(finalPrice),
      image: activeImage,
      variantId: selectedVariant ? selectedVariant.id : null,
      selectedAttrs: selectedVariant ? selectedAttrs : null,
      customFieldValues: isCustomisable ? customFieldValues : null,
      quantity: 1
    };
  };

  const getProjectBooking = () => ({
    productId: product.id,
    name: product.name,
    slug: product.slug,
    image: activeImage,
    advanceAmount: parseFloat(product.advance_amount),
    finalAmount: parseFloat(product.final_amount),
    totalAmount: parseFloat(product.total_amount),
    customFieldValues: customFieldValues || {},
  });

  // ── BOOK PRESERVATION (PROJECT items only) ──────────────────────────────────
  // Projects bypass the cart entirely. The booking data is stored in sessionStorage
  // and the user is sent straight to /checkout/dual-payment.
  const handleBookPreservation = () => {
    if (!product) return;
    const token = localStorage.getItem('accessToken');
    if (!token) {
      window.dispatchEvent(new Event('show-login-modal'));
      return;
    }
    const valid = validateForm();
    if (!valid) {
      setError('Please fill in all required customisation fields before booking.');
      return;
    }
    setError('');
    sessionStorage.setItem('pendingBooking', JSON.stringify(getProjectBooking()));
    router.push('/checkout/dual-payment');
  };

  // ── ADD TO CART (PRODUCT items only) ────────────────────────────────────────
  const handleAddToCart = () => {
    if (!product) return;
    if (isProject) {
      handleBookPreservation();
      return;
    }

    if (product.product_type === 'VARIABLE' && !selectedVariant) {
      setError('Please choose a valid combination of options.');
      return;
    }
    const valid = validateForm();
    if (!valid) {
      setError('Please resolve all validation errors in custom options.');
      return;
    }

    setError('');
    const cartItem = getProductCartItem();
    const raw = localStorage.getItem('cart');
    let items = [];
    try { items = raw ? JSON.parse(raw) : []; } catch { items = []; }

    const existingIndex = items.findIndex(i =>
      i.productId === cartItem.productId &&
      i.variantId === cartItem.variantId &&
      JSON.stringify(i.customFieldValues) === JSON.stringify(cartItem.customFieldValues)
    );
    if (existingIndex > -1) {
      items[existingIndex].quantity += 1;
    } else {
      items.push(cartItem);
    }
    localStorage.setItem('cart', JSON.stringify(items));
    setSuccess('Added to cart successfully!');
    window.dispatchEvent(new Event('cart-updated'));
    setTimeout(() => { setSuccess(''); router.push('/cart'); }, 1500);
  };

  // ── BUY NOW (PRODUCT items only) ────────────────────────────────────────────
  const handleBuyNow = () => {
    if (!product) return;
    if (isProject) {
      handleBookPreservation();
      return;
    }
    if (product.product_type === 'VARIABLE' && !selectedVariant) {
      setError('Please choose a valid combination of options.');
      return;
    }
    const valid = validateForm();
    if (!valid) {
      setError('Please resolve all validation errors in custom options.');
      return;
    }
    setError('');
    const cartItem = getProductCartItem();
    localStorage.setItem('cart', JSON.stringify([cartItem]));
    window.dispatchEvent(new Event('cart-updated'));
    router.push('/checkout');
  };

  const handleToggleWishlist = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      window.dispatchEvent(new Event('show-login-modal'));
      return;
    }
    try {
      const res = await apiClient.post('/wishlist', { productId: product.id });
      setInWishlist(res.inWishlist);
      window.dispatchEvent(new Event('wishlist-updated'));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    if (!token) {
      window.dispatchEvent(new Event('show-login-modal'));
      return;
    }
    setReviewLoading(true);
    setReviewError(null);
    try {
      await apiClient.post(`/products/${product.id}/reviews`, reviewForm);
      setReviewSuccess(true);
      setReviewForm({ rating: 5, title: '', comment: '' });
      setTimeout(() => setReviewSuccess(false), 5000);
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setReviewLoading(false);
    }
  };

  const toggleAccordion = (section) => {
    setAccordionOpen(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafbfc]">
        <div className="flex flex-col items-center">
          <Loader className="w-10 h-10 animate-spin text-primary-pink mb-4" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Fetching details...</p>
        </div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-450 text-center gap-4">
          <AlertTriangle className="w-12 h-12 text-primary-pink" />
          <div>
            <p className="text-base font-bold text-slate-800">Catalog Item Not Found</p>
            <p className="text-xs text-slate-400 mt-1">This product may have been archived or does not exist.</p>
          </div>
          <Link href="/shop" className="px-5 py-2.5 bg-primary-pink text-white rounded-full text-xs font-bold shadow-sm">
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const isProject = product.item_type === 'PROJECT';
  const isVariable = product.product_type === 'VARIABLE';
  const isCustomisable = product.product_type === 'CUSTOMISABLE' || isProject;

  // Extract unique attributes list
  const attrKeys = [];
  const attrOptions = {};
  if (isVariable && product.variants) {
    product.variants.forEach(v => {
      if (v.status !== 'ACTIVE') return;
      const vAttrs = typeof v.attributes === 'string' ? JSON.parse(v.attributes) : v.attributes;
      Object.entries(vAttrs).forEach(([k, val]) => {
        if (!attrKeys.includes(k)) attrKeys.push(k);
        if (!attrOptions[k]) attrOptions[k] = [];
        if (!attrOptions[k].includes(val)) attrOptions[k].push(val);
      });
    });
  }

  // Determine pricing details
  let baseDisplayPrice = parseFloat(product.base_price);
  if (isVariable && selectedVariant) {
    baseDisplayPrice = parseFloat(selectedVariant.price_override || product.base_price);
  }

  const originalPrice = isProject
    ? Math.round(parseFloat(product.total_amount) * 1.7)
    : Math.round(baseDisplayPrice * 1.7);
  const discountPct = 43; // Static visual discount percentage matching product detail.png

  // Delivery date computation (current date + 8 days)
  const deliveryDateString = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long'
  });

  const isOutOfStock = !isProject && (
    isVariable
      ? (selectedVariant && selectedVariant.stock_qty <= 0)
      : (product?.variants?.[0]?.stock_qty <= 0)
  );

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-700 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-400 font-bold">
          <Link href="/" className="hover:text-primary-pink">Home</Link>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <Link href="/shop" className="hover:text-primary-pink">Shop</Link>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <Link href={`/shop?category=${product.category_id}`} className="hover:text-primary-pink capitalize">
            Personalised Gifts
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="text-slate-500 truncate">{product.name}</span>
        </div>

        {/* Alerts */}
        {success && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-emerald-600 text-xs font-bold flex items-center shadow-sm animate-in fade-in duration-200">
            <CheckCircle className="w-4.5 h-4.5 mr-2 shrink-0 text-emerald-500" /> {success}
          </div>
        )}
        {error && (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-primary-pink text-xs font-bold flex items-center shadow-sm animate-in fade-in duration-200">
            <AlertTriangle className="w-4.5 h-4.5 mr-2 shrink-0 text-primary-pink" /> {error}
          </div>
        )}

        {/* Main Product Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT: Gallery, Why Love It & Accordions (Span 5) */}
          <div className="lg:col-span-5 space-y-6">

            {/* Display Image Card */}
            <div className="w-full aspect-square bg-slate-50 border border-slate-100 rounded-3xl overflow-hidden relative shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeImage}
                alt={product.name}
                className="object-cover w-full h-full"
              />

              {/* Wishlist Heart Toggle */}
              <button
                type="button"
                onClick={handleToggleWishlist}
                className="absolute top-4 right-4 p-2.5 rounded-full bg-white/95 border border-slate-100 text-slate-400 hover:text-rose-500 shadow-md hover:scale-105 transition-transform"
              >
                <Heart className={`w-4 h-4 ${inWishlist ? 'text-primary-pink fill-primary-pink' : ''}`} />
              </button>

              <span className={`absolute top-4 left-4 text-[9px] px-2.5 py-0.5 rounded font-bold uppercase tracking-wider border bg-white/95
                ${isProject
                  ? 'border-indigo-200 text-indigo-500'
                  : 'border-rose-200 text-primary-pink'}
              `}>
                {product.item_type}
              </span>
            </div>

            {/* Thumbnail Selectors */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1.5 scrollbar-thin">
                {product.images.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(img.url)}
                    className={`w-16 h-16 bg-white border rounded-2xl overflow-hidden shrink-0 transition-all cursor-pointer p-0.5
                      ${activeImage === img.url
                        ? 'border-primary-pink ring-2 ring-primary-pink-light'
                        : 'border-slate-100 opacity-70 hover:opacity-100'}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="Thumbnail" className="object-cover w-full h-full rounded-xl" />
                  </button>
                ))}
              </div>
            )}

            {/* Trust Points Badges Row */}
            <div className="grid grid-cols-4 gap-2 pt-2 text-center text-[9px] font-bold text-slate-450">
              <div className="flex flex-col items-center gap-1.5 bg-white border border-slate-100 rounded-2xl p-2.5 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-primary-pink" />
                <span>Premium Quality</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 bg-white border border-slate-100 rounded-2xl p-2.5 shadow-sm">
                <Sparkles className="w-4 h-4 text-primary-pink" />
                <span>Bright & Warm Light</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 bg-white border border-slate-100 rounded-2xl p-2.5 shadow-sm">
                <Upload className="w-4 h-4 text-primary-pink" />
                <span>High Res Print</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 bg-white border border-slate-100 rounded-2xl p-2.5 shadow-sm">
                <Heart className="w-4 h-4 text-primary-pink" />
                <span>Made with Love</span>
              </div>
            </div>



          </div>

          {/* RIGHT: Product Options & Purchase Actions (Span 7) */}
          <div className="lg:col-span-7 space-y-6 text-left">

            {/* Title, Stars & Description */}
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-4xl font-playfair font-bold text-slate-800 leading-tight">{product.name}</h1>

              <div className="flex items-center gap-3.5 text-xs text-slate-500 font-bold flex-wrap">
                <div className="flex items-center gap-0.5 text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                  <span className="text-slate-700 ml-1.5">({ratingStats.totalReviews} reviews)</span>
                </div>
                <span>|</span>
                <span className="text-emerald-600 font-extrabold">500+ sold this month</span>
              </div>

              {/* Price Details */}
              <div className="flex items-center gap-3.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-800 font-sans">
                    ₹{isProject ? product.advance_amount : baseDisplayPrice}
                  </span>
                  <span className="text-sm sm:text-base text-slate-400 line-through">
                    ₹{originalPrice}
                  </span>
                </div>
                <span className="bg-primary-pink-light border border-rose-200 text-primary-pink text-[10px] font-extrabold px-2.5 py-0.5 rounded-md uppercase tracking-wider animate-pulse">
                  {discountPct}% OFF
                </span>

                {isProject && (
                  <span className="bg-indigo-50 border border-indigo-100 text-indigo-600 text-[9px] font-bold px-2 py-0.5 rounded">
                    Advance Deposit booking
                  </span>
                )}
                {isOutOfStock && (
                  <span className="bg-rose-50 border border-rose-100 text-primary-pink text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                    Out of Stock
                  </span>
                )}
              </div>

              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">{product.description}</p>
            </div>

            {/* Delivery Date Notification block */}
            <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 flex items-center justify-between gap-4 text-xs font-bold text-slate-600 shadow-inner">
              <div className="flex items-center gap-2">
                <Truck className="w-4.5 h-4.5 text-primary-pink" />
                <span>Delivery by <span className="text-slate-800 font-extrabold">{deliveryDateString}</span></span>
              </div>
              <span className="text-slate-400 font-medium">Free Shipping on orders above ₹999</span>
            </div>

            {/* Variable Product Variant Selector Controls */}
            {isVariable && attrKeys.length > 0 && (
              <div className="space-y-4 border-t border-slate-100 pt-5">
                {attrKeys.map((key) => {
                  const options = attrOptions[key] || [];
                  return (
                    <div key={key} className="space-y-2">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                        Select {key}
                      </span>
                      <div className="flex flex-wrap gap-2.5">
                        {options.map((opt) => {
                          const isActive = selectedAttrs[key] === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleAttrSelect(key, opt)}
                              className={`px-5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${isActive
                                ? 'border-primary-pink bg-primary-pink-light text-primary-pink shadow-sm scale-[1.01]'
                                : 'border-slate-200 hover:border-slate-350 bg-white text-slate-600'
                                }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* DUAL PAYMENT Timeline (PROJECT only) */}
            {isProject && (
              <div className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-3xl space-y-3.5 animate-in slide-in-from-top-3 duration-250">
                <h4 className="text-xs font-extrabold text-indigo-650 uppercase tracking-widest flex items-center gap-1.5">
                  <Info className="w-4 h-4" /> Dual-Payment Contract Info
                </h4>
                <p className="text-slate-500 text-xs leading-normal">
                  Book now by paying the advance fee (₹{product.advance_amount}). Ship your raw wedding flowers/materials to our studio. The final delivery balance (₹{product.final_amount}) will be billed upon completion before dispatch.
                </p>
                <div className="grid grid-cols-3 gap-3 border-t border-indigo-100/70 pt-3 text-[10px] uppercase font-bold text-slate-400">
                  <div>
                    <span>Advance Fee</span>
                    <p className="text-slate-800 mt-0.5 text-xs font-black">₹{product.advance_amount}</p>
                  </div>
                  <div>
                    <span>Final Balance</span>
                    <p className="text-slate-800 mt-0.5 text-xs font-black">₹{product.final_amount}</p>
                  </div>
                  <div>
                    <span>Total Cost</span>
                    <p className="text-primary-pink mt-0.5 text-xs font-black">₹{product.total_amount}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Custom Interactive Options Form */}
            {isCustomisable && product.customFields && product.customFields.length > 0 && (
              <div className="space-y-5 border-t border-slate-100 pt-5">
                {product.customFields.map((field, index) => {
                  const opts = typeof field.options === 'string' ? JSON.parse(field.options) : field.options;
                  const mime = typeof field.allowed_mime_types === 'string' ? JSON.parse(field.allowed_mime_types) : field.allowed_mime_types;

                  // Special Design overrides for specific field keys to match screenshot

                  // OVERRIDE 1: Choose Shape (Dropdown)
                  if (field.field_key === 'shape' && Array.isArray(opts)) {
                    return (
                      <div key={field.id} className="space-y-2">
                        <label className="text-xs font-bold text-slate-850 uppercase tracking-wider flex items-center">
                          {index + 1}. {field.label}
                          {field.required === 1 && <span className="text-primary-pink ml-1">*</span>}
                        </label>
                        <div className="flex flex-wrap gap-2.5">
                          {opts.map(opt => {
                            const isActive = customFieldValues[field.field_key] === opt;
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => handleCustomFieldChange(field.field_key, opt)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${isActive
                                  ? 'border-primary-pink bg-primary-pink-light text-primary-pink shadow-sm'
                                  : 'border-slate-200 hover:border-slate-350 bg-white text-slate-600'
                                  }`}
                              >
                                {opt === 'Heart' && <HeartIcon className={`w-3.5 h-3.5 ${isActive ? 'fill-primary-pink' : ''}`} />}
                                {opt === 'Square' && <span className="w-3.5 h-3.5 border-2 border-current rounded-sm block shrink-0" />}
                                {opt === 'Circle' && <span className="w-3.5 h-3.5 border-2 border-current rounded-full block shrink-0" />}
                                <span>{opt}</span>
                              </button>
                            );
                          })}
                        </div>
                        {fieldErrors[field.field_key] && (
                          <p className="text-[10px] text-primary-pink font-bold mt-0.5">{fieldErrors[field.field_key]}</p>
                        )}
                      </div>
                    );
                  }

                  // OVERRIDE 2: Upload Your Photos (File upload spot)
                  if (field.type === 'FILE') {
                    const uploadedUrl = customFieldValues[field.field_key];
                    return (
                      <div key={field.id} className="space-y-2">
                        <label className="text-xs font-bold text-slate-850 uppercase tracking-wider flex items-center">
                          {index + 1}. {field.label}
                          {field.required === 1 && <span className="text-primary-pink ml-1">*</span>}
                        </label>
                        <p className="text-[10px] text-slate-400 font-bold -mt-1 leading-none">{field.help_text || 'Best results with high-resolution images.'}</p>

                        <div className="flex flex-wrap items-center gap-3">
                          {/* Upload Slot */}
                          <div className="relative w-28 h-28 border-2 border-dashed border-slate-200 hover:border-primary-pink/50 rounded-2xl flex flex-col items-center justify-center text-center p-2 bg-white hover:bg-rose-50/5 transition-all">
                            <input
                              type="file"
                              disabled={fileUploading[field.field_key]}
                              onChange={(e) => handleFileUpload(field.field_key, e.target.files[0], mime, field.max_file_size_kb)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <Upload className="w-5 h-5 text-slate-400 mb-1" />
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                              {fileUploading[field.field_key] ? 'Uploading...' : 'Upload Photo'}
                            </span>
                            <span className="text-[7px] text-slate-400 mt-0.5">Rec size: 1000x1000px</span>
                          </div>

                          {/* Preview uploaded image */}
                          {uploadedUrl && (
                            <div className="relative w-28 h-28 bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden shadow-inner group">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={uploadedUrl} alt="Uploaded Option" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => handleCustomFieldChange(field.field_key, '')}
                                className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-primary-pink text-white rounded-full transition-all focus:outline-none"
                                title="Remove Image"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                        {fieldErrors[field.field_key] && (
                          <p className="text-[10px] text-primary-pink font-bold mt-0.5">{fieldErrors[field.field_key]}</p>
                        )}
                      </div>
                    );
                  }

                  // OVERRIDE 3: Add Personalisation (Text field with limit)
                  if (field.type === 'TEXT') {
                    const textVal = customFieldValues[field.field_key] || '';
                    const charCount = textVal.length;
                    const maxLen = 25; // Matching screenshot 0/25 character limit
                    return (
                      <div key={field.id} className="space-y-2">
                        <label className="text-xs font-bold text-slate-850 uppercase tracking-wider flex items-center">
                          {index + 1}. {field.label}
                          {field.required === 1 && <span className="text-primary-pink ml-1">*</span>}
                        </label>
                        <div className="relative max-w-md">
                          <input
                            type="text"
                            maxLength={maxLen}
                            placeholder="Add text (e.g. You & Me Forever)"
                            value={textVal}
                            onChange={(e) => handleCustomFieldChange(field.field_key, e.target.value)}
                            className="w-full bg-white border border-rose-100 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary-pink pr-12 shadow-sm"
                          />
                          <span className="absolute right-3.5 top-3.5 text-[9px] font-bold text-slate-400">
                            {charCount}/{maxLen}
                          </span>
                        </div>
                        {fieldErrors[field.field_key] && (
                          <p className="text-[10px] text-primary-pink font-bold mt-0.5">{fieldErrors[field.field_key]}</p>
                        )}
                      </div>
                    );
                  }

                  // OVERRIDE 4: Choose Light Color (dropdown/selector color)
                  if (field.field_key === 'color' && Array.isArray(opts)) {
                    return (
                      <div key={field.id} className="space-y-2">
                        <label className="text-xs font-bold text-slate-850 uppercase tracking-wider flex items-center">
                          {index + 1}. {field.label}
                          {field.required === 1 && <span className="text-primary-pink ml-1">*</span>}
                        </label>
                        <div className="flex flex-wrap gap-2.5">
                          {opts.map(opt => {
                            const isActive = customFieldValues[field.field_key] === opt;
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => handleCustomFieldChange(field.field_key, opt)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${isActive
                                  ? 'border-primary-pink bg-primary-pink-light text-primary-pink shadow-sm'
                                  : 'border-slate-200 hover:border-slate-350 bg-white text-slate-600'
                                  }`}
                              >
                                <span className={`w-3 h-3 rounded-full shrink-0 ${opt.toLowerCase().includes('warm') ? 'bg-amber-400' : 'bg-sky-400'
                                  }`} />
                                <span>{opt}</span>
                              </button>
                            );
                          })}
                        </div>
                        {fieldErrors[field.field_key] && (
                          <p className="text-[10px] text-primary-pink font-bold mt-0.5">{fieldErrors[field.field_key]}</p>
                        )}
                      </div>
                    );
                  }

                  // Fallback standard fields
                  return (
                    <div key={field.id} className="space-y-1.5 max-w-md">
                      <label className="text-xs font-bold text-slate-800 flex items-center">
                        {index + 1}. {field.label}
                        {field.required === 1 && <span className="text-primary-pink ml-1">*</span>}
                      </label>
                      {field.type === 'TEXTAREA' ? (
                        <textarea
                          rows={3}
                          value={customFieldValues[field.field_key] || ''}
                          onChange={(e) => handleCustomFieldChange(field.field_key, e.target.value)}
                          className="w-full bg-white border border-rose-100 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary-pink resize-none"
                        />
                      ) : (
                        <select
                          value={customFieldValues[field.field_key] || ''}
                          onChange={(e) => handleCustomFieldChange(field.field_key, e.target.value)}
                          className="w-full bg-white border border-rose-100 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary-pink"
                        >
                          <option value="">Select option...</option>
                          {Array.isArray(opts) && opts.map(o => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                      )}
                      {fieldErrors[field.field_key] && (
                        <p className="text-[10px] text-primary-pink font-bold mt-0.5">{fieldErrors[field.field_key]}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Price display and CTA Action Buttons */}
            <div className="pt-6 border-t border-slate-100 space-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-800">
                  ₹{isProject ? product.advance_amount : baseDisplayPrice}
                </span>
                <span className="text-xs text-slate-400 line-through">
                  ₹{originalPrice}
                </span>
                <span className="text-[10px] text-primary-pink font-extrabold ml-1.5 uppercase">
                  {discountPct}% OFF
                </span>
              </div>

              {isProject ? (
                // PROJECT — single dedicated booking CTA, no cart involvement
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={handleBookPreservation}
                    className="w-full py-4 bg-primary-pink hover:bg-primary-pink-hover text-white rounded-full font-bold text-xs sm:text-sm transition-all shadow-md shadow-rose-600/10 flex justify-center items-center gap-2 cursor-pointer hover:scale-[1.01]"
                  >
                    <ShoppingBag className="w-4.5 h-4.5" />
                    Book Preservation — Pay ₹{product.advance_amount} Advance
                  </button>
                  <p className="text-center text-[10px] text-slate-400 font-medium">
                    Final balance of ₹{product.final_amount} due after project completion · No cart required
                  </p>
                </div>
              ) : (
                // PRODUCT — standard Add to Cart + Buy Now
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={handleAddToCart}
                    className={`flex-1 py-4 rounded-full font-bold text-xs sm:text-sm transition-all flex justify-center items-center gap-2 cursor-pointer ${isOutOfStock ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' : 'bg-primary-pink hover:bg-primary-pink-hover text-white shadow-md shadow-rose-600/10 hover:scale-[1.01]'}`}
                  >
                    <ShoppingBag className="w-4.5 h-4.5" />
                    {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={handleBuyNow}
                    className={`flex-1 py-4 rounded-full font-bold text-xs sm:text-sm transition-all flex justify-center items-center gap-2 cursor-pointer ${isOutOfStock ? 'bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-200 hidden sm:flex' : 'bg-white border-2 border-primary-pink hover:bg-primary-pink-light text-primary-pink hover:scale-[1.01]'}`}
                  >
                    <Zap className="w-4.5 h-4.5 fill-current" />
                    {isOutOfStock ? 'Unavailable' : 'Buy Now'}
                  </button>
                </div>
              )}

              {/* Trust assurances badges */}
              <div className="flex items-center justify-center sm:justify-start gap-4 pt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span className="flex items-center gap-1"><CreditCard className="w-3.5 h-3.5 text-primary-pink" /> Secure Payments</span>
                <span>•</span>
                <span className="flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5 text-primary-pink" /> Easy Returns</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-primary-pink fill-primary-pink" /> 100% Satisfaction</span>
              </div>
            </div>

            {/* Why You'll Love It Section */}
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4 text-left mt-6">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b border-slate-50 pb-2">
                Why You'll Love It
              </h3>
              <ul className="space-y-2.5 text-xs font-bold text-slate-500">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Personalised with your favourite photo memories</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Premium quality solid wood block lamp base with detailed engraving</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Soft LED glow light, comfortable for nights and bedside placing</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Perfect gift choice for birthdays, wedding anniversaries and special celebrations</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>USB powered cable with convenient mechanical ON/OFF switch</span>
                </li>
              </ul>
            </div>

            {/* Accordions */}
            <div className="space-y-2 text-xs font-bold text-slate-500 mt-6">
              {/* Accordion 1: Details */}
              <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                <button
                  onClick={() => toggleAccordion('details')}
                  className="w-full flex justify-between items-center p-4 text-left font-bold text-slate-800 uppercase tracking-wider cursor-pointer"
                >
                  <span>Product Details</span>
                  {accordionOpen.details ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {accordionOpen.details && (
                  <div className="p-4 pt-0 border-t border-slate-50 font-medium text-slate-500 leading-relaxed text-left space-y-2">
                    <p>Beautiful wooden table lamp block featuring customization options. A highly elegant accessory for bedrooms, bedside shelves and living rooms.</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Material: Natural Oak Wood Base, Premium Optical Acrylic Panel</li>
                      <li>Dimensions: Acrylic - 15cm x 15cm, Wood Base - 15cm x 4.5cm x 3cm</li>
                      <li>Cable Length: 1.2m USB cable with toggle button</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Accordion 2: Shipping */}
              <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                <button
                  onClick={() => toggleAccordion('shipping')}
                  className="w-full flex justify-between items-center p-4 text-left font-bold text-slate-800 uppercase tracking-wider cursor-pointer"
                >
                  <span>Shipping & Delivery</span>
                  {accordionOpen.shipping ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {accordionOpen.shipping && (
                  <div className="p-4 pt-0 border-t border-slate-50 font-medium text-slate-500 leading-relaxed text-left">
                    <p>All standard orders are processed and printed within 2-3 business days. Delivery is handled securely via express couriers like Delhivery, BlueDart or Shiprocket partners. Transit time is 3-5 days depending on location. Free shipping unlocks on orders exceeding ₹999.</p>
                  </div>
                )}
              </div>

              {/* Accordion 3: Returns */}
              <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                <button
                  onClick={() => toggleAccordion('returns')}
                  className="w-full flex justify-between items-center p-4 text-left font-bold text-slate-800 uppercase tracking-wider cursor-pointer"
                >
                  <span>Returns & Refunds</span>
                  {accordionOpen.returns ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {accordionOpen.returns && (
                  <div className="p-4 pt-0 border-t border-slate-50 font-medium text-slate-500 leading-relaxed text-left">
                    <p>Due to the bespoke, customized nature of personalized items, returns are only accepted in cases of manufacturing defects, damages during transit, or printing mistakes. Please reach out to support with parcel unpacking videos within 48 hours of receipt for instant replacement.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RELATED PRODUCTS / YOU MAY ALSO LIKE Section */}
        {relatedProducts.length > 0 && (
          <div className="border-t border-slate-100 pt-10 space-y-6 text-left">
            <h3 className="text-lg sm:text-xl font-playfair font-bold text-slate-800 text-center">
              You May <span className="text-primary-pink font-playfair italic">Also Like</span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map(rel => {
                const imgUrl = rel.images?.[0]?.url || 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=300&auto=format&fit=crop';
                const dummyStats = dummyRatings[rel.id] || { count: 42, avg: 4.8 };
                const isRelProject = rel.item_type === 'PROJECT';
                return (
                  <Link
                    key={rel.id}
                    href={`/products/${rel.slug}`}
                    className="group bg-white border border-slate-100 hover:border-rose-100 rounded-3xl p-3 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="space-y-3">
                      <div className="w-full aspect-square bg-slate-50 rounded-2xl overflow-hidden border border-slate-50 relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imgUrl} alt={rel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <span className={`absolute top-2 left-2 text-[7px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border bg-white/95
                          ${isRelProject ? 'border-indigo-200 text-indigo-500' : 'border-rose-200 text-primary-pink'}
                        `}>
                          {isRelProject ? 'PROJECT' : 'PRODUCT'}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-800 truncate group-hover:text-primary-pink transition-colors">{rel.name}</h4>
                      <div className="flex items-center gap-0.5 text-amber-400">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span className="text-[10px] text-slate-500 font-bold ml-1">{dummyStats.avg}</span>
                        <span className="text-[10px] text-slate-400 font-medium">({dummyStats.count})</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-baseline mt-4 border-t border-slate-50 pt-2 text-xs font-bold text-slate-800">
                      <span>₹{isRelProject ? rel.advance_amount : rel.base_price}</span>
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                        {isRelProject ? 'Deposit' : 'Base Price'}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* CUSTOMER REVIEWS & SUBMISSION Section */}
        <div className="border-t border-slate-100 pt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
          {/* Left: Reviews List (Span 7) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg sm:text-xl font-playfair font-bold text-slate-800">Customer Reviews</h3>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 font-bold">
                  <div className="flex items-center text-amber-400">
                    <Star className="w-4.5 h-4.5 fill-amber-400" />
                    <span className="text-slate-800 font-black ml-1">{ratingStats.averageRating}</span>
                  </div>
                  <span>•</span>
                  <span>{ratingStats.totalReviews} reviews</span>
                </div>
              </div>
            </div>

            {reviews.length === 0 ? (
              <p className="text-xs sm:text-sm text-slate-400 italic py-6">No reviews submitted yet for this product. Be the first to share your thoughts!</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div key={rev.id} className="bg-white border border-slate-100 p-5 rounded-2xl space-y-2.5 shadow-sm">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        {/* Use dummy reviewer name since user_id matches Sophia Patel in seed */}
                        <span className="text-xs font-bold text-slate-800 block">
                          {rev.user?.name || 'Verified Customer'}
                        </span>
                        <div className="flex items-center gap-0.5 mt-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${s <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                                }`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {rev.created_at ? new Date(rev.created_at).toLocaleDateString('en-IN') : ''}
                      </span>
                    </div>
                    {rev.title && <h4 className="text-xs sm:text-sm font-bold text-slate-800">{rev.title}</h4>}
                    <p className="text-xs text-slate-500 leading-relaxed">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Submission Form (Span 5) */}
          <div className="lg:col-span-5 bg-white border border-slate-100 p-6 rounded-3xl space-y-5 self-start shadow-sm">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800">Share your experience</h3>
              <p className="text-xs text-slate-400 mt-1 font-semibold">Review this product to help other shoppers make decisions</p>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Overall Rating</label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm(f => ({ ...f, rating: star }))}
                      className="p-0.5 text-slate-200 hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 ${star <= reviewForm.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                          }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 mb-0.5 uppercase tracking-wider">Review Title</label>
                <input
                  type="text"
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Absolutely gorgeous!"
                  className="w-full bg-white border border-rose-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary-pink"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 mb-0.5 uppercase tracking-wider">Feedback Comment</label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                  rows={4}
                  placeholder="What did you think of the frame quality, LED lighting, and wood engraving finish?"
                  className="w-full bg-white border border-rose-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary-pink resize-none"
                  required
                />
              </div>

              {reviewSuccess && (
                <p className="text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2 flex items-center gap-1">
                  ✓ Review submitted! It will appear once approved by moderator.
                </p>
              )}

              {reviewError && (
                <p className="text-xs text-primary-pink bg-rose-50 border border-rose-100 rounded-xl px-4 py-2">{reviewError}</p>
              )}

              <button
                type="submit"
                disabled={reviewLoading}
                className="w-full py-3 bg-primary-pink hover:bg-primary-pink-hover disabled:opacity-50 text-white rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer hover:scale-[1.01]"
              >
                {reviewLoading ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>

      </main>
    </div>
  );
}
