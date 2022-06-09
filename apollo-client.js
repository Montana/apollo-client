import { useMemo } from "react";
import { ApolloClient, gql } from "@apollo/client";
import merge from "deepmerge";
import { cache } from "./cache";
import { isSSR } from "../constants/util";
import isEqual from "lodash/isEqual";

export const APOLLO_STATE_PROP_NAME = "__APOLLO_STATE__";

const typeDefs = gql`
  extend type Query {
    draftComplaints: [Complaint]
  }
`;

let apolloClient;

function createIsomorphLink() {
  const { HttpLink } = require("@apollo/client/link/http");
  return new HttpLink({
    uri: "http://localhost:4000/api/graphql",
    credentials: "same-origin",
  });
}

function createApolloClient() {
  let defaultOptions;
  if (typeof window === "undefined") {
    defaultOptions = {
      query: {
        fetchPolicy: "no-cache",
        errorPolicy: "all",
      },
    };
  } else {
    defaultOptions = {
      query: {
        fetchPolicy: "cache-and-network",
        errorPolicy: "all",
      },
    };
  }
  return new ApolloClient({
    ssrMode: typeof window === "undefined",
    link: createIsomorphLink(),
    cache,
    typeDefs,
    defaultOptions,
  });
}

export function initializeApollo(initialState = null) {
  const _apolloClient = apolloClient ?? createApolloClient();

  if (initialState) {
    const existingCache = _apolloClient.extract();

    const data = merge(initialState, existingCache, {
      arrayMerge: (destinationArray, sourceArray) => [
        ...sourceArray,
        ...destinationArray.filter((d) =>
          sourceArray.every((s) => !isEqual(d, s))
        ),
      ],
    });
    _apolloClient.cache.restore(data);
  }

  if (isSSR()) return _apolloClient;
  if (!apolloClient) apolloClient = _apolloClient;

  return _apolloClient;
}

export function useApollo(pageProps) {
  const state = pageProps[APOLLO_STATE_PROP_NAME];
  const store = useMemo(() => initializeApollo(state), [state]);
  return store;
}

export function addApolloState(client, pageProps) {
  if (pageProps?.props) {
    pageProps.props[APOLLO_STATE_PROP_NAME] = client.cache.extract();
  }

  return pageProps;
}
