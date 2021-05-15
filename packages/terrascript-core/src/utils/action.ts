import { IAction } from '../interfaces/spec';

/**
 * @param action
 */
export function shouldRunAction(action: IAction): boolean {
  if (action === undefined) {
    return false;
  }
  if (Array.isArray(action)) {
    return action.length > 0;
  }
  return true;
}
