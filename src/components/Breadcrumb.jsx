import { Link } from 'react-router-dom';

export default function Breadcrumb({ items }) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <ol>
        {items.map((it, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i}>
              {isLast || !it.to ? <span aria-current="page">{it.label}</span> : <Link to={it.to}>{it.label}</Link>}
              {!isLast && <span className="sep">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
