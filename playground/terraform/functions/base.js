// functions/lambda/validateHash.js
import { util } from "@aws-appsync/utils";

function djb2Hash(inputString) {
  const charCodeMap = {
    " ": 32,
    "!": 33,
    '"': 34,
    "#": 35,
    $: 36,
    "%": 37,
    "&": 38,
    "'": 39,
    "(": 40,
    ")": 41,
    "*": 42,
    "+": 43,
    ",": 44,
    "-": 45,
    ".": 46,
    "/": 47,
    0: 48,
    1: 49,
    2: 50,
    3: 51,
    4: 52,
    5: 53,
    6: 54,
    7: 55,
    8: 56,
    9: 57,
    ":": 58,
    ";": 59,
    "<": 60,
    "=": 61,
    ">": 62,
    "?": 63,
    "@": 64,
    A: 65,
    B: 66,
    C: 67,
    D: 68,
    E: 69,
    F: 70,
    G: 71,
    H: 72,
    I: 73,
    J: 74,
    K: 75,
    L: 76,
    M: 77,
    N: 78,
    O: 79,
    P: 80,
    Q: 81,
    R: 82,
    S: 83,
    T: 84,
    U: 85,
    V: 86,
    W: 87,
    X: 88,
    Y: 89,
    Z: 90,
    "[": 91,
    "\\": 92,
    "]": 93,
    "^": 94,
    _: 95,
    "`": 96,
    a: 97,
    b: 98,
    c: 99,
    d: 100,
    e: 101,
    f: 102,
    g: 103,
    h: 104,
    i: 105,
    j: 106,
    k: 107,
    l: 108,
    m: 109,
    n: 110,
    o: 111,
    p: 112,
    q: 113,
    r: 114,
    s: 115,
    t: 116,
    u: 117,
    v: 118,
    w: 119,
    x: 120,
    y: 121,
    z: 122,
    "{": 123,
    "|": 124,
    "}": 125,
    "~": 126,
  };

  let hash = 5381;

  // Define a max length to avoid hashing gigantic strings
  const MAX_LENGTH = 1000; // adjust based on your usage
  const truncated =
    inputString.length > MAX_LENGTH
      ? inputString.slice(0, MAX_LENGTH)
      : inputString;

  truncated.split("").forEach((char) => {
    const charCode = charCodeMap[char];
    if (charCode !== undefined) {
      hash = (hash * 33 + charCode) % 4294967296; // Use modulo to keep within 32 bits
    } else {
      console.log(`Character "${char}" is not supported and will be skipped.`);
      // Optionally, handle unsupported characters differently
    }
  });

  return `${hash}`;
}

export function request(ctx) {
  // Retrieve the 'x-hbm-hash' header from the request
  const providedHash = ctx.request.headers["x-hbm-hash"];

  if (!providedHash) {
    return util.unauthorized();
  }

  const computedHash = djb2Hash(JSON.stringify(ctx.args));

  // Compare the provided hash with the computed hash
  if (providedHash !== computedHash) {
    // Note: For debugging!
    //  - Usually the error is parameter types are mismatch!
    return util.error(
      JSON.stringify({ providedHash, computedHash }),
      "CUSTOM",
      {},
      {
        a: ctx.args,
        b: JSON.stringify(ctx.args),
        c: djb2Hash(JSON.stringify(ctx.args)),
      },
    );
    // return util.unauthorized();
  }

  // Hashes match; proceed with the resolver
  return {};
}

export function response(ctx) {
  return ctx.result;
}
