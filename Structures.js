import OriginalBigNumber from 'bignumber.js';

export const BigNumber = OriginalBigNumber.clone({});

BigNumber.prototype.toJSON = function () {
  return `${this.toString()}${this.constructor.suffix}`;
};

export class Byte extends BigNumber {
  static suffix = 'b';
  static type = 'B';

  constructor (n) {
    super(n);

    if (!(this.gte(new BigNumber('-128')) && this.lte(new BigNumber('127')))) {
      throw new RangeError('Byte must be between -128 and 127');
    }
  }
}

export class Short extends BigNumber {
  static suffix = 's';
  static type = 'S';

  constructor (n) {
    super(n);

    if (!(this.gte(new BigNumber('-32768')) && this.lte(new BigNumber('32767')))) {
      throw new RangeError('Short must be between -32768 and 32767');
    }
  }
}

export class Int extends BigNumber {
  static suffix = '';
  static type = 'I';

  constructor (n) {
    super(n);

    if (!(this.gte(new BigNumber('-2147483648')) && this.lte(new BigNumber('2147483647')))) {
      throw new RangeError('Int must be between -2147483648 and 2147483647');
    }
  }
}

export class Long extends BigNumber {
  static suffix = 'l';
  static type = 'L';

  constructor (n) {
    super(n);

    if (!(this.gte(new BigNumber('-9223372036854775808')) && this.lte(new BigNumber('9223372036854775807')))) {
      throw new RangeError('Long must be between -9223372036854775808 and 9223372036854775807');
    }
  }

  toJSON () {
    return `${this.toString()}${this.constructor.suffix}`;
  }
}

export class Float extends BigNumber {
  static suffix = 'f';
  static type = 'F';

  constructor (n) {
    super(n);

    if (!(this.gte(new BigNumber('-3.402823e+38')) && this.lte(new BigNumber('3.402823e+38')))) {
      throw new RangeError('Float must be between -3.402823e+38 and 3.402823e+38');
    }
  }
}

export class Double extends BigNumber {
  static suffix = 'd';
  static type = 'D';

  constructor (n) {
    super(n);

    if (!(this.gte(new BigNumber('-1.7976931348623157e+308')) && this.lte(new BigNumber('1.7976931348623157e+308')))) {
      throw new RangeError('Double must be between -1.7976931348623157e+308 and 1.7976931348623157e+308');
    }
  }
}

export class TypedArray extends Array {
  constructor (baseObject, ...args) {
    super(...args);

    this.baseObject = baseObject;
  }

  push (...args) {
    for (let i = 0; i < args.length; i++) {
      if (!(args[i] instanceof this.baseObject)) {
        
        throw new TypeError(`Expected '${this.baseObject.name}' instead of '${args[i].constructor.name}'`);
      }
    }

    return super.push(...args);
  }
}