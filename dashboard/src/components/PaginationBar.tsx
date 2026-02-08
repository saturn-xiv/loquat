import { FormattedMessage } from "react-intl";

import { type IPagination, type IPage } from "../api";
import { useState } from "react";

export const DEFAULT_PAGE_SIZE = 60;
export const DEFAULT_PAGE_INDEX = 1;

interface IProps {
  pagination: IPagination;
  handleSelect: (page: IPage) => Promise<void>;
}

const cal_size = (i: number): number => {
  if (i < 10) {
    return 10;
  }
  if (i > 1000) {
    return 1000;
  }
  return i;
};

interface IButtonItemProps {
  index: number;
  page: IPage;
  handleSelect: (page: IPage) => Promise<void>;
}

const ButtonItem = ({ index, page, handleSelect }: IButtonItemProps) => {
  return (
    <li>
      <a
        href="#"
        className={`pagination-link ${
          index === page.index ? "is-current" : ""
        }`}
        onClick={async () => {
          await handleSelect({ size: page.size, index });
        }}
      >
        {index}
      </a>
    </li>
  );
};

interface IButtonGroupProps {
  page: IPage;
  max: number;
  handleSelect: (page: IPage) => Promise<undefined>;
}

const ButtonGroup = ({ max, page, handleSelect }: IButtonGroupProps) => {
  if (max <= 12) {
    return Array.from({ length: max }, (_, i) => 1 + i).map((i) => (
      <ButtonItem key={i} index={i} page={page} handleSelect={handleSelect} />
    ));
  }
  if (page.index <= 3) {
    const length = 5;
    return (
      <>
        {Array.from({ length }, (_, i) => 1 + i).map((i) => (
          <ButtonItem
            key={i}
            index={i}
            page={page}
            handleSelect={handleSelect}
          />
        ))}
        <li>
          <span className="pagination-ellipsis">&hellip;</span>
        </li>
        <ButtonItem index={max} page={page} handleSelect={handleSelect} />
      </>
    );
  }
  if (page.index >= max - 3) {
    const length = 5;
    return (
      <>
        <ButtonItem index={1} page={page} handleSelect={handleSelect} />
        <li>
          <span className="pagination-ellipsis">&hellip;</span>
        </li>
        {Array.from({ length }, (_, i) => 1 + i).map((i) => (
          <ButtonItem
            key={i}
            index={max - length + i}
            page={page}
            handleSelect={handleSelect}
          />
        ))}
      </>
    );
  }
  return (
    <>
      <ButtonItem index={1} page={page} handleSelect={handleSelect} />
      <li>
        <span className="pagination-ellipsis">&hellip;</span>
      </li>
      <ButtonItem
        index={page.index - 1}
        page={page}
        handleSelect={handleSelect}
      />
      <ButtonItem index={page.index} page={page} handleSelect={handleSelect} />
      <ButtonItem
        index={page.index + 1}
        page={page}
        handleSelect={handleSelect}
      />
      <li>
        <span className="pagination-ellipsis">&hellip;</span>
      </li>
      <ButtonItem index={max} page={page} handleSelect={handleSelect} />
    </>
  );
};

const Widget = ({ pagination, handleSelect }: IProps) => {
  const [index, setIndex] = useState<number>(pagination.index);
  const min = 1;
  const size = cal_size(pagination.size);
  const max =
    Math.floor(pagination.total / size) +
    (pagination.total % size === 0 ? 0 : 1);

  if (max <= 1) {
    return <></>;
  }
  return (
    <nav
      className="pagination is-small"
      role="navigation"
      aria-label="pagination"
    >
      <a
        href="#"
        onClick={async () => {
          const cur = index - 1;
          if (cur >= min) {
            await handleSelect({ size, index: cur });
            setIndex(cur);
          }
        }}
        className="pagination-previous"
      >
        <FormattedMessage id="buttons.previous" />
      </a>
      <a
        href="#"
        onClick={async () => {
          const cur = index + 1;
          if (cur <= max) {
            await handleSelect({ size, index: cur });
            setIndex(cur);
          }
        }}
        className="pagination-next"
      >
        <FormattedMessage id="buttons.next" />
      </a>
      <ul className="pagination-list">
        <ButtonGroup
          page={{ size, index: pagination.index }}
          max={max}
          handleSelect={async (page: IPage) => {
            await handleSelect(page);
            setIndex(page.index);
          }}
        />
      </ul>
    </nav>
  );
};

export default Widget;
