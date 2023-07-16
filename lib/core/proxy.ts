const prototypeMethodsThatShouldListener = [
  'push',
  'pop',
  'shift',
  'unshift',
  'slice'
]

export const proxyHandler = function <Props extends object>(self: any, keyProp: string[] = []): ProxyHandler<Props> {
  return {
    get: function (target, prop: string) {
      const val = Reflect.get(target, prop);
      if (typeof val === 'function') {
        if (prototypeMethodsThatShouldListener.includes(prop)) {
          return function (...args: unknown[]) {
            const result = Array.prototype[prop].apply(target, args);
            self.metaHistory.addSnapshot({
              props: self.props,
              trace: {
                update: keyProp?.join(".")!,
                action: prop
              }
            });

            return result
          };
        }
      }
      if (
        //should refactor. typeof object && !== null doesnt work somehow
        ['[object Object]', '[object Array]'].indexOf(
          Object.prototype.toString.call(target[prop]),
        ) > -1
      ) {
        return new Proxy(target[prop], proxyHandler(self, [...(keyProp || []), prop]));
      }

      return Reflect.get(target, prop);
    },

    set: function (target, prop, value, receiver) {
      const oldValue = Reflect.get(target, prop, receiver);
      Reflect.set(target, prop, value, receiver);
      if (!Array.isArray(receiver)) {
        let prefix = keyProp?.join?.(".");
        if (prefix) prefix += ".";

        self.metaHistory.addSnapshot({
          props: self.props,
          trace: {
            update: prefix + (prop as string),
            from: oldValue,
            to: value,
          }
        });
      }

      return true;
    },
  };
};
