export default function AdSlot({ position = 'default' }) {
  return (
    <div className={`ad-slot ad-${position}`} aria-hidden="true">
      <div className="ad-slot-inner">
        <span>Advertisement</span>
      </div>
    </div>
  );
}
