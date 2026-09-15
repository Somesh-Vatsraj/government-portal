export default function ImportantLinks({ post }) {
  const links = [
    post.apply_link && { href: post.apply_link, label: 'Apply Online', variant: 'primary' },
    post.notification_link && { href: post.notification_link, label: 'Download Notification', variant: 'outline' },
    post.download_link && { href: post.download_link, label: 'Download', variant: 'outline' },
    post.official_website && { href: post.official_website, label: 'Official Website', variant: 'outline' }
  ].filter(Boolean);

  if (!links.length) return null;

  return (
    <section className="important-links">
      <h2>Important Links</h2>
      <div className="link-buttons">
        {links.map((l) => (
          <a
            key={l.label}
            href={l.href}
            className={`btn ${l.variant === 'primary' ? 'btn-primary' : 'btn-outline'} btn-block`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {l.label} ↗
          </a>
        ))}
      </div>
    </section>
  );
}
