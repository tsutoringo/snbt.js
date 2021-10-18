import * as Structures from './Structures.js';

export default class SNBT {

	static getTypedNumberBySuffix (suffix, float) {
		switch (suffix.toUpperCase()) {
			case 'B':
				return Structures.Byte;
			case 'S':
				return Structures.Short;
			case 'I':
				return Structures.Int;
			case 'L':
				return Structures.Long;
			case 'F':
				return Structures.Float;
			case 'D':
				return Structures.Double;
			default:
				return float ? Structures.Double : Structures.Int;
		}
	}

	static constrcutTypedNumberBySuffix (suffix, float, value) {
		return new (SNBT.getTypedNumberBySuffix(suffix, float))(value);
	}

	static isTypedNumberSuffix (suffix) {
		if (suffix === '' || suffix == null) return false;

		switch (suffix.toUpperCase()) {
			case 'B':
			case 'S':
			case 'I':
			case 'L':
			case 'F':
			case 'D':
				return true;
			default:
				return false;
		}
	}

	static parse(snbt) {
		let at = 0,
			ch = ' ',
			text = snbt;
		let escapee = {
			'"':  '"',
			'\'': '\'',
			'\\': '\\',
			'/':  '/',
			b:    'b',
			f:    '\f',
			n:    '\n',
			r:    '\r',
			t:    '\t'
		};

		let allowKeyChar = /[a-zA-Z0-9]/;

		const error = m => {
			throw new SyntaxError(`${m} at ${at}`);
		};

		const next = c => {
			if (c && c !== ch) error(`Expected '${c}' instead of '${ch}'`);
			ch = text.charAt(at);
			at += 1;
			return ch;
		};

		const bulkNext = c => {
			let result = '';
			for (let i=0;i<c.length;i++) {
				result += next(c[i]);
			}
			return result;
		};

		const number = () => {
			let string = '';
			let float = false;

			if (ch === '-') {
				string = '-';
				next('-');
			}

			while (ch >= '0' && ch <= '9') {
				string += ch;
				next();
			}

			if (ch === '.') {
				string += '.';
				while (next() && ch >= '0' && ch <= '9') {
					string += ch;
				}
				float = true;
			}

			if (ch === 'e' || ch === 'E') {
				string += ch;
				next();

				if (ch === '-' || ch === '+') {
					string += ch;
					next();
				}

				while (ch >= '0' && ch <= '9') {
					string += ch;
					next();
				}
			}

			const parsedNumber = SNBT.constrcutTypedNumberBySuffix(ch, float, string);

			if (SNBT.isTypedNumberSuffix(ch)) next();

			if (!parsedNumber.isFinite()) error(`Bad number`);
			return parsedNumber;
		};

		const string = () => {
			let quote;
			let result = '';

			if (ch === '"' || ch === "'") {
				quote = ch;
				while (next()) {
					if (ch === '\\') {
						next();
						if (ch === 'u') {
							let uffff = 0;
							for (let i = 0; i < 4; i += 1) {
								let hex = parseInt(next(), 16);
								if (!isFinite(hex)) error(`Bad unicode escape`);
								uffff = uffff * 16 + hex;
							}
							result += String.fromCharCode(uffff);
						} else if (ch in escapee) {
							result += escapee[ch];
						} else {
							break;
						}
					} else if (ch === quote) {
						next(quote);
						return result;
					} else {
						result += ch;
					}
				}
			}
			error(`Bad string`);
		};

		const white = () => {
			while (ch && ch <= ' ') next();
		}

		const word = () => {
			switch (ch) {
				case 't':
					bulkNext('true');
					return true;
				case 'f':
					bulkNext('false');
					return false;
				case 'n':
					bulkNext('null');
					return null;
			}
			error(`Unexpected '${ch}'`);
		};

		const array = () => {
			let result = [];

			if (ch === '[') {
				next('[');
				white();

				if (SNBT.isTypedNumberSuffix(ch)) {
					result = new Structures.TypedArray(SNBT.getTypedNumberBySuffix(ch));
					next();
					next(';');
					white();
				}

				if (ch === ']') return result;
				
				while (ch) {
					result.push(value());
					white();
					if (ch === ']') {
						next(']');
						return result;
					}
					next(',');
					white();
				}
			}
			error('bad array');
		};

		const key = () => {
			let result = '';

			if (allowKeyChar.test(ch)) {
				while (ch) {
					if (allowKeyChar.test(ch)) {
						result += ch;
						next();
					} else {
						return result;
					}
				}
			}
			error('bad key');
		};

		const object = () => {
			const result = {};
			
			if (ch === '{') {
				next('{');
				white();
				if (ch === '}') {
					next('}');
					return result;
				}

				while (ch) {
					const k = key();
					white();
					next(':');
					result[k] = value();
					white();

					if (ch === '}') {
						next('}');
						return result;
					}

					next(',');
					white();
				}
			}
		}

		const value = () => {
			white();

			switch (ch) {
				case '{':
					return object();
				case '[':
					return array();
				case '"':
				case '\'':
					return string();
				case '-':
					return number();
				default:
					return ch >= '0' && ch <= '9' ? number() : word();
			}
		}

		return value(snbt);
	}

	static stringify(snbt, option) {
		option = Object.assign({
			indent: null,
			useByteFlag: false
		}, option);
		let result = '';
		let deep = 0;

		const number = (_value) => result += _value.toJSON();

		const string = (_value) => {
			result += `"${
				_value
					.replace(/\\/g, '\\\\')
					.replace(/"/g, '\\"')
					.replace(/\n/g, '\\n')
					.replace(/\r/g, '\\r')
					.replace(/[\u0000-\u001f]/g, (c) => {
						let hex = c.charCodeAt(0).toString(16);
						if (hex.length === 1) hex = '0' + hex;
						return '\\u' + hex;
					})
			}"`;
		};

		const array = (_value) => {
			result += '[';

			if (_value instanceof Structures.TypedArray) result += `${_value.baseObject.type};`;

			indent(1);

			for (let i = 0; i < _value.length; i += 1) {
				if (i > 0) {
					result += ','
					indent();
				};
				value(_value[i]);
			}

			indent(-1);

			result += ']';
		}

		const object = (_value) => {
			result += '{';
			let firstFlag = true;
			indent(1);

			for (let key in _value) {
				if (Object.hasOwnProperty.call(_value, key) && _value[key] != undefined) {
					if (!firstFlag) {
						result += ','
						indent();
					} else {
						firstFlag = false;
					}
					
					result += `${key}:`;
					value(_value[key]);
				}
			}

			indent(-1);

			result += '}';
		}

		const boolean = (_value) => {
			if (option.useByteFlag) {
				result += _value ? '1b' : '0b';
			} else {
				result += _value ? 'true' : 'false'
			}
		};

		const indent = (n) => {
			if (n) deep += n;
			if (option.indent) {
				result += `\n${option.indent.repeat(deep)}`;
			}
		}

		const value = _value => {
			switch (typeof _value) {
				case 'number':
					number(_value);
					break;
				case 'string':
					string(_value);
					break;
				case 'object':
					if (_value instanceof Structures.TypedArray) {
						array(_value);
					} else if (_value instanceof Structures.BigNumber) {
						number(_value);
					} else if (_value instanceof Array) {
						array(_value);
					} else if (_value instanceof Object) {
						object(_value);
					}
					break;
				case 'boolean':
					boolean(_value);
					break;
				default:
					throw new Error(`Unknown type ${typeof _value}`);
			}
		}

		value(snbt);

		return result;
	}
}

