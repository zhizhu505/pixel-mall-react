import { Link, useNavigate, useParams } from 'react-router-dom';

import EmptyState from '../components/common/EmptyState';
import { carouselActivities } from '../mock/activities';

const ActivityPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const activity = carouselActivities.find((item) => item.slug === slug);

  if (!activity) {
    return (
      <main className="pm-page pm-activity-page">
        <EmptyState
          title="活动不存在"
          description="该活动可能已结束，返回首页看看其他优惠。"
          action={<Link className="pm-btn pm-btn-primary" to="/home">返回首页</Link>}
        />
      </main>
    );
  }

  return (
    <main className="pm-page pm-activity-page">
      <button className="pm-btn pm-btn-ghost pm-back-btn" type="button" onClick={() => navigate(-1)}>返回</button>
      <section className="pm-activity-hero">
        <div className="pm-activity-copy">
          <p className="pm-activity-kicker">Pixel Mall 活动</p>
          <h1>{activity.title}</h1>
          <p className="pm-activity-subtitle">{activity.subtitle}</p>
          <p className="pm-activity-desc">{activity.description}</p>
          {activity.cta ? <Link className="pm-btn pm-btn-primary" to={activity.cta.to}>{activity.cta.label}</Link> : null}
        </div>
        <div className="pm-activity-media">
          {activity.cover ? <img src={activity.cover} alt={activity.title} /> : null}
        </div>
      </section>
      {activity.highlights?.length ? (
        <section className="pm-activity-section">
          <h2>活动亮点</h2>
          <div className="pm-activity-highlight-grid">
            {activity.highlights.map((highlight) => (
              <article className="pm-activity-highlight" key={highlight}>{highlight}</article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
};

export default ActivityPage;
