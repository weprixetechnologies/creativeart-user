export default function sitemap() {
  const baseUrl = 'https://thecreativeart.shop';
  
  // You can add logic to fetch dynamic routes (products, categories) here
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/terms-and-conditions`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/refund-policy`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/shipping-policy`,
      lastModified: new Date(),
    }
  ];
}
