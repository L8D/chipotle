'use strict';

var parse = require('graphql-tag/parser').parse;
var print = require('graphql-tag/printer').print;

function parseValue (value) {
  if (value instanceof ChipotleFragment) {
    return print(value.ast.definitions[0].selectionSet);
  } else if (value instanceof ChipotleValue) {
    return value.stringify();
  } else if (value === false || value == null) {
    return '';
  } else {
    return value;
  }
}

function makeFragment (args, top) {
  if (typeof top !== 'function') {
    top = makeFragment;
  }

  var strings = args[0];

  var result = strings[0];

  for (var i = 1; i < args.length; i++) {
    result += parseValue(args[i]);

    result += strings[i];
  }

  return result;
}

function combineFragments (left, right) {
  if (left == null) {
    return right;
  } else if (right == null) {
    return left;
  } else {
    return fragmentTag(['...', '...', ''], left, right);
  }
}

exports.combineFragments = combineFragments;

function mergeFragments (fragments) {
  return fragments.reduce(combineFragments, null);
}

exports.mergeFragments = mergeFragments;

function fragmentTag (strings) {
  var result = makeFragment(arguments, fragmentTag);

  var ast = parse('fragment temporaryFragment on Nothing {\n' + result + '\n}', {
    noLocation: true
  });

  return new ChipotleFragment(ast);
}

exports.fragment = fragmentTag;

function queryTag () {
  var result = makeFragment(arguments, queryTag);

  var ast = parse(result, {
    noLocation: true
  });

  return ast;
}

exports.query = queryTag;

function makeValue (value) {
  return new ChipotleValue(value);
}

exports.value = makeValue;

function ChipotleParseError (message, options) {
  options = options || {};
  this.message = message;

  if (message instanceof Error) {
    this.message = message.message;
    this.stack = message.stack;
  } else if (Error.captureStackTrace) {
    Error.captureStackTrace(this, options.stackFn || ChipotleParseError);
  }
}

ChipotleParseError.prototype = Object.create(Error.prototype);
ChipotleParseError.prototype.constructor = ChipotleParseError;

Object.defineProperty(ChipotleParseError.prototype, 'name', {
  value: 'ChipotleParseError'
});

exports.ChipotleParseError = ChipotleParseError;

function ChipotleFragment (ast, fragments) {
  this.ast = ast;
  this.fragments = fragments;
}

ChipotleFragment.prototype.constructor = ChipotleFragment;

function ChipotleValue (value) {
  this.value = value;
}

ChipotleValue.prototype.constructor = ChipotleValue;

ChipotleValue.prototype.stringify = function stringify () {
  return JSON.stringify(this.value);
};
