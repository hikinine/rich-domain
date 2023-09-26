import { Entity } from "../core";

/**
 * @description This decorator will ensure that the business rules will be applied only after the commit.
 * This will help in case your method has a lot of commits, and you want to apply the rules only after the last commit.
 * that means, if you update your entity X times in a method, the rules will be applied only after the method ends.
 */
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
