'use client';

import { useState, useEffect, useRef } from 'react';
import { useDebounce } from 'use-debounce';
import './page.css';

import { Input, Select, Col, Row, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

import MainLayout from '@/app/components/mainlayout';
import ProductCard, { ProductCardProps } from '../productcard/page';

interface ApiResponse {
  products: ProductCardProps[];
  hasMore: boolean;
}

function App() {
  const WINDOW_SIZE = 40;
  const PAGE_SIZE = 8;
  const [visibleProducts, setVisibleProducts] = useState<ProductCardProps[]>([]);
  const allProductsCache = useRef<ProductCardProps[]>([]);
  const firstPageRef = useRef(1);
  const lastPageRef = useRef(1);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('');
  const [debouncedSearch] = useDebounce(search, 500);
  const fetchDirectionRef = useRef<'prepend' | 'append' | 'reset' | null>(null);
  const hasMoreRef = useRef<boolean>(hasMore);
  const isLoadingRef = useRef<boolean>(isLoading);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedSearchRef = useRef<string>(debouncedSearch);
  const sortRef = useRef<string>(sort);


  useEffect(() => { debouncedSearchRef.current = debouncedSearch; }, [debouncedSearch]);
  useEffect(() => { sortRef.current = sort; }, [sort]);
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);
  useEffect(() => { isLoadingRef.current = isLoading; }, [isLoading]);
  const fetchPage = async (pageNum: number, mode: 'reset' | 'append' | 'prepend' = 'append') => {
    if (isLoadingRef.current) return;
    fetchDirectionRef.current = mode;
    setIsLoading(true);
    isLoadingRef.current = true;
    try {
      const qSearch = encodeURIComponent(debouncedSearchRef.current);
      const qSort = encodeURIComponent(sortRef.current || '');
      const res = await fetch(
        `/api/product/get-products?page=${pageNum}&limit=${PAGE_SIZE}&search=${qSearch}&sort=${qSort}`
      );
      if (!res.ok) throw new Error('Failed to fetch products');
      const data: ApiResponse = await res.json();
      const fetched = data.products || [];
      if (mode === 'reset') {
        allProductsCache.current = fetched.slice();
        firstPageRef.current = pageNum;
        lastPageRef.current = pageNum;
      } else if (mode === 'prepend') {
        const existingIds = new Set(allProductsCache.current.map(p => p.id));
        const newProducts = fetched.filter(p => !existingIds.has(p.id));
        if (newProducts.length === 0) {
          firstPageRef.current = Math.min(firstPageRef.current, pageNum);
        } else {
          allProductsCache.current = [...newProducts, ...allProductsCache.current];
          firstPageRef.current = pageNum;

          while (allProductsCache.current.length > WINDOW_SIZE) {
            allProductsCache.current.splice(-PAGE_SIZE, PAGE_SIZE);
            lastPageRef.current = Math.max(firstPageRef.current, lastPageRef.current - 1);
          }
          const cols = 4;
          const insertedRows = Math.ceil(newProducts.length / cols);
          const estimatedRowHeight = 320;
          setTimeout(() => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollTop += insertedRows * estimatedRowHeight;
            }
          }, 50);
        }
      } else {
        const existingIds = new Set(allProductsCache.current.map(p => p.id));
        const newProducts = fetched.filter(p => !existingIds.has(p.id));
        if (newProducts.length === 0) {
          lastPageRef.current = Math.max(lastPageRef.current, pageNum);
        } else {
          allProductsCache.current = [...allProductsCache.current, ...newProducts];
          lastPageRef.current = pageNum;

          while (allProductsCache.current.length > WINDOW_SIZE) {
            allProductsCache.current.splice(0, PAGE_SIZE);
            firstPageRef.current = Math.min(lastPageRef.current, firstPageRef.current + 1);
          }
        }
      }
      setVisibleProducts(allProductsCache.current.slice());
      setHasMore(data.hasMore);
      hasMoreRef.current = data.hasMore;
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
      fetchDirectionRef.current = null;
    }
  };
  const loadNextPage = () => {
    if (isLoadingRef.current || !hasMoreRef.current) return;
    const nextPage = lastPageRef.current + 1;
    setPage(nextPage);
    fetchPage(nextPage, 'append');
  };
  const loadPreviousPage = () => {
    if (isLoadingRef.current) return;
    if (firstPageRef.current <= 1) return;
    const prevPage = firstPageRef.current - 1;
    fetchPage(prevPage, 'prepend');
  };
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      const el = scrollContainerRef.current!;
      const scrollTop = el.scrollTop;
      const clientHeight = el.clientHeight;
      const scrollHeight = el.scrollHeight;
      if (scrollTop < 120) {
        if (!isLoadingRef.current && firstPageRef.current > 1) {
          loadPreviousPage();
        }
      }
      if (scrollTop + clientHeight > scrollHeight - 120) {
        if (!isLoadingRef.current && hasMoreRef.current) {
          loadNextPage();
        }
      }
    }, 50);
  };
  useEffect(() => {
    setPage(1);
    allProductsCache.current = [];
    firstPageRef.current = 1;
    lastPageRef.current = 1;
    setVisibleProducts([]);
    setHasMore(true);
    hasMoreRef.current = true;
    isLoadingRef.current = false;
    fetchPage(1, 'reset');
  }, [debouncedSearch, sort]);
  useEffect(() => {
    const sc = scrollContainerRef.current;
    if (!sc) return;
    const onScroll = () => handleScroll();
    sc.addEventListener('scroll', onScroll);
    return () => {
      sc.removeEventListener('scroll', onScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);
  return (
    <MainLayout>
      <div className="products-header gap-[12px]">
        <h4 className="products-title">Our Products</h4>
        <div className="inputs-div">
          <Input
            className="!w-full max-w-[350px]"
            placeholder="Search by title"
            addonAfter={<SearchOutlined />}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <Select
            value={sort}
            onChange={(value) => { setSort(value); setPage(1); }}
            className="my-select"
            style={{ width: 150 }}
          >
            <Select.Option value="">Sort by</Select.Option>
            <Select.Option value="price-asc">Price: Low to High</Select.Option>
            <Select.Option value="price-desc">Price: High to Low</Select.Option>
          </Select>
        </div>
      </div>
      <div ref={scrollContainerRef} style={{ height: 'calc(100vh - 140px)', overflow: 'auto' }}>
        {isLoading && fetchDirectionRef.current === 'prepend' && (
          <div className="flex justify-center my-4">
            <Spin size="large" />
          </div>
        )}
        <Row gutter={[30, 32]}>
          {visibleProducts.map((p: ProductCardProps) => {
     
            return (
              <Col key={p.id} lg={6} md={8} sm={12} xs={24}>
                <ProductCard
                 id={p.id}
                 isDeleted={p.isDeleted}
                  title={p.title}
                  variants={p.variants}
                />
              </Col>
            );
          })}
        </Row>
        {isLoading && fetchDirectionRef.current !== 'prepend' && (
          <div className="flex justify-center my-6">
            <Spin size="large" />
          </div>
        )}
        {!hasMore && allProductsCache.current.length > 0 && (
          <p className="text-center mt-6">No more products 🛒</p>
        )}
      </div>
    </MainLayout>
  );
}
export default App;
