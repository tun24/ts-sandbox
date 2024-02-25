/**
 * SQLの生成
 * @param sql 生成するSQL文
 * @returns SQL実行管理
 */
export function sql<T extends string>(sql: T): SqlManager<T> {
  return new SqlManager(sql);
}

/**
 * SQL実行管理。
 */
class SqlManager<T extends string> {

  /**
   * @constructor
   * @param sql SQL
   */
  constructor(private readonly sql: T) {
  }

  /**
   * SELECT文の実行。
   * @param param 埋め込みパラメータ
   * @returns 実行結果。
   */
  find(param: SqlParameters<T>): SqlSelectResult<T>[] {
    return [];
  }

  /**
   * SELECT文の実行（１件取得）。
   * @param param 埋め込みパラメータ
   * @returns 実行結果。
   */
  findOne(param: SqlParameters<T>): SqlSelectResult<T> {
    return {} as SqlSelectResult<T>;
  }
}

/**
 * SELECT文の実行結果。
 */
type SqlSelectResult<SQL extends string> =
  SanitaizedForSelectResult<SQL> extends infer S
  ? { [Field in (SqlSelectFields<MiddleString<S, ToUpperAndLowerCase<'SELECT'>, Pad<ToUpperAndLowerCase<'FROM'>, ' '>>>)[number]]: any }
  : never;

/**
 * SELECT文の実行結果に不要な内容を除去。
 */
type SanitaizedForSelectResult<SQL extends string> = SanitaizedSelectKeyWords<SanitaizedSub<SanitisedSql<SQL>>>;

/**
 * SELECT句に登場するキーワード（MySQL）。
 */
type SanitaizedSelectKeyWords<SQL> = SanitaizedKeywords<SQL, ['ALL', 'DISTINCT', 'DISTINCTROW', 'HIGH_PRIORITY', 'STRAIGHT_JOIN', 'SQL_SMALL_RESULT', 'SQL_BIG_RESULT', 'SQL_BUFFER_RESULT', 'SQL_NO_CACHE', 'SQL_CALC_FOUND_ROWS']>;

/**
 * SELECT句のフィールド。
 */
type SqlSelectFields<FIELDS> = [SqlFieldAlias<Separate<FIELDS>[number]>];

/**
 * SELECT句のフィールド名またはエイリアス名。
 */
type SqlFieldAlias<FIELD> = Trim<
  Trim<FIELD> extends `${infer F}`
  ? F extends `${infer _} ${ToUpperAndLowerCase<'AS'>} ${infer R}` ? R : RightString<F, '.' | ' ', F>
  : never
  , ' ' | '\''>;

/**
 * SQLパラメータ。
 */
type SqlParameters<SQL extends string> = Record<SqlParameterKeys<SanitisedSql<SQL>>, any>;

/**
 * SQLパラメータのキー名。
 */
type SqlParameterKeys<SQL> = SQL extends `${infer _}:${infer KEY} ${infer PART}` ? ExcludeChar<KEY, SqlParameterKeyChars> | SqlParameterKeys<PART> : never;

/**
 * SQLパラメータのキー名に使用可能な文字。
 */
type SqlParameterKeyChars = StringToChars<AlphabetChars | NumberChars | '_[]'>;

/**
 * SQLから不要な記述を削除。
 */
type SanitisedSql<SQL extends string> = `${SanitisedWhiteSpace<SanitisedBracket<SanitisedControlCode<SanitisedComment<SQL>>>>} `;

/**
 * コメントを削除。
 */
type SanitisedComment<SQL extends string> = SanitisedLineComment<SanitisedBlockComment<SQL>>;

/**
 * ブロックコメントを削除。
 */
type SanitisedBlockComment<SQL> = ReplaceBetween<SQL, '/*', '*/'>;

/**
 * 行コメントを削除。
 */
type SanitisedLineComment<SQL extends string> = ReplaceBetween<`${SQL}\n`, '--', '\n'>;

/**
 * 制御文字を削除。
 */
type SanitisedControlCode<SQL> = Replace<SQL, '\n' | '\t'>;

/**
 * カッコ文字の前後に半角空白を挿入。
 */
type SanitisedBracket<SQL> = Replace<Replace<SQL, '(', ' ( '>, ')', ' ) '>;

/**
 * 連続した空白を削除。
 */
type SanitisedWhiteSpace<SQL> = Replace<SQL, '  '>;

/**
 * サブクエリ部を削除。
 */
type SanitaizedSub<SQL> = ReplaceBetween<SQL, '(', ')'>;

/**
 * 指定キーワードを削除。
 */
type SanitaizedKeywords<SQL, KEYWORDS extends string[]> = ReplaceAll<SQL, Pad<ToUpperAndLowerCase<KEYWORDS>, ' '>>;

/**
 * 全てのアルファベット。
 */
type AlphabetChars = ToUpperAndLowerCase<'abcdefghijklmnopqrstuvwxyz'>;

/**
 * 全ての数字。
 */
type NumberChars = '0123456789';

/**
 * 指定文字列を置き換え。
 */
type Replace<TARGET, KEYWORD extends string, VALUE extends string = ' '> =
  _ReplaceInner<_ReplaceInner<TARGET, KEYWORD, _ReplaceDummy>, _ReplaceDummy, VALUE>;
type _ReplaceDummy = '!##!';
type _ReplaceInner<TARGET, KEYWORD extends string, VALUE extends string = ' '> =
  TARGET extends `${infer T1}${KEYWORD}${infer T2}`
  ? _ReplaceInner<`${T1}${VALUE}${T2}`, KEYWORD, VALUE>
  : TARGET;

/**
 * 指定文字列に挟まる文字列を置き換え。
 */
type ReplaceBetween<TARGET, PREFIX extends string, SUFFIX extends string, VALUE extends string = ' '> =
  _ReplaceInner<_ReplaceBetweenInner<TARGET, PREFIX, SUFFIX, _ReplaceDummy>, _ReplaceDummy, VALUE>;
type _ReplaceBetweenInner<TARGET, PREFIX extends string, SUFFIX extends string, VALUE extends string = ' '> =
  TARGET extends `${infer T1}${PREFIX}${infer _}${SUFFIX}${infer T2}`
  ? _ReplaceBetweenInner<`${T1}${VALUE}${T2}`, PREFIX, SUFFIX, VALUE>
  : TARGET;

/**
 * 指定文字列をすべて置き換え。
 */
type ReplaceAll<TARGET, KEYWORDS extends string[]> =
  KEYWORDS extends [infer KEYWORD extends string, ...infer RESTKEYWORDS extends string[]]
  ? ReplaceAll<Replace<TARGET, KEYWORD>, RESTKEYWORDS>
  : TARGET;

/**
 * 文字列を文字に分割。
 */
type StringToChars<S extends string> = S extends `${infer S1}${infer S2}` ? S1 | StringToChars<S2> : never;

/**
 * 大文字小文字の両方に変換。
 */
type ToUpperAndLowerCase<VALUES> =
  VALUES extends string ? Lowercase<VALUES> | Uppercase<VALUES>
  : VALUES extends [infer VALUE extends string, ...infer RESTVALUE extends string[]] ? [Uppercase<VALUE>, Lowercase<VALUE>, ...ToUpperAndLowerCase<RESTVALUE>]
  : [];

/**
 * 指定文字を除外。
 */
type ExcludeChar<TARGET, EXCLUDE, RESULT extends string = ''> =
  TARGET extends `${infer T1}${infer T2}`
  ? T1 extends EXCLUDE ? ExcludeChar<T2, EXCLUDE, `${RESULT}${T1}`> : ExcludeChar<T2, EXCLUDE, `${RESULT}`>
  : RESULT;

/**
 * 指定文字以前の文字列を取得。
 */
type LeftString<TARGET, KEYWORD extends string, DEFAULT = never> = TARGET extends `${infer LEFT}${KEYWORD}${infer _}` ? LEFT : DEFAULT;

/**
 * 指定文字以降の文字列を取得。
 */
type RightString<TARGET, KEYWORD extends string, DEFAULT = never> = TARGET extends `${infer _}${KEYWORD}${infer RIGHT}` ? RIGHT : DEFAULT;

/**
 * 指定文字列の間の文字列を取得。
 */
type MiddleString<TARGET, LEFT_KEYWORD extends string, RIGHT_KEYWORD extends string, DEFAULT = never> =
  RightString<TARGET, LEFT_KEYWORD, DEFAULT> extends infer R ? LeftString<R, RIGHT_KEYWORD, R> : never;

/**
 * 指定文字列の前後にある指定文字を削除。
 */
type Trim<TARGET, KEYWORD extends string = ' '> = TARGET extends `${KEYWORD}${infer R}` ? Trim<R, KEYWORD> : TARGET extends `${infer R}${KEYWORD}` ? Trim<R, KEYWORD> : TARGET;

/**
 * 指定文字で分割。
 */
type Separate<TARGET, SEPARATOR extends string = ','> = TARGET extends `${infer T1}${SEPARATOR}${infer T2}` ? [T1, ...Separate<T2, SEPARATOR>] : [TARGET];

/**
 * 指定文字を先頭文字と最終文字に追加。
 */
type Pad<TARGETS, HEAD extends string, TAIL extends string = HEAD> =
  TARGETS extends string ? `${HEAD}${TARGETS}${TAIL}`
  : TARGETS extends [infer TARGET extends string, ...infer RESTTARGETS extends string[]] ? [Pad<TARGET, HEAD, TAIL>, ...Pad<RESTTARGETS, HEAD, TAIL>]
  : [];
