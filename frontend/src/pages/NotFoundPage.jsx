import { Link } from 'react-router-dom';
import '../styles/pages/contract-detail.css';

function NotFoundPage() {
  return (
    <div className="detail-page" style={{ textAlign: 'center', paddingTop: 80 }}>
      <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 28, fontWeight: 600, color: '#1B2430' }}>
        404
      </h1>
      <p style={{ color: '#5B6472', marginTop: 8, marginBottom: 24 }}>
        The page you are looking for does not exist.
      </p>
      <Link to="/" className="btn btn-primary">
        Go to Dashboard
      </Link>
    </div>
  );
}

export default NotFoundPage;
