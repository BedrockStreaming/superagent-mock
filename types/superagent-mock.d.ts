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
    | {}
    | Array<{}>;

  export type Fixture = AnyValue;
  export type Response = Fixture;

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
      reqBody: {},
      headers: { [key: string]: string },
      context: Context
    ): Fixture | null | undefined;
  };

  export interface Log {
    matcher: string;
    mocked: boolean;
    url: string;
    method: Method;
    data: {};
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
