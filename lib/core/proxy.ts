export  const proxyHandler = function <Props extends object>(self: any, keyProp?: string): ProxyHandler<Props> {
  return {
    get: function (target, prop: string) {
      const val = Reflect.get(target, prop);
      if (typeof val === 'function') {
        if (['push', 'pop', 'shift', 'unshift', 'slice'].includes(prop)) {
          return function (...args: any[]) {
            self.metaHistory.addSnapshot({
              props: self.props,
              trace: {
                update: keyProp!,
                action: prop
              }
            });

            return Array.prototype[prop].apply(target, args);
          };
        }
      }
      if (
        //should refactor. typeof object && !== null doesnt work somehow
        ['[object Object]', '[object Array]'].indexOf(
          Object.prototype.toString.call(target[prop]),
        ) > -1
      ) {
        return new Proxy(target[prop], proxyHandler(self, prop as string));
      }
      return Reflect.get(target, prop);
    },

    set: function (target, prop, value, receiver) {
      const oldValue = Reflect.get(target, prop, receiver);
      if (!Array.isArray(receiver)) {
        self.metaHistory.addSnapshot({
          props: self.props,
          trace: {
            update: prop as string,
            from: oldValue,
            to: value,
          }
        });
      }
      Reflect.set(target, prop, value, receiver);
      return true;
    },
  };
};
