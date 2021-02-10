import _ from 'lodash';
import { Command, CommandOptions } from '../command/command';
import { IContext } from '../interfaces/context';
import { expandTemplate } from '../template/template';
import { Hash } from '../interfaces/types';

export class Expand {
    /**
     * @param context
     * @param command
     */
    static async expandAndRunCommand(context: IContext, command: Command) {
        const expandedCommand = Expand.command(context, command);
        return expandedCommand.run();
    }

    /**
     * @param context
     * @param command
     */
    private static command(context: IContext, command: Command): Command {
        const commandString = command.toString().toString();
        const expandedCommandString = expandTemplate(context, commandString);
        const expandedCommandOptions = Expand.options(context, command.options);
        const expandedCommand = Command.fromString(expandedCommandString, expandedCommandOptions);
        return expandedCommand;
    }

    private static options(context: IContext, options: CommandOptions): CommandOptions {
        const clone = _.cloneDeep(options);
        return Expand.hash(context, clone);
    }

    private static hash(context: IContext, obj: any): any {
        if (_.isString(obj)) {
            return expandTemplate(context, obj);
        }
        if (_.isObject(obj) && !_.isFunction(obj) && !_.isArray(obj) && !_.isUndefined(obj)) {
            const clone = _.cloneDeep(obj) as Hash<any>;
            for (const key of Object.keys(clone)) {
                clone[key] = Expand.hash(context, clone[key]);
            }
            return clone;
        }
        return obj;
    }
}
