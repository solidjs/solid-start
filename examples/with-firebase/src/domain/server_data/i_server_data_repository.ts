import { ServerData } from "~/domain/server_data/server_data";

export type IServerDataRepository = {
  getServerDatas: () => Promise<ServerData[]>;
  writeServerData: (serverData: ServerData) => Promise<void>;
};
