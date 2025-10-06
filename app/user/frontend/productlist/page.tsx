'use client';

import InfiniteScroll from 'react-infinite-scroll-component';
import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import './page.css';

import { Input, Select, Col, Row, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

import MainLayout from '@/app/components/mainlayout';
import ProductCard, { Product } from '../productcard/page';

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('');
  const [debouncedSearch] = useDebounce(search, 500);

  const fetchProducts = async (pageNum: number, searchText = '', sortValue = '') => {
    try {
      const res = await fetch(`/api/product?page=${pageNum}&limit=8&search=${searchText}&sort=${sortValue}`);
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      if (pageNum === 1) {
        setProducts(data.products);
      } else {
        setProducts((prev) => [...prev, ...data.products]);
      }
      setHasMore(data.hasMore);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchProducts(1, debouncedSearch, sort);
  }, [debouncedSearch, sort]);

  const loadMore = () => {
    const nextPage = page + 1;
    fetchProducts(nextPage, debouncedSearch, sort);
    setPage(nextPage);
  };

  return (
    <MainLayout >
      <div className='products-header gap-[12px]'>
        <h4 className="products-title"> Our Products</h4>
        <div className='inputs-div' >
          <Input className='!w-full max-w-[350px]'
            styles={{
              input: {
                paddingTop: '6px',
                paddingBottom: '6px',
              },
            }}
            placeholder='Search by title'
            addonAfter={<SearchOutlined ></SearchOutlined>}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}>
          </Input>

          <Select value={sort}
            onChange={(value) => { setSort(value); setPage(1); }}
            className='my-select'
            style={{ width: 150 }}>
            <Select.Option value=''>Sort by</Select.Option>
            <Select.Option value='price-asc'>Price: Low to High</Select.Option>
            <Select.Option value='price-desc'>Price: High to Low</Select.Option>
          </Select>
        </div>
      </div>

      <InfiniteScroll
        dataLength={products.length}
        next={loadMore}
        hasMore={hasMore}
        loader={
          <div className='flex justify-center my-6'>
            <Spin size='large' />
          </div>}
        endMessage={<p className='text-center mt-6'>No more products 🛒</p>}
      >
        <Row gutter={[30, 32]}>
          {products.map((p) => (
            <Col span={6}
              key={p.id}
              lg={6}
              md={8}
              sm={12}
              xs={24}>
              <ProductCard
              title={p.title} img={p.img} price={p.price} id={p.id} colour={p.colour} size={p.size} stock={p.stock} />
            </Col>))}
        </Row>

      </InfiniteScroll>

    </MainLayout>
  );
}

export default App;
