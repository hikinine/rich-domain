import { Entity } from "../core";

export function ApplyRulesOnlyAfterCommits() {
  return function (target: Entity<any>, __: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      let result: unknown;
      target['rulesIsLocked'] = true;

      try {
        result = await originalMethod.apply(this, args);
      } catch (error) {
        throw error
      }
      finally {
        target['rulesIsLocked'] = false
        target.ensureBusinessRules()
      }
   
      return result; 
    };

    return descriptor;
  };
}
