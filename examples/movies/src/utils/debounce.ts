export const debounce = function (func, delay, ...args) {
  let timeoutID;

  return function () {
    clearTimeout(timeoutID);

    const that = this;

    timeoutID = setTimeout(function () {
      func.apply(that, args);
    }, delay);
  };
};
