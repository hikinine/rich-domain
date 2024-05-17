import { EntityProps, IEntity } from "./types";

export const mutationArrayMethods = [
  'push',
  'pop',
  'shift',
  'unshift',
  'slice',
  'fill',
  'copyWithin',
  'splice',
  'reverse'
]

export const proxyHandler = function <Props extends object>(self: IEntity<EntityProps>, keyProp: string[] = []): ProxyHandler<Props> {
  return { 
    get: function (target, prop: string, receiver) {
      if (Array.isArray(target[prop])) { 
        return new Proxy(target[prop], proxyHandler(self, [...(keyProp || []), prop]));
      }

      const accessor = Reflect.get(target, prop, receiver);
 
      if (typeof accessor === 'function' && mutationArrayMethods.includes(prop)) {
        self.history?.addSnapshot({
          props: self['props'],
          trace: {
            updatedAt: new Date(),
            update: keyProp?.join(".")!,
            action: prop
          }
        });
      } 

      return accessor
    },

    set: function (target, prop, value, receiver) {
      const oldValue = Reflect.get(target, prop, receiver);
      Reflect.set(target, prop, value, receiver);
      if (!Array.isArray(receiver)) {
        let prefix = keyProp?.join?.(".");
        if (prefix) prefix += ".";
        self?.history?.addSnapshot({
          props: self['props'],
          trace: {
            updatedAt: new Date(),
            update: prefix + prop?.toString(),
            from: oldValue,
            to: value,
          }
        });
      } 
      /**
       *      else  { 
        let prefix = keyProp?.join?.(".");
        if (prefix) prefix += ".";
        console.log('position', prop)
        self?.history?.addSnapshot({
          props: self['props'],
          trace: {
            updatedAt: new Date(),
            update: prefix + prop?.toString(),
            from: oldValue,
            to: value,
            position: Number(prop)
          }
        });

      }
       */
      
      return true;
    },
  };
};
