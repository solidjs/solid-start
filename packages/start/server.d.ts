declare const server: (<T>(fn: T) => T) & {
  getHandler: (hash: string) => any;
  registerHandler: (hash: string, handler: any) => any;
};

export default server;
