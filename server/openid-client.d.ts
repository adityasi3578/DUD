declare module 'openid-client' {
  export const Issuer: any;
  export const TokenSet: any;
  export type TokenSet = any;
  export const generators: any;
}

declare module 'openid-client/lib/passport' {
  export class Strategy {
    constructor(options: any, verify: any);
  }
  export type VerifyCallback = any;
}
