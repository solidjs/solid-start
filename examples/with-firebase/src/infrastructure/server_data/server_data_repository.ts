import { doc, getDocs, query, setDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { IServerDataRepository } from "~/domain/server_data/i_server_data_repository";
import { serverDataCollectionRef } from "~/utils/firebaseConfig";

export const firebaseServerDataRepository: IServerDataRepository = {
  getServerDatas: async () => {
    const queryDoc = await query(serverDataCollectionRef);
    const querySnap = await getDocs(queryDoc);
    const docsData = querySnap.docs.map((doc) => doc.data());

    return docsData;
  },

  writeServerData: async (serverData) => {
    await setDoc(doc(serverDataCollectionRef, uuidv4()), serverData);
  },
};
