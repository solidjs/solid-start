export const getCounter = async () => {
  await new Promise(resolve => {
    setTimeout(() => {
      resolve(1);
    }, 3000);
  });
  console.log("heree done");
  return 1;
};
