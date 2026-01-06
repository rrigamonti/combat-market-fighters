import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageMeta } from "@/components/PageMeta";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface Brand {
  id: string;
  name: string;
  logo_url: string | null;
}

interface Product {
  id: string;
  name: string;
  price: string;
  slug: string;
  image_url: string | null;
  brand: string;
  brand_id: string | null;
  category: string | null;
  discount_percentage: number | null;
}

export default function Marketplace() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");

  useEffect(() => {
    async function fetchData() {
      // Fetch brands
      const { data: brandsData } = await supabase
        .from("brands")
        .select("id, name, logo_url")
        .order("name");

      if (brandsData) {
        setBrands(brandsData);
      }

      // Fetch active products
      const { data: productsData } = await supabase
        .from("products")
        .select("id, name, price, slug, image_url, brand, brand_id, category, discount_percentage")
        .eq("active", true)
        .order("name");

      if (productsData) {
        setProducts(productsData);
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  // Get unique categories from products
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats).sort();
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        searchQuery === "" ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory =
        selectedCategory === "all" || product.category === selectedCategory;
      
      const matchesBrand =
        selectedBrand === "all" || product.brand_id === selectedBrand;

      return matchesSearch && matchesCategory && matchesBrand;
    });
  }, [products, searchQuery, selectedCategory, selectedBrand]);

  // Group products by brand
  const productsByBrand = useMemo(() => {
    const grouped: Record<string, { brand: Brand | null; products: Product[] }> = {};

    filteredProducts.forEach((product) => {
      const brandId = product.brand_id || "no-brand";
      if (!grouped[brandId]) {
        const brand = brands.find((b) => b.id === product.brand_id) || null;
        grouped[brandId] = { brand, products: [] };
      }
      grouped[brandId].products.push(product);
    });

    // Sort by brand name
    return Object.values(grouped).sort((a, b) => {
      const nameA = a.brand?.name || a.products[0]?.brand || "Other";
      const nameB = b.brand?.name || b.products[0]?.brand || "Other";
      return nameA.localeCompare(nameB);
    });
  }, [filteredProducts, brands]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="Marketplace"
        description="Browse all combat sports products on Combat Market. Find gear from top brands recommended by professional fighters."
      />
      <Navbar />

      {/* Hero Section */}
      <section className="border-b border-border bg-gradient-to-b from-primary/5 to-background pt-24 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-center font-display text-4xl md:text-5xl">
            Marketplace
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            Discover premium combat sports gear from the brands trusted by professional fighters.
          </p>

          {/* Filters */}
          <div className="mx-auto mt-8 flex max-w-3xl flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {categories.length > 0 && (
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </section>

      {/* Products by Brand */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {filteredProducts.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-lg text-muted-foreground">No products found matching your criteria.</p>
            </div>
          ) : (
            <div className="space-y-16">
              {productsByBrand.map(({ brand, products: brandProducts }) => (
                <div key={brand?.id || "no-brand"}>
                  {/* Brand Header */}
                  <div className="mb-6 flex items-center gap-3 border-b border-border pb-4">
                    {brand?.logo_url && (
                      <img
                        src={brand.logo_url}
                        alt={brand.name}
                        className="h-10 w-10 rounded-lg object-contain"
                      />
                    )}
                    <h2 className="font-display text-2xl">
                      {brand?.name || brandProducts[0]?.brand || "Other Products"}
                    </h2>
                    <span className="ml-auto text-sm text-muted-foreground">
                      {brandProducts.length} {brandProducts.length === 1 ? "product" : "products"}
                    </span>
                  </div>

                  {/* Products Grid */}
                  <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {brandProducts.map((product) => (
                      <Link
                        key={product.id}
                        to={`/p/${product.slug}`}
                        className="group relative block overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
                      >
                        {/* Discount Badge */}
                        {product.discount_percentage && product.discount_percentage > 0 && (
                          <div className="absolute left-2 top-2 z-10 rounded-full bg-green-500 px-2 py-0.5 text-xs font-bold text-white">
                            -{product.discount_percentage}%
                          </div>
                        )}

                        {/* Product Image */}
                        <div className="aspect-square overflow-hidden bg-muted">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                              No Image
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="p-3">
                          <h3 className="text-sm font-medium leading-tight line-clamp-2">
                            {product.name}
                          </h3>
                          <p className="mt-1 text-sm font-bold text-primary">
                            {product.price}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
