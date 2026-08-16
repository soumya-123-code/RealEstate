import { Link } from 'react-router-dom';
import './ErrorPage.scss';

function ErrorPage() {
  return (
    <div className="error-page">
      <div className="error-content">
        <div className="error-icon">🏚️</div>
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>Sorry, the page you are looking for does not exist or has been moved.</p>
        <Link to="/" className="btn btn-primary btn-lg">
          Go Back Home
        </Link>
      </div>
    </div>
  );
}

export default ErrorPage;
