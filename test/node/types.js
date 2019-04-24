// Currently in sync with Node.js test/parallel/test-util-types.js
// https://github.com/nodejs/node/commit/519a11b24fa453e5cefe13df10ab9696616b5b91

// Flags: --experimental-vm-modules --expose-internals
'use strict';
require('./common');
const assert = require('assert');
const { types } = require('../../');
const vm = require('vm');

const inspect = value => {
  try {
    return JSON.stringify(value);
  } catch (e) {
    return `${typeof value}: ${value}`;
  }
};

// [browserify] We can't test this in userland
// const { internalBinding } = require('internal/test/binding');
// const { JSStream } = internalBinding('js_stream');
// const external = (new JSStream())._externalStream;

const wasmBuffer = Buffer.from('0061736d01000000', 'hex');

for (const [ getValue, _method ] of [
  // [ external, 'isExternal' ],
  [ function() { return new Date(); } ],
  [ function() { return (function() { return arguments; })(); }, 'isArgumentsObject' ],
  [ function() { return new Boolean(); }, 'isBooleanObject' ],
  [ function() { return new Number(); }, 'isNumberObject' ],
  [ function() { return new String(); }, 'isStringObject' ],
  [ function() { return Object(Symbol()); }, 'isSymbolObject' ],
  [ function() { return Object(BigInt(0)); }, 'isBigIntObject' ],
  [ function() { return new Error(); }, 'isNativeError' ],
  [ function() { return new RegExp(); } ],
  [ function() { return async function() {}; }, 'isAsyncFunction' ],
  [ function() { return function*() {}; }, 'isGeneratorFunction' ],
  [ function() { return (function*() {})(); }, 'isGeneratorObject' ],
  [ function() { return Promise.resolve(); } ],
  [ function() { return new Map(); } ],
  [ function() { return new Set(); } ],
  [ function() { return (new Map())[Symbol.iterator](); }, 'isMapIterator' ],
  [ function() { return (new Set())[Symbol.iterator](); }, 'isSetIterator' ],
  [ function() { return new WeakMap(); } ],
  [ function() { return new WeakSet(); } ],
  [ function() { return new ArrayBuffer(); } ],
  [ function() { return new Uint8Array(); } ],
  [ function() { return new Uint8ClampedArray(); } ],
  [ function() { return new Uint16Array(); } ],
  [ function() { return new Uint32Array(); } ],
  [ function() { return new Int8Array(); } ],
  [ function() { return new Int16Array(); } ],
  [ function() { return new Int32Array(); } ],
  [ function() { return new Float32Array(); } ],
  [ function() { return new Float64Array(); } ],
  [ function() { return new BigInt64Array(); } ],
  [ function() { return new BigUint64Array(); } ],
  [ function() { return Object.defineProperty(new Uint8Array(),
                          Symbol.toStringTag,
                          { value: 'foo' }); } ],
  [ function() { return new DataView(new ArrayBuffer()); } ],
  [ function() { return new SharedArrayBuffer(); } ],
  // [ new Proxy({}, {}), 'isProxy' ],
  [ function() { return new WebAssembly.Module(wasmBuffer); }, 'isWebAssemblyCompiledModule' ],
]) {
  let value;
  try {
    value = getValue();
  } catch (e) {
    continue;
  }
  const method = _method || `is${value.constructor.name}`;
  console.log('Testing', method);
  assert(method in types, `Missing ${method} for ${inspect(value)}`);
  assert(types[method](value), `Want ${inspect(value)} to match ${method}`);

  for (const key of Object.keys(types)) {
    if ((types.isArrayBufferView(value) ||
         types.isAnyArrayBuffer(value)) && key.includes('Array') ||
         key === 'isBoxedPrimitive') {
      continue;
    }

    assert.strictEqual(types[key](value),
                       key === method,
                       `${inspect(value)}: ${key}, ` +
                       `${method}, ${types[key](value)}`);
  }
}

// Check boxed primitives.
console.log('Testing', 'isBoxedPrimitive');
[
  function() { return new Boolean(); },
  function() { return new Number(); },
  function() { return new String(); },
  function() { return Object(Symbol()); },
  function() { return Object(BigInt(0)); }
].forEach((getEntry) => {
  let entry;
  try {
    entry = getEntry();
  } catch (e) {
    return;
  }
  assert(types.isBoxedPrimitive(entry))
});

[
  'Uint8Array',
  'Uint8ClampedArray',
  'Uint16Array',
  'Uint32Array',
  'Int8Array',
  'Int16Array',
  'Int32Array',
  'Float32Array',
  'Float64Array',
  'BigInt64Array',
  'BigUint64Array'
].forEach(typedArray => {
  const method = 'is' + typedArray;
  const constructor = 'new ' + typedArray;
  let array;
  try {
    array = vm.runInNewContext(constructor);
  } catch (e) {
    return;
  }
  console.log('Testing', method);
  assert(!types[method]({ [Symbol.toStringTag]: typedArray }));
  assert(types[method](array));
});

{
  const primitive = true;
  const arrayBuffer = new ArrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const dataView = new DataView(arrayBuffer);
  const uint8Array = new Uint8Array(arrayBuffer);
  const uint8ClampedArray = new Uint8ClampedArray(arrayBuffer);
  const uint16Array = new Uint16Array(arrayBuffer);
  const uint32Array = new Uint32Array(arrayBuffer);
  const int8Array = new Int8Array(arrayBuffer);
  const int16Array = new Int16Array(arrayBuffer);
  const int32Array = new Int32Array(arrayBuffer);
  const float32Array = new Float32Array(arrayBuffer);
  const float64Array = new Float64Array(arrayBuffer);
  const bigInt64Array = new BigInt64Array(arrayBuffer);
  const bigUint64Array = new BigUint64Array(arrayBuffer);

  const fakeBuffer = Object.create(Buffer.prototype);
  const fakeDataView = Object.create(DataView.prototype);
  const fakeUint8Array = Object.create(Uint8Array.prototype);
  const fakeUint8ClampedArray = Object.create(Uint8ClampedArray.prototype);
  const fakeUint16Array = Object.create(Uint16Array.prototype);
  const fakeUint32Array = Object.create(Uint32Array.prototype);
  const fakeInt8Array = Object.create(Int8Array.prototype);
  const fakeInt16Array = Object.create(Int16Array.prototype);
  const fakeInt32Array = Object.create(Int32Array.prototype);
  const fakeFloat32Array = Object.create(Float32Array.prototype);
  const fakeFloat64Array = Object.create(Float64Array.prototype);
  const fakeBigInt64Array = Object.create(BigInt64Array.prototype);
  const fakeBigUint64Array = Object.create(BigUint64Array.prototype);

  const stealthyDataView =
    Object.setPrototypeOf(new DataView(arrayBuffer), Uint8Array.prototype);
  const stealthyUint8Array =
    Object.setPrototypeOf(new Uint8Array(arrayBuffer), ArrayBuffer.prototype);
  const stealthyUint8ClampedArray =
    Object.setPrototypeOf(
      new Uint8ClampedArray(arrayBuffer), ArrayBuffer.prototype
    );
  const stealthyUint16Array =
    Object.setPrototypeOf(new Uint16Array(arrayBuffer), Uint16Array.prototype);
  const stealthyUint32Array =
    Object.setPrototypeOf(new Uint32Array(arrayBuffer), Uint32Array.prototype);
  const stealthyInt8Array =
    Object.setPrototypeOf(new Int8Array(arrayBuffer), Int8Array.prototype);
  const stealthyInt16Array =
    Object.setPrototypeOf(new Int16Array(arrayBuffer), Int16Array.prototype);
  const stealthyInt32Array =
    Object.setPrototypeOf(new Int32Array(arrayBuffer), Int32Array.prototype);
  const stealthyFloat32Array =
    Object.setPrototypeOf(
      new Float32Array(arrayBuffer), Float32Array.prototype
    );
  const stealthyFloat64Array =
    Object.setPrototypeOf(
      new Float64Array(arrayBuffer), Float64Array.prototype
    );
  const stealthyBigInt64Array =
    Object.setPrototypeOf(
      new BigInt64Array(arrayBuffer), BigInt64Array.prototype
    );
  const stealthyBigUint64Array =
    Object.setPrototypeOf(
      new BigUint64Array(arrayBuffer), BigUint64Array.prototype
    );

  const all = [
    primitive, arrayBuffer, buffer, fakeBuffer,
    dataView, fakeDataView, stealthyDataView,
    uint8Array, fakeUint8Array, stealthyUint8Array,
    uint8ClampedArray, fakeUint8ClampedArray, stealthyUint8ClampedArray,
    uint16Array, fakeUint16Array, stealthyUint16Array,
    uint32Array, fakeUint32Array, stealthyUint32Array,
    int8Array, fakeInt8Array, stealthyInt8Array,
    int16Array, fakeInt16Array, stealthyInt16Array,
    int32Array, fakeInt32Array, stealthyInt32Array,
    float32Array, fakeFloat32Array, stealthyFloat32Array,
    float64Array, fakeFloat64Array, stealthyFloat64Array,
    bigInt64Array, fakeBigInt64Array, stealthyBigInt64Array,
    bigUint64Array, fakeBigUint64Array, stealthyBigUint64Array
  ];

  const expected = {
    isArrayBufferView: [
      buffer,
      dataView, stealthyDataView,
      uint8Array, stealthyUint8Array,
      uint8ClampedArray, stealthyUint8ClampedArray,
      uint16Array, stealthyUint16Array,
      uint32Array, stealthyUint32Array,
      int8Array, stealthyInt8Array,
      int16Array, stealthyInt16Array,
      int32Array, stealthyInt32Array,
      float32Array, stealthyFloat32Array,
      float64Array, stealthyFloat64Array,
      bigInt64Array, stealthyBigInt64Array,
      bigUint64Array, stealthyBigUint64Array
    ],
    isTypedArray: [
      buffer,
      uint8Array, stealthyUint8Array,
      uint8ClampedArray, stealthyUint8ClampedArray,
      uint16Array, stealthyUint16Array,
      uint32Array, stealthyUint32Array,
      int8Array, stealthyInt8Array,
      int16Array, stealthyInt16Array,
      int32Array, stealthyInt32Array,
      float32Array, stealthyFloat32Array,
      float64Array, stealthyFloat64Array,
      bigInt64Array, stealthyBigInt64Array,
      bigUint64Array, stealthyBigUint64Array
    ],
    isUint8Array: [
      buffer, uint8Array, stealthyUint8Array
    ],
    isUint8ClampedArray: [
      uint8ClampedArray, stealthyUint8ClampedArray
    ],
    isUint16Array: [
      uint16Array, stealthyUint16Array
    ],
    isUint32Array: [
      uint32Array, stealthyUint32Array
    ],
    isInt8Array: [
      int8Array, stealthyInt8Array
    ],
    isInt16Array: [
      int16Array, stealthyInt16Array
    ],
    isInt32Array: [
      int32Array, stealthyInt32Array
    ],
    isFloat32Array: [
      float32Array, stealthyFloat32Array
    ],
    isFloat64Array: [
      float64Array, stealthyFloat64Array
    ],
    isBigInt64Array: [
      bigInt64Array, stealthyBigInt64Array
    ],
    isBigUint64Array: [
      bigUint64Array, stealthyBigUint64Array
    ]
  };

  for (const testedFunc of Object.keys(expected)) {
    const func = types[testedFunc];
    const yup = [];
    for (const value of all) {
      if (func(value)) {
        yup.push(value);
      }
    }
    console.log('Testing', testedFunc);
    assert.deepStrictEqual(yup, expected[testedFunc]);
  }
}

// (async () => {
//   const m = new vm.SourceTextModule('');
//   await m.link(() => 0);
//   m.instantiate();
//   await m.evaluate();
//   assert.ok(types.isModuleNamespaceObject(m.namespace));
// })();
