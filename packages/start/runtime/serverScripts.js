export default function serverScripts() {
  const scripts = [];
  return {
    add(fn) {
      scripts.push(fn);
    },
    get() {
      return scripts.map(fn => fn()).join("");
    }
  };
}
