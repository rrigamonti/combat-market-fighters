import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageMeta } from "@/components/PageMeta";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Grid3X3, LayoutGrid, Sparkles, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  const [sortBy, setSortBy] = useState<string>("name-asc");

  useEffect(() => {
    async function fetchData() {
      const { data: brandsData } = await supabase
        .from("brands")
        .select("id, name, logo_url")
        .order("name");

      if (brandsData) {
        setBrands(brandsData);
      }

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

  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    const result = products.filter((product) => {
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

    // Apply product-level sorting
    const parsePrice = (p: string) => parseFloat(p.replace(/[^0-9.]/g, "")) || 0;
    switch (sortBy) {
      case "name-desc":
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "price-asc":
        result.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
        break;
      case "price-desc":
        result.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
        break;
      default:
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return result;
  }, [products, searchQuery, selectedCategory, selectedBrand, sortBy]);

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

    const groups = Object.values(grouped);

    // Apply brand-level sorting
    switch (sortBy) {
      case "brand-desc":
        groups.sort((a, b) => {
          const nameA = a.brand?.name || a.products[0]?.brand || "Other";
          const nameB = b.brand?.name || b.products[0]?.brand || "Other";
          return nameB.localeCompare(nameA);
        });
        break;
      case "product-count":
        groups.sort((a, b) => b.products.length - a.products.length);
        break;
      default:
        groups.sort((a, b) => {
          const nameA = a.brand?.name || a.products[0]?.brand || "Other";
          const nameB = b.brand?.name || b.products[0]?.brand || "Other";
          return nameA.localeCompare(nameB);
        });
        break;
    }

    return groups;
  }, [filteredProducts, brands, sortBy]);

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
      <section className="relative overflow-hidden border-b border-border pt-20 pb-10 sm:pt-24 sm:pb-16">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/5 blur-[100px] rounded-full sm:w-[800px] sm:h-[400px] sm:blur-[120px]" />
        
        <div className="container relative mx-auto px-4">
          <div className="text-center">
            <Badge variant="outline" className="mb-3 border-primary/30 text-primary text-xs sm:mb-4">
              <Sparkles className="mr-1 h-3 w-3" />
              {products.length} Products • {brands.length} Brands
            </Badge>
            <h1 className="font-display text-4xl tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              MARKETPLACE
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:mt-4 sm:text-lg">
              Premium combat sports gear trusted by professional fighters worldwide.
            </p>
          </div>

          {/* Search & Filters */}
          <div className="mx-auto mt-6 max-w-4xl sm:mt-10">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground sm:left-4 sm:h-5 sm:w-5" />
                <Input
                  placeholder="Search products or brands..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 pl-10 text-sm bg-card/50 backdrop-blur-sm border-border/50 focus:border-primary/50 sm:h-12 sm:pl-12 sm:text-base"
                />
              </div>
              <div className="flex gap-2 sm:gap-3">
                <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                  <SelectTrigger className="h-10 flex-1 bg-card/50 backdrop-blur-sm border-border/50 text-xs sm:h-12 sm:w-[160px] sm:text-sm">
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
                    <SelectTrigger className="h-10 flex-1 bg-card/50 backdrop-blur-sm border-border/50 text-xs sm:h-12 sm:w-[160px] sm:text-sm">
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
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-10 flex-1 bg-card/50 backdrop-blur-sm border-border/50 text-xs sm:h-12 sm:w-[180px] sm:text-sm">
                    <ArrowUpDown className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4 shrink-0" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name-asc">Name A–Z</SelectItem>
                    <SelectItem value="name-desc">Name Z–A</SelectItem>
                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                    <SelectItem value="brand-asc">Brand A–Z</SelectItem>
                    <SelectItem value="brand-desc">Brand Z–A</SelectItem>
                    <SelectItem value="product-count">Product Count</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Active Filters */}
            {(selectedBrand !== "all" || selectedCategory !== "all" || searchQuery) && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5 sm:mt-4 sm:gap-2">
                <span className="text-xs text-muted-foreground sm:text-sm">Showing:</span>
                {searchQuery && (
                  <Badge variant="secondary" className="gap-0.5 text-xs sm:gap-1">
                    "{searchQuery}"
                    <button onClick={() => setSearchQuery("")} className="ml-1 hover:text-primary">×</button>
                  </Badge>
                )}
                {selectedBrand !== "all" && (
                  <Badge variant="secondary" className="gap-0.5 text-xs sm:gap-1">
                    {brands.find(b => b.id === selectedBrand)?.name}
                    <button onClick={() => setSelectedBrand("all")} className="ml-1 hover:text-primary">×</button>
                  </Badge>
                )}
                {selectedCategory !== "all" && (
                  <Badge variant="secondary" className="gap-0.5 text-xs sm:gap-1">
                    {selectedCategory}
                    <button onClick={() => setSelectedCategory("all")} className="ml-1 hover:text-primary">×</button>
                  </Badge>
                )}
                <button 
                  onClick={() => { setSearchQuery(""); setSelectedBrand("all"); setSelectedCategory("all"); }}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors sm:text-sm"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Products by Brand */}
      <section className="py-10 sm:py-16">
        <div className="container mx-auto px-4">
          {filteredProducts.length === 0 ? (
            <div className="py-16 text-center sm:py-24">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted sm:mb-4 sm:h-16 sm:w-16">
                <Search className="h-6 w-6 text-muted-foreground sm:h-8 sm:w-8" />
              </div>
              <h3 className="text-lg font-semibold sm:text-xl">No products found</h3>
              <p className="mt-1.5 text-sm text-muted-foreground sm:mt-2 sm:text-base">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <div className="space-y-12 sm:space-y-20">
              {productsByBrand.map(({ brand, products: brandProducts }) => (
                <div key={brand?.id || "no-brand"}>
                  {/* Brand Header */}
                  <div className="mb-4 flex items-center gap-3 sm:mb-8 sm:gap-4">
                    {brand?.logo_url ? (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-card border border-border p-1.5 sm:h-14 sm:w-14 sm:rounded-xl sm:p-2">
                        <img
                          src={brand.logo_url}
                          alt={brand.name}
                          className="h-full w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 sm:h-14 sm:w-14 sm:rounded-xl">
                        <span className="font-display text-base text-primary sm:text-xl">
                          {(brand?.name || brandProducts[0]?.brand || "O").charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <h2 className="font-display text-xl sm:text-2xl md:text-3xl">
                        {brand?.name || brandProducts[0]?.brand || "Other Products"}
                      </h2>
                      <p className="text-xs text-muted-foreground sm:text-sm">
                        {brandProducts.length} {brandProducts.length === 1 ? "product" : "products"}
                      </p>
                    </div>
                  </div>

                  {/* Products Grid */}
                  <div className="grid gap-3 grid-cols-2 sm:gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {brandProducts.map((product) => (
                      <Link
                        key={product.id}
                        to={`/p/${product.slug}`}
                        className="group relative block overflow-hidden rounded-xl bg-card border border-border/50 transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 sm:rounded-2xl"
                      >
                        {/* Discount Badge - Top Right */}
                        {product.discount_percentage && product.discount_percentage > 0 && (
                          <div className="absolute right-2 top-2 z-10 flex items-center gap-0.5 rounded-full bg-gray-800 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-lg sm:gap-1 sm:px-2.5 sm:py-1 sm:text-xs">
                            <span>🔥</span>
                            <span>{product.discount_percentage}% OFF</span>
                          </div>
                        )}

                        {/* Product Image */}
                        <div className="aspect-square overflow-hidden bg-muted/50">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={`${product.name} - ${product.brand} combat gear`}
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Grid3X3 className="h-6 w-6 text-muted-foreground/50 sm:h-8 sm:w-8" />
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="p-2.5 sm:p-4">
                          <h3 className="text-xs font-medium leading-tight line-clamp-2 group-hover:text-primary transition-colors sm:text-sm">
                            {product.name}
                          </h3>
                          <p className="mt-1 text-sm font-bold text-primary sm:mt-2 sm:text-base">
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
