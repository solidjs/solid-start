if (!process) {
  globalThis.process = {
    env: Netlify.env.toObject()
  };
}
