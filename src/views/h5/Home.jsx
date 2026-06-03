import React from 'react';
import { Link } from 'react-router-dom';

const categories = ['奶油新品', '像素包包', '甜点香氛', '收藏摆件'];

const products = [
  {
    id: 1,
    name: '草莓云朵像素包',
    tag: '收藏卡 No.01',
    price: 129,
    tone: 'pink',
  },
  {
    id: 2,
    name: '杏仁奶油发夹',
    tag: '收藏卡 No.02',
    price: 59,
    tone: 'cream',
  },
  {
    id: 3,
    name: '金色糖霜小镜',
    tag: '收藏卡 No.03',
    price: 88,
    tone: 'gold',
  },
];

const Home = () => {
  return (
    <main className="pixel-shop">
      <header className="shop-header">
        <Link className="brand-mark" to="/home" aria-label="返回首页">
          <span className="brand-pixel" />
          Peach Pixel
        </Link>
        <nav className="shop-nav" aria-label="主导航">
          <Link to="/home">首页</Link>
          <Link to="/orderList">订单</Link>
          <Link to="/login">后台</Link>
        </nav>
      </header>

      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Soft Pixel Collection</p>
          <h1>奶油粉色系像素商城</h1>
          <p className="hero-text">
            把少女感小物做成一张张可收藏的商品卡，柔软配色里保留像素边框的俏皮质感。
          </p>

          <form className="search-box">
            <input aria-label="搜索商品" placeholder="搜索像素包、发夹、香氛..." />
            <button type="submit">搜索</button>
          </form>

          <div className="hero-actions">
            <Link className="pixel-button primary" to="/detail/1">查看新品</Link>
            <Link className="pixel-button" to="/orderList">我的收藏</Link>
          </div>
        </div>

        <div className="hero-card" aria-label="精选商品卡片">
          <div className="card-ribbon">Limited</div>
          <div className="pixel-product pixel-product-large pink">
            <span className="pixel-sparkle one" />
            <span className="pixel-sparkle two" />
          </div>
          <div className="hero-card-info">
            <span>Strawberry Dream</span>
            <strong>¥129</strong>
          </div>
        </div>
      </section>

      <section className="category-row" aria-label="商品分类">
        {categories.map((category) => (
          <button className="category-chip" type="button" key={category}>{category}</button>
        ))}
      </section>

      <section className="section-heading">
        <div>
          <p className="eyebrow">Pixel Cards</p>
          <h2>今日收藏卡片</h2>
        </div>
        <Link to="/home">全部商品</Link>
      </section>

      <section className="product-grid">
        {products.map((product) => (
          <article className="product-card" key={product.id}>
            <div className={`pixel-product ${product.tone}`} />
            <div className="product-meta">
              <span>{product.tag}</span>
              <h3>{product.name}</h3>
              <div className="product-footer">
                <strong>¥{product.price}</strong>
                <Link to={`/detail/${product.id}`}>详情</Link>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="feature-strip">
        <div>
          <span className="mini-icon">01</span>
          <p>像素边框</p>
        </div>
        <div>
          <span className="mini-icon">02</span>
          <p>柔和粉杏</p>
        </div>
        <div>
          <span className="mini-icon">03</span>
          <p>收藏编号</p>
        </div>
      </section>
    </main>
  );
};

export default Home;
