interface Kwargs<T = unknown> {
  [keyword: string]: T
}

type KeywordObject<K extends Kwargs> = { __keywords: true } & K

export default function parse<
  A extends string[] = string[],
  K extends Kwargs<string> | void = void
>(argString: string): K extends Kwargs ? [...A, KeywordObject<K>] : A

export default function parse<
  A extends unknown[] = unknown[],
  K extends Kwargs | void = void
>(
  argString: string,
  evalFunction: (arg: string) => unknown
): K extends Kwargs ? [...A, KeywordObject<K>] : A
