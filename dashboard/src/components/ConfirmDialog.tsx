import { useState, type ReactNode } from "react";
import { FormattedMessage } from "react-intl";

interface IProps {
  title: string;
  button: { action: string; label: string };
  children: ReactNode;
  onSubmit: () => Promise<void>;
}

const Widget = (props: IProps) => {
  const [show, setShow] = useState<boolean>(false);

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
              onClick={() => {
                setShow(false);
              }}
              className="delete"
              aria-label="close"
            ></button>
          </header>
          <section className="modal-card-body">{props.children}</section>
          <footer className="modal-card-foot">
            <div className="buttons">
              <button
                onClick={async () => {
                  await props.onSubmit();
                  setShow(false);
                }}
                className="button is-success"
              >
                <FormattedMessage id="buttons.submit" />
              </button>
              <button
                onClick={() => {
                  setShow(false);
                }}
                className="button"
              >
                <FormattedMessage id="buttons.cancel" />
              </button>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
};

export default Widget;
