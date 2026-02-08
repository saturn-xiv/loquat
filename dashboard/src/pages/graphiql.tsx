import { GraphiQLProvider, QueryEditor } from "@graphiql/react";
import { createGraphiQLFetcher } from "@graphiql/toolkit";

const fetcher = createGraphiQLFetcher({
  url: "/graphql",
});

const Widget = () => {
  return (
    <GraphiQLProvider fetcher={fetcher}>
      <div className="graphiql-container">
        <QueryEditor />
      </div>
    </GraphiQLProvider>
  );
};

export default Widget;
