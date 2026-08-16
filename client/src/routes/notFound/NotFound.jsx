import { Link } from 'react-router-dom';
import { FiHome, FiList } from 'react-icons/fi';
import './notFound.scss';

function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <p className="not-found-brand">Suretreaven</p>
        <div className="error-code">404</div>
        <h1>This property seems to have moved.</h1>
        <p>
          The page you&apos;re looking for could not be found. It may have been removed,
          renamed, or is temporarily unavailable.
        </p>

        <div className="action-buttons">
          <Link to="/" className="btn-home">
            <FiHome />
            Back to Home
          </Link>
          <Link to="/list" className="btn-explore">
            <FiList />
            Explore Properties
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
