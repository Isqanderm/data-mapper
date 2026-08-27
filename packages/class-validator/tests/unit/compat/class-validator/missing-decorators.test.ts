/**
 * Decorators upstream ships that this package did not.
 *
 * Every expectation below was measured against class-validator 0.14.4 rather
 * than assumed — including the ones that surprise: `IsFirebasePushId` reports
 * under the key `IsFirebasePushId` (capitalised, unlike every other one),
 * `IsRgbColor` rejects `rgb(0, 0, 0)` with spaces, `IsByteLength` counts bytes
 * rather than characters, and `IsBase58` accepts `abc`.
 */

import { describe, it, expect } from 'vitest';
import { validateSync } from '../../../../src';
import {
  IsAscii,
  IsBase32,
  IsBase58,
  IsBooleanString,
  IsByteLength,
  IsFirebasePushId,
  IsFullWidth,
  IsHSL,
  IsHalfWidth,
  IsHash,
  IsHexadecimal,
  IsISRC,
  IsISSN,
  IsMilitaryTime,
  IsMultibyte,
  IsNumberString,
  IsOctal,
  IsRgbColor,
  IsSurrogatePair,
  IsTaxId,
  IsVariableWidth,
} from '../../../../src/decorators';

const keyOf = (o: object) => Object.keys(validateSync(o)[0]?.constraints ?? {});

describe('@IsAscii', () => {
  class C0_0 {
    @IsAscii()
    p = 'abc123';
  }
  it('accepts abc123', () => {
    expect(validateSync(new C0_0())).toHaveLength(0);
  });

  class C0_1 {
    @IsAscii()
    p = 'абв';
  }
  it('rejects абв', () => {
    expect(keyOf(new C0_1())).toEqual(['isAscii']);
  });

  class C0_2 {
    @IsAscii()
    p = 'aébc';
  }
  it('rejects aébc', () => {
    expect(keyOf(new C0_2())).toEqual(['isAscii']);
  });

  class Wrong0 {
    @IsAscii()
    p = 42 as unknown as string;
  }
  it('rejects a value of the wrong type', () => {
    expect(validateSync(new Wrong0())).toHaveLength(1);
  });
});

describe('@IsBase32', () => {
  class C1_0 {
    @IsBase32()
    p = 'JBSWY3DP';
  }
  it('accepts JBSWY3DP', () => {
    expect(validateSync(new C1_0())).toHaveLength(0);
  });

  class C1_1 {
    @IsBase32()
    p = 'JBSWY3DPEB3W64TMMQ======';
  }
  it('accepts JBSWY3DPEB3W64TMMQ======', () => {
    expect(validateSync(new C1_1())).toHaveLength(0);
  });

  class C1_2 {
    @IsBase32()
    p = 'zz!';
  }
  it('rejects zz!', () => {
    expect(keyOf(new C1_2())).toEqual(['isBase32']);
  });

  class C1_3 {
    @IsBase32()
    p = 'abc';
  }
  it('rejects abc', () => {
    expect(keyOf(new C1_3())).toEqual(['isBase32']);
  });

  class Wrong1 {
    @IsBase32()
    p = 42 as unknown as string;
  }
  it('rejects a value of the wrong type', () => {
    expect(validateSync(new Wrong1())).toHaveLength(1);
  });
});

describe('@IsBase58', () => {
  class C2_0 {
    @IsBase58()
    p = '3vQB7B6MrGQZaxCuFg4oh';
  }
  it('accepts 3vQB7B6MrGQZaxCuFg4oh', () => {
    expect(validateSync(new C2_0())).toHaveLength(0);
  });

  class C2_1 {
    @IsBase58()
    p = 'abc';
  }
  it('accepts abc', () => {
    expect(validateSync(new C2_1())).toHaveLength(0);
  });

  class C2_2 {
    @IsBase58()
    p = '0OIl';
  }
  it('rejects 0OIl', () => {
    expect(keyOf(new C2_2())).toEqual(['isBase58']);
  });

  class Wrong2 {
    @IsBase58()
    p = 42 as unknown as string;
  }
  it('rejects a value of the wrong type', () => {
    expect(validateSync(new Wrong2())).toHaveLength(1);
  });
});

describe('@IsBooleanString', () => {
  class C3_0 {
    @IsBooleanString()
    p = 'true';
  }
  it('accepts true', () => {
    expect(validateSync(new C3_0())).toHaveLength(0);
  });

  class C3_1 {
    @IsBooleanString()
    p = 'false';
  }
  it('accepts false', () => {
    expect(validateSync(new C3_1())).toHaveLength(0);
  });

  class C3_2 {
    @IsBooleanString()
    p = '1';
  }
  it('accepts 1', () => {
    expect(validateSync(new C3_2())).toHaveLength(0);
  });

  class C3_3 {
    @IsBooleanString()
    p = 'yes';
  }
  it('rejects yes', () => {
    expect(keyOf(new C3_3())).toEqual(['isBooleanString']);
  });

  class Wrong3 {
    @IsBooleanString()
    p = 42 as unknown as string;
  }
  it('rejects a value of the wrong type', () => {
    expect(validateSync(new Wrong3())).toHaveLength(1);
  });
});

describe('@IsByteLength', () => {
  class C4_0 {
    @IsByteLength(1, 3)
    p = 'ab';
  }
  it('accepts ab', () => {
    expect(validateSync(new C4_0())).toHaveLength(0);
  });

  class C4_1 {
    @IsByteLength(1, 3)
    p = 'é';
  }
  it('accepts é', () => {
    expect(validateSync(new C4_1())).toHaveLength(0);
  });

  class C4_2 {
    @IsByteLength(1, 3)
    p = 'abcd';
  }
  it('rejects abcd', () => {
    expect(keyOf(new C4_2())).toEqual(['isByteLength']);
  });

  class C4_3 {
    @IsByteLength(1, 3)
    p = '';
  }
  it('rejects ', () => {
    expect(keyOf(new C4_3())).toEqual(['isByteLength']);
  });

  class Wrong4 {
    @IsByteLength(1, 3)
    p = 42 as unknown as string;
  }
  it('rejects a value of the wrong type', () => {
    expect(validateSync(new Wrong4())).toHaveLength(1);
  });
});

describe('@IsFirebasePushId', () => {
  class C5_0 {
    @IsFirebasePushId()
    p = '-KVquJHACY3sMLBFHzWK';
  }
  it('accepts -KVquJHACY3sMLBFHzWK', () => {
    expect(validateSync(new C5_0())).toHaveLength(0);
  });

  class C5_1 {
    @IsFirebasePushId()
    p = 'abc';
  }
  it('rejects abc', () => {
    expect(keyOf(new C5_1())).toEqual(['IsFirebasePushId']);
  });

  class Wrong5 {
    @IsFirebasePushId()
    p = 42 as unknown as string;
  }
  it('rejects a value of the wrong type', () => {
    expect(validateSync(new Wrong5())).toHaveLength(1);
  });
});

describe('@IsFullWidth', () => {
  class C6_0 {
    @IsFullWidth()
    p = 'ひらがな';
  }
  it('accepts ひらがな', () => {
    expect(validateSync(new C6_0())).toHaveLength(0);
  });

  class C6_1 {
    @IsFullWidth()
    p = 'ａｂｃ';
  }
  it('accepts ａｂｃ', () => {
    expect(validateSync(new C6_1())).toHaveLength(0);
  });

  class C6_2 {
    @IsFullWidth()
    p = 'abc';
  }
  it('rejects abc', () => {
    expect(keyOf(new C6_2())).toEqual(['isFullWidth']);
  });

  class Wrong6 {
    @IsFullWidth()
    p = 42 as unknown as string;
  }
  it('rejects a value of the wrong type', () => {
    expect(validateSync(new Wrong6())).toHaveLength(1);
  });
});

describe('@IsHSL', () => {
  class C7_0 {
    @IsHSL()
    p = 'hsl(120,50%,50%)';
  }
  it('accepts hsl(120,50%,50%)', () => {
    expect(validateSync(new C7_0())).toHaveLength(0);
  });

  class C7_1 {
    @IsHSL()
    p = 'hsl(120, 50%, 50%)';
  }
  it('accepts hsl(120, 50%, 50%)', () => {
    expect(validateSync(new C7_1())).toHaveLength(0);
  });

  class C7_2 {
    @IsHSL()
    p = 'rgb(0,0,0)';
  }
  it('rejects rgb(0,0,0)', () => {
    expect(keyOf(new C7_2())).toEqual(['isHSL']);
  });

  class Wrong7 {
    @IsHSL()
    p = 42 as unknown as string;
  }
  it('rejects a value of the wrong type', () => {
    expect(validateSync(new Wrong7())).toHaveLength(1);
  });
});

describe('@IsHalfWidth', () => {
  class C8_0 {
    @IsHalfWidth()
    p = 'abc123';
  }
  it('accepts abc123', () => {
    expect(validateSync(new C8_0())).toHaveLength(0);
  });

  class C8_1 {
    @IsHalfWidth()
    p = 'ひらがな';
  }
  it('rejects ひらがな', () => {
    expect(keyOf(new C8_1())).toEqual(['isHalfWidth']);
  });

  class C8_2 {
    @IsHalfWidth()
    p = 'ａｂｃ';
  }
  it('rejects ａｂｃ', () => {
    expect(keyOf(new C8_2())).toEqual(['isHalfWidth']);
  });

  class Wrong8 {
    @IsHalfWidth()
    p = 42 as unknown as string;
  }
  it('rejects a value of the wrong type', () => {
    expect(validateSync(new Wrong8())).toHaveLength(1);
  });
});

describe('@IsHash', () => {
  class C9_0 {
    @IsHash('sha256')
    p = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  }
  it('accepts e3b0c44298fc1c149afbf4c8996fb92427ae41e4', () => {
    expect(validateSync(new C9_0())).toHaveLength(0);
  });

  class C9_1 {
    @IsHash('sha256')
    p = 'abc';
  }
  it('rejects abc', () => {
    expect(keyOf(new C9_1())).toEqual(['isHash']);
  });

  class Wrong9 {
    @IsHash('sha256')
    p = 42 as unknown as string;
  }
  it('rejects a value of the wrong type', () => {
    expect(validateSync(new Wrong9())).toHaveLength(1);
  });
});

describe('@IsHexadecimal', () => {
  class C10_0 {
    @IsHexadecimal()
    p = 'deadBEEF';
  }
  it('accepts deadBEEF', () => {
    expect(validateSync(new C10_0())).toHaveLength(0);
  });

  class C10_1 {
    @IsHexadecimal()
    p = '0xdeadbeef';
  }
  it('accepts 0xdeadbeef', () => {
    expect(validateSync(new C10_1())).toHaveLength(0);
  });

  class C10_2 {
    @IsHexadecimal()
    p = 'xyz';
  }
  it('rejects xyz', () => {
    expect(keyOf(new C10_2())).toEqual(['isHexadecimal']);
  });

  class Wrong10 {
    @IsHexadecimal()
    p = 42 as unknown as string;
  }
  it('rejects a value of the wrong type', () => {
    expect(validateSync(new Wrong10())).toHaveLength(1);
  });
});

describe('@IsISRC', () => {
  class C11_0 {
    @IsISRC()
    p = 'USAT29900609';
  }
  it('accepts USAT29900609', () => {
    expect(validateSync(new C11_0())).toHaveLength(0);
  });

  class C11_1 {
    @IsISRC()
    p = 'abc';
  }
  it('rejects abc', () => {
    expect(keyOf(new C11_1())).toEqual(['isISRC']);
  });

  class Wrong11 {
    @IsISRC()
    p = 42 as unknown as string;
  }
  it('rejects a value of the wrong type', () => {
    expect(validateSync(new Wrong11())).toHaveLength(1);
  });
});

describe('@IsISSN', () => {
  class C12_0 {
    @IsISSN()
    p = '0378-5955';
  }
  it('accepts 0378-5955', () => {
    expect(validateSync(new C12_0())).toHaveLength(0);
  });

  class C12_1 {
    @IsISSN()
    p = '03785955';
  }
  it('accepts 03785955', () => {
    expect(validateSync(new C12_1())).toHaveLength(0);
  });

  class C12_2 {
    @IsISSN()
    p = '0378-5954';
  }
  it('rejects 0378-5954', () => {
    expect(keyOf(new C12_2())).toEqual(['isISSN']);
  });

  class Wrong12 {
    @IsISSN()
    p = 42 as unknown as string;
  }
  it('rejects a value of the wrong type', () => {
    expect(validateSync(new Wrong12())).toHaveLength(1);
  });
});

describe('@IsMilitaryTime', () => {
  class C13_0 {
    @IsMilitaryTime()
    p = '23:59';
  }
  it('accepts 23:59', () => {
    expect(validateSync(new C13_0())).toHaveLength(0);
  });

  class C13_1 {
    @IsMilitaryTime()
    p = '00:00';
  }
  it('accepts 00:00', () => {
    expect(validateSync(new C13_1())).toHaveLength(0);
  });

  class C13_2 {
    @IsMilitaryTime()
    p = '24:00';
  }
  it('rejects 24:00', () => {
    expect(keyOf(new C13_2())).toEqual(['isMilitaryTime']);
  });

  class C13_3 {
    @IsMilitaryTime()
    p = '9:00';
  }
  it('rejects 9:00', () => {
    expect(keyOf(new C13_3())).toEqual(['isMilitaryTime']);
  });

  class Wrong13 {
    @IsMilitaryTime()
    p = 42 as unknown as string;
  }
  it('rejects a value of the wrong type', () => {
    expect(validateSync(new Wrong13())).toHaveLength(1);
  });
});

describe('@IsMultibyte', () => {
  class C14_0 {
    @IsMultibyte()
    p = 'ひらがな';
  }
  it('accepts ひらがな', () => {
    expect(validateSync(new C14_0())).toHaveLength(0);
  });

  class C14_1 {
    @IsMultibyte()
    p = 'abcひ';
  }
  it('accepts abcひ', () => {
    expect(validateSync(new C14_1())).toHaveLength(0);
  });

  class C14_2 {
    @IsMultibyte()
    p = 'abc';
  }
  it('rejects abc', () => {
    expect(keyOf(new C14_2())).toEqual(['isMultibyte']);
  });

  class Wrong14 {
    @IsMultibyte()
    p = 42 as unknown as string;
  }
  it('rejects a value of the wrong type', () => {
    expect(validateSync(new Wrong14())).toHaveLength(1);
  });
});

describe('@IsNumberString', () => {
  class C15_0 {
    @IsNumberString()
    p = '123';
  }
  it('accepts 123', () => {
    expect(validateSync(new C15_0())).toHaveLength(0);
  });

  class C15_1 {
    @IsNumberString()
    p = '12.5';
  }
  it('accepts 12.5', () => {
    expect(validateSync(new C15_1())).toHaveLength(0);
  });

  class C15_2 {
    @IsNumberString()
    p = '-3';
  }
  it('accepts -3', () => {
    expect(validateSync(new C15_2())).toHaveLength(0);
  });

  class C15_3 {
    @IsNumberString()
    p = 'abc';
  }
  it('rejects abc', () => {
    expect(keyOf(new C15_3())).toEqual(['isNumberString']);
  });

  class Wrong15 {
    @IsNumberString()
    p = 42 as unknown as string;
  }
  it('rejects a value of the wrong type', () => {
    expect(validateSync(new Wrong15())).toHaveLength(1);
  });
});

describe('@IsOctal', () => {
  class C16_0 {
    @IsOctal()
    p = '777';
  }
  it('accepts 777', () => {
    expect(validateSync(new C16_0())).toHaveLength(0);
  });

  class C16_1 {
    @IsOctal()
    p = '0o777';
  }
  it('accepts 0o777', () => {
    expect(validateSync(new C16_1())).toHaveLength(0);
  });

  class C16_2 {
    @IsOctal()
    p = '8';
  }
  it('rejects 8', () => {
    expect(keyOf(new C16_2())).toEqual(['isOctal']);
  });

  class C16_3 {
    @IsOctal()
    p = '0888';
  }
  it('rejects 0888', () => {
    expect(keyOf(new C16_3())).toEqual(['isOctal']);
  });

  class Wrong16 {
    @IsOctal()
    p = 42 as unknown as string;
  }
  it('rejects a value of the wrong type', () => {
    expect(validateSync(new Wrong16())).toHaveLength(1);
  });
});

describe('@IsRgbColor', () => {
  class C17_0 {
    @IsRgbColor()
    p = 'rgb(0,0,0)';
  }
  it('accepts rgb(0,0,0)', () => {
    expect(validateSync(new C17_0())).toHaveLength(0);
  });

  class C17_1 {
    @IsRgbColor()
    p = 'rgba(0,0,0,0.5)';
  }
  it('accepts rgba(0,0,0,0.5)', () => {
    expect(validateSync(new C17_1())).toHaveLength(0);
  });

  class C17_2 {
    @IsRgbColor()
    p = 'rgb(0, 0, 0)';
  }
  it('rejects rgb(0, 0, 0)', () => {
    expect(keyOf(new C17_2())).toEqual(['isRgbColor']);
  });

  class C17_3 {
    @IsRgbColor()
    p = 'hsl(0,0%,0%)';
  }
  it('rejects hsl(0,0%,0%)', () => {
    expect(keyOf(new C17_3())).toEqual(['isRgbColor']);
  });

  class C17_4 {
    @IsRgbColor()
    p = 'rgb(300,0,0)';
  }
  it('rejects rgb(300,0,0)', () => {
    expect(keyOf(new C17_4())).toEqual(['isRgbColor']);
  });

  class Wrong17 {
    @IsRgbColor()
    p = 42 as unknown as string;
  }
  it('rejects a value of the wrong type', () => {
    expect(validateSync(new Wrong17())).toHaveLength(1);
  });
});

describe('@IsSurrogatePair', () => {
  class C18_0 {
    @IsSurrogatePair()
    p = '\u{20BB7}野';
  }
  it('accepts \u{20BB7}野', () => {
    expect(validateSync(new C18_0())).toHaveLength(0);
  });

  class C18_1 {
    @IsSurrogatePair()
    p = 'abc';
  }
  it('rejects abc', () => {
    expect(keyOf(new C18_1())).toEqual(['isSurrogatePair']);
  });

  class Wrong18 {
    @IsSurrogatePair()
    p = 42 as unknown as string;
  }
  it('rejects a value of the wrong type', () => {
    expect(validateSync(new Wrong18())).toHaveLength(1);
  });
});

describe('@IsTaxId', () => {
  class C19_0 {
    @IsTaxId()
    p = '01-1234567';
  }
  it('accepts 01-1234567', () => {
    expect(validateSync(new C19_0())).toHaveLength(0);
  });

  class C19_1 {
    @IsTaxId()
    p = 'abc';
  }
  it('rejects abc', () => {
    expect(keyOf(new C19_1())).toEqual(['isTaxId']);
  });

  class Wrong19 {
    @IsTaxId()
    p = 42 as unknown as string;
  }
  it('rejects a value of the wrong type', () => {
    expect(validateSync(new Wrong19())).toHaveLength(1);
  });
});

describe('@IsVariableWidth', () => {
  class C20_0 {
    @IsVariableWidth()
    p = 'ひらがなabc';
  }
  it('accepts ひらがなabc', () => {
    expect(validateSync(new C20_0())).toHaveLength(0);
  });

  class C20_1 {
    @IsVariableWidth()
    p = 'abc';
  }
  it('rejects abc', () => {
    expect(keyOf(new C20_1())).toEqual(['isVariableWidth']);
  });

  class C20_2 {
    @IsVariableWidth()
    p = 'ひらがな';
  }
  it('rejects ひらがな', () => {
    expect(keyOf(new C20_2())).toEqual(['isVariableWidth']);
  });

  class Wrong20 {
    @IsVariableWidth()
    p = 42 as unknown as string;
  }
  it('rejects a value of the wrong type', () => {
    expect(validateSync(new Wrong20())).toHaveLength(1);
  });
});

describe('@IsByteLength with no maximum', () => {
  class OnlyMin {
    @IsByteLength(2)
    p = 'abc';
  }
  class TooShort {
    @IsByteLength(2)
    p = 'a';
  }

  it('accepts anything at or above the minimum', () => {
    expect(validateSync(new OnlyMin())).toHaveLength(0);
  });

  it('still rejects below the minimum', () => {
    expect(validateSync(new TooShort())).toHaveLength(1);
  });
});

describe('edge cases measured against upstream', () => {
  class EmptyAscii {
    @IsAscii()
    p = '';
  }
  class Exponent {
    @IsNumberString()
    p = '1e5';
  }

  it('rejects an empty string as ASCII, as upstream does', () => {
    expect(validateSync(new EmptyAscii())).toHaveLength(1);
  });

  it('rejects exponent notation as a number string, as upstream does', () => {
    expect(validateSync(new Exponent())).toHaveLength(1);
  });
});
