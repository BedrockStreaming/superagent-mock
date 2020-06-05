declare module 'superagent-mock' {
  import superagent from 'superagent';

  export type Method = 'head' | 'get' | 'post' | 'put' | 'delete';

  export type AnyValue =
    | string
    | string[]
    | number
    | number[]
    | boolean
    | boolean[]
    | ObjectLiteral
    | ObjectLiteral[];

  interface ObjectLiteral {
    [key: string]: AnyValue;
    [key: number]: AnyValue;
  }

  export type RequestBody = ObjectLiteral;
  export type Response = Fixture | ObjectLiteral;
  export type Fixture = AnyValue;

  export interface Context {
    method: Method;
    cancel?: boolean;
    delay?: number;
    progress?: {
      parts: number;
      delay?: number;
      total?: number;
      lengthComputable?: boolean;
      direction?: 'upload' | string;
    };
  }

  type ParserMethods = {
    [key in Method]?: (
      match: RegExpExecArray,
      fixtures: ReturnType<Config['fixtures']>
    ) => Response;
  };

  export type Config = ParserMethods & {
    pattern: string;

    fixtures(
      match: RegExpExecArray,
      reqBody: RequestBody,
      headers: { [key: string]: string },
      context: Context
    ): Fixture | null | undefined;
  };

  export interface Log {
    matcher: string;
    mocked: boolean;
    url: string;
    method: Method;
    data: ObjectLiteral;
    headers: { [key: string]: string };
    timestamp: number;
  }

  export type Logger = (log: Log) => void;

  export interface TearDown {
    unset(): void;
  }

  function initialise(
    sa: typeof superagent,
    configs: Config[],
    logger?: Logger
  ): TearDown;

  export default initialise;
}
