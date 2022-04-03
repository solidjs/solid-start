import { buildSchema } from "graphql";
import { processRequest } from "graphql-helix";
import { RequestContext } from "solid-start/entry-server";
import { json } from "solid-start/server";
import renderPlayground from "@magiql/ide/render";

const graphQLServer = async (schema, query, vars, request) => {
  try {
    const response = await processRequest({
      query,
      variables: vars ?? {},
      request,
      schema
    });

    switch (response.type) {
      case "RESPONSE": {
        return response.payload;
      }
      default: {
        throw new Error("Hello world");
      }
    }
  } catch (e) {
    console.log(e);
  }
};

const schema = buildSchema(`
  type Query {
    hello: String
  }
`);

// GraphQL API endpoint
export async function post({ request }: RequestContext) {
  const { query, variables } = await request.json();
  return json(await graphQLServer(schema, query, variables, request));
}

// render GraphiQL playground
export async function get({ request }: RequestContext) {
  return new Response(
    renderPlayground({
      uri: "/api/graphql"
    }),
    {
      headers: {
        "Content-Type": "text/html"
      }
    }
  );
}
