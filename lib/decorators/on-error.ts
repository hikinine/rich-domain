interface OnRepositoryError {
  handle(error: any): any;
}
export function OnError(handler: OnRepositoryError) {
  return function (_: any, __: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        return handler.handle(error);
      }
    };

    return descriptor;
  };
}
