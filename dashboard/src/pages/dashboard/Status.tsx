import { FormattedMessage } from "react-intl";

interface IProps {
  title: string;
  content: string;
}

const Widget = ({ title, content }: IProps) => {
  return (
    <div className="cell">
      <div className="card">
        <header className="card-header">
          <p className="card-header-title">
            <FormattedMessage
              id={`pages.dashboard.home.system-status.${title}`}
            />
          </p>
          <button className="card-header-icon" aria-label="more options">
            <span className="icon">
              <i className="fas fa-angle-down" aria-hidden="true"></i>
            </span>
          </button>
        </header>
        <div className="card-content">
          <div className="content">
            <pre className="pre-scrollable">{content}</pre>
          </div>
        </div>
        <footer className="card-footer"></footer>
      </div>
    </div>
  );
};

export default Widget;
