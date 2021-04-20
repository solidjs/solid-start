export default function serverScripts() {
  const scripts = [];
  return {
    add(fn) {
      scripts.push(fn);
    },
    get() {
      scripts.map(fn => fn()).join("");
    }
  };
}
