import './Skeleton.scss';

export const PropertyCardSkeleton = () => (
  <div className="skeleton-card">
    <div className="skeleton-image shimmer" />
    <div className="skeleton-content">
      <div className="skeleton-title shimmer" />
      <div className="skeleton-price shimmer" />
      <div className="skeleton-text shimmer" />
      <div className="skeleton-text short shimmer" />
      <div className="skeleton-features shimmer" />
    </div>
  </div>
);

export const PropertyListSkeleton = ({ count = 6 }) => (
  <div className="skeleton-grid">
    {Array.from({ length: count }).map((_, i) => (
      <PropertyCardSkeleton key={i} />
    ))}
  </div>
);

export const ProfileSkeleton = () => (
  <div className="skeleton-profile">
    <div className="skeleton-avatar shimmer" />
    <div className="skeleton-name shimmer" />
    <div className="skeleton-email shimmer" />
    <div className="skeleton-details shimmer" />
  </div>
);

export const TextSkeleton = ({ width = '100%', height = '16px' }) => (
  <div className="skeleton-text-custom shimmer" style={{ width, height }} />
);
