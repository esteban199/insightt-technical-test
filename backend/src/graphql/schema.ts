export const typeDefs = `#graphql
  type Task {
    id: ID!
    title: String!
    description: String
    status: String!
    ownerId: String!
    version: Int!
    doneAt: String
    doneBy: String
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    "Trivial root query — GraphQL requires at least one. Real reads go through the REST API."
    health: String!
  }

  type Mutation {
    "The one place a task can be marked DONE — see req. #10 in the spec."
    markTaskDone(id: ID!): Task!
  }
`;
