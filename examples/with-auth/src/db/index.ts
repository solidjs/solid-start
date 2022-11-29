let users = [{ id: 0, username: "kody", password: "twixrox" }];
export const db = {
  user: {
    async create({ data }: { data: { username: string; password: string } }) {
      let user = { ...data, id: users.length };
      users.push(user);
      return user;
    },
    async findUnique({ where: { username = undefined, id = undefined } }: { where: { username?: string; id?: number } }) {
      if (id !== undefined) {
        return users.find(user => user.id === id);
      } else {
        return users.find(user => user.username === username);
      }
    }
  }
};
