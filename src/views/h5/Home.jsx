import { Link } from 'react-router-dom';

const categories = ['奶油新品', '像素包包', '甜点香氛', '收藏摆件'];

const products = [
  {
    id: 1,
    name: '草莓云朵像素包',
    tag: '收藏卡 No.01',
    price: 129,
    tone: 'pm-pixel-product-pink',
  },
  {
    id: 2,
    name: '杏仁奶油发夹',
    tag: '收藏卡 No.02',
    price: 59,
    tone: 'pm-pixel-product-cream',
  },
  {
    id: 3,
    name: '金色糖霜小镜',
    tag: '收藏卡 No.03',
    price: 88,
    tone: 'pm-pixel-product-gold',
  },
];

const Home = () => {
  return (
    <main className="pm-page pm-home-page">
      <header className="pm-home-header">
        <Link className="pm-home-brand" to="/home" aria-label="返回首页">
          <span className="pm-home-brand-pixel" />
          Peach Pixel
        </Link>
        <nav className="pm-home-nav" aria-label="主导航">
          <Link to="/home">首页</Link>
          <Link to="/orderList">订单</Link>
          <Link to="/admin/login">后台</Link>
        </nav>
      </header>

      <section className="pm-home-hero">
        <span className="pm-sticker-label pm-home-hero-sticker pm-home-hero-sticker-soft">new drop</span>
        <span className="pm-sticker-label pm-home-hero-sticker pm-home-hero-sticker-star">+</span>
        <div className="pm-home-hero-copy">
          <p className="pm-section-eyebrow">Soft Pixel Collection</p>
          <h1>奶油粉色系像素商城</h1>
          <p className="pm-home-hero-text">
            把少女感小物做成一张张可收藏的商品卡，柔软配色里保留像素边框的俏皮质感。
          </p>
          <div className="pm-home-note-list" aria-label="商城特色">
            <span>像素边框</span>
            <span>柔和粉杏</span>
            <span>收藏编号</span>
          </div>

          <form className="pm-search pm-home-search">
            <input aria-label="搜索商品" placeholder="搜索像素包、发夹、香氛..." />
            <button className="pm-btn pm-btn-primary" type="submit">搜索</button>
          </form>

          <div className="pm-home-actions">
            <Link className="pm-btn pm-btn-primary" to="/detail/1">查看新品</Link>
            <Link className="pm-btn pm-btn-ghost" to="/orderList">我的收藏</Link>
          </div>
        </div>

        <div className="pm-product-card pm-product-card-collectible pm-home-feature-card" aria-label="精选商品卡片">
          <div className="pm-sticker-label pm-home-card-ribbon">Limited</div>
          <span className="pm-pixel-tape" />
          <div className="pm-pixel-product pm-pixel-product-large pm-pixel-product-pink">
            <span className="pm-pixel-sparkle pm-pixel-sparkle-one" />
            <span className="pm-pixel-sparkle pm-pixel-sparkle-two" />
          </div>
          <div className="pm-home-card-info">
            <span>Strawberry Dream</span>
            <strong>¥129</strong>
          </div>
        </div>
      </section>

      <section className="pm-home-category-row" aria-label="商品分类">
        {categories.map((category, index) => (
          <button className="pm-home-category-chip" type="button" key={category}>
            <span className="pm-sticker-index">{String(index + 1).padStart(2, '0')}</span>
            {category}
          </button>
        ))}
      </section>

      <section className="pm-home-section-heading">
        <div>
          <p className="pm-section-eyebrow">Pixel Cards</p>
          <h2>今日收藏卡片</h2>
        </div>
        <Link to="/home">全部商品</Link>
      </section>

      <section className="pm-product-grid pm-home-product-grid">
        {products.map((product, index) => (
          <article className="pm-product-card pm-product-card-collectible pm-home-product-card" key={product.id}>
            <span className="pm-sticker-label pm-home-product-sticker">{String(index + 1).padStart(2, '0')}</span>
            <div className={`pm-pixel-product ${product.tone}`} />
            <div className="pm-home-product-meta">
              <span>{product.tag}</span>
              <h3 className="pm-product-title">{product.name}</h3>
              <div className="pm-product-foot">
                <strong className="pm-price">¥{product.price}</strong>
                <Link to={`/detail/${product.id}`}>详情</Link>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="pm-home-feature-strip">
        <div>
          <span className="pm-sticker-index">01</span>
          <p>像素边框</p>
        </div>
        <div>
          <span className="pm-sticker-index">02</span>
          <p>柔和粉杏</p>
        </div>
        <div>
          <span className="pm-sticker-index">03</span>
          <p>收藏编号</p>
        </div>
      </section>
    </main>
  );
};

export default Home;
