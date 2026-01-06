import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageMeta } from "@/components/PageMeta";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Grid3X3, LayoutGrid, Sparkles } from "lucide-react";
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
      <section className="relative overflow-hidden border-b border-border pt-24 pb-16">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/5 blur-[120px] rounded-full" />
        
        <div className="container relative mx-auto px-4">
          <div className="text-center">
            <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
              <Sparkles className="mr-1 h-3 w-3" />
              {products.length} Products • {brands.length} Brands
            </Badge>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl tracking-tight">
              MARKETPLACE
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground text-lg">
              Premium combat sports gear trusted by professional fighters worldwide.
            </p>
          </div>

          {/* Search & Filters */}
          <div className="mx-auto mt-10 max-w-4xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search products or brands..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 pl-12 text-base bg-card/50 backdrop-blur-sm border-border/50 focus:border-primary/50"
                />
              </div>
              <div className="flex gap-3">
                <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                  <SelectTrigger className="h-12 w-full sm:w-[160px] bg-card/50 backdrop-blur-sm border-border/50">
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
                    <SelectTrigger className="h-12 w-full sm:w-[160px] bg-card/50 backdrop-blur-sm border-border/50">
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
            
            {/* Active Filters */}
            {(selectedBrand !== "all" || selectedCategory !== "all" || searchQuery) && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">Showing:</span>
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    "{searchQuery}"
                    <button onClick={() => setSearchQuery("")} className="ml-1 hover:text-primary">×</button>
                  </Badge>
                )}
                {selectedBrand !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {brands.find(b => b.id === selectedBrand)?.name}
                    <button onClick={() => setSelectedBrand("all")} className="ml-1 hover:text-primary">×</button>
                  </Badge>
                )}
                {selectedCategory !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {selectedCategory}
                    <button onClick={() => setSelectedCategory("all")} className="ml-1 hover:text-primary">×</button>
                  </Badge>
                )}
                <button 
                  onClick={() => { setSearchQuery(""); setSelectedBrand("all"); setSelectedCategory("all"); }}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Products by Brand */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {filteredProducts.length === 0 ? (
            <div className="py-24 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold">No products found</h3>
              <p className="mt-2 text-muted-foreground">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <div className="space-y-20">
              {productsByBrand.map(({ brand, products: brandProducts }) => (
                <div key={brand?.id || "no-brand"}>
                  {/* Brand Header */}
                  <div className="mb-8 flex items-center gap-4">
                    {brand?.logo_url ? (
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-card border border-border p-2">
                        <img
                          src={brand.logo_url}
                          alt={brand.name}
                          className="h-full w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                        <span className="font-display text-xl text-primary">
                          {(brand?.name || brandProducts[0]?.brand || "O").charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <h2 className="font-display text-2xl md:text-3xl">
                        {brand?.name || brandProducts[0]?.brand || "Other Products"}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {brandProducts.length} {brandProducts.length === 1 ? "product" : "products"}
                      </p>
                    </div>
                  </div>

                  {/* Products Grid */}
                  <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {brandProducts.map((product) => (
                      <Link
                        key={product.id}
                        to={`/p/${product.slug}`}
                        className="group relative block overflow-hidden rounded-2xl bg-card border border-border/50 transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
                      >
                        {/* Discount Badge */}
                        {product.discount_percentage && product.discount_percentage > 0 && (
                          <div className="absolute left-3 top-3 z-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 px-2.5 py-1 text-xs font-bold text-white shadow-lg">
                            -{product.discount_percentage}%
                          </div>
                        )}

                        {/* Product Image */}
                        <div className="aspect-square overflow-hidden bg-muted/50">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Grid3X3 className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="p-4">
                          <h3 className="text-sm font-medium leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                            {product.name}
                          </h3>
                          <p className="mt-2 text-base font-bold text-primary">
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
