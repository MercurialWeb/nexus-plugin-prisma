<p align="center">
  <img src="https://i.imgur.com/8qvElTM.png" width="300" align="center" />
  <h1 align="center">@mercurialweb/nexus-plugin-prisma</h1>
</p>

\*_Latest version of Prisma supported: 7.1.0_

**Note:** Since the Prisma team is no longer keeping this library up to date with new Prisma versions, we have forked it.

This plugin integrates [Prisma](https://www.prisma.io/) into [Nexus](https://nexusjs.org/). It gives you an API you to project fields from models defined in your Prisma schema into your GraphQL API. It also gives you an API to build GraphQL root fields that allow your API clients to query and mutate data.

You can find the [documentation on the Nexus website](https://nexusjs.org/docs/plugins/prisma/overview).

## New Features

### Automatic Filtering for Relations

By default, all relational fields now include a `where` parameter allowing you to filter related records, if the underlying Prisma model supports filtering. This makes it easy to query only specific related items without additional configuration.

For example, with a User model related to Posts:

```ts
// User type with related Posts
objectType({
  name: 'User',
  definition(t) {
    t.model.id()
    t.model.name()
    t.model.posts() // automatically includes where parameter for filtering
  },
})
```

This allows GraphQL queries like:

```graphql
{
  user(id: 1) {
    posts(where: { title: { contains: "Nexus" } }) {
      id
      title
    }
  }
}
```

You can disable this behavior by explicitly setting `filtering: false` when defining the field:

```ts
t.model.posts({ filtering: false })
```

Note: If a relation doesn't have filtering capabilities in the generated Prisma client, the filtering parameter will be silently omitted rather than causing an error.

## Installation

```
npm install @mercurialweb/nexus-plugin-prisma
# OR
yarn add @mercurialweb/nexus-plugin-prisma
```
