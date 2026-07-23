export default function AccountLoading() {
  return (
    <div className="account-content-stack" aria-busy="true" aria-label="Loading account">
      <section className="account-page-heading">
        <div className="skeleton-line skeleton-label" />
        <div className="skeleton-line skeleton-title" />
        <div className="skeleton-line skeleton-copy" />
      </section>
      <section className="account-stat-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <article key={index}>
            <div className="skeleton-block" />
            <div className="skeleton-line skeleton-label" />
            <div className="skeleton-line skeleton-title" />
          </article>
        ))}
      </section>
    </div>
  );
}
