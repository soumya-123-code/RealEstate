import { Link } from 'react-router-dom';
import { FiHome, FiArrowLeft } from 'react-icons/fi';
import './notFound.scss';

function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <div className="error-code">404</div>
        <h1>Page Not Found</h1>
        <p>Sorry, the page you're looking for doesn't exist or has been moved.</p>
        
        <div className="action-buttons">
          <Link to="/" className="btn-home">
            <FiHome />
            Go Home
          </Link>
          <button onClick={() => window.history.back()} className="btn-back">
            <FiArrowLeft />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
