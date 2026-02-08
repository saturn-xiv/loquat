import { useState, type ReactNode } from "react";

interface IProps {
  title: string;
  button: { action: string; label: string };
  children: ReactNode;
  handleRefresh: () => Promise<void>;
  footer?: ReactNode;
}

const Widget = (props: IProps) => {
  const [show, setShow] = useState<boolean>(false);
  const handleClose = async () => {
    await props.handleRefresh();
    setShow(false);
  };
  return (
    <>
      <button
        onClick={() => {
          setShow(true);
        }}
        className={`button is-${props.button.action}`}
      >
        {props.button.label}
      </button>
      <div className={`modal ${show ? "is-active" : ""}`}>
        <div className="modal-background"></div>
        <div className="modal-card">
          <header className="modal-card-head">
            <p className="modal-card-title">{props.title}</p>
            <button
              className="delete"
              aria-label="close"
              onClick={handleClose}
            />
          </header>
          <section className="modal-card-body">{props.children}</section>
          <footer className="modal-card-foot">
            {props.footer && props.footer}
          </footer>
        </div>
      </div>
    </>
  );
};

export default Widget;
