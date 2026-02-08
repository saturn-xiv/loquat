import type { INetworkInterface } from "../../api/router";

interface IProps {
  item: INetworkInterface;
}

const Widget = ({ item }: IProps) => {
  return (
    <div className="cell">
      <div className="card">
        <header className="card-header">
          <p className="card-header-title">{item.name}</p>
          <button className="card-header-icon" aria-label="more options">
            <span className="icon">
              <i className="fas fa-angle-down" aria-hidden="true"></i>
            </span>
          </button>
        </header>
        <div className="card-content">
          <div className="content">
            <div>MAC:&nbsp; {item.hardwareAddress}</div>
            <div>
              Addresses:
              <ul>
                {item.addresses.map((it, id) => (
                  <li key={id}>{it}</li>
                ))}
              </ul>
            </div>
            <div>
              Multicast addresses:
              <ul>
                {item.multicastAddresses.map((it, id) => (
                  <li key={id}>{it}</li>
                ))}
              </ul>
            </div>
            <div>
              {item.label}
              <br />
              {item.memo}
            </div>
          </div>
        </div>
        <footer className="card-footer"></footer>
      </div>
    </div>
  );
};
export default Widget;
