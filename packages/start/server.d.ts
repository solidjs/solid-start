declare const server: (<T>(fn: T) => T) & {
  getHandler: (path: string, index: number) => any;
  registerHandler: (path: string, index: number, handler: any) => any;
};

export default server;
