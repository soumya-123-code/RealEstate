import './AuthLoadingScreen.scss';

function AuthLoadingScreen({ message = 'Checking your session…' }) {
  return (
    <div className="auth-loading-screen" role="status" aria-live="polite">
      <div className="auth-loading-screen__card">
        <div className="auth-loading-screen__brand">Suretreaven</div>
        <div className="auth-loading-screen__spinner" aria-hidden="true" />
        <p className="auth-loading-screen__message">{message}</p>
      </div>
    </div>
  );
}

export default AuthLoadingScreen;
