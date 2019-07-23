'use strict';

var keyBy = require('lodash.keyby');
var mapValues = require('lodash.mapvalues');

function isQueryDef (def) {
  return def.kind === 'OperationDefinition' && def.operation === 'query';
}

function flattenSelection (selection) {
  function tagSelection (childSelection) {
    return Object.assign({}, childSelection, {
      typeCondition: selection.typeCondition
    });
  }

  if (selection.kind === 'InlineFragment') {
    var selections = flattenSelections(selection.selectionSet.selections);

    if (selection.typeCondition) {
      return selections.map(tagSelection);
    } else {
      return selections;
    }
  } else {
    return [selection];
  }
}

function flattenSelections (selections) {
  return [].concat.apply([], selections.map(flattenSelection));
}

function mergeSelectionSets (left, right) {
  if (left == null) {
    return right;
  }

  if (right == null) {
    return left;
  }

  return Object.assign({}, right, {
    selections: [].concat(
      left.selections,
      right.selections
    )
  });
}

function mergeSelectionValues (left, right) {
  return Object.assign({}, right, {
    selectionSet: mergeSelectionSets(
      left.selectionSet,
      right.selectionSet
    )
  });
}

function aggregateSelection (obj, sel) {
  var key = sel.alias ? sel.alias.value : sel.name.value;

  if (obj[key]) {
    obj[key] = mergeSelectionValues(obj[key], sel);
  } else {
    obj[key] = sel;
  }

  return obj;
}

function parseSelectionValue (selection) {
  // TODO: assert selection.kind === 'Field'

  return {
    name: selection.name.value,
    arguments: selection.arguments,
    typeCondition: selection.typeCondition,
    fields: selection.selectionSet && makeFields(selection.selectionSet.selections)
  };
}

function aggregateSelections (selections) {
  return mapValues(
    selections.reduce(aggregateSelection, {}),
    parseSelectionValue
  );
}

function makeFields (selections) {
  return aggregateSelections(
    flattenSelections(selections)
  );
}

function convertDef (def) {
  return {
    name: def.name.value,
    fields: makeFields(def.selectionSet.selections)
  };
}

function fromDocumentAST (ast) {
  var queryDefs = ast.definitions
    .filter(isQueryDef)
    .map(convertDef);

  var querySet = keyBy(queryDefs, 'name');

  return {
    querySet: querySet
  };
}

function fromFragment (fragment) {
  return makeFields(fragment.ast.definitions[0].selectionSet.selections);
}

Object.assign(exports, {
  fromDocumentAST: fromDocumentAST,
  fromFragment: fromFragment
});
