import { IServerDataRepository } from "~/domain/server_data/i_server_data_repository";
import { firebaseServerDataRepository } from "~/infrastructure/server_data/server_data_repository";

const repo: IServerDataRepository = firebaseServerDataRepository;

export default {
  async getServerDatas() {
    try {
      const serverDatas = await repo.getServerDatas();
      return serverDatas;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  async writeServerData(serverData) {
    try {
      await repo.writeServerData(serverData);
    } catch (error) {
      throw new Error(error.message);
    }
  },
};
