'use strict';

var ldmap = require('lodash.map');

function makeName (value) {
  return {
    kind: 'Name',
    value: value
  };
}

function makeSelectionSet (fields) {
  var selections = ldmap(fields, makeField);

  if (selections.length === 0) {
    return null;
  } else {
    return {
      kind: 'SelectionSet',
      selections: selections
    };
  }
}

function makeField (field, key) {
  var base = {
    kind: 'Field',
    alias: field.name !== key ? makeName(key) : null,
    name: makeName(field.name),
    arguments: field.arguments,
    selectionSet: makeSelectionSet(field.fields)
  };

  if (field.typeCondition) {
    return {
      kind: 'InlineFragment',
      typeCondition: field.typeCondition,
      selectionSet: {
        kind: 'SelectionSet',
        selections: [base]
      }
    };
  } else {
    return base;
  }
}

function makeOperationDefinition (queryOp) {
  return {
    kind: 'OperationDefinition',
    operation: 'query',
    name: makeName(queryOp.name),
    selectionSet: makeSelectionSet(queryOp.fields)
  };
}

function printQuerySet (querySet) {
  return {
    kind: 'Document',
    definitions: ldmap(querySet, makeOperationDefinition)
  };
}

Object.assign(exports, {
  printQuerySet: printQuerySet
});
