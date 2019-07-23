'use strict';

/* globals describe, it, expect */

const Printer = require('graphql-tag/printer');
const gql = require('../lib');
const QueryShape = require('../lib/query-shape');

describe('the dream GQL interface', () => {
  const theId = 'foo';

  const photoIds = ['123', 'abc', 'xyz'];

  const pricingBreakdownFragment = gql.fragment`
    total
  `;

  const albumMembershipFragment = gql.fragment`
    album {
      name

      pricing_breakdown(photo_ids: ${gql.value(photoIds)}) {
        ...${pricingBreakdownFragment}
      }
    }
  `;

  const anotherAlbumMembershipFragment = gql.fragment`
    album {
      ... on IRecord {
        id
      }

      ... on Album {
        name
      }
    }

    account {
      id
      name
    }
  `;

  const queryFragment = gql.fragment`
    albumMembership(id: ${gql.value(theId)}) {
      ...${albumMembershipFragment}
      ...${anotherAlbumMembershipFragment}
    }
  `;

  const query = gql.query`
    query theQuery {
      ...${queryFragment}
    }
  `;

  const queryShape = QueryShape.fromDocumentAST(query);
  const flatAST = QueryShape.printQuerySet(queryShape.querySet);

  it('should match AST snapshot', () => {
    expect(query).toMatchSnapshot();
  });

  it('should flatten AST stuff', () => {
    expect(queryShape).toMatchSnapshot();
  });

  it('should make a new AST', () => {
    expect(flatAST).toMatchSnapshot();
  });

  it('should serialize a generated AST', () => {
    expect(Printer.print(flatAST)).toMatchSnapshot();
  });

  it('should merge fragments', () => {
    expect(gql.mergeFragments([
      albumMembershipFragment,
      anotherAlbumMembershipFragment
    ])).toMatchSnapshot();
  });
});
