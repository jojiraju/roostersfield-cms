import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);
var __defProp = Object.defineProperty;
var __export = (target, all2) => {
  for (var name in all2)
    __defProp(target, name, { get: all2[name], enumerable: true });
};

// src/http.ts
import fs from "node:fs";
import path2 from "node:path";

// ../../../../opt/npm-tools/node_modules/zod/v3/external.js
var external_exports = {};
__export(external_exports, {
  BRAND: () => BRAND,
  DIRTY: () => DIRTY,
  EMPTY_PATH: () => EMPTY_PATH,
  INVALID: () => INVALID,
  NEVER: () => NEVER,
  OK: () => OK,
  ParseStatus: () => ParseStatus,
  Schema: () => ZodType,
  ZodAny: () => ZodAny,
  ZodArray: () => ZodArray,
  ZodBigInt: () => ZodBigInt,
  ZodBoolean: () => ZodBoolean,
  ZodBranded: () => ZodBranded,
  ZodCatch: () => ZodCatch,
  ZodDate: () => ZodDate,
  ZodDefault: () => ZodDefault,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodEffects: () => ZodEffects,
  ZodEnum: () => ZodEnum,
  ZodError: () => ZodError,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodFunction: () => ZodFunction,
  ZodIntersection: () => ZodIntersection,
  ZodIssueCode: () => ZodIssueCode,
  ZodLazy: () => ZodLazy,
  ZodLiteral: () => ZodLiteral,
  ZodMap: () => ZodMap,
  ZodNaN: () => ZodNaN,
  ZodNativeEnum: () => ZodNativeEnum,
  ZodNever: () => ZodNever,
  ZodNull: () => ZodNull,
  ZodNullable: () => ZodNullable,
  ZodNumber: () => ZodNumber,
  ZodObject: () => ZodObject,
  ZodOptional: () => ZodOptional,
  ZodParsedType: () => ZodParsedType,
  ZodPipeline: () => ZodPipeline,
  ZodPromise: () => ZodPromise,
  ZodReadonly: () => ZodReadonly,
  ZodRecord: () => ZodRecord,
  ZodSchema: () => ZodType,
  ZodSet: () => ZodSet,
  ZodString: () => ZodString,
  ZodSymbol: () => ZodSymbol,
  ZodTransformer: () => ZodEffects,
  ZodTuple: () => ZodTuple,
  ZodType: () => ZodType,
  ZodUndefined: () => ZodUndefined,
  ZodUnion: () => ZodUnion,
  ZodUnknown: () => ZodUnknown,
  ZodVoid: () => ZodVoid,
  addIssueToContext: () => addIssueToContext,
  any: () => anyType,
  array: () => arrayType,
  bigint: () => bigIntType,
  boolean: () => booleanType,
  coerce: () => coerce,
  custom: () => custom,
  date: () => dateType,
  datetimeRegex: () => datetimeRegex,
  defaultErrorMap: () => en_default,
  discriminatedUnion: () => discriminatedUnionType,
  effect: () => effectsType,
  enum: () => enumType,
  function: () => functionType,
  getErrorMap: () => getErrorMap,
  getParsedType: () => getParsedType,
  instanceof: () => instanceOfType,
  intersection: () => intersectionType,
  isAborted: () => isAborted,
  isAsync: () => isAsync,
  isDirty: () => isDirty,
  isValid: () => isValid,
  late: () => late,
  lazy: () => lazyType,
  literal: () => literalType,
  makeIssue: () => makeIssue,
  map: () => mapType,
  nan: () => nanType,
  nativeEnum: () => nativeEnumType,
  never: () => neverType,
  null: () => nullType,
  nullable: () => nullableType,
  number: () => numberType,
  object: () => objectType,
  objectUtil: () => objectUtil,
  oboolean: () => oboolean,
  onumber: () => onumber,
  optional: () => optionalType,
  ostring: () => ostring,
  pipeline: () => pipelineType,
  preprocess: () => preprocessType,
  promise: () => promiseType,
  quotelessJson: () => quotelessJson,
  record: () => recordType,
  set: () => setType,
  setErrorMap: () => setErrorMap,
  strictObject: () => strictObjectType,
  string: () => stringType,
  symbol: () => symbolType,
  transformer: () => effectsType,
  tuple: () => tupleType,
  undefined: () => undefinedType,
  union: () => unionType,
  unknown: () => unknownType,
  util: () => util,
  void: () => voidType
});

// ../../../../opt/npm-tools/node_modules/zod/v3/helpers/util.js
var util;
(function(util2) {
  util2.assertEqual = (_) => {
  };
  function assertIs(_arg) {
  }
  util2.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error();
  }
  util2.assertNever = assertNever;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
    const keys = [];
    for (const key2 in object) {
      if (Object.prototype.hasOwnProperty.call(object, key2)) {
        keys.push(key2);
      }
    }
    return keys;
  };
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return void 0;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
  function joinValues(array, separator = " | ") {
    return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
  }
  util2.joinValues = joinValues;
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
      // second overwrites first
    };
  };
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
var getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
};

// ../../../../opt/npm-tools/node_modules/zod/v3/ZodError.js
var ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
var quotelessJson = (obj) => {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(/"([^"]+)":/g, "$1:");
};
var ZodError = class _ZodError extends Error {
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = (error) => {
      for (const issue of error.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el = issue.path[i];
            const terminal = i === issue.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    };
    processError(this);
    return fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof _ZodError)) {
      throw new Error(`Not a ZodError: ${value}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        const firstEl = sub.path[0];
        fieldErrors[firstEl] = fieldErrors[firstEl] || [];
        fieldErrors[firstEl].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
};
ZodError.create = (issues) => {
  const error = new ZodError(issues);
  return error;
};

// ../../../../opt/npm-tools/node_modules/zod/v3/locales/en.js
var errorMap = (issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`;
          if (typeof issue.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
          }
        } else if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "bigint")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "bigint")
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
};
var en_default = errorMap;

// ../../../../opt/npm-tools/node_modules/zod/v3/errors.js
var overrideErrorMap = en_default;
function setErrorMap(map) {
  overrideErrorMap = map;
}
function getErrorMap() {
  return overrideErrorMap;
}

// ../../../../opt/npm-tools/node_modules/zod/v3/helpers/parseUtil.js
var makeIssue = (params) => {
  const { data, path: path5, errorMaps, issueData } = params;
  const fullPath = [...path5, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== void 0) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
};
var EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      // contextual error map is first priority
      ctx.schemaErrorMap,
      // then schema-bound map if available
      overrideMap,
      // then global override map
      overrideMap === en_default ? void 0 : en_default
      // then global default map
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}
var ParseStatus = class _ParseStatus {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key2 = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key: key2,
        value
      });
    }
    return _ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key: key2, value } = pair;
      if (key2.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key2.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key2.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key2.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
};
var INVALID = Object.freeze({
  status: "aborted"
});
var DIRTY = (value) => ({ status: "dirty", value });
var OK = (value) => ({ status: "valid", value });
var isAborted = (x) => x.status === "aborted";
var isDirty = (x) => x.status === "dirty";
var isValid = (x) => x.status === "valid";
var isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;

// ../../../../opt/npm-tools/node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));

// ../../../../opt/npm-tools/node_modules/zod/v3/types.js
var ParseInputLazyPath = class {
  constructor(parent, value, path5, key2) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path5;
    this._key = key2;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (Array.isArray(this._key)) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
};
var handleResult = (ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error = new ZodError(ctx.common.issues);
        this._error = error;
        return this._error;
      }
    };
  }
};
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = (iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  };
  return { errorMap: customMap, description };
}
var ZodType = class {
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: params?.async ?? false,
        contextualErrorMap: params?.errorMap
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        if (err?.message?.toLowerCase()?.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params?.errorMap,
        async: true
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = (val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    };
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = () => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      });
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (data) => this["~validate"](data)
    };
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
};
var cuidRegex = /^c[^\s-]{8,}$/i;
var cuid2Regex = /^[0-9a-z]+$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var nanoidRegex = /^[a-z0-9_-]{21}$/i;
var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
var emojiRegex;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
var dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
  if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    if (!header)
      return false;
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && decoded?.typ !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
function isValidCidr(ip, version) {
  if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}
var ZodString = class _ZodString extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "length") {
        const tooBig = input.data.length > check.value;
        const tooSmall = input.data.length < check.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          }
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "includes") {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "datetime") {
        const regex = datetimeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "time") {
        const regex = timeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ip") {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "jwt") {
        if (!isValidJWT(input.data, check.alg)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "jwt",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cidr") {
        if (!isValidCidr(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cidr",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64url") {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  cidr(options) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      offset: options?.offset ?? false,
      local: options?.local ?? false,
      ...errorUtil.errToObj(options?.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      ...errorUtil.errToObj(options?.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options?.position,
      ...errorUtil.errToObj(options?.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodString.create = (params) => {
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
var ZodNumber = class _ZodNumber extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null;
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
};
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodBigInt = class _ZodBigInt extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch {
        return this._getInvalidInput(input);
      }
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    });
    return INVALID;
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodBigInt.create = (params) => {
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
var ZodBoolean = class extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodDate = class _ZodDate extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (Number.isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new _ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
};
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: params?.coerce || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};
var ZodSymbol = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};
var ZodUndefined = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};
var ZodNull = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};
var ZodAny = class extends ZodType {
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};
var ZodUnknown = class extends ZodType {
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};
var ZodNever = class extends ZodType {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
};
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};
var ZodVoid = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};
var ZodArray = class _ZodArray extends ZodType {
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : void 0,
          maximum: tooBig ? def.exactLength.value : void 0,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new _ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new _ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new _ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key2 in schema.shape) {
      const fieldSchema = schema.shape[key2];
      newShape[key2] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
var ZodObject = class _ZodObject extends ZodType {
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    this._cached = { shape, keys };
    return this._cached;
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key2 in ctx.data) {
        if (!shapeKeys.includes(key2)) {
          extraKeys.push(key2);
        }
      }
    }
    const pairs = [];
    for (const key2 of shapeKeys) {
      const keyValidator = shape[key2];
      const value = ctx.data[key2];
      pairs.push({
        key: { status: "valid", value: key2 },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key2)),
        alwaysSet: key2 in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key2 of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key2 },
            value: { status: "valid", value: ctx.data[key2] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") {
      } else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key2 of extraKeys) {
        const value = ctx.data[key2];
        pairs.push({
          key: { status: "valid", value: key2 },
          value: catchall._parse(
            new ParseInputLazyPath(ctx, value, ctx.path, key2)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: key2 in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key2 = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key: key2,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== void 0 ? {
        errorMap: (issue, ctx) => {
          const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
          if (issue.code === "unrecognized_keys")
            return {
              message: errorUtil.errToObj(message).message ?? defaultError
            };
          return {
            message: defaultError
          };
        }
      } : {}
    });
  }
  strip() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(augmentation) {
    return new _ZodObject({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation
      })
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(merging) {
    const merged = new _ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(key2, schema) {
    return this.augment({ [key2]: schema });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(index) {
    return new _ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    for (const key2 of util.objectKeys(mask)) {
      if (mask[key2] && this.shape[key2]) {
        shape[key2] = this.shape[key2];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  omit(mask) {
    const shape = {};
    for (const key2 of util.objectKeys(this.shape)) {
      if (!mask[key2]) {
        shape[key2] = this.shape[key2];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    for (const key2 of util.objectKeys(this.shape)) {
      const fieldSchema = this.shape[key2];
      if (mask && !mask[key2]) {
        newShape[key2] = fieldSchema;
      } else {
        newShape[key2] = fieldSchema.optional();
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  required(mask) {
    const newShape = {};
    for (const key2 of util.objectKeys(this.shape)) {
      if (mask && !mask[key2]) {
        newShape[key2] = this.shape[key2];
      } else {
        const fieldSchema = this.shape[key2];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType;
        }
        newShape[key2] = newField;
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
};
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
var ZodUnion = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = void 0;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
};
ZodUnion.create = (types, params) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
var getDiscriminator = (type) => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral) {
    return [type.value];
  } else if (type instanceof ZodEnum) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return util.objectValues(type.enum);
  } else if (type instanceof ZodDefault) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined) {
    return [void 0];
  } else if (type instanceof ZodNull) {
    return [null];
  } else if (type instanceof ZodOptional) {
    return [void 0, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodNullable) {
    return [null, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodReadonly) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodCatch) {
    return getDiscriminator(type._def.innerType);
  } else {
    return [];
  }
};
var ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.optionsMap.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */
  static create(discriminator, options, params) {
    const optionsMap = /* @__PURE__ */ new Map();
    for (const type of options) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator]);
      if (!discriminatorValues.length) {
        throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
      }
      for (const value of discriminatorValues) {
        if (optionsMap.has(value)) {
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
        }
        optionsMap.set(value, type);
      }
    }
    return new _ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params)
    });
  }
};
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key2) => bKeys.indexOf(key2) !== -1);
    const newObj = { ...a, ...b };
    for (const key2 of sharedKeys) {
      const sharedValue = mergeValues(a[key2], b[key2]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key2] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
var ZodIntersection = class extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    };
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
};
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};
var ZodTuple = class _ZodTuple extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new _ZodTuple({
      ...this._def,
      rest
    });
  }
};
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};
var ZodRecord = class _ZodRecord extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key2 in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key2, ctx.path, key2)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key2], ctx.path, key2)),
        alwaysSet: key2 in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new _ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new _ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
};
var ZodMap = class extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key2, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key2, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key2 = await pair.key;
          const value = await pair.value;
          if (key2.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key2.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key2.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = /* @__PURE__ */ new Map();
      for (const pair of pairs) {
        const key2 = pair.key;
        const value = pair.value;
        if (key2.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key2.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key2.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
};
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};
var ZodSet = class _ZodSet extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = /* @__PURE__ */ new Set();
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new _ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new _ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};
var ZodFunction = class _ZodFunction extends ZodType {
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error
        }
      });
    }
    function makeReturnsIssue(returns, error) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error
        }
      });
    }
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      const me = this;
      return OK(async function(...args) {
        const error = new ZodError([]);
        const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          error.addIssue(makeArgsIssue(args, e));
          throw error;
        });
        const result = await Reflect.apply(fn, this, parsedArgs);
        const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
          error.addIssue(makeReturnsIssue(result, e));
          throw error;
        });
        return parsedReturns;
      });
    } else {
      const me = this;
      return OK(function(...args) {
        const parsedArgs = me._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = Reflect.apply(fn, this, parsedArgs.data);
        const parsedReturns = me._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new _ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create())
    });
  }
  returns(returnType) {
    return new _ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new _ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
};
var ZodLazy = class extends ZodType {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
};
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};
var ZodLiteral = class extends ZodType {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
};
ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
var ZodEnum = class _ZodEnum extends ZodType {
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(this._def.values);
    }
    if (!this._cache.has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return _ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
};
ZodEnum.create = createZodEnum;
var ZodNativeEnum = class extends ZodType {
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(util.getValidEnumValues(this._def.values));
    }
    if (!this._cache.has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
};
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};
var ZodPromise = class extends ZodType {
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
};
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};
var ZodEffects = class extends ZodType {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: (arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      },
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = (acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      };
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return INVALID;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return INVALID;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
            status: status.value,
            value: result
          }));
        });
      }
    }
    util.assertNever(effect);
  }
};
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
var ZodOptional = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(void 0);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};
var ZodNullable = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};
var ZodDefault = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
};
ZodDefault.create = (type, params) => {
  return new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};
var ZodCatch = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
};
ZodCatch.create = (type, params) => {
  return new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};
var ZodNaN = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
};
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
var BRAND = /* @__PURE__ */ Symbol("zod_brand");
var ZodBranded = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
};
var ZodPipeline = class _ZodPipeline extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      };
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new _ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
};
var ZodReadonly = class extends ZodType {
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze = (data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    };
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodReadonly.create = (type, params) => {
  return new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
function cleanParams(params, data) {
  const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p2 = typeof p === "string" ? { message: p } : p;
  return p2;
}
function custom(check, _params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      const r = check(data);
      if (r instanceof Promise) {
        return r.then((r2) => {
          if (!r2) {
            const params = cleanParams(_params, data);
            const _fatal = params.fatal ?? fatal ?? true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r) {
        const params = cleanParams(_params, data);
        const _fatal = params.fatal ?? fatal ?? true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny.create();
}
var late = {
  object: ZodObject.lazycreate
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var instanceOfType = (cls, params = {
  message: `Input not instance of ${cls.name}`
}) => custom((data) => data instanceof cls, params);
var stringType = ZodString.create;
var numberType = ZodNumber.create;
var nanType = ZodNaN.create;
var bigIntType = ZodBigInt.create;
var booleanType = ZodBoolean.create;
var dateType = ZodDate.create;
var symbolType = ZodSymbol.create;
var undefinedType = ZodUndefined.create;
var nullType = ZodNull.create;
var anyType = ZodAny.create;
var unknownType = ZodUnknown.create;
var neverType = ZodNever.create;
var voidType = ZodVoid.create;
var arrayType = ZodArray.create;
var objectType = ZodObject.create;
var strictObjectType = ZodObject.strictCreate;
var unionType = ZodUnion.create;
var discriminatedUnionType = ZodDiscriminatedUnion.create;
var intersectionType = ZodIntersection.create;
var tupleType = ZodTuple.create;
var recordType = ZodRecord.create;
var mapType = ZodMap.create;
var setType = ZodSet.create;
var functionType = ZodFunction.create;
var lazyType = ZodLazy.create;
var literalType = ZodLiteral.create;
var enumType = ZodEnum.create;
var nativeEnumType = ZodNativeEnum.create;
var promiseType = ZodPromise.create;
var effectsType = ZodEffects.create;
var optionalType = ZodOptional.create;
var nullableType = ZodNullable.create;
var preprocessType = ZodEffects.createWithPreprocess;
var pipelineType = ZodPipeline.create;
var ostring = () => stringType().optional();
var onumber = () => numberType().optional();
var oboolean = () => booleanType().optional();
var coerce = {
  string: ((arg) => ZodString.create({ ...arg, coerce: true })),
  number: ((arg) => ZodNumber.create({ ...arg, coerce: true })),
  boolean: ((arg) => ZodBoolean.create({
    ...arg,
    coerce: true
  })),
  bigint: ((arg) => ZodBigInt.create({ ...arg, coerce: true })),
  date: ((arg) => ZodDate.create({ ...arg, coerce: true }))
};
var NEVER = INVALID;

// src/errors.ts
var HttpError = class extends Error {
  status;
  details;
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
};
var badRequest = (m, d2) => new HttpError(400, m, d2);
var notFound = (m = "Not found") => new HttpError(404, m);
var forbidden = (m = "Not allowed") => new HttpError(403, m);

// src/security.ts
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// src/config.ts
import path from "node:path";
import { fileURLToPath } from "node:url";
var here = path.dirname(fileURLToPath(import.meta.url));
var SERVER_ROOT = path.resolve(here, "..");
var config = {
  port: Number(process.env.PORT ?? 4e3),
  jwtSecret: process.env.JWT_SECRET ?? "rf-dev-secret-change-me",
  adminPassword: process.env.ADMIN_PASSWORD ?? "rooster123",
  tursoUrl: process.env.TURSO_DATABASE_URL || void 0,
  tursoToken: process.env.TURSO_AUTH_TOKEN || void 0,
  dbFile: process.env.DB_FILE ?? path.join(SERVER_ROOT, "data", "roosters.db"),
  backupDir: path.join(SERVER_ROOT, "data", "backups"),
  clientDist: path.resolve(SERVER_ROOT, "..", "client", "dist"),
  tokenTtlSeconds: 60 * 60 * 12
};

// src/security.ts
function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}
function verifyPassword(password, stored) {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(expected, actual);
}
var b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
var sign = (data) => createHmac("sha256", config.jwtSecret).update(data).digest("base64url");
function signToken(user) {
  const header = b64({ alg: "HS256", typ: "JWT" });
  const payload = b64({ sub: user.id, name: user.name, role: user.role, exp: Math.floor(Date.now() / 1e3) + config.tokenTtlSeconds });
  return `${header}.${payload}.${sign(`${header}.${payload}`)}`;
}
function verifyToken(token) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const expected = Buffer.from(sign(`${parts[0]}.${parts[1]}`));
  const given = Buffer.from(parts[2]);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    return payload.exp > Date.now() / 1e3 ? payload : null;
  } catch {
    return null;
  }
}

// src/http.ts
var HANDLED = /* @__PURE__ */ Symbol("handled");
var Router = class {
  routes = [];
  add(method, pattern, handler2, opts = {}) {
    const keys = [];
    const src = pattern.replace(/:([A-Za-z]+)/g, (_, k) => {
      keys.push(k);
      return "([^/]+)";
    });
    this.routes.push({ method, regex: new RegExp(`^${src}$`), keys, handler: handler2, opts: { auth: true, ...opts } });
  }
  get(p, h, o) {
    this.add("GET", p, h, o);
  }
  post(p, h, o) {
    this.add("POST", p, h, o);
  }
  put(p, h, o) {
    this.add("PUT", p, h, o);
  }
  patch(p, h, o) {
    this.add("PATCH", p, h, o);
  }
  delete(p, h, o) {
    this.add("DELETE", p, h, o);
  }
};
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > limit) {
        reject(new HttpError(413, "Request too large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}
function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(body) });
  res.end(body);
}
var MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".json": "application/json",
  ".map": "application/json"
};
function serveStatic(root, urlPath, res) {
  if (!fs.existsSync(root)) return false;
  const safe = path2.normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, "");
  let file = path2.join(root, safe);
  if (!file.startsWith(root)) return false;
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path2.join(root, "index.html");
  if (!fs.existsSync(file)) return false;
  const ext = path2.extname(file).toLowerCase();
  const immutable = file.includes(`${path2.sep}assets${path2.sep}`);
  res.writeHead(200, {
    "Content-Type": MIME[ext] ?? "application/octet-stream",
    "Cache-Control": immutable ? "public, max-age=31536000, immutable" : "no-cache"
  });
  fs.createReadStream(file).pipe(res);
  return true;
}
async function handleRequest(router2, req, res, opts = {}) {
  {
    const started = Date.now();
    const url = new URL(req.url ?? "/", "http://localhost");
    try {
      if (!url.pathname.startsWith("/api/")) {
        if (opts.staticDir && serveStatic(opts.staticDir, url.pathname, res)) return;
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found. (Frontend not built \u2014 run `npm run build`, or use `npm run dev`.)");
        return;
      }
      if (opts.beforeApi) await opts.beforeApi();
      const method = req.method ?? "GET";
      let matched;
      let params = {};
      for (const r of router2.routes) {
        if (r.method !== method) continue;
        const m = r.regex.exec(url.pathname);
        if (m) {
          matched = r;
          params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
          break;
        }
      }
      if (!matched) throw new HttpError(404, `No route for ${method} ${url.pathname}`);
      let user = null;
      const auth = req.headers.authorization;
      const token = auth?.startsWith("Bearer ") ? auth.slice(7) : url.searchParams.get("token");
      if (token) user = verifyToken(token);
      if (matched.opts.auth && !user) throw new HttpError(401, "Please sign in");
      if (matched.opts.admin && user?.role !== "admin") throw new HttpError(403, "Admin access required");
      let body = void 0;
      const ctype = req.headers["content-type"] ?? "";
      if (!matched.opts.raw && ["POST", "PUT", "PATCH"].includes(method) && ctype.includes("json")) {
        const raw = await readBody(req, 5 * 1024 * 1024);
        try {
          body = raw.length ? JSON.parse(raw.toString("utf8")) : {};
        } catch {
          throw new HttpError(400, "Invalid JSON body");
        }
      }
      const ctx = { req, res, params, query: url.searchParams, body, user, readRaw: (limit = 80 * 1024 * 1024) => readBody(req, limit) };
      const result = await matched.handler(ctx);
      if (result === HANDLED) return;
      sendJson(res, 200, result === void 0 ? { ok: true } : result);
    } catch (err) {
      let status = 500;
      let message = "Something went wrong on the server";
      let details;
      if (err instanceof HttpError) {
        status = err.status;
        message = err.message;
        details = err.details;
      } else if (err instanceof ZodError) {
        status = 400;
        const i = err.issues[0];
        message = `${i.path.join(".") || "input"}: ${i.message}`;
        details = err.issues;
      } else console.error("[error]", err);
      if (!res.headersSent) sendJson(res, status, { error: message, details });
    } finally {
      if (url.pathname.startsWith("/api/") && process.env.LOG_REQUESTS) console.log(`${req.method} ${url.pathname} ${res.statusCode} ${Date.now() - started}ms`);
    }
  }
}

// src/db.ts
import fs2 from "node:fs";
import path3 from "node:path";
import { AsyncLocalStorage } from "node:async_hooks";

// src/schema.ts
var SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin','staff')),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Chart of accounts. Parties (traders, suppliers, farmers) are accounts too: one ledger for everything.
CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  type TEXT NOT NULL CHECK (type IN ('asset','liability','equity','income','expense')),
  category TEXT NOT NULL,
  subtype TEXT,                 -- supplier: feed | medicine | chicks | other
  sys_key TEXT UNIQUE,          -- 'wip', 'sales', 'cogs', 'suspense' ...
  phone TEXT,
  notes TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_accounts_category ON accounts(category);

CREATE TABLE IF NOT EXISTS farms (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  farmer_name TEXT,
  farmer_account_id INTEGER REFERENCES accounts(id),
  phone TEXT,
  location TEXT,
  capacity INTEGER,
  active INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- A batch (flock) = one grow-out cycle on one farm.
CREATE TABLE IF NOT EXISTS batches (
  id INTEGER PRIMARY KEY,
  farm_id INTEGER NOT NULL REFERENCES farms(id),
  batch_no INTEGER NOT NULL,
  placement_date TEXT,
  placed_qty INTEGER,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running','closed')),
  closed_date TEXT,
  notes TEXT,
  partial INTEGER NOT NULL DEFAULT 0,   -- 1 = incomplete history (e.g. carried forward from before this system)
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (farm_id, batch_no)
);
CREATE INDEX IF NOT EXISTS idx_batches_status ON batches(status);

CREATE TABLE IF NOT EXISTS vouchers (
  id INTEGER PRIMARY KEY,
  voucher_no INTEGER NOT NULL UNIQUE,
  type TEXT NOT NULL,
  date TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  party_id INTEGER REFERENCES accounts(id),
  farm_id INTEGER REFERENCES farms(id),
  batch_id INTEGER REFERENCES batches(id),
  bill_no INTEGER UNIQUE,
  meta TEXT,                    -- JSON: original form payload, weighing sheet, etc.
  source TEXT NOT NULL DEFAULT 'app',
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_vouchers_date ON vouchers(date);
CREATE INDEX IF NOT EXISTS idx_vouchers_type ON vouchers(type);
CREATE INDEX IF NOT EXISTS idx_vouchers_batch ON vouchers(batch_id);

-- Double-entry lines. Every voucher's debits equal its credits.
CREATE TABLE IF NOT EXISTS entries (
  id INTEGER PRIMARY KEY,
  voucher_id INTEGER NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
  seq INTEGER NOT NULL DEFAULT 0,
  date TEXT NOT NULL,
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  farm_id INTEGER REFERENCES farms(id),
  batch_id INTEGER REFERENCES batches(id),
  debit REAL NOT NULL DEFAULT 0,
  credit REAL NOT NULL DEFAULT 0,
  category TEXT,                -- chicks | feed | feed_return | medicine | integration | misc | opening | cogs | live | weak | damage
  item TEXT,
  qty REAL,
  weight REAL,
  rate REAL,
  narration TEXT
);
CREATE INDEX IF NOT EXISTS idx_entries_account_date ON entries(account_id, date);
CREATE INDEX IF NOT EXISTS idx_entries_voucher ON entries(voucher_id);
CREATE INDEX IF NOT EXISTS idx_entries_batch ON entries(batch_id);
CREATE INDEX IF NOT EXISTS idx_entries_farm ON entries(farm_id);
CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date);

CREATE TABLE IF NOT EXISTS cash_counts (
  date TEXT PRIMARY KEY,
  denominations TEXT NOT NULL,   -- JSON {"500": 427, ...}
  damage REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  note TEXT,
  updated_by INTEGER REFERENCES users(id),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

// src/db.ts
var remote = !!config.tursoUrl;
if (!remote) fs2.mkdirSync(path3.dirname(config.dbFile), { recursive: true });
var client = remote ? (await import("@libsql/client/web")).createClient({ url: config.tursoUrl.replace(/^libsql:/, "https:"), authToken: config.tursoToken }) : (await import("@libsql/client")).createClient({ url: `file:${config.dbFile}` });
var clean = (p) => p.map((v) => v === void 0 ? null : typeof v === "boolean" ? Number(v) : v);
var store = new AsyncLocalStorage();
async function exec(sql, params) {
  const ctx = store.getStore();
  return (ctx ? ctx.t : client).execute({ sql, args: clean(params) });
}
var toRows = (r) => r.rows.map((row) => Object.fromEntries(r.columns.map((c, i) => [c, row[i]])));
var all = async (sql, ...params) => toRows(await exec(sql, params));
var get = async (sql, ...params) => (await all(sql, ...params))[0];
var run = async (sql, ...params) => {
  const r = await exec(sql, params);
  return { changes: Number(r.rowsAffected), id: Number(r.lastInsertRowid ?? 0) };
};
async function tx(fn) {
  const cur = store.getStore();
  if (!cur) {
    const t = await client.transaction("write");
    try {
      const result = await store.run({ t, depth: 0 }, async () => fn());
      await t.commit();
      return result;
    } catch (e) {
      try {
        await t.rollback();
      } catch {
      }
      throw e;
    } finally {
      t.close();
    }
  }
  const name = `sp${++cur.depth}`;
  await cur.t.execute(`SAVEPOINT ${name}`);
  try {
    const result = await fn();
    await cur.t.execute(`RELEASE ${name}`);
    return result;
  } catch (e) {
    await cur.t.execute(`ROLLBACK TO ${name}`);
    await cur.t.execute(`RELEASE ${name}`);
    throw e;
  } finally {
    cur.depth--;
  }
}
var ready = null;
function initDb() {
  ready ??= (async () => {
    if (!remote) await client.executeMultiple("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA synchronous = NORMAL;");
    await client.executeMultiple(SCHEMA);
  })();
  return ready;
}
async function getSetting(key2, fallback = "") {
  return (await get("SELECT value FROM settings WHERE key = ?", key2))?.value ?? fallback;
}
async function setSetting(key2, value) {
  await run("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", key2, value);
}
async function backupLocal(prefix) {
  if (remote) return null;
  fs2.mkdirSync(config.backupDir, { recursive: true });
  const file = path3.join(config.backupDir, `${prefix}-${(/* @__PURE__ */ new Date()).toISOString().replace(/[:T]/g, "-").slice(0, 19)}.db`);
  if (fs2.existsSync(file)) fs2.rmSync(file);
  await client.execute(`VACUUM INTO '${file.replace(/'/g, "''")}'`);
  return file;
}
async function dumpAll() {
  const tables = await all(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_litestream%' ORDER BY name`);
  const out = {};
  for (const t of tables) out[t.name] = t.name === "users" ? await all(`SELECT id,username,name,role,active,created_at FROM users`) : await all(`SELECT * FROM "${t.name}"`);
  return out;
}
var isRemote = remote;

// src/util.ts
var round2 = (n2) => Math.round((n2 + Number.EPSILON) * 100) / 100;
var num = (v, fallback = 0) => {
  if (v === null || v === void 0 || v === "") return fallback;
  const n2 = typeof v === "number" ? v : Number(String(v).replace(/,/g, "").trim());
  return Number.isFinite(n2) ? n2 : fallback;
};
var isoDate = (d2) => `${d2.getFullYear()}-${String(d2.getMonth() + 1).padStart(2, "0")}-${String(d2.getDate()).padStart(2, "0")}`;
var today = () => isoDate(/* @__PURE__ */ new Date());
var daysBetween = (a, b) => Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 864e5);
var addDays = (d2, n2) => {
  const t = new Date(Date.parse(d2 + "T00:00:00Z") + n2 * 864e5);
  return t.toISOString().slice(0, 10);
};
var monthStart = (d2) => d2.slice(0, 7) + "-01";
var CATEGORY_TYPE = {
  cash: "asset",
  bank: "asset",
  trader: "asset",
  wip: "asset",
  fixed_asset: "asset",
  other_asset: "asset",
  supplier: "liability",
  farmer: "liability",
  loan: "liability",
  other_liability: "liability",
  equity: "equity",
  income: "income",
  cogs: "expense",
  expense: "expense"
};
var CATEGORIES = Object.keys(CATEGORY_TYPE);

// src/seed.ts
var DEFAULT_SETTINGS = {
  company_name: "Rooster's Field",
  company_place: "Edakkara",
  tagline: "Embrace Nature, Nurture A Healthy Generation",
  address: "Near New Bus Stand, Edakkara",
  phones: "7356 219 684, 9447 630 989",
  gstin: "32BDQPJ9279N1ZM",
  feed_bag_kg: "50",
  integration_rate_per_kg: "6.5",
  integration_rate_per_bird_broast: "13",
  harvest_alert_days: "33",
  feed_types: JSON.stringify(["PRESTARTER", "STARTER FEED", "FINISHER"]),
  next_bill_no: "1"
};
var SYSTEM_ACCOUNTS = [
  { name: "FARM BATCH INVENTORY (WIP)", category: "wip", sys: "wip" },
  { name: "SALES", category: "income", sys: "sales" },
  { name: "COST OF GOODS SOLD", category: "cogs", sys: "cogs" },
  { name: "SUSPENSE / IMPORT DIFFERENCES", category: "other_asset", sys: "suspense" },
  { name: "CASH", category: "cash", sys: "cash" }
];
var STARTER_ACCOUNTS = [
  { name: "BANK ACCOUNT", category: "bank" },
  { name: "OWNER'S CAPITAL", category: "equity" },
  { name: "DRAWINGS", category: "equity" },
  { name: "RENT", category: "expense" },
  { name: "SALARY", category: "expense" },
  { name: "PETROL", category: "expense" },
  { name: "TEA CASH", category: "expense" },
  { name: "ELECTRICITY (KSEB)", category: "expense" },
  { name: "INTEREST", category: "expense" },
  { name: "STATIONERY", category: "expense" },
  { name: "MISCELLANEOUS", category: "expense" }
];
async function addAccount(name, category, opts = {}) {
  const r = await run(
    "INSERT INTO accounts(name,type,category,subtype,sys_key) VALUES(?,?,?,?,?)",
    name.trim(),
    CATEGORY_TYPE[category],
    category,
    opts.subtype ?? null,
    opts.sys ?? null
  );
  return r.id;
}
async function seed() {
  await initDb();
  for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
    if (await get("SELECT 1 FROM settings WHERE key=?", k) === void 0) await setSetting(k, v);
  }
  for (const a of SYSTEM_ACCOUNTS) {
    if (!await get("SELECT 1 FROM accounts WHERE sys_key=?", a.sys)) await addAccount(a.name, a.category, { sys: a.sys });
  }
  const fresh = ((await get("SELECT COUNT(*) n FROM accounts"))?.n ?? 0) <= SYSTEM_ACCOUNTS.length;
  if (fresh) for (const a of STARTER_ACCOUNTS) await addAccount(a.name, a.category, { subtype: a.subtype });
  if (!await get("SELECT 1 FROM users LIMIT 1")) {
    await run("INSERT INTO users(username,name,password_hash,role) VALUES(?,?,?,?)", "admin", "Administrator", hashPassword(config.adminPassword), "admin");
    console.log(`[seed] Created user "admin" with password "${config.adminPassword}" \u2014 change it in Settings after first login.`);
  }
}
var sysAccountId = async (key2) => {
  const r = await get("SELECT id FROM accounts WHERE sys_key=?", key2);
  if (!r) throw new Error(`System account missing: ${key2}`);
  return r.id;
};
var feedTypes = async () => {
  try {
    return JSON.parse(await getSetting("feed_types", "[]"));
  } catch {
    return [];
  }
};

// src/routes/auth.ts
var attempts = /* @__PURE__ */ new Map();
function authRoutes(r) {
  r.post("/api/auth/login", async ({ req, body }) => {
    const ip = String(req.headers["x-forwarded-for"] ?? req.socket.remoteAddress ?? "x").split(",")[0].trim();
    const a = attempts.get(ip);
    if (a && a.reset > Date.now() && a.n >= 10) throw new HttpError(429, "Too many attempts. Try again in a minute.");
    const { username, password } = external_exports.object({ username: external_exports.string().min(1, "Enter your username"), password: external_exports.string().min(1, "Enter your password") }).parse(body);
    const u = await get("SELECT * FROM users WHERE username=?", username);
    if (!u || !u.active || !verifyPassword(password, u.password_hash)) {
      attempts.set(ip, { n: (a && a.reset > Date.now() ? a.n : 0) + 1, reset: a && a.reset > Date.now() ? a.reset : Date.now() + 6e4 });
      throw badRequest("Wrong username or password");
    }
    attempts.delete(ip);
    return { token: signToken(u), user: { id: u.id, username: u.username, name: u.name, role: u.role } };
  }, { auth: false });
  r.get("/api/auth/me", async ({ user }) => {
    const u = await get("SELECT id,username,name,role FROM users WHERE id=? AND active=1", user.sub);
    if (!u) throw forbidden("Account disabled");
    return u;
  });
  r.post("/api/auth/password", async ({ user, body }) => {
    const d2 = external_exports.object({ current: external_exports.string(), next: external_exports.string().min(6, "Use at least 6 characters") }).parse(body);
    const u = await get("SELECT password_hash FROM users WHERE id=?", user.sub);
    if (!verifyPassword(d2.current, u.password_hash)) throw badRequest("Current password is wrong");
    await run("UPDATE users SET password_hash=? WHERE id=?", hashPassword(d2.next), user.sub);
  });
  r.get("/api/users", async () => await all("SELECT id,username,name,role,active,created_at FROM users ORDER BY id"), { admin: true });
  r.post("/api/users", async ({ body }) => {
    const d2 = external_exports.object({ username: external_exports.string().trim().min(3), name: external_exports.string().trim().min(1), password: external_exports.string().min(6), role: external_exports.enum(["admin", "staff"]).default("staff") }).parse(body);
    if (await get("SELECT 1 FROM users WHERE username=?", d2.username)) throw badRequest("That username is taken");
    return { id: (await run("INSERT INTO users(username,name,password_hash,role) VALUES(?,?,?,?)", d2.username, d2.name, hashPassword(d2.password), d2.role)).id };
  }, { admin: true });
  r.put("/api/users/:id", async ({ params, body, user }) => {
    const d2 = external_exports.object({ name: external_exports.string().trim().min(1).optional(), role: external_exports.enum(["admin", "staff"]).optional(), active: external_exports.boolean().optional(), password: external_exports.string().min(6).optional() }).parse(body);
    if (Number(params.id) === user.sub && (d2.active === false || d2.role === "staff")) throw badRequest("You cannot lock yourself out");
    await run("UPDATE users SET name=COALESCE(?,name), role=COALESCE(?,role), active=COALESCE(?,active) WHERE id=?", d2.name, d2.role, d2.active === void 0 ? null : Number(d2.active), Number(params.id));
    if (d2.password) await run("UPDATE users SET password_hash=? WHERE id=?", hashPassword(d2.password), Number(params.id));
  }, { admin: true });
}

// src/routes/masters.ts
import path4 from "node:path";

// src/services/posting.ts
async function postVoucher(v) {
  const lines = v.entries.map((e) => ({ ...e, debit: round2(e.debit ?? 0), credit: round2(e.credit ?? 0) })).filter((e) => e.debit !== 0 || e.credit !== 0);
  if (lines.length < 2) throw badRequest("A transaction needs at least two lines");
  for (const e of lines) {
    if (e.debit < 0 || e.credit < 0) throw badRequest("Amounts cannot be negative");
    if (e.debit > 0 && e.credit > 0) throw badRequest("A line cannot be both debit and credit");
  }
  const dr = round2(lines.reduce((s, e) => s + e.debit, 0));
  const cr = round2(lines.reduce((s, e) => s + e.credit, 0));
  if (Math.abs(dr - cr) > 0.01) throw badRequest(`Debits (${dr}) and credits (${cr}) do not match`);
  return await tx(async () => {
    let id2;
    const meta = v.meta === void 0 ? null : JSON.stringify(v.meta);
    if (v.replaceId) {
      const old = await get("SELECT id FROM vouchers WHERE id=?", v.replaceId);
      if (!old) throw notFound("Transaction not found");
      await run(
        `UPDATE vouchers SET type=?, date=?, description=?, party_id=?, farm_id=?, batch_id=?, meta=?, updated_at=datetime('now') WHERE id=?`,
        v.type,
        v.date,
        v.description,
        v.partyId ?? null,
        v.farmId ?? null,
        v.batchId ?? null,
        meta,
        v.replaceId
      );
      await run("DELETE FROM entries WHERE voucher_id=?", v.replaceId);
      id2 = v.replaceId;
    } else {
      const next = (await get("SELECT COALESCE(MAX(voucher_no),0)+1 AS n FROM vouchers")).n;
      id2 = (await run(
        `INSERT INTO vouchers(voucher_no,type,date,description,party_id,farm_id,batch_id,bill_no,meta,source,created_by)
         VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
        next,
        v.type,
        v.date,
        v.description,
        v.partyId ?? null,
        v.farmId ?? null,
        v.batchId ?? null,
        v.billNo ?? null,
        meta,
        v.source ?? "app",
        v.userId ?? null
      )).id;
    }
    for (const [i, e] of lines.entries()) {
      await run(
        `INSERT INTO entries(voucher_id,seq,date,account_id,farm_id,batch_id,debit,credit,category,item,qty,weight,rate,narration)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        id2,
        i,
        v.date,
        e.accountId,
        e.farmId ?? v.farmId ?? null,
        e.batchId ?? v.batchId ?? null,
        e.debit,
        e.credit,
        e.category ?? null,
        e.item ?? null,
        e.qty ?? null,
        e.weight ?? null,
        e.rate ?? null,
        e.narration ?? null
      );
    }
    return id2;
  });
}
async function deleteVoucher(id2) {
  const v = await get("SELECT id,type,batch_id FROM vouchers WHERE id=?", id2);
  if (!v) throw notFound("Transaction not found");
  await tx(async () => {
    await run("DELETE FROM entries WHERE voucher_id=?", id2);
    await run("DELETE FROM vouchers WHERE id=?", id2);
    if (v.type === "close" && v.batch_id) await run(`UPDATE batches SET status='running', closed_date=NULL WHERE id=?`, v.batch_id);
  });
}
async function getVoucher(id2) {
  const v = await get(
    `SELECT v.*, p.name AS party_name, f.name AS farm_name, b.batch_no
       FROM vouchers v
       LEFT JOIN accounts p ON p.id=v.party_id
       LEFT JOIN farms f ON f.id=v.farm_id
       LEFT JOIN batches b ON b.id=v.batch_id
      WHERE v.id=?`,
    id2
  );
  if (!v) throw notFound("Transaction not found");
  const entries = await all(
    `SELECT e.*, a.name AS account_name, a.category AS account_category, f.name AS farm_name
       FROM entries e JOIN accounts a ON a.id=e.account_id LEFT JOIN farms f ON f.id=e.farm_id
      WHERE e.voucher_id=? ORDER BY e.seq, e.id`,
    id2
  );
  return { ...v, meta: v.meta ? JSON.parse(v.meta) : null, entries };
}

// src/services/vouchers.ts
var date = external_exports.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date");
var id = external_exports.coerce.number().int().positive("Please choose one");
var amount = external_exports.coerce.number().positive("Enter an amount greater than zero");
var qtyN = external_exports.coerce.number().positive("Enter a quantity");
var rateN = external_exports.coerce.number().min(0);
var note = external_exports.string().trim().max(300).optional().default("");
var voucherSchemas = {
  feed: external_exports.object({ date, supplierId: id, batchId: id, feedType: external_exports.string().trim().min(1, "Choose the feed type"), bags: qtyN, rate: rateN, narration: note }),
  chicks: external_exports.object({ date, supplierId: id, batchId: id, qty: qtyN, rate: rateN, narration: note }),
  medicine: external_exports.object({ date, supplierId: id, batchId: id, item: external_exports.string().trim().min(1, "Enter the medicine / vaccine name"), qty: qtyN.default(1), rate: rateN, narration: note }),
  feed_return: external_exports.object({
    date,
    batchId: id,
    to: external_exports.enum(["supplier", "batch"]),
    supplierId: id.optional(),
    toBatchId: id.optional(),
    feedType: external_exports.string().trim().min(1, "Choose the feed type"),
    bags: qtyN,
    rate: rateN,
    narration: note
  }),
  integration: external_exports.object({ date, batchId: id, amount, narration: note }),
  misc: external_exports.object({ date, batchId: id, amount, paidFromId: id, narration: note }),
  receipt: external_exports.object({ date, partyId: id, accountId: id, amount, narration: note }),
  payment: external_exports.object({ date, partyId: id, accountId: id, amount, narration: note }),
  expense: external_exports.object({ date, expenseAccountId: id, accountId: id, amount, farmBatchId: id.optional(), narration: note }),
  transfer: external_exports.object({ date, fromAccountId: id, toAccountId: id, amount, narration: note }),
  journal: external_exports.object({
    date,
    narration: note,
    lines: external_exports.array(external_exports.object({ accountId: id, debit: external_exports.coerce.number().min(0).default(0), credit: external_exports.coerce.number().min(0).default(0), narration: note })).min(2, "Add at least two lines")
  })
};
var VOUCHER_TYPES = Object.keys(voucherSchemas);
async function batchCtx(batchId, opts = {}) {
  const b = await get(
    `SELECT b.id,b.batch_no,b.status,b.farm_id,f.name AS farm_name,f.farmer_account_id
       FROM batches b JOIN farms f ON f.id=b.farm_id WHERE b.id=?`,
    batchId
  );
  if (!b) throw notFound("Batch not found");
  if (b.status === "closed" && !opts.allowClosed) throw badRequest(`${b.farm_name} batch #${b.batch_no} is closed. Re-open the batch first to add entries.`);
  return b;
}
async function account(accId, expect) {
  const a = await get("SELECT id,name,category,subtype FROM accounts WHERE id=?", accId);
  if (!a) throw badRequest("Selected account does not exist");
  if (expect && !expect.includes(a.category)) throw badRequest(`${a.name} is not a valid choice here`);
  return a;
}
var liquid = ["cash", "bank"];
var bn = (b) => `${b.farm_name} #${b.batch_no}`;
var builders = {
  async feed(d2) {
    const b = await batchCtx(d2.batchId);
    const s = await account(d2.supplierId, ["supplier"]);
    const amt = round2(d2.bags * d2.rate);
    return {
      type: "feed",
      date: d2.date,
      description: d2.narration || `Feed to ${b.farm_name}`,
      partyId: s.id,
      farmId: b.farm_id,
      batchId: b.id,
      entries: [
        { accountId: await sysAccountId("wip"), debit: amt, category: "feed", item: d2.feedType, qty: d2.bags, rate: d2.rate },
        { accountId: s.id, credit: amt, item: d2.feedType, qty: d2.bags, rate: d2.rate }
      ]
    };
  },
  async chicks(d2) {
    const b = await batchCtx(d2.batchId);
    const s = await account(d2.supplierId, ["supplier"]);
    const amt = round2(d2.qty * d2.rate);
    return {
      type: "chicks",
      date: d2.date,
      description: d2.narration || `Chicks for ${bn(b)}`,
      partyId: s.id,
      farmId: b.farm_id,
      batchId: b.id,
      entries: [
        { accountId: await sysAccountId("wip"), debit: amt, category: "chicks", item: "CHICKS", qty: d2.qty, rate: d2.rate },
        { accountId: s.id, credit: amt, item: "CHICKS", qty: d2.qty, rate: d2.rate }
      ]
    };
  },
  async medicine(d2) {
    const b = await batchCtx(d2.batchId);
    const s = await account(d2.supplierId, ["supplier"]);
    const amt = round2(d2.qty * d2.rate);
    return {
      type: "medicine",
      date: d2.date,
      description: d2.narration || `Medicine to ${b.farm_name}`,
      partyId: s.id,
      farmId: b.farm_id,
      batchId: b.id,
      entries: [
        { accountId: await sysAccountId("wip"), debit: amt, category: "medicine", item: d2.item, qty: d2.qty, rate: d2.rate },
        { accountId: s.id, credit: amt, item: d2.item, qty: d2.qty, rate: d2.rate }
      ]
    };
  },
  async feed_return(d2) {
    const from = await batchCtx(d2.batchId);
    const amt = round2(d2.bags * d2.rate);
    const wip = await sysAccountId("wip");
    const out = { accountId: wip, credit: amt, category: "feed_return", item: d2.feedType, qty: d2.bags, rate: d2.rate };
    if (d2.to === "supplier") {
      if (!d2.supplierId) throw badRequest("Choose the supplier the feed goes back to");
      const s = await account(d2.supplierId, ["supplier"]);
      return {
        type: "feed_return",
        date: d2.date,
        description: d2.narration || `Feed returned from ${from.farm_name} to ${s.name}`,
        partyId: s.id,
        farmId: from.farm_id,
        batchId: from.id,
        entries: [{ accountId: s.id, debit: amt, item: d2.feedType, qty: d2.bags, rate: d2.rate }, out]
      };
    }
    if (!d2.toBatchId) throw badRequest("Choose the farm the feed goes to");
    if (d2.toBatchId === d2.batchId) throw badRequest("Source and destination are the same batch");
    const to = await batchCtx(d2.toBatchId);
    return {
      type: "feed_return",
      date: d2.date,
      description: d2.narration || `Feed transferred from ${from.farm_name} to ${to.farm_name}`,
      farmId: from.farm_id,
      batchId: from.id,
      entries: [
        { accountId: wip, debit: amt, farmId: to.farm_id, batchId: to.id, category: "feed", item: d2.feedType, qty: d2.bags, rate: d2.rate },
        { ...out, farmId: from.farm_id, batchId: from.id }
      ]
    };
  },
  async integration(d2) {
    const b = await batchCtx(d2.batchId);
    if (!b.farmer_account_id) throw badRequest(`${b.farm_name} has no farmer account linked. Edit the farm and set the farmer first.`);
    return {
      type: "integration",
      date: d2.date,
      description: d2.narration || `Integration for ${bn(b)}`,
      partyId: b.farmer_account_id,
      farmId: b.farm_id,
      batchId: b.id,
      entries: [
        { accountId: await sysAccountId("wip"), debit: d2.amount, category: "integration", item: "INTEGRATION" },
        { accountId: b.farmer_account_id, credit: d2.amount, item: "INTEGRATION" }
      ]
    };
  },
  async misc(d2) {
    const b = await batchCtx(d2.batchId);
    const from = await account(d2.paidFromId, liquid);
    return {
      type: "misc",
      date: d2.date,
      description: d2.narration || `Farm expense \u2014 ${b.farm_name}`,
      farmId: b.farm_id,
      batchId: b.id,
      entries: [
        { accountId: await sysAccountId("wip"), debit: d2.amount, category: "misc", item: d2.narration || "MISCELLANEOUS" },
        { accountId: from.id, credit: d2.amount }
      ]
    };
  },
  async receipt(d2) {
    const p = await account(d2.partyId);
    const to = await account(d2.accountId, liquid);
    return {
      type: "receipt",
      date: d2.date,
      description: d2.narration || `Received from ${p.name}`,
      partyId: p.id,
      entries: [{ accountId: to.id, debit: d2.amount }, { accountId: p.id, credit: d2.amount }]
    };
  },
  async payment(d2) {
    const p = await account(d2.partyId);
    const from = await account(d2.accountId, liquid);
    return {
      type: "payment",
      date: d2.date,
      description: d2.narration || `Paid to ${p.name}`,
      partyId: p.id,
      entries: [{ accountId: p.id, debit: d2.amount }, { accountId: from.id, credit: d2.amount }]
    };
  },
  async expense(d2) {
    const ex = await account(d2.expenseAccountId, ["expense"]);
    const from = await account(d2.accountId, liquid);
    if (d2.farmBatchId) {
      const b = await batchCtx(d2.farmBatchId);
      return {
        type: "misc",
        date: d2.date,
        description: d2.narration || `${ex.name} \u2014 ${b.farm_name}`,
        farmId: b.farm_id,
        batchId: b.id,
        entries: [{ accountId: await sysAccountId("wip"), debit: d2.amount, category: "misc", item: ex.name }, { accountId: from.id, credit: d2.amount }]
      };
    }
    return {
      type: "expense",
      date: d2.date,
      description: d2.narration || ex.name,
      partyId: ex.id,
      entries: [{ accountId: ex.id, debit: d2.amount }, { accountId: from.id, credit: d2.amount }]
    };
  },
  async transfer(d2) {
    if (d2.fromAccountId === d2.toAccountId) throw badRequest("Choose two different accounts");
    const from = await account(d2.fromAccountId, liquid);
    const to = await account(d2.toAccountId, liquid);
    return {
      type: "transfer",
      date: d2.date,
      description: d2.narration || `Transfer ${from.name} \u2192 ${to.name}`,
      entries: [{ accountId: to.id, debit: d2.amount }, { accountId: from.id, credit: d2.amount }]
    };
  },
  async journal(d2) {
    for (const l of d2.lines) {
      await account(l.accountId);
      if (l.debit > 0 === l.credit > 0) throw badRequest("Each line needs either a debit or a credit amount");
    }
    return {
      type: "journal",
      date: d2.date,
      description: d2.narration || "Journal entry",
      entries: d2.lines.map((l) => ({ accountId: l.accountId, debit: l.debit, credit: l.credit, narration: l.narration || null }))
    };
  }
};
async function createVoucher(type, raw, userId, replaceId) {
  if (!(type in voucherSchemas)) throw badRequest(`Unknown transaction type "${type}"`);
  const t = type;
  const data = voucherSchemas[t].parse(raw);
  const built = await builders[t](data);
  return await postVoucher({ ...built, userId, replaceId, source: "app", meta: { payload: { ...data, type: t } } });
}
async function editVoucher(voucherId, raw, userId) {
  const v = await get("SELECT source,meta,type FROM vouchers WHERE id=?", voucherId);
  if (!v) throw notFound("Transaction not found");
  const payloadType = v.meta ? JSON.parse(v.meta)?.payload?.type : void 0;
  if (v.source !== "app" || !payloadType) throw badRequest("Imported entries cannot be edited here. Delete and re-enter, or post an adjustment journal.");
  const body = raw ?? {};
  return await createVoucher(body.type ?? payloadType, raw, userId, voucherId);
}
async function listVouchers(f) {
  const where = [];
  const p = [];
  if (f.type) {
    where.push("v.type = ?");
    p.push(f.type);
  }
  if (f.from) {
    where.push("v.date >= ?");
    p.push(f.from);
  }
  if (f.to) {
    where.push("v.date <= ?");
    p.push(f.to);
  }
  if (f.batchId) {
    where.push("v.batch_id = ?");
    p.push(f.batchId);
  }
  if (f.farmId) {
    where.push("v.farm_id = ?");
    p.push(f.farmId);
  }
  if (f.accountId) {
    where.push("EXISTS (SELECT 1 FROM entries x WHERE x.voucher_id=v.id AND x.account_id=?)");
    p.push(f.accountId);
  }
  if (f.q) {
    const like = `%${f.q.replace(/[%_]/g, "")}%`;
    where.push("(v.description LIKE ? OR p.name LIKE ? OR fm.name LIKE ? OR CAST(v.voucher_no AS TEXT)=? OR CAST(v.bill_no AS TEXT)=?)");
    p.push(like, like, like, f.q.trim(), f.q.trim());
  }
  const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const base = `FROM vouchers v LEFT JOIN accounts p ON p.id=v.party_id LEFT JOIN farms fm ON fm.id=v.farm_id LEFT JOIN batches b ON b.id=v.batch_id ${w}`;
  const total = (await get(`SELECT COUNT(*) n ${base}`, ...p)).n;
  const rows = await all(
    `SELECT v.id, v.voucher_no, v.type, v.date, v.description, v.bill_no, v.source, v.party_id, p.name AS party_name,
            v.farm_id, fm.name AS farm_name, v.batch_id, b.batch_no,
            (SELECT COALESCE(SUM(debit),0) FROM entries e WHERE e.voucher_id=v.id) AS amount
       ${base} ORDER BY v.date DESC, v.id DESC LIMIT ? OFFSET ?`,
    ...p,
    Math.min(f.limit ?? 50, 500),
    f.offset ?? 0
  );
  return { total, rows };
}
var nextBillNo = async () => {
  const n2 = Number(await getSetting("next_bill_no", "1")) || 1;
  const used = (await get("SELECT MAX(bill_no) m FROM vouchers"))?.m ?? 0;
  return Math.max(n2, used + 1);
};
var bumpBillNo = async (used) => {
  await run(`INSERT INTO settings(key,value) VALUES('next_bill_no',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`, String(used + 1));
};

// src/services/batches.ts
function computeKpis(i) {
  const avgWeight = i.soldBirds > 0 ? i.soldKg / i.soldBirds : null;
  const fcr = i.soldKg > 0 && i.feedBags > 0 ? i.feedBags * i.bagKg / i.soldKg : null;
  const cfcr = fcr !== null && avgWeight !== null ? fcr + (2 - avgWeight) * 0.25 : null;
  const livability = i.placed && i.placed > 0 && i.soldBirds > 0 ? Math.min(100, i.soldBirds * 100 / i.placed) : null;
  const mortality = livability !== null ? 100 - livability : null;
  const profit = i.sales - i.cost;
  const bpi = livability !== null && avgWeight !== null && fcr !== null && i.meanAge && i.meanAge > 0 ? livability * avgWeight * 100 / (i.meanAge * fcr) : null;
  return {
    avgWeight,
    fcr,
    cfcr,
    livability,
    mortality,
    costPerBird: i.soldBirds > 0 ? i.cost / i.soldBirds : null,
    costPerKg: i.soldKg > 0 ? i.cost / i.soldKg : null,
    salePerBird: i.soldBirds > 0 ? i.sales / i.soldBirds : null,
    profitPerBird: i.soldBirds > 0 ? profit / i.soldBirds : null,
    profitPerKg: i.soldKg > 0 ? profit / i.soldKg : null,
    meanAge: i.meanAge,
    bpi
  };
}
var emptyAgg = () => ({
  costs: { chicks: { amount: 0, qty: 0 }, feed: { amount: 0, qty: 0 }, feed_return: { amount: 0, qty: 0 }, medicine: { amount: 0, qty: 0 }, integration: { amount: 0, qty: 0 }, misc: { amount: 0, qty: 0 }, opening: { amount: 0, qty: 0 } },
  totalCost: 0,
  wipBalance: 0,
  sales: 0,
  birds: 0,
  kg: 0,
  ageSum: 0,
  lastSale: null,
  firstSale: null
});
async function batchAggregates(batchId) {
  const out = /* @__PURE__ */ new Map();
  const A = (id2) => {
    let a = out.get(id2);
    if (!a) {
      a = emptyAgg();
      out.set(id2, a);
    }
    return a;
  };
  const filter = batchId ? "AND e.batch_id = ?" : "";
  const args = batchId ? [batchId] : [];
  const costs = await all(
    `SELECT e.batch_id, e.category, SUM(e.debit) d, SUM(e.credit) c,
            SUM(CASE WHEN e.debit>0 THEN COALESCE(e.qty,0) ELSE -COALESCE(e.qty,0) END) q
       FROM entries e JOIN accounts a ON a.id=e.account_id AND a.sys_key='wip'
      WHERE e.batch_id IS NOT NULL ${filter} GROUP BY e.batch_id, e.category`,
    ...args
  );
  for (const r of costs) {
    const a = A(r.batch_id);
    const amount2 = r.d - r.c;
    a.wipBalance += amount2;
    if (r.category === "cogs") continue;
    a.totalCost += amount2;
    const key2 = r.category && r.category in a.costs ? r.category : "misc";
    a.costs[key2].amount += amount2;
    a.costs[key2].qty += r.q;
  }
  const sales = await all(
    `SELECT e.batch_id,
            SUM(CASE WHEN e.credit>0 THEN COALESCE(e.qty,0) ELSE -COALESCE(e.qty,0) END) birds,
            SUM(CASE WHEN e.credit>0 THEN COALESCE(e.weight,0) ELSE -COALESCE(e.weight,0) END) kg,
            SUM(e.credit-e.debit) amount,
            SUM((CASE WHEN e.credit>0 THEN COALESCE(e.qty,0) ELSE -COALESCE(e.qty,0) END) * (julianday(e.date)-julianday(b.placement_date))) agesum,
            MIN(e.date) first, MAX(e.date) last
       FROM entries e JOIN accounts a ON a.id=e.account_id AND a.sys_key='sales' JOIN batches b ON b.id=e.batch_id
      WHERE e.batch_id IS NOT NULL ${filter} GROUP BY e.batch_id`,
    ...args
  );
  for (const r of sales) {
    const a = A(r.batch_id);
    a.sales = r.amount;
    a.birds = r.birds;
    a.kg = r.kg;
    a.ageSum = r.agesum ?? 0;
    a.firstSale = r.first;
    a.lastSale = r.last;
  }
  return out;
}
var BATCH_SELECT = `SELECT b.id,b.farm_id,f.name AS farm_name,f.farmer_name,b.batch_no,b.placement_date,b.placed_qty,b.status,b.closed_date,b.notes,b.partial
                        FROM batches b JOIN farms f ON f.id=b.farm_id`;
async function summarize(b, a) {
  const bagKg = Number(await getSetting("feed_bag_kg", "50")) || 50;
  const feedBags = a.costs.feed.qty + a.costs.feed_return.qty;
  const meanAge = a.birds > 0 && b.placement_date ? a.ageSum / a.birds : null;
  const kpis = computeKpis({ placed: b.placed_qty, soldBirds: a.birds, soldKg: a.kg, sales: a.sales, cost: a.totalCost, feedBags, bagKg, meanAge });
  if (b.partial) Object.assign(kpis, { fcr: null, cfcr: null, livability: null, mortality: null, bpi: null, meanAge: null });
  const endDate = b.status === "closed" ? b.closed_date ?? a.lastSale ?? today() : today();
  const ageDays = b.placement_date ? Math.max(0, daysBetween(b.placement_date, endDate)) : null;
  return {
    ...b,
    ageDays,
    cost: round2(a.totalCost),
    salesAmount: round2(a.sales),
    profit: round2(a.sales - a.totalCost),
    soldBirds: a.birds,
    soldKg: round2(a.kg),
    feedBags: round2(feedBags),
    wipBalance: round2(a.wipBalance),
    firstSale: a.firstSale,
    lastSale: a.lastSale,
    kpis
  };
}
async function listBatches(f = {}) {
  const where = [];
  const p = [];
  if (f.status) {
    where.push("b.status = ?");
    p.push(f.status);
  }
  if (f.farmId) {
    where.push("b.farm_id = ?");
    p.push(f.farmId);
  }
  if (f.from) {
    where.push("COALESCE(b.closed_date, b.placement_date, ?) >= ?");
    p.push("9999-12-31", f.from);
  }
  if (f.to) {
    where.push("COALESCE(b.placement_date, b.closed_date, ?) <= ?");
    p.push("0000-01-01", f.to);
  }
  const rows = await all(`${BATCH_SELECT} ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY (b.status='running') DESC, COALESCE(b.placement_date,'') DESC, b.id DESC`, ...p);
  const aggs = await batchAggregates();
  return await Promise.all(rows.map(async (b) => await summarize(b, aggs.get(b.id) ?? emptyAgg())));
}
async function getBatch(id2) {
  const b = await get(`${BATCH_SELECT} WHERE b.id=?`, id2);
  if (!b) throw notFound("Batch not found");
  const a = (await batchAggregates(id2)).get(id2) ?? emptyAgg();
  const salesLines = (await all(
    `SELECT e.id, e.date, e.category, e.qty, e.weight, e.rate, e.credit, e.debit, e.voucher_id, v.bill_no, v.party_id, p.name AS trader
       FROM entries e JOIN accounts a ON a.id=e.account_id AND a.sys_key='sales'
       JOIN vouchers v ON v.id=e.voucher_id LEFT JOIN accounts p ON p.id=v.party_id
      WHERE e.batch_id=? ORDER BY e.date, e.id`,
    id2
  )).map((r) => {
    const sign2 = r.credit > 0 ? 1 : -1;
    return {
      id: r.id,
      date: r.date,
      category: r.category ?? "live",
      trader: r.trader,
      billNo: r.bill_no,
      voucherId: r.voucher_id,
      birds: sign2 * (r.qty ?? 0),
      kg: round2(sign2 * (r.weight ?? 0)),
      rate: r.rate,
      amount: round2(r.credit - r.debit),
      avgWeight: r.qty > 0 && r.weight > 0 ? r.weight / r.qty : null
    };
  });
  const bySupplier = await all(
    `SELECT p.name AS party, e.category, SUM(e.debit-e.credit) AS amount
       FROM entries e JOIN accounts a ON a.id=e.account_id AND a.sys_key='wip' LEFT JOIN vouchers v ON v.id=e.voucher_id LEFT JOIN accounts p ON p.id=v.party_id
      WHERE e.batch_id=? AND e.category IN ('feed','chicks','medicine') GROUP BY p.name, e.category ORDER BY amount DESC`,
    id2
  );
  return { ...await summarize(b, a), costs: a.costs, salesLines, bySupplier };
}
async function createBatch(input, userId) {
  const farm = await get("SELECT id,name,active FROM farms WHERE id=?", input.farmId);
  if (!farm) throw badRequest("Choose a farm");
  const running = await get(`SELECT batch_no FROM batches WHERE farm_id=? AND status='running'`, input.farmId);
  if (running) throw badRequest(`${farm.name} already has a running batch (#${running.batch_no}). Close it before starting a new one.`);
  if (!(input.placedQty > 0)) throw badRequest("Enter the number of chicks placed");
  return await tx(async () => {
    const next = (await get("SELECT COALESCE(MAX(batch_no),0)+1 n FROM batches WHERE farm_id=?", input.farmId)).n;
    const id2 = (await run("INSERT INTO batches(farm_id,batch_no,placement_date,placed_qty,notes) VALUES(?,?,?,?,?)", input.farmId, next, input.placementDate, Math.round(input.placedQty), input.notes ?? null)).id;
    if (input.supplierId && input.rate !== null && input.rate !== void 0) {
      await createVoucher("chicks", { date: input.placementDate, supplierId: input.supplierId, batchId: id2, qty: input.billedQty ?? input.placedQty, rate: input.rate }, userId);
    }
    return id2;
  });
}
async function updateBatch(id2, f) {
  if (!await get("SELECT 1 FROM batches WHERE id=?", id2)) throw notFound("Batch not found");
  await run(
    `UPDATE batches SET placement_date=COALESCE(?,placement_date), placed_qty=COALESCE(?,placed_qty), notes=COALESCE(?,notes) WHERE id=?`,
    f.placementDate ?? null,
    f.placedQty ?? null,
    f.notes ?? null,
    id2
  );
}
async function closeBatch(id2, date2, userId) {
  const b = await get(
    "SELECT b.id,b.farm_id,b.status,f.name farm_name,b.batch_no FROM batches b JOIN farms f ON f.id=b.farm_id WHERE b.id=?",
    id2
  );
  if (!b) throw notFound("Batch not found");
  if (b.status === "closed") throw badRequest("This batch is already closed");
  await tx(async () => {
    const bal = round2((await get(`SELECT SUM(e.debit-e.credit) s FROM entries e WHERE e.batch_id=? AND e.account_id=?`, id2, await sysAccountId("wip")))?.s ?? 0);
    if (Math.abs(bal) >= 0.01) {
      await postVoucher({
        type: "close",
        date: date2,
        description: `Batch closed \u2014 cost of goods sold, ${b.farm_name} #${b.batch_no}`,
        farmId: b.farm_id,
        batchId: id2,
        userId,
        source: "app",
        entries: bal > 0 ? [{ accountId: await sysAccountId("cogs"), debit: bal, category: "cogs" }, { accountId: await sysAccountId("wip"), credit: bal, category: "cogs" }] : [{ accountId: await sysAccountId("wip"), debit: -bal, category: "cogs" }, { accountId: await sysAccountId("cogs"), credit: -bal, category: "cogs" }]
      });
    }
    await run(`UPDATE batches SET status='closed', closed_date=? WHERE id=?`, date2, id2);
  });
}
async function reopenBatch(id2) {
  const b = await get("SELECT id,farm_id,status FROM batches WHERE id=?", id2);
  if (!b) throw notFound("Batch not found");
  if (b.status === "running") return;
  if (await get(`SELECT 1 FROM batches WHERE farm_id=? AND status='running'`, b.farm_id)) throw badRequest("This farm already has another running batch");
  await tx(async () => {
    for (const v of await all(`SELECT id FROM vouchers WHERE batch_id=? AND type='close'`, id2)) await run("DELETE FROM vouchers WHERE id=?", v.id);
    await run(`UPDATE batches SET status='running', closed_date=NULL WHERE id=?`, id2);
  });
}
async function suggestIntegration(id2) {
  const perKg = Number(await getSetting("integration_rate_per_kg", "6.5"));
  const perBird = Number(await getSetting("integration_rate_per_bird_broast", "13"));
  const lines = await all(
    `SELECT SUM(CASE WHEN e.credit>0 THEN COALESCE(e.qty,0) ELSE -COALESCE(e.qty,0) END) birds,
            SUM(CASE WHEN e.credit>0 THEN COALESCE(e.weight,0) ELSE -COALESCE(e.weight,0) END) kg
       FROM entries e JOIN accounts a ON a.id=e.account_id AND a.sys_key='sales' WHERE e.batch_id=?`,
    id2
  );
  const kg = lines[0]?.kg ?? 0;
  const birds = lines[0]?.birds ?? 0;
  const paid = (await get(`SELECT SUM(e.debit-e.credit) s FROM entries e JOIN accounts a ON a.id=e.account_id AND a.sys_key='wip' WHERE e.batch_id=? AND e.category='integration'`, id2))?.s ?? 0;
  return { perKg, perBird, kg: round2(kg), birds, byWeight: round2(kg * perKg), byBird: round2(birds * perBird), alreadyPosted: round2(paid) };
}

// src/routes/masters.ts
var accountSchema = external_exports.object({
  name: external_exports.string().trim().min(2, "Enter a name").max(80),
  category: external_exports.enum(CATEGORIES),
  subtype: external_exports.enum(["feed", "medicine", "chicks", "other"]).nullable().optional(),
  phone: external_exports.string().trim().max(30).nullable().optional(),
  notes: external_exports.string().trim().max(300).nullable().optional()
});
function masterRoutes(r) {
  r.get("/api/accounts", async ({ query }) => {
    const where = [];
    const p = [];
    const cats = query.get("category")?.split(",").filter(Boolean);
    if (cats?.length) {
      where.push(`a.category IN (${cats.map(() => "?").join(",")})`);
      p.push(...cats);
    }
    if (query.get("subtype")) {
      where.push("a.subtype=?");
      p.push(query.get("subtype"));
    }
    if (query.get("q")) {
      where.push("a.name LIKE ?");
      p.push(`%${query.get("q")}%`);
    }
    if (query.get("active") !== "all") where.push("a.active=1");
    return await all(
      `SELECT a.id,a.name,a.type,a.category,a.subtype,a.sys_key,a.phone,a.notes,a.active, COALESCE(b.bal,0) AS balance, b.last AS last_activity, COALESCE(b.n,0) AS entries
         FROM accounts a LEFT JOIN (SELECT account_id, SUM(debit-credit) bal, MAX(date) last, COUNT(*) n FROM entries GROUP BY account_id) b ON b.account_id=a.id
        ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY a.name`,
      ...p
    );
  });
  r.post("/api/accounts", async ({ body }) => {
    const d2 = accountSchema.parse(body);
    if (await get("SELECT 1 FROM accounts WHERE name=?", d2.name)) throw badRequest(`"${d2.name}" already exists`);
    const id2 = await addAccount(d2.name, d2.category, { subtype: d2.category === "supplier" ? d2.subtype ?? "other" : null });
    await run("UPDATE accounts SET phone=?, notes=? WHERE id=?", d2.phone ?? null, d2.notes ?? null, id2);
    return { id: id2 };
  });
  r.put("/api/accounts/:id", async ({ params, body }) => {
    const id2 = Number(params.id);
    const cur = await get("SELECT sys_key FROM accounts WHERE id=?", id2);
    if (!cur) throw notFound("Account not found");
    const d2 = accountSchema.partial().extend({ active: external_exports.boolean().optional() }).parse(body);
    if (d2.name && await get("SELECT 1 FROM accounts WHERE name=? AND id<>?", d2.name, id2)) throw badRequest(`"${d2.name}" already exists`);
    if (d2.category && cur.sys_key) throw badRequest("System accounts cannot change type");
    await run(
      `UPDATE accounts SET name=COALESCE(?,name), category=COALESCE(?,category), type=COALESCE(?,type), subtype=?, phone=COALESCE(?,phone), notes=COALESCE(?,notes), active=COALESCE(?,active) WHERE id=?`,
      d2.name,
      d2.category,
      d2.category ? CATEGORY_TYPE[d2.category] : null,
      d2.category === "supplier" || d2.subtype ? d2.subtype ?? "other" : (await get("SELECT subtype FROM accounts WHERE id=?", id2)).subtype,
      d2.phone,
      d2.notes,
      d2.active === void 0 ? null : Number(d2.active),
      id2
    );
  });
  r.delete("/api/accounts/:id", async ({ params, query }) => {
    const id2 = Number(params.id);
    const force = query.get("force") === "1";
    const a = await get("SELECT sys_key FROM accounts WHERE id=?", id2);
    if (!a) throw notFound();
    if (a.sys_key) throw badRequest("System accounts cannot be deleted");
    const vouchers = (await all("SELECT DISTINCT voucher_id FROM entries WHERE account_id=?", id2)).map((x) => x.voucher_id);
    if (vouchers.length && !force) throw badRequest("This account has transactions. Mark it inactive, or delete it together with its transactions.");
    let backup = null;
    if (vouchers.length) {
      backup = await backupLocal("before-delete");
    }
    await tx(async () => {
      for (const v of vouchers) await deleteVoucher(v);
      await run("UPDATE farms SET farmer_account_id=NULL WHERE farmer_account_id=?", id2);
      await run("DELETE FROM accounts WHERE id=?", id2);
    });
    return { deletedVouchers: vouchers.length, backup: backup ? path4.basename(backup) : null };
  }, { admin: true });
  const farmSchema = external_exports.object({
    name: external_exports.string().trim().min(2, "Enter the farm name").max(80),
    farmerName: external_exports.string().trim().max(80).nullable().optional(),
    farmerAccountId: external_exports.coerce.number().int().positive().nullable().optional(),
    phone: external_exports.string().trim().max(30).nullable().optional(),
    location: external_exports.string().trim().max(120).nullable().optional(),
    capacity: external_exports.coerce.number().int().min(0).nullable().optional(),
    notes: external_exports.string().trim().max(300).nullable().optional(),
    active: external_exports.boolean().optional()
  });
  const resolveFarmer = async (d2) => {
    if (d2.farmerAccountId) return d2.farmerAccountId;
    if (d2.farmerName) {
      const ex = await get("SELECT id FROM accounts WHERE name=?", d2.farmerName);
      return ex ? ex.id : await addAccount(d2.farmerName.toUpperCase(), "farmer");
    }
    return null;
  };
  r.get("/api/farms", async () => {
    const farms = await all(`SELECT f.*, a.name AS farmer_account FROM farms f LEFT JOIN accounts a ON a.id=f.farmer_account_id ORDER BY f.active DESC, f.name`);
    const batches = await listBatches();
    return farms.map((f) => {
      const mine = batches.filter((b) => b.farm_id === f.id);
      const running = mine.find((b) => b.status === "running") ?? null;
      const done = mine.filter((b) => b.status === "closed" && b.soldKg > 0);
      const profit = done.reduce((s, b) => s + b.profit, 0);
      const kg = done.reduce((s, b) => s + b.soldKg, 0);
      const fcrs = done.map((b) => b.kpis.fcr).filter((x) => x !== null);
      return {
        ...f,
        batchCount: mine.length,
        running: running ? { id: running.id, batch_no: running.batch_no, ageDays: running.ageDays, placed_qty: running.placed_qty, cost: running.cost } : null,
        lifetime: { profit: Math.round(profit), profitPerKg: kg > 0 ? profit / kg : null, avgFcr: fcrs.length ? fcrs.reduce((s, x) => s + x, 0) / fcrs.length : null }
      };
    });
  });
  r.post("/api/farms", async ({ body }) => {
    const d2 = farmSchema.parse(body);
    if (await get("SELECT 1 FROM farms WHERE name=?", d2.name)) throw badRequest(`Farm "${d2.name}" already exists`);
    return { id: (await run("INSERT INTO farms(name,farmer_name,farmer_account_id,phone,location,capacity,notes) VALUES(?,?,?,?,?,?,?)", d2.name, d2.farmerName, await resolveFarmer(d2), d2.phone, d2.location, d2.capacity, d2.notes)).id };
  });
  r.put("/api/farms/:id", async ({ params, body }) => {
    const id2 = Number(params.id);
    if (!await get("SELECT 1 FROM farms WHERE id=?", id2)) throw notFound("Farm not found");
    const d2 = farmSchema.partial().parse(body);
    if (d2.name && await get("SELECT 1 FROM farms WHERE name=? AND id<>?", d2.name, id2)) throw badRequest(`Farm "${d2.name}" already exists`);
    const farmer = d2.farmerAccountId !== void 0 || d2.farmerName ? await resolveFarmer(d2) : null;
    await run(
      `UPDATE farms SET name=COALESCE(?,name), farmer_name=COALESCE(?,farmer_name), farmer_account_id=COALESCE(?,farmer_account_id), phone=COALESCE(?,phone), location=COALESCE(?,location),
         capacity=COALESCE(?,capacity), notes=COALESCE(?,notes), active=COALESCE(?,active) WHERE id=?`,
      d2.name,
      d2.farmerName,
      farmer,
      d2.phone,
      d2.location,
      d2.capacity,
      d2.notes,
      d2.active === void 0 ? null : Number(d2.active),
      id2
    );
  });
}

// src/services/sales.ts
var n = (min = 0) => external_exports.coerce.number().min(min);
var saleSchema = external_exports.object({
  date: external_exports.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date"),
  traderId: external_exports.coerce.number().int().positive("Choose the buyer"),
  batchId: external_exports.coerce.number().int().positive("Choose the farm / batch"),
  billNo: external_exports.coerce.number().int().positive().optional(),
  vehicleNo: external_exports.string().trim().max(30).optional().default(""),
  isBroast: external_exports.boolean().optional().default(false),
  boxes: external_exports.array(external_exports.object({ emptyBoxes: n().default(0), emptyWeight: n().default(0), loadedBoxes: n().default(0), loadedWeight: n().default(0) })).optional().default([]),
  grossKg: n().optional().default(0),
  birds: external_exports.coerce.number().int().positive("Enter the number of birds"),
  damageKg: n().optional().default(0),
  rate: external_exports.coerce.number().positive("Enter the rate per kg"),
  weakBirds: n().optional().default(0),
  weakKg: n().optional().default(0),
  weakRate: n().optional().default(0),
  receivedAmount: n().optional().default(0),
  receivedAccountId: external_exports.coerce.number().int().positive().optional(),
  narration: external_exports.string().trim().max(300).optional().default("")
});
function computeBill(d2) {
  const emptyWeight = round2(d2.boxes.reduce((s, b) => s + b.emptyWeight, 0));
  const loadedWeight = round2(d2.boxes.reduce((s, b) => s + b.loadedWeight, 0));
  const emptyBoxes = d2.boxes.reduce((s, b) => s + b.emptyBoxes, 0);
  const loadedBoxes = d2.boxes.reduce((s, b) => s + b.loadedBoxes, 0);
  const gross = d2.boxes.length ? round2(loadedWeight - emptyWeight) : round2(d2.grossKg);
  const netKg = round2(gross - d2.damageKg);
  if (netKg <= 0) throw badRequest("Net weight must be greater than zero \u2014 check the box weights");
  const liveAmount = round2(netKg * d2.rate);
  const weakAmount = round2(d2.weakKg * d2.weakRate);
  return { emptyWeight, loadedWeight, emptyBoxes, loadedBoxes, gross, netKg, liveAmount, weakAmount, total: round2(liveAmount + weakAmount), avgWeight: d2.birds > 0 ? netKg / d2.birds : 0 };
}
async function createSale(raw, userId, replaceId) {
  const d2 = saleSchema.parse(raw);
  const trader = await get(`SELECT id,name FROM accounts WHERE id=? AND category IN ('trader','other_asset','other_liability','supplier','farmer')`, d2.traderId);
  if (!trader) throw badRequest("Choose the buyer");
  const b = await batchCtx(d2.batchId, { allowClosed: true });
  const calc = computeBill(d2);
  return await tx(async () => {
    let billNo = d2.billNo ?? null;
    if (replaceId) billNo = (await get("SELECT bill_no FROM vouchers WHERE id=?", replaceId))?.bill_no ?? billNo;
    else if (!billNo) billNo = await nextBillNo();
    else if (await get("SELECT 1 FROM vouchers WHERE bill_no=?", billNo)) throw badRequest(`Bill no. ${billNo} is already used`);
    const entries = [
      { accountId: trader.id, debit: calc.total, item: `Bill ${billNo}` },
      { accountId: await sysAccountId("sales"), credit: calc.liveAmount, category: "live", item: trader.name, qty: d2.birds, weight: calc.netKg, rate: d2.rate }
    ];
    if (calc.weakAmount > 0) entries.push({ accountId: await sysAccountId("sales"), credit: calc.weakAmount, category: "weak", item: "WEAK BIRDS", qty: d2.weakBirds, weight: d2.weakKg, rate: d2.weakRate });
    const id2 = await postVoucher({
      type: "sale",
      date: d2.date,
      description: d2.narration || `Sale to ${trader.name} from ${b.farm_name}`,
      partyId: trader.id,
      farmId: b.farm_id,
      batchId: b.id,
      billNo,
      userId,
      source: "app",
      replaceId,
      entries,
      meta: { payload: { ...d2, type: "sale" }, calc, bill: { vehicleNo: d2.vehicleNo, boxes: d2.boxes, isBroast: d2.isBroast } }
    });
    if (!replaceId) {
      if (billNo !== null && (!d2.billNo || billNo >= await nextBillNo())) await bumpBillNo(billNo);
      if (d2.receivedAmount > 0) {
        const acc = d2.receivedAccountId ?? await sysAccountId("cash");
        await createVoucher("receipt", { date: d2.date, partyId: trader.id, accountId: acc, amount: d2.receivedAmount, narration: `Received with bill no. ${billNo}` }, userId);
      }
    }
    return { id: id2, billNo, total: calc.total };
  });
}
async function listSales(f) {
  const where = [`v.type='sale'`];
  const p = [];
  if (f.from) {
    where.push("v.date>=?");
    p.push(f.from);
  }
  if (f.to) {
    where.push("v.date<=?");
    p.push(f.to);
  }
  if (f.traderId) {
    where.push("v.party_id=?");
    p.push(f.traderId);
  }
  if (f.farmId) {
    where.push("v.farm_id=?");
    p.push(f.farmId);
  }
  if (f.batchId) {
    where.push("v.batch_id=?");
    p.push(f.batchId);
  }
  if (f.q) {
    const like = `%${f.q}%`;
    where.push("(t.name LIKE ? OR fm.name LIKE ? OR CAST(v.bill_no AS TEXT)=?)");
    p.push(like, like, f.q.trim());
  }
  const rows = await all(
    `SELECT v.id, v.date, v.bill_no, v.voucher_no, v.source, t.name AS trader, v.party_id, fm.name AS farm, v.farm_id, v.batch_id, b.batch_no,
            SUM(CASE WHEN e.credit>0 THEN COALESCE(e.qty,0) ELSE -COALESCE(e.qty,0) END) AS birds,
            SUM(CASE WHEN e.credit>0 THEN COALESCE(e.weight,0) ELSE -COALESCE(e.weight,0) END) AS kg,
            SUM(e.credit-e.debit) AS amount
       FROM vouchers v
       JOIN entries e ON e.voucher_id=v.id AND e.account_id=${await sysAccountId("sales")}
       LEFT JOIN accounts t ON t.id=v.party_id LEFT JOIN farms fm ON fm.id=v.farm_id LEFT JOIN batches b ON b.id=v.batch_id
      WHERE ${where.join(" AND ")}
      GROUP BY v.id ORDER BY v.date DESC, v.id DESC LIMIT 1000`,
    ...p
  );
  const totals = rows.reduce((s, r) => ({ birds: s.birds + (r.birds ?? 0), kg: s.kg + (r.kg ?? 0), amount: s.amount + (r.amount ?? 0) }), { birds: 0, kg: 0, amount: 0 });
  return { rows: rows.map((r) => ({ ...r, kg: round2(r.kg), amount: round2(r.amount), avgWeight: r.birds > 0 ? r.kg / r.birds : null, rate: r.kg > 0 ? r.amount / r.kg : null })), totals: { ...totals, kg: round2(totals.kg), amount: round2(totals.amount) } };
}
async function getSaleBill(voucherId) {
  const v = await get(
    `SELECT v.*, t.name AS trader, fm.name AS farm, b.batch_no FROM vouchers v
       LEFT JOIN accounts t ON t.id=v.party_id LEFT JOIN farms fm ON fm.id=v.farm_id LEFT JOIN batches b ON b.id=v.batch_id
      WHERE v.id=? AND v.type='sale'`,
    voucherId
  );
  if (!v) throw notFound("Bill not found");
  const meta = v.meta ? JSON.parse(v.meta) : null;
  const lines = await all(`SELECT e.category, e.qty, e.weight, e.rate, e.credit-e.debit AS amount FROM entries e WHERE e.voucher_id=? AND e.account_id=?`, voucherId, await sysAccountId("sales"));
  const balance = (await get(`SELECT COALESCE(SUM(e.debit-e.credit),0) s FROM entries e WHERE e.account_id=? AND (e.date < ? OR (e.date = ? AND e.voucher_id <= ?))`, v.party_id, v.date, v.date, voucherId))?.s ?? 0;
  const previous = round2(balance - lines.reduce((s, l) => s + l.amount, 0));
  return { ...v, meta, lines, partyBalanceAfter: round2(balance), partyBalanceBefore: previous };
}

// src/routes/transactions.ts
var optNum = (v) => v ? Number(v) : void 0;
function transactionRoutes(r) {
  r.get("/api/vouchers", async ({ query }) => await listVouchers({
    type: query.get("type") || void 0,
    from: query.get("from") || void 0,
    to: query.get("to") || void 0,
    q: query.get("q") || void 0,
    accountId: optNum(query.get("accountId")),
    batchId: optNum(query.get("batchId")),
    farmId: optNum(query.get("farmId")),
    limit: optNum(query.get("limit")),
    offset: optNum(query.get("offset"))
  }));
  r.get("/api/vouchers/types", () => VOUCHER_TYPES);
  r.get("/api/vouchers/:id", async ({ params }) => await getVoucher(Number(params.id)));
  r.post("/api/vouchers/:type", async ({ params, body, user }) => ({ id: await createVoucher(params.type, body, user.sub) }));
  r.put("/api/vouchers/:id", async ({ params, body, user }) => {
    const v = await get("SELECT type FROM vouchers WHERE id=?", Number(params.id));
    if (v?.type === "sale") return await createSale(body, user.sub, Number(params.id));
    return { id: await editVoucher(Number(params.id), body, user.sub) };
  });
  r.delete("/api/vouchers/:id", async ({ params }) => await deleteVoucher(Number(params.id)), { admin: true });
  r.patch("/api/vouchers/:id/batch", async ({ params, body }) => {
    const { batchId } = external_exports.object({ batchId: external_exports.coerce.number().int().positive() }).parse(body);
    const b = await get("SELECT id,farm_id FROM batches WHERE id=?", batchId);
    if (!b) throw badRequest("Batch not found");
    const id2 = Number(params.id);
    await run("UPDATE vouchers SET batch_id=?, farm_id=? WHERE id=?", b.id, b.farm_id, id2);
    await run("UPDATE entries SET batch_id=?, farm_id=? WHERE voucher_id=? AND (batch_id IS NOT NULL OR farm_id IS NOT NULL)", b.id, b.farm_id, id2);
  }, { admin: true });
  r.get("/api/sales", async ({ query }) => await listSales({
    from: query.get("from") || void 0,
    to: query.get("to") || void 0,
    q: query.get("q") || void 0,
    traderId: optNum(query.get("traderId")),
    farmId: optNum(query.get("farmId")),
    batchId: optNum(query.get("batchId"))
  }));
  r.get("/api/sales/next-bill-no", async () => ({ billNo: await nextBillNo() }));
  r.get("/api/sales/:id", async ({ params }) => await getSaleBill(Number(params.id)));
  r.post("/api/sales", async ({ body, user }) => await createSale(body, user.sub));
  r.get("/api/batches", async ({ query }) => await listBatches({ status: query.get("status") || void 0, farmId: optNum(query.get("farmId")), from: query.get("from") || void 0, to: query.get("to") || void 0 }));
  r.get("/api/batches/:id", async ({ params }) => await getBatch(Number(params.id)));
  r.get("/api/batches/:id/integration-suggestion", async ({ params }) => await suggestIntegration(Number(params.id)));
  r.post("/api/batches", async ({ body, user }) => {
    const d2 = external_exports.object({
      farmId: external_exports.coerce.number().int().positive("Choose a farm"),
      placementDate: external_exports.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick the placement date"),
      placedQty: external_exports.coerce.number().int().positive("Enter the number of chicks placed"),
      supplierId: external_exports.coerce.number().int().positive().nullable().optional(),
      billedQty: external_exports.coerce.number().positive().nullable().optional(),
      rate: external_exports.coerce.number().min(0).nullable().optional(),
      notes: external_exports.string().trim().max(300).optional()
    }).parse(body);
    return { id: await createBatch(d2, user.sub) };
  });
  r.put("/api/batches/:id", async ({ params, body }) => {
    const d2 = external_exports.object({ placementDate: external_exports.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(), placedQty: external_exports.coerce.number().int().positive().nullable().optional(), notes: external_exports.string().max(300).nullable().optional() }).parse(body);
    await updateBatch(Number(params.id), d2);
  });
  r.post("/api/batches/:id/close", async ({ params, body, user }) => {
    const { date: date2 } = external_exports.object({ date: external_exports.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick the closing date") }).parse(body);
    await closeBatch(Number(params.id), date2, user.sub);
  });
  r.post("/api/batches/:id/reopen", async ({ params }) => await reopenBatch(Number(params.id)), { admin: true });
}

// src/services/reports.ts
var FAR_PAST = "0000-01-01";
var FAR_FUTURE = "9999-12-31";
async function trialBalance(from = FAR_PAST, to = FAR_FUTURE) {
  const rows = await all(
    `SELECT a.id,a.name,a.type,a.category,a.sys_key, COALESCE(SUM(e.debit),0) debit, COALESCE(SUM(e.credit),0) credit
       FROM accounts a JOIN entries e ON e.account_id=a.id AND e.date BETWEEN ? AND ?
      GROUP BY a.id ORDER BY a.type, a.category, a.name`,
    from,
    to
  );
  const wipFarms = await all(
    `SELECT COALESCE(f.name,'(no farm)') farm, SUM(e.debit) debit, SUM(e.credit) credit
       FROM entries e JOIN accounts a ON a.id=e.account_id AND a.sys_key='wip' LEFT JOIN farms f ON f.id=e.farm_id
      WHERE e.date BETWEEN ? AND ? GROUP BY f.id ORDER BY f.name`,
    from,
    to
  );
  const out = rows.map((r) => ({
    ...r,
    debit: round2(r.debit),
    credit: round2(r.credit),
    balance: round2(r.debit - r.credit),
    children: r.sys_key === "wip" ? wipFarms.map((w) => ({ name: w.farm, debit: round2(w.debit), credit: round2(w.credit), balance: round2(w.debit - w.credit) })).filter((c) => Math.abs(c.balance) > 4e-3 || c.debit > 0) : void 0
  }));
  const totals = out.reduce((s, r) => ({ debit: s.debit + r.debit, credit: s.credit + r.credit }), { debit: 0, credit: 0 });
  return { from, to, rows: out, totals: { debit: round2(totals.debit), credit: round2(totals.credit) } };
}
async function incomeStatement(from = FAR_PAST, to = FAR_FUTURE) {
  const rows = await all(
    `SELECT a.id,a.name,a.type,a.category, SUM(e.credit-e.debit) net
       FROM accounts a JOIN entries e ON e.account_id=a.id AND e.date BETWEEN ? AND ?
      WHERE a.type IN ('income','expense') GROUP BY a.id ORDER BY a.name`,
    from,
    to
  );
  const sales = rows.filter((r) => r.type === "income").map((r) => ({ id: r.id, name: r.name, amount: round2(r.net) }));
  const cogs = rows.filter((r) => r.category === "cogs").map((r) => ({ id: r.id, name: r.name, amount: round2(-r.net) }));
  const expenses = rows.filter((r) => r.type === "expense" && r.category !== "cogs").map((r) => ({ id: r.id, name: r.name, amount: round2(-r.net) })).sort((a, b) => b.amount - a.amount);
  const sum = (a) => round2(a.reduce((s, r) => s + r.amount, 0));
  const totalSales = sum(sales), totalCogs = sum(cogs), totalExpenses = sum(expenses);
  const grossProfit = round2(totalSales - totalCogs);
  return {
    from,
    to,
    sales,
    cogs,
    expenses,
    totalSales,
    totalCogs,
    grossProfit,
    totalExpenses,
    netProfit: round2(grossProfit - totalExpenses),
    grossMargin: totalSales ? grossProfit / totalSales * 100 : null
  };
}
async function balanceSheet(asOf = FAR_FUTURE) {
  const bal = await all(
    `SELECT a.id,a.name,a.type,a.category,a.sys_key, SUM(e.debit-e.credit) bal
       FROM accounts a JOIN entries e ON e.account_id=a.id AND e.date <= ? GROUP BY a.id ORDER BY a.name`,
    asOf
  );
  const wipFarms = await all(
    `SELECT COALESCE(f.name,'(no farm)') farm, SUM(e.debit-e.credit) bal
       FROM entries e JOIN accounts a ON a.id=e.account_id AND a.sys_key='wip' LEFT JOIN farms f ON f.id=e.farm_id
      WHERE e.date <= ? GROUP BY f.id HAVING ABS(SUM(e.debit-e.credit)) > 0.004 ORDER BY bal DESC`,
    asOf
  );
  const pick = (cats, sign2) => bal.filter((r) => cats.includes(r.category) && Math.abs(r.bal) > 4e-3).map((r) => ({ id: r.id, name: r.name, amount: round2(sign2 * r.bal) })).sort((a, b) => b.amount - a.amount);
  const sec = (title, rows) => ({ title, rows, total: round2(rows.reduce((s, r) => s + r.amount, 0)) });
  const profit = round2(bal.filter((r) => r.type === "income" || r.type === "expense").reduce((s, r) => s - r.bal, 0));
  const wip = bal.find((r) => r.sys_key === "wip");
  const assets = [
    sec("Cash & bank", pick(["cash", "bank"], 1)),
    sec("Traders (receivable)", pick(["trader"], 1)),
    { ...sec("Farm batches in progress", wipFarms.map((w) => ({ name: w.farm, amount: round2(w.bal) }))), total: round2(wip?.bal ?? 0) },
    sec("Other current assets", pick(["other_asset"], 1)),
    sec("Fixed assets", pick(["fixed_asset"], 1))
  ];
  const liabilities = [
    sec("Suppliers (payable)", pick(["supplier"], -1)),
    sec("Farmers (payable)", pick(["farmer"], -1)),
    sec("Loans & borrowings", pick(["loan"], -1)),
    sec("Other liabilities", pick(["other_liability"], -1))
  ];
  const equity = sec("Owners\u2019 equity", [...pick(["equity"], -1), { name: "Profit to date", amount: profit }]);
  const totalAssets = round2(assets.reduce((s, x) => s + x.total, 0));
  const totalLiab = round2(liabilities.reduce((s, x) => s + x.total, 0));
  return { asOf, assets, liabilities, equity, totalAssets, totalLiabilities: totalLiab, totalEquity: equity.total, totalLiabilitiesAndEquity: round2(totalLiab + equity.total), difference: round2(totalAssets - totalLiab - equity.total) };
}
async function ledger(accountId, from = FAR_PAST, to = FAR_FUTURE, farmId, batchId) {
  const acc = await get("SELECT id,name,category,type,sys_key FROM accounts WHERE id=?", accountId);
  if (!acc) throw notFound("Account not found");
  const extra = (farmId ? " AND e.farm_id = ?" : "") + (batchId ? " AND e.batch_id = ?" : "");
  const extraArgs = [...farmId ? [farmId] : [], ...batchId ? [batchId] : []];
  const opening = (await get(`SELECT SUM(e.debit-e.credit) s FROM entries e WHERE e.account_id=? AND e.date < ? ${extra}`, accountId, from, ...extraArgs))?.s ?? 0;
  const lines = await all(
    `SELECT e.id, e.date, e.voucher_id, v.voucher_no, v.type, v.description, v.bill_no, e.debit, e.credit, e.category, e.item, e.qty, e.weight, e.rate, fm.name AS farm,
            (SELECT group_concat(DISTINCT a2.name) FROM entries e2 JOIN accounts a2 ON a2.id=e2.account_id
              WHERE e2.voucher_id=e.voucher_id AND e2.id<>e.id AND ((e.debit>0 AND e2.credit>0) OR (e.credit>0 AND e2.debit>0))) AS counter
       FROM entries e JOIN vouchers v ON v.id=e.voucher_id LEFT JOIN farms fm ON fm.id=e.farm_id
      WHERE e.account_id=? AND e.date BETWEEN ? AND ? ${extra}
      ORDER BY e.date, v.id, e.id`,
    accountId,
    from,
    to,
    ...extraArgs
  );
  let run2 = opening;
  const rows = lines.map((l) => {
    run2 += l.debit - l.credit;
    return { ...l, balance: round2(run2) };
  });
  const totals = rows.reduce((s, r) => ({ debit: s.debit + r.debit, credit: s.credit + r.credit }), { debit: 0, credit: 0 });
  return { account: acc, from, to, opening: round2(opening), rows, totals: { debit: round2(totals.debit), credit: round2(totals.credit) }, closing: round2(run2) };
}
async function outstanding(categories) {
  const ph = categories.map(() => "?").join(",");
  const rows = await all(
    `SELECT a.id,a.name,a.category,a.phone, SUM(e.debit-e.credit) bal, MAX(e.date) last
       FROM accounts a JOIN entries e ON e.account_id=a.id WHERE a.category IN (${ph}) GROUP BY a.id HAVING ABS(SUM(e.debit-e.credit)) > 0.5 ORDER BY ABS(bal) DESC`,
    ...categories
  );
  const receivable = round2(rows.filter((r) => r.bal > 0).reduce((s, r) => s + r.bal, 0));
  const payable = round2(rows.filter((r) => r.bal < 0).reduce((s, r) => s - r.bal, 0));
  return { rows: rows.map((r) => ({ ...r, bal: round2(r.bal) })), receivable, payable };
}

// src/services/dashboard.ts
function monthsBack(n2, from) {
  const out = [];
  let y = Number(from.slice(0, 4)), m = Number(from.slice(5, 7));
  for (let i = 0; i < n2; i++) {
    out.unshift(`${y}-${String(m).padStart(2, "0")}`);
    m--;
    if (m === 0) {
      m = 12;
      y--;
    }
  }
  return out;
}
async function dashboard() {
  const t = today();
  const months = monthsBack(12, t);
  const since = months[0] + "-01";
  const liquid2 = await all(
    `SELECT a.id,a.name,a.category,COALESCE(SUM(e.debit-e.credit),0) bal FROM accounts a LEFT JOIN entries e ON e.account_id=a.id
      WHERE a.category IN ('cash','bank') AND a.active=1 GROUP BY a.id ORDER BY (a.category='cash') DESC, a.name`
  );
  const cash = round2(liquid2.filter((l) => l.category === "cash").reduce((s, l) => s + l.bal, 0));
  const bank = round2(liquid2.filter((l) => l.category === "bank").reduce((s, l) => s + l.bal, 0));
  const traders = await outstanding(["trader"]);
  const suppliers = await outstanding(["supplier"]);
  const farmers = await outstanding(["farmer"]);
  const salesId = await sysAccountId("sales");
  const monthlySales = await all(
    `SELECT substr(date,1,7) m, SUM(credit-debit) amount,
            SUM(CASE WHEN credit>0 THEN COALESCE(weight,0) ELSE -COALESCE(weight,0) END) kg,
            SUM(CASE WHEN credit>0 THEN COALESCE(qty,0) ELSE -COALESCE(qty,0) END) birds
       FROM entries WHERE account_id=? AND date>=? GROUP BY m`,
    salesId,
    since
  );
  const monthlyPnl = await all(
    `SELECT substr(e.date,1,7) m, a.type, SUM(e.credit-e.debit) net FROM entries e JOIN accounts a ON a.id=e.account_id
      WHERE a.type IN ('income','expense') AND e.date>=? GROUP BY m, a.type`,
    since
  );
  const series = months.map((m) => {
    const s = monthlySales.find((x) => x.m === m);
    const profit = monthlyPnl.filter((x) => x.m === m).reduce((sum, x) => sum + x.net, 0);
    return { month: m, sales: round2(s?.amount ?? 0), kg: round2(s?.kg ?? 0), birds: s?.birds ?? 0, profit: round2(profit) };
  });
  const thisM = series[series.length - 1], lastM = series[series.length - 2];
  const ytdFrom = `${t.slice(0, 4)}-01-01`;
  const ytd = await all(
    `SELECT a.type, a.category, SUM(e.credit-e.debit) net FROM entries e JOIN accounts a ON a.id=e.account_id WHERE a.type IN ('income','expense') AND e.date>=? GROUP BY a.type, a.category`,
    ytdFrom
  );
  const ytdSales = ytd.filter((r) => r.type === "income").reduce((s, r) => s + r.net, 0);
  const ytdCogs = ytd.filter((r) => r.category === "cogs").reduce((s, r) => s - r.net, 0);
  const ytdNet = ytd.reduce((s, r) => s + r.net, 0);
  const batches = await listBatches();
  const running = batches.filter((b) => b.status === "running");
  const alertDays = Number(await getSetting("harvest_alert_days", "33"));
  const closed = batches.filter((b) => b.status === "closed" && b.soldKg > 0 && b.closed_date && b.closed_date >= addDays(t, -120));
  const avg = (xs) => {
    const v = xs.filter((x) => x !== null);
    return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null;
  };
  const recent = await all(
    `SELECT v.id, v.voucher_no, v.type, v.date, v.description, p.name AS party_name,
            (SELECT COALESCE(SUM(debit),0) FROM entries e WHERE e.voucher_id=v.id) AS amount
       FROM vouchers v LEFT JOIN accounts p ON p.id=v.party_id ORDER BY v.id DESC LIMIT 8`
  );
  const suspense = (await get("SELECT SUM(debit-credit) s FROM entries WHERE account_id=?", await sysAccountId("suspense")))?.s ?? 0;
  const lastCount = await get("SELECT date FROM cash_counts ORDER BY date DESC LIMIT 1");
  const alerts = [];
  for (const b of running) if (b.ageDays !== null && b.ageDays >= alertDays) alerts.push({ level: "warn", text: `${b.farm_name} batch is ${b.ageDays} days old \u2014 harvest due`, href: `/batches/${b.id}` });
  if (Math.abs(suspense) > 1) alerts.push({ level: "info", text: `Suspense balance of \u20B9${Math.round(suspense).toLocaleString("en-IN")} from imported entries needs review`, href: `/ledger/${await sysAccountId("suspense")}` });
  if (!lastCount || lastCount.date < addDays(t, -1)) alerts.push({ level: "info", text: "Cash was not counted yesterday \u2014 record today\u2019s denomination count in Cash Book", href: "/cashbook" });
  return {
    today: t,
    liquid: liquid2,
    cash,
    bank,
    receivables: traders.receivable,
    payablesSuppliers: suppliers.payable,
    payablesFarmers: farmers.payable,
    topDebtors: traders.rows.filter((r) => r.bal > 0).slice(0, 6),
    topCreditors: suppliers.rows.filter((r) => r.bal < 0).slice(0, 6).map((r) => ({ ...r, bal: -r.bal })),
    thisMonth: { month: thisM.month, sales: thisM.sales, kg: thisM.kg, birds: thisM.birds, prevSales: lastM.sales, prevKg: lastM.kg },
    ytd: { sales: round2(ytdSales), grossProfit: round2(ytdSales - ytdCogs), net: round2(ytdNet), from: ytdFrom },
    series,
    running: running.slice(0, 12).map((b) => ({ id: b.id, farm_name: b.farm_name, batch_no: b.batch_no, ageDays: b.ageDays, placed_qty: b.placed_qty, cost: b.cost, soldBirds: b.soldBirds, placement_date: b.placement_date })),
    runningCount: running.length,
    runningBirds: running.reduce((s, b) => s + (b.placed_qty ?? 0), 0),
    performance: { batches: closed.length, fcr: avg(closed.map((b) => b.kpis.fcr)), livability: avg(closed.map((b) => b.kpis.livability)), avgWeight: avg(closed.map((b) => b.kpis.avgWeight)), profitPerKg: avg(closed.map((b) => b.kpis.profitPerKg)) },
    recent,
    alerts,
    monthStart: monthStart(t)
  };
}

// src/services/cashbook.ts
async function cashbook(date2) {
  const accounts = await all(
    `SELECT id,name,category FROM accounts WHERE category IN ('cash','bank') AND active=1 ORDER BY (category='cash') DESC, name`
  );
  const books = await Promise.all(accounts.map(async (a) => {
    const opening = (await get("SELECT SUM(debit-credit) s FROM entries WHERE account_id=? AND date < ?", a.id, date2))?.s ?? 0;
    const lines = await all(
      `SELECT e.id, e.voucher_id, v.voucher_no, v.description, e.debit, e.credit,
              (SELECT group_concat(DISTINCT a2.name) FROM entries e2 JOIN accounts a2 ON a2.id=e2.account_id
                WHERE e2.voucher_id=e.voucher_id AND e2.id<>e.id AND ((e.debit>0 AND e2.credit>0) OR (e.credit>0 AND e2.debit>0))) AS counter
         FROM entries e JOIN vouchers v ON v.id=e.voucher_id WHERE e.account_id=? AND e.date=? ORDER BY e.id`,
      a.id,
      date2
    );
    const receipts = lines.filter((l) => l.debit > 0);
    const payments = lines.filter((l) => l.credit > 0);
    const rt = round2(receipts.reduce((s, l) => s + l.debit, 0));
    const pt = round2(payments.reduce((s, l) => s + l.credit, 0));
    return { ...a, opening: round2(opening), receipts, payments, totalReceipts: rt, totalPayments: pt, closing: round2(opening + rt - pt) };
  }));
  const count = await get("SELECT denominations,damage,total,note FROM cash_counts WHERE date=?", date2);
  return {
    date: date2,
    books,
    count: count ? { denominations: JSON.parse(count.denominations), damage: count.damage, total: count.total, note: count.note } : null
  };
}
async function saveCount(date2, denominations, damage, note2, userId) {
  let total = damage;
  for (const [d2, c] of Object.entries(denominations)) {
    const face = Number(d2), n2 = Number(c);
    if (!Number.isFinite(face) || !Number.isFinite(n2) || n2 < 0) throw badRequest("Invalid denomination count");
    total += face * n2;
  }
  total = round2(total);
  await run(
    `INSERT INTO cash_counts(date,denominations,damage,total,note,updated_by,updated_at) VALUES(?,?,?,?,?,?,datetime('now'))
     ON CONFLICT(date) DO UPDATE SET denominations=excluded.denominations, damage=excluded.damage, total=excluded.total, note=excluded.note, updated_by=excluded.updated_by, updated_at=excluded.updated_at`,
    date2,
    JSON.stringify(denominations),
    damage,
    total,
    note2,
    userId
  );
  return { total };
}

// src/routes/insights.ts
import fs3 from "node:fs";

// src/importer/core.ts
var norm = (s) => s.toUpperCase().replace(/\s+/g, " ").trim();
var key = (s) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");
var BANKS = /* @__PURE__ */ new Set(["SIB EDAKKARA", "ICICI JIMSON", "CANARA JIMSON"]);
var TRADERS = /* @__PURE__ */ new Set(["NOUSHAD BROAST", "CK CHICKEN", "TPA CHICKEN", "ABBAS EDAKKARA", "FATHIMA CHICKEN", "NAROKKAV CHICKEN STALL", "NOUFAL EDAKKARA", "MAJEED", "SUGU", "REHAN CHICKEN", "KAREEM AKAMPADAM", "ABI AGENCIES"]);
var FEED_SUPPLIERS = /* @__PURE__ */ new Set(["REHAN FEEDS", "CK ENTERPRISES", "FATHIMA ENTERPRISES", "TPA FEEDS", "VTM AGENCIES"]);
var MED_SUPPLIERS = /* @__PURE__ */ new Set(["JV MED", "LIFE MEDICALS", "FATHIMA VACCINE", "TS VETINARY WNDR", "DR SURESH"]);
var CHICK_SUPPLIERS = /* @__PURE__ */ new Set(["NATIONAL HATCHERIES", "ALTHAF CHICKS", "REHAN CHICKS", "MOHANS HATCHRIES TIRUR"]);
var LOANS = /* @__PURE__ */ new Set(["GOLD LOAN", "OD JIMSON", "OD BINU", "KSMDFC", "MASHOOD", "JOMOAN", "SHATHI AYALKOOTAM", "BINU AGRI LOAN", "BAJAJFINANCE"]);
var EQUITY = /* @__PURE__ */ new Set(["EQUITY-JIMSON", "EQUITY-BINU", "DRAWINGS"]);
var FIXED = /* @__PURE__ */ new Set(["REAL ESTATE", "EDAKKARA SHED", "OFFICE EQUIPMENTS", "FURNITURE", "GLASS AND SEALING", "POULTRY SHED"]);
var FARMERS = /* @__PURE__ */ new Set(["LALU", "JITHU", "MADHU", "MATHAI", "SHAREEFA", "RAHIYANATH", "MANTHONI KUNJAPPU", "NAVAJITH", "USMAN", "THONIKAI", "RAFEEK", "SHAMSEER"]);
var FARM_RE = /\bFARM\s*\d*$/;
function lev(a, b) {
  if (a === b) return 0;
  const m = a.length, n2 = b.length;
  if (Math.abs(m - n2) > 3) return 99;
  let prev = Array.from({ length: n2 + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n2; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n2];
}
function inferCategory(name, tb, netDebit) {
  if (BANKS.has(name)) return { category: "bank" };
  if (name === "CASH") return { category: "cash" };
  if (TRADERS.has(name)) return { category: "trader" };
  if (FEED_SUPPLIERS.has(name)) return { category: "supplier", subtype: "feed" };
  if (MED_SUPPLIERS.has(name)) return { category: "supplier", subtype: "medicine" };
  if (CHICK_SUPPLIERS.has(name)) return { category: "supplier", subtype: "chicks" };
  if (LOANS.has(name)) return { category: "loan" };
  if (EQUITY.has(name)) return { category: "equity" };
  if (FIXED.has(name)) return { category: "fixed_asset" };
  if (FARMERS.has(name)) return { category: "farmer" };
  const t = (tb ?? "").toUpperCase();
  if (t.includes("ESPENSES") || t.includes("EXPENSE")) return { category: "expense" };
  if (t.includes("FIXED")) return { category: "fixed_asset" };
  if (t.includes("LIABILITY")) return { category: "other_liability" };
  if (t.includes("ASSET")) return { category: "other_asset" };
  return { category: netDebit >= 0 ? "other_asset" : "other_liability" };
}
async function importJournal(allRows, tb, opts) {
  const warnings = [];
  const warn = (m) => {
    if (warnings.length < 60) warnings.push(m);
  };
  const rows = [];
  let prev = null;
  const yearCount = /* @__PURE__ */ new Map();
  for (const r of allRows) if (r.date) yearCount.set(r.date.slice(0, 4), (yearCount.get(r.date.slice(0, 4)) ?? 0) + 1);
  const dominantYear = [...yearCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? String((/* @__PURE__ */ new Date()).getFullYear());
  for (let r of allRows) {
    if (!r.account) {
      if (r.debit || r.credit) warn(`Row ${r.row}: amount without an account \u2014 skipped`);
      continue;
    }
    if (!r.debit && !r.credit) continue;
    const net = r.debit - r.credit;
    if (r.debit < 0 || r.credit < 0 || r.debit && r.credit) warn(`Row ${r.row}: unusual amount (debit ${r.debit}, credit ${r.credit}) \u2014 treated as ${net >= 0 ? "debit" : "credit"} ${Math.abs(net)}`);
    if (Math.abs(net) < 5e-3) continue;
    r = { ...r, debit: net > 0 ? net : 0, credit: net < 0 ? -net : 0 };
    let d2 = r.date;
    if (!d2) d2 = prev;
    else if (d2.slice(0, 4) !== dominantYear) {
      const fixed = dominantYear + d2.slice(4);
      warn(`Row ${r.row}: date ${d2} looked wrong, used ${fixed}`);
      d2 = fixed;
    }
    if (!d2) {
      warn(`Row ${r.row}: no date \u2014 skipped`);
      continue;
    }
    prev = d2;
    rows.push({ ...r, date: d2 });
  }
  const farmNames = /* @__PURE__ */ new Map();
  for (const r of rows) {
    const n2 = norm(r.account);
    const cls = tb[n2];
    if (FARM_RE.test(n2) && !/OWNER|RENT/.test(n2) && (!cls || cls.toUpperCase().includes("ASSET"))) farmNames.set(key(n2), n2);
  }
  const parts = (k) => {
    const m = /^(.*?)F?FARM(\d*)$/.exec(k);
    return m ? { base: m[1], num: m[2] === "1" ? "" : m[2] } : null;
  };
  const farmInfo = [...farmNames.keys()].map((k) => ({ k, ...parts(k) })).filter((f) => f.base !== void 0);
  const farmCache = /* @__PURE__ */ new Map();
  const resolveFarmKey = (text) => {
    const k = key(text);
    if (!k) return null;
    if (farmCache.has(k)) return farmCache.get(k);
    let found = null;
    if (farmNames.has(k)) found = k;
    else if (!/OWNER|RENT/.test(k)) {
      const p = parts(k);
      if (p && p.base.length >= 3) {
        let best = 99;
        for (const f of farmInfo) {
          if (f.num !== p.num) continue;
          const dist = lev(p.base, f.base);
          if (dist < best) {
            best = dist;
            found = f.k;
          }
        }
        if (best > Math.max(2, Math.floor(p.base.length * 0.3))) found = null;
      }
    }
    farmCache.set(k, found);
    return found;
  };
  let backup = null;
  if (opts.replace && ((await get("SELECT COUNT(*) n FROM vouchers"))?.n ?? 0) > 0) {
    backup = await backupLocal("before-import");
  }
  return await tx(async () => {
    if (opts.replace) {
      for (const t of ["entries", "vouchers", "cash_counts", "batches", "farms"]) await run(`DELETE FROM ${t}`);
      await run("DELETE FROM accounts WHERE sys_key IS NULL");
    }
    const wip = await sysAccountId("wip"), salesId = await sysAccountId("sales"), cogsId = await sysAccountId("cogs"), suspenseId = await sysAccountId("suspense");
    const cashId = await sysAccountId("cash");
    const netDebit = /* @__PURE__ */ new Map();
    for (const r of rows) netDebit.set(norm(r.account), (netDebit.get(norm(r.account)) ?? 0) + r.debit - r.credit);
    const accCache = /* @__PURE__ */ new Map();
    const sysByName = { CASH: cashId, SALES: salesId, "COST OF GOODS SOLD": cogsId };
    let accountsCreated = 0;
    const resolveAccount = async (name) => {
      const n2 = norm(name);
      let a = accCache.get(n2);
      if (a) return a;
      const ex = await get("SELECT id,category,subtype FROM accounts WHERE name=?", n2);
      if (ex) a = ex;
      else if (sysByName[n2]) a = await get("SELECT id,category,subtype FROM accounts WHERE id=?", sysByName[n2]);
      else {
        const inf = inferCategory(n2, tb[n2], netDebit.get(n2) ?? 0);
        const id2 = await addAccount(n2, inf.category, { subtype: inf.category === "supplier" ? inf.subtype ?? "other" : null });
        accountsCreated++;
        a = { id: id2, category: inf.category, subtype: inf.subtype ?? null };
      }
      accCache.set(n2, a);
      return a;
    };
    const farmIds = /* @__PURE__ */ new Map();
    const farmIdFor = async (fk) => {
      let id2 = farmIds.get(fk);
      if (id2) return id2;
      const display = farmNames.get(fk);
      const existing = await get("SELECT id FROM farms WHERE name=?", display);
      id2 = existing ? existing.id : (await run("INSERT INTO farms(name) VALUES(?)", display)).id;
      farmIds.set(fk, id2);
      return id2;
    };
    const groups = [];
    let cur = null;
    for (const r of rows) {
      const opening = norm(r.item) === "OPENING" || /^OPENING BALANCE/.test(norm(r.description));
      const k = opening ? "OPENING" : norm(r.description);
      let join = false;
      if (cur) {
        if (opening || cur.key === "OPENING") join = opening && cur.key === "OPENING";
        else if (cur.dr === 0 || cur.cr === 0) join = Math.abs(daysBetween(cur.rows[0].date, r.date)) <= 3;
        else if (Math.abs(cur.dr - cur.cr) < 0.01) join = false;
        else join = cur.key === k || norm(cur.rows[cur.rows.length - 1].description) === k;
      }
      if (cur && join) {
        cur.rows.push(r);
        cur.dr += r.debit;
        cur.cr += r.credit;
      } else {
        cur = { key: k, rows: [r], dr: r.debit, cr: r.credit };
        groups.push(cur);
      }
    }
    const vouchers = [];
    for (const g of groups) {
      const opening = g.key === "OPENING";
      const lines = [];
      const fks = /* @__PURE__ */ new Set();
      for (const r of g.rows) {
        const fkAcc = FARM_RE.test(norm(r.account)) ? resolveFarmKey(r.account) : null;
        const fkItem = resolveFarmKey(r.item);
        const isFarmAccount = !!fkAcc;
        const fk = fkAcc ?? fkItem;
        if (fk) fks.add(fk);
        const acct = isFarmAccount ? wip : (await resolveAccount(r.account)).id;
        lines.push({ acct, farm: fk ? await farmIdFor(fk) : null, debit: round2(r.debit), credit: round2(r.credit), row: r, isFarmAccount });
      }
      vouchers.push({ date: g.rows[0].date, desc: g.rows[0].description.trim() || "Imported entry", lines, opening, rowNo: g.rows[0].row, farmKeys: fks });
    }
    const traderOf = (v) => v.lines.find((l) => ![wip, salesId, cogsId, suspenseId, cashId].includes(l.acct))?.acct ?? 0;
    const knownSales = /* @__PURE__ */ new Map();
    for (const v of vouchers) {
      const sl = v.lines.find((l) => l.acct === salesId && l.farm);
      if (sl) {
        const t = traderOf(v);
        if (!knownSales.has(t)) knownSales.set(t, []);
        knownSales.get(t).push({ date: v.date, farm: sl.farm });
      }
    }
    for (const v of vouchers) {
      if (!v.lines.some((l) => l.acct === salesId) || v.lines.some((l) => l.acct === salesId && l.farm)) continue;
      const tail = /\bFROM\b(.+)$/i.exec(v.desc)?.[1]?.trim();
      const fk = tail ? resolveFarmKey(/FARM/i.test(tail) ? tail : `${tail} FARM`) : null;
      let farm = fk ? await farmIdFor(fk) : null;
      if (!farm) {
        let best = 8, pick = null;
        for (const c of knownSales.get(traderOf(v)) ?? []) {
          const d2 = Math.abs(daysBetween(c.date, v.date));
          if (d2 < best) {
            best = d2;
            pick = c.farm;
          }
        }
        farm = pick;
      }
      if (farm) {
        for (const l of v.lines) if (!l.farm) l.farm = farm;
      }
    }
    const catOf = /* @__PURE__ */ new Map();
    const catInfo = async (id2) => {
      let c = catOf.get(id2);
      if (!c) {
        c = await get("SELECT category,subtype FROM accounts WHERE id=?", id2);
        catOf.set(id2, c);
      }
      return c;
    };
    const wipCategory = async (v, l) => {
      if (v.opening) return "opening";
      const others = v.lines.filter((x) => x !== l && (l.debit > 0 ? x.credit > 0 : x.debit > 0));
      others.sort((a, b) => b.debit + b.credit - (a.debit + a.credit));
      const o = others[0];
      if (!o) return "misc";
      if (o.acct === cogsId) return "cogs";
      if (o.acct === wip) return l.debit > 0 ? "feed" : "feed_return";
      const c = await catInfo(o.acct);
      let base = "misc";
      if (c.category === "supplier") base = c.subtype === "feed" ? "feed" : c.subtype === "chicks" ? "chicks" : c.subtype === "medicine" ? "medicine" : "misc";
      else if (c.category === "farmer") base = "integration";
      if (l.credit > 0 && base === "feed") return "feed_return";
      return base;
    };
    const LEAD = 10;
    const vcats = /* @__PURE__ */ new Map();
    const byFarm = /* @__PURE__ */ new Map();
    for (const v of vouchers) {
      const cats = /* @__PURE__ */ new Map();
      for (const l of v.lines) if (l.acct === wip) cats.set(l, await wipCategory(v, l));
      vcats.set(v, cats);
      for (const l of v.lines) {
        if (!l.farm) continue;
        const kind = l.acct === salesId ? "sale" : l.acct === wip ? "wip" : l.acct === cogsId ? "cogs" : "other";
        if (!byFarm.has(l.farm)) byFarm.set(l.farm, []);
        byFarm.get(l.farm).push({ l, v, kind, cat: cats.get(l) ?? null, date: v.date });
      }
    }
    const batches = [];
    const batchOfLine = /* @__PURE__ */ new Map();
    for (const [farm, fls] of byFarm) {
      fls.sort((x, y) => x.date < y.date ? -1 : x.date > y.date ? 1 : x.v.rowNo - y.v.rowNo);
      const clusters = [];
      for (const c of fls.filter((x) => x.kind === "wip" && x.cat === "chicks" && x.l.debit > 0)) {
        const last = clusters[clusters.length - 1];
        if (last && daysBetween(last.date, c.date) <= 12) last.qty += c.l.row.qty ?? 0;
        else clusters.push({ date: c.date, qty: c.l.row.qty ?? 0 });
      }
      const mk = (placement, qty, carry2) => ({ farm, no: 0, placement, firstDate: fls[0].date, lastDate: fls[0].date, chicksDate: placement, chicksQty: qty, closed: false, closedDate: null, hasCogs: false, carry: carry2, saleDates: [], cogs: 0, cost: 0, integ: 0, lastSale: null });
      const mem = [];
      const needCarry = !clusters.length || fls.some((x) => x.date < addDays(clusters[0].date, -LEAD) || x.cat === "opening");
      const carry = needCarry ? mk(null, 0, true) : null;
      if (carry) mem.push(carry);
      const placements = clusters.map((c) => mk(c.date, c.qty, false));
      mem.push(...placements);
      mem.forEach((b, i) => {
        b.no = i + 1;
        batches.push(b);
      });
      const pick = (date2, lead) => {
        let chosen = carry ?? placements[0];
        for (const b of placements) if (addDays(b.placement, -lead) <= date2) chosen = b;
        return chosen;
      };
      const pickSold = (date2) => {
        for (let i = placements.length - 1; i >= 0; i--) {
          const b = placements[i];
          if (b.placement <= date2 && b.saleDates.some((d2) => d2 <= date2)) return b;
        }
        return pick(date2, 0);
      };
      for (const fl of fls) if (fl.kind === "sale") {
        const b = pick(fl.date, 0);
        b.saleDates.push(fl.date);
        batchOfLine.set(fl.l, b);
      }
      for (const fl of fls) {
        if (fl.kind === "sale") continue;
        let b;
        if (fl.cat === "opening") b = carry ?? placements[0];
        else if (fl.kind === "cogs" || fl.kind === "wip" && (fl.cat === "integration" || fl.cat === "cogs")) b = pickSold(fl.date);
        else if (fl.kind === "wip") b = pick(fl.date, LEAD);
        if (!b) {
          const sib = fls.find((o) => o.v === fl.v && o !== fl && batchOfLine.has(o.l));
          b = sib && batchOfLine.get(sib.l) || pick(fl.date, 0);
        }
        batchOfLine.set(fl.l, b);
      }
      for (const fl of fls) {
        const b = batchOfLine.get(fl.l);
        if (!b) continue;
        if (fl.date > b.lastDate) b.lastDate = fl.date;
        if (fl.kind === "sale" && (!b.lastSale || fl.date > b.lastSale)) b.lastSale = fl.date;
        if (fl.kind === "wip") {
          if (fl.cat === "cogs") {
            b.cogs += fl.l.credit - fl.l.debit;
            b.hasCogs = true;
            if (!b.closedDate || fl.date > b.closedDate) b.closedDate = fl.date;
          } else {
            const amt = fl.l.debit - fl.l.credit;
            if (fl.cat === "integration") b.integ += amt;
            else b.cost += amt;
          }
        }
      }
    }
    const ref = today();
    const lastPerFarm = /* @__PURE__ */ new Map();
    for (const b of batches) lastPerFarm.set(b.farm, b);
    for (const b of batches) {
      const placement = b.placement ?? b.firstDate;
      const isLatest = lastPerFarm.get(b.farm) === b && !b.carry;
      const cleared = b.saleDates.length > 0 && b.cogs >= b.cost * 0.9;
      const stale = daysBetween(b.lastDate, ref) > 60;
      const closed = !isLatest || cleared || stale;
      b.closed = closed;
      const closedDate = closed ? b.closedDate ?? b.lastSale ?? b.lastDate : null;
      const note2 = b.carry ? "Cost brought forward from before this system (opening balances) \u2014 placement date unknown" : closed && !cleared && !isLatest && !b.hasCogs ? "Closed automatically on import (no cost clearing entry found)" : null;
      b.realId = (await run(
        "INSERT INTO batches(farm_id,batch_no,placement_date,placed_qty,status,closed_date,notes,partial) VALUES(?,?,?,?,?,?,?,?)",
        b.farm,
        b.no,
        b.carry ? b.firstDate : placement,
        b.chicksQty > 0 ? Math.round(b.chicksQty) : null,
        closed ? "closed" : "running",
        closedDate,
        note2,
        b.carry || b.chicksQty === 0 ? 1 : 0
      )).id;
    }
    let adjusted = 0, suspenseNet = 0, voucherCount = 0, entryCount = 0, no = 0;
    const typeOf = async (entries, v, cats) => {
      if (v.opening) return "opening";
      if (entries.some((e) => e.accountId === salesId)) return "sale";
      if (entries.some((e) => e.accountId === cogsId)) return "close";
      const wc = [...cats.values()];
      if (wc.includes("chicks")) return "chicks";
      if (wc.includes("integration")) return "integration";
      if (wc.includes("feed") || wc.includes("feed_return")) return "feed";
      if (wc.includes("medicine")) return "medicine";
      if (wc.length) return "misc";
      const cats2 = await Promise.all(v.lines.map(async (l) => (await catInfo(l.acct)).category));
      const liquidDr = v.lines.some((l, i) => l.debit > 0 && ["cash", "bank"].includes(cats2[i]));
      const liquidCr = v.lines.some((l, i) => l.credit > 0 && ["cash", "bank"].includes(cats2[i]));
      if (liquidDr && liquidCr) return "transfer";
      if (liquidDr) return "receipt";
      if (liquidCr) return v.lines.some((l, i) => l.debit > 0 && cats2[i] === "expense") ? "expense" : "payment";
      return "journal";
    };
    for (const v of vouchers) {
      const cats = vcats.get(v);
      const vFarm = v.lines.find((l) => l.farm)?.farm ?? null;
      const entries = v.lines.map((l) => {
        const r = l.row;
        const isSales = l.acct === salesId;
        const text = (r.item2 || "").trim();
        let category = l.acct === wip ? cats.get(l) ?? "misc" : null;
        if (isSales) category = /WEAK/i.test(text) || /WEAK/i.test(r.description) ? "weak" : /DAMAGE/i.test(text) || /^DAMAGE/i.test(r.description) ? "damage" : "live";
        if (l.acct === cogsId) category = "cogs";
        const b = batchOfLine.get(l);
        return {
          accountId: l.acct,
          debit: l.debit,
          credit: l.credit,
          farmId: l.farm ?? (l.isFarmAccount ? null : vFarm),
          batchId: b?.realId ?? null,
          category,
          item: (text || r.item || "").slice(0, 60) || null,
          qty: r.qty,
          weight: r.weight,
          rate: r.price,
          narration: r.description.slice(0, 200)
        };
      });
      if (vFarm) {
        const vb2 = v.lines.map((l) => batchOfLine.get(l)).find(Boolean);
        for (const e of entries) if (e.farmId === vFarm && !e.batchId && vb2) e.batchId = vb2.realId;
      }
      const dr = round2(entries.reduce((s, e) => s + (e.debit ?? 0), 0)), cr = round2(entries.reduce((s, e) => s + (e.credit ?? 0), 0));
      if (Math.abs(dr - cr) > 5e-3) {
        adjusted++;
        const diff = round2(cr - dr);
        suspenseNet += diff;
        entries.push(diff > 0 ? { accountId: suspenseId, debit: diff, narration: "Import difference (debit \u2260 credit in Excel)" } : { accountId: suspenseId, credit: -diff, narration: "Import difference (debit \u2260 credit in Excel)" });
        if (adjusted <= 8) warn(`Row ${v.rowNo}: "${v.desc}" did not balance in Excel (difference \u20B9${Math.abs(diff)}) \u2014 posted to Suspense`);
      }
      const type = await typeOf(entries, v, cats);
      let partyLine;
      for (const l of v.lines) {
        if (![wip, salesId, cogsId, suspenseId, cashId].includes(l.acct) && !["bank", "cash"].includes((await catInfo(l.acct)).category)) {
          partyLine = l;
          break;
        }
      }
      const vb = v.lines.map((l) => batchOfLine.get(l)).find(Boolean);
      no++;
      await postVoucher({
        type,
        date: v.date,
        description: v.desc.slice(0, 200),
        partyId: partyLine?.acct ?? null,
        farmId: vFarm,
        batchId: vb?.realId ?? null,
        source: "import",
        userId: opts.userId,
        meta: { excelRow: v.rowNo },
        entries
      });
      voucherCount++;
      entryCount += entries.length;
    }
    const farmers = await all(`SELECT id,name FROM accounts WHERE category='farmer'`);
    for (const f of await all("SELECT id,name FROM farms")) {
      const first = norm(f.name).split(" ")[0];
      const match = farmers.find((a) => lev(key(a.name.split(" ")[0]), key(first)) <= 2 && key(first).length > 3 && key(a.name.split(" ")[0]).length > 3);
      if (match) await run("UPDATE farms SET farmer_account_id=?, farmer_name=? WHERE id=?", match.id, match.name, f.id);
    }
    void CATEGORY_TYPE;
    void addDays;
    const stats = await get("SELECT MIN(date) a, MAX(date) b FROM vouchers");
    return {
      rows: rows.length,
      vouchers: voucherCount,
      entries: entryCount,
      accounts: accountsCreated,
      farms: (await get("SELECT COUNT(*) n FROM farms")).n,
      batches: batches.length,
      runningBatches: (await get(`SELECT COUNT(*) n FROM batches WHERE status='running'`)).n,
      adjustedVouchers: adjusted,
      suspenseNet: round2(suspenseNet),
      warnings,
      backup,
      firstDate: stats.a,
      lastDate: stats.b
    };
  });
}

// src/importer/excel.ts
var pad = (n2) => String(n2).padStart(2, "0");
function toIso(v) {
  if (v === null || v === void 0 || v === "") return null;
  if (typeof v === "number") {
    if (v < 2e4 || v > 8e4) return null;
    const d2 = new Date(Date.UTC(1899, 11, 30) + Math.floor(v + 1e-6) * 864e5);
    return `${d2.getUTCFullYear()}-${pad(d2.getUTCMonth() + 1)}-${pad(d2.getUTCDate())}`;
  }
  if (v instanceof Date) return `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}`;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v).trim());
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const dm = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/.exec(String(v).trim());
  return dm ? `${dm[3]}-${pad(Number(dm[2]))}-${pad(Number(dm[1]))}` : null;
}
var str = (v) => v === null || v === void 0 ? "" : String(v).trim();
var numOrNull = (v) => v === null || v === void 0 || String(v).trim() === "" ? null : num(v);
async function parseWorkbook(buf) {
  const XLSX = await import("xlsx");
  let wb;
  try {
    wb = XLSX.read(buf, { type: "buffer", cellDates: false, cellFormula: false, cellHTML: false, cellStyles: false });
  } catch {
    throw badRequest("Could not read that file. Please upload the .xlsx workbook.");
  }
  const sheetName = wb.SheetNames.find((n2) => n2.trim().toUpperCase() === "JOURNALS");
  if (!sheetName) throw badRequest(`This workbook has no "JOURNALS" sheet. Sheets found: ${wb.SheetNames.join(", ")}`);
  const data = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, range: 3, raw: true, defval: null });
  const header = (data[0] ?? []).map((c2) => str(c2).toUpperCase());
  if (!header.includes("DEBIT") || !header.includes("ACCOUNT")) throw badRequest("The JOURNALS sheet does not have the expected columns (DATE, DESCRIPTION, ACCOUNT \u2026 DEBIT, CREDIT).");
  const col = (name, fallback) => {
    const i = header.indexOf(name);
    return i >= 0 ? i : fallback;
  };
  const c = { date: col("DATE", 0), desc: col("DESCRIPTION", 1), acc: col("ACCOUNT", 2), item: col("ITEM", 3), item2: col("ITEM2", 4), qty: col("QOUNTITY", 5), wt: col("WEIGT", 6), price: col("PRICE", 7), dr: col("DEBIT", 10), cr: col("CREDIT", 11) };
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const r = data[i];
    if (!r || r.every((x) => x === null || x === "")) continue;
    rows.push({
      row: i + 4,
      date: toIso(r[c.date]),
      description: str(r[c.desc]),
      account: str(r[c.acc]),
      item: str(r[c.item]),
      item2: str(r[c.item2]),
      qty: numOrNull(r[c.qty]),
      weight: numOrNull(r[c.wt]),
      price: numOrNull(r[c.price]),
      debit: num(r[c.dr]),
      credit: num(r[c.cr])
    });
  }
  const tb = {};
  const tbName = wb.SheetNames.find((n2) => n2.trim().toUpperCase() === "TRAIL BALANCE" || n2.trim().toUpperCase() === "TRIAL BALANCE");
  if (tbName) {
    const t = XLSX.utils.sheet_to_json(wb.Sheets[tbName], { header: 1, raw: true, defval: null });
    for (const r of t) {
      const name = str(r[1]).toUpperCase().replace(/\s+/g, " ");
      const cls = str(r[10]);
      if (name && cls && name !== "ACCOUNT") tb[name] = cls;
    }
  }
  return { rows, tb };
}
async function importWorkbook(buf, opts) {
  const { rows, tb } = await parseWorkbook(buf);
  if (!rows.length) throw badRequest("No journal rows were found in the JOURNALS sheet.");
  return await importJournal(rows, tb, opts);
}

// src/routes/insights.ts
var d = (v) => v || void 0;
function insightRoutes(r) {
  r.get("/api/dashboard", async () => await dashboard());
  r.get("/api/reports/trial-balance", async ({ query }) => await trialBalance(d(query.get("from")), d(query.get("to"))));
  r.get("/api/reports/income-statement", async ({ query }) => await incomeStatement(d(query.get("from")), d(query.get("to"))));
  r.get("/api/reports/balance-sheet", async ({ query }) => await balanceSheet(d(query.get("asOf"))));
  r.get("/api/reports/ledger/:id", async ({ params, query }) => await ledger(Number(params.id), d(query.get("from")), d(query.get("to")), query.get("farmId") ? Number(query.get("farmId")) : void 0, query.get("batchId") ? Number(query.get("batchId")) : void 0));
  r.get("/api/reports/outstanding", async ({ query }) => await outstanding((query.get("categories") ?? "trader,supplier,farmer").split(",")));
  r.get("/api/reports/batch-performance", async ({ query }) => {
    const rows = (await listBatches({ status: "closed", from: d(query.get("from")), to: d(query.get("to")) })).filter((b) => b.soldKg > 0);
    return rows;
  });
  r.get("/api/cashbook", async ({ query }) => await cashbook(query.get("date") ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)));
  r.put("/api/cashbook/count", async ({ body, user }) => {
    const x = external_exports.object({ date: external_exports.string().regex(/^\d{4}-\d{2}-\d{2}$/), denominations: external_exports.record(external_exports.coerce.number().min(0)), damage: external_exports.coerce.number().min(0).default(0), note: external_exports.string().max(300).nullable().optional() }).parse(body);
    return await saveCount(x.date, x.denominations, x.damage, x.note ?? null, user.sub);
  });
  r.get("/api/settings", async () => {
    const rows = await all("SELECT key,value FROM settings");
    const out = { ...DEFAULT_SETTINGS };
    for (const x of rows) out[x.key] = x.value;
    out.feed_types = await feedTypes();
    delete out.next_bill_no;
    out.next_bill_no = await getSetting("next_bill_no", "1");
    return out;
  });
  r.put("/api/settings", async ({ body }) => {
    const allowed = Object.keys(DEFAULT_SETTINGS);
    const b = external_exports.record(external_exports.any()).parse(body);
    for (const [k, v] of Object.entries(b)) {
      if (!allowed.includes(k)) continue;
      await setSetting(k, k === "feed_types" ? JSON.stringify((Array.isArray(v) ? v : String(v).split(",")).map((s) => s.trim().toUpperCase()).filter(Boolean)) : String(v ?? ""));
    }
  }, { admin: true });
  r.get("/api/system/backup", async ({ res }) => {
    const stamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:T]/g, "-").slice(0, 16);
    if (isRemote) {
      const body = JSON.stringify(await dumpAll());
      res.writeHead(200, { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="roosters-field-${stamp}.json"`, "Content-Length": Buffer.byteLength(body) });
      res.end(body);
      return HANDLED;
    }
    const file = await backupLocal("roosters");
    res.writeHead(200, { "Content-Type": "application/octet-stream", "Content-Disposition": `attachment; filename="roosters-field-${stamp}.db"`, "Content-Length": fs3.statSync(file).size });
    fs3.createReadStream(file).pipe(res);
    return HANDLED;
  }, { admin: true });
  r.post("/api/import/excel", async ({ readRaw, query, user }) => {
    const buf = await readRaw();
    if (buf.length < 1e3) throw badRequest("That file looks empty. Choose the Rooster\u2019s Field Excel workbook (.xlsx).");
    const replace = query.get("replace") === "1";
    const hasData = ((await get(`SELECT COUNT(*) n FROM vouchers`))?.n ?? 0) > 0;
    if (hasData && !replace) throw badRequest("There is already data in the system. Tick \u201Creplace existing data\u201D to import over it (a backup is taken first).");
    return await importWorkbook(buf, { replace, userId: user.sub });
  }, { admin: true, raw: true });
  r.get("/api/system/stats", async () => ({
    vouchers: (await get("SELECT COUNT(*) n FROM vouchers")).n,
    entries: (await get("SELECT COUNT(*) n FROM entries")).n,
    farms: (await get("SELECT COUNT(*) n FROM farms")).n,
    batches: (await get("SELECT COUNT(*) n FROM batches")).n,
    accounts: (await get("SELECT COUNT(*) n FROM accounts")).n,
    firstDate: (await get("SELECT MIN(date) d FROM vouchers")).d,
    lastDate: (await get("SELECT MAX(date) d FROM vouchers")).d
  }));
  void run;
}

// src/app.ts
var router = new Router();
router.get("/api/health", () => ({ ok: true, time: (/* @__PURE__ */ new Date()).toISOString() }), { auth: false });
authRoutes(router);
masterRoutes(router);
transactionRoutes(router);
insightRoutes(router);
var booted = null;
var bootstrap = () => booted ??= seed().catch((e) => {
  booted = null;
  throw e;
});

// src/vercel.ts
async function handler(req, res) {
  const url = new URL(req.url ?? "/", "http://x");
  const sub = url.searchParams.get("__path");
  if (sub !== null) {
    url.searchParams.delete("__path");
    const q = url.searchParams.toString();
    req.url = `/api/${sub}${q ? `?${q}` : ""}`;
  }
  await handleRequest(router, req, res, { beforeApi: bootstrap });
}
export {
  handler as default
};
